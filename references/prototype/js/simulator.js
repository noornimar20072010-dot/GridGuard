/* GridGuard — telemetry generator (frontend stand-in for backend generator.py).
 *
 * Produces load, voltage, current and temperature for every transformer.
 * Values are derived from one driver — load as a percentage of rated capacity —
 * so the readings stay physically consistent with each other.
 *
 * A seeded generator is used instead of Math.random so the demo replays the
 * same way every time.
 */
window.GG = window.GG || {};

GG.simulator = (function () {
  const { historyPoints, sampleMinutes, nominalKv } = GG.config;

  let seed = 20260729;
  function rand() {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  }
  function noise(scale) {
    return (rand() - 0.5) * 2 * scale;
  }

  /* Load at t simulated minutes: baseline + slow demand cycle + saturating
   * trend + measurement noise. The trend is what eventually pushes the
   * scenario transformers over their limits. */
  function loadAt(profile, minutes) {
    const cycle = Math.sin((minutes / 180 + profile.phase) * Math.PI * 2) * profile.amp;
    const trend = profile.ramp * Math.min(minutes, profile.rampCap);
    return GG.utils.clamp(profile.base + cycle + trend + noise(profile.jitter), 5, 108);
  }

  function readingFrom(profile, loadPct, timestamp) {
    const rated = GG.utils.ratedAmps(profile.ratedMva);
    return {
      at: timestamp,
      loadPct,
      /* Voltage sags as the transformer loads up. */
      voltageKv: nominalKv - (loadPct - 55) * 0.008 + noise(0.04),
      currentA: (loadPct / 100) * rated,
      /* Oil temperature tracks load with thermal offset. */
      tempC: 36 + loadPct * 0.49 + noise(0.6),
    };
  }

  function createTransformer(profile, zone) {
    return {
      ...profile,
      zoneId: zone.id,
      zoneName: zone.name,
      feeder: zone.feeder,
      ratedAmps: GG.utils.ratedAmps(profile.ratedMva),
      history: [],
      elapsedMinutes: 0,
    };
  }

  /* Builds the transformer list and back-fills `historyPoints` readings so the
   * dashboard opens with a populated trend chart instead of an empty one. */
  function init() {
    const transformers = [];
    GG.grid.zones.forEach((zone) => {
      zone.transformers.forEach((profile) => transformers.push(createTransformer(profile, zone)));
    });

    const spanMinutes = (historyPoints - 1) * sampleMinutes;
    const startedAt = new Date(Date.now() - spanMinutes * 60 * 1000);

    transformers.forEach((transformer) => {
      for (let index = 0; index < historyPoints; index += 1) {
        const minutes = index * sampleMinutes;
        const at = new Date(startedAt.getTime() + minutes * 60 * 1000);
        transformer.history.push(readingFrom(transformer, loadAt(transformer, minutes), at));
      }
      transformer.elapsedMinutes = spanMinutes;
    });

    return transformers;
  }

  /* Advances the grid clock by one sample and appends a reading. */
  function tick(transformers) {
    transformers.forEach((transformer) => {
      transformer.elapsedMinutes += sampleMinutes;
      const at = new Date(Date.now());
      transformer.history.push(readingFrom(transformer, loadAt(transformer, transformer.elapsedMinutes), at));
      if (transformer.history.length > historyPoints) transformer.history.shift();
    });
  }

  function latest(transformer) {
    return transformer.history[transformer.history.length - 1];
  }

  return { init, tick, latest };
})();
