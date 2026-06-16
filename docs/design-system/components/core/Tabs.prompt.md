Primary view switcher — the War Room nav rail. Active tab is solid amber; the row scrolls horizontally on mobile.

```jsx
const TABS = [
  { id: "map", label: "World", icon: "🗺️" },
  { id: "market", label: "Market", icon: "💱" },
  { id: "army", label: "Army", icon: "🎖️" },
];
<Tabs tabs={TABS} value={view} onChange={setView} />
```

Each tab is `{ id, label, icon }`. Emoji icons are the WARLANDS convention. Controlled — track `value` yourself.
