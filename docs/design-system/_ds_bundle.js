/* @ds-bundle: {"format":3,"namespace":"WARLANDSDesignSystem_e0d283","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Panel","sourcePath":"components/core/Panel.jsx"},{"name":"Stat","sourcePath":"components/core/Stat.jsx"},{"name":"ProgressBar","sourcePath":"components/game/ProgressBar.jsx"},{"name":"ResourceChip","sourcePath":"components/game/ResourceChip.jsx"},{"name":"Tabs","sourcePath":"components/game/Tabs.jsx"}],"sourceHashes":{"asset-prompts/assets-data.js":"6f94349728b7","components/core/Badge.jsx":"5b9127c18afa","components/core/Button.jsx":"c8deff3ab27a","components/core/Panel.jsx":"819c3e273dde","components/core/Stat.jsx":"fc44facd45ec","components/game/ProgressBar.jsx":"cec610fb6565","components/game/ResourceChip.jsx":"c3f9df745321","components/game/Tabs.jsx":"b92fd809cf8a","ui_kits/warlands-game/App.jsx":"91d291d9daa5","ui_kits/warlands-game/HexMap.jsx":"a85fdb33b06f","ui_kits/warlands-game/Panels.jsx":"eeaa7f408b0a","ui_kits/warlands-game/data.js":"f836772e6f16"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.WARLANDSDesignSystem_e0d283 = window.WARLANDSDesignSystem_e0d283 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// asset-prompts/assets-data.js
try { (() => {
window.WL_ASSETS = [{
  "group": "Terrain",
  "file": "public/assets/terrain/plains.png",
  "spec": "512x512 PNG, transparent outside hex, tileable",
  "read": "Neutral low-contrast starter land so the amber owned-rim reads clearly on top",
  "prompt": "Dry temperate grassland with patchy scrub and faint dirt vehicle tracks. Top-down orthographic view of a single flat-top hexagon map tile, edges designed to seam seamlessly with neighbours. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: olive base #7c8a4f with sand #c9a14a track accents. Lighting: soft top-down ambient with a faint warm key from the north-west, gentle readable relief shadows. Background: art fills the hex, fully transparent outside the hexagon silhouette. 512x512 PNG, transparent outside hex, tileable."
}, {
  "group": "Terrain",
  "file": "public/assets/terrain/forest.png",
  "spec": "512x512 PNG, transparent outside hex, tileable",
  "read": "Darkest tile; canopy texture reads as cover at full map zoom",
  "prompt": "Dense dark coniferous canopy of tight treetops with a few shadowed clearings. Top-down orthographic view of a single flat-top hexagon map tile, edges designed to seam seamlessly with neighbours. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: forest base #2f5d3a with gunmetal #2a2f3a shadow. Lighting: soft top-down ambient with a faint warm key from the north-west, gentle readable relief shadows. Background: art fills the hex, fully transparent outside the hexagon silhouette. 512x512 PNG, transparent outside hex, tileable."
}, {
  "group": "Terrain",
  "file": "public/assets/terrain/river.png",
  "spec": "512x512 PNG, transparent outside hex, tileable",
  "read": "Blue ribbon visually links into continuous rivers across adjacent tiles",
  "prompt": "A flowing water channel cutting across with muddy banks and a shallow ford crossing. Top-down orthographic view of a single flat-top hexagon map tile, edges designed to seam seamlessly with neighbours. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: river base #2c6f8c with concrete #8b8f96 banks. Lighting: soft top-down ambient with a faint warm key from the north-west, gentle readable relief shadows. Background: art fills the hex, fully transparent outside the hexagon silhouette. 512x512 PNG, transparent outside hex, tileable."
}, {
  "group": "Terrain",
  "file": "public/assets/terrain/mountain.png",
  "spec": "512x512 PNG, transparent outside hex, tileable",
  "read": "High-relief grey reads instantly as impassable/defensive terrain",
  "prompt": "Rugged rock ridges and loose scree, hard angular high-ground relief. Top-down orthographic view of a single flat-top hexagon map tile, edges designed to seam seamlessly with neighbours. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: mountain base #6b6f78 with ash #4b515c shadow. Lighting: soft top-down ambient with a faint warm key from the north-west, gentle readable relief shadows. Background: art fills the hex, fully transparent outside the hexagon silhouette. 512x512 PNG, transparent outside hex, tileable."
}, {
  "group": "Terrain",
  "file": "public/assets/terrain/desert.png",
  "spec": "512x512 PNG, transparent outside hex, tileable",
  "read": "Warm sand plus a single amber oil glint signals an economy/oil tile",
  "prompt": "Rolling sand dunes with an oily sheen patch and a marked derrick drill spot. Top-down orthographic view of a single flat-top hexagon map tile, edges designed to seam seamlessly with neighbours. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: sand base #c9a14a with amber #f5b301 oil glint. Lighting: soft top-down ambient with a faint warm key from the north-west, gentle readable relief shadows. Background: art fills the hex, fully transparent outside the hexagon silhouette. 512x512 PNG, transparent outside hex, tileable."
}, {
  "group": "Terrain",
  "file": "public/assets/terrain/coastal.png",
  "spec": "512x512 PNG, transparent outside hex, tileable",
  "read": "Sea edge and dock silhouette signal trade and logistics",
  "prompt": "A shoreline where land meets open sea, with a small concrete dock and breakwater. Top-down orthographic view of a single flat-top hexagon map tile, edges designed to seam seamlessly with neighbours. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: teal base #3f9aa6 with sand #c9a14a shore. Lighting: soft top-down ambient with a faint warm key from the north-west, gentle readable relief shadows. Background: art fills the hex, fully transparent outside the hexagon silhouette. 512x512 PNG, transparent outside hex, tileable."
}, {
  "group": "Terrain",
  "file": "public/assets/terrain/industrial.png",
  "spec": "512x512 PNG, transparent outside hex, tileable",
  "read": "Machined grey-brown with a factory silhouette reads as production land",
  "prompt": "Poured concrete slabs, exposed pipe runs and a short smokestack on oil-stained ground. Top-down orthographic view of a single flat-top hexagon map tile, edges designed to seam seamlessly with neighbours. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: industrial base #8a5a3c with gunmetal #2a2f3a steel. Lighting: soft top-down ambient with a faint warm key from the north-west, gentle readable relief shadows. Background: art fills the hex, fully transparent outside the hexagon silhouette. 512x512 PNG, transparent outside hex, tileable."
}, {
  "group": "Terrain",
  "file": "public/assets/terrain/techRuins.png",
  "spec": "512x512 PNG, transparent outside hex, tileable",
  "read": "The only violet-glow tile; instantly reads as rare tech terrain",
  "prompt": "Broken half-buried arcology shards and exposed circuitry emitting a faint glow. Top-down orthographic view of a single flat-top hexagon map tile, edges designed to seam seamlessly with neighbours. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: techruins base #5b4b8a with violet #8b5cf6 glow. Lighting: soft top-down ambient with a faint warm key from the north-west, gentle readable relief shadows. Background: art fills the hex, fully transparent outside the hexagon silhouette. 512x512 PNG, transparent outside hex, tileable."
}, {
  "group": "Terrain",
  "file": "public/assets/terrain/warzone.png",
  "spec": "512x512 PNG, transparent outside hex, tileable",
  "read": "Red scorched center tile reads as danger at any zoom level",
  "prompt": "Cratered scorched earth with blast scoring, scattered wreckage and bent rebar. Top-down orthographic view of a single flat-top hexagon map tile, edges designed to seam seamlessly with neighbours. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: scorched dark base with blood #9c2b2b signal. Lighting: soft top-down ambient with a faint warm key from the north-west, gentle readable relief shadows. Background: art fills the hex, fully transparent outside the hexagon silhouette. 512x512 PNG, transparent outside hex, tileable."
}, {
  "group": "Buildings — Economy",
  "file": "public/assets/buildings/camp.png",
  "spec": "256x256 PNG, transparent",
  "read": "Smallest building; tent + mast silhouette reads as the player HQ camp",
  "prompt": "A humble field command tent camp with sandbag walls and a short radio mast. Three-quarter top-down billboard view, a single building on a consistent square footprint, grounded with a soft drop shadow. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: olive #5c6347 canvas with amber #f5b301 marker. Lighting: soft north-west key light with one long readable shadow. Background: transparent background (PNG alpha), nothing behind the structure. 256x256 PNG, transparent."
}, {
  "group": "Buildings — Economy",
  "file": "public/assets/buildings/farm.png",
  "spec": "256x256 PNG, transparent",
  "read": "Striped field pattern telegraphs food production",
  "prompt": "Small terraced crop-field plots beside a simple irrigation shed. Three-quarter top-down billboard view, a single building on a consistent square footprint, grounded with a soft drop shadow. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: olive #5c6347 with sand #c9a14a crops. Lighting: soft north-west key light with one long readable shadow. Background: transparent background (PNG alpha), nothing behind the structure. 256x256 PNG, transparent."
}, {
  "group": "Buildings — Economy",
  "file": "public/assets/buildings/well.png",
  "spec": "256x256 PNG, transparent",
  "read": "Tank + pump silhouette reads as water",
  "prompt": "A water well pump head feeding a small ribbed storage tank. Three-quarter top-down billboard view, a single building on a consistent square footprint, grounded with a soft drop shadow. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: concrete #8b8f96 with sky #4a90d9 water. Lighting: soft north-west key light with one long readable shadow. Background: transparent background (PNG alpha), nothing behind the structure. 256x256 PNG, transparent."
}, {
  "group": "Buildings — Economy",
  "file": "public/assets/buildings/lumberCamp.png",
  "spec": "256x256 PNG, transparent",
  "read": "Stacked logs read as wood even at token size",
  "prompt": "A logging yard with neatly stacked timber and an open saw shelter. Three-quarter top-down billboard view, a single building on a consistent square footprint, grounded with a soft drop shadow. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: dirt-brown #6b5840 with olive #5c6347. Lighting: soft north-west key light with one long readable shadow. Background: transparent background (PNG alpha), nothing behind the structure. 256x256 PNG, transparent."
}, {
  "group": "Buildings — Economy",
  "file": "public/assets/buildings/quarry.png",
  "spec": "256x256 PNG, transparent",
  "read": "Stepped pit + crane reads as stone extraction",
  "prompt": "An open stone quarry pit with cut blocks and a small jib crane. Three-quarter top-down billboard view, a single building on a consistent square footprint, grounded with a soft drop shadow. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: concrete #8b8f96 with ash #4b515c. Lighting: soft north-west key light with one long readable shadow. Background: transparent background (PNG alpha), nothing behind the structure. 256x256 PNG, transparent."
}, {
  "group": "Buildings — Economy",
  "file": "public/assets/buildings/ironMine.png",
  "spec": "256x256 PNG, transparent",
  "read": "Headframe silhouette distinguishes it from the quarry",
  "prompt": "A mine entrance cut into rock with ore carts and a timber headframe. Three-quarter top-down billboard view, a single building on a consistent square footprint, grounded with a soft drop shadow. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: ash #4b515c with gunmetal #2a2f3a. Lighting: soft north-west key light with one long readable shadow. Background: transparent background (PNG alpha), nothing behind the structure. 256x256 PNG, transparent."
}, {
  "group": "Buildings — Economy",
  "file": "public/assets/buildings/mineralMine.png",
  "spec": "256x256 PNG, transparent",
  "read": "Violet ore accent marks rare-mineral extraction",
  "prompt": "A deep mineral shaft with a conveyor lifting crystalline ore. Three-quarter top-down billboard view, a single building on a consistent square footprint, grounded with a soft drop shadow. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: gunmetal #2a2f3a with violet #8b5cf6 ore. Lighting: soft north-west key light with one long readable shadow. Background: transparent background (PNG alpha), nothing behind the structure. 256x256 PNG, transparent."
}, {
  "group": "Buildings — Economy",
  "file": "public/assets/buildings/oilDerrick.png",
  "spec": "256x256 PNG, transparent",
  "read": "Pumpjack arm is an unmistakable oil silhouette",
  "prompt": "A nodding pumpjack oil derrick on a stained concrete pad. Three-quarter top-down billboard view, a single building on a consistent square footprint, grounded with a soft drop shadow. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: gunmetal #2a2f3a with amber #f5b301 trim. Lighting: soft north-west key light with one long readable shadow. Background: transparent background (PNG alpha), nothing behind the structure. 256x256 PNG, transparent."
}, {
  "group": "Buildings — Economy",
  "file": "public/assets/buildings/dataExcavator.png",
  "spec": "256x256 PNG, transparent",
  "read": "Antenna + green glow reads as data/tech harvesting",
  "prompt": "A salvage rig excavating buried data cores with a small antenna array. Three-quarter top-down billboard view, a single building on a consistent square footprint, grounded with a soft drop shadow. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: gunmetal #2a2f3a with toxic-green #6ee7a8 glow. Lighting: soft north-west key light with one long readable shadow. Background: transparent background (PNG alpha), nothing behind the structure. 256x256 PNG, transparent."
}, {
  "group": "Buildings — Economy",
  "file": "public/assets/buildings/refinery.png",
  "spec": "256x256 PNG, transparent",
  "read": "Round tanks cluster reads as refining",
  "prompt": "A fuel refinery with round storage tanks and dense pipework. Three-quarter top-down billboard view, a single building on a consistent square footprint, grounded with a soft drop shadow. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: concrete #8b8f96 with amber #f5b301. Lighting: soft north-west key light with one long readable shadow. Background: transparent background (PNG alpha), nothing behind the structure. 256x256 PNG, transparent."
}, {
  "group": "Buildings — Economy",
  "file": "public/assets/buildings/foundry.png",
  "spec": "256x256 PNG, transparent",
  "read": "Twin smokestacks telegraph the foundry",
  "prompt": "A metal foundry with twin smokestacks and a restrained molten-pour glow. Three-quarter top-down billboard view, a single building on a consistent square footprint, grounded with a soft drop shadow. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: gunmetal #2a2f3a with amber #f5b301 heat. Lighting: soft north-west key light with one long readable shadow. Background: transparent background (PNG alpha), nothing behind the structure. 256x256 PNG, transparent."
}, {
  "group": "Buildings — Economy",
  "file": "public/assets/buildings/armsFactory.png",
  "spec": "256x256 PNG, transparent",
  "read": "Crates + shed reads as weapons manufacture",
  "prompt": "A small-arms factory shed with crates of rifles by a roller door. Three-quarter top-down billboard view, a single building on a consistent square footprint, grounded with a soft drop shadow. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: olive #5c6347 with ash #4b515c. Lighting: soft north-west key light with one long readable shadow. Background: transparent background (PNG alpha), nothing behind the structure. 256x256 PNG, transparent."
}, {
  "group": "Buildings — Economy",
  "file": "public/assets/buildings/heavyWorks.png",
  "spec": "256x256 PNG, transparent",
  "read": "Gantry + hull silhouette reads as heavy manufacture",
  "prompt": "A heavy-vehicle works hangar assembling tank hulls under a gantry. Three-quarter top-down billboard view, a single building on a consistent square footprint, grounded with a soft drop shadow. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: gunmetal #2a2f3a with amber #f5b301 gantry. Lighting: soft north-west key light with one long readable shadow. Background: transparent background (PNG alpha), nothing behind the structure. 256x256 PNG, transparent."
}, {
  "group": "Buildings — Economy",
  "file": "public/assets/buildings/electronicsLab.png",
  "spec": "256x256 PNG, transparent",
  "read": "Dish + clean block reads as electronics/tech",
  "prompt": "An electronics lab block with a clean-room wing and a small dish. Three-quarter top-down billboard view, a single building on a consistent square footprint, grounded with a soft drop shadow. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: concrete #8b8f96 with toxic-green #6ee7a8. Lighting: soft north-west key light with one long readable shadow. Background: transparent background (PNG alpha), nothing behind the structure. 256x256 PNG, transparent."
}, {
  "group": "Buildings — Economy",
  "file": "public/assets/buildings/warehouse.png",
  "spec": "256x256 PNG, transparent",
  "read": "Long shed + dock reads as storage",
  "prompt": "A corrugated storage warehouse with a loading dock and stacked crates. Three-quarter top-down billboard view, a single building on a consistent square footprint, grounded with a soft drop shadow. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: ash #4b515c with amber #f5b301 dock. Lighting: soft north-west key light with one long readable shadow. Background: transparent background (PNG alpha), nothing behind the structure. 256x256 PNG, transparent."
}, {
  "group": "Buildings — Allegiance",
  "file": "public/assets/buildings/allegiance/hq.png",
  "spec": "256x256 PNG, transparent",
  "read": "Largest economy-side silhouette; tower + flag reads as faction HQ",
  "prompt": "An imposing fortified headquarters bunker complex with a comms tower and a flag. Three-quarter top-down billboard view of a large, imposing regional structure on a consistent footprint, grounded with a soft drop shadow. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: gunmetal #2a2f3a with amber #f5b301 flag. Lighting: soft north-west key light with one long readable shadow. Background: transparent background (PNG alpha), nothing behind the structure. 256x256 PNG, transparent."
}, {
  "group": "Buildings — Allegiance",
  "file": "public/assets/buildings/allegiance/fortress.png",
  "spec": "256x256 PNG, transparent",
  "read": "Thick walls + turrets read as pure defense",
  "prompt": "A heavy concrete fortress with ramparts, corner turrets and blast walls. Three-quarter top-down billboard view of a large, imposing regional structure on a consistent footprint, grounded with a soft drop shadow. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: concrete #8b8f96 with blood #9c2b2b banners. Lighting: soft north-west key light with one long readable shadow. Background: transparent background (PNG alpha), nothing behind the structure. 256x256 PNG, transparent."
}, {
  "group": "Buildings — Allegiance",
  "file": "public/assets/buildings/allegiance/tradeHub.png",
  "spec": "256x256 PNG, transparent",
  "read": "Cranes + containers read as a trade structure",
  "prompt": "A large trade-hub depot with gantry cranes, shipping containers and a rail spur. Three-quarter top-down billboard view of a large, imposing regional structure on a consistent footprint, grounded with a soft drop shadow. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: ash #4b515c with teal #3f9aa6 containers. Lighting: soft north-west key light with one long readable shadow. Background: transparent background (PNG alpha), nothing behind the structure. 256x256 PNG, transparent."
}, {
  "group": "Buildings — Allegiance",
  "file": "public/assets/buildings/allegiance/radar.png",
  "spec": "256x256 PNG, transparent",
  "read": "Giant dish is an unmistakable radar silhouette",
  "prompt": "A regional radar network station with a giant rotating dish on a mast. Three-quarter top-down billboard view of a large, imposing regional structure on a consistent footprint, grounded with a soft drop shadow. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: gunmetal #2a2f3a with sky #4a90d9 sweep. Lighting: soft north-west key light with one long readable shadow. Background: transparent background (PNG alpha), nothing behind the structure. 256x256 PNG, transparent."
}, {
  "group": "Buildings — Allegiance",
  "file": "public/assets/buildings/allegiance/research.png",
  "spec": "256x256 PNG, transparent",
  "read": "Domes + antennas read as research",
  "prompt": "A research center with low domes, antenna masts and lab wings. Three-quarter top-down billboard view of a large, imposing regional structure on a consistent footprint, grounded with a soft drop shadow. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: concrete #8b8f96 with toxic-green #6ee7a8. Lighting: soft north-west key light with one long readable shadow. Background: transparent background (PNG alpha), nothing behind the structure. 256x256 PNG, transparent."
}, {
  "group": "Buildings — Allegiance",
  "file": "public/assets/buildings/allegiance/factory.png",
  "spec": "256x256 PNG, transparent",
  "read": "Repeated halls + stacks read as heavy industry at scale",
  "prompt": "A large alliance factory complex with multiple assembly halls and smokestacks. Three-quarter top-down billboard view of a large, imposing regional structure on a consistent footprint, grounded with a soft drop shadow. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: gunmetal #2a2f3a with amber #f5b301. Lighting: soft north-west key light with one long readable shadow. Background: transparent background (PNG alpha), nothing behind the structure. 256x256 PNG, transparent."
}, {
  "group": "Buildings — Allegiance",
  "file": "public/assets/buildings/allegiance/shield.png",
  "spec": "256x256 PNG, transparent",
  "read": "Pylons + faint blue dome read as area defense without glow spam",
  "prompt": "A shield-network array of emitter pylons projecting a faint hex energy dome. Three-quarter top-down billboard view of a large, imposing regional structure on a consistent footprint, grounded with a soft drop shadow. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: ash #4b515c with sky #4a90d9 dome (restrained). Lighting: soft north-west key light with one long readable shadow. Background: transparent background (PNG alpha), nothing behind the structure. 256x256 PNG, transparent."
}, {
  "group": "Units",
  "file": "public/assets/units/infantry.png",
  "spec": "128x128 PNG, transparent, must read at 24px",
  "read": "Soft organic blob of figures contrasts with hard vehicle outlines",
  "prompt": "A small squad cluster of infantry soldiers with helmets and packs. Top-down map-token view, single centred unit with a clear distinct outline, slight drop shadow. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: olive #5c6347 with ash #4b515c. Lighting: soft top-down light, minimal shadow. Background: transparent background (PNG alpha). 128x128 PNG, transparent, must read at 24px."
}, {
  "group": "Units",
  "file": "public/assets/units/tanks.png",
  "spec": "128x128 PNG, transparent, must read at 24px",
  "read": "Boxy hull + barrel is the clearest 24px armor silhouette",
  "prompt": "A tracked main battle tank with turret and a long gun barrel. Top-down map-token view, single centred unit with a clear distinct outline, slight drop shadow. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: gunmetal #2a2f3a with olive #5c6347. Lighting: soft top-down light, minimal shadow. Background: transparent background (PNG alpha). 128x128 PNG, transparent, must read at 24px."
}, {
  "group": "Units",
  "file": "public/assets/units/artillery.png",
  "spec": "128x128 PNG, transparent, must read at 24px",
  "read": "Extra-long raised barrel distinguishes it from a tank",
  "prompt": "A self-propelled artillery piece with a long raised gun. Top-down map-token view, single centred unit with a clear distinct outline, slight drop shadow. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: ash #4b515c with amber #f5b301 muzzle. Lighting: soft top-down light, minimal shadow. Background: transparent background (PNG alpha). 128x128 PNG, transparent, must read at 24px."
}, {
  "group": "Units",
  "file": "public/assets/units/aircraft.png",
  "spec": "128x128 PNG, transparent, must read at 24px",
  "read": "Wing delta is unmistakable from the ground units",
  "prompt": "A swept-wing strike aircraft seen from above. Top-down map-token view, single centred unit with a clear distinct outline, slight drop shadow. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: gunmetal #2a2f3a with sky #4a90d9. Lighting: soft top-down light, minimal shadow. Background: transparent background (PNG alpha). 128x128 PNG, transparent, must read at 24px."
}, {
  "group": "Units",
  "file": "public/assets/units/drones.png",
  "spec": "128x128 PNG, transparent, must read at 24px",
  "read": "X-shaped rotor frame reads as a drone instantly",
  "prompt": "A quad recon drone with rotor booms seen from above. Top-down map-token view, single centred unit with a clear distinct outline, slight drop shadow. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: ash #4b515c with toxic-green #6ee7a8. Lighting: soft top-down light, minimal shadow. Background: transparent background (PNG alpha). 128x128 PNG, transparent, must read at 24px."
}, {
  "group": "Units",
  "file": "public/assets/units/engineers.png",
  "spec": "128x128 PNG, transparent, must read at 24px",
  "read": "Dozer blade + tool kit reads as support/engineering",
  "prompt": "An engineer sapper vehicle with a dozer blade and tools. Top-down map-token view, single centred unit with a clear distinct outline, slight drop shadow. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: olive #5c6347 with amber #f5b301 blade. Lighting: soft top-down light, minimal shadow. Background: transparent background (PNG alpha). 128x128 PNG, transparent, must read at 24px."
}, {
  "group": "Resources",
  "file": "public/assets/resources/food.png",
  "spec": "96x96 PNG, transparent, crisp at 24px",
  "read": "Plain frame instantly signals the raw supply tier",
  "prompt": "A bundled sheaf of grain, on a plain rounded-square chip with no frame ornament (tier: raw). Flat 2D front-facing icon, bold simple two-tone shapes plus one accent. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: gunmetal #2a2f3a and concrete #8b8f96 two-tone with amber #f5b301 accent. Lighting: flat even lighting, minimal shadow. Background: transparent background (PNG alpha) around the rounded-square chip. 96x96 PNG, transparent, crisp at 24px."
}, {
  "group": "Resources",
  "file": "public/assets/resources/water.png",
  "spec": "96x96 PNG, transparent, crisp at 24px",
  "read": "Plain frame instantly signals the raw supply tier",
  "prompt": "A single water droplet over a canteen, on a plain rounded-square chip with no frame ornament (tier: raw). Flat 2D front-facing icon, bold simple two-tone shapes plus one accent. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: gunmetal #2a2f3a and concrete #8b8f96 two-tone with sky #4a90d9 accent. Lighting: flat even lighting, minimal shadow. Background: transparent background (PNG alpha) around the rounded-square chip. 96x96 PNG, transparent, crisp at 24px."
}, {
  "group": "Resources",
  "file": "public/assets/resources/wood.png",
  "spec": "96x96 PNG, transparent, crisp at 24px",
  "read": "Plain frame instantly signals the raw supply tier",
  "prompt": "A short stack of cut logs, on a plain rounded-square chip with no frame ornament (tier: raw). Flat 2D front-facing icon, bold simple two-tone shapes plus one accent. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: gunmetal #2a2f3a and concrete #8b8f96 two-tone with dirt-brown #6b5840 accent. Lighting: flat even lighting, minimal shadow. Background: transparent background (PNG alpha) around the rounded-square chip. 96x96 PNG, transparent, crisp at 24px."
}, {
  "group": "Resources",
  "file": "public/assets/resources/stone.png",
  "spec": "96x96 PNG, transparent, crisp at 24px",
  "read": "Plain frame instantly signals the raw supply tier",
  "prompt": "A rough cut stone block, on a plain rounded-square chip with no frame ornament (tier: raw). Flat 2D front-facing icon, bold simple two-tone shapes plus one accent. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: gunmetal #2a2f3a and concrete #8b8f96 two-tone with concrete #8b8f96 accent. Lighting: flat even lighting, minimal shadow. Background: transparent background (PNG alpha) around the rounded-square chip. 96x96 PNG, transparent, crisp at 24px."
}, {
  "group": "Resources",
  "file": "public/assets/resources/iron.png",
  "spec": "96x96 PNG, transparent, crisp at 24px",
  "read": "Plain frame instantly signals the raw supply tier",
  "prompt": "A chunk of iron ore beside an ingot, on a plain rounded-square chip with no frame ornament (tier: raw). Flat 2D front-facing icon, bold simple two-tone shapes plus one accent. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: gunmetal #2a2f3a and concrete #8b8f96 two-tone with ash #4b515c accent. Lighting: flat even lighting, minimal shadow. Background: transparent background (PNG alpha) around the rounded-square chip. 96x96 PNG, transparent, crisp at 24px."
}, {
  "group": "Resources",
  "file": "public/assets/resources/rareMinerals.png",
  "spec": "96x96 PNG, transparent, crisp at 24px",
  "read": "Plain frame instantly signals the raw supply tier",
  "prompt": "A cluster of raw crystals, on a plain rounded-square chip with no frame ornament (tier: raw). Flat 2D front-facing icon, bold simple two-tone shapes plus one accent. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: gunmetal #2a2f3a and concrete #8b8f96 two-tone with violet #8b5cf6 accent. Lighting: flat even lighting, minimal shadow. Background: transparent background (PNG alpha) around the rounded-square chip. 96x96 PNG, transparent, crisp at 24px."
}, {
  "group": "Resources",
  "file": "public/assets/resources/oil.png",
  "spec": "96x96 PNG, transparent, crisp at 24px",
  "read": "Plain frame instantly signals the raw supply tier",
  "prompt": "A black oil barrel with a drop, on a plain rounded-square chip with no frame ornament (tier: raw). Flat 2D front-facing icon, bold simple two-tone shapes plus one accent. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: gunmetal #2a2f3a and concrete #8b8f96 two-tone with amber #f5b301 accent. Lighting: flat even lighting, minimal shadow. Background: transparent background (PNG alpha) around the rounded-square chip. 96x96 PNG, transparent, crisp at 24px."
}, {
  "group": "Resources",
  "file": "public/assets/resources/dataChips.png",
  "spec": "96x96 PNG, transparent, crisp at 24px",
  "read": "Plain frame instantly signals the raw supply tier",
  "prompt": "A salvaged microchip wafer, on a plain rounded-square chip with no frame ornament (tier: raw). Flat 2D front-facing icon, bold simple two-tone shapes plus one accent. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: gunmetal #2a2f3a and concrete #8b8f96 two-tone with toxic-green #6ee7a8 accent. Lighting: flat even lighting, minimal shadow. Background: transparent background (PNG alpha) around the rounded-square chip. 96x96 PNG, transparent, crisp at 24px."
}, {
  "group": "Resources",
  "file": "public/assets/resources/fuel.png",
  "spec": "96x96 PNG, transparent, crisp at 24px",
  "read": "Bracketed frame instantly signals the intermediate supply tier",
  "prompt": "A military jerrycan fuel can, on a rounded-square chip with bracketed corner marks (tier: intermediate). Flat 2D front-facing icon, bold simple two-tone shapes plus one accent. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: gunmetal #2a2f3a and concrete #8b8f96 two-tone with amber #f5b301 accent. Lighting: flat even lighting, minimal shadow. Background: transparent background (PNG alpha) around the rounded-square chip. 96x96 PNG, transparent, crisp at 24px."
}, {
  "group": "Resources",
  "file": "public/assets/resources/steel.png",
  "spec": "96x96 PNG, transparent, crisp at 24px",
  "read": "Bracketed frame instantly signals the intermediate supply tier",
  "prompt": "A polished steel I-beam, on a rounded-square chip with bracketed corner marks (tier: intermediate). Flat 2D front-facing icon, bold simple two-tone shapes plus one accent. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: gunmetal #2a2f3a and concrete #8b8f96 two-tone with concrete #8b8f96 accent. Lighting: flat even lighting, minimal shadow. Background: transparent background (PNG alpha) around the rounded-square chip. 96x96 PNG, transparent, crisp at 24px."
}, {
  "group": "Resources",
  "file": "public/assets/resources/electronics.png",
  "spec": "96x96 PNG, transparent, crisp at 24px",
  "read": "Bracketed frame instantly signals the intermediate supply tier",
  "prompt": "A small green circuit board, on a rounded-square chip with bracketed corner marks (tier: intermediate). Flat 2D front-facing icon, bold simple two-tone shapes plus one accent. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: gunmetal #2a2f3a and concrete #8b8f96 two-tone with toxic-green #6ee7a8 accent. Lighting: flat even lighting, minimal shadow. Background: transparent background (PNG alpha) around the rounded-square chip. 96x96 PNG, transparent, crisp at 24px."
}, {
  "group": "Resources",
  "file": "public/assets/resources/machineParts.png",
  "spec": "96x96 PNG, transparent, crisp at 24px",
  "read": "Bracketed frame instantly signals the intermediate supply tier",
  "prompt": "An interlocking gear and cog, on a rounded-square chip with bracketed corner marks (tier: intermediate). Flat 2D front-facing icon, bold simple two-tone shapes plus one accent. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: gunmetal #2a2f3a and concrete #8b8f96 two-tone with ash #4b515c accent. Lighting: flat even lighting, minimal shadow. Background: transparent background (PNG alpha) around the rounded-square chip. 96x96 PNG, transparent, crisp at 24px."
}, {
  "group": "Resources",
  "file": "public/assets/resources/ammunition.png",
  "spec": "96x96 PNG, transparent, crisp at 24px",
  "read": "Bracketed frame instantly signals the intermediate supply tier",
  "prompt": "A row of artillery shell rounds, on a rounded-square chip with bracketed corner marks (tier: intermediate). Flat 2D front-facing icon, bold simple two-tone shapes plus one accent. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: gunmetal #2a2f3a and concrete #8b8f96 two-tone with blood #9c2b2b accent. Lighting: flat even lighting, minimal shadow. Background: transparent background (PNG alpha) around the rounded-square chip. 96x96 PNG, transparent, crisp at 24px."
}, {
  "group": "Resources",
  "file": "public/assets/resources/chemicals.png",
  "spec": "96x96 PNG, transparent, crisp at 24px",
  "read": "Bracketed frame instantly signals the intermediate supply tier",
  "prompt": "A sealed chemical canister/flask, on a rounded-square chip with bracketed corner marks (tier: intermediate). Flat 2D front-facing icon, bold simple two-tone shapes plus one accent. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: gunmetal #2a2f3a and concrete #8b8f96 two-tone with toxic-green #6ee7a8 accent. Lighting: flat even lighting, minimal shadow. Background: transparent background (PNG alpha) around the rounded-square chip. 96x96 PNG, transparent, crisp at 24px."
}, {
  "group": "Resources",
  "file": "public/assets/resources/rifles.png",
  "spec": "96x96 PNG, transparent, crisp at 24px",
  "read": "Badged frame instantly signals the finished supply tier",
  "prompt": "A single service rifle, on a rounded-square chip with a bordered badge frame (tier: finished). Flat 2D front-facing icon, bold simple two-tone shapes plus one accent. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: gunmetal #2a2f3a and concrete #8b8f96 two-tone with ash #4b515c accent. Lighting: flat even lighting, minimal shadow. Background: transparent background (PNG alpha) around the rounded-square chip. 96x96 PNG, transparent, crisp at 24px."
}, {
  "group": "Resources",
  "file": "public/assets/resources/tanks.png",
  "spec": "96x96 PNG, transparent, crisp at 24px",
  "read": "Badged frame instantly signals the finished supply tier",
  "prompt": "A compact tank silhouette badge, on a rounded-square chip with a bordered badge frame (tier: finished). Flat 2D front-facing icon, bold simple two-tone shapes plus one accent. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: gunmetal #2a2f3a and concrete #8b8f96 two-tone with olive #5c6347 accent. Lighting: flat even lighting, minimal shadow. Background: transparent background (PNG alpha) around the rounded-square chip. 96x96 PNG, transparent, crisp at 24px."
}, {
  "group": "Resources",
  "file": "public/assets/resources/drones.png",
  "spec": "96x96 PNG, transparent, crisp at 24px",
  "read": "Badged frame instantly signals the finished supply tier",
  "prompt": "A finished recon drone badge, on a rounded-square chip with a bordered badge frame (tier: finished). Flat 2D front-facing icon, bold simple two-tone shapes plus one accent. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: gunmetal #2a2f3a and concrete #8b8f96 two-tone with sky #4a90d9 accent. Lighting: flat even lighting, minimal shadow. Background: transparent background (PNG alpha) around the rounded-square chip. 96x96 PNG, transparent, crisp at 24px."
}, {
  "group": "Resources",
  "file": "public/assets/resources/aircraft.png",
  "spec": "96x96 PNG, transparent, crisp at 24px",
  "read": "Badged frame instantly signals the finished supply tier",
  "prompt": "A finished strike aircraft badge, on a rounded-square chip with a bordered badge frame (tier: finished). Flat 2D front-facing icon, bold simple two-tone shapes plus one accent. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: gunmetal #2a2f3a and concrete #8b8f96 two-tone with sky #4a90d9 accent. Lighting: flat even lighting, minimal shadow. Background: transparent background (PNG alpha) around the rounded-square chip. 96x96 PNG, transparent, crisp at 24px."
}, {
  "group": "Resources",
  "file": "public/assets/resources/turrets.png",
  "spec": "96x96 PNG, transparent, crisp at 24px",
  "read": "Badged frame instantly signals the finished supply tier",
  "prompt": "A defensive turret emplacement, on a rounded-square chip with a bordered badge frame (tier: finished). Flat 2D front-facing icon, bold simple two-tone shapes plus one accent. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: gunmetal #2a2f3a and concrete #8b8f96 two-tone with ash #4b515c accent. Lighting: flat even lighting, minimal shadow. Background: transparent background (PNG alpha) around the rounded-square chip. 96x96 PNG, transparent, crisp at 24px."
}, {
  "group": "Resources",
  "file": "public/assets/resources/buildingComponents.png",
  "spec": "96x96 PNG, transparent, crisp at 24px",
  "read": "Badged frame instantly signals the finished supply tier",
  "prompt": "A bundle of prefab girders, on a rounded-square chip with a bordered badge frame (tier: finished). Flat 2D front-facing icon, bold simple two-tone shapes plus one accent. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: gunmetal #2a2f3a and concrete #8b8f96 two-tone with amber #f5b301 accent. Lighting: flat even lighting, minimal shadow. Background: transparent background (PNG alpha) around the rounded-square chip. 96x96 PNG, transparent, crisp at 24px."
}, {
  "group": "Commanders",
  "file": "public/assets/commanders/portrait-1.png",
  "spec": "512x512 PNG",
  "read": "Recon-lit bust with strong jaw silhouette reads as a distinct named commander",
  "prompt": "A weathered older male field commander, grey buzzcut, a scar across one brow, hard stare, diverse and grounded, no exaggeration. Bust portrait, shoulders-up, recon side-lighting, muted military fatigues. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: desaturated olive #5c6347 and gunmetal #2a2f3a fatigues, skin kept natural. Lighting: low-angle directional recon key light, deep but readable shadow. Background: neutral dark gunmetal #2a2f3a studio background, slight vignette. 512x512 PNG."
}, {
  "group": "Commanders",
  "file": "public/assets/commanders/portrait-2.png",
  "spec": "512x512 PNG",
  "read": "Recon-lit bust with strong jaw silhouette reads as a distinct named commander",
  "prompt": "A stern female officer with tied-back dark hair and a worn beret, calm and unflinching, diverse and grounded, no exaggeration. Bust portrait, shoulders-up, recon side-lighting, muted military fatigues. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: desaturated olive #5c6347 and gunmetal #2a2f3a fatigues, skin kept natural. Lighting: low-angle directional recon key light, deep but readable shadow. Background: neutral dark gunmetal #2a2f3a studio background, slight vignette. 512x512 PNG."
}, {
  "group": "Commanders",
  "file": "public/assets/commanders/portrait-3.png",
  "spec": "512x512 PNG",
  "read": "Recon-lit bust with strong jaw silhouette reads as a distinct named commander",
  "prompt": "A young male sergeant with stubble and a dented helmet, soot on his jaw, diverse and grounded, no exaggeration. Bust portrait, shoulders-up, recon side-lighting, muted military fatigues. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: desaturated olive #5c6347 and gunmetal #2a2f3a fatigues, skin kept natural. Lighting: low-angle directional recon key light, deep but readable shadow. Background: neutral dark gunmetal #2a2f3a studio background, slight vignette. 512x512 PNG."
}, {
  "group": "Commanders",
  "file": "public/assets/commanders/portrait-4.png",
  "spec": "512x512 PNG",
  "read": "Recon-lit bust with strong jaw silhouette reads as a distinct named commander",
  "prompt": "A veteran female colonel with cropped grey hair and a leather eyepatch, composed, diverse and grounded, no exaggeration. Bust portrait, shoulders-up, recon side-lighting, muted military fatigues. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: desaturated olive #5c6347 and gunmetal #2a2f3a fatigues, skin kept natural. Lighting: low-angle directional recon key light, deep but readable shadow. Background: neutral dark gunmetal #2a2f3a studio background, slight vignette. 512x512 PNG."
}, {
  "group": "Commanders",
  "file": "public/assets/commanders/portrait-5.png",
  "spec": "512x512 PNG",
  "read": "Recon-lit bust with strong jaw silhouette reads as a distinct named commander",
  "prompt": "A broad-shouldered male heavy-ops soldier, shaved head, goggles pushed up on his forehead, diverse and grounded, no exaggeration. Bust portrait, shoulders-up, recon side-lighting, muted military fatigues. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: desaturated olive #5c6347 and gunmetal #2a2f3a fatigues, skin kept natural. Lighting: low-angle directional recon key light, deep but readable shadow. Background: neutral dark gunmetal #2a2f3a studio background, slight vignette. 512x512 PNG."
}, {
  "group": "Commanders",
  "file": "public/assets/commanders/portrait-6.png",
  "spec": "512x512 PNG",
  "read": "Recon-lit bust with strong jaw silhouette reads as a distinct named commander",
  "prompt": "A sharp female intelligence officer with thin glasses and a comms headset, focused, diverse and grounded, no exaggeration. Bust portrait, shoulders-up, recon side-lighting, muted military fatigues. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: desaturated olive #5c6347 and gunmetal #2a2f3a fatigues, skin kept natural. Lighting: low-angle directional recon key light, deep but readable shadow. Background: neutral dark gunmetal #2a2f3a studio background, slight vignette. 512x512 PNG."
}, {
  "group": "Commanders",
  "file": "public/assets/commanders/portrait-7.png",
  "spec": "512x512 PNG",
  "read": "Recon-lit bust with strong jaw silhouette reads as a distinct named commander",
  "prompt": "A grizzled male tank commander, oil-smeared face, a battered field cap, mid-40s, diverse and grounded, no exaggeration. Bust portrait, shoulders-up, recon side-lighting, muted military fatigues. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: desaturated olive #5c6347 and gunmetal #2a2f3a fatigues, skin kept natural. Lighting: low-angle directional recon key light, deep but readable shadow. Background: neutral dark gunmetal #2a2f3a studio background, slight vignette. 512x512 PNG."
}, {
  "group": "Commanders",
  "file": "public/assets/commanders/portrait-8.png",
  "spec": "512x512 PNG",
  "read": "Recon-lit bust with strong jaw silhouette reads as a distinct named commander",
  "prompt": "A calm female drone pilot with short hair and a visor pushed up, level gaze, diverse and grounded, no exaggeration. Bust portrait, shoulders-up, recon side-lighting, muted military fatigues. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: desaturated olive #5c6347 and gunmetal #2a2f3a fatigues, skin kept natural. Lighting: low-angle directional recon key light, deep but readable shadow. Background: neutral dark gunmetal #2a2f3a studio background, slight vignette. 512x512 PNG."
}, {
  "group": "Commanders",
  "file": "public/assets/commanders/frame-common.png",
  "spec": "512x512 PNG, transparent center",
  "read": "common tier signalled by the #8a92a3 accent; frame composites over any portrait",
  "prompt": "An ornamented square military rank frame border (common rarity) with corner insignia and an empty transparent center, brushed steel. Front-facing square decorative frame, even thickness, hollow middle. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: gunmetal #2a2f3a metal with #8a92a3 common accent. Lighting: even frontal light. Background: transparent center and outside the frame (PNG alpha). 512x512 PNG, transparent center."
}, {
  "group": "Commanders",
  "file": "public/assets/commanders/frame-rare.png",
  "spec": "512x512 PNG, transparent center",
  "read": "rare tier signalled by the #4a90d9 accent; frame composites over any portrait",
  "prompt": "An ornamented square military rank frame border (rare rarity) with corner insignia and an empty transparent center, sky-blue trim. Front-facing square decorative frame, even thickness, hollow middle. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: gunmetal #2a2f3a metal with #4a90d9 rare accent. Lighting: even frontal light. Background: transparent center and outside the frame (PNG alpha). 512x512 PNG, transparent center."
}, {
  "group": "Commanders",
  "file": "public/assets/commanders/frame-epic.png",
  "spec": "512x512 PNG, transparent center",
  "read": "epic tier signalled by the #8b5cf6 accent; frame composites over any portrait",
  "prompt": "An ornamented square military rank frame border (epic rarity) with corner insignia and an empty transparent center, violet inlay. Front-facing square decorative frame, even thickness, hollow middle. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: gunmetal #2a2f3a metal with #8b5cf6 epic accent. Lighting: even frontal light. Background: transparent center and outside the frame (PNG alpha). 512x512 PNG, transparent center."
}, {
  "group": "Commanders",
  "file": "public/assets/commanders/frame-legendary.png",
  "spec": "512x512 PNG, transparent center",
  "read": "legendary tier signalled by the #f5b301 accent; frame composites over any portrait",
  "prompt": "An ornamented square military rank frame border (legendary rarity) with corner insignia and an empty transparent center, amber gilt. Front-facing square decorative frame, even thickness, hollow middle. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: gunmetal #2a2f3a metal with #f5b301 legendary accent. Lighting: even frontal light. Background: transparent center and outside the frame (PNG alpha). 512x512 PNG, transparent center."
}, {
  "group": "Brand & Key Art",
  "file": "public/assets/brand/logo.svg",
  "spec": "SVG vector lockup, ~ exported 1024x256 PNG preview",
  "read": "Reads as a hard military mark at favicon size; convert the approved raster to clean SVG paths",
  "prompt": "The WARLANDS horizontal logo lockup: a condensed industrial stencil-adjacent uppercase wordmark WARLANDS beside a compact angular mark (a stylised fortified hex or chevron blade). Flat 2D vector lockup, sharp geometry, single-weight, designed to vectorise cleanly. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: amber #f5b301 wordmark on transparent, optional blood #9c2b2b accent notch (2 accents max). Lighting: flat, no lighting. Background: transparent (deliver as SVG; this prompt is the raster design reference). SVG vector lockup, ~ exported 1024x256 PNG preview."
}, {
  "group": "Brand & Key Art",
  "file": "public/assets/brand/mark.svg",
  "spec": "SVG vector, ~512x512 PNG preview",
  "read": "Must survive 16px favicon as a single readable silhouette",
  "prompt": "The standalone WARLANDS icon mark only: a single bold angular emblem (fortified hex / chevron blade), no text. Flat 2D vector emblem, one solid silhouette, app-icon ready. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: amber #f5b301 on gunmetal #2a2f3a. Lighting: flat, no lighting. Background: transparent or solid gunmetal tile for app icon. SVG vector, ~512x512 PNG preview."
}, {
  "group": "Brand & Key Art",
  "file": "public/assets/keyart/keyart.png",
  "spec": "2560x1440 PNG",
  "read": "Hero marketing frame; legible focal armies with negative space reserved for a headline",
  "prompt": "Key art of THE CRUCIBLE: a contested central warzone hex at amber dusk, two armies of tracked armor and infantry converging, oil fires and black smoke, a radar dish sweeping, distant industrial skyline. Cinematic wide establishing shot, grounded painterly-but-realistic, low-angle recon light, headline space kept clear at upper-left (composition not centred). Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: desaturated gunmetal #2a2f3a world with amber #f5b301 dusk and blood #9c2b2b fire as the only accents. Lighting: low-angle warm key from the horizon, long dramatic shadows, diesel haze. Background: full-bleed scene, no transparency. 2560x1440 PNG."
}, {
  "group": "Brand & Key Art",
  "file": "public/assets/brand/og.png",
  "spec": "1200x630 PNG",
  "read": "Stays legible as a 600px-wide thumbnail in a social feed",
  "prompt": "Social share card: the WARLANDS wordmark over a tight crop of the Crucible warzone hex with converging armor and a single oil fire. Horizontal social-card composition, wordmark upper-left, subject lower-right, safe margins. Gritty militarized near-future dieselpunk, lightly stylized for readability (not photoreal); weathered PBR materials (rust, oil, poured concrete, cold steel, sandbags); subtle film grain; desaturated world where color is a sparse signal; strong clean silhouette readable as solid black at 32px. Negative: no neon cyberpunk, no fantasy or magic FX, no glossy mobile-cartoon gloss, no centered subject floating on a gradient, no rainbow palette, no lens flare, no AI-melted detail. Palette: gunmetal #2a2f3a with amber #f5b301 and blood #9c2b2b accents only. Lighting: moody dusk key light, light haze. Background: full-bleed, no transparency. 1200x630 PNG."
}];
})(); } catch (e) { __ds_ns.__errors.push({ path: "asset-prompts/assets-data.js", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * WARLANDS Badge — compact status / ownership tag.
 * OWNED (amber), PROTOTYPE/enemy (blood), TIER (sky), etc.
 * Solid = strong signal; soft = tinted background with colored text.
 */
