import {
  Boxes,
  FileText,
  LayoutDashboard,
  Network,
  Settings,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  key: string
  label: string
  icon: LucideIcon
  /** Rendered as a small counter on the right of the row. */
  badge?: string
  /** Nav targets that do not exist yet render inert rather than as dead buttons. */
  comingSoon?: boolean
}

export const SIDEBAR_NAV: NavItem[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'grid-tree', label: 'Grid Tree', icon: Network },
  { key: 'assets', label: 'Assets', icon: Boxes },
  { key: 'alerts', label: 'Alerts', icon: TriangleAlert },
  { key: 'reporting', label: 'Reporting', icon: FileText },
  { key: 'settings', label: 'Settings', icon: Settings },
]
