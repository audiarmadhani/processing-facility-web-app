export function pipelineRowId(row) {
  if (!row?.batchNumber) return String(Math.random());
  const pt = row.processingType || '';
  return `${row.batchNumber}__${pt}`;
}

export function withPipelineIds(rows = []) {
  return rows.map((row) => ({ ...row, id: pipelineRowId(row) }));
}
