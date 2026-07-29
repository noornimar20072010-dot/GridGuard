import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Types ──────────────────────────────────────────────────────────────────
type Status = 'ok' | 'warn' | 'crit';
type AlertSeverity = 'critical' | 'warning' | 'info';
type AlertState = 'active' | 'acknowledged' | 'resolved';
type Page = 'overview' | 'grid-tree' | 'assets' | 'alerts' | 'reporting' | 'settings';

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

// ── Operator account ───────────────────────────────────────────────────────
// Identity and role are account data, not local preferences — a client that can
// set its own role can grant itself permissions. This is deliberately outside
// Settings and never read from local storage, so it cannot be changed from the
// browser. Milestone 2: source it from the authenticated Supabase session and
// verify the role server-side on every protected request.
const CURRENT_OPERATOR = {
  name: 'A. Petrov',
  role: 'Operator',
} as const;

// ── Settings ───────────────────────────────────────────────────────────────
// Local threshold and session preferences only.
interface Settings {
  warnThreshold: number; // % of rated load
  critThreshold: number; // % of rated load
  tempThreshold: number; // °C
  autoLogout: boolean;
  autoLogoutMinutes: number; // minutes of inactivity before logout
}

const DEFAULT_SETTINGS: Settings = {
  warnThreshold: 80,
  critThreshold: 90,
  tempThreshold: 70,
  autoLogout: true,
  autoLogoutMinutes: 30,
};

// Bounds for the inactivity window, shared by the slider and the storage guard.
const MIN_LOGOUT_MINUTES = 5;
const MAX_LOGOUT_MINUTES = 120;

const SETTINGS_KEY = 'gridguard.settings';

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const stored = JSON.parse(raw) as Record<string, unknown>;

    // Read back only known preference keys, and only when the type matches, so
    // stored data from an earlier build (or a hand-edited entry) can't introduce
    // anything the app didn't define. Also lets later milestones add settings
    // without breaking existing storage.
    const next = { ...DEFAULT_SETTINGS };
    for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
      if (typeof stored[key] === typeof DEFAULT_SETTINGS[key]) {
        (next as Record<string, unknown>)[key] = stored[key];
      }
    }

    // Storage is hand-editable, so re-apply the bounds the UI enforces.
    next.warnThreshold = clamp(next.warnThreshold, 1, 99);
    next.critThreshold = clamp(next.critThreshold, next.warnThreshold + 1, 100);
    next.tempThreshold = clamp(next.tempThreshold, 30, 120);
    next.autoLogoutMinutes = clamp(next.autoLogoutMinutes, MIN_LOGOUT_MINUTES, MAX_LOGOUT_MINUTES);
    return next;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

const SettingsContext = createContext<Settings>(DEFAULT_SETTINGS);
const useSettings = () => useContext(SettingsContext);

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

// ── Alert & Report Data ────────────────────────────────────────────────────
interface AlertItem {
  id: string;
  severity: AlertSeverity;
  state: AlertState;
  assetId: string;
  zone: string;
  title: string;
  detail: string;
  timestamp: string;
  ackBy?: string;
}

const ALERTS: AlertItem[] = [
  { id: 'ALT-001', severity: 'critical', state: 'active',       assetId: 'T-104', zone: 'Zone A', title: 'Predicted Overload — 96%', detail: 'Load projected to reach 96% within 28 min. Oil temp 78°C rising. Immediate action required.', timestamp: '13:47:02' },
  { id: 'ALT-002', severity: 'warning',  state: 'active',       assetId: 'T-202', zone: 'Zone B', title: 'High Load Warning — 81%', detail: 'Load exceeds 80% threshold. Predicted 85% within 60 min if trend continues.', timestamp: '13:43:17' },
  { id: 'ALT-003', severity: 'warning',  state: 'acknowledged', assetId: 'T-202', zone: 'Zone B', title: 'Elevated Temperature — 69°C', detail: 'Oil temperature trending upward. Recommend inspection if temp reaches 75°C.', timestamp: '13:30:44', ackBy: 'A. Petrov' },
  { id: 'ALT-004', severity: 'warning',  state: 'active',       assetId: 'T-104', zone: 'Zone A', title: 'Voltage Sag Detected — 10.8 kV', detail: 'Supply voltage 3.5% below nominal. May indicate upstream feeder strain.', timestamp: '13:22:59' },
  { id: 'ALT-005', severity: 'info',     state: 'active',       assetId: 'T-101', zone: 'Zone A', title: 'Scheduled Maintenance Due', detail: 'T-101 is due for quarterly oil analysis. Schedule within next 7 days.', timestamp: '12:00:00' },
  { id: 'ALT-006', severity: 'info',     state: 'active',       assetId: 'T-305', zone: 'Zone C', title: 'Firmware Update Available', detail: 'Remote monitoring unit firmware v2.4.1 available. Approve to schedule update during low-load window.', timestamp: '09:15:00' },
  { id: 'ALT-007', severity: 'critical', state: 'resolved',     assetId: 'T-201', zone: 'Zone B', title: 'Overcurrent Trip — Cleared', detail: 'T-201 experienced brief overcurrent at 13:01. Protective relay cleared within 120ms. No damage detected.', timestamp: '13:01:32', ackBy: 'System' },
];

