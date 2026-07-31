import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { StatusBadge } from '@/components/common/StatusBadge';
import { GridTree } from '@/components/dashboard/GridTree';
import { ChatWidget } from '@/components/assistant';
import { TransformerLoadChart } from '@/components/charts/TransformerLoadChart';
import { MOCK_GRID_NAME, MOCK_ZONES } from '@/lib/mock-data';
import type { HealthStatus, Transformer } from '@/types/grid';
import { statusBg, statusColor, statusLabel } from '@/utils/grid-status';

// Local aliases keep this file's existing internals unchanged while the shared domain
// types settle; the remaining views are rebuilt in Milestone 6.
type Status = HealthStatus;
type Asset = Transformer;
type Page = 'overview' | 'grid-tree' | 'assets' | 'alerts' | 'reporting' | 'settings';

interface Settings {
  warnThreshold: number;
  critThreshold: number;
  tempThreshold: number;
}

interface Zone {
  id: string;
  name: string;
  transformers: Transformer[];
}

const INITIAL_ZONES = MOCK_ZONES;
const DEFAULT_SETTINGS: Settings = {
  warnThreshold: 75,
  critThreshold: 90,
  tempThreshold: 80,
};

function useSettingsState() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  return { settings, setSettings };
}

// Health is decided here — deterministically, from load vs. the configured thresholds.
// An asset is judged on its worst case: current load or predicted load, whichever is higher.
function loadStatus(loadPct: number, s: Settings): Status {
  return loadPct >= s.critThreshold ? 'crit' : loadPct >= s.warnThreshold ? 'warn' : 'ok';
}
function assetStatus(asset: Asset, s: Settings): Status {
  return loadStatus(Math.max(asset.load, asset.predictedLoad ?? 0), s);
}
function transformersWithStatus(transformers: Asset[], s: Settings): Asset[] {
  return transformers.map(a => ({ ...a, status: assetStatus(a, s) }));
}
function zonesWithStatus(zones: Zone[], s: Settings): Zone[] {
  return zones.map(z => ({ ...z, transformers: transformersWithStatus(z.transformers, s) }));
}

const PAGE_TITLES: Record<Page, string> = {
  overview: 'GLOBAL UTILITY OPERATIONS DASHBOARD',
  'grid-tree': 'GRID TOPOLOGY — NORTHEAST REGION',
  assets: 'ASSET REGISTRY',
  alerts: 'ALERTS & INCIDENTS',
  reporting: 'OPERATIONAL REPORTING',
  settings: 'SETTINGS & THRESHOLDS',
};

// ── Sub-components ─────────────────────────────────────────────────────────

// Load bar
function LoadBar({ value, predicted, settings }: { value: number; predicted?: number | null; settings: Settings }) {
  const color = statusColor(loadStatus(value, settings));
  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-200">Current</span>
        <span className="font-mono font-bold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-900/5 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, background: color, boxShadow: `0 0 6px ${color}80` }} />
      </div>
      {predicted != null && (
        <div className="flex justify-between text-sm mt-0.5">
          <span className="text-slate-100">Predicted</span>
          <span className="font-mono text-slate-200">{predicted}%</span>
        </div>
      )}
    </div>
  );
}

