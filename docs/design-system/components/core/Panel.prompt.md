Dark bordered surface that frames a group of HUD controls — the base card of every panel in the War Room.

```jsx
<Panel title="Stockpile" accent headerRight={<Badge tone="amber">Owned</Badge>}>
  …rows…
</Panel>
```

`title` (13px caps) or `label` (10px caps) for the header; omit both for a header-less surface. `accent` tints the title amber; `rim="blood|sky|emerald|amber"` colors the border for status. Control body inset with `padding`.