function Badge({
  children,
  tone = "amber",
  variant = "soft",
  icon,
  style,
  ...rest
}) {
  const tones = {
    amber: {
      solid: ["var(--amber)", "#0c0a04"],
      soft: ["rgba(245,179,1,0.16)", "var(--amber-text)"]
    },
    blood: {
      solid: ["var(--danger-strong)", "#fff"],
      soft: ["rgba(156,43,43,0.28)", "var(--blood-text)"]
    },
    sky: {
      solid: ["var(--sky)", "#06121f"],
      soft: ["rgba(74,144,217,0.18)", "var(--sky-text)"]
    },
    emerald: {
      solid: ["#15803d", "#eafff2"],
      soft: ["rgba(52,211,153,0.16)", "var(--emerald-text)"]
    },
    violet: {
      solid: ["var(--violet)", "#0c0a14"],
      soft: ["rgba(139,92,246,0.2)", "var(--violet-text)"]
    },
    teal: {
      solid: ["var(--teal)", "#04161a"],
      soft: ["rgba(63,154,166,0.2)", "var(--teal-text)"]
    },
    neutral: {
      solid: ["var(--surface-raised)", "var(--text-primary)"],
      soft: ["rgba(255,255,255,0.06)", "var(--text-secondary)"]
    }
  };
  const [bg, fg] = (tones[tone] || tones.amber)[variant] || tones.amber.soft;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      padding: "2px 7px",
      fontFamily: "var(--font-ui)",
      fontSize: "10px",
      fontWeight: "var(--fw-semibold)",
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      lineHeight: 1.4,
      color: fg,
      background: bg,
      borderRadius: "var(--radius-sm)",
      whiteSpace: "nowrap",
      ...style
    }
  }, rest), icon && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, icon), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * WARLANDS Button — the tactical action control.
 * Primary actions are amber with near-black text (the "$WAR / claim" CTA);
 * secondary/ghost recede; danger is blood-red; info is sky.
 */
