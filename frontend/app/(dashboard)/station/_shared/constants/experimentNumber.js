export function formatExperimentNumber(value) {
  return value == null || value === '' ? '—' : String(value);
}

export const experimentNumberColumn = {
  field: 'experimentNumber',
  headerName: 'Experiment #',
  width: 130,
  valueFormatter: (value) => formatExperimentNumber(value),
};
