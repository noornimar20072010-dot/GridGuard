import { Link, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { StatusBadge } from '@/components/common/StatusBadge'
import { findTransformer } from '@/lib/mock-data'
import { statusText } from '@/utils/grid-status'

// TODO(Milestone 6/8/9): live telemetry polling, the historical load trend chart, and the
// AI operator summary for critical transformers.
export function TransformerDetails() {
  const { id } = useParams<{ id: string }>()
  const transformer = findTransformer(id)

  return (
    <div className="min-h-screen bg-base p-6 text-ink">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 font-mono text-xs text-ok hover:underline"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Back to dashboard
      </Link>

      {!transformer ? (
        <div className="mt-6 rounded-xl border border-line bg-panel p-6">
          <h1 className="text-lg font-semibold">Transformer not found</h1>
          <p className="mt-2 text-sm text-ink/60">
            No transformer matches the id <span className="font-mono text-ink">{id}</span>.
          </p>
        </div>
      ) : (
        <div className="mt-6 max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">{transformer.id}</h1>
            <StatusBadge status={transformer.status} />
            <span className="font-mono text-xs text-ink/60">
              {transformer.zone} · {transformer.type}
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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

          <p className="font-mono text-[11px] text-ink/50">
            Readings are simulated. Health status and predicted load come from the deterministic
            prediction engine.
          </p>
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
