import { LogOut, ShieldCheck, UserRound, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NavItem } from './nav-config'

interface SidebarProps {
  items: NavItem[]
  activeKey: string
  onSelect: (key: string) => void
  /** Omitted until Supabase Auth supplies a real name. */
  operatorName?: string
  onLogout: () => void
  /** Controls the off-canvas drawer below the `lg` breakpoint. */
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({
  items,
  activeKey,
  onSelect,
  operatorName,
  onLogout,
  isOpen,
  onClose,
}: SidebarProps) {
  return (
    <>
      {/* Drawer scrim — only interactive on small screens, where the drawer can open. */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-line bg-panel',
          'transition-transform lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <span className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-ok/25 bg-ok/10">
              <ShieldCheck className="h-4 w-4 text-ok" />
            </span>
            <span className="text-[15px] font-bold tracking-[0.16em]">GRIDGUARD</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-ink/60 hover:bg-raised hover:text-ink lg:hidden"
          >
            <span className="sr-only">Close navigation</span>
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Main">
          {items.map((item) => (
            <SidebarNavRow
              key={item.key}
              item={item}
              isActive={item.key === activeKey}
              onSelect={onSelect}
            />
          ))}
        </nav>

        <div className="border-t border-line p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line bg-raised">
              <UserRound className="h-4 w-4 text-ink/70" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{operatorName ?? 'Operator'}</p>
              {operatorName && <p className="truncate text-[11px] text-ink/60">Operator</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink/80 transition-colors hover:bg-raised hover:text-ink"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>
    </>
  )
}

function SidebarNavRow({
  item,
  isActive,
  onSelect,
}: {
  item: NavItem
  isActive: boolean
  onSelect: (key: string) => void
}) {
  const { icon: Icon, label, badge, comingSoon } = item

  return (
    <button
      type="button"
      disabled={comingSoon}
      aria-current={isActive ? 'page' : undefined}
      title={comingSoon ? 'Available in a later milestone' : undefined}
      onClick={() => onSelect(item.key)}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
        isActive
          ? 'bg-raised font-semibold text-ink'
          : 'text-ink/80 hover:bg-raised hover:text-ink',
        comingSoon && 'cursor-not-allowed opacity-40 hover:bg-transparent hover:text-ink/80'
      )}
    >
      <Icon className={cn('h-[18px] w-[18px] shrink-0', isActive && 'text-ok')} />
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span className="rounded border border-warn/30 bg-warn/10 px-1.5 font-mono text-[10px] font-bold text-warn">
          {badge}
        </span>
      )}
    </button>
  )
}
