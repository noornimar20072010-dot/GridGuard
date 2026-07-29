import { cn } from '@/lib/utils'
import type { HealthStatus } from '@/types/grid'
import { statusBg, statusDot, statusLabel } from '@/utils/grid-status'

export function StatusBadge({ status }: { status: HealthStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
        statusBg(status)
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', statusDot(status))} />
      {statusLabel(status)}
    </span>
  )
}
