Primary view switcher — active tab fills amber with near-black text; others are muted.

```jsx
const tabs = [
  { id: "map", label: "World", icon: "🗺️" },
  { id: "market", label: "Market", icon: "💱" },
  { id: "allegiance", label: "Allegiance", icon: "🤝" },
  { id: "season", label: "Season", icon: "🏆" },
];
<Tabs tabs={tabs} value={view} onChange={setView} />
```

Controlled — owns no state; pass `value` and `onChange`.
