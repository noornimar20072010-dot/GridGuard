import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Network } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { HealthStatus, Transformer, Zone } from '@/types/grid'
import { rollUpStatus, statusDot, statusLabel, statusText } from '@/utils/grid-status'

interface GridTreeProps {
  gridName: string
  zones: Zone[]
  /** Zone ids expanded on first render. Defaults to every zone. */
  initialExpandedZones?: string[]
}

/**
 * Hierarchical Grid → Zone → Transformer navigator that stands in for a geographic map.
 * Selecting a transformer routes to its detail page.
 */
export function GridTree({ gridName, zones, initialExpandedZones }: GridTreeProps) {
  const [isGridExpanded, setIsGridExpanded] = useState(true)
  const [expandedZones, setExpandedZones] = useState(
    () => new Set(initialExpandedZones ?? zones.map((zone) => zone.id))
  )

  function toggleZone(zoneId: string) {
    setExpandedZones((previous) => {
      const next = new Set(previous)
      if (next.has(zoneId)) next.delete(zoneId)
      else next.add(zoneId)
      return next
    })
  }

  const allTransformers = zones.flatMap((zone) => zone.transformers)
  const gridStatus = rollUpStatus(allTransformers)

  return (
    <ul className="font-mono text-[13px]">
      <li>
        <TreeToggle
          isExpanded={isGridExpanded}
          onToggle={() => setIsGridExpanded(!isGridExpanded)}
          label={gridName}
          labelClassName="font-bold"
          icon={<Network className={cn('h-4 w-4', statusText(gridStatus))} />}
          meta={`${zones.length} zones · ${allTransformers.length} transformers`}
        />

        {isGridExpanded && (
          <ul className="ml-[11px] space-y-1 border-l border-line pl-4 pt-1">
            {zones.map((zone) => {
              const isExpanded = expandedZones.has(zone.id)
              const zoneStatus = rollUpStatus(zone.transformers)

              return (
                <li key={zone.id}>
                  <TreeToggle
                    isExpanded={isExpanded}
                    onToggle={() => toggleZone(zone.id)}
                    label={zone.name}
                    labelClassName="font-semibold"
                    icon={<StatusDot status={zoneStatus} className="h-2.5 w-2.5" />}
                    meta={`${zone.transformers.length} transformers`}
                  />

                  {isExpanded && (
                    <ul className="ml-[11px] space-y-0.5 border-l border-line pl-4 pt-1">
                      {zone.transformers.map((transformer) => (
                        <li key={transformer.id}>
                          <TransformerRow transformer={transformer} />
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </li>
    </ul>
  )
}

function TransformerRow({ transformer }: { transformer: Transformer }) {
  const { id, status, load, predictedLoad } = transformer
  const isElevated = status !== 'ok'

  return (
    <Link
      to={`/transformer/${id}`}
      aria-label={`Transformer ${id} — ${statusLabel(status)}, ${load}% load`}
      className={cn(
        'flex items-center gap-2 rounded-md border px-3 py-1.5 transition-colors',
        status === 'crit'
          ? 'border-crit/40 bg-crit/[0.08] hover:bg-crit/[0.14]'
          : status === 'warn'
            ? 'border-warn/30 bg-raised hover:border-warn/60'
            : 'border-line bg-raised hover:border-ok/50'
      )}
    >
      <StatusDot status={status} className="h-2 w-2" />
      <span className={cn('truncate', status === 'crit' ? 'font-bold text-crit' : 'text-ink')}>
        {id}
      </span>
      <span className={cn('ml-auto shrink-0 text-[11px] font-bold', statusText(status))}>
        {load}%
      </span>
      {isElevated && predictedLoad != null && (
        <span className="shrink-0 text-[10px] text-ink/50">→ {predictedLoad}%</span>
      )}
    </Link>
  )
}

function TreeToggle({
  isExpanded,
  onToggle,
  label,
  labelClassName,
  icon,
  meta,
}: {
  isExpanded: boolean
  onToggle: () => void
  label: string
  labelClassName?: string
  icon: ReactNode
  meta: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isExpanded}
      className="flex w-full items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2 text-left transition-colors hover:bg-raised"
    >
      <ChevronRight
        className={cn('h-3.5 w-3.5 shrink-0 text-ink/40 transition-transform', isExpanded && 'rotate-90')}
      />
      {icon}
      <span className={cn('truncate', labelClassName)}>{label}</span>
      <span className="ml-auto shrink-0 text-[10px] text-ink/50">{meta}</span>
    </button>
  )
}

function StatusDot({ status, className }: { status: HealthStatus; className?: string }) {
  return <span className={cn('shrink-0 rounded-full', statusDot(status), className)} />
}