interface ReportSection {
  title: string;
  rows: { label: string; value: string; trend?: 'up' | 'down' | 'flat'; good?: boolean }[];
}

const REPORT_SECTIONS: ReportSection[] = [
  {
    title: 'System Load Summary',
    rows: [
      { label: 'Peak Load (24h)',      value: '13.4 GW',  trend: 'up',   good: false },
      { label: 'Average Load (24h)',   value: '10.8 GW',  trend: 'flat', good: true },
      { label: 'Current Load',         value: '11.2 GW',  trend: 'up',   good: true },
      { label: 'Load Factor',          value: '80.6%',    trend: 'flat', good: true },
      { label: 'Reactive Power',       value: '2.3 GVAR', trend: 'down', good: true },
    ],
  },
  {
    title: 'Asset Health Overview',
    rows: [
      { label: 'Total Assets',          value: '8',       trend: 'flat', good: true },
      { label: 'Healthy',               value: '6 (75%)', trend: 'flat', good: true },
      { label: 'In Warning',            value: '1 (12%)', trend: 'up',   good: false },
      { label: 'Critical',              value: '1 (12%)', trend: 'flat', good: false },
      { label: 'Avg. Load (all)',       value: '58.3%',   trend: 'up',   good: false },
      { label: 'Avg. Temperature',      value: '51.7°C',  trend: 'up',   good: false },
    ],
  },
  {
    title: 'Alerts (Last 24h)',
    rows: [
      { label: 'Total Alerts',          value: '7',  trend: 'up',   good: false },
      { label: 'Critical',              value: '2',  trend: 'up',   good: false },
      { label: 'Warnings',              value: '3',  trend: 'flat', good: true },
      { label: 'Informational',         value: '2',  trend: 'flat', good: true },
      { label: 'Resolved',              value: '1',  trend: 'up',   good: true },
      { label: 'Avg. Response Time',    value: '4m 32s', trend: 'down', good: true },
    ],
  },
  {
    title: 'Grid Line Availability',
    rows: [
      { label: 'Total Lines',           value: '48',    trend: 'flat', good: true },
      { label: 'Active Lines',          value: '46 (96%)', trend: 'flat', good: true },
      { label: 'Degraded',              value: '2 (4%)',   trend: 'flat', good: false },
      { label: 'Offline',               value: '0',        trend: 'flat', good: true },
      { label: 'Utilisation (avg)',      value: '71.2%',    trend: 'up',   good: false },
    ],
  },
];

