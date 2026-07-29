# dashboard

| File           | Responsibility                                                        |
| -------------- | --------------------------------------------------------------------- |
| `GridTree.tsx` | Grid → Zone → Transformer navigator; routes to `/transformer/:id`      |

`GridTree` is presentational: it takes zones and derives zone/grid status by rolling up
transformer status via `utils/grid-status`, so a zone can never look healthier than its
worst transformer. Expansion state is internal; pass `initialExpandedZones` to control
which zones start open.

TODO: summary cards, alert panel, and transformer table components (Milestone 6).
