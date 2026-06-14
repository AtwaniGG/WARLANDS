// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ISinkRouter {
    /// @notice Route `amount` of $WAR (pulled from the caller) into burn/pool/tax.
    function route(uint256 amount, uint16 sinkType) external;
}
