Labelled monospace numeric readout — the top resource-bar primitive. Always mono + tabular.

```jsx
<Stat label="$WAR" value="48,210" accent="amber" />
<Stat label="Staked" value="120,000" accent="sky" />
<Stat label="Pool" value="9,640" accent="emerald" align="stack" size="lg" />
```

`align="row"` for the dense HUD bar, `align="stack"` for dashboard cards. Pre-format the value string yourself.
