Resource pill — emoji icon + name + mono amount. The atom of stockpile, recipes, loot, order book.

```jsx
<ResourceChip icon="🌾" name="Food" amount="1,240" tier="raw" />
<ResourceChip icon="🔩" name="Steel" amount="320" tier="intermediate" />
<ResourceChip icon="🛡️" name="Tanks" amount="12" tier="finished" />
<ResourceChip icon="💎" amount="×8" size="sm" />
```

`tier` sets the frame: raw = plain hairline, intermediate = stronger border, finished = amber edge. Drop `name` for an icon-only loot/count chip.