// Bar chart data for 24h load trend (reporting)
const LOAD_24H = [
  {h:'00',v:28},{h:'01',v:24},{h:'02',v:21},{h:'03',v:19},{h:'04',v:18},{h:'05',v:22},
  {h:'06',v:31},{h:'07',v:48},{h:'08',v:67},{h:'09',v:79},{h:'10',v:84},{h:'11',v:88},
  {h:'12',v:91},{h:'13',v:95},{h:'14',v:87},{h:'15',v:80},{h:'16',v:76},{h:'17',v:82},
  {h:'18',v:85},{h:'19',v:79},{h:'20',v:70},{h:'21',v:62},{h:'22',v:51},{h:'23',v:38},
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

// Health is decided here — deterministically, from load vs. the configured thresholds.
// An asset is judged on its worst case: current load or predicted load, whichever is higher.
function loadStatus(loadPct: number, s: Settings): Status {
  return loadPct >= s.critThreshold ? 'crit' : loadPct >= s.warnThreshold ? 'warn' : 'ok';
}
function assetStatus(asset: Asset, s: Settings): Status {
  return loadStatus(Math.max(asset.load, asset.predictedLoad ?? 0), s);
}
function assetsWithStatus(assets: Asset[], s: Settings): Asset[] {
  return assets.map(a => ({ ...a, status: assetStatus(a, s) }));
}
function zonesWithStatus(zones: Zone[], s: Settings): Zone[] {
  return zones.map(z => ({ ...z, assets: assetsWithStatus(z.assets, s) }));
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
  const settings = useSettings();
  const color = statusColor(loadStatus(value, settings));
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
  const settings = useSettings();
  const zones = zonesWithStatus(INITIAL_ZONES, settings);
  const allAssets = zones.flatMap(z => z.assets);
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
            <span className="flex items-center gap-2"><span className="h-0.5 w-4 bg-ok rounded" /> Normal (&lt;{settings.warnThreshold}% Load)</span>
            <span className="flex items-center gap-2"><span className="h-0.5 w-4 bg-warn rounded" /> Warning ({settings.warnThreshold}-{settings.critThreshold}%)</span>
            <span className="flex items-center gap-2"><span className="h-0.5 w-4 bg-crit rounded" /> Critical Risk (&gt;{settings.critThreshold}%)</span>
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
                  {zones.map(zone => (
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
            <span className="h-2 w-2 rounded-full bg-crit mt-1 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
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
  const settings = useSettings();
  const [zoneState, setZoneState] = useState<Zone[]>(INITIAL_ZONES);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Statuses are recomputed on every render so threshold changes apply immediately.
  const zones = zonesWithStatus(zoneState, settings);
  const selectedAsset = zones.flatMap(z => z.assets).find(a => a.id === selectedId) ?? null;

  function toggleZone(zoneId: string) {
    setZoneState(prev => prev.map(z => z.id === zoneId ? { ...z, expanded: !z.expanded } : z));
  }

  function selectAsset(asset: Asset) {
    setSelectedId(prev => prev === asset.id ? null : asset.id);
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
                { label: 'Temp', val: `${selectedAsset.tempC} °C`, alert: selectedAsset.tempC >= settings.tempThreshold },
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
  const settings = useSettings();
  const allAssets = assetsWithStatus(INITIAL_ZONES.flatMap(z => z.assets), settings);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelected ?? null);
  const [filter, setFilter] = useState<Status | 'all'>('all');
  const [search, setSearch] = useState('');

  const selected = allAssets.find(a => a.id === selectedId) ?? null;

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
                onClick={() => setSelectedId(prev => prev === asset.id ? null : asset.id)}
                className={`w-full grid grid-cols-[1fr_1fr_2fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 text-left transition-all duration-200 hover:bg-white/[0.03] ${selected?.id === asset.id ? 'bg-white/[0.05] border-l-2 border-ok' : ''}`}
              >
                <span className={`font-mono font-bold text-sm ${asset.status === 'crit' ? 'text-crit' : 'text-white'}`}>{asset.id}</span>
                <span className="text-[12px] text-ink/70">{asset.zone}</span>
                <div className="pr-4">
                  <LoadBar value={asset.load} />
                </div>
                <span className="font-mono text-[12px] text-ink/80">{asset.voltage} kV</span>
                <span className={`font-mono text-[12px] ${asset.tempC >= settings.tempThreshold ? 'text-warn' : 'text-ink/80'}`}>{asset.tempC}°C</span>
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
                { label: 'Temperature', val: `${selected.tempC} °C`, icon: '🌡', alert: selected.tempC >= settings.tempThreshold },
                { label: 'Pred. Load', val: `${selected.predictedLoad}%`, icon: '↑', alert: (selected.predictedLoad ?? 0) >= settings.critThreshold },
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
                  {selected.id} is projecting <strong className="text-crit">{selected.predictedLoad}%</strong> load, above the {settings.critThreshold}% critical threshold. Oil temperature at <strong className="text-warn">{selected.tempC}°C</strong>. Immediate load-shedding recommended.
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

// ── Alerts Page ───────────────────────────────────────────────────────────
function AlertsPage({ onGoToAsset }: { onGoToAsset: (id: string) => void }) {
  const [alerts, setAlerts] = useState<AlertItem[]>(ALERTS);
  const [filterSev, setFilterSev] = useState<AlertSeverity | 'all'>('all');
  const [filterState, setFilterState] = useState<AlertState | 'all'>('active');
  const [selected, setSelected] = useState<AlertItem | null>(alerts.find(a => a.severity === 'critical' && a.state === 'active') ?? null);

  function acknowledge(id: string) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, state: 'acknowledged' as AlertState, ackBy: CURRENT_OPERATOR.name } : a));
    setSelected(prev => prev?.id === id ? { ...prev, state: 'acknowledged', ackBy: CURRENT_OPERATOR.name } : prev);
  }
  function resolve(id: string) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, state: 'resolved' as AlertState } : a));
    setSelected(prev => prev?.id === id ? { ...prev, state: 'resolved' } : prev);
  }

  const sevColor = (s: AlertSeverity) => s === 'critical' ? { bg: 'bg-crit/10', border: 'border-crit/30', text: 'text-crit', dot: 'bg-crit' } : s === 'warning' ? { bg: 'bg-warn/10', border: 'border-warn/30', text: 'text-warn', dot: 'bg-warn' } : { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', dot: 'bg-blue-400' };
  const stateColor = (s: AlertState) => s === 'active' ? 'text-crit' : s === 'acknowledged' ? 'text-warn' : 'text-ok';

  const filtered = alerts.filter(a => {
    if (filterSev !== 'all' && a.severity !== filterSev) return false;
    if (filterState !== 'all' && a.state !== filterState) return false;
    return true;
  });

  const activeCount  = alerts.filter(a => a.state === 'active').length;
  const critCount    = alerts.filter(a => a.severity === 'critical' && a.state === 'active').length;
  const warnCount    = alerts.filter(a => a.severity === 'warning'  && a.state === 'active').length;

  return (
    <div className="p-6 flex gap-6 h-full overflow-hidden">
      {/* List */}
      <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-y-auto">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Active Alerts',  value: activeCount, color: 'text-crit', glow: 'shadow-[0_0_16px_rgba(239,68,68,0.12)]' },
            { label: 'Critical',       value: critCount,   color: 'text-crit',  glow: '' },
            { label: 'Warnings',       value: warnCount,   color: 'text-warn',  glow: '' },
          ].map(k => (
            <div key={k.label} className={`glass-panel rounded-xl p-4 flex flex-col gap-1 ${k.glow}`}>
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink/50">{k.label}</p>
              <p className={`text-3xl font-extrabold ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="font-mono text-[10px] uppercase text-ink/40 mr-1">Severity:</span>
          {(['all','critical','warning','info'] as const).map(f => (
            <button key={f} onClick={() => setFilterSev(f)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                filterSev === f
                  ? f === 'all' ? 'bg-white/10 border-white/20 text-white'
                    : f === 'critical' ? 'bg-crit/20 border-crit/40 text-crit'
                    : f === 'warning' ? 'bg-warn/20 border-warn/40 text-warn'
                    : 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                  : 'bg-transparent border-white/5 text-ink/40 hover:text-ink/80 hover:border-white/15'
              }`}>{f === 'all' ? 'All' : f}</button>
          ))}
          <span className="font-mono text-[10px] uppercase text-ink/40 ml-3 mr-1">State:</span>
          {(['all','active','acknowledged','resolved'] as const).map(f => (
            <button key={f} onClick={() => setFilterState(f)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                filterState === f ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-ink/40 hover:text-ink/80 hover:border-white/15'
              }`}>{f}</button>
          ))}
        </div>

        {/* Alert list */}
        <div className="flex flex-col gap-2">
          {filtered.length === 0 && (
            <div className="rounded-xl border border-white/5 bg-panel/40 p-10 flex flex-col items-center gap-3">
              <svg viewBox="0 0 24 24" className="h-8 w-8 text-ok/40" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
              <p className="text-sm text-ink/40">No alerts match the current filter</p>
            </div>
          )}
          {filtered.map(alert => {
            const c = sevColor(alert.severity);
            const isSelected = selected?.id === alert.id;
            return (
              <button
                key={alert.id}
                onClick={() => setSelected(prev => prev?.id === alert.id ? null : alert)}
                className={`w-full text-left rounded-xl border p-4 transition-all duration-200 ${isSelected ? `${c.bg} ${c.border}` : 'bg-panel/40 border-white/5 hover:border-white/15 hover:bg-panel/60'} ${alert.state === 'resolved' ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 mt-1 ${c.dot} ${alert.severity === 'critical' && alert.state === 'active' ? 'shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse' : ''}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-mono text-[10px] font-bold uppercase ${c.text}`}>{alert.severity}</span>
                      <span className="font-mono text-[10px] text-ink/30">#{alert.id}</span>
                      <span className="font-mono text-[10px] text-ink/30">·</span>
                      <span className="font-mono text-[10px] text-ink/50">{alert.assetId} · {alert.zone}</span>
                      <span className="ml-auto font-mono text-[10px] text-ink/30">{alert.timestamp}</span>
                    </div>
                    <p className="text-sm font-semibold text-white mt-1">{alert.title}</p>
                    <p className="text-[12px] text-ink/60 mt-0.5 truncate">{alert.detail}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`text-[10px] font-mono font-bold uppercase ${stateColor(alert.state)}`}>{alert.state}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      <div className="w-80 flex-shrink-0 overflow-y-auto">
        {selected ? (() => {
          const c = sevColor(selected.severity);
          return (
            <div className={`rounded-xl border p-5 flex flex-col gap-4 sticky top-0 ${c.bg} ${c.border}`}>
              {selected.severity === 'critical' && <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-warn to-crit rounded-t-xl" />}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-mono font-bold uppercase ${c.text}`}>{selected.severity}</span>
                  <span className="font-mono text-[10px] text-ink/30">· #{selected.id}</span>
                  <span className={`ml-auto text-[10px] font-mono font-bold uppercase ${stateColor(selected.state)}`}>{selected.state}</span>
                </div>
                <h3 className="text-lg font-extrabold text-white leading-tight">{selected.title}</h3>
                <p className="text-[12px] text-ink/60 mt-0.5">{selected.assetId} · {selected.zone} · {selected.timestamp}</p>
              </div>

              <div className={`rounded-lg border p-3 ${c.bg} ${c.border}`}>
                <p className={`text-[11px] font-mono uppercase font-bold mb-1.5 ${c.text}`}>Detail</p>
                <p className="text-[13px] text-ink/90 leading-relaxed">{selected.detail}</p>
              </div>

              {selected.ackBy && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <p className="text-[10px] font-mono uppercase text-ink/40 mb-1">Acknowledged by</p>
                  <p className="text-sm font-semibold text-white">{selected.ackBy}</p>
                </div>
              )}

              {/* Timeline */}
              <div className="bg-raised/30 border border-white/5 rounded-lg p-3">
                <p className="text-[10px] font-mono uppercase text-ink/40 mb-2">Timeline</p>
                <div className="space-y-2">
                  {([
                    { t: selected.timestamp, label: 'Alert raised', done: true },
                    { t: selected.ackBy ? selected.timestamp : '—', label: 'Acknowledged', done: !!selected.ackBy },
                    { t: selected.state === 'resolved' ? selected.timestamp : '—', label: 'Resolved', done: selected.state === 'resolved' },
                  ]).map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full flex-shrink-0 ${step.done ? c.dot : 'bg-white/10'}`} />
                      <span className="text-[11px] text-ink/60">{step.label}</span>
                      <span className="ml-auto font-mono text-[10px] text-ink/30">{step.t}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <button onClick={() => onGoToAsset(selected.assetId)}
                  className="w-full py-2 rounded-lg border border-white/10 text-sm text-ink/80 hover:bg-white/10 hover:text-white transition-colors">View Asset →</button>
                {selected.state === 'active' && (
                  <button onClick={() => acknowledge(selected.id)}
                    className={`w-full py-2 rounded-lg border text-sm font-semibold transition-colors ${c.border} ${c.text} hover:${c.bg}`}>Acknowledge</button>
                )}
                {selected.state !== 'resolved' && (
                  <button onClick={() => resolve(selected.id)}
                    className="w-full py-2 rounded-lg border border-ok/30 text-sm font-semibold text-ok hover:bg-ok/10 transition-colors">Mark Resolved</button>
                )}
              </div>
            </div>
          );
        })() : (
          <div className="rounded-xl border border-white/5 bg-panel/30 p-8 flex flex-col items-center justify-center gap-3 text-center">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-ink/20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <p className="text-sm text-ink/40">Select an alert to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Reporting Page ─────────────────────────────────────────────────────────
function ReportingPage() {
  const settings = useSettings();
  const [activeTab, setActiveTab] = useState<'summary' | 'load' | 'export'>('summary');

  const maxLoad = Math.max(...LOAD_24H.map(d => d.v));

  return (
    <div className="p-6 flex flex-col gap-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Operational Report</h2>
          <p className="text-[12px] text-ink/50 font-mono mt-0.5">Northeast Region · Generated {new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })} 14:05 UTC</p>
        </div>
        <div className="flex gap-2">
          {(['summary','load','export'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider border transition-colors ${
                activeTab === t ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-ink/50 hover:text-ink/80 hover:border-white/15'
              }`}>{t === 'export' ? 'Export' : t === 'load' ? 'Load Chart' : 'Summary'}</button>
          ))}
        </div>
      </div>

      {/* Summary tab */}
      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {REPORT_SECTIONS.map(section => (
            <div key={section.title} className="glass-panel rounded-xl p-5 flex flex-col gap-3 hover:-translate-y-0.5 transition-all duration-300">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink/60 border-b border-white/5 pb-2">{section.title}</h3>
              <div className="divide-y divide-white/[0.04]">
                {section.rows.map(row => (
                  <div key={row.label} className="flex items-center justify-between py-2.5">
                    <span className="text-[13px] text-ink/80">{row.label}</span>
                    <div className="flex items-center gap-2">
                      {row.trend && (
                        <svg viewBox="0 0 24 24" className={`h-3 w-3 ${
                          row.good ? 'text-ok' : 'text-crit'
                        } ${row.trend === 'down' ? 'rotate-180' : row.trend === 'flat' ? 'rotate-90' : ''}`}
                          fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="18 15 12 9 6 15" />
                        </svg>
                      )}
                      <span className={`font-mono text-sm font-bold ${
                        row.good === false ? 'text-warn' : row.good === true ? 'text-ok' : 'text-white'
                      }`}>{row.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load chart tab */}
      {activeTab === 'load' && (
        <div className="glass-panel rounded-xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink/60">24-Hour Load Profile — Northeast Region Grid (% of rated capacity)</h3>
            <div className="flex gap-3 font-mono text-[10px]">
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-ok rounded" />Normal</span>
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-warn rounded" />Warning</span>
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-crit rounded" />Critical</span>
            </div>
          </div>

          <div className="relative h-64 flex items-end gap-[0.8%] mt-2">
            {/* Y axis */}
            <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-[9px] font-mono text-ink/40 pb-5">
              {[100,80,60,40,20,0].map(v => <span key={v}>{v}</span>)}
            </div>
            {/* Grid lines */}
            <div className="absolute inset-0 pl-8 flex flex-col justify-between pointer-events-none pb-5">
              {[0,1,2,3,4,5].map(i => (
                <div key={i} className={`w-full border-t ${
                  i === 1 ? 'border-crit/25' : i === 2 ? 'border-warn/20' : 'border-white/[0.04]'
                }`} />
              ))}
            </div>
            {/* Bars */}
            <div className="pl-9 flex-1 flex items-end gap-[0.8%] h-full pb-5">
              {LOAD_24H.map((d, i) => {
                const barStatus = loadStatus(d.v, settings);
                const barColor = statusColor(barStatus);
                const glow = barStatus === 'crit' ? '0 0 8px rgba(239,68,68,0.7)' : barStatus === 'warn' ? '0 0 8px rgba(240,169,46,0.5)' : '';
                return (
                  <div
                    key={i}
                    title={`${d.h}:00 — ${d.v}%`}
                    className="flex-1 rounded-t transition-all duration-300 hover:opacity-80 cursor-pointer relative group"
                    style={{ height: `${(d.v / 100) * 100}%`, backgroundColor: barColor, boxShadow: glow }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-raised border border-white/10 rounded px-1.5 py-0.5 text-[9px] font-mono text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">{d.v}%</div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* X axis */}
          <div className="flex pl-9 gap-[0.8%] font-mono text-[9px] text-ink/30">
            {LOAD_24H.map(d => <span key={d.h} className="flex-1 text-center">{d.h}</span>)}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3 pt-2 border-t border-white/5">
            {[
              { label: 'Peak', value: `${maxLoad}%`, color: 'text-crit' },
              { label: 'Average', value: `${Math.round(LOAD_24H.reduce((a,d)=>a+d.v,0)/LOAD_24H.length)}%`, color: 'text-warn' },
              { label: 'Min', value: `${Math.min(...LOAD_24H.map(d=>d.v))}%`, color: 'text-ok' },
              { label: `Hours >${settings.warnThreshold}%`, value: `${LOAD_24H.filter(d=>d.v>=settings.warnThreshold).length}h`, color: 'text-warn' },
            ].map(s => (
              <div key={s.label} className="bg-raised/40 border border-white/5 rounded-lg p-3 text-center">
                <p className="text-[10px] font-mono text-ink/40 uppercase">{s.label}</p>
                <p className={`text-xl font-extrabold mt-0.5 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export tab */}
      {activeTab === 'export' && (
        <div className="glass-panel rounded-xl p-6 flex flex-col gap-5">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink/60">Export Reports</h3>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {[
              { title: 'System Summary Report', desc: 'Full operational summary including load, asset health, alerts and line availability for the reporting period.', format: 'PDF', icon: '📄', size: '~420 KB' },
              { title: 'Alert Log (CSV)', desc: 'All alerts with timestamps, severity, state, and resolution notes. Compatible with SCADA and ticketing systems.', format: 'CSV', icon: '📊', size: '~18 KB' },
              { title: 'Telemetry Raw Data', desc: 'Minute-by-minute load, voltage, current, and temperature readings for all assets over the selected period.', format: 'JSON', icon: '🗂', size: '~2.1 MB' },
            ].map(exp => (
              <div key={exp.title} className="bg-raised/40 border border-white/5 rounded-xl p-5 flex flex-col gap-3 hover:border-white/15 transition-colors group">
                <div className="flex items-start justify-between">
                  <span className="text-2xl">{exp.icon}</span>
                  <span className="font-mono text-[10px] bg-white/5 border border-white/10 rounded px-2 py-0.5 text-ink/60">{exp.format}</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{exp.title}</h4>
                  <p className="text-[12px] text-ink/50 mt-1 leading-relaxed">{exp.desc}</p>
                </div>
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                  <span className="font-mono text-[10px] text-ink/30">{exp.size}</span>
                  <button className="flex items-center gap-1.5 text-[11px] font-bold text-ok hover:text-white transition-colors">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Date range picker (decorative) */}
          <div className="bg-raised/30 border border-white/5 rounded-xl p-4 flex flex-wrap items-center gap-4">
            <p className="font-mono text-[10px] uppercase text-ink/40">Report Period:</p>
            {[['From', '2026-07-28'], ['To', '2026-07-29']].map(([label, val]) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-[11px] text-ink/50">{label}</span>
                <div className="flex items-center gap-2 bg-raised border border-white/10 rounded-lg px-3 py-1.5">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-ink/40" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span className="font-mono text-[12px] text-white">{val}</span>
                </div>
              </div>
            ))}
            <button className="ml-auto flex items-center gap-2 px-4 py-1.5 rounded-lg bg-ok/10 border border-ok/30 text-ok text-[11px] font-bold hover:bg-ok/20 transition-colors">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              Generate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Settings Page ──────────────────────────────────────────────────────────
function SettingsSection({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="glass-panel rounded-xl p-5 flex flex-col gap-3">
      <div className="border-b border-white/5 pb-2.5">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink/60">{title}</h3>
        <p className="text-[12px] text-ink/40 mt-1 leading-relaxed">{desc}</p>
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-4 text-left w-full py-2 rounded-lg hover:bg-white/[0.03] px-1 transition-colors"
    >
      <span className={`relative h-5 w-9 rounded-full border transition-colors flex-shrink-0 ${checked ? 'bg-ok/25 border-ok/50' : 'bg-white/5 border-white/10'}`}>
        <span className={`absolute top-[3px] h-3 w-3 rounded-full transition-all duration-200 ${checked ? 'left-[19px] bg-ok shadow-[0_0_8px_rgba(33,208,122,0.6)]' : 'left-[3px] bg-ink/40'}`} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] font-semibold text-white">{label}</span>
        <span className="block text-[11px] text-ink/50 mt-0.5">{desc}</span>
      </span>
    </button>
  );
}

function ThresholdField({
  label, desc, value, unit, min, max, step, accent, disabled, onChange,
}: {
  label: string; desc: string; value: number; unit: string;
  min: number; max: number; step?: number; accent: string;
  disabled?: boolean; onChange: (v: number) => void;
}) {
  return (
    <div className={`py-2${disabled ? ' opacity-40' : ''}`}>
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-white">{label}</p>
          <p className="text-[11px] text-ink/50 mt-0.5">{desc}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            disabled={disabled}
            onChange={e => onChange(Number(e.target.value))}
            aria-label={label}
            className="w-16 bg-raised/60 border border-white/10 rounded-lg px-2 py-1 font-mono text-sm font-bold text-right text-white focus:outline-none focus:border-ok/40 disabled:cursor-not-allowed"
          />
          <span className="font-mono text-[11px] text-ink/40 w-8">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={e => onChange(Number(e.target.value))}
        aria-label={`${label} slider`}
        className="w-full mt-2.5 h-1 appearance-none rounded-full bg-white/10 cursor-pointer disabled:cursor-not-allowed"
        style={{ accentColor: accent }}
      />
    </div>
  );
}

function clamp(v: number, min: number, max: number) {
  return Number.isNaN(v) ? min : Math.min(max, Math.max(min, v));
}

function SettingsPage({ settings, onChange, onReset }: {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onReset: () => void;
}) {
  const assets = assetsWithStatus(INITIAL_ZONES.flatMap(z => z.assets), settings);
  const counts = {
    ok: assets.filter(a => a.status === 'ok').length,
    warn: assets.filter(a => a.status === 'warn').length,
    crit: assets.filter(a => a.status === 'crit').length,
  };
  const isDefault = (Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[])
    .every(k => settings[k] === DEFAULT_SETTINGS[k]);

  // Keep the two load thresholds ordered: warning must always sit below critical.
  function setWarn(v: number) {
    const warn = clamp(v, 1, 99);
    onChange({ warnThreshold: warn, critThreshold: Math.max(settings.critThreshold, warn + 1) });
  }
  function setCrit(v: number) {
    const crit = clamp(v, 2, 100);
    onChange({ critThreshold: crit, warnThreshold: Math.min(settings.warnThreshold, crit - 1) });
  }

  return (
    <div className="p-6 flex flex-col gap-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-white">Settings</h2>
          <p className="text-[12px] text-ink/50 font-mono mt-0.5">
            Applied immediately · saved in this browser
          </p>
        </div>
        <button
          onClick={onReset}
          disabled={isDefault}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-wider transition-colors border-white/10 text-ink/70 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink/70 disabled:cursor-not-allowed"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.36 2.64L3 8"/><path d="M3 3v5h5"/></svg>
          {isDefault ? 'Defaults Active' : 'Reset to Defaults'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Thresholds */}
        <SettingsSection
          title="Alert Thresholds"
          desc="Drives the deterministic health classification across every page. An asset is judged on the higher of its current and predicted load."
        >
          <ThresholdField
            label="Warning Load"
            desc="At or above this load, an asset is flagged Warning."
            value={settings.warnThreshold}
            unit="%"
            min={1}
            max={99}
            accent="#f0a92e"
            onChange={setWarn}
          />
          <ThresholdField
            label="Critical Load"
            desc="At or above this load, an asset is flagged Critical."
            value={settings.critThreshold}
            unit="%"
            min={2}
            max={100}
            accent="#ef4444"
            onChange={setCrit}
          />
          <ThresholdField
            label="Temperature Warning"
            desc="Oil temperature at or above this value is highlighted in asset details."
            value={settings.tempThreshold}
            unit="°C"
            min={30}
            max={120}
            accent="#f0a92e"
            onChange={v => onChange({ tempThreshold: clamp(v, 30, 120) })}
          />

          {/* Live impact of the current thresholds */}
          <div className="mt-1 rounded-lg border border-white/5 bg-raised/40 p-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-ink/40 mb-2">
              Classification at these thresholds
            </p>
            <div className="grid grid-cols-3 gap-2">
              {([
                ['ok', counts.ok],
                ['warn', counts.warn],
                ['crit', counts.crit],
              ] as [Status, number][]).map(([s, n]) => (
                <div key={s} className={`rounded-lg border px-2 py-2 text-center ${statusBg(s)}`}>
                  <p className="text-xl font-extrabold leading-none">{n}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider mt-1">{statusLabel(s)}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-ink/40 mt-2 font-mono">of {assets.length} monitored assets</p>
          </div>
        </SettingsSection>

        {/* Security */}
        <SettingsSection
          title="Security"
          desc="Protects an unattended workstation. The inactivity timer runs in this browser and ends the operator's session locally."
        >
          <Toggle
            label="Session timeout"
            desc="Automatically log out after a period of inactivity."
            checked={settings.autoLogout}
            onChange={v => onChange({ autoLogout: v })}
          />
          <ThresholdField
            label="Log out after"
            desc="Idle time before the session ends. Mouse, keyboard, scroll and touch activity reset the timer."
            value={settings.autoLogoutMinutes}
            unit="min"
            min={MIN_LOGOUT_MINUTES}
            max={MAX_LOGOUT_MINUTES}
            step={5}
            accent="#21d07a"
            disabled={!settings.autoLogout}
            onChange={v => onChange({
              autoLogoutMinutes: clamp(v, MIN_LOGOUT_MINUTES, MAX_LOGOUT_MINUTES),
            })}
          />

          <div className="mt-1 rounded-lg border border-white/5 bg-raised/40 p-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-ink/40 mb-1.5">
              Current policy
            </p>
            <p className="text-[12px] text-ink/70 leading-relaxed">
              {settings.autoLogout
                ? `This session ends after ${settings.autoLogoutMinutes} minutes without operator activity.`
                : 'This session stays open until the operator logs out manually.'}
            </p>
          </div>
        </SettingsSection>

        {/* System info — read only */}
        <SettingsSection
          title="System"
          desc="Read-only build and data-source information."
        >
          <div className="divide-y divide-white/[0.04]">
            {[
              { label: 'Telemetry source', value: 'Simulated feed' },
              { label: 'Prediction engine', value: 'Deterministic (moving average)' },
              { label: 'Region', value: 'Northeast' },
              { label: 'Settings storage', value: 'Browser local storage' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-2.5 gap-3">
                <span className="text-[13px] text-ink/80">{row.label}</span>
                <span className="font-mono text-[12px] text-white text-right">{row.value}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-ink/40 leading-relaxed mt-1">
            Settings are stored locally in this browser only. Server-side operator preferences
            arrive with the authentication milestone.
          </p>
        </SettingsSection>
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
  const navigate = useNavigate();
  const [page, setPage] = useState<Page>('overview');
  const [selectedAssetId, setSelectedAssetId] = useState<string | undefined>();
  const [settings, setSettings] = useState<Settings>(loadSettings);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Storage unavailable (private mode / quota) — settings stay in memory for this session.
    }
  }, [settings]);

  const logOut = useCallback(() => navigate('/', { replace: true }), [navigate]);

  // Inactivity timeout. This is a client-side guard for an unattended screen: it
  // leaves the dashboard, it does not revoke a server session. Real session
  // expiry belongs to Supabase Auth in the authentication milestone.
  useEffect(() => {
    if (!settings.autoLogout) return;

    const idleMs = settings.autoLogoutMinutes * 60_000;
    const activity = ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const;
    let timer = 0;

    function restart() {
      window.clearTimeout(timer);
      timer = window.setTimeout(logOut, idleMs);
    }

    restart();
    activity.forEach(e => window.addEventListener(e, restart, { passive: true }));
    return () => {
      window.clearTimeout(timer);
      activity.forEach(e => window.removeEventListener(e, restart));
    };
  }, [settings.autoLogout, settings.autoLogoutMinutes, logOut]);

  function goToAsset(id: string) {
    setSelectedAssetId(id);
    setPage('assets');
  }

  return (
    <SettingsContext.Provider value={settings}>
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
            active={page === 'alerts'}
            onClick={() => setPage('alerts')}
            label="Alerts"
            badge={<span className="rounded bg-warn/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-warn leading-none border border-warn/30 shadow-[0_0_8px_rgba(240,169,46,0.3)]">{ALERTS.filter(a => a.state === 'active').length}</span>}
            icon={<svg viewBox="0 0 24 24" className={`h-5 w-5 ${page === 'alerts' ? 'text-ok' : 'opacity-70'}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
          />
          <NavItem
            active={page === 'reporting'}
            onClick={() => setPage('reporting')}
            label="Reporting"
            icon={<svg viewBox="0 0 24 24" className={`h-5 w-5 ${page === 'reporting' ? 'text-ok' : 'opacity-70'}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}
          />
          <NavItem
            active={page === 'settings'}
            onClick={() => setPage('settings')}
            label="Settings"
            icon={<svg viewBox="0 0 24 24" className={`h-5 w-5 ${page === 'settings' ? 'text-ok' : 'opacity-70'}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>}
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
                <p className="text-sm font-semibold text-white truncate">{CURRENT_OPERATOR.name}</p>
                <p className="text-[11px] text-ink/70 truncate flex items-center gap-1.5">
                  {CURRENT_OPERATOR.role} · <span className="text-ok drop-shadow-[0_0_5px_rgba(33,208,122,0.5)]">Online</span>
                </p>
              </div>
            </div>
            <button
              onClick={logOut}
              className="w-full flex justify-center items-center gap-2 py-1.5 text-xs text-ink/80 hover:text-white hover:bg-white/10 rounded-md transition-colors border border-transparent hover:border-white/10"
            >
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
            <h1 className="text-sm font-bold uppercase tracking-[0.12em] text-white">{PAGE_TITLES[page]}</h1>
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
          {page === 'overview'   && <div className="h-full overflow-y-auto"><OverviewPage onNavigate={(p) => { setSelectedAssetId(undefined); setPage(p); }} /></div>}
          {page === 'grid-tree'  && <GridTreePage onSelectAsset={goToAsset} />}
          {page === 'assets'     && <AssetsPage initialSelected={selectedAssetId} />}
          {page === 'alerts'     && <AlertsPage onGoToAsset={goToAsset} />}
          {page === 'reporting'  && <div className="h-full overflow-y-auto"><ReportingPage /></div>}
          {page === 'settings'   && (
            <SettingsPage
              settings={settings}
              onChange={patch => setSettings(prev => ({ ...prev, ...patch }))}
              onReset={() => setSettings(DEFAULT_SETTINGS)}
            />
          )}
        </div>
      </main>
    </div>
    </SettingsContext.Provider>
  );
}
