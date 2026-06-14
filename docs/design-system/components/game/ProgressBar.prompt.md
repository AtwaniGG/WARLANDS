Thin progress track for season timer, upkeep, defense %, build/train queue.

```jsx
<ProgressBar value={62} tone="amber" label="Season 3" valueText="48s remaining" />
<ProgressBar value={40} tone="blood" label="Defense" valueText="40%" height={6} />
```

`tone` follows the semantic palette. Provide `valueText` (mono) for the readout; omit the label row entirely for a bare bar.