function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  disabled = false,
  full = false,
  type = "button",
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const sizes = {
    sm: {
      padding: "4px 10px",
      fontSize: "11px",
      gap: "5px",
      radius: "var(--radius-sm)"
    },
    md: {
      padding: "8px 14px",
      fontSize: "13px",
      gap: "6px",
      radius: "var(--radius-sm)"
    },
    lg: {
      padding: "11px 18px",
      fontSize: "14px",
      gap: "8px",
      radius: "var(--radius-md)"
    }
  };
  const palettes = {
    primary: {
      bg: "var(--amber)",
      bgHover: "var(--cta-bg-hover)",
      fg: "var(--cta-fg)",
      border: "transparent"
    },
    secondary: {
      bg: "var(--surface-raised)",
      bgHover: "#222b3d",
      fg: "var(--text-primary)",
      border: "var(--hairline)"
    },
    danger: {
      bg: "var(--danger-strong)",
      bgHover: "#ef4444",
      fg: "#fff",
      border: "transparent"
    },
    info: {
      bg: "var(--sky)",
      bgHover: "#5a9ee0",
      fg: "#06121f",
      border: "transparent"
    },
    success: {
      bg: "#15803d",
      bgHover: "#16a34a",
      fg: "#eafff2",
      border: "transparent"
    },
    ghost: {
      bg: "transparent",
      bgHover: "rgba(255,255,255,0.05)",
      fg: "var(--text-secondary)",
      border: "transparent"
    },
    outline: {
      bg: "transparent",
      bgHover: "rgba(245,179,1,0.08)",
      fg: "var(--amber-text)",
      border: "rgba(245,179,1,0.4)"
    }
  };
  const s = sizes[size] || sizes.md;
  const p = palettes[variant] || palettes.primary;
  const base = {
    display: full ? "flex" : "inline-flex",
    width: full ? "100%" : "auto",
    alignItems: "center",
    justifyContent: "center",
    gap: s.gap,
    padding: s.padding,
    fontFamily: "var(--font-ui)",
    fontSize: s.fontSize,
    fontWeight: "var(--fw-semibold)",
    lineHeight: 1,
    letterSpacing: "0.01em",
    color: disabled ? "var(--text-muted)" : p.fg,
    background: disabled ? "var(--disabled)" : hover ? p.bgHover : p.bg,
    border: `1px solid ${disabled ? "transparent" : p.border}`,
    borderRadius: s.radius,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "background var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out)",
    transform: hover && !disabled ? "translateY(-1px)" : "none",
    userSelect: "none",
    whiteSpace: "nowrap",
    ...style
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: base
  }, rest), icon && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "1.05em",
      lineHeight: 1
    },
    "aria-hidden": "true"
  }, icon), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Panel.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * WARLANDS Panel — the bordered dark surface that frames every group of
 * controls (the rounded-lg border + panel background used across the HUD).
 * Optional ALL-CAPS title and an accent rim (e.g. amber for "your" panels,
 * blood for hostile-camp panels).
 */
