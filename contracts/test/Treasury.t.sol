// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {MiniTest} from "./utils/Vm.sol";
import {WarToken} from "../src/WarToken.sol";
import {AllegianceTreasury} from "../src/AllegianceTreasury.sol";
import {IERC20} from "../src/interfaces/IERC20.sol";

contract TreasuryTest is MiniTest {
    WarToken war;
    AllegianceTreasury treasury;

    address o1 = address(0x01);
    address o2 = address(0x02);
    address o3 = address(0x03);
    address dest = address(0xDE57);

    function setUp() public {
        war = new WarToken(address(this), 1_000_000e18);
        address[] memory officers = new address[](3);
        officers[0] = o1;
        officers[1] = o2;
        officers[2] = o3;
        treasury = new AllegianceTreasury(war, officers, 2, 1 days); // quorum 2, 1-day timelock

        // seed treasury with a member deposit
        war.approve(address(treasury), 50_000e18);
        treasury.deposit(50_000e18);
    }

    function testWithdrawalNeedsQuorumAndTimelock() public {
        vm.prank(o1);
        uint256 id = treasury.proposeWithdrawal(dest, 10_000e18);

        // only 1 approval so far -> quorum not met
        vm.prank(o1);
        vm.expectRevert(AllegianceTreasury.QuorumNotMet.selector);
        treasury.executeWithdrawal(id);

        // second officer approves -> quorum met, but timelock not elapsed
        vm.prank(o2);
        treasury.approveWithdrawal(id);
        vm.prank(o2);
        vm.expectRevert(AllegianceTreasury.TimelockNotElapsed.selector);
        treasury.executeWithdrawal(id);

        // after timelock -> executes
        vm.warp(block.timestamp + 1 days);
        vm.prank(o2);
        treasury.executeWithdrawal(id);
        assertEq(war.balanceOf(dest), 10_000e18, "withdrawal not executed");
    }

    function testNonOfficerCannotPropose() public {
        vm.prank(dest);
        vm.expectRevert(AllegianceTreasury.NotOfficer.selector);
        treasury.proposeWithdrawal(dest, 1e18);
    }

    function testCannotDoubleApprove() public {
        vm.prank(o1);
        uint256 id = treasury.proposeWithdrawal(dest, 1e18);
        vm.prank(o1);
        vm.expectRevert(AllegianceTreasury.AlreadyApproved.selector);
        treasury.approveWithdrawal(id);
    }
}
