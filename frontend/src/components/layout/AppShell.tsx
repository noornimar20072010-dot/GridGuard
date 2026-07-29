import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopNav } from './TopNav'
import { SIDEBAR_NAV, type NavItem } from './nav-config'

interface AppShellProps {
  title: string
  activeKey: string
  onSelect: (key: string) => void
  children: ReactNode
  items?: NavItem[]
  onBack?: () => void
  actions?: ReactNode
  /** Omitted until Supabase Auth supplies a real name. */
  operatorName?: string
}

/**
 * Sidebar + top navigation frame for the operator dashboard. Purely structural: the
 * active view and its title are owned by the page that renders the shell.
 */
export function AppShell({
  title,
  activeKey,
  onSelect,
  children,
  items = SIDEBAR_NAV,
  onBack,
  actions,
  operatorName,
}: AppShellProps) {
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  function handleSelect(key: string) {
    setIsSidebarOpen(false)
    onSelect(key)
  }

  // TODO(Milestone 2 - Authentication): sign out of Supabase before redirecting.
  function handleLogout() {
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen overflow-hidden bg-base font-sans text-ink antialiased">
      <Sidebar
        items={items}
        activeKey={activeKey}
        onSelect={handleSelect}
        operatorName={operatorName}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav
          title={title}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onBack={onBack}
          actions={actions}
        />
        {/* Pages own their scroll region so split views can scroll each pane separately. */}
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
