// Asset path resolver — maps in-game IDs to image URLs under /assets (see public/assets/README.md
// and warlands-asset-manifest.csv). Until the real PNGs are dropped in, components fall back to
// emoji/flat-color via the <Sprite> component, so missing art never breaks the UI.

import type { TerrainId } from "./plotTypes";
import type { ResourceId } from "./resources";
import type { UnitId } from "./units";
import type { BuildingId } from "./buildings";
import type { AllegianceBuildingId } from "./allegiance";
import type { Rarity } from "./commanders";

export const terrainArt = (id: TerrainId) => `/assets/terrain/${id}.png`;
export const resourceArt = (id: ResourceId) => `/assets/resources/${id}.png`;
export const unitArt = (id: UnitId) => `/assets/units/${id}.png`;
export const buildingArt = (id: BuildingId) => `/assets/buildings/${id}.png`;
export const allegianceBuildingArt = (id: AllegianceBuildingId) => `/assets/buildings/allegiance/${id}.png`;
export const commanderPortrait = (n: number) => `/assets/commanders/portrait-${((n - 1) % 8) + 1}.png`;
export const commanderFrame = (r: Rarity) => `/assets/commanders/frame-${r}.png`;

/** Probe URL used to detect whether the terrain tile set has been added. */
export const TERRAIN_PROBE = terrainArt("plains" as TerrainId);
