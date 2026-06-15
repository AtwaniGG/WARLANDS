Resource pill — icon + name + mono amount. The atom of stockpiles, recipes, raid loot.

```jsx
<ResourceChip icon={<img src="assets/resources/iron.svg" width="15" />} name="Iron" amount="1,240" tier="raw" />
<ResourceChip icon="⛽" name="Fuel" amount="320" tier="intermediate" />
<ResourceChip icon={<img src="assets/resources/tanks.svg" width="15" />} name="Tanks" amount="12" tier="finished" />
```

`tier` frames the chip: `raw` (hairline), `intermediate` (raised), `finished` (amber rim). Use the imported resource SVGs as `icon`, or an emoji fallback. Omit `name` for an icon+count chip.
