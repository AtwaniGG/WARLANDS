// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal Foundry cheatcode interface — avoids a forge-std dependency so this
///         repo compiles & tests with zero `forge install` steps. Swap for forge-std in CI.
interface Vm {
    function prank(address) external;
    function startPrank(address) external;
    function stopPrank() external;
    function expectRevert() external;
    function expectRevert(bytes4 selector) external;
    function warp(uint256) external;
    function label(address, string calldata) external;
}

/// @notice Tiny test base: assertions revert on failure (forge marks the test failed),
///         and `vm` exposes cheatcodes at the canonical address.
contract MiniTest {
    Vm internal constant vm = Vm(0x7109709ECfa91a80626fF3989D68f67F5b1DD12D);

    function assertTrue(bool cond, string memory why) internal pure {
        require(cond, why);
    }

    function assertEq(uint256 a, uint256 b, string memory why) internal pure {
        require(a == b, why);
    }

    function assertEq(address a, address b, string memory why) internal pure {
        require(a == b, why);
    }
}
