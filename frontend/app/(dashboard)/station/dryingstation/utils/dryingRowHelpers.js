export function computeDryingPriority(status, currentMoisture) {
  if (status === 'Dried') return null;
  if (currentMoisture == null || currentMoisture === '') return 'Low';
  const moisture = parseFloat(currentMoisture);
  if (moisture <= 15) return 'High';
  if (moisture < 25) return 'Medium';
  return 'Low';
}

/** Format a DB timestamp as YYYY-MM-DD in WITA (Asia/Makassar). */
export function formatDryingDateWita(isoTimestamp) {
  if (!isoTimestamp) return 'N/A';
  const date = new Date(isoTimestamp);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Makassar' });
}

export function sortDryingRows(a, b) {
  const priorityOrder = { High: 0, Medium: 1, Low: 2 };
  const prioritySort = (row) => {
    if (row.priority == null) return 3;
    return priorityOrder[row.priority] ?? 2;
  };
  const statusOrder = { 'In Drying': 0, Dried: 1, 'Not in Drying': 2 };

  const pa = prioritySort(a);
  const pb = prioritySort(b);
  if (pa !== pb) return pa - pb;

  const sa = statusOrder[a.status] ?? 2;
  const sb = statusOrder[b.status] ?? 2;
  if (sa !== sb) return sa - sb;

  return String(a.batchNumber).localeCompare(String(b.batchNumber));
}
