// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./interfaces/IERC20.sol";
import {ISinkRouter} from "./interfaces/ISinkRouter.sol";
import {Ownable} from "./lib/Ownable.sol";
import {ReentrancyGuard} from "./lib/ReentrancyGuard.sol";
import {PlotTypes} from "./PlotTypes.sol";

/// @title StakingManager — GDD §4, §4.1, §20
/// @notice Players LOCK $WAR to secure land plots. The stake is never spent and is the
///         right to occupy a plot — not loot.
///
///         CORE INVARIANT (principal safety): a player's staked principal can only ever be
///         returned to that same player. Conquest by another player transfers the *right to
///         stake* the plot (it becomes claimable again) and credits the loser a full refund
///         of their principal. No code path sends one player's principal to another player.
contract StakingManager is Ownable, ReentrancyGuard {
    enum Status {
        Unclaimed,
        Active,
        Unbonding
    }

    struct PlotStake {
        address staker;
        uint8 plotType;
        Status status;
        uint64 unbondAt;
        uint256 amount;
    }

    IERC20 public immutable war;
    ISinkRouter public sinkRouter;
    address public gameServer; // authorized to resolve conquest (server-authoritative sim)

    uint64 public constant UNBOND_PERIOD = 7 days; // §4.1
    uint16 public constant EARLY_UNSTAKE_FEE_BPS = 300; // 3% sink on *voluntary* unstake (§13 #4)
    uint16 public constant BPS = 10_000;
    uint16 public constant SINK_TYPE_EARLY_UNSTAKE = 4;

    mapping(uint256 => PlotStake) public plots; // plotId => stake
    mapping(address => uint256) public refunds; // principal owed back to a conquered staker

    uint256 public totalStaked;

    event Staked(uint256 indexed plotId, address indexed staker, uint8 plotType, uint256 amount);
    event UnstakeRequested(uint256 indexed plotId, address indexed staker, uint64 unbondAt);
    event Withdrawn(uint256 indexed plotId, address indexed staker, uint256 returned, uint256 fee);
    event Conquered(uint256 indexed plotId, address indexed previousStaker, uint256 refundCredited);
    event RefundClaimed(address indexed staker, uint256 amount);
    event GameServerUpdated(address gameServer);

    error PlotNotAvailable();
    error PlotNotActive();
    error NotStaker();
    error StillUnbonding();
    error NotUnbonding();
    error NotGameServer();
    error NothingToRefund();

    constructor(address owner_, IERC20 war_, ISinkRouter sinkRouter_) Ownable(owner_) {
        war = war_;
        sinkRouter = sinkRouter_;
    }

    function setSinkRouter(ISinkRouter sinkRouter_) external onlyOwner {
        sinkRouter = sinkRouter_;
    }

    function setGameServer(address gameServer_) external onlyOwner {
        gameServer = gameServer_;
        emit GameServerUpdated(gameServer_);
    }

    /// @notice Lock the required stake for `plotType` to secure plot `plotId`.
    function stakeForPlot(uint256 plotId, uint8 plotType) external nonReentrant {
        PlotStake storage p = plots[plotId];
        if (p.status != Status.Unclaimed) revert PlotNotAvailable();

        uint256 amount = PlotTypes.stakeOf(plotType);
        require(war.transferFrom(msg.sender, address(this), amount), "stake transfer failed");

        p.staker = msg.sender;
        p.plotType = plotType;
        p.status = Status.Active;
        p.unbondAt = 0;
        p.amount = amount;
        totalStaked += amount;

        emit Staked(plotId, msg.sender, plotType, amount);
    }

    /// @notice Begin the unbonding cooldown. The plot keeps decaying off-chain (§4.1) but
    ///         cannot be withdrawn until the period elapses — prevents rug-pulling a plot
    ///         that is under siege.
    function requestUnstake(uint256 plotId) external {
        PlotStake storage p = plots[plotId];
        if (p.staker != msg.sender) revert NotStaker();
        if (p.status != Status.Active) revert PlotNotActive();
        p.status = Status.Unbonding;
        p.unbondAt = uint64(block.timestamp) + UNBOND_PERIOD;
        emit UnstakeRequested(plotId, msg.sender, p.unbondAt);
    }

    /// @notice After unbonding, return principal minus the early-unstake fee (a sink).
    function withdraw(uint256 plotId) external nonReentrant {
        PlotStake storage p = plots[plotId];
        if (p.staker != msg.sender) revert NotStaker();
        if (p.status != Status.Unbonding) revert NotUnbonding();
        if (block.timestamp < p.unbondAt) revert StillUnbonding();

        uint256 amount = p.amount;
        uint256 fee = (amount * EARLY_UNSTAKE_FEE_BPS) / BPS;
        uint256 ret = amount - fee;

        // clear the plot back to Unclaimed before external calls (CEI)
        _clear(p);
        totalStaked -= amount;

        // route the fee through the SinkRouter (burn/pool/tax) — it is a protocol sink,
        // never given to another player.
        if (fee > 0 && address(sinkRouter) != address(0)) {
            require(war.approve(address(sinkRouter), fee), "approve failed");
            sinkRouter.route(fee, SINK_TYPE_EARLY_UNSTAKE);
        } else {
            ret = amount; // no router configured -> return full principal
        }

        require(war.transfer(msg.sender, ret), "return transfer failed");
        emit Withdrawn(plotId, msg.sender, ret, fee);
    }

    /// @notice Server-authoritative conquest resolution. The plot becomes claimable again
    ///         and the *previous staker is credited a FULL principal refund* (no fee — this
    ///         is involuntary). The winner re-stakes via stakeForPlot. Principal is never
    ///         transferred to the conqueror.
    function conquer(uint256 plotId) external {
        if (msg.sender != gameServer) revert NotGameServer();
        PlotStake storage p = plots[plotId];
        if (p.status == Status.Unclaimed) revert PlotNotActive();

        address loser = p.staker;
        uint256 amount = p.amount;

        _clear(p);
        totalStaked -= amount;
        refunds[loser] += amount;

        emit Conquered(plotId, loser, amount);
    }

    /// @notice Withdraw principal credited by a conquest. Always full principal, no fee.
    function claimRefund() external nonReentrant {
        uint256 amount = refunds[msg.sender];
        if (amount == 0) revert NothingToRefund();
        refunds[msg.sender] = 0;
        require(war.transfer(msg.sender, amount), "refund transfer failed");
        emit RefundClaimed(msg.sender, amount);
    }

    // --- views ---

    function plotStatus(uint256 plotId) external view returns (Status) {
        return plots[plotId].status;
    }

    function stakerOf(uint256 plotId) external view returns (address) {
        return plots[plotId].staker;
    }

    // --- internal ---

    function _clear(PlotStake storage p) internal {
        p.staker = address(0);
        p.plotType = 0;
        p.status = Status.Unclaimed;
        p.unbondAt = 0;
        p.amount = 0;
    }
}