// ── Overview Page ──────────────────────────────────────────────────────────
function OverviewPage({ onNavigate, settings }: { onNavigate: (p: Page) => void; settings: Settings }) {
  const zones = zonesWithStatus(INITIAL_ZONES, settings);
  const allAssets = zones.flatMap(z => z.transformers);
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
            <p className="font-mono text-base uppercase tracking-[0.12em] text-slate-200">{kpi.label}</p>
            <p className={`text-3xl font-extrabold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-sm text-slate-200">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Grid Tree + T-104 alert – same as before */}
      <section className="rounded-xl border border-white/10 bg-panel/60 backdrop-blur-xl p-6 relative flex flex-col lg:flex-row gap-6 min-h-[420px] shadow-2xl overflow-hidden hover:border-white/20 transition-all duration-500">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-30" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent" />

        {/* Left: summary */}
        <div className="z-10 w-full lg:w-60 flex-shrink-0 flex flex-col gap-4">
          <h2 className="font-mono text-base uppercase tracking-[0.14em] text-white font-bold">Grid Status · NE Region</h2>
          <div className="glass-card p-4 rounded-xl space-y-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            {[
              { label: 'Total Load', val: '11.2 GW', color: 'text-ok' },
              { label: 'Active Lines', val: '96%', color: 'text-ok' },
              { label: 'Critical Alerts', val: String(critCount), color: 'text-crit' },
              { label: 'Warnings', val: String(warnCount), color: 'text-warn' },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-center text-sm">
                <span className="text-slate-100">{r.label}:</span>
                <span className={`font-bold ${r.color}`}>{r.val}</span>
              </div>
            ))}
          </div>
          <div className="mt-auto bg-base/90 backdrop-blur border border-line p-3 rounded-lg flex flex-col gap-2 font-mono text-base text-slate-100">
            <span className="flex items-center gap-2"><span className="h-0.5 w-4 bg-ok rounded" /> Normal (&lt;{settings.warnThreshold}% Load)</span>
            <span className="flex items-center gap-2"><span className="h-0.5 w-4 bg-warn rounded" /> Warning ({settings.warnThreshold}-{settings.critThreshold}%)</span>
            <span className="flex items-center gap-2"><span className="h-0.5 w-4 bg-crit rounded" /> Critical Risk (&gt;{settings.critThreshold}%)</span>
          </div>
        </div>

        {/* Right: grid tree preview — selecting a transformer opens its detail page */}
        <div className="z-10 flex-1 glass-card rounded-xl p-6 overflow-x-auto relative">
          <div className="min-w-[400px]">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-base uppercase tracking-[0.12em] text-slate-200">Grid Topology</span>
              <button onClick={() => onNavigate('grid-tree')} className="ml-auto text-sm text-ok hover:underline font-mono">View Full Tree →</button>
            </div>
            <GridTree gridName={MOCK_GRID_NAME} zones={zones} initialExpandedZones={['zone-a']} />
          </div>
        </div>
      </section>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Load chart */}
        <div className="glass-panel rounded-xl p-5 flex flex-col xl:col-span-1 group hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-mono text-base uppercase tracking-[0.12em] text-slate-100 group-hover:text-white transition-colors">Real-Time Grid Load (GW)</h3>
          </div>
          <div className="flex items-baseline gap-2 mb-6 relative">
            <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-ok to-blue-400 drop-shadow-lg">11.2 GW</span>
          </div>
          <div className="flex-1 min-h-[120px] flex items-end gap-1.5 mt-auto relative">
            <div className="absolute left-0 bottom-0 top-0 w-6 border-r border-line/30 flex flex-col justify-between text-xs text-slate-200 pb-4">
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
          <div className="flex justify-between pl-8 pr-1 mt-2 font-mono text-xs text-slate-200">
            {['00','02','04','06','08','10','12','14','16','18','20','22','Now'].map(t => <span key={t}>{t}</span>)}
          </div>
        </div>

        {/* T-104 alert card */}
        <div className="glass-panel border-crit/40 bg-crit/10 p-5 flex flex-col xl:col-span-2 relative overflow-hidden shadow-[0_0_30px_rgba(239,68,68,0.15)] hover:shadow-[0_0_45px_rgba(239,68,68,0.25)] transition-all duration-500 hover:-translate-y-1">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-warn via-crit to-red-600" />
          <div className="absolute inset-0 bg-gradient-to-br from-crit/5 to-transparent pointer-events-none" />
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-mono text-base uppercase tracking-[0.12em] text-slate-100">Active Alert · T-104 Status</h3>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-lg font-bold text-white">T-104</span>
                <span className="text-sm font-semibold text-crit flex items-center gap-1">PREDICTED OVERLOAD — 96% <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg></span>
              </div>
            </div>
            <span className="h-2 w-2 rounded-full bg-crit mt-1 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
          </div>
          <div className="flex flex-col lg:flex-row gap-6 mt-2 flex-1">
            <div className="flex-1 bg-raised/50 rounded-lg p-4 border border-line flex flex-col justify-between">
              <p className="font-mono text-base uppercase tracking-[0.12em] text-slate-100 mb-2">Load History & Forecast</p>
              <svg viewBox="0 0 320 100" className="mt-1 h-28 w-full" preserveAspectRatio="none" role="img">
                <line x1="0" y1="20" x2="320" y2="20" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 4" opacity="0.6" />
                <path d="M0 80 L26 76 L52 78 L78 70 L104 72 L130 64 L156 60 L182 62 L208 54 L234 48" fill="none" stroke="#21d07a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M234 48 L260 40 L286 34 L312 18" fill="none" stroke="#f0a92e" strokeWidth="2.5" strokeDasharray="5 4" strokeLinecap="round" />
                <circle cx="312" cy="18" r="4" fill="#ef4444" className="animate-pulse" />
              </svg>
              <div className="flex gap-4 font-mono text-xs text-slate-100 mt-2">
                <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-ok" />Actual</span>
                <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-warn" />Forecast</span>
                <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-crit" />Safe limit</span>
              </div>
            </div>
            <div className="w-full lg:w-72 flex flex-col">
              <div className="flex items-center gap-2 border-b border-crit/20 pb-2 mb-3">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-crit" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4m0 3h.01M10.3 4.3 2.6 18a1.6 1.6 0 0 0 1.4 2.4h16a1.6 1.6 0 0 0 1.4-2.4L13.7 4.3a1.6 1.6 0 0 0-2.8 0Z"/></svg>
                <p className="font-mono text-base uppercase tracking-[0.14em] text-crit font-semibold">Operator Brief</p>
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
function GridTreePage({ settings }: { settings: Settings }) {
  const zones = zonesWithStatus(INITIAL_ZONES, settings);
  const transformers = zones.flatMap(z => z.transformers);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Grid Topology</h2>
          <p className="text-base text-slate-200 font-mono mt-0.5">
            Northeast Region · {transformers.length} transformers across {INITIAL_ZONES.length} zones
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['ok', 'warn', 'crit'] as Status[]).map(s => (
            <span key={s} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-bold uppercase tracking-wider ${statusBg(s)}`}>
              {statusLabel(s)} · {transformers.filter(t => t.status === s).length}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-line bg-panel/40 p-5">
        <GridTree gridName={MOCK_GRID_NAME} zones={zones} />
      </div>

      <p className="font-mono text-base text-slate-200">
        Select a transformer to open its detail page.
      </p>
    </div>
  );
}

