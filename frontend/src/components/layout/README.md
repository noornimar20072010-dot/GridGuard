# layout

Structural chrome for the operator dashboard. These components carry no domain logic —
the active view, its title, and any data live in the page that renders the shell.

| File            | Responsibility                                                    |
| --------------- | ----------------------------------------------------------------- |
| `AppShell.tsx`  | Composes sidebar + top nav + content area; owns drawer open state  |
| `Sidebar.tsx`   | Brand, nav list, operator footer; off-canvas drawer below `lg`     |
| `TopNav.tsx`    | Page title, back control, feed status, optional page actions       |
| `nav-config.ts` | Nav items as data (label, icon, badge, `comingSoon`)               |

## Usage

```tsx
<AppShell
  title="Asset Registry"
  activeKey={page}
  onSelect={(key) => setPage(key)}
  onBack={() => setPage('overview')}
>
  {content}
</AppShell>
```

`<main>` is `overflow-hidden`, so each page owns its own scroll region. Split views can
then scroll each pane independently; a single-column page should wrap its content in
`h-full overflow-y-auto`.

Nav items are keyed strings rather than routes because the dashboard's Overview, Grid
Tree, and Assets views are in-page state, not separate URLs. Add a router link layer to
`nav-config.ts` if those views ever become routes.
