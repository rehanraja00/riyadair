// DU-04: an indicator can carry multiple units/sources now (instead of a
// single free-text field) — these helpers pick the display-primary ones.
export function primaryUnit(indicator) {
  const link = indicator.units?.find((u) => u.isPrimary) || indicator.units?.[0];
  return link?.unit;
}

export function unitLabel(indicator) {
  const unit = primaryUnit(indicator);
  return unit ? unit.symbol || unit.name : '';
}
