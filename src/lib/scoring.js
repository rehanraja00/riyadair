export function statusClass(status = '') {
  const normalized = status.toLowerCase();
  if (['high', 'critical', 'red'].includes(normalized)) return 'status status-high';
  if (['watch', 'medium', 'amber'].includes(normalized)) return 'status status-watch';
  if (['stable', 'low', 'green', 'complete'].includes(normalized)) return 'status status-stable';
  if (['in progress'].includes(normalized)) return 'status status-progress';
  if (['not started'].includes(normalized)) return 'status status-neutral';
  return 'status status-neutral';
}

export function threatLabel(score) {
  if (score >= 4.5) return 'High';
  if (score >= 3) return 'Medium';
  return 'Low';
}

export function weightedThreatScore(item) {
  return Number(item.qatarExposure.toFixed(1));
}

export function getSource(sourceLinks, sourceId) {
  return sourceLinks.find((source) => source.id === sourceId);
}

export function formatValue(value, decimals = 1) {
  if (value === null || value === undefined) return 'N/A';
  if (Number.isInteger(value)) return value.toLocaleString();
  return value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function getThreatSummary(threatAssessment) {
  const qatarAverage = threatAssessment.reduce((total, item) => total + item.qatarExposure, 0) / threatAssessment.length;
  const topThreat = [...threatAssessment].sort((a, b) => weightedThreatScore(b) - weightedThreatScore(a))[0];

  return {
    qatarAverage: Number(qatarAverage.toFixed(1)),
    topThreat
  };
}
