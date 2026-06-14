// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./interfaces/IERC20.sol";
import {ReentrancyGuard} from "./lib/ReentrancyGuard.sol";

/// @title AllegianceTreasury — GDD §10.4, §11.5
/// @notice A per-Allegiance $WAR treasury. Members deposit freely; withdrawals require an
///         officer quorum (multisig) AND a timelock, so a single signer can't drain it and
///         members have a window to react (anti-capture, §11.5).
contract AllegianceTreasury is ReentrancyGuard {
    IERC20 public immutable war;

    mapping(address => bool) public isOfficer;
    uint256 public officerCount;
    uint256 public quorum; // approvals required to execute a withdrawal
    uint64 public timelock; // delay before an approved withdrawal can execute

    struct Withdrawal {
        address to;
        uint256 amount;
        uint64 executeAfter;
        uint32 approvals;
        bool executed;
    }

    uint256 public withdrawalCount;
    mapping(uint256 => Withdrawal) public withdrawals;
    mapping(uint256 => mapping(address => bool)) public approved;

    event Deposited(address indexed from, uint256 amount);
    event WithdrawalProposed(uint256 indexed id, address indexed to, uint256 amount, uint64 executeAfter);
    event WithdrawalApproved(uint256 indexed id, address indexed officer, uint32 approvals);
    event WithdrawalExecuted(uint256 indexed id, address indexed to, uint256 amount);
    event OfficerChanged(address indexed officer, bool isOfficer);

    error NotOfficer();
    error BadQuorum();
    error AlreadyApproved();
    error AlreadyExecuted();
    error QuorumNotMet();
    error TimelockNotElapsed();
    error TransferFailed();

    modifier onlyOfficer() {
        if (!isOfficer[msg.sender]) revert NotOfficer();
        _;
    }

    constructor(IERC20 war_, address[] memory officers_, uint256 quorum_, uint64 timelock_) {
        war = war_;
        for (uint256 i = 0; i < officers_.length; i++) {
            if (!isOfficer[officers_[i]]) {
                isOfficer[officers_[i]] = true;
                officerCount++;
                emit OfficerChanged(officers_[i], true);
            }
        }
        if (quorum_ == 0 || quorum_ > officerCount) revert BadQuorum();
        quorum = quorum_;
        timelock = timelock_;
    }

    /// @notice Anyone (members) can contribute $WAR to the treasury. Requires prior approve().
    function deposit(uint256 amount) external nonReentrant {
        if (!war.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        emit Deposited(msg.sender, amount);
    }

    /// @notice Officer proposes a withdrawal; counts as their first approval.
    function proposeWithdrawal(address to, uint256 amount) external onlyOfficer returns (uint256 id) {
        id = ++withdrawalCount;
        Withdrawal storage w = withdrawals[id];
        w.to = to;
        w.amount = amount;
        w.executeAfter = uint64(block.timestamp) + timelock;
        w.approvals = 1;
        approved[id][msg.sender] = true;
        emit WithdrawalProposed(id, to, amount, w.executeAfter);
        emit WithdrawalApproved(id, msg.sender, 1);
    }

    /// @notice Additional officers approve a pending withdrawal.
    function approveWithdrawal(uint256 id) external onlyOfficer {
        Withdrawal storage w = withdrawals[id];
        if (w.executed) revert AlreadyExecuted();
        if (approved[id][msg.sender]) revert AlreadyApproved();
        approved[id][msg.sender] = true;
        w.approvals += 1;
        emit WithdrawalApproved(id, msg.sender, w.approvals);
    }

    /// @notice Execute once quorum is met AND the timelock has elapsed.
    function executeWithdrawal(uint256 id) external nonReentrant onlyOfficer {
        Withdrawal storage w = withdrawals[id];
        if (w.executed) revert AlreadyExecuted();
        if (w.approvals < quorum) revert QuorumNotMet();
        if (block.timestamp < w.executeAfter) revert TimelockNotElapsed();
        w.executed = true;
        if (!war.transfer(w.to, w.amount)) revert TransferFailed();
        emit WithdrawalExecuted(id, w.to, w.amount);
    }
}