function Panel({
  children,
  title,
  label,
  accent,
  rim,
  padding = "16px",
  style,
  headerRight,
  ...rest
}) {
  const rimColor = {
    amber: "rgba(245,179,1,0.3)",
    blood: "rgba(220,38,38,0.3)",
    sky: "rgba(74,144,217,0.3)",
    emerald: "rgba(52,211,153,0.3)"
  }[rim];
  return /*#__PURE__*/React.createElement("section", _extends({
    style: {
      background: "var(--surface-card)",
      border: `1px solid ${rimColor || "var(--border-default)"}`,
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--shadow-1), var(--edge-inset)",
      overflow: "hidden",
      ...style
    }
  }, rest), (title || label) && /*#__PURE__*/React.createElement("header", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 16px",
      borderBottom: "1px solid var(--border-default)",
      background: "rgba(0,0,0,0.18)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: title ? "13px" : "10px",
      fontWeight: "var(--fw-semibold)",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: accent ? "var(--amber-text)" : "var(--text-secondary)"
    }
  }, title || label), headerRight), /*#__PURE__*/React.createElement("div", {
    style: {
      padding
    }
  }, children));
}
Object.assign(__ds_scope, { Panel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Panel.jsx", error: String((e && e.message) || e) }); }

// components/core/Stat.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * WARLANDS Stat — a labelled numeric readout, as used in the top resource bar.
 * Micro uppercase label + a mono, tabular value tinted by accent. Numbers are
 * ALWAYS monospace in WARLANDS (resource counts, prices, timers, power).
 */
const ACCENTS = {
  amber: "var(--amber-text)",
  blood: "var(--blood-text)",
  sky: "var(--sky-text)",
  emerald: "var(--emerald-text)",
  violet: "var(--violet-text)",
  teal: "var(--teal-text)",
  neutral: "var(--text-secondary)"
};
function Stat({
  label,
  value,
  accent = "neutral",
  align = "row",
  size = "md",
  style,
  ...rest
}) {
  const valueSize = size === "lg" ? "18px" : size === "sm" ? "12px" : "14px";
  const isStacked = align === "stack";
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "flex",
      flexDirection: isStacked ? "column" : "row",
      alignItems: isStacked ? "flex-start" : "baseline",
      gap: isStacked ? "2px" : "6px",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "10px",
      fontWeight: "var(--fw-semibold)",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "var(--text-muted)",
      whiteSpace: "nowrap"
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontVariantNumeric: "tabular-nums",
      fontWeight: "var(--fw-semibold)",
      fontSize: valueSize,
      color: ACCENTS[accent] || ACCENTS.neutral,
      lineHeight: 1.1
    }
  }, value));
}
Object.assign(__ds_scope, { Stat });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Stat.jsx", error: String((e && e.message) || e) }); }

