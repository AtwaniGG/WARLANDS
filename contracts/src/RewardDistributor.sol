// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./interfaces/IERC20.sol";
import {IRewardDistributor} from "./interfaces/IRewardDistributor.sol";
import {Ownable} from "./lib/Ownable.sol";
import {ReentrancyGuard} from "./lib/ReentrancyGuard.sol";
import {MerkleProof} from "./lib/MerkleProof.sol";

/// @title RewardDistributor — GDD §12.2, §14, §20
/// @notice Pull-based, Merkle-drop reward claims for each season. Enforces the protocol's
///         core sustainability invariant:
///
///                 Σ rewards claimed  ≤  Σ sinks routed to the pool
///
///         The distributor has NO minting power. It can only pay out $WAR that the
///         SinkRouter already funded. A season's claim cap can never exceed the funded,
///         unallocated pool, so payouts are structurally bounded by real sinks.
contract RewardDistributor is IRewardDistributor, Ownable, ReentrancyGuard {
    IERC20 public immutable war;
    address public funder; // the SinkRouter

    uint256 public totalFunded; // lifetime $WAR added to the pool by sinks
    uint256 public totalAllocated; // sum of season caps committed to Merkle roots
    uint256 public totalClaimed; // lifetime $WAR claimed by players

    struct Season {
        bytes32 root;
        uint256 cap; // max claimable for this season
        uint256 claimed; // claimed so far this season
    }

    mapping(uint256 => Season) public seasons; // seasonId => Season
    mapping(uint256 => mapping(address => bool)) public hasClaimed; // seasonId => account => claimed

    event Funded(uint256 amount, uint256 totalFunded);
    event SeasonOpened(uint256 indexed seasonId, bytes32 root, uint256 cap);
    event Claimed(uint256 indexed seasonId, address indexed account, uint256 amount);
    event FunderUpdated(address funder);

    error NotFunder();
    error CapExceedsPool();
    error SeasonExists();
    error AlreadyClaimed();
    error BadProof();
    error SeasonClaimCapHit();
    error InvariantBroken();

    constructor(address owner_, IERC20 war_) Ownable(owner_) {
        war = war_;
    }

    function setFunder(address funder_) external onlyOwner {
        funder = funder_;
        emit FunderUpdated(funder_);
    }

    /// @inheritdoc IRewardDistributor
    /// @dev Tokens are transferred in by the SinkRouter immediately before this call.
    function fund(uint256 amount) external {
        if (msg.sender != funder) revert NotFunder();
        totalFunded += amount;
        emit Funded(amount, totalFunded);
    }

    /// @notice Owner commits a season's Merkle root. The cap can never exceed the funded,
    ///         still-unallocated pool — this is the §12.2 invariant at allocation time.
    function openSeason(uint256 seasonId, bytes32 root, uint256 cap) external onlyOwner {
        if (seasons[seasonId].root != bytes32(0)) revert SeasonExists();
        // available pool = funded - already allocated to prior seasons
        if (totalAllocated + cap > totalFunded) revert CapExceedsPool();
        seasons[seasonId] = Season({root: root, cap: cap, claimed: 0});
        totalAllocated += cap;
        emit SeasonOpened(seasonId, root, cap);
    }

    /// @notice Claim `amount` for `seasonId` using a Merkle proof of leaf = keccak256(account, amount).
    function claim(uint256 seasonId, uint256 amount, bytes32[] calldata proof) external nonReentrant {
        Season storage s = seasons[seasonId];
        if (hasClaimed[seasonId][msg.sender]) revert AlreadyClaimed();

        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender, amount))));
        if (!MerkleProof.verify(proof, s.root, leaf)) revert BadProof();

        if (s.claimed + amount > s.cap) revert SeasonClaimCapHit();
        // hard global invariant: never pay out more than was ever funded by sinks
        if (totalClaimed + amount > totalFunded) revert InvariantBroken();

        hasClaimed[seasonId][msg.sender] = true;
        s.claimed += amount;
        totalClaimed += amount;

        require(war.transfer(msg.sender, amount), "reward transfer failed");
        emit Claimed(seasonId, msg.sender, amount);
    }

    /// @notice Pool funded by sinks but not yet committed to any season.
    function unallocatedPool() external view returns (uint256) {
        return totalFunded - totalAllocated;
    }
}
