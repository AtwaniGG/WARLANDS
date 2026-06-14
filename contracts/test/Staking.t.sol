// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {MiniTest} from "./utils/Vm.sol";
import {WarToken} from "../src/WarToken.sol";
import {SinkRouter} from "../src/SinkRouter.sol";
import {RewardDistributor} from "../src/RewardDistributor.sol";
import {StakingManager} from "../src/StakingManager.sol";
import {PlotTypes} from "../src/PlotTypes.sol";
import {IERC20Burnable} from "../src/interfaces/IERC20.sol";
import {IRewardDistributor} from "../src/interfaces/IRewardDistributor.sol";
import {ISinkRouter} from "../src/interfaces/ISinkRouter.sol";

contract StakingTest is MiniTest {
    WarToken war;
    SinkRouter router;
    RewardDistributor distributor;
    StakingManager staking;

    address owner = address(0xA11CE);
    address tax = address(0x7A8);
    address alice = address(0xA1);
    address bob = address(0xB0B);
    address server = address(0x5E2E);

    function setUp() public {
        war = new WarToken(address(this), 1_000_000_000e18);
        distributor = new RewardDistributor(owner, war);
        router = new SinkRouter(owner, IERC20Burnable(address(war)), tax);
        staking = new StakingManager(owner, war, ISinkRouter(address(router)));

        vm.startPrank(owner);
        router.setConfig(IRewardDistributor(address(distributor)), tax);
        distributor.setFunder(address(router));
        staking.setGameServer(server);
        vm.stopPrank();

        // fund players
        war.transfer(alice, 100_000e18);
        war.transfer(bob, 100_000e18);
    }

    function _stake(address who, uint256 plotId, uint8 plotType) internal {
        uint256 amt = PlotTypes.stakeOf(plotType);
        vm.startPrank(who);
        war.approve(address(staking), amt);
        staking.stakeForPlot(plotId, plotType);
        vm.stopPrank();
    }

    function testStakeLocksPrincipal() public {
        uint256 before = war.balanceOf(alice);
        _stake(alice, 1, PlotTypes.MOUNTAIN); // 20,000
        assertEq(war.balanceOf(alice), before - 20_000e18, "stake not locked");
        assertEq(war.balanceOf(address(staking)), 20_000e18, "manager didn't hold stake");
        assertEq(staking.stakerOf(1), alice, "staker mismatch");
        assertEq(uint256(staking.plotStatus(1)), uint256(StakingManager.Status.Active), "not active");
    }

    function testVoluntaryWithdrawAppliesFeeAndReturnsPrincipal() public {
        _stake(alice, 1, PlotTypes.PLAINS); // 10,000
        vm.prank(alice);
        staking.requestUnstake(1);

        // cannot withdraw before unbond period
        vm.prank(alice);
        vm.expectRevert(StakingManager.StillUnbonding.selector);
        staking.withdraw(1);

        vm.warp(block.timestamp + 7 days);
        uint256 before = war.balanceOf(alice);
        vm.prank(alice);
        staking.withdraw(1);

        // 3% fee on 10,000 = 300 routed to sink; alice gets 9,700 back
        assertEq(war.balanceOf(alice), before + 9_700e18, "principal minus fee not returned");
        assertEq(uint256(staking.plotStatus(1)), uint256(StakingManager.Status.Unclaimed), "plot not freed");
        // fee was split by the router (>=20% burned)
        assertTrue(router.totalBurned() > 0, "no burn from unstake fee");
    }

    /// CORE INVARIANT: conquest never sends the loser's principal to the conqueror.
    function testConquestIsPrincipalSafe() public {
        _stake(alice, 7, PlotTypes.WARZONE); // 60,000 locked by alice
        uint256 bobBefore = war.balanceOf(bob);

        // server resolves conquest in bob's favor
        vm.prank(server);
        staking.conquer(7);

        // plot is now claimable again; bob did NOT receive alice's principal
        assertEq(uint256(staking.plotStatus(7)), uint256(StakingManager.Status.Unclaimed), "plot not freed");
        assertEq(war.balanceOf(bob), bobBefore, "bob wrongly received principal");
        assertEq(staking.refunds(alice), 60_000e18, "loser not credited full principal");

        // bob re-stakes the freed plot
        _stake(bob, 7, PlotTypes.WARZONE);
        assertEq(staking.stakerOf(7), bob, "bob didn't get the right to stake");

        // alice reclaims her FULL principal (no fee — involuntary)
        uint256 aliceBefore = war.balanceOf(alice);
        vm.prank(alice);
        staking.claimRefund();
        assertEq(war.balanceOf(alice), aliceBefore + 60_000e18, "alice didn't get full principal back");
    }

    function testOnlyGameServerCanConquer() public {
        _stake(alice, 1, PlotTypes.PLAINS);
        vm.prank(bob);
        vm.expectRevert(StakingManager.NotGameServer.selector);
        staking.conquer(1);
    }

    function testCannotStakeOccupiedPlot() public {
        _stake(alice, 1, PlotTypes.PLAINS);
        uint256 amt = PlotTypes.stakeOf(PlotTypes.PLAINS);
        vm.startPrank(bob);
        war.approve(address(staking), amt);
        vm.expectRevert(StakingManager.PlotNotAvailable.selector);
        staking.stakeForPlot(1, PlotTypes.PLAINS);
        vm.stopPrank();
    }
}
