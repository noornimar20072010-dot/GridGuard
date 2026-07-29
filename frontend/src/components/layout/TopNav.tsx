import type { ReactNode } from 'react'
import { ChevronLeft, Menu } from 'lucide-react'

interface TopNavProps {
  title: string
  /** Opens the sidebar drawer below the `lg` breakpoint. */
  onOpenSidebar: () => void
  /** Rendered as a back control when the current view has a parent. */
  onBack?: () => void
  /** Optional page-specific controls, aligned to the right. */
  actions?: ReactNode
}

export function TopNav({ title, onOpenSidebar, onBack, actions }: TopNavProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line bg-panel px-4 lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="rounded-lg border border-line p-2 text-ink/70 hover:bg-raised hover:text-ink lg:hidden"
        >
          <span className="sr-only">Open navigation</span>
          <Menu className="h-4 w-4" />
        </button>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-line p-1.5 text-ink/70 hover:bg-raised hover:text-ink"
          >
            <span className="sr-only">Back</span>
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        <h1 className="truncate text-sm font-bold uppercase tracking-[0.12em]">{title}</h1>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {actions}
        <span className="hidden items-center gap-2 rounded-full border border-ok/30 bg-ok/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wide text-ok sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-ok" />
          Simulated feed · Live
        </span>
      </div>
    </header>
  )
}
