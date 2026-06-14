"use client";

import { Sprite } from "./Sprite";
import { RESOURCES, type ResourceId } from "@/game/resources";
import { UNITS, type UnitId } from "@/game/units";
import { BUILDINGS, type BuildingId } from "@/game/buildings";
import { ALLEGIANCE_BUILDINGS, type AllegianceBuildingId } from "@/game/allegiance";
import { resourceArt, unitArt, buildingArt, allegianceBuildingArt, commanderPortrait } from "@/game/assets";
import type { Rarity } from "@/game/commanders";

/** Resource icon — real art when present, emoji fallback otherwise. */
export function ResourceIcon({ id, size = 16 }: { id: ResourceId; size?: number }) {
  return <Sprite url={resourceArt(id)} fallback={RESOURCES[id].icon} size={size} alt={RESOURCES[id].name} />;
}

export function UnitIcon({ id, size = 16 }: { id: UnitId; size?: number }) {
  return <Sprite url={unitArt(id)} fallback={UNITS[id].icon} size={size} alt={UNITS[id].name} />;
}

export function BuildingIcon({ id, size = 18 }: { id: BuildingId; size?: number }) {
  return <Sprite url={buildingArt(id)} fallback={BUILDINGS[id].icon} size={size} alt={BUILDINGS[id].name} />;
}

export function AllegianceBuildingIcon({ id, size = 18 }: { id: AllegianceBuildingId; size?: number }) {
  return <Sprite url={allegianceBuildingArt(id)} fallback={ALLEGIANCE_BUILDINGS[id].icon} size={size} alt={ALLEGIANCE_BUILDINGS[id].name} />;
}

/** Commander portrait — keyed off the commander id hash so each gets a stable face. */
export function CommanderPortrait({ id, fallback, rarity, size = 28 }: { id: string; fallback: string; rarity: Rarity; size?: number }) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  void rarity;
  return <Sprite url={commanderPortrait((h % 8) + 1)} fallback={fallback} size={size} alt="commander" rounded />;
}