// components/game/ProgressBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * WARLANDS ProgressBar — season timer, upkeep, defense, build queue.
 * Thin track on a sunken surface; fill tinted by tone. Optional label row
 * with a mono value (e.g. "62%" or "48s remaining").
 */
const TONES = {
  amber: "var(--amber)",
  blood: "var(--danger-strong)",
  sky: "var(--sky)",
  emerald: "var(--success)",
  violet: "var(--violet)"
};
function ProgressBar({
  value = 0,
  max = 100,
  tone = "amber",
  label,
  valueText,
  height = 8,
  style,
  ...rest
}) {
  const pct = Math.max(0, Math.min(100, value / max * 100));
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      width: "100%",
      ...style
    }
  }, rest), (label || valueText) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: "5px"
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "10px",
      fontWeight: "var(--fw-semibold)",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "var(--text-muted)"
    }
  }, label), valueText != null && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontVariantNumeric: "tabular-nums",
      fontSize: "11px",
      color: "var(--text-secondary)"
    }
  }, valueText)), /*#__PURE__*/React.createElement("div", {
    role: "progressbar",
    "aria-valuenow": Math.round(pct),
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    style: {
      height: `${height}px`,
      width: "100%",
      background: "var(--surface-sunken)",
      borderRadius: "var(--radius-pill)",
      overflow: "hidden",
      boxShadow: "inset 0 1px 2px rgba(0,0,0,0.5)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      width: `${pct}%`,
      background: TONES[tone] || TONES.amber,
      borderRadius: "var(--radius-pill)",
      transition: "width var(--dur) var(--ease-out)"
    }
  })));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/game/ResourceChip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * WARLANDS ResourceChip — an icon + name + mono amount, the atom of the
 * stockpile, recipes, loot and order-book. Tier sets a frame treatment:
 * raw = plain, intermediate = bracketed (hairline), finished = badged
 * (amber edge). Never rely on color alone — the emoji icon carries identity.
 */
