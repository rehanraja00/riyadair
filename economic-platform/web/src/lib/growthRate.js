// DU-03: growth rate display modes. Each mode is independently togglable per
// widget and all three can show simultaneously; returns absolute + percent
// change plus a mode-specific label so the UI can visually distinguish them.
export function computeGrowthModes(indicator, config) {
  const modes = config?.growthModes || [];
  const points = indicator.dataPoints || [];
  const latest = points[points.length - 1];
  if (!latest) return [];

  const results = [];

  if (modes.includes('PREVIOUS')) {
    const previous = points[points.length - 2];
    if (previous) {
      results.push(deltaRow('PREVIOUS', 'vs. previous interval', latest.value, previous.value));
    }
  }

  if (modes.includes('TARGET')) {
    if (config.targetType === 'LONG_TERM') {
      if (indicator.longTermTargetValue != null) {
        results.push(
          deltaRow('TARGET', `vs. ${indicator.longTermTargetLabel || 'long-term target'}`, latest.value, indicator.longTermTargetValue)
        );
      }
    } else {
      const match = (indicator.targets || []).find(
        (t) => new Date(t.period).getTime() === new Date(latest.period).getTime()
      );
      if (match) {
        results.push(deltaRow('TARGET', 'vs. interval target', latest.value, match.value));
      }
    }
  }

  if (modes.includes('BASELINE')) {
    const baseline = config.baselineId
      ? (indicator.baselines || []).find((b) => b.id === config.baselineId)
      : (indicator.baselines || []).find((b) => b.active);
    if (baseline) {
      results.push(deltaRow('BASELINE', `vs. baseline (${baseline.label})`, latest.value, baseline.value));
    }
  }

  return results;
}

function deltaRow(mode, label, current, reference) {
  const absolute = current - reference;
  const percent = reference !== 0 ? (absolute / Math.abs(reference)) * 100 : null;
  return { mode, label, absolute, percent };
}
