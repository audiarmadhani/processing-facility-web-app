'use client';

import dayjs from 'dayjs';

/**
 * Parse fermentation datetimes as wall-clock values from their string components.
 * Avoids timezone shifts when the API returns ISO Z timestamps that represent
 * the same local time the operator entered (e.g. 2026-05-22T10:20:00.000Z → 22 May 10:20).
 */
export function parseFermentationDateTime(value) {
  if (value === undefined || value === null || value === '') return null;

  const s = String(value).trim();
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (match) {
    const [, y, mo, d, h, mi] = match;
    const parsed = dayjs(`${y}-${mo}-${d}T${h}:${mi}`);
    return parsed.isValid() ? parsed : null;
  }

  const fallback = dayjs(s);
  return fallback.isValid() ? fallback : null;
}

export function formatFermentationDisplay(value) {
  if (!value) return 'N/A';
  const parsed = parseFermentationDateTime(value);
  return parsed ? parsed.format('DD/MM/YYYY HH:mm:ss') : String(value);
}

export function calculateFermentationEndGoal(fermentationStart, fermentationTimeTarget) {
  if (!fermentationStart || fermentationTimeTarget === '' || fermentationTimeTarget == null) {
    return 'N/A';
  }

  const start = parseFermentationDateTime(fermentationStart);
  const hours = parseFloat(fermentationTimeTarget);

  if (!start || !Number.isFinite(hours)) return 'N/A';

  return start.add(hours, 'hour').format('DD/MM/YYYY HH:mm:ss');
}