function ResourceChip({
  icon,
  name,
  amount,
  tier = "raw",
  size = "md",
  style,
  ...rest
}) {
  const frames = {
    raw: {
      border: "1px solid var(--hairline)",
      background: "rgba(255,255,255,0.03)"
    },
    intermediate: {
      border: "1px solid var(--border-strong)",
      background: "var(--surface-raised)"
    },
    finished: {
      border: "1px solid rgba(245,179,1,0.35)",
      background: "rgba(245,179,1,0.06)"
    }
  };
  const pad = size === "sm" ? "3px 7px" : "5px 9px";
  const fs = size === "sm" ? "11px" : "12px";
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "8px",
      padding: pad,
      borderRadius: "var(--radius-sm)",
      fontFamily: "var(--font-ui)",
      fontSize: fs,
      color: "var(--text-secondary)",
      ...(frames[tier] || frames.raw),
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      whiteSpace: "nowrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      fontSize: "1.05em"
    }
  }, icon), name && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-primary)"
    }
  }, name)), amount != null && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontVariantNumeric: "tabular-nums",
      color: "var(--text-hi)",
      fontWeight: "var(--fw-medium)"
    }
  }, amount));
}
Object.assign(__ds_scope, { ResourceChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/ResourceChip.jsx", error: String((e && e.message) || e) }); }

// components/game/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * WARLANDS Tabs — the primary view switcher (World · Market · Allegiance ·
 * Season). Active tab is solid amber with near-black text; inactive tabs are
 * muted and lift on hover. Tabs carry an emoji icon.
 */
function Tabs({
  tabs = [],
  value,
  onChange,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(null);
  return /*#__PURE__*/React.createElement("nav", _extends({
    style: {
      display: "flex",
      gap: "4px",
      padding: "6px 12px",
      borderBottom: "1px solid var(--border-default)",
      background: "var(--bg-app)",
      ...style
    }
  }, rest), tabs.map(t => {
    const active = t.id === value;
    const isHover = hover === t.id && !active;
    return /*#__PURE__*/React.createElement("button", {
      key: t.id,
      onClick: () => onChange && onChange(t.id),
      onMouseEnter: () => setHover(t.id),
      onMouseLeave: () => setHover(null),
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "5px 12px",
        border: "none",
        borderRadius: "var(--radius-sm)",
        fontFamily: "var(--font-ui)",
        fontSize: "12px",
        fontWeight: "var(--fw-semibold)",
        cursor: "pointer",
        whiteSpace: "nowrap",
        color: active ? "#0c0a04" : isHover ? "var(--text-primary)" : "var(--text-secondary)",
        background: active ? "var(--amber)" : isHover ? "var(--surface-raised)" : "transparent",
        transition: "background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)"
      }
    }, t.icon && /*#__PURE__*/React.createElement("span", {
      "aria-hidden": "true"
    }, t.icon), t.label);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/warlands-game/App.jsx
try { (() => {
/* WARLANDS UI kit — game shell orchestrator. */
const R = 4;
function GameShell() {
  const {
    TERRAIN,
    BUILD,
    RES,
    fmt
  } = window.WL;
  const hexes = React.useMemo(() => window.WL.buildWorld(R), []);
  const [view, setView] = React.useState("map");
  const [selected, setSelected] = React.useState(null);
  const [plots, setPlots] = React.useState({});
  const [defeated, setDefeated] = React.useState({});
  const [war, setWar] = React.useState(85000);
  const [staked, setStaked] = React.useState(0);
  const [burned, setBurned] = React.useState(0);
  const [pool, setPool] = React.useState(4200);
  const [tick, setTick] = React.useState(128);
  const [log, setLog] = React.useState(["Welcome, Commander. Claim your first plot to begin.", "Hostile camps seeded toward the Crucible (💀)."]);
  const push = line => setLog(l => [line, ...l].slice(0, 30));

  // gentle tick so the HUD feels alive
  React.useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 2200);
    return () => clearInterval(id);
  }, []);
  const hex = selected ? hexes.find(h => h.key === selected) : null;
  const plot = selected ? plots[selected] : null;
  function claim(h) {
    const def = TERRAIN[h.terrain];
    if (war < def.stake) return;
    setWar(w => w - def.stake);
    setStaked(s => s + def.stake);
    setPlots(p => ({
      ...p,
      [h.key]: {
        terrain: h.terrain,
        name: `${def.name.split(" ")[0]} Outpost`,
        claimIndex: Object.keys(p).length + 1,
        defense: Math.round(def.def * 60),
        buildings: ["camp"],
        stock: {
          food: 120,
          wood: 80
        }
      }
    }));
    push(`🏕️ Claimed ${def.name} at (${h.q}, ${h.r}) — staked ${fmt(def.stake)} $WAR.`);
  }
  function buildOn(key, id) {
    if (war < BUILD[id].cost) return;
    setWar(w => w - BUILD[id].cost);
    setPlots(p => ({
      ...p,
      [key]: {
        ...p[key],
        buildings: [...p[key].buildings, id]
      }
    }));
    push(`🔨 Built ${BUILD[id].n}.`);
  }
  function unstake(key) {
    const def = TERRAIN[plots[key].terrain];
    const ret = Math.round(def.stake * 0.97);
    const fee = def.stake - ret;
    setWar(w => w + ret);
    setStaked(s => s - def.stake);
    setBurned(b => b + Math.round(fee / 2));
    setPool(p => p + Math.round(fee / 2));
    setPlots(p => {
      const n = {
        ...p
      };
      delete n[key];
      return n;
    });
    setSelected(key);
    push(`↩️ Unstaked plot — ${fmt(ret)} $WAR returned (3% fee).`);
  }
  function scout() {
    if (war < 50) return;
    setWar(w => w - 50);
    setBurned(b => b + 25);
    setPool(p => p + 25);
    push("🔭 Scouted hostile camp — garrison revealed.");
  }
  function raid() {
    if (!hex) return;
    setDefeated(d => ({
      ...d,
      [hex.key]: true
    }));
    push(`⚔️ VICTORY — hostile camp at (${hex.q}, ${hex.r}) cleared. Loot hauled back.`);
  }
  function trade(verb, item, qty, price) {
    const gross = qty * price;
    const fee = Math.round(gross * 0.04);
    if (verb === "Bought") setWar(w => w - Math.round(gross) - fee);else setWar(w => w + Math.round(gross) - fee);
    setBurned(b => b + Math.round(fee / 2));
    setPool(p => p + Math.round(fee / 2));
    push(`💱 ${verb} ${qty} ${RES[item].i} ${RES[item].n} @ ${price.toFixed(2)} (fee ${fee} $WAR).`);
  }
  const TABS = [{
    id: "map",
    label: "World",
    icon: "🗺️"
  }, {
    id: "market",
    label: "Market",
    icon: "💱"
  }, {
    id: "allegiance",
    label: "Allegiance",
    icon: "🤝"
  }, {
    id: "season",
    label: "Season",
    icon: "🏆"
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      height: "100dvh",
      background: "var(--panel-void)",
      color: "var(--text-hi)"
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    war: war,
    staked: staked,
    burned: burned,
    pool: pool,
    plots: Object.keys(plots).length,
    tick: tick
  }), /*#__PURE__*/React.createElement(Tabs, {
    tabs: TABS,
    value: view,
    onChange: setView
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      minHeight: 0,
      flex: 1
    }
  }, view === "map" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("main", {
    style: {
      position: "relative",
      minWidth: 0,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(HexMap, {
    hexes: hexes,
    plots: plots,
    selected: selected,
    onSelect: setSelected,
    defeated: defeated,
    R: R
  })), /*#__PURE__*/React.createElement("aside", {
    style: {
      display: "flex",
      flexDirection: "column",
      width: 360,
      borderLeft: "1px solid var(--hairline)",
      background: "var(--panel)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: 0,
      flex: 1,
      overflowY: "auto"
    }
  }, /*#__PURE__*/React.createElement(PlotPanel, {
    hex: hex,
    plot: plot,
    war: war,
    defeated: defeated,
    onClaim: claim,
    onBuild: buildOn,
    onScout: scout,
    onRaid: raid,
    onUnstake: unstake
  })), /*#__PURE__*/React.createElement(EventLog, {
    log: log
  }))) : /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: 0,
      flex: 1,
      overflowY: "auto"
    }
  }, view === "market" && /*#__PURE__*/React.createElement(MarketPanel, {
    war: war,
    onTrade: trade
  }), view === "season" && /*#__PURE__*/React.createElement(SeasonPanel, {
    pool: pool,
    burned: burned,
    plots: plots,
    war: war
  }), view === "allegiance" && /*#__PURE__*/React.createElement(AllegianceStub, null))));
}
function AllegianceStub() {
  const {
    Panel,
    Badge,
    Button
  } = window.WARLANDSDesignSystem_e0d283;
  const orgs = [{
    name: "Iron Concord",
    gov: "council",
    members: 13,
    treasury: "32,000",
    b: "🏛️ 🏰"
  }, {
    name: "Crimson Pact",
    gov: "weighted",
    members: 9,
    treasury: "44,000",
    b: "🏛️ 🔬 📡"
  }, {
    name: "Desert Wolves",
    gov: "democracy",
    members: 11,
    treasury: "20,000",
    b: "🏛️ 🏰"
  }, {
    name: "Northern Vanguard",
    gov: "founder",
    members: 7,
    treasury: "56,000",
    b: "🏛️ 🔬 📡"
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 760,
      margin: "0 auto",
      padding: 22
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 22,
      fontWeight: 700,
      textTransform: "uppercase",
      color: "var(--amber)",
      margin: "0 0 4px"
    }
  }, "Allegiances"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: "var(--text-muted)",
      margin: "0 0 18px"
    }
  }, "Political/military/economic orgs. Pool specialization, treasury & defense. Buildings grant region-wide buffs (GDD \xA710\u201311)."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, orgs.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.name,
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      border: "1px solid var(--hairline)",
      borderRadius: "var(--radius-lg)",
      background: "var(--panel)",
      padding: "14px 16px"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700
    }
  }, a.name, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      textTransform: "uppercase",
      color: "var(--text-muted)",
      letterSpacing: "0.06em"
    }
  }, a.gov)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-muted)",
      marginTop: 2
    }
  }, a.members, " members \xB7 treasury ", a.treasury, " $WAR \xB7 ", a.b)), /*#__PURE__*/React.createElement(Button, {
    variant: "info",
    size: "sm"
  }, "Join")))));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(GameShell, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/warlands-game/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/warlands-game/HexMap.jsx
try { (() => {
/* WARLANDS UI kit — interactive SVG hex world map. */
const {
  useMemo,
  useRef,
  useState,
  useCallback
} = React;
function hexPoints(cx, cy, size) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 180 * (60 * i - 90); // pointy-top
    pts.push((cx + size * Math.cos(a)).toFixed(1) + "," + (cy + size * Math.sin(a)).toFixed(1));
  }
  return pts.join(" ");
}
function HexMap({
  hexes,
  plots,
  selected,
  onSelect,
  defeated,
  R
}) {
  const {
    TERRAIN,
    SIZE,
    zoneOf
  } = window.WL;
  const [view, setView] = useState({
    x: 0,
    y: 0,
    scale: 1
  });
  const [drag, setDrag] = useState(false);
  const dref = useRef(null);
  const bounds = useMemo(() => {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    hexes.forEach(h => {
      minX = Math.min(minX, h.x);
      minY = Math.min(minY, h.y);
      maxX = Math.max(maxX, h.x);
      maxY = Math.max(maxY, h.y);
    });
    return {
      minX,
      minY,
      maxX,
      maxY
    };
  }, [hexes]);
  const width = bounds.maxX - bounds.minX + SIZE * 4;
  const height = bounds.maxY - bounds.minY + SIZE * 4;
  const offX = -bounds.minX + SIZE * 2;
  const offY = -bounds.minY + SIZE * 2;
  const onWheel = useCallback(e => {
    setView(v => ({
      ...v,
      scale: Math.min(2.2, Math.max(0.55, v.scale - e.deltaY * 0.0012))
    }));
  }, []);
  const onDown = e => {
    dref.current = {
      sx: e.clientX,
      sy: e.clientY,
      ox: view.x,
      oy: view.y
    };
    setDrag(true);
  };
  const onMove = e => {
    if (!dref.current) return;
    const d = dref.current;
    setView(v => ({
      ...v,
      x: d.ox + (e.clientX - d.sx),
      y: d.oy + (e.clientY - d.sy)
    }));
  };
  const onUp = () => {
    dref.current = null;
    setDrag(false);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      height: "100%",
      width: "100%",
      overflow: "hidden",
      background: "var(--panel-void)"
    },
    onWheel: onWheel,
    onMouseDown: onDown,
    onMouseMove: onMove,
    onMouseUp: onUp,
    onMouseLeave: onUp
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "radial-gradient(circle at 50% 50%, rgba(156,43,43,0.22), transparent 42%)",
      pointerEvents: "none"
    }
  }), /*#__PURE__*/React.createElement("svg", {
    width: "100%",
    height: "100%",
    viewBox: `0 0 ${width} ${height}`,
    style: {
      transform: `translate(${view.x}px,${view.y}px) scale(${view.scale})`,
      cursor: drag ? "grabbing" : "grab"
    }
  }, hexes.map(h => {
    const owned = plots[h.key];
    const npcActive = h.npc && !defeated[h.key];
    const def = TERRAIN[h.terrain];
    const isSel = selected === h.key;
    const zone = zoneOf(h.ring, R);
    const cx = h.x + offX,
      cy = h.y + offY;
    let stroke = "#1c2433",
      sw = 1;
    if (isSel) {
      stroke = "#ffd24a";
      sw = 3;
    } else if (owned) {
      stroke = "#facc15";
      sw = 2;
    } else if (npcActive) {
      stroke = "#dc2626";
      sw = 2;
    }
    return /*#__PURE__*/React.createElement("g", {
      key: h.key,
      onClick: e => {
        e.stopPropagation();
        onSelect(h.key);
      },
      style: {
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement("polygon", {
      points: hexPoints(cx, cy, SIZE - 1),
      fill: def.color,
      fillOpacity: owned ? 1 : 0.6,
      stroke: stroke,
      strokeWidth: sw,
      style: {
        transition: "fill-opacity .15s"
      }
    }), owned && /*#__PURE__*/React.createElement("text", {
      x: cx,
      y: cy + 5,
      textAnchor: "middle",
      fontSize: 15,
      style: {
        pointerEvents: "none"
      }
    }, "\uD83C\uDFD5\uFE0F"), !owned && npcActive && /*#__PURE__*/React.createElement("text", {
      x: cx,
      y: cy + 5,
      textAnchor: "middle",
      fontSize: 13,
      style: {
        pointerEvents: "none"
      }
    }, "\uD83D\uDC80"), zone === "crucible" && !owned && !npcActive && /*#__PURE__*/React.createElement("text", {
      x: cx,
      y: cy + 4,
      textAnchor: "middle",
      fontSize: 11,
      fill: "#fff",
      fillOpacity: 0.45,
      style: {
        pointerEvents: "none"
      }
    }, "\u2694"));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 12,
      top: 12,
      pointerEvents: "none",
      background: "rgba(0,0,0,0.6)",
      borderRadius: "var(--radius-md)",
      padding: "8px 11px",
      border: "1px solid var(--hairline)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 11,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: "var(--amber-text)",
      fontWeight: 600
    }
  }, "Live World Map"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-lo)",
      marginTop: 2
    }
  }, "Drag to pan \xB7 scroll to zoom \xB7 click a hex"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "var(--text-muted)",
      marginTop: 5,
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u2694 Crucible \u2014 center, high risk"), /*#__PURE__*/React.createElement("span", null, "edge = newbie ring"))));
}
window.HexMap = HexMap;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/warlands-game/HexMap.jsx", error: String((e && e.message) || e) }); }

