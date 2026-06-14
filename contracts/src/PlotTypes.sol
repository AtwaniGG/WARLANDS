// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Stake amounts per plot type — GDD §4. Stake is LOCKED, never spent.
library PlotTypes {
    uint8 internal constant PLAINS = 0; // Basic
    uint8 internal constant FOREST = 1;
    uint8 internal constant RIVER = 2;
    uint8 internal constant MOUNTAIN = 3;
    uint8 internal constant DESERT = 4;
    uint8 internal constant COASTAL = 5;
    uint8 internal constant INDUSTRIAL = 6;
    uint8 internal constant TECH_RUINS = 7;
    uint8 internal constant WARZONE = 8;

    error UnknownPlotType();

    /// @return the $WAR stake (18 decimals) required to secure a plot of `t`.
    function stakeOf(uint8 t) internal pure returns (uint256) {
        if (t == PLAINS) return 10_000e18;
        if (t == FOREST) return 12_500e18;
        if (t == RIVER) return 15_000e18;
        if (t == MOUNTAIN) return 20_000e18;
        if (t == DESERT) return 25_000e18;
        if (t == COASTAL) return 30_000e18;
        if (t == INDUSTRIAL) return 40_000e18;
        if (t == TECH_RUINS) return 50_000e18;
        if (t == WARZONE) return 60_000e18;
        revert UnknownPlotType();
    }
}
