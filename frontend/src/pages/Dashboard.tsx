import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { StatusBadge } from '@/components/common/StatusBadge';
import { GridTree } from '@/components/dashboard/GridTree';
import { MOCK_GRID_NAME, MOCK_ZONES } from '@/lib/mock-data';
import type { HealthStatus, Transformer } from '@/types/grid';
import { statusBg, statusColor, statusLabel } from '@/utils/grid-status';

// Local aliases keep this file's existing internals unchanged while the shared domain
// types settle; the remaining views are rebuilt in Milestone 6.
type Status = HealthStatus;
type Asset = Transformer;
type Page = 'overview' | 'grid-tree' | 'assets';

const INITIAL_ZONES = MOCK_ZONES;

// ── Sub-components ─────────────────────────────────────────────────────────

// Load bar
function LoadBar({ value, predicted }: { value: number; predicted?: number | null }) {
  const color = value >= 90 ? '#ef4444' : value >= 80 ? '#f0a92e' : '#21d07a';
  return (
    <div className="w-full">
      <div className="flex justify-between text-[10px] mb-1">
        <span className="text-ink/60">Current</span>
        <span className="font-mono font-bold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, background: color, boxShadow: `0 0 6px ${color}80` }} />
      </div>
      {predicted != null && (
        <div className="flex justify-between text-[10px] mt-0.5">
          <span className="text-ink/40">Predicted</span>
          <span className="font-mono text-ink/60">{predicted}%</span>
        </div>
      )}
    </div>
  );
}

