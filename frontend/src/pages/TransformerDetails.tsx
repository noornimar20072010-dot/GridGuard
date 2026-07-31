import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { StatusBadge } from '@/components/common/StatusBadge'
import { TransformerLoadChart } from '@/components/charts/TransformerLoadChart'
import { findTransformer } from '@/lib/mock-data'
import { statusText } from '@/utils/grid-status'

export function TransformerDetails() {
  const { id } = useParams<{ id: string }>()
  const transformer = findTransformer(id)
  const [settings] = useState({ warnThreshold: 75, critThreshold: 90, tempThreshold: 80 })

  return (
    <div className="min-h-screen grid-background p-6 text-ink" style={{
      background: `
        radial-gradient(circle at 15% 40%, rgba(59, 130, 246, 0.2) 0%, transparent 40%),
        radial-gradient(circle at 85% 80%, rgba(34, 197, 94, 0.2) 0%, transparent 40%),
        linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)
      `,
      backgroundAttachment: 'fixed'
    }}>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 font-mono text-xs text-ok hover:underline mb-6"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Back to dashboard
      </Link>

      {!transformer ? (
        <div className="rounded-xl border border-line bg-panel p-6">
          <h1 className="text-lg font-semibold">Transformer not found</h1>
          <p className="mt-2 text-sm text-ink/60">
            No transformer matches the id <span className="font-mono text-ink">{id}</span>.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <h1 className="text-4xl font-extrabold text-white">{transformer.id}</h1>
              <StatusBadge status={transformer.status} />
            </div>
            <p className="font-mono text-sm text-slate-200">
              {transformer.zone} · {transformer.type}
            </p>
          </div>

          {/* Main Content - Centered */}
          <div className="w-full max-w-4xl space-y-6">
            {/* Metrics Grid */}
            <div className="rounded-xl border border-white/10 bg-panel/60 backdrop-blur-xl p-6">
              <h2 className="font-mono text-sm uppercase tracking-[0.14em] text-slate-200 mb-4">Current Status</h2>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Reading label="Current Load" value={`${transformer.load}%`} />
                <Reading
                  label="Predicted Load"
                  value={transformer.predictedLoad == null ? '—' : `${transformer.predictedLoad}%`}
                  emphasis={transformer.status}
                />
                <Reading label="Voltage" value={`${transformer.voltage} kV`} />
                <Reading label="Current" value={`${transformer.current} A`} />
                <Reading label="Temperature" value={`${transformer.tempC} °C`} />
                <Reading label="Last Updated" value={transformer.lastUpdated} />
              </dl>
            </div>

            {/* Historical Trend Chart */}
            <div className="rounded-xl border border-white/10 bg-panel/60 backdrop-blur-xl p-6">
              <h2 className="font-mono text-sm uppercase tracking-[0.14em] text-slate-200 mb-4">Historical Trend</h2>
              <TransformerLoadChart
                transformerId={transformer.id}
                critThreshold={settings.critThreshold}
                warnThreshold={settings.warnThreshold}
              />
            </div>

            {/* Info Note */}
            <p className="font-mono text-xs text-slate-400 text-center">
              Readings are simulated. Health status and predicted load come from the deterministic prediction engine.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function Reading({
  label,
  value,
  emphasis,
}: {
  label: string
  value: string
  emphasis?: 'ok' | 'warn' | 'crit'
}) {
  return (
    <div className="rounded-lg border border-line bg-panel p-4">
      <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink/60">{label}</dt>
      <dd className={`mt-1 font-mono text-xl font-bold ${emphasis ? statusText(emphasis) : ''}`}>
        {value}
      </dd>
    </div>
  )
}
