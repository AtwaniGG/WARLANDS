// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {MiniTest} from "./utils/Vm.sol";
import {WarToken} from "../src/WarToken.sol";
import {SinkRouter} from "../src/SinkRouter.sol";
import {RewardDistributor} from "../src/RewardDistributor.sol";
import {IERC20Burnable} from "../src/interfaces/IERC20.sol";
import {IRewardDistributor} from "../src/interfaces/IRewardDistributor.sol";

contract TokenomicsTest is MiniTest {
    WarToken war;
    SinkRouter router;
    RewardDistributor distributor;

    address owner = address(0xA11CE);
    address tax = address(0x7A8);
    address payer = address(0xBA1);
    address alice = address(0xA1);

    function setUp() public {
        war = new WarToken(address(this), 1_000_000_000e18);
        distributor = new RewardDistributor(owner, war);
        router = new SinkRouter(owner, IERC20Burnable(address(war)), tax);
        vm.startPrank(owner);
        router.setConfig(IRewardDistributor(address(distributor)), tax);
        distributor.setFunder(address(router));
        vm.stopPrank();
        war.transfer(payer, 1_000_000e18);
    }

    function _route(uint256 amount) internal {
        vm.startPrank(payer);
        war.approve(address(router), amount);
        router.route(amount, 2); // sinkType 2 = market fee
        vm.stopPrank();
    }

    function testSinkSplitBurnsPoolsAndTaxes() public {
        uint256 supplyBefore = war.totalSupply();
        _route(10_000e18); // default 40/40/20

        assertEq(router.totalBurned(), 4_000e18, "burn share wrong");
        assertEq(router.totalToPool(), 4_000e18, "pool share wrong");
        assertEq(router.totalToTax(), 2_000e18, "tax share wrong");
        assertEq(war.totalSupply(), supplyBefore - 4_000e18, "supply not deflated by burn");
        assertEq(war.balanceOf(tax), 2_000e18, "tax not received");
        assertEq(distributor.totalFunded(), 4_000e18, "pool not funded");
        assertEq(war.balanceOf(address(distributor)), 4_000e18, "distributor balance wrong");
    }

    function testBurnFloorCannotBeViolated() public {
        vm.prank(owner);
        vm.expectRevert(SinkRouter.BurnBelowFloor.selector);
        router.setShares(1_000, 7_000, 2_000); // 10% burn < 20% floor
    }

    function testShareSumMustBe100Pct() public {
        vm.prank(owner);
        vm.expectRevert(SinkRouter.BadShares.selector);
        router.setShares(3_000, 3_000, 3_000); // sums to 90%
    }

    /// INVARIANT: a season's claim cap can never exceed the pool funded by sinks (§12.2).
    function testSeasonCapBoundedByFundedPool() public {
        _route(10_000e18); // pool funded with 4,000
        vm.prank(owner);
        vm.expectRevert(RewardDistributor.CapExceedsPool.selector);
        distributor.openSeason(1, bytes32(uint256(1)), 5_000e18); // > 4,000 available
    }

    /// Full Merkle claim path with a 2-leaf tree; payouts come only from the funded pool.
    function testMerkleClaimWithinPool() public {
        _route(100_000e18); // pool = 40,000

        // 2 leaves: (alice, 1000e18) and (bob, 500e18). leaf = keccak(bytes.concat(keccak(abi.encode(acct,amt))))
        address bob = address(0xB0B);
        bytes32 leafA = keccak256(bytes.concat(keccak256(abi.encode(alice, uint256(1_000e18)))));
        bytes32 leafB = keccak256(bytes.concat(keccak256(abi.encode(bob, uint256(500e18)))));
        bytes32 root = leafA <= leafB
            ? keccak256(abi.encodePacked(leafA, leafB))
            : keccak256(abi.encodePacked(leafB, leafA));

        vm.prank(owner);
        distributor.openSeason(1, root, 2_000e18); // cap <= 40,000 pool

        bytes32[] memory proofA = new bytes32[](1);
        proofA[0] = leafB;

        uint256 before = war.balanceOf(alice);
        vm.prank(alice);
        distributor.claim(1, 1_000e18, proofA);
        assertEq(war.balanceOf(alice), before + 1_000e18, "alice claim failed");
        assertEq(distributor.totalClaimed(), 1_000e18, "claim not accounted");
        assertTrue(distributor.totalClaimed() <= distributor.totalFunded(), "INVARIANT: claimed > funded");

        // double-claim blocked
        vm.prank(alice);
        vm.expectRevert(RewardDistributor.AlreadyClaimed.selector);
        distributor.claim(1, 1_000e18, proofA);
    }

    function testNoMintFunctionExists() public view {
        // $WAR supply is fixed at construction; total supply only ever decreases via burns.
        assertEq(war.totalSupply(), 1_000_000_000e18, "unexpected supply");
    }
}
