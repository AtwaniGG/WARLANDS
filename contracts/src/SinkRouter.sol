// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20Burnable} from "./interfaces/IERC20.sol";
import {IRewardDistributor} from "./interfaces/IRewardDistributor.sol";
import {Ownable} from "./lib/Ownable.sol";
import {ReentrancyGuard} from "./lib/ReentrancyGuard.sol";

/// @title SinkRouter — GDD §12.3, §13, §20
/// @notice Single entrypoint that every $WAR sink (fees, upkeep, speed-ups, etc.) flows
///         through. Splits each sink into: BURN (deflation) / POOL (season rewards) / TAX
///         (Allegiance-region income). A governance-bounded BURN FLOOR guarantees structural
///         deflation — burn share can never be set below the floor.
contract SinkRouter is Ownable, ReentrancyGuard {
    IERC20Burnable public immutable war;
    IRewardDistributor public rewardDistributor;
    address public taxReceiver;

    uint16 public constant BPS = 10_000;
    uint16 public constant BURN_FLOOR_BPS = 2_000; // §12.2: burn >= 20%, immutable floor

    uint16 public burnBps = 4_000;
    uint16 public poolBps = 4_000;
    uint16 public taxBps = 2_000;

    // lifetime accounting for transparency / off-chain reconciliation
    uint256 public totalBurned;
    uint256 public totalToPool;
    uint256 public totalToTax;

    event SinkRouted(address indexed payer, uint16 indexed sinkType, uint256 amount, uint256 burned, uint256 toPool, uint256 toTax);
    event SharesUpdated(uint16 burnBps, uint16 poolBps, uint16 taxBps);
    event ConfigUpdated(address rewardDistributor, address taxReceiver);

    error BadShares();
    error BurnBelowFloor();
    error NotConfigured();

    constructor(address owner_, IERC20Burnable war_, address taxReceiver_) Ownable(owner_) {
        war = war_;
        taxReceiver = taxReceiver_;
    }

    function setConfig(IRewardDistributor distributor_, address taxReceiver_) external onlyOwner {
        rewardDistributor = distributor_;
        taxReceiver = taxReceiver_;
        emit ConfigUpdated(address(distributor_), taxReceiver_);
    }

    /// @notice Update the split. Enforces sum == 100% and burn >= floor (§16 guardrail).
    function setShares(uint16 burnBps_, uint16 poolBps_, uint16 taxBps_) external onlyOwner {
        if (uint256(burnBps_) + poolBps_ + taxBps_ != BPS) revert BadShares();
        if (burnBps_ < BURN_FLOOR_BPS) revert BurnBelowFloor();
        burnBps = burnBps_;
        poolBps = poolBps_;
        taxBps = taxBps_;
        emit SharesUpdated(burnBps_, poolBps_, taxBps_);
    }

    /// @notice Route `amount` of $WAR from the caller into the sink split.
    /// @dev Caller (game backend or another contract) must approve this router first.
    function route(uint256 amount, uint16 sinkType) external nonReentrant {
        if (address(rewardDistributor) == address(0) || taxReceiver == address(0)) revert NotConfigured();

        // pull the full sink into this contract
        require(war.transferFrom(msg.sender, address(this), amount), "transferFrom failed");

        uint256 burnAmt = (amount * burnBps) / BPS;
        uint256 taxAmt = (amount * taxBps) / BPS;
        uint256 poolAmt = amount - burnAmt - taxAmt; // remainder to pool (avoids dust loss)

        if (burnAmt > 0) war.burn(burnAmt);
        if (taxAmt > 0) require(war.transfer(taxReceiver, taxAmt), "tax transfer failed");
        if (poolAmt > 0) {
            require(war.transfer(address(rewardDistributor), poolAmt), "pool transfer failed");
            rewardDistributor.fund(poolAmt);
        }

        totalBurned += burnAmt;
        totalToPool += poolAmt;
        totalToTax += taxAmt;

        emit SinkRouted(msg.sender, sinkType, amount, burnAmt, poolAmt, taxAmt);
    }
}
