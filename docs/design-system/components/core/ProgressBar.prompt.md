Thin inset progress track — season timer, build/train queues, defense %, storage fill.

```jsx
<ProgressBar value={62} tone="amber" label="Season 4" valueText="18d 04h" />
<ProgressBar value={40} max={100} tone="blood" height={6} />
```

`tone`: `amber | blood | sky | emerald | violet`. Optional `label` (caps, left) and `valueText` (mono, right) render a header row above the track. Animates width with the standard ease-out.