// ── Overview Page ──────────────────────────────────────────────────────────
function OverviewPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const allAssets = INITIAL_ZONES.flatMap(z => z.transformers);
  const critCount = allAssets.filter(a => a.status === 'crit').length;
  const warnCount = allAssets.filter(a => a.status === 'warn').length;

  return (
    <div className="p-6 space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Load', value: '11.2 GW', sub: 'Northeast Region', color: 'text-ok', glow: 'shadow-[0_0_20px_rgba(33,208,122,0.2)]' },
          { label: 'Active Lines', value: '96%', sub: '2 lines degraded', color: 'text-ok', glow: '' },
          { label: 'Critical Alerts', value: String(critCount), sub: 'Require immediate action', color: 'text-crit', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.15)]' },
          { label: 'Warnings', value: String(warnCount), sub: 'Monitor closely', color: 'text-warn', glow: '' },
        ].map(kpi => (
          <div key={kpi.label} className={`glass-panel rounded-xl p-5 flex flex-col gap-1 hover:-translate-y-1 transition-all duration-300 ${kpi.glow}`}>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink/60">{kpi.label}</p>
            <p className={`text-3xl font-extrabold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[11px] text-ink/50">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Grid Tree + T-104 alert – same as before */}
      <section className="rounded-xl border border-white/10 bg-panel/60 backdrop-blur-xl p-6 relative flex flex-col lg:flex-row gap-6 min-h-[420px] shadow-2xl overflow-hidden hover:border-white/20 transition-all duration-500">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-30" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent" />

        {/* Left: summary */}
        <div className="z-10 w-full lg:w-60 flex-shrink-0 flex flex-col gap-4">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-white font-bold">Grid Status · NE Region</h2>
          <div className="glass-card p-4 rounded-xl space-y-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            {[
              { label: 'Total Load', val: '11.2 GW', color: 'text-ok' },
              { label: 'Active Lines', val: '96%', color: 'text-ok' },
              { label: 'Critical Alerts', val: String(critCount), color: 'text-crit' },
              { label: 'Warnings', val: String(warnCount), color: 'text-warn' },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-center text-sm">
                <span className="text-ink/80">{r.label}:</span>
                <span className={`font-bold ${r.color}`}>{r.val}</span>
              </div>
            ))}
          </div>
          <div className="mt-auto bg-base/90 backdrop-blur border border-line p-3 rounded-lg flex flex-col gap-2 font-mono text-[10px] text-ink/80">
            <span className="flex items-center gap-2"><span className="h-0.5 w-4 bg-ok rounded" /> Normal (&lt;80% Load)</span>
            <span className="flex items-center gap-2"><span className="h-0.5 w-4 bg-warn rounded" /> Warning (80-90%)</span>
            <span className="flex items-center gap-2"><span className="h-0.5 w-4 bg-crit rounded" /> Critical Risk (&gt;90%)</span>
          </div>
        </div>

        {/* Right: grid tree preview — selecting a transformer opens its detail page */}
        <div className="z-10 flex-1 glass-card rounded-xl p-6 overflow-x-auto relative">
          <div className="min-w-[400px]">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink/60">Grid Topology</span>
              <button onClick={() => onNavigate('grid-tree')} className="ml-auto text-[10px] text-ok hover:underline font-mono">View Full Tree →</button>
            </div>
            <GridTree gridName={MOCK_GRID_NAME} zones={INITIAL_ZONES} initialExpandedZones={['zone-a']} />
          </div>
        </div>
      </section>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Load chart */}
        <div className="glass-panel rounded-xl p-5 flex flex-col xl:col-span-1 group hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink/80 group-hover:text-white transition-colors">Real-Time Grid Load (GW)</h3>
          </div>
          <div className="flex items-baseline gap-2 mb-6 relative">
            <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-ok to-blue-400 drop-shadow-lg">11.2 GW</span>
          </div>
          <div className="flex-1 min-h-[120px] flex items-end gap-1.5 mt-auto relative">
            <div className="absolute left-0 bottom-0 top-0 w-6 border-r border-line/30 flex flex-col justify-between text-[9px] text-ink/60 pb-4">
              <span>16</span><span>12</span><span>8</span><span>4</span><span>0</span>
            </div>
            <div className="pl-8 flex-1 flex items-end gap-[1%] h-full pt-4 relative">
              <div className="absolute inset-0 pl-8 pointer-events-none flex flex-col justify-between pb-5">
                {[0,1,2,3].map(i => <div key={i} className="w-full border-t border-line/20" />)}
                <div className="w-full border-t border-line/50" />
              </div>
              {[30,35,25,40,60,65,62,68,75,45,40,38,42,38,30,32,48].map((h, i) => (
                <div key={i} className={`w-[5%] rounded-t transition-colors ${i === 16 ? 'bg-ok shadow-[0_0_12px_rgba(33,208,122,0.8)]' : 'bg-ok/70 hover:bg-ok'}`} style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
          <div className="flex justify-between pl-8 pr-1 mt-2 font-mono text-[9px] text-ink/60">
            {['00','02','04','06','08','10','12','14','16','18','20','22','Now'].map(t => <span key={t}>{t}</span>)}
          </div>
        </div>

        {/* T-104 alert card */}
        <div className="glass-panel border-crit/40 bg-crit/10 p-5 flex flex-col xl:col-span-2 relative overflow-hidden shadow-[0_0_30px_rgba(239,68,68,0.15)] hover:shadow-[0_0_45px_rgba(239,68,68,0.25)] transition-all duration-500 hover:-translate-y-1">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-warn via-crit to-red-600" />
          <div className="absolute inset-0 bg-gradient-to-br from-crit/5 to-transparent pointer-events-none" />
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink/80">Active Alert · T-104 Status</h3>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-lg font-bold text-white">T-104</span>
                <span className="text-sm font-semibold text-crit flex items-center gap-1">PREDICTED OVERLOAD — 96% <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg></span>
              </div>
            </div>
            <span className="h-2 w-2 rounded-full bg-crit animate-pulse mt-1 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          </div>
          <div className="flex flex-col lg:flex-row gap-6 mt-2 flex-1">
            <div className="flex-1 bg-raised/50 rounded-lg p-4 border border-line flex flex-col justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink/80 mb-2">Load History & Forecast</p>
              <svg viewBox="0 0 320 100" className="mt-1 h-28 w-full" preserveAspectRatio="none" role="img">
                <line x1="0" y1="20" x2="320" y2="20" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 4" opacity="0.6" />
                <path d="M0 80 L26 76 L52 78 L78 70 L104 72 L130 64 L156 60 L182 62 L208 54 L234 48" fill="none" stroke="#21d07a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M234 48 L260 40 L286 34 L312 18" fill="none" stroke="#f0a92e" strokeWidth="2.5" strokeDasharray="5 4" strokeLinecap="round" />
                <circle cx="312" cy="18" r="4" fill="#ef4444" className="animate-pulse" />
              </svg>
              <div className="flex gap-4 font-mono text-[9px] text-ink/80 mt-2">
                <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-ok" />Actual</span>
                <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-warn" />Forecast</span>
                <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-crit" />Safe limit</span>
              </div>
            </div>
            <div className="w-full lg:w-72 flex flex-col">
              <div className="flex items-center gap-2 border-b border-crit/20 pb-2 mb-3">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-crit" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4m0 3h.01M10.3 4.3 2.6 18a1.6 1.6 0 0 0 1.4 2.4h16a1.6 1.6 0 0 0 1.4-2.4L13.7 4.3a1.6 1.6 0 0 0-2.8 0Z"/></svg>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-crit font-semibold">Operator Brief</p>
              </div>
              <p className="text-[13px] text-ink/90 leading-relaxed mb-3">
                <span className="font-semibold text-white">Transformer T-104 (Zone A)</span> is trending toward overload. Load has climbed from 74% to 89% and is projected to reach <span className="font-mono text-crit font-bold">96%</span> of rated capacity within 28 mins. Oil temp is at 78 °C and rising.
              </p>
              <div className="mt-auto bg-crit/10 rounded border border-crit/20 p-2.5">
                <p className="text-xs text-crit/90 leading-relaxed">
                  <span className="font-semibold block mb-1">Recommended action:</span>
                  Shed approx 1.2 MW of non-critical load on T-104 feeder, or reroute via T-102 (currently 58%).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Grid Tree Page ─────────────────────────────────────────────────────────
function GridTreePage() {
  const transformers = INITIAL_ZONES.flatMap(z => z.transformers);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Grid Topology</h2>
          <p className="text-[12px] text-ink/60 font-mono mt-0.5">
            Northeast Region · {transformers.length} transformers across {INITIAL_ZONES.length} zones
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['ok', 'warn', 'crit'] as Status[]).map(s => (
            <span key={s} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusBg(s)}`}>
              {statusLabel(s)} · {transformers.filter(t => t.status === s).length}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-line bg-panel/40 p-5">
        <GridTree gridName={MOCK_GRID_NAME} zones={INITIAL_ZONES} />
      </div>

      <p className="font-mono text-[11px] text-ink/50">
        Select a transformer to open its detail page.
      </p>
    </div>
  );
}

