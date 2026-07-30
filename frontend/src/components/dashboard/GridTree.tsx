import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Network, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
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

  // Data for charts
  const zoneLoadData = zones.map((zone) => {
    const totalLoad = zone.transformers.reduce((sum, t) => sum + t.load, 0) / zone.transformers.length
    return {
      name: zone.name.split(' — ')[0],
      load: Math.round(totalLoad),
      transformers: zone.transformers.length,
    }
  })

  const totalLoad = Math.round(allTransformers.reduce((sum, t) => sum + t.load, 0) / allTransformers.length)
  const critCount = allTransformers.filter((t) => t.status === 'crit').length
  const warnCount = allTransformers.filter((t) => t.status === 'warn').length
  const okCount = allTransformers.filter((t) => t.status === 'ok').length

  return (
    <div className="space-y-6">
      {/* Map Header with Reference Grid */}
      <div className="relative rounded-lg overflow-hidden">
        <div className="absolute inset-0 utility-grid opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-green-900/10" />

        <div className="relative p-8 text-center">
          <div className="absolute top-4 left-4 text-xs text-slate-400 font-mono">
            <div>Latitude: 40.7128°N</div>
            <div>Longitude: 74.0060°W</div>
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">Northeast Regional Grid</h2>
          <p className="text-slate-300 text-sm">Real-time electrical distribution network monitoring</p>

          <div className="absolute top-4 right-4 text-xs text-slate-400 font-mono">
            <div>Map Ref: NE-2024</div>
            <div>Zone Coverage: 3</div>
          </div>
        </div>
      </div>

      {/* Grid Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg bg-slate-800/50 border border-slate-700/30 p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Avg Load</p>
          <p className="text-3xl font-bold text-white mt-2">{totalLoad}%</p>
        </div>
        <div className="rounded-lg bg-slate-800/50 border border-slate-700/30 p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Critical</p>
          <p className="text-3xl font-bold text-red-400 mt-2">{critCount}</p>
        </div>
        <div className="rounded-lg bg-slate-800/50 border border-slate-700/30 p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Warning</p>
          <p className="text-3xl font-bold text-amber-400 mt-2">{warnCount}</p>
        </div>
        <div className="rounded-lg bg-slate-800/50 border border-slate-700/30 p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Normal</p>
          <p className="text-3xl font-bold text-emerald-400 mt-2">{okCount}</p>
        </div>
      </div>

      {/* Zone Load Chart */}
      <div className="rounded-lg bg-slate-800/50 border border-slate-700/30 p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-slate-300" />
          <h3 className="text-lg font-bold text-white">Load by Zone</h3>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={zoneLoadData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.2)" />
            <XAxis dataKey="name" stroke="#cbd5e1" />
            <YAxis stroke="#cbd5e1" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
              labelStyle={{ color: '#f1f5f9' }}
            />
            <Bar dataKey="load" fill="#10b981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Network Tree Visualization - Map Style */}
      <div className="rounded-lg bg-slate-900 border border-slate-700/50 overflow-hidden">
        <div className="relative">
          {/* Background grid pattern */}
          <div className="absolute inset-0 utility-grid opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/5 via-transparent to-emerald-900/5" />

          {/* Header */}
          <div className="relative border-b border-slate-700/50 p-6 flex items-center justify-between bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-900/40 rounded-lg">
                <Network className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Network Topology Map</h3>
                <p className="text-xs text-slate-400 mt-1">Interactive grid distribution visualization</p>
              </div>
            </div>
            <div className="text-right text-xs text-slate-400 font-mono">
              <div>Scale: 1:{zones.length * 10}km</div>
              <div>Nodes: {allTransformers.length}</div>
            </div>
          </div>

          {/* Tree Content */}
          <div className="relative p-6 bg-slate-900/40">
            <TransformerNetworkTree zones={zones} />
          </div>
        </div>
      </div>

      {/* Grid Tree List */}
      <ul className="font-mono text-sm">
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
    </div>
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
      <span className={cn('ml-auto shrink-0 text-sm font-bold', statusText(status))}>
        {load}%
      </span>
      {isElevated && predictedLoad != null && (
        <span className="shrink-0 text-sm text-slate-300">→ {predictedLoad}%</span>
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
        className={cn('h-3.5 w-3.5 shrink-0 text-slate-300 transition-transform', isExpanded && 'rotate-90')}
      />
      {icon}
      <span className={cn('truncate', labelClassName)}>{label}</span>
      <span className="ml-auto shrink-0 text-sm text-slate-300">{meta}</span>
    </button>
  )
}

function StatusDot({ status, className }: { status: HealthStatus; className?: string }) {
  return <span className={cn('shrink-0 rounded-full', statusDot(status), className)} />
}

// Network Tree Visualization Component
function TransformerNetworkTree({ zones }: { zones: Zone[] }) {
  const [selectedTransformer, setSelectedTransformer] = useState<Transformer | null>(null)

  const svgWidth = 1200
  const svgHeight = Math.max(500, zones.length * 150 + 200)

  // Position nodes in a tree layout
  const gridY = 40
  const zoneStartY = 120
  const zoneSpacing = svgHeight / Math.max(zones.length, 1) - 40

  const nodes: Array<{ x: number; y: number; label: string; status: HealthStatus; id: string; transformer?: Transformer }> = []
  const edges: Array<{ x1: number; y1: number; x2: number; y2: number; status: HealthStatus }> = []

  // Grid node (center top)
  nodes.push({ x: svgWidth / 2, y: gridY, label: 'Grid', status: 'ok', id: 'grid' })

  // Zone nodes and transformer nodes
  zones.forEach((zone, zoneIndex) => {
    const zoneY = zoneStartY + zoneIndex * zoneSpacing
    const zoneX = 150 + zoneIndex * (svgWidth / Math.max(zones.length, 1) * 0.8)

    // Zone node
    const zoneStatus = rollUpStatus(zone.transformers)
    nodes.push({ x: zoneX, y: zoneY, label: zone.name.split(' — ')[0], status: zoneStatus, id: zone.id })

    // Edge from grid to zone
    edges.push({ x1: svgWidth / 2, y1: gridY + 30, x2: zoneX, y2: zoneY - 30, status: zoneStatus })

    // Transformer nodes
    const transformerSpacing = 180
    const transformerStartX = zoneX - ((zone.transformers.length - 1) * transformerSpacing) / 2

    zone.transformers.forEach((transformer, tIndex) => {
      const tX = transformerStartX + tIndex * transformerSpacing
      const tY = zoneY + 100

      nodes.push({ x: tX, y: tY, label: transformer.id, status: transformer.status, id: transformer.id, transformer })

      // Edge from zone to transformer
      edges.push({ x1: zoneX, y1: zoneY + 30, x2: tX, y2: tY - 30, status: transformer.status })
    })
  })

  return (
    <div
      className="overflow-x-auto relative"
      style={{
        background: `
          url('/images/delhi-map-bg.jpg'),
          radial-gradient(ellipse at 30% 35%, rgba(59, 130, 246, 0.25) 0%, transparent 35%),
          radial-gradient(ellipse at 70% 60%, rgba(34, 197, 94, 0.25) 0%, transparent 35%),
          radial-gradient(circle at 50% 80%, rgba(245, 158, 11, 0.15) 0%, transparent 40%),
          linear-gradient(to bottom, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.8) 50%, rgba(15, 23, 42, 0.8) 100%)
        `,
        backgroundAttachment: 'fixed',
        backgroundSize: 'cover, auto, auto, auto, auto',
        backgroundPosition: 'center, 0 0, 0 0, 0 0, 0 0'
      }}
    >
      {/* Delhi Map Background Reference - More Visible */}
      <svg width={svgWidth} height={svgHeight} className="absolute inset-0 opacity-20 pointer-events-none" viewBox="0 0 1200 600">
        {/* Simplified Delhi map outline */}
        <defs>
          <pattern id="delhi-grid" x="20" y="20" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>

        {/* Delhi region path (simplified) - More visible */}
        <path
          d="M 400 200 L 500 180 L 550 200 L 560 250 L 520 300 L 450 320 L 380 300 L 350 250 Z"
          fill="rgba(255, 255, 255, 0.1)"
          stroke="white"
          strokeWidth="3"
          opacity="0.6"
        />

        {/* Major streets/roads grid - More visible */}
        <line x1="100" y1="150" x2="1100" y2="150" stroke="white" strokeWidth="2" opacity="0.2" />
        <line x1="100" y1="250" x2="1100" y2="250" stroke="white" strokeWidth="2" opacity="0.2" />
        <line x1="100" y1="350" x2="1100" y2="350" stroke="white" strokeWidth="2" opacity="0.2" />
        <line x1="100" y1="450" x2="1100" y2="450" stroke="white" strokeWidth="2" opacity="0.2" />

        <line x1="200" y1="50" x2="200" y2="550" stroke="white" strokeWidth="2" opacity="0.2" />
        <line x1="400" y1="50" x2="400" y2="550" stroke="white" strokeWidth="2" opacity="0.2" />
        <line x1="600" y1="50" x2="600" y2="550" stroke="white" strokeWidth="2" opacity="0.2" />
        <line x1="800" y1="50" x2="800" y2="550" stroke="white" strokeWidth="2" opacity="0.2" />
        <line x1="1000" y1="50" x2="1000" y2="550" stroke="white" strokeWidth="2" opacity="0.2" />

        {/* Map landmarks - circles representing districts */}
        <circle cx="300" cy="200" r="30" fill="none" stroke="white" strokeWidth="2" opacity="0.15" />
        <circle cx="700" cy="300" r="40" fill="none" stroke="white" strokeWidth="2" opacity="0.15" />
        <circle cx="450" cy="450" r="35" fill="none" stroke="white" strokeWidth="2" opacity="0.15" />

        {/* Map text label */}
        <text x="50" y="40" fontSize="18" fill="white" opacity="0.4" fontWeight="bold">
          DELHI GRID MAP REFERENCE
        </text>
        <text x="50" y="65" fontSize="12" fill="white" opacity="0.3">
          Northeast Regional Distribution Network
        </text>
      </svg>

      {/* Main SVG with network tree */}
      <svg width={svgWidth} height={svgHeight} className="mx-auto relative z-10">
        {/* Edges/Connections */}
        {edges.map((edge, i) => {
          const strokeColor = edge.status === 'crit' ? '#ef4444' : edge.status === 'warn' ? '#f59e0b' : '#10b981'
          const strokeDasharray = edge.status === 'crit' ? '5,5' : 'none'

          return (
            <line
              key={`edge-${i}`}
              x1={edge.x1}
              y1={edge.y1}
              x2={edge.x2}
              y2={edge.y2}
              stroke={strokeColor}
              strokeWidth={edge.status === 'crit' ? 2.5 : 2}
              strokeDasharray={strokeDasharray}
              opacity={0.7}
            />
          )
        })}

        {/* Nodes with Transformer Icons */}
        {nodes.map((node) => {
          const nodeColor = node.status === 'crit' ? '#ef4444' : node.status === 'warn' ? '#f59e0b' : '#10b981'
          const bgColor = node.status === 'crit' ? '#7f1d1d' : node.status === 'warn' ? '#78350f' : '#064e3b'
          const isClickable = node.transformer !== undefined
          const isTransformer = node.id !== 'grid' && node.id.startsWith('T-')

          return (
            <g
              key={`node-${node.id}`}
              onClick={() => isClickable && node.transformer && setSelectedTransformer(node.transformer)}
              style={{ cursor: isClickable ? 'pointer' : 'default' }}
            >
              {/* Glow effect for transformers */}
              {isTransformer && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={30}
                  fill={nodeColor}
                  opacity="0.1"
                  style={{ transition: 'all 0.3s ease' }}
                />
              )}

              {/* Node circle background */}
              <circle
                cx={node.x}
                cy={node.y}
                r={node.id === 'grid' ? 28 : 24}
                fill={bgColor}
                stroke={nodeColor}
                strokeWidth={2}
                style={{ transition: 'all 0.3s ease', opacity: isClickable ? 1 : 0.8 }}
                onMouseEnter={(e) => {
                  if (isClickable) {
                    (e.target as SVGCircleElement).setAttribute('r', '28')
                    ;(e.target as SVGCircleElement).setAttribute('stroke-width', '3')
                  }
                }}
                onMouseLeave={(e) => {
                  if (isClickable) {
                    (e.target as SVGCircleElement).setAttribute('r', '24')
                    ;(e.target as SVGCircleElement).setAttribute('stroke-width', '2')
                  }
                }}
              />

              {/* Cute transformer icon for transformer nodes - MUCH LARGER */}
              {isTransformer ? (
                <g>
                  {/* Transformer body box - cute style */}
                  <rect x={node.x - 8} y={node.y - 10} width="16" height="14" rx="2" fill={bgColor} stroke={nodeColor} strokeWidth="2" opacity="0.9" />

                  {/* Transformer coils - LARGE AND VISIBLE */}
                  <circle cx={node.x - 5} cy={node.y - 5} r="3.5" fill={nodeColor} />
                  <circle cx={node.x} cy={node.y - 5} r="3.5" fill={nodeColor} />
                  <circle cx={node.x + 5} cy={node.y - 5} r="3.5" fill={nodeColor} />

                  {/* Connection poles - thicker */}
                  <line x1={node.x - 5} y1={node.y} x2={node.x - 5} y2={node.y + 6} stroke={nodeColor} strokeWidth="2.5" />
                  <line x1={node.x} y1={node.y} x2={node.x} y2={node.y + 6} stroke={nodeColor} strokeWidth="2.5" />
                  <line x1={node.x + 5} y1={node.y} x2={node.x + 5} y2={node.y + 6} stroke={nodeColor} strokeWidth="2.5" />

                  {/* Base platform */}
                  <rect x={node.x - 9} y={node.y + 6} width="18" height="2.5" rx="1" fill={nodeColor} opacity="0.8" />

                  {/* Cute happy eyes */}
                  <circle cx={node.x - 2.5} cy={node.y - 2} r="1.5" fill={nodeColor} />
                  <circle cx={node.x + 2.5} cy={node.y - 2} r="1.5" fill={nodeColor} />

                  {/* Cute smile */}
                  <path d={`M ${node.x - 3} ${node.y + 1} Q ${node.x} ${node.y + 3} ${node.x + 3} ${node.y + 1}`} stroke={nodeColor} strokeWidth="1.5" fill="none" />
                </g>
              ) : (
                /* Zone/Grid label */
                <text
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  dy="0.3em"
                  className="text-sm font-bold"
                  fill={nodeColor}
                  style={{ pointerEvents: 'none', fontWeight: 'bold' }}
                >
                  {node.label.length > 10 ? node.label.substring(0, 8) : node.label}
                </text>
              )}

              {/* Label below transformer nodes - LARGER TEXT */}
              {isTransformer && (
                <text
                  x={node.x}
                  y={node.y + 24}
                  textAnchor="middle"
                  className="text-sm font-bold"
                  fill={nodeColor}
                  style={{ pointerEvents: 'none', fontWeight: 'bold', fontSize: '12px' }}
                >
                  {node.label}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-6 mt-4 justify-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-slate-300">Normal (Green)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-slate-300">Warning (Amber)</span>
        </div>
        <div className="flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <line x1="0" y1="6" x2="12" y2="6" stroke="#ef4444" strokeWidth="2" strokeDasharray="2,2" />
          </svg>
          <span className="text-slate-300">Critical (Red Dashed)</span>
        </div>
      </div>

      {/* Transformer Details Modal */}
      {selectedTransformer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-white">{selectedTransformer.id}</h2>
              <button
                onClick={() => setSelectedTransformer(null)}
                className="text-slate-400 hover:text-slate-200 transition"
              >
                ✕
              </button>
            </div>

            {/* Status Badge */}
            <div className="mb-4">
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  selectedTransformer.status === 'crit'
                    ? 'bg-red-900/40 text-red-400'
                    : selectedTransformer.status === 'warn'
                      ? 'bg-amber-900/40 text-amber-400'
                      : 'bg-emerald-900/40 text-emerald-400'
                }`}
              >
                {selectedTransformer.status === 'crit'
                  ? 'CRITICAL'
                  : selectedTransformer.status === 'warn'
                    ? 'WARNING'
                    : 'NORMAL'}
              </span>
            </div>

            {/* Details Grid */}
            <div className="space-y-3 mb-6">
              <DetailRow label="Zone" value={selectedTransformer.zone} />
              <DetailRow label="Type" value={selectedTransformer.type} />
              <DetailRow label="Current Load" value={`${selectedTransformer.load}%`} highlight={true} />
              <DetailRow
                label="Predicted Load"
                value={selectedTransformer.predictedLoad ? `${selectedTransformer.predictedLoad}%` : 'N/A'}
              />
              <DetailRow label="Voltage" value={`${selectedTransformer.voltage} kV`} />
              <DetailRow label="Current (I)" value={`${selectedTransformer.current} A`} />
              <DetailRow label="Temperature" value={`${selectedTransformer.tempC}°C`} />
              <DetailRow label="Last Updated" value={selectedTransformer.lastUpdated} fontSize="text-xs" />
            </div>

            {/* Action Button */}
            <Link
              to={`/transformer/${selectedTransformer.id}`}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition text-center"
            >
              View Full Details →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value, highlight = false, fontSize = 'text-sm' }: { label: string; value: string; highlight?: boolean; fontSize?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-slate-400 ${fontSize}`}>{label}</span>
      <span className={`font-mono font-bold ${fontSize} ${highlight ? 'text-blue-400' : 'text-slate-100'}`}>{value}</span>
    </div>
  )
}
