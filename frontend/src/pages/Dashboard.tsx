import { useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────
type Status = 'ok' | 'warn' | 'crit';
type Page = 'overview' | 'grid-tree' | 'assets';

interface Asset {
  id: string;
  zone: string;
  type: string;
  load: number;
  predictedLoad: number | null;
  voltage: number;
  current: number;
  tempC: number;
  status: Status;
  lastUpdated: string;
}

interface Zone {
  id: string;
  name: string;
  status: Status;
  assets: Asset[];
  expanded: boolean;
}

// ── Mock Data ──────────────────────────────────────────────────────────────
const INITIAL_ZONES: Zone[] = [
  {
    id: 'zone-a',
    name: 'Zone A — Downtown Core',
    status: 'warn',
    expanded: true,
    assets: [
      { id: 'T-101', zone: 'Zone A', type: 'Distribution Transformer', load: 62, predictedLoad: 65, voltage: 11.2, current: 312, tempC: 54, status: 'ok', lastUpdated: '13:48:22' },
      { id: 'T-102', zone: 'Zone A', type: 'Distribution Transformer', load: 58, predictedLoad: 61, voltage: 11.4, current: 291, tempC: 51, status: 'ok', lastUpdated: '13:48:19' },
      { id: 'T-104', zone: 'Zone A', type: 'Power Transformer', load: 89, predictedLoad: 96, voltage: 10.8, current: 448, tempC: 78, status: 'crit', lastUpdated: '13:48:30' },
    ],
  },
  {
    id: 'zone-b',
    name: 'Zone B — Industrial West',
    status: 'warn',
    expanded: true,
    assets: [
      { id: 'T-201', zone: 'Zone B', type: 'Distribution Transformer', load: 44, predictedLoad: 47, voltage: 11.5, current: 220, tempC: 42, status: 'ok', lastUpdated: '13:48:10' },
      { id: 'T-202', zone: 'Zone B', type: 'Power Transformer', load: 81, predictedLoad: 85, voltage: 10.9, current: 406, tempC: 69, status: 'warn', lastUpdated: '13:48:27' },
    ],
  },
  {
    id: 'zone-c',
    name: 'Zone C — Northern Suburbs',
    status: 'ok',
    expanded: false,
    assets: [
      { id: 'T-301', zone: 'Zone C', type: 'Distribution Transformer', load: 35, predictedLoad: 37, voltage: 11.6, current: 175, tempC: 38, status: 'ok', lastUpdated: '13:47:55' },
      { id: 'T-302', zone: 'Zone C', type: 'Distribution Transformer', load: 41, predictedLoad: 43, voltage: 11.5, current: 205, tempC: 40, status: 'ok', lastUpdated: '13:48:01' },
      { id: 'T-305', zone: 'Zone C', type: 'Power Transformer', load: 55, predictedLoad: 58, voltage: 11.3, current: 276, tempC: 48, status: 'ok', lastUpdated: '13:48:14' },
    ],
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function statusColor(s: Status) {
  return s === 'ok' ? '#21d07a' : s === 'warn' ? '#f0a92e' : '#ef4444';
}
function statusLabel(s: Status) {
  return s === 'ok' ? 'Healthy' : s === 'warn' ? 'Warning' : 'Critical';
}
function statusBg(s: Status) {
  return s === 'ok' ? 'bg-ok/10 border-ok/30 text-ok' : s === 'warn' ? 'bg-warn/10 border-warn/30 text-warn' : 'bg-crit/10 border-crit/30 text-crit';
}

// ── Sub-components ─────────────────────────────────────────────────────────

// Pill badge
function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBg(status)}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === 'ok' ? 'bg-ok' : status === 'warn' ? 'bg-warn' : 'bg-crit animate-pulse'}`} />
      {statusLabel(status)}
    </span>
  );
}

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
  const allAssets = INITIAL_ZONES.flatMap(z => z.assets);
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

        {/* Right: mini grid tree (static, clickable to navigate) */}
        <div className="z-10 flex-1 glass-card rounded-xl p-6 overflow-x-auto relative">
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 to-transparent rounded-xl" />
          <div className="min-w-[400px]">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink/60">Grid Topology</span>
              <button onClick={() => onNavigate('grid-tree')} className="ml-auto text-[10px] text-ok hover:underline font-mono">View Full Tree →</button>
            </div>
            <ul className="font-mono text-[13px] space-y-3 mt-3">
              <li className="relative">
                <div className="flex items-center gap-2 bg-raised border border-line px-3 py-2 rounded-lg inline-flex shadow-sm">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-ok" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                  <span className="font-bold text-white">Northeast Region Grid</span>
                </div>
                <ul className="ml-6 mt-3 space-y-3 relative">
                  <div className="tree-line-v h-full" />
                  {INITIAL_ZONES.map(zone => (
                    <li key={zone.id} className="relative pl-6">
                      <div className="tree-line-h" />
                      <div className="flex items-center gap-2 bg-panel border border-line px-3 py-1.5 rounded-lg inline-flex shadow-sm">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusColor(zone.status), boxShadow: `0 0 8px ${statusColor(zone.status)}80` }} />
                        <span className="font-semibold text-ink">{zone.name}</span>
                      </div>
                      <ul className="ml-6 mt-2 space-y-1.5 relative pb-1">
                        <div className="tree-line-v h-full" style={{ top: '16px' }} />
                        {zone.assets.map(a => (
                          <li key={a.id} className="relative pl-6">
                            <div className="tree-line-h" />
                            <button
                              onClick={() => onNavigate('assets')}
                              className={`flex justify-between items-center min-w-[240px] px-3 py-1.5 rounded-md cursor-pointer transition-colors text-left w-full ${
                                a.status === 'crit' ? 'bg-crit/[0.08] border-l-2 border border-crit/40 border-l-crit hover:bg-crit/[0.15]' :
                                a.status === 'warn' ? 'bg-raised border border-warn/30 hover:border-warn/60' :
                                'bg-raised border border-line hover:border-ok/50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusColor(a.status) }} />
                                <span className={a.status === 'crit' ? 'font-bold text-crit' : 'text-ink'}>{a.id}</span>
                              </div>
                              <span className={`text-[11px] font-bold ${a.status === 'crit' ? 'text-crit' : a.status === 'warn' ? 'text-warn' : 'text-ink/60'}`}>
                                {a.load}%{a.status === 'crit' ? ' ↑' : ''}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
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
function GridTreePage({ onSelectAsset }: { onSelectAsset: (id: string) => void }) {
  const [zones, setZones] = useState<Zone[]>(INITIAL_ZONES);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  function toggleZone(zoneId: string) {
    setZones(prev => prev.map(z => z.id === zoneId ? { ...z, expanded: !z.expanded } : z));
  }

  function selectAsset(asset: Asset) {
    setSelectedAsset(prev => prev?.id === asset.id ? null : asset);
  }

  return (
    <div className="p-6 flex gap-6 h-full overflow-hidden">
      {/* Main tree panel */}
      <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-y-auto">
        {/* Header stats */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Grid Topology</h2>
            <p className="text-[12px] text-ink/60 font-mono mt-0.5">Northeast Region · {zones.flatMap(z => z.assets).length} assets across {zones.length} zones</p>
          </div>
          <div className="flex gap-2 font-mono text-[10px]">
            {(['ok','warn','crit'] as Status[]).map(s => (
              <span key={s} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${statusBg(s)}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${s === 'ok' ? 'bg-ok' : s === 'warn' ? 'bg-warn' : 'bg-crit'}`} />
                {statusLabel(s)} · {zones.flatMap(z => z.assets).filter(a => a.status === s).length}
              </span>
            ))}
          </div>
        </div>

        {/* Root node */}
        <div className="rounded-xl border border-white/10 bg-panel/60 backdrop-blur-xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 z-0 pointer-events-none opacity-20" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="relative z-10">
            {/* Root */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 bg-raised border border-ok/30 px-4 py-2.5 rounded-xl shadow-[0_0_15px_rgba(33,208,122,0.15)] inline-flex">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-ok" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                <span className="font-bold text-white text-sm">Northeast Region Grid</span>
                <span className="ml-2 text-[10px] font-mono text-ok bg-ok/10 border border-ok/20 rounded px-1.5 py-0.5">11.2 GW</span>
              </div>
            </div>

            {/* Zones */}
            <div className="space-y-4 pl-8 border-l-2 border-white/5">
              {zones.map(zone => (
                <div key={zone.id} className="relative">
                  <div className="absolute -left-[9px] top-4 w-4 h-0.5 bg-white/10" />

                  {/* Zone header */}
                  <button
                    onClick={() => toggleZone(zone.id)}
                    className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl bg-raised/60 border border-white/5 hover:border-white/20 hover:bg-raised transition-all duration-200 group"
                  >
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: statusColor(zone.status), boxShadow: `0 0 10px ${statusColor(zone.status)}60` }} />
                    <span className="font-semibold text-white text-sm flex-1">{zone.name}</span>
                    <span className="text-[10px] font-mono text-ink/50">{zone.assets.length} assets</span>
                    <StatusBadge status={zone.status} />
                    <svg viewBox="0 0 24 24" className={`h-4 w-4 text-ink/40 transition-transform duration-300 ${zone.expanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>

                  {/* Assets list */}
                  {zone.expanded && (
                    <div className="mt-2 pl-6 space-y-2 border-l-2 border-white/5">
                      {zone.assets.map(asset => (
                        <div key={asset.id} className="relative">
                          <div className="absolute -left-[9px] top-1/2 -translate-y-1/2 w-4 h-0.5 bg-white/10" />
                          <button
                            onClick={() => selectAsset(asset)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all duration-200 ${
                              selectedAsset?.id === asset.id
                                ? asset.status === 'crit' ? 'bg-crit/10 border-crit/40 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                                  : asset.status === 'warn' ? 'bg-warn/10 border-warn/30' : 'bg-ok/10 border-ok/30'
                                : asset.status === 'crit' ? 'bg-crit/[0.05] border-crit/20 hover:border-crit/40 hover:bg-crit/10'
                                  : 'bg-raised/40 border-white/5 hover:border-white/15 hover:bg-raised/80'
                            }`}
                          >
                            <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: statusColor(asset.status), boxShadow: asset.status !== 'ok' ? `0 0 8px ${statusColor(asset.status)}80` : undefined }} />
                            <span className={`font-mono font-bold text-sm ${asset.status === 'crit' ? 'text-crit' : 'text-white'}`}>{asset.id}</span>
                            <span className="text-[11px] text-ink/50">{asset.type}</span>
                            <div className="ml-auto flex items-center gap-3">
                              <div className="w-20 hidden sm:block">
                                <LoadBar value={asset.load} />
                              </div>
                              <span className={`text-[11px] font-mono font-bold ${asset.status === 'crit' ? 'text-crit' : asset.status === 'warn' ? 'text-warn' : 'text-ok'}`}>
                                {asset.load}%
                              </span>
                              {asset.status === 'crit' && (
                                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-crit" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
                              )}
                              <StatusBadge status={asset.status} />
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detail panel */}
      <div className={`w-80 flex-shrink-0 transition-all duration-300 ${selectedAsset ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {selectedAsset && (
          <div className={`rounded-xl border p-5 flex flex-col gap-4 sticky top-0 ${selectedAsset.status === 'crit' ? 'border-crit/30 bg-crit/[0.06] shadow-[0_0_30px_rgba(239,68,68,0.1)]' : 'border-white/10 bg-panel/60 backdrop-blur-xl'}`}>
            {selectedAsset.status === 'crit' && <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-warn to-crit rounded-t-xl" />}
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink/50">Asset Detail</p>
                <h3 className="text-xl font-extrabold text-white mt-0.5">{selectedAsset.id}</h3>
                <p className="text-[12px] text-ink/60">{selectedAsset.type}</p>
              </div>
              <StatusBadge status={selectedAsset.status} />
            </div>

            <LoadBar value={selectedAsset.load} predicted={selectedAsset.predictedLoad} />

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Voltage', val: `${selectedAsset.voltage} kV` },
                { label: 'Current', val: `${selectedAsset.current} A` },
                { label: 'Temp', val: `${selectedAsset.tempC} °C`, alert: selectedAsset.tempC > 70 },
                { label: 'Zone', val: selectedAsset.zone },
              ].map(m => (
                <div key={m.label} className="bg-raised/50 border border-white/5 rounded-lg p-3">
                  <p className="text-[10px] text-ink/50 font-mono uppercase">{m.label}</p>
                  <p className={`text-sm font-bold mt-0.5 ${m.alert ? 'text-warn' : 'text-white'}`}>{m.val}</p>
                </div>
              ))}
            </div>

            <div className="bg-raised/30 border border-white/5 rounded-lg p-3">
              <p className="text-[10px] text-ink/50 font-mono uppercase mb-1">Load Trend (mini)</p>
              <svg viewBox="0 0 200 60" className="w-full h-12" preserveAspectRatio="none">
                {selectedAsset.status === 'crit' && <line x1="0" y1="12" x2="200" y2="12" stroke="#ef4444" strokeWidth="0.5" strokeDasharray="2 3" opacity="0.5" />}
                <path
                  d={selectedAsset.status === 'crit'
                    ? "M0 50 L25 47 L50 48 L75 42 L100 40 L125 36 L150 30 L175 22 L200 10"
                    : selectedAsset.status === 'warn'
                    ? "M0 45 L40 40 L80 42 L120 36 L160 32 L200 28"
                    : "M0 40 L40 36 L80 38 L120 34 L160 36 L200 33"}
                  fill="none"
                  stroke={statusColor(selectedAsset.status)}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle cx="200" cy={selectedAsset.status === 'crit' ? 10 : selectedAsset.status === 'warn' ? 28 : 33} r="3" fill={statusColor(selectedAsset.status)} />
              </svg>
            </div>

            <p className="text-[10px] text-ink/40 font-mono text-right">Last updated: {selectedAsset.lastUpdated}</p>

            <button
              onClick={() => onSelectAsset(selectedAsset.id)}
              className="w-full py-2 rounded-lg border border-white/10 text-sm font-semibold text-ink/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              View in Assets →
            </button>
          </div>
        )}
        {!selectedAsset && (
          <div className="rounded-xl border border-white/5 bg-panel/30 p-8 flex flex-col items-center justify-center gap-3 text-center h-48">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-ink/20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            <p className="text-sm text-ink/40">Select an asset from the tree to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Assets Page ────────────────────────────────────────────────────────────
function AssetsPage({ initialSelected }: { initialSelected?: string }) {
  const allAssets = INITIAL_ZONES.flatMap(z => z.assets);
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

// ── Sidebar nav item ───────────────────────────────────────────────────────
function NavItem({
  icon, label, active, badge, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 text-left ${
        active
          ? 'bg-white/10 text-white font-semibold border border-white/5 shadow-sm'
          : 'text-ink/90 hover:bg-white/5 hover:text-white hover:translate-x-1'
      }`}
    >
      <div className="flex items-center gap-3">{icon}{label}</div>
      {badge}
    </button>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export function Dashboard() {
  const [page, setPage] = useState<Page>('overview');
  const [selectedAssetId, setSelectedAssetId] = useState<string | undefined>();

  function goToAsset(id: string) {
    setSelectedAssetId(id);
    setPage('assets');
  }

  const pageTitle: Record<Page, string> = {
    overview: 'GLOBAL UTILITY OPERATIONS DASHBOARD',
    'grid-tree': 'GRID TOPOLOGY — NORTHEAST REGION',
    assets: 'ASSET REGISTRY',
  };

  return (
    <div className="dark scroll-smooth font-sans text-ink antialiased h-screen w-screen overflow-hidden flex bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-panel/40 via-base to-[#04060a]">

      {/* ══════════════════ SIDEBAR ══════════════════ */}
      <aside className="w-[260px] flex flex-col border-r border-white/5 bg-panel/30 backdrop-blur-2xl flex-shrink-0 h-full relative z-20 shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <a href="/" className="flex items-center gap-2.5 group">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-ok/30 bg-ok/10 shadow-[0_0_15px_rgba(33,208,122,0.2)] group-hover:shadow-[0_0_25px_rgba(33,208,122,0.4)] transition-all duration-300">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-ok group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.4 7.5 9.5 4.4-1.1 7.5-4.9 7.5-9.5V6L12 3Z" />
                <path d="m9.3 12.2 2-3.4v3h3.4l-4.3 4.4v-4h-1.1Z" fill="currentColor" stroke="none" />
              </svg>
            </span>
            <span className="text-[15px] font-extrabold tracking-[0.16em] text-gradient">GRIDGUARD</span>
          </a>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <NavItem
            active={page === 'overview'}
            onClick={() => setPage('overview')}
            label="Overview"
            badge={<span className="text-[10px] font-bold text-ok uppercase tracking-wider drop-shadow-[0_0_5px_rgba(33,208,122,0.5)]">Active</span>}
            icon={<svg viewBox="0 0 24 24" className={`h-5 w-5 ${page === 'overview' ? 'text-ok drop-shadow-[0_0_5px_rgba(33,208,122,0.5)]' : 'opacity-70'}`} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>}
          />
          <NavItem
            active={page === 'grid-tree'}
            onClick={() => setPage('grid-tree')}
            label="Grid Tree"
            icon={<svg viewBox="0 0 24 24" className={`h-5 w-5 ${page === 'grid-tree' ? 'text-ok' : 'opacity-70'}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 7v5m0 0H6v5m6-5h6v5"/><rect x="9" y="3" width="6" height="4" rx="1"/><rect x="3" y="17" width="6" height="4" rx="1"/><rect x="15" y="17" width="6" height="4" rx="1"/></svg>}
          />
          <NavItem
            active={page === 'assets'}
            onClick={() => { setSelectedAssetId(undefined); setPage('assets'); }}
            label="Assets"
            icon={<svg viewBox="0 0 24 24" className={`h-5 w-5 ${page === 'assets' ? 'text-ok' : 'opacity-70'}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>}
          />
          <NavItem
            active={false}
            onClick={() => {}}
            label="Alerts"
            badge={<span className="rounded bg-warn/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-warn leading-none border border-warn/30 shadow-[0_0_8px_rgba(240,169,46,0.3)]">6</span>}
            icon={<svg viewBox="0 0 24 24" className="h-5 w-5 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
          />
          <NavItem
            active={false}
            onClick={() => {}}
            label="Reporting"
            icon={<svg viewBox="0 0 24 24" className="h-5 w-5 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}
          />
          <NavItem
            active={false}
            onClick={() => {}}
            label="Settings"
            icon={<svg viewBox="0 0 24 24" className="h-5 w-5 opacity-70 mt-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>}
          />
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-white/5">
          <div className="rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-3 flex flex-col gap-3 shadow-lg hover:border-white/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10 flex-shrink-0">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-ink/80" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">A. Petrov</p>
                <p className="text-[11px] text-ink/70 truncate flex items-center gap-1.5">
                  Operator · <span className="text-ok drop-shadow-[0_0_5px_rgba(33,208,122,0.5)]">Online</span>
                </p>
              </div>
            </div>
            <button className="w-full flex justify-center items-center gap-2 py-1.5 text-xs text-ink/80 hover:text-white hover:bg-white/10 rounded-md transition-colors border border-transparent hover:border-white/10">
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* ══════════════════ MAIN CONTENT ══════════════════ */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 flex items-center px-6 border-b border-white/5 bg-panel/30 backdrop-blur-xl flex-shrink-0 justify-between relative z-10 shadow-sm">
          <div className="flex items-center gap-3">
            {page !== 'overview' && (
              <button onClick={() => setPage('overview')} className="p-1.5 rounded-lg border border-white/10 text-ink/60 hover:bg-white/10 hover:text-white transition-colors">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
            )}
            <h1 className="text-sm font-bold uppercase tracking-[0.12em] text-white">{pageTitle[page]}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ok/30 bg-ok/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wide text-ok shadow-[0_0_12px_rgba(33,208,122,0.2)]">
              <span className="h-1.5 w-1.5 rounded-full bg-ok animate-pulse" />
              SIMULATED FEED · LIVE
            </span>
            <button className="p-2 rounded-lg border border-white/10 text-ink/80 hover:bg-white/10 hover:text-white transition-colors">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-hidden">
          {page === 'overview' && <div className="h-full overflow-y-auto"><OverviewPage onNavigate={(p) => { setSelectedAssetId(undefined); setPage(p); }} /></div>}
          {page === 'grid-tree' && <GridTreePage onSelectAsset={goToAsset} />}
          {page === 'assets' && <AssetsPage initialSelected={selectedAssetId} />}
        </div>
      </main>
    </div>
  );
}