// ── Assets Page ────────────────────────────────────────────────────────────
function AssetsPage({ initialSelected }: { initialSelected?: string }) {
  const allAssets = INITIAL_ZONES.flatMap(z => z.transformers);
  const [selected, setSelected] = useState<Asset | null>(
    initialSelected ? allAssets.find(a => a.id === initialSelected) ?? null : null
  );
  const [filter, setFilter] = useState<Status | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = allAssets.filter(a => {
    if (filter !== 'all' && a.status !== filter) return false;
    if (search && !a.id.toLowerCase().includes(search.toLowerCase()) && !a.zone.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 flex gap-6 h-full overflow-hidden">
      {/* Left: list */}
      <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-y-auto">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-lg font-bold text-white flex-1">Assets</h2>
          {/* Search */}
          <div className="relative">
            <svg viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink/40" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search assets…"
              className="pl-8 pr-3 py-1.5 bg-raised/60 border border-white/10 rounded-lg text-sm text-white placeholder:text-ink/30 focus:outline-none focus:border-ok/40 w-44"
            />
          </div>
          {/* Filter pills */}
          <div className="flex gap-1">
            {(['all','ok','warn','crit'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border transition-colors ${
                  filter === f
                    ? f === 'all' ? 'bg-white/10 border-white/20 text-white'
                      : f === 'ok' ? 'bg-ok/20 border-ok/40 text-ok'
                      : f === 'warn' ? 'bg-warn/20 border-warn/40 text-warn'
                      : 'bg-crit/20 border-crit/40 text-crit'
                    : 'bg-transparent border-white/5 text-ink/50 hover:border-white/15 hover:text-ink/80'
                }`}
              >
                {f === 'all' ? `All (${allAssets.length})` : `${statusLabel(f)} (${allAssets.filter(a => a.status === f).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-white/10 bg-panel/60 backdrop-blur-xl overflow-hidden shadow-2xl">
          {/* Table head */}
          <div className="grid grid-cols-[1fr_1fr_2fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-2.5 border-b border-white/5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink/40">
            <span>ID</span><span>Zone</span><span>Load</span><span>Voltage</span><span>Temp</span><span>Status</span><span>Updated</span>
          </div>
          {/* Rows */}
          <div className="divide-y divide-white/[0.04]">
            {filtered.length === 0 && (
              <div className="py-12 text-center text-ink/30 text-sm font-mono">No assets match the filter</div>
            )}
            {filtered.map(asset => (
              <button
                key={asset.id}
                onClick={() => setSelected(prev => prev?.id === asset.id ? null : asset)}
                className={`w-full grid grid-cols-[1fr_1fr_2fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 text-left transition-all duration-200 hover:bg-white/[0.03] ${selected?.id === asset.id ? 'bg-white/[0.05] border-l-2 border-ok' : ''}`}
              >
                <span className={`font-mono font-bold text-sm ${asset.status === 'crit' ? 'text-crit' : 'text-white'}`}>{asset.id}</span>
                <span className="text-[12px] text-ink/70">{asset.zone}</span>
                <div className="pr-4">
                  <LoadBar value={asset.load} />
                </div>
                <span className="font-mono text-[12px] text-ink/80">{asset.voltage} kV</span>
                <span className={`font-mono text-[12px] ${asset.tempC > 70 ? 'text-warn' : 'text-ink/80'}`}>{asset.tempC}°C</span>
                <StatusBadge status={asset.status} />
                <span className="font-mono text-[11px] text-ink/40">{asset.lastUpdated}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: detail */}
      <div className="w-80 flex-shrink-0 overflow-y-auto">
        {selected ? (
          <div className={`rounded-xl border p-5 flex flex-col gap-5 ${selected.status === 'crit' ? 'border-crit/30 bg-crit/[0.06] shadow-[0_0_30px_rgba(239,68,68,0.1)]' : 'border-white/10 bg-panel/60 backdrop-blur-xl'}`}>
            {selected.status === 'crit' && <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-warn to-crit" />}
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink/50">Asset Details</p>
                  <h3 className="text-2xl font-extrabold text-white">{selected.id}</h3>
                  <p className="text-[12px] text-ink/50 mt-0.5">{selected.type} · {selected.zone}</p>
                </div>
                <StatusBadge status={selected.status} />
              </div>
              <LoadBar value={selected.load} predicted={selected.predictedLoad} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Voltage', val: `${selected.voltage} kV`, icon: '⚡' },
                { label: 'Current', val: `${selected.current} A`, icon: '〜' },
                { label: 'Temperature', val: `${selected.tempC} °C`, icon: '🌡', alert: selected.tempC > 70 },
                { label: 'Pred. Load', val: `${selected.predictedLoad}%`, icon: '↑', alert: (selected.predictedLoad ?? 0) >= 90 },
              ].map(m => (
                <div key={m.label} className={`bg-raised/50 border rounded-lg p-3 ${m.alert ? 'border-warn/30' : 'border-white/5'}`}>
                  <p className="text-[10px] text-ink/50 font-mono uppercase">{m.label}</p>
                  <p className={`text-sm font-bold mt-0.5 ${m.alert ? 'text-warn' : 'text-white'}`}>{m.val}</p>
                </div>
              ))}
            </div>

            {/* Trend mini */}
            <div className="bg-raised/30 border border-white/5 rounded-lg p-3">
              <p className="font-mono text-[10px] uppercase text-ink/50 mb-2">Load History</p>
              <svg viewBox="0 0 240 70" className="w-full h-14" preserveAspectRatio="none">
                {selected.status === 'crit' && <line x1="0" y1="14" x2="240" y2="14" stroke="#ef4444" strokeWidth="0.5" strokeDasharray="2 3" opacity="0.4" />}
                <defs>
                  <linearGradient id={`grad-${selected.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={statusColor(selected.status)} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={statusColor(selected.status)} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d={selected.status === 'crit'
                    ? "M0 58 L30 55 L60 57 L90 50 L120 48 L150 42 L180 35 L210 26 L240 14"
                    : selected.status === 'warn'
                    ? "M0 52 L48 47 L96 49 L144 43 L192 39 L240 34"
                    : "M0 48 L48 44 L96 46 L144 40 L192 43 L240 40"}
                  fill={`url(#grad-${selected.id})`}
                />
                <path
                  d={selected.status === 'crit'
                    ? "M0 58 L30 55 L60 57 L90 50 L120 48 L150 42 L180 35 L210 26 L240 14"
                    : selected.status === 'warn'
                    ? "M0 52 L48 47 L96 49 L144 43 L192 39 L240 34"
                    : "M0 48 L48 44 L96 46 L144 40 L192 43 L240 40"}
                  fill="none"
                  stroke={statusColor(selected.status)}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* AI brief for critical */}
            {selected.status === 'crit' && (
              <div className="bg-crit/10 border border-crit/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-crit" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4m0 3h.01M10.3 4.3 2.6 18a1.6 1.6 0 0 0 1.4 2.4h16a1.6 1.6 0 0 0 1.4-2.4L13.7 4.3a1.6 1.6 0 0 0-2.8 0Z"/></svg>
                  <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-crit font-bold">Operator Brief</p>
                </div>
                <p className="text-[11px] text-ink/80 leading-relaxed">
                  T-104 is projecting <strong className="text-crit">96%</strong> load within 28 minutes. Oil temperature at <strong className="text-warn">{selected.tempC}°C</strong> and rising. Immediate load-shedding recommended.
                </p>
              </div>
            )}

            <p className="text-[10px] text-ink/30 font-mono">Last updated: {selected.lastUpdated}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-white/5 bg-panel/30 p-8 flex flex-col items-center justify-center gap-3 text-center">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-ink/20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="4" width="16" height="16" rx="2"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
            <p className="text-sm text-ink/40">Select an asset from the table to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
const PAGE_TITLES: Record<Page, string> = {
  overview: 'Global Utility Operations Dashboard',
  'grid-tree': 'Grid Topology — Northeast Region',
  assets: 'Asset Registry',
};

function isPage(key: string): key is Page {
  return key === 'overview' || key === 'grid-tree' || key === 'assets';
}

export function Dashboard() {
  const [page, setPage] = useState<Page>('overview');

  function goToPage(next: Page) {
    setPage(next);
  }

  return (
    <AppShell
      title={PAGE_TITLES[page]}
      activeKey={page}
      onSelect={(key) => { if (isPage(key)) goToPage(key); }}
      onBack={page === 'overview' ? undefined : () => goToPage('overview')}
    >
      {page === 'overview' && (
        <div className="h-full overflow-y-auto">
          <OverviewPage onNavigate={goToPage} />
        </div>
      )}
      {page === 'grid-tree' && <GridTreePage />}
      {page === 'assets' && <AssetsPage />}
    </AppShell>
  );
}
