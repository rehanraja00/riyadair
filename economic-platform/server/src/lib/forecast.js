// DU-10: forecasts are versioned (a new forecast never overwrites the
// previous one) — this collapses a raw list down to the latest version per period.
export function latestForecasts(forecasts) {
  const byPeriod = new Map();
  for (const f of forecasts) {
    const key = f.period.toISOString();
    const existing = byPeriod.get(key);
    if (!existing || f.version > existing.version) byPeriod.set(key, f);
  }
  return Array.from(byPeriod.values()).sort((a, b) => new Date(a.period) - new Date(b.period));
}
