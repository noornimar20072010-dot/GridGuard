import { useState } from 'react';
import { useNavigate } from 'react-router-dom';


export function Login() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <div className="font-sans text-ink antialiased min-h-screen bg-base">
      

  {/* ══════════════════ NAVBAR ══════════════════ */}
  <header className="sticky top-0 z-40 border-b border-line/80 bg-base/85 backdrop-blur">
    <nav className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-5 lg:px-8" aria-label="Main">
      {/* Logo */}
      <a href="#top" className="flex shrink-0 items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-lg border border-ok/25 bg-ok/10">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-ok" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.4 7.5 9.5 4.4-1.1 7.5-4.9 7.5-9.5V6L12 3Z" />
            <path d="m9.3 12.2 2-3.4v3h3.4l-4.3 4.4v-4h-1.1Z" fill="currentColor" stroke="none" />
          </svg>
        </span>
        <span className="text-[17px] font-bold tracking-[0.16em]">GRIDGUARD</span>
      </a>

      {/* Desktop links */}
      <ul className="ml-4 hidden items-center gap-1 text-sm text-slate-300 lg:flex">
        <li><a className="rounded-md px-3 py-2 transition-colors hover:bg-raised hover:text-ink"
            href="#features">Features</a></li>
        <li><a className="rounded-md px-3 py-2 transition-colors hover:bg-raised hover:text-ink" href="#how-it-works">How it
            works</a></li>
        <li><a className="rounded-md px-3 py-2 transition-colors hover:bg-raised hover:text-ink" href="#grid-tree">Grid
            tree</a></li>
        <li><a className="rounded-md px-3 py-2 transition-colors hover:bg-raised hover:text-ink" href="#ai-summary">AI
            summary</a></li>
      </ul>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">
        <span className="mr-1 hidden items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 md:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-ok"></span>
          <span className="font-mono text-sm tracking-wide text-slate-300">SIMULATED FEED · LIVE</span>
        </span>
        <button type="button" onClick={() => setIsModalOpen(true)}
          className="rounded-lg px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-raised">
          Sign in
        </button>
        <button type="button" onClick={() => setIsModalOpen(true)}
          className="hidden rounded-lg bg-ok px-4 py-2 text-sm font-semibold text-base transition-colors hover:bg-ok/90 sm:block">
          Open dashboard
        </button>
        <button type="button" onClick={() => navigate('/dashboard')}
          className="hidden rounded-lg border border-line bg-panel px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-raised sm:block">
          Open demo
        </button>
        {/* Mobile menu toggle */}
        <button type="button" id="navToggle" aria-expanded="false" aria-controls="mobileNav"
          className="rounded-lg border border-line p-2 text-slate-300 hover:text-ink lg:hidden">
          <span className="sr-only">Toggle navigation</span>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"
            aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>
    </nav>

    {/* Mobile links */}
    <div id="mobileNav" className="hidden border-t border-line bg-panel px-5 py-3 lg:hidden">
      <ul className="grid gap-1 text-sm">
        <li><a className="block rounded-md px-3 py-2 text-slate-300 hover:bg-raised hover:text-ink"
            href="#features">Features</a></li>
        <li><a className="block rounded-md px-3 py-2 text-slate-300 hover:bg-raised hover:text-ink" href="#how-it-works">How it
            works</a></li>
        <li><a className="block rounded-md px-3 py-2 text-slate-300 hover:bg-raised hover:text-ink" href="#grid-tree">Grid
            tree</a></li>
        <li><a className="block rounded-md px-3 py-2 text-slate-300 hover:bg-raised hover:text-ink" href="#ai-summary">AI
            summary</a></li>
      </ul>
    </div>
  </header>

  <main id="top">

    {/* ══════════════════ HERO ══════════════════ */}
    <section className="relative overflow-hidden hero-wash before:absolute before:inset-0 before:bg-cover before:bg-center before:bg-[url('/images/transformer-bg.jpg')] before:blur-sm before:z-0">
      <div className="pointer-events-none absolute inset-0 grid-lines" aria-hidden="true"></div>

      <div className="relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-14 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">

          {/* Copy */}
          <div>
            <span
              className="inline-flex items-center gap-2 rounded-full border border-line bg-panel/80 px-3 py-1.5 font-mono text-sm uppercase tracking-[0.14em] text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-warn"></span>
              Predictive monitoring for DISCOMs
            </span>

            <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              See the overload
              <span className="text-ok">before</span>
              the transformer does.
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-300 sm:text-base">
              Most grid monitoring is reactive — it alerts you once a threshold is already breached.
              GridGuard forecasts transformer load from streaming telemetry and raises an early
              warning while there is still time to act.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => setIsModalOpen(true)}
                className="rounded-lg bg-ok px-5 py-3 text-sm font-semibold text-base transition-colors hover:bg-ok/90">
                Sign in to dashboard
              </button>
              <a href="#features"
                className="rounded-lg border border-line bg-panel px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-raised">
                Explore features
              </a>
            </div>

            <p className="mt-5 text-xs leading-relaxed text-slate-300/80">
              Decision-support only. GridGuard complements existing SCADA systems —
              it does not replace them or control equipment.
            </p>

            {/* Stat strip */}
            <dl className="mt-10 grid max-w-lg grid-cols-3 divide-x divide-line rounded-xl border border-line bg-panel/70">
              <div className="px-4 py-4">
                <dt className="font-mono text-sm uppercase tracking-[0.12em] text-slate-300">Lead time</dt>
                <dd className="mt-1 font-mono text-xl font-bold text-ok">30 min</dd>
              </div>
              <div className="px-4 py-4">
                <dt className="font-mono text-sm uppercase tracking-[0.12em] text-slate-300">Refresh</dt>
                <dd className="mt-1 font-mono text-xl font-bold">5 s</dd>
              </div>
              <div className="px-4 py-4">
                <dt className="font-mono text-sm uppercase tracking-[0.12em] text-slate-300">Forecast</dt>
                <dd className="mt-1 font-mono text-xl font-bold">Deterministic</dd>
              </div>
            </dl>
          </div>

          {/* Dashboard preview */}
          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl shadow-black/50">
              {/* Preview top bar */}
              <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                <div className="flex gap-1.5" aria-hidden="true">
                  <span className="h-2.5 w-2.5 rounded-full bg-line"></span>
                  <span className="h-2.5 w-2.5 rounded-full bg-line"></span>
                  <span className="h-2.5 w-2.5 rounded-full bg-line"></span>
                </div>
                <p className="font-mono text-sm uppercase tracking-[0.14em] text-slate-300">
                  Utility operations dashboard
                </p>
                <span
                  className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-crit/10 px-2 py-1 font-mono text-sm font-bold text-crit">
                  3 CRITICAL
                </span>
              </div>

              <div className="grid grid-cols-[128px_minmax(0,1fr)]">
                {/* Mini sidebar */}
                <div className="hidden border-r border-line p-3 sm:block">
                  <ul className="space-y-1 text-base">
                    <li
                      className="flex items-center gap-2 rounded-md border-l-2 border-ok bg-ok/10 px-2 py-2 font-medium text-ok">
                      Overview</li>
                    <li className="px-2 py-2 text-slate-300">Grid tree</li>
                    <li className="px-2 py-2 text-slate-300">Transformers</li>
                    <li className="flex items-center justify-between px-2 py-2 text-slate-300">
                      Alerts
                      <span className="rounded bg-warn/15 px-1.5 font-mono text-sm font-bold text-warn">6</span>
                    </li>
                    <li className="px-2 py-2 text-slate-300">Reporting</li>
                  </ul>
                </div>

                {/* Preview body */}
                <div className="space-y-3 p-3 sm:p-4">
                  {/* Summary cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border border-line bg-raised p-3">
                      <p className="font-mono text-xs uppercase tracking-[0.12em] text-slate-300">Total load</p>
                      <p className="mt-1.5 font-mono text-lg font-bold text-ok">11.2<span
                          className="ml-1 text-sm text-slate-300">GW</span></p>
                    </div>
                    <div className="rounded-lg border border-line bg-raised p-3">
                      <p className="font-mono text-xs uppercase tracking-[0.12em] text-slate-300">Transformers</p>
                      <p className="mt-1.5 font-mono text-lg font-bold">48<span
                          className="ml-1 text-sm text-slate-300">/50</span></p>
                    </div>
                    <div className="rounded-lg border border-line bg-raised p-3">
                      <p className="font-mono text-xs uppercase tracking-[0.12em] text-slate-300">At risk</p>
                      <p className="mt-1.5 font-mono text-lg font-bold text-warn">6</p>
                    </div>
                  </div>

                  {/* Load history + prediction chart */}
                  <div className="rounded-lg border border-line bg-raised p-3">
                    <div className="flex items-baseline justify-between">
                      <p className="font-mono text-sm uppercase tracking-[0.12em] text-slate-300">T-104 · load history</p>
                      <p className="font-mono text-sm text-warn">PREDICTED 96% ▲</p>
                    </div>
                    <svg viewBox="0 0 320 84" className="mt-2 h-24 w-full" preserveAspectRatio="none" role="img"
                      aria-label="Load history rising into predicted overload">
                      {/* threshold */}
                      <line x1="0" y1="18" x2="320" y2="18" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 4"
                        opacity="0.6" />
                      {/* history */}
                      <path d="M0 70 L26 66 L52 68 L78 60 L104 62 L130 54 L156 50 L182 52 L208 44 L234 38" fill="none"
                        stroke="#21d07a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      {/* predicted continuation */}
                      <path d="M234 38 L260 30 L286 24 L312 14" fill="none" stroke="#f0a92e" strokeWidth="2"
                        strokeDasharray="4 3" strokeLinecap="round" />
                      <circle cx="312" cy="14" r="3.5" fill="#f0a92e" />
                    </svg>
                    <div className="flex gap-4 font-mono text-xs text-slate-300">
                      <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-ok"></span>Actual</span>
                      <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-warn"></span>Forecast</span>
                      <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-crit"></span>Safe limit</span>
                    </div>
                  </div>

                  {/* Alert row */}
                  <div className="flex items-center gap-3 rounded-lg border border-crit/25 bg-crit/[0.07] p-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-crit/15 text-crit">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" aria-hidden="true">
                        <path
                          d="M12 9v4m0 3h.01M10.3 4.3 2.6 18a1.6 1.6 0 0 0 1.4 2.4h16a1.6 1.6 0 0 0 1.4-2.4L13.7 4.3a1.6 1.6 0 0 0-2.8 0Z" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold">Predicted overload · Zone A / T-104</p>
                      <p className="truncate font-mono text-sm text-slate-300">96% in 28 min · shed 1.2 MW or reroute via
                        T-102</p>
                    </div>
                    <span
                      className="ml-auto hidden shrink-0 rounded bg-base px-2 py-1 font-mono text-xs text-slate-300 sm:block">AI
                      SUMMARY</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    {/* ══════════════════ FEATURES ══════════════════ */}
    <section id="features" className="border-t border-line bg-base py-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <header className="max-w-2xl">
          <p className="font-mono text-sm uppercase tracking-[0.18em] text-ok">Features</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Everything an operator needs on one screen</h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-300">
            Live telemetry, a deterministic forecast, and an alert trail — designed so the reason
            behind every prediction stays visible and explainable.
          </p>
        </header>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {/* Live telemetry */}
          <article className="rounded-xl border border-line bg-panel p-6 transition-colors hover:border-ok/30">
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-ok/25 bg-ok/10 text-ok">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 12h4l2-6 3 12 2.5-8 2 4h4" />
              </svg>
            </span>
            <h3 className="mt-4 text-base font-semibold">Live telemetry</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Load, voltage, current, and temperature stream in continuously from the simulator and
              refresh transformer readings automatically.
            </p>
          </article>

          {/* Prediction engine */}
          <article className="rounded-xl border border-line bg-panel p-6 transition-colors hover:border-ok/30">
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-ok/25 bg-ok/10 text-ok">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 19V5m0 14h16" />
                <path d="m7 15 4-5 3 3 5-7" />
              </svg>
            </span>
            <h3 className="mt-4 text-base font-semibold">Deterministic prediction</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Moving-average and linear-regression forecasting against safe operating thresholds.
              No black box — every number can be traced and explained.
            </p>
          </article>

          {/* Alerts */}
          <article className="rounded-xl border border-line bg-panel p-6 transition-colors hover:border-warn/30">
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-warn/25 bg-warn/10 text-warn">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" />
                <path d="M13.7 21a2 2 0 0 1-3.4 0" />
              </svg>
            </span>
            <h3 className="mt-4 text-base font-semibold">Early-warning alerts</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Alerts fire when predicted load, temperature, or health status crosses a limit —
              before the safe operating envelope is actually breached.
            </p>
          </article>

          {/* Grid tree */}
          <article className="rounded-xl border border-line bg-panel p-6 transition-colors hover:border-ok/30">
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-ok/25 bg-ok/10 text-ok">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="9" y="3" width="6" height="4" rx="1" />
                <rect x="3" y="17" width="6" height="4" rx="1" />
                <rect x="15" y="17" width="6" height="4" rx="1" />
                <path d="M12 7v5m0 0H6v5m6-5h6v5" />
              </svg>
            </span>
            <h3 className="mt-4 text-base font-semibold">Grid tree navigation</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              A clear hierarchy of grid, zones, and transformers replaces the map. Select any node
              to drill straight into its details.
            </p>
          </article>

          {/* Trend chart */}
          <article className="rounded-xl border border-line bg-panel p-6 transition-colors hover:border-ok/30">
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-ok/25 bg-ok/10 text-ok">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 15c3 0 4-8 7-8s4 6 6 6 3-4 5-4" />
                <path d="M3 20h18" />
              </svg>
            </span>
            <h3 className="mt-4 text-base font-semibold">Historical trend chart</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Recent load history plotted alongside the predicted trend line, so operators can see
              <em className="not-italic text-ink">why</em> a forecast was made.
            </p>
          </article>

          {/* AI summary */}
          <article className="rounded-xl border border-line bg-panel p-6 transition-colors hover:border-ok/30">
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-ok/25 bg-ok/10 text-ok">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 5h16v11H12l-5 4v-4H4V5Z" />
                <path d="M8 10h8M8 13h5" />
              </svg>
            </span>
            <h3 className="mt-4 text-base font-semibold">AI operator summary</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Critical alerts come with a plain-English brief and recommended preventive action.
              The AI explains the decision — it never makes it.
            </p>
          </article>

        </div>
      </div>
    </section>

    {/* ══════════════════ HOW IT WORKS ══════════════════ */}
    <section id="how-it-works" className="border-t border-line bg-panel/40 py-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <header className="max-w-2xl">
          <p className="font-mono text-sm uppercase tracking-[0.18em] text-ok">How it works</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">From reading to recommendation</h2>
        </header>

        <ol className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <li className="rounded-xl border border-line bg-panel p-6">
            <span className="font-mono text-xs font-bold text-ok">01</span>
            <h3 className="mt-3 text-base font-semibold">Telemetry arrives</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              The simulator streams load, voltage, current, and temperature for every transformer
              and persists each reading.
            </p>
          </li>
          <li className="rounded-xl border border-line bg-panel p-6">
            <span className="font-mono text-xs font-bold text-ok">02</span>
            <h3 className="mt-3 text-base font-semibold">Load is forecast</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              The prediction engine projects the load curve forward and compares it against
              each transformer's safe limits.
            </p>
          </li>
          <li className="rounded-xl border border-line bg-panel p-6">
            <span className="font-mono text-xs font-bold text-ok">03</span>
            <h3 className="mt-3 text-base font-semibold">Alert is raised</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              A projected breach raises an alert on the dashboard with severity, affected zone,
              and time to threshold.
            </p>
          </li>
          <li className="rounded-xl border border-line bg-panel p-6">
            <span className="font-mono text-xs font-bold text-ok">04</span>
            <h3 className="mt-3 text-base font-semibold">Operator acts</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              The operator opens the transformer, reads the trend and AI brief, and takes the
              recommended preventive action.
            </p>
          </li>
        </ol>
      </div>
    </section>

    {/* ══════════════════ GRID TREE ══════════════════ */}
    <section id="grid-tree" className="border-t border-line bg-base py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="font-mono text-sm uppercase tracking-[0.18em] text-ok">Grid tree</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Navigate the network, not a map</h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-300">
            Operators think in feeders and zones, not coordinates. The grid tree mirrors the
            electrical hierarchy so any transformer is two clicks away — and its health status is
            visible without opening it.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-slate-300">
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ok"></span>
              Status colour rolls up from transformer to zone to grid.
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ok"></span>
              Selecting a node opens live telemetry, trend chart, and prediction status.
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ok"></span>
              Works the same on desktop and tablet.
            </li>
          </ul>
        </div>

        {/* Tree panel */}
        <div className="rounded-xl border border-line bg-panel p-5">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <p className="font-mono text-sm uppercase tracking-[0.14em] text-slate-300">Grid topology</p>
            <div className="flex gap-3 font-mono text-sm text-slate-300">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-ok"></span>Normal</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warn"></span>Warning</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-crit"></span>Critical</span>
            </div>
          </div>

          <ul className="mt-4 space-y-1 font-mono text-[13px]">
            <li className="flex items-center gap-2 px-2 py-1.5 font-semibold">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2"
                aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
              Grid · Northeast Region
            </li>
            <li className="ml-5 space-y-1 border-l border-line pl-4">
              <p className="flex items-center gap-2 py-1.5 text-slate-300">
                <span className="h-2 w-2 rounded-full bg-warn"></span> Zone A
              </p>
              <ul className="space-y-1">
                <li className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-raised">
                  <span className="h-2 w-2 rounded-full bg-ok"></span> T-101
                  <span className="ml-auto text-sm text-slate-300">62%</span>
                </li>
                <li className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-raised">
                  <span className="h-2 w-2 rounded-full bg-ok"></span> T-102
                  <span className="ml-auto text-sm text-slate-300">58%</span>
                </li>
                <li className="flex items-center gap-2 rounded-md border-l-2 border-crit bg-crit/[0.08] px-2 py-1.5">
                  <span className="h-2 w-2 rounded-full bg-crit"></span>
                  <span className="font-semibold">T-104</span>
                  <span className="ml-auto text-sm font-bold text-crit">96% ▲</span>
                </li>
              </ul>
              <p className="flex items-center gap-2 py-1.5 text-slate-300">
                <span className="h-2 w-2 rounded-full bg-ok"></span> Zone B
              </p>
              <ul className="space-y-1">
                <li className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-raised">
                  <span className="h-2 w-2 rounded-full bg-ok"></span> T-201
                  <span className="ml-auto text-sm text-slate-300">44%</span>
                </li>
                <li className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-raised">
                  <span className="h-2 w-2 rounded-full bg-warn"></span> T-202
                  <span className="ml-auto text-sm text-slate-300">81%</span>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </section>

    {/* ══════════════════ AI SUMMARY ══════════════════ */}
    <section id="ai-summary" className="border-t border-line bg-panel/40 py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-2 lg:px-8">
        {/* Sample brief */}
        <div className="order-2 rounded-xl border border-line bg-panel p-5 lg:order-1">
          <div className="flex items-center gap-2 border-b border-line pb-3">
            <span className="h-2 w-2 rounded-full bg-crit"></span>
            <p className="font-mono text-sm uppercase tracking-[0.14em] text-slate-300">Operator brief · T-104</p>
            <span className="ml-auto rounded bg-raised px-2 py-1 font-mono text-xs text-slate-300">GENERATED</span>
          </div>
          <div className="space-y-3 pt-4 text-sm leading-relaxed text-slate-300">
            <p>
              <span className="font-semibold text-ink">Transformer T-104 (Zone A)</span> is trending toward
              overload. Load has climbed from 74% to 89% over the last 45 minutes and is projected to
              reach <span className="font-mono text-crit">96%</span> of rated capacity within 28 minutes.
              Oil temperature is at 78 °C and rising.
            </p>
            <p>
              <span className="font-semibold text-ink">Recommended action:</span> shed approximately
              1.2 MW of non-critical load on the T-104 feeder, or reroute via T-102, which is
              currently operating at 58%.
            </p>
          </div>
          <p className="mt-4 border-t border-line pt-3 font-mono text-sm leading-relaxed text-slate-300/70">
            Summary generated from telemetry the prediction engine already evaluated. The engine
            determines health status and overload risk; the summary only describes it.
          </p>
        </div>

        <div className="order-1 lg:order-2">
          <p className="font-mono text-sm uppercase tracking-[0.18em] text-ok">AI operator summary</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Plain English, at the moment it matters</h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-300">
            A critical alert is a wall of numbers when a control-room operator has seconds to
            decide. GridGuard turns the engine's output into a short brief: what is happening, how
            fast, and what to do about it.
          </p>
          <div className="mt-6 rounded-lg border border-line bg-base/60 p-4">
            <p className="text-sm font-semibold">Where the line is drawn</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              The deterministic engine owns every decision — health status, overload risk, and
              whether an alert fires. The AI receives those computed results and writes them up.
              It cannot change a status, a threshold, or a prediction.
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* ══════════════════ CTA ══════════════════ */}
    <section className="border-t border-line bg-base py-20">
      <div className="mx-auto max-w-3xl px-5 text-center lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to open the control room?</h2>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-slate-300">
          Sign in with your operator account to view live simulated telemetry, the grid tree, and
          active predictions.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => setIsModalOpen(true)}
            className="rounded-lg bg-ok px-5 py-3 text-sm font-semibold text-base transition-colors hover:bg-ok/90">
            Sign in
          </button>
          <a href="#features"
            className="rounded-lg border border-line bg-panel px-5 py-3 text-sm font-semibold transition-colors hover:bg-raised">
            Review features
          </a>
        </div>
      </div>
    </section>

  </main>

  {/* ══════════════════ FOOTER ══════════════════ */}
  <footer className="border-t border-line bg-panel/60">
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 lg:flex-row lg:items-center lg:px-8">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-lg border border-ok/25 bg-ok/10">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-ok" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.4 7.5 9.5 4.4-1.1 7.5-4.9 7.5-9.5V6L12 3Z" />
          </svg>
        </span>
        <span className="text-sm font-bold tracking-[0.16em]">GRIDGUARD</span>
      </div>
      <p className="max-w-md text-xs leading-relaxed text-slate-300">
        Predictive grid monitoring built on simulated telemetry. A decision-support platform —
        no SCADA integration and no automatic transformer control.
      </p>
      <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-300 lg:ml-auto" aria-label="Footer">
        <a className="hover:text-ink" href="#features">Features</a>
        <a className="hover:text-ink" href="#how-it-works">How it works</a>
        <a className="hover:text-ink" href="#grid-tree">Grid tree</a>
        <a className="hover:text-ink" href="#ai-summary">AI summary</a>
      </nav>
    </div>
  </footer>

  {/* ══════════════════ SIGN-IN MODAL ══════════════════ */}
  <div id="signinModal" className={`fixed inset-0 z-50 ${isModalOpen ? 'flex' : 'hidden'} items-center justify-center p-4`} role="dialog"
    aria-modal="true" aria-labelledby="signinTitle">
    <div className="absolute inset-0 bg-black/70" onClick={() => setIsModalOpen(false)}></div>

    <div className="relative w-full max-w-sm rounded-2xl border border-line bg-panel p-6 shadow-2xl">
      <button type="button" onClick={() => setIsModalOpen(false)}
        className="absolute right-4 top-4 rounded-md p-1 text-slate-300 hover:bg-raised hover:text-ink">
        <span className="sr-only">Close</span>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>

      <span className="grid h-10 w-10 place-items-center rounded-lg border border-ok/25 bg-ok/10">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-ok" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.4 7.5 9.5 4.4-1.1 7.5-4.9 7.5-9.5V6L12 3Z" />
        </svg>
      </span>

      <h2 id="signinTitle" className="mt-4 text-lg font-semibold">Operator sign in</h2>
      <p className="mt-1 text-sm text-slate-300">Access the GridGuard operations dashboard.</p>

      <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); navigate('/dashboard'); }} noValidate>
        <div>
          <label htmlFor="email" className="block text-xs font-medium text-slate-300">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required placeholder="operator@discom.in"
            className="mt-1.5 w-full rounded-lg border border-line bg-base px-3 py-2.5 text-sm placeholder:text-slate-300/50 focus:border-ok focus:outline-none" />
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="password" className="block text-xs font-medium text-slate-300">Password</label>
            <a href="#" className="text-xs text-ok hover:underline">Forgot?</a>
          </div>
          <input id="password" name="password" type="password" autoComplete="current-password" required
            placeholder="••••••••"
            className="mt-1.5 w-full rounded-lg border border-line bg-base px-3 py-2.5 text-sm placeholder:text-slate-300/50 focus:border-ok focus:outline-none" />
        </div>

        <p id="signinNote"
          className="hidden rounded-lg border border-warn/25 bg-warn/[0.08] px-3 py-2 font-mono text-sm leading-relaxed text-warn">
        </p>

        <button type="submit"
          className="w-full rounded-lg bg-ok px-4 py-2.5 text-sm font-semibold text-base transition-colors hover:bg-ok/90">
          Sign in
        </button>
      </form>

      <p className="mt-5 border-t border-line pt-4 text-center font-mono text-sm leading-relaxed text-slate-300/70">
        Secured by Supabase Auth · dashboard routes are protected
      </p>
    </div>
  </div>

  {/* Mobile nav and modal logic will be implemented as React state in future steps */}


    </div>
  );
}
