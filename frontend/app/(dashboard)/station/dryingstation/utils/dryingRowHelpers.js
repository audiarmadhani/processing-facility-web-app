export function computeDryingPriority(status, currentMoisture) {
  if (status === 'Dried') return null;
  if (currentMoisture == null || currentMoisture === '') return 'Low';
  const moisture = parseFloat(currentMoisture);
  if (moisture <= 15) return 'High';
  if (moisture < 25) return 'Medium';
  return 'Low';
}

const WITA_TIMEZONE = 'Asia/Makassar';

/** Format a DB timestamp as YYYY-MM-DD in WITA (Asia/Makassar). */
export function formatDryingDateWita(isoTimestamp) {
  if (!isoTimestamp) return 'N/A';
  const date = new Date(isoTimestamp);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-CA', { timeZone: WITA_TIMEZONE });
}

/** Format a DB timestamp as YYYY-MM-DD HH:mm in WITA. */
export function formatDryingDateTimeWita(isoTimestamp) {
  if (!isoTimestamp) return 'N/A';
  const date = new Date(isoTimestamp);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-CA', {
    timeZone: WITA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).replace(',', '');
}

/** Current date (YYYY-MM-DD) in WITA for date inputs. */
export function witaDateInputValue(date = new Date()) {
  return date.toLocaleDateString('en-CA', { timeZone: WITA_TIMEZONE });
}

/** Current time (HH:mm) in WITA for time inputs. */
export function witaTimeInputValue(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: WITA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const hour = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
  return `${hour}:${minute}`;
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
