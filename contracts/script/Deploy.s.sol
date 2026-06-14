// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {WarToken} from "../src/WarToken.sol";
import {SinkRouter} from "../src/SinkRouter.sol";
import {RewardDistributor} from "../src/RewardDistributor.sol";
import {StakingManager} from "../src/StakingManager.sol";
import {IERC20, IERC20Burnable} from "../src/interfaces/IERC20.sol";
import {IRewardDistributor} from "../src/interfaces/IRewardDistributor.sol";
import {ISinkRouter} from "../src/interfaces/ISinkRouter.sol";

/// @notice Foundry scripting cheatcodes (subset). Avoids a forge-std dependency.
interface VmScript {
    function startBroadcast() external;
    function stopBroadcast() external;
    function envOr(string calldata name, address defaultValue) external view returns (address);
    function envOr(string calldata name, uint256 defaultValue) external view returns (uint256);
}

/// @title Deploy — WARLANDS on-chain layer (GDD §20)
/// @dev   Run with:
///        forge script script/Deploy.s.sol --rpc-url $RPC --broadcast --private-key $PK
///        Optional env: OWNER, HOLDER, TAX_RECEIVER, GAME_SERVER, WAR_SUPPLY
contract Deploy {
    VmScript internal constant vm = VmScript(0x7109709ECfa91a80626fF3989D68f67F5b1DD12D);

    function run()
        external
        returns (WarToken war, SinkRouter router, RewardDistributor distributor, StakingManager staking)
    {
        address owner = vm.envOr("OWNER", msg.sender);
        address holder = vm.envOr("HOLDER", owner);
        address tax = vm.envOr("TAX_RECEIVER", owner);
        address server = vm.envOr("GAME_SERVER", owner);
        uint256 supply = vm.envOr("WAR_SUPPLY", uint256(1_000_000_000e18));

        vm.startBroadcast();

        // 1. token (fixed supply to the distribution holder)
        war = new WarToken(holder, supply);

        // 2. reward distributor (no minting power; funded only by sinks)
        distributor = new RewardDistributor(owner, war);

        // 3. sink router (burn / pool / tax)
        router = new SinkRouter(owner, IERC20Burnable(address(war)), tax);

        // 4. staking manager (principal-safe land staking)
        staking = new StakingManager(owner, IERC20(address(war)), ISinkRouter(address(router)));

        // 5. wiring (owner is the broadcaster here; in prod do this from the owner multisig)
        router.setConfig(IRewardDistributor(address(distributor)), tax);
        distributor.setFunder(address(router));
        staking.setGameServer(server);

        vm.stopBroadcast();
    }
}
