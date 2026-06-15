Labelled mono numeric readout — the atom of the top HUD bar and every dashboard. Values are tabular so ticking counters don't jitter.

```jsx
<Stat label="$WAR" value="48,210" accent="amber" />
<Stat label="Staked" value="120,000" accent="sky" align="stack" size="lg" />
```

`accent` colors the value (`amber | blood | sky | emerald | violet | teal | neutral`). `align="row"` for the HUD strip, `"stack"` for cards. Pre-format numbers (e.g. `toLocaleString()`).