// ── Assets Page ────────────────────────────────────────────────────────────
function AssetsPage({ initialSelected, settings }: { initialSelected?: string; settings: Settings }) {
  const zones = zonesWithStatus(INITIAL_ZONES, settings);
  const allAssets = zones.flatMap(z => z.transformers);
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
            <svg viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-200" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search assets…"
              className="pl-8 pr-3 py-1.5 bg-raised/60 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-ok/40 w-44"
            />
          </div>
          {/* Filter pills */}
          <div className="flex gap-1">
            {(['all','ok','warn','crit'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-sm font-bold uppercase tracking-wider border transition-colors ${
                  filter === f
                    ? f === 'all' ? 'bg-slate-900/10 border-white/20 text-white'
                      : f === 'ok' ? 'bg-ok/20 border-ok/40 text-ok'
                      : f === 'warn' ? 'bg-warn/20 border-warn/40 text-warn'
                      : 'bg-crit/20 border-crit/40 text-crit'
                    : 'bg-transparent border-white/5 text-slate-200 hover:border-white/15 hover:text-slate-100'
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
          <div className="grid grid-cols-[1fr_1fr_2fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-2.5 border-b border-white/5 font-mono text-base uppercase tracking-[0.1em] text-slate-200">
            <span>ID</span><span>Zone</span><span>Load</span><span>Voltage</span><span>Temp</span><span>Status</span><span>Updated</span>
          </div>
          {/* Rows */}
          <div className="divide-y divide-white/[0.04]">
            {filtered.length === 0 && (
              <div className="py-12 text-center text-slate-300 text-sm font-mono">No assets match the filter</div>
            )}
            {filtered.map(asset => (
              <button
                key={asset.id}
                onClick={() => setSelected(prev => prev?.id === asset.id ? null : asset)}
                className={`w-full grid grid-cols-[1fr_1fr_2fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 text-left transition-all duration-200 hover:bg-slate-900/[0.03] ${selected?.id === asset.id ? 'bg-slate-900/[0.05] border-l-2 border-ok' : ''}`}
              >
                <span className={`font-mono font-bold text-sm ${asset.status === 'crit' ? 'text-crit' : 'text-white'}`}>{asset.id}</span>
                <span className="text-base text-ink/70">{asset.zone}</span>
                <div className="pr-4">
                  <LoadBar value={asset.load} settings={settings} />
                </div>
                <span className="font-mono text-base text-slate-100">{asset.voltage} kV</span>
                <span className={`font-mono text-base ${asset.tempC >= settings.tempThreshold ? 'text-warn' : 'text-slate-100'}`}>{asset.tempC}°C</span>
                <StatusBadge status={asset.status} />
                <span className="font-mono text-base text-slate-200">{asset.lastUpdated}</span>
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
                  <p className="font-mono text-base uppercase tracking-[0.12em] text-slate-200">Asset Details</p>
                  <h3 className="text-2xl font-extrabold text-white">{selected.id}</h3>
                  <p className="text-base text-slate-200 mt-0.5">{selected.type} · {selected.zone}</p>
                </div>
                <StatusBadge status={selected.status} />
              </div>
              <LoadBar value={selected.load} predicted={selected.predictedLoad} settings={settings} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Voltage', val: `${selected.voltage} kV`, icon: '⚡' },
                { label: 'Current', val: `${selected.current} A`, icon: '〜' },
                { label: 'Temperature', val: `${selected.tempC} °C`, icon: '🌡', alert: selected.tempC >= settings.tempThreshold },
                { label: 'Pred. Load', val: `${selected.predictedLoad}%`, icon: '↑', alert: (selected.predictedLoad ?? 0) >= settings.critThreshold },
              ].map(m => (
                <div key={m.label} className={`bg-raised/50 border rounded-lg p-3 ${m.alert ? 'border-warn/30' : 'border-white/5'}`}>
                  <p className="text-sm text-slate-200 font-mono uppercase">{m.label}</p>
                  <p className={`text-sm font-bold mt-0.5 ${m.alert ? 'text-warn' : 'text-white'}`}>{m.val}</p>
                </div>
              ))}
            </div>

            {/* Load History Chart */}
            <TransformerLoadChart
              transformerId={selected.id}
              critThreshold={settings.critThreshold}
              warnThreshold={settings.warnThreshold}
            />

            {/* AI brief for critical */}
            {selected.status === 'crit' && (
              <div className="bg-crit/10 border border-crit/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-crit" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4m0 3h.01M10.3 4.3 2.6 18a1.6 1.6 0 0 0 1.4 2.4h16a1.6 1.6 0 0 0 1.4-2.4L13.7 4.3a1.6 1.6 0 0 0-2.8 0Z"/></svg>
                  <p className="font-mono text-xs uppercase tracking-[0.12em] text-crit font-bold">Operator Brief</p>
                </div>
                <p className="text-sm text-slate-100 leading-relaxed">
                  {selected.id} is projecting <strong className="text-crit">{selected.predictedLoad}%</strong> load, above the {settings.critThreshold}% critical threshold. Oil temperature at <strong className="text-warn">{selected.tempC}°C</strong>. Immediate load-shedding recommended.
                </p>
              </div>
            )}

            <p className="text-sm text-slate-200 font-mono">Last updated: {selected.lastUpdated}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-white/5 bg-panel/30 p-8 flex flex-col items-center justify-center gap-3 text-center">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-ink/20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="4" width="16" height="16" rx="2"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
            <p className="text-sm text-slate-200">Select an asset from the table to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Alerts Page ────────────────────────────────────────────────────────────
function AlertsPage({ settings }: { settings: Settings }) {
  const zones = zonesWithStatus(INITIAL_ZONES, settings);
  const allAssets = zones.flatMap(z => z.transformers);
  const alerts = allAssets.filter(a => a.status !== 'ok').map(a => ({
    id: a.id,
    transformer: a.id,
    zone: a.zone,
    status: a.status,
    load: a.load,
    predicted: a.predictedLoad,
    createdAt: a.lastUpdated,
  }));

  return (
    <div className="p-6">
      <div className="rounded-xl border border-line bg-panel p-6">
        <h2 className="text-lg font-bold text-ink mb-4">Active Alerts</h2>
        {alerts.length === 0 ? (
          <p className="text-slate-200">No active alerts</p>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => (
              <div key={alert.id} className={`rounded-lg border p-4 ${alert.status === 'crit' ? 'border-crit/50 bg-crit/10' : 'border-warn/50 bg-warn/10'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-ink">{alert.transformer} ({alert.zone})</p>
                    <p className="text-sm text-slate-200">Load: {alert.load}% → Predicted: {alert.predicted}%</p>
                  </div>
                  <span className={`rounded-lg px-3 py-1 font-mono text-xs font-bold uppercase ${alert.status === 'crit' ? 'bg-crit/20 text-crit' : 'bg-warn/20 text-warn'}`}>
                    {alert.status === 'crit' ? 'Critical' : 'Warning'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Reporting Page ──────────────────────────────────────────────────────────
function ReportingPage({ settings }: { settings: Settings }) {
  const zones = INITIAL_ZONES;
  const allAssets = zones.flatMap(z => z.transformers);

  // Calculate stats
  const avgLoad = Math.round(allAssets.reduce((sum, a) => sum + a.load, 0) / allAssets.length);
  const avgTemp = Math.round(allAssets.reduce((sum, a) => sum + a.tempC, 0) / allAssets.length);
  const critCount = allAssets.filter(a => Math.max(a.load, a.predictedLoad ?? 0) >= settings.critThreshold).length;
  const warnCount = allAssets.filter(a => Math.max(a.load, a.predictedLoad ?? 0) >= settings.warnThreshold && Math.max(a.load, a.predictedLoad ?? 0) < settings.critThreshold).length;
  const healthyCount = allAssets.filter(a => Math.max(a.load, a.predictedLoad ?? 0) < settings.warnThreshold).length;

  const maxLoad = Math.max(...allAssets.map(a => a.load));
  const minLoad = Math.min(...allAssets.map(a => a.load));

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-xl border border-line bg-panel p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Operational Reporting</h2>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-xs text-slate-200 uppercase tracking-wider">Average Load</p>
            <p className="text-3xl font-bold text-blue-400 mt-2">{avgLoad}%</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-xs text-slate-200 uppercase tracking-wider">Avg Temperature</p>
            <p className="text-3xl font-bold text-orange-400 mt-2">{avgTemp}°C</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-xs text-slate-200 uppercase tracking-wider">Max Load</p>
            <p className="text-3xl font-bold text-red-400 mt-2">{maxLoad}%</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-xs text-slate-200 uppercase tracking-wider">Min Load</p>
            <p className="text-3xl font-bold text-green-400 mt-2">{minLoad}%</p>
          </div>
        </div>

        {/* Health Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-emerald-900/30 border border-emerald-700/30 rounded-lg p-4">
            <p className="text-sm text-slate-200">Healthy Transformers</p>
            <p className="text-4xl font-bold text-emerald-400 mt-2">{healthyCount}</p>
          </div>
          <div className="bg-amber-900/30 border border-amber-700/30 rounded-lg p-4">
            <p className="text-sm text-slate-200">Warning Transformers</p>
            <p className="text-4xl font-bold text-amber-400 mt-2">{warnCount}</p>
          </div>
          <div className="bg-red-900/30 border border-red-700/30 rounded-lg p-4">
            <p className="text-sm text-slate-200">Critical Transformers</p>
            <p className="text-4xl font-bold text-red-400 mt-2">{critCount}</p>
          </div>
        </div>

        {/* Transformer Details Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-3 text-slate-200 font-semibold">Transformer</th>
                <th className="text-right p-3 text-slate-200 font-semibold">Load</th>
                <th className="text-right p-3 text-slate-200 font-semibold">Predicted</th>
                <th className="text-right p-3 text-slate-200 font-semibold">Temp</th>
                <th className="text-center p-3 text-slate-200 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {allAssets.map((asset) => {
                const status = Math.max(asset.load, asset.predictedLoad ?? 0) >= settings.critThreshold ? 'critical' : Math.max(asset.load, asset.predictedLoad ?? 0) >= settings.warnThreshold ? 'warning' : 'healthy';
                const statusColor = status === 'critical' ? 'text-red-400' : status === 'warning' ? 'text-amber-400' : 'text-emerald-400';

                return (
                  <tr key={asset.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                    <td className="p-3 text-slate-200">{asset.id}</td>
                    <td className="text-right p-3 font-mono text-slate-100">{asset.load}%</td>
                    <td className="text-right p-3 font-mono text-slate-200">{asset.predictedLoad}%</td>
                    <td className="text-right p-3 font-mono text-slate-100">{asset.tempC}°C</td>
                    <td className={`text-center p-3 font-semibold ${statusColor}`}>
                      {status.toUpperCase()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Settings Page ───────────────────────────────────────────────────────────
function SettingsPage({ settings, onSettingsChange }: { settings: Settings; onSettingsChange: (settings: Settings) => void }) {
  const [warnThreshold, setWarnThreshold] = useState(settings.warnThreshold);
  const [critThreshold, setCritThreshold] = useState(settings.critThreshold);
  const [tempThreshold, setTempThreshold] = useState(settings.tempThreshold);

  function handleSave() {
    onSettingsChange({
      warnThreshold,
      critThreshold,
      tempThreshold,
    });
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="rounded-xl border border-line bg-panel p-6">
        <h2 className="text-2xl font-bold text-white mb-2">Settings & Thresholds</h2>
        <p className="text-slate-200 text-sm mb-6">Adjust transformer load and temperature thresholds. Changes apply instantly to the dashboard.</p>

        <div className="space-y-6">
          <div className="bg-slate-800/30 rounded-lg p-4">
            <label className="block text-base font-medium text-white mb-4">Warning Load Threshold: <span className="text-amber-400">{warnThreshold}%</span></label>
            <input
              type="range"
              min="0"
              max="100"
              value={warnThreshold}
              onChange={(e) => setWarnThreshold(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-sm text-slate-200 mt-2">Transformers exceeding this load will show a warning (yellow)</p>
          </div>

          <div className="bg-slate-800/30 rounded-lg p-4">
            <label className="block text-base font-medium text-white mb-4">Critical Load Threshold: <span className="text-red-400">{critThreshold}%</span></label>
            <input
              type="range"
              min="0"
              max="100"
              value={critThreshold}
              onChange={(e) => setCritThreshold(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-sm text-slate-200 mt-2">Transformers exceeding this load will show as critical (red)</p>
          </div>

          <div className="bg-slate-800/30 rounded-lg p-4">
            <label className="block text-base font-medium text-white mb-4">Temperature Alert Threshold: <span className="text-orange-400">{tempThreshold}°C</span></label>
            <input
              type="range"
              min="40"
              max="100"
              value={tempThreshold}
              onChange={(e) => setTempThreshold(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-sm text-slate-200 mt-2">Alerts trigger when transformer temperature exceeds this value</p>
          </div>

          {/* Current Values Display */}
          <div className="border border-slate-700 rounded-lg p-4 bg-slate-900/50">
            <p className="text-sm text-slate-200 mb-3 font-semibold">Current Settings:</p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-slate-200">Warning</p>
                <p className="text-xl font-bold text-amber-400">{warnThreshold}%</p>
              </div>
              <div>
                <p className="text-xs text-slate-200">Critical</p>
                <p className="text-xl font-bold text-red-400">{critThreshold}%</p>
              </div>
              <div>
                <p className="text-xs text-slate-200">Temperature</p>
                <p className="text-xl font-bold text-orange-400">{tempThreshold}°C</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 transition-all duration-200 text-base"
          >
            ✓ Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
function isPage(key: string): key is Page {
  return ['overview', 'grid-tree', 'assets', 'alerts', 'reporting', 'settings'].includes(key);
}

export function Dashboard() {
  const [page, setPage] = useState<Page>('overview');
  const { settings, setSettings } = useSettingsState();

  function goToPage(next: Page) {
    setPage(next);
  }

  return (
    <>
    <AppShell
      title={PAGE_TITLES[page]}
      activeKey={page}
      onSelect={(key) => { if (isPage(key)) goToPage(key); }}
      onBack={page === 'overview' ? undefined : () => goToPage('overview')}
    >
      {page === 'overview' && (
        <div
          className="h-full overflow-y-auto grid-background"
          style={{
            background: `
              radial-gradient(circle at 15% 40%, rgba(59, 130, 246, 0.2) 0%, transparent 40%),
              radial-gradient(circle at 85% 80%, rgba(34, 197, 94, 0.2) 0%, transparent 40%),
              linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)
            `,
            backgroundAttachment: 'fixed'
          }}
        >
          <OverviewPage onNavigate={goToPage} settings={settings} />
        </div>
      )}
      {page === 'grid-tree' && <div className="h-full overflow-y-auto grid-background"><GridTreePage settings={settings} /></div>}
      {page === 'assets' && <div className="h-full overflow-y-auto grid-background"><AssetsPage settings={settings} /></div>}
      {page === 'alerts' && <div className="h-full overflow-y-auto grid-background"><AlertsPage settings={settings} /></div>}
      {page === 'reporting' && <div className="h-full overflow-y-auto grid-background"><ReportingPage settings={settings} /></div>}
      {page === 'settings' && <div className="h-full overflow-y-auto grid-background"><SettingsPage settings={settings} onSettingsChange={setSettings} /></div>}
    </AppShell>
    <ChatWidget />
    </>
  );
}