// ui_kits/warlands-game/Panels.jsx
try { (() => {
/* WARLANDS UI kit — HUD panels. Compose the design-system primitives. */
const DS = window.WARLANDSDesignSystem_e0d283;
const {
  Button,
  Badge,
  Stat,
  Panel,
  ResourceChip,
  ProgressBar,
  Tabs
} = DS;

/* ---------------- Top resource bar ---------------- */
function TopBar({
  war,
  staked,
  burned,
  pool,
  plots,
  tick
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "9px 16px",
      borderBottom: "1px solid var(--hairline)",
      background: "var(--panel-void)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: 19,
      letterSpacing: "-0.01em",
      textTransform: "uppercase",
      color: "var(--amber)"
    }
  }, "WARLANDS"), /*#__PURE__*/React.createElement(Badge, {
    tone: "blood",
    variant: "solid"
  }, "Prototype")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Stat, {
    label: "$WAR",
    value: window.WL.fmt(war),
    accent: "amber"
  }), /*#__PURE__*/React.createElement(Stat, {
    label: "Staked",
    value: window.WL.fmt(staked),
    accent: "sky"
  }), /*#__PURE__*/React.createElement(Stat, {
    label: "Burned",
    value: window.WL.fmt(burned),
    accent: "blood"
  }), /*#__PURE__*/React.createElement(Stat, {
    label: "Pool",
    value: window.WL.fmt(pool),
    accent: "emerald"
  }), /*#__PURE__*/React.createElement(Stat, {
    label: "Plots",
    value: String(plots),
    accent: "emerald"
  }), /*#__PURE__*/React.createElement(Stat, {
    label: "S3\xB7t",
    value: String(tick),
    accent: "neutral"
  })));
}

/* ---------------- Event log ---------------- */
function EventLog({
  log
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: "1px solid var(--hairline)",
      background: "rgba(8,11,17,0.8)",
      padding: "9px 14px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: "var(--text-muted)",
      marginBottom: 5
    }
  }, "Event Log"), /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: 88,
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      gap: 2
    }
  }, log.map((line, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      fontSize: 12,
      color: i === 0 ? "var(--text-hi)" : "var(--text-lo)"
    }
  }, line))));
}

/* ---------------- Plot inspector / claim ---------------- */
function Row({
  label,
  value
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-muted)"
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-hi)"
    }
  }, value));
}
function PlotPanel({
  hex,
  plot,
  war,
  defeated,
  onClaim,
  onBuild,
  onScout,
  onRaid,
  onUnstake,
  claimIndex
}) {
  const {
    TERRAIN,
    BUILD,
    RES,
    fmt
  } = window.WL;
  if (!hex) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 18,
        fontSize: 13,
        color: "var(--text-lo)"
      }
    }, "Select a hex on the map to inspect or claim it.");
  }
  const def = TERRAIN[hex.terrain];
  const npcActive = hex.npc && !defeated[hex.key];
  if (!plot) {
    const canAfford = war >= def.stake;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 16
      }
    }, npcActive && /*#__PURE__*/React.createElement(Panel, {
      label: "\u2694 Hostile Camp",
      rim: "blood",
      padding: "12px",
      headerRight: /*#__PURE__*/React.createElement(Badge, {
        tone: "blood"
      }, "Tier ", hex.npcTier)
    }, /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 12,
        color: "var(--text-lo)",
        margin: "0 0 10px"
      }
    }, "Unknown strength. Scout first (50 $WAR) to reveal the garrison."), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "info",
      size: "sm",
      icon: "\uD83D\uDD2D",
      onClick: onScout
    }, "Scout (50$)"), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "sm",
      icon: "\uD83D\uDDE1\uFE0F",
      onClick: onRaid
    }, "Raid"), /*#__PURE__*/React.createElement(Button, {
      variant: "danger",
      size: "sm",
      icon: "\uD83C\uDFF0",
      onClick: onRaid
    }, "Siege"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-display)",
        fontSize: 19,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.01em",
        color: def.color
      }
    }, def.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "var(--text-muted)"
      }
    }, "Hex (", hex.q, ", ", hex.r, ") \xB7 ring ", hex.ring)), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 13,
        color: "var(--text-lo)",
        margin: 0,
        lineHeight: 1.5
      }
    }, def.blurb), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 4,
        background: "rgba(26,32,48,0.5)",
        borderRadius: "var(--radius-md)",
        padding: 12
      }
    }, /*#__PURE__*/React.createElement(Row, {
      label: "Stake to claim",
      value: `${fmt(def.stake)} $WAR`
    }), /*#__PURE__*/React.createElement(Row, {
      label: "Defense mult",
      value: `×${def.def}`
    }), /*#__PURE__*/React.createElement(Row, {
      label: "Reward mult",
      value: `×${def.reward}`
    }), /*#__PURE__*/React.createElement(Row, {
      label: "Protection",
      value: hex.terrain === "warzone" ? "never (warzone)" : "eligible"
    })), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      full: true,
      disabled: !canAfford,
      icon: "\u2694\uFE0F",
      onClick: () => onClaim(hex)
    }, canAfford ? `Stake ${fmt(def.stake)} $WAR & Claim` : "Insufficient $WAR"), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 11,
        color: "var(--text-muted)",
        margin: 0,
        lineHeight: 1.5
      }
    }, "Staked $WAR is ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--text-lo)"
      }
    }, "locked, never spent"), ". You get it back on unstake (minus a small fee). It can never be looted."));
  }

  // Owned
  const slotCap = 5;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16,
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 18,
      fontWeight: 700,
      textTransform: "uppercase",
      color: def.color
    }
  }, plot.name), /*#__PURE__*/React.createElement(Badge, {
    tone: "amber"
  }, "Owned")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-muted)",
      marginTop: 2
    }
  }, def.name, " \xB7 staked ", fmt(def.stake), " $WAR \xB7 plot #", plot.claimIndex), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      marginTop: 4,
      color: "var(--text-lo)"
    }
  }, "Defense: ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--emerald-text)"
    }
  }, plot.defense, "%"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: "var(--text-muted)",
      marginBottom: 7
    }
  }, "Stockpile"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 6
    }
  }, Object.entries(plot.stock).map(([r, v]) => /*#__PURE__*/React.createElement(ResourceChip, {
    key: r,
    icon: RES[r].i,
    name: RES[r].n,
    amount: fmt(v),
    tier: RES[r].t,
    size: "sm"
  })))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 7
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: "var(--text-muted)"
    }
  }, "Buildings"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-muted)"
    }
  }, "slots ", plot.buildings.length, "/", slotCap)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 4
    }
  }, plot.buildings.map((b, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "rgba(26,32,48,0.5)",
      borderRadius: "var(--radius-sm)",
      padding: "7px 9px",
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("span", null, BUILD[b].i, " ", BUILD[b].n, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-muted)"
    }
  }, "L1")), /*#__PURE__*/React.createElement(Badge, {
    tone: "sky"
  }, "Active"))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: "var(--text-muted)",
      marginBottom: 7
    }
  }, "Construct"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 4
    }
  }, def.build.filter(id => !plot.buildings.includes(id)).map(id => {
    const blocked = plot.buildings.length >= slotCap || war < BUILD[id].cost;
    return /*#__PURE__*/React.createElement("button", {
      key: id,
      disabled: blocked,
      onClick: () => onBuild(hex.key, id),
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(26,32,48,0.6)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-sm)",
        padding: "7px 9px",
        fontSize: 12,
        color: "var(--text-hi)",
        cursor: blocked ? "not-allowed" : "pointer",
        opacity: blocked ? 0.4 : 1,
        fontFamily: "var(--font-ui)"
      }
    }, /*#__PURE__*/React.createElement("span", null, BUILD[id].i, " ", BUILD[id].n), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        color: "var(--text-lo)"
      }
    }, BUILD[id].cost, "$"));
  }))), /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    full: true,
    size: "sm",
    onClick: () => onUnstake(hex.key)
  }, "Unstake plot (return ", fmt(def.stake * 0.97), " $WAR \xB7 3% fee)"));
}

/* ---------------- Marketplace ---------------- */
function MarketPanel({
  war,
  onTrade
}) {
  const {
    RES,
    REF,
    fmt
  } = window.WL;
  const [tab, setTab] = React.useState("raw");
  const [qty, setQty] = React.useState(50);
  const items = Object.keys(RES).filter(r => RES[r].t === tab);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 760,
      margin: "0 auto",
      padding: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 22,
      fontWeight: 700,
      textTransform: "uppercase",
      color: "var(--amber)",
      margin: 0
    }
  }, "Open Marketplace"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 12,
      color: "var(--text-muted)"
    }
  }, /*#__PURE__*/React.createElement("span", null, "Trade size"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: qty,
    min: 1,
    onChange: e => setQty(Math.max(1, Number(e.target.value) || 1)),
    style: {
      width: 72,
      background: "var(--panel-2)",
      border: "1px solid var(--hairline)",
      borderRadius: "var(--radius-sm)",
      padding: "5px 8px",
      textAlign: "right",
      fontFamily: "var(--font-mono)",
      color: "var(--text-hi)"
    }
  }))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: "var(--text-muted)",
      margin: "0 0 16px"
    }
  }, "Player-driven order book. 4% transaction fee + 5 $WAR listing fee are token sinks (\xBD burned, \xBD to the season reward pool)."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    tabs: [{
      id: "raw",
      label: "Raw"
    }, {
      id: "intermediate",
      label: "Intermediate"
    }, {
      id: "finished",
      label: "Finished"
    }],
    value: tab,
    onChange: setTab,
    style: {
      border: "1px solid var(--hairline)",
      borderRadius: "var(--radius-md)",
      display: "inline-flex"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      border: "1px solid var(--hairline)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("thead", {
    style: {
      background: "var(--panel)"
    }
  }, /*#__PURE__*/React.createElement("tr", {
    style: {
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      color: "var(--text-muted)"
    }
  }, /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "left",
      padding: "9px 12px"
    }
  }, "Item"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "right",
      padding: "9px 8px"
    }
  }, "Bid"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "right",
      padding: "9px 8px"
    }
  }, "Ref"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "right",
      padding: "9px 8px"
    }
  }, "Ask"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "right",
      padding: "9px 12px"
    }
  }, "Trade"))), /*#__PURE__*/React.createElement("tbody", null, items.map(it => {
    const ref = REF[it];
    return /*#__PURE__*/React.createElement("tr", {
      key: it,
      style: {
        borderTop: "1px solid var(--hairline)"
      }
    }, /*#__PURE__*/React.createElement("td", {
      style: {
        padding: "9px 12px"
      }
    }, RES[it].i, " ", RES[it].n), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: "9px 8px",
        textAlign: "right",
        fontFamily: "var(--font-mono)",
        color: "var(--emerald-text)"
      }
    }, (ref * 0.97).toFixed(2)), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: "9px 8px",
        textAlign: "right",
        fontFamily: "var(--font-mono)",
        color: "var(--text-muted)"
      }
    }, ref.toFixed(2)), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: "9px 8px",
        textAlign: "right",
        fontFamily: "var(--font-mono)",
        color: "var(--blood-text)"
      }
    }, (ref * 1.04).toFixed(2)), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: "9px 12px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "flex-end",
        gap: 5
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "success",
      size: "sm",
      onClick: () => onTrade("Bought", it, qty, ref * 1.04)
    }, "Buy"), /*#__PURE__*/React.createElement(Button, {
      variant: "danger",
      size: "sm",
      onClick: () => onTrade("Sold", it, qty, ref * 0.97)
    }, "Sell"))));
  })))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 11,
      color: "var(--text-muted)",
      marginTop: 12
    }
  }, "Buy fills the cheapest asks; Sell hits the best bids. Prices drift each tick and AI liquidity refreshes \u2014 in the full game these orders are other players (GDD \xA77)."));
}

