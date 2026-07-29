import type { HealthStatus, Transformer } from '@/types/grid'

/** Hex values for inline SVG/style use; prefer the Tailwind classes below in markup. */
export function statusColor(status: HealthStatus): string {
  return status === 'ok' ? '#21d07a' : status === 'warn' ? '#f0a92e' : '#ef4444'
}

export function statusLabel(status: HealthStatus): string {
  return status === 'ok' ? 'Healthy' : status === 'warn' ? 'Warning' : 'Critical'
}

export function statusBg(status: HealthStatus): string {
  return status === 'ok'
    ? 'bg-ok/10 border-ok/30 text-ok'
    : status === 'warn'
      ? 'bg-warn/10 border-warn/30 text-warn'
      : 'bg-crit/10 border-crit/30 text-crit'
}

export function statusDot(status: HealthStatus): string {
  return status === 'ok' ? 'bg-ok' : status === 'warn' ? 'bg-warn' : 'bg-crit'
}

export function statusText(status: HealthStatus): string {
  return status === 'ok' ? 'text-ok' : status === 'warn' ? 'text-warn' : 'text-crit'
}

/**
 * A zone (or the grid) is only as healthy as its worst transformer, so status rolls up
 * rather than being stored separately — that keeps the tree self-consistent.
 */
export function rollUpStatus(transformers: Transformer[]): HealthStatus {
  if (transformers.some((t) => t.status === 'crit')) return 'crit'
  if (transformers.some((t) => t.status === 'warn')) return 'warn'
  return 'ok'
}
