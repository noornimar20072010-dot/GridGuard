/* GridGuard — static configuration.
 * Thresholds and the grid topology live here so the simulator, predictor and
 * alert manager all read the same numbers.
 */
window.GG = window.GG || {};

GG.config = {
  /* Wall-clock interval between live telemetry ticks. */
  tickMs: 3000,
  /* Number of readings kept per transformer. */
  historyPoints: 40,
  /* Simulated minutes between two readings (a tick advances the grid clock). */
  sampleMinutes: 1.5,

  /* Prediction horizon and the windows the forecast is fitted on. */
  forecastMinutes: 30,
  forecastSteps: 8,
  regressionWindow: 8,
  smoothingWindow: 5,

  /* Safe operating envelope. Load is % of rated capacity, temperature in °C. */
  thresholds: {
    loadWarning: 85,
    loadCritical: 95,
    tempWarning: 78,
    tempCritical: 85,
  },

  /* Status palette — shared with landing.html. Validated for ≥3:1 against the
   * panel surface; every use is paired with a text label or dash pattern so
   * status is never colour-alone. */
  color: {
    ok: '#21d07a',
    warn: '#f0a92e',
    crit: '#ef4444',
    ink: '#e6edf7',
    muted: '#8b98ad',
    line: '#1b2436',
    surface: '#111a2b',
  },

  nominalKv: 11,
};

/* Electrical hierarchy: grid → zones → transformers.
 * Each transformer carries a simulator profile:
 *   base     starting load (% of rated)
 *   amp      amplitude of the slow demand cycle
 *   ramp     sustained %/minute trend (drives the demo scenarios)
 *   rampCap  minutes after which the ramp saturates, so load plateaus
 *   jitter   measurement noise
 *   phase    offset into the demand cycle
 */
GG.grid = {
  name: 'Northeast Region',
  zones: [
    {
      id: 'zone-a',
      name: 'Zone A',
      feeder: 'Sector 14 Feeder',
      transformers: [
        { id: 'T-101', ratedMva: 16.0, base: 60, amp: 5, ramp: 0.010, rampCap: 200, jitter: 1.2, phase: 0.10 },
        { id: 'T-102', ratedMva: 12.5, base: 55, amp: 4, ramp: 0.000, rampCap: 200, jitter: 1.0, phase: 0.45 },
        { id: 'T-103', ratedMva: 10.0, base: 66, amp: 6, ramp: 0.020, rampCap: 200, jitter: 1.4, phase: 0.70 },
        { id: 'T-104', ratedMva: 12.5, base: 70, amp: 4, ramp: 0.300, rampCap: 90, jitter: 1.1, phase: 0.25 },
      ],
    },
    {
      id: 'zone-b',
      name: 'Zone B',
      feeder: 'Industrial Belt',
      transformers: [
        { id: 'T-201', ratedMva: 20.0, base: 44, amp: 6, ramp: 0.005, rampCap: 200, jitter: 1.0, phase: 0.60 },
        { id: 'T-202', ratedMva: 16.0, base: 72, amp: 5, ramp: 0.140, rampCap: 120, jitter: 1.2, phase: 0.35 },
        { id: 'T-203', ratedMva: 10.0, base: 38, amp: 4, ramp: -0.010, rampCap: 200, jitter: 0.9, phase: 0.85 },
      ],
    },
    {
      id: 'zone-c',
      name: 'Zone C',
      feeder: 'Ring Main',
      transformers: [
        { id: 'T-301', ratedMva: 12.5, base: 51, amp: 5, ramp: 0.020, rampCap: 200, jitter: 1.1, phase: 0.15 },
        { id: 'T-302', ratedMva: 8.0, base: 47, amp: 4, ramp: 0.000, rampCap: 200, jitter: 1.0, phase: 0.50 },
      ],
    },
  ],
};
