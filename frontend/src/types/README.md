# types

Shared TypeScript types for domain entities.

| File      | Contents                              |
| --------- | ------------------------------------- |
| `grid.ts` | `HealthStatus`, `Transformer`, `Zone` |

`HealthStatus` is produced by the backend's deterministic prediction engine — the
frontend renders it and never computes or overrides it.

TODO: `Telemetry` and `Alert` types once those endpoints exist (Milestones 3/7).
