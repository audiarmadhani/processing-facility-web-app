export const WAREHOUSE_ROWS = ['A', 'B', 'C', 'D', 'E'];

export const WAREHOUSE_COLUMNS = Array.from({ length: 10 }, (_, i) => i + 1);

export function formatWarehousePosition(row, column) {
  if (!row || column == null || column === '') return '—';
  return `Row ${row}, Col ${column}`;
}

export function isValidWarehouseRow(row) {
  return row == null || row === '' || WAREHOUSE_ROWS.includes(String(row).toUpperCase());
}

export function isValidWarehouseColumn(column) {
  if (column == null || column === '') return true;
  const n = Number(column);
  return Number.isInteger(n) && n >= 1 && n <= 10;
}