/* ---------------- Season ---------------- */
function SeasonPanel({
  pool,
  burned,
  plots,
  war
}) {
  const {
    fmt
  } = window.WL;
  const territory = Object.values(plots).reduce((s, p) => s + Math.round(window.WL.TERRAIN[p.terrain].reward * 100), 0);
  const score = {
    econ: 2840,
    military: 1200,
    territory,
    allegiance: 640
  };
  const total = score.econ + score.military + score.territory + score.allegiance;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 640,
      margin: "0 auto",
      padding: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 22,
      fontWeight: 700,
      textTransform: "uppercase",
      color: "var(--amber)",
      margin: 0
    }
  }, "Season 3"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-muted)"
    }
  }, "148s remaining")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: "var(--text-muted)",
      margin: "0 0 18px"
    }
  }, "Rewards are redistributed sinks \u2014 payouts can never exceed what the season's sinks collected (GDD \xA712.2)."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(ProgressBar, {
    value: 62,
    tone: "amber"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    padding: "14px"
  }, /*#__PURE__*/React.createElement(Stat, {
    label: "Season Reward Pool (sink-funded)",
    value: `${fmt(pool)} $WAR`,
    accent: "emerald",
    align: "stack",
    size: "lg"
  })), /*#__PURE__*/React.createElement(Panel, {
    padding: "14px"
  }, /*#__PURE__*/React.createElement(Stat, {
    label: "Total $WAR Burned (all sinks)",
    value: `${fmt(burned)} $WAR`,
    accent: "blood",
    align: "stack",
    size: "lg"
  }))), /*#__PURE__*/React.createElement(Panel, {
    title: "Your Season Score"
  }, [["w₁", "Economic output (goods sold)", score.econ], ["w₂", "Military (raids & sieges won)", score.military], ["w₃", "Territory (control × reward mult)", score.territory], ["w₄", "Allegiance contribution (CS)", score.allegiance]].map(([w, l, v]) => /*#__PURE__*/React.createElement("div", {
    key: w,
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "5px 0",
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-lo)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-muted)"
    }
  }, w), " ", l), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      color: "var(--text-hi)"
    }
  }, fmt(v)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      borderTop: "1px solid var(--hairline)",
      marginTop: 8,
      paddingTop: 9,
      fontWeight: 700,
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("span", null, "Total Score"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      color: "var(--amber-text)"
    }
  }, fmt(total)))));
}
Object.assign(window, {
  TopBar,
  EventLog,
  PlotPanel,
  MarketPanel,
  SeasonPanel
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/warlands-game/Panels.jsx", error: String((e && e.message) || e) }); }

// ui_kits/warlands-game/data.js
try { (() => {
/* WARLANDS UI kit — game content & world gen.
   Names, icons, stakes, terrain colors and recipes are lifted verbatim from
   the WARLANDS prototype (src/game/*). Plain globals on window.WL. */
(function () {
  // ---- Terrain (GDD §4) ----
  const TERRAIN = {
    plains: {
      name: "Basic Plot",
      stake: 10000,
      color: "#7c8a4f",
      icon: "🌾",
      reward: 1.0,
      def: 1.0,
      blurb: "Balanced starter land. +5% build speed.",
      build: ["farm", "lumberCamp", "quarry"]
    },
    forest: {
      name: "Forest Plot",
      stake: 12500,
      color: "#2f5d3a",
      icon: "🌲",
      reward: 1.1,
      def: 1.1,
      blurb: "+15% wood, early growth, defender ambush bonus.",
      build: ["lumberCamp", "farm", "well"]
    },
    river: {
      name: "River Plot",
      stake: 15000,
      color: "#2c6f8c",
      icon: "💧",
      reward: 1.15,
      def: 1.0,
      blurb: "+20% food, +15% water, −10% market fees.",
      build: ["farm", "well", "lumberCamp"]
    },
    mountain: {
      name: "Mountain Plot",
      stake: 20000,
      color: "#6b6f78",
      icon: "⛰️",
      reward: 1.25,
      def: 1.3,
      blurb: "+25% iron, +20% stone, +30% defense.",
      build: ["ironMine", "quarry"]
    },
    desert: {
      name: "Oil Desert Plot",
      stake: 25000,
      color: "#c9a14a",
      icon: "🛢️",
      reward: 1.3,
      def: 0.9,
      blurb: "+30% oil, exposed (weak natural defense).",
      build: ["oilDerrick", "mineralMine"]
    },
    coastal: {
      name: "Coastal Trade Plot",
      stake: 30000,
      color: "#3f9aa6",
      icon: "⚓",
      reward: 1.4,
      def: 1.0,
      blurb: "−20% transport cost, sea routes, trade hub.",
      build: ["farm", "well", "mineralMine"]
    },
    industrial: {
      name: "Industrial Plot",
      stake: 40000,
      color: "#8a5a3c",
      icon: "🏭",
      reward: 1.6,
      def: 1.0,
      blurb: "+25% factory efficiency, +1 factory slot.",
      build: ["quarry", "ironMine"]
    },
    techRuins: {
      name: "Technology Ruins Plot",
      stake: 50000,
      color: "#5b4b8a",
      icon: "🛸",
      reward: 1.8,
      def: 1.0,
      blurb: "+30% research, +data chips, rare blueprints.",
      build: ["dataExcavator", "mineralMine"]
    },
    warzone: {
      name: "Warzone Plot",
      stake: 60000,
      color: "#9c2b2b",
      icon: "⚔️",
      reward: 2.5,
      def: 0.9,
      blurb: "+40% all yields, season-point ×2.5. No protection.",
      build: ["oilDerrick", "ironMine", "mineralMine"]
    }
  };

  // ---- Resources (GDD §5) ----
  const RES = {
    food: {
      n: "Food",
      i: "🌾",
      t: "raw"
    },
    water: {
      n: "Water",
      i: "💧",
      t: "raw"
    },
    wood: {
      n: "Wood",
      i: "🪵",
      t: "raw"
    },
    stone: {
      n: "Stone",
      i: "🪨",
      t: "raw"
    },
    iron: {
      n: "Iron",
      i: "⛓️",
      t: "raw"
    },
    rareMinerals: {
      n: "Rare Minerals",
      i: "💎",
      t: "raw"
    },
    oil: {
      n: "Oil",
      i: "🛢️",
      t: "raw"
    },
    dataChips: {
      n: "Data Chips",
      i: "💽",
      t: "raw"
    },
    fuel: {
      n: "Fuel",
      i: "⛽",
      t: "intermediate"
    },
    steel: {
      n: "Steel",
      i: "🔩",
      t: "intermediate"
    },
    electronics: {
      n: "Electronics",
      i: "🔌",
      t: "intermediate"
    },
    machineParts: {
      n: "Machine Parts",
      i: "⚙️",
      t: "intermediate"
    },
    ammunition: {
      n: "Ammunition",
      i: "🧨",
      t: "intermediate"
    },
    chemicals: {
      n: "Chemicals",
      i: "🧪",
      t: "intermediate"
    },
    rifles: {
      n: "Rifles",
      i: "🔫",
      t: "finished"
    },
    tanks: {
      n: "Tanks",
      i: "🛡️",
      t: "finished"
    },
    drones: {
      n: "Drones",
      i: "🛸",
      t: "finished"
    },
    aircraft: {
      n: "Aircraft",
      i: "✈️",
      t: "finished"
    },
    turrets: {
      n: "Turrets",
      i: "🗼",
      t: "finished"
    },
    buildingComponents: {
      n: "Building Components",
      i: "🧱",
      t: "finished"
    }
  };

  // ---- Buildings (GDD §6) ----
  const BUILD = {
    farm: {
      n: "Farm",
      i: "🌾",
      cost: 200
    },
    well: {
      n: "Water Well",
      i: "💧",
      cost: 200
    },
    lumberCamp: {
      n: "Lumber Camp",
      i: "🪵",
      cost: 200
    },
    quarry: {
      n: "Quarry",
      i: "🪨",
      cost: 250
    },
    ironMine: {
      n: "Iron Mine",
      i: "⛓️",
      cost: 400
    },
    mineralMine: {
      n: "Mineral Mine",
      i: "💎",
      cost: 700
    },
    oilDerrick: {
      n: "Oil Derrick",
      i: "🛢️",
      cost: 800
    },
    dataExcavator: {
      n: "Data Excavator",
      i: "💽",
      cost: 1200
    },
    refinery: {
      n: "Refinery",
      i: "🏭",
      cost: 1000
    },
    foundry: {
      n: "Foundry",
      i: "⚒️",
      cost: 1400
    },
    armsFactory: {
      n: "Arms Factory",
      i: "🔫",
      cost: 2200
    },
    heavyWorks: {
      n: "Heavy Works",
      i: "🛠️",
      cost: 3500
    },
    electronicsLab: {
      n: "Electronics Lab",
      i: "🔬",
      cost: 4000
    },
    warehouse: {
      n: "Warehouse",
      i: "📦",
      cost: 500
    }
  };

  // ---- Units (GDD §8) ----
  const UNITS = {
    infantry: {
      n: "Infantry",
      i: "🪖",
      a: 10,
      d: 12,
      war: 20
    },
    tanks: {
      n: "Tanks",
      i: "🛡️",
      a: 32,
      d: 26,
      war: 120
    },
    artillery: {
      n: "Artillery",
      i: "💥",
      a: 40,
      d: 8,
      war: 110
    },
    aircraft: {
      n: "Aircraft",
      i: "✈️",
      a: 38,
      d: 14,
      war: 200
    },
    drones: {
      n: "Drones",
      i: "🛸",
      a: 22,
      d: 10,
      war: 90
    },
    engineers: {
      n: "Engineers",
      i: "🔧",
      a: 6,
      d: 8,
      war: 50
    }
  };

  // ---- Market reference prices ----
  const REF = {
    food: 1.2,
    water: 1.0,
    wood: 1.4,
    stone: 1.5,
    iron: 3.1,
    rareMinerals: 8.4,
    oil: 4.6,
    dataChips: 11.2,
    fuel: 7.0,
    steel: 9.5,
    electronics: 18.0,
    machineParts: 14.0,
    ammunition: 6.5,
    chemicals: 9.0,
    rifles: 22.0,
    tanks: 120.0,
    drones: 64.0,
    aircraft: 180.0,
    turrets: 40.0,
    buildingComponents: 16.0
  };

  // ---- World generation (pointy-top hex, radius R) ----
  const SIZE = 26;
  function axialToPixel(q, r) {
    return {
      x: SIZE * Math.sqrt(3) * (q + r / 2),
      y: SIZE * 1.5 * r
    };
  }
  function ringOf(q, r) {
    return (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;
  }
  // deterministic pseudo-random
  function rng(seed) {
    let s = seed * 9301 + 49297;
    return (s % 233280 / 233280 + 1) % 1;
  }
  function terrainForRing(ring, R, seed) {
    const t = ring / R; // 0 center → 1 edge
    const v = rng(seed);
    if (t > 0.78) return v < 0.6 ? "plains" : v < 0.85 ? "forest" : "river";
    if (t > 0.55) return v < 0.4 ? "forest" : v < 0.65 ? "river" : v < 0.85 ? "mountain" : "plains";
    if (t > 0.32) return v < 0.3 ? "mountain" : v < 0.55 ? "desert" : v < 0.78 ? "coastal" : "industrial";
    if (t > 0.12) return v < 0.35 ? "industrial" : v < 0.6 ? "techRuins" : v < 0.8 ? "desert" : "warzone";
    return v < 0.7 ? "warzone" : "techRuins";
  }
  function buildWorld(R) {
    const hexes = [];
    let seed = 1;
    for (let q = -R; q <= R; q++) {
      for (let r = -R; r <= R; r++) {
        if (Math.abs(q + r) > R) continue;
        const ring = ringOf(q, r);
        seed += 7;
        const terrain = terrainForRing(ring, R, seed);
        const {
          x,
          y
        } = axialToPixel(q, r);
        // NPC hostile camps: more common toward center
        const npc = ring < R && rng(seed * 3) < 0.06 + (1 - ring / R) * 0.16;
        hexes.push({
          key: q + "," + r,
          q,
          r,
          ring,
          terrain,
          x,
          y,
          npc,
          npcTier: Math.max(1, Math.round((1 - ring / R) * 4))
        });
      }
    }
    return hexes;
  }
  function zoneOf(ring, R) {
    const t = ring / R;
    if (t < 0.2) return "crucible";
    if (t > 0.8) return "newbie";
    return "mid";
  }
  window.WL = {
    TERRAIN,
    RES,
    BUILD,
    UNITS,
    REF,
    SIZE,
    axialToPixel,
    buildWorld,
    zoneOf,
    ringOf,
    fmt: n => Math.floor(n).toLocaleString()
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/warlands-game/data.js", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Panel = __ds_scope.Panel;

__ds_ns.Stat = __ds_scope.Stat;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.ResourceChip = __ds_scope.ResourceChip;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
