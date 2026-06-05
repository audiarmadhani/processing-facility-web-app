export function pipelineRowId(row, index = 0) {
  if (!row?.batchNumber) return `pipeline-row-${index}`;
  const pt = row.processingType || '';
  return `${row.batchNumber}__${pt}`;
}

/** Assign stable unique DataGrid ids; drop duplicate batch+processingType rows. */
export function withPipelineIds(rows = []) {
  const seenKeys = new Set();
  const result = [];

  rows.forEach((row, index) => {
    const key = pipelineRowId(row, index);
    if (seenKeys.has(key)) return;
    seenKeys.add(key);
    result.push({ ...row, id: key });
  });

  return result;
}
