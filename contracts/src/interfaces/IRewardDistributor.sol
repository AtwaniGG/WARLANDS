// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IRewardDistributor {
    /// @notice Notify the distributor that `amount` of $WAR was added to the reward pool.
    ///         Tokens must already have been transferred to the distributor.
    function fund(uint256 amount) external;
}
