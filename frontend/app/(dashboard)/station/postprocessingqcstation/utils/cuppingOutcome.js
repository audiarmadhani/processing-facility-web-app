export const CUPPING_OUTCOMES = [
  { value: 'Production', label: 'Production', color: 'success' },
  { value: 'Good', label: 'Good', color: 'info' },
  { value: 'Redo', label: 'Redo', color: 'warning' },
  { value: 'Not Good', label: 'Not Good', color: 'error' },
];

export const CUPPING_OUTCOME_VALUES = CUPPING_OUTCOMES.map((o) => o.value);

export function isValidCuppingOutcome(value) {
  return CUPPING_OUTCOME_VALUES.includes(value);
}

export function outcomeChipColor(value) {
  return CUPPING_OUTCOMES.find((o) => o.value === value)?.color || 'default';
}

export function formatOutcomeLabel(value) {
  if (!value) return '—';
  return CUPPING_OUTCOMES.find((o) => o.value === value)?.label || String(value);
}

export function legacyOkToCuppingOutcome(okForFurtherProcess) {
  if (okForFurtherProcess === true) return 'Good';
  if (okForFurtherProcess === false) return 'Not Good';
  return null;
}
