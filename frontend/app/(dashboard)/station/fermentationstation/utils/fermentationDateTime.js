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

/** ISO-style grid display without timezone shift from stored UTC strings. */
export function formatFermentationGridDate(value, empty = '—') {
  if (value === undefined || value === null || value === '') return empty;
  const parsed = parseFermentationDateTime(value);
  return parsed ? parsed.format('YYYY-MM-DD HH:mm:ss') : empty;
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

export function formatDurationMs(diffMs) {
  if (!Number.isFinite(diffMs)) return '';
  const clamped = Math.max(0, diffMs);
  const days = Math.floor(clamped / (1000 * 60 * 60 * 24));
  const hours = Math.floor((clamped / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((clamped / (1000 * 60)) % 60);
  return `${days}d ${hours}h ${minutes}m`;
}

/** Only the explicit Finish action marks a batch complete (not a planned endDate). */
export function isFermentationFinished(row) {
  return row?.status === 'Finished';
}

function fermentationStartValue(row) {
  return row?.fermentationStart ?? row?.startDate;
}

function plannedEndValue(row) {
  return row?.fermentationEnd ?? row?.endDate;
}

/** Planned/estimated end for in-progress batches (stored end date or start + target hours). */
export function getEstimatedEndMoment(row) {
  if (!row || isFermentationFinished(row)) return null;

  const startRaw = fermentationStartValue(row);
  if (!startRaw) return null;
  const start = parseFermentationDateTime(startRaw);
  if (!start) return null;

  const plannedRaw = plannedEndValue(row);
  if (plannedRaw) {
    const planned = parseFermentationDateTime(plannedRaw) || dayjs(plannedRaw);
    if (planned?.isValid?.()) return planned;
  }

  const target = row.fermentationTimeTarget;
  if (target === '' || target == null) return null;
  const hours = parseFloat(target);
  if (!Number.isFinite(hours)) return null;

  return start.add(hours, 'hour');
}

/** In progress past planned/estimated end but Finish not clicked. */
export function isFermentationOverdue(row, now = dayjs()) {
  if (!row || row.status !== 'In Progress') return false;
  const endMoment = getEstimatedEndMoment(row);
  if (!endMoment) return false;
  return now.isAfter(endMoment);
}

const EMPTY_ESTIMATE = {
  endDisplay: '—',
  remainingDisplay: '—',
  endDisplayDetails: '—',
  hasEstimate: false,
  endMoment: null,
};

export function getPrimaryFermentationEstimate(row, now = dayjs()) {
  if (!row) return { ...EMPTY_ESTIMATE };

  if (isFermentationFinished(row)) {
    const endRaw = plannedEndValue(row);
    const endMoment = parseFermentationDateTime(endRaw) || dayjs(endRaw);
    const valid = Boolean(endMoment?.isValid?.());
    return {
      endDisplay: valid ? endMoment.format('YYYY-MM-DD HH:mm:ss') : '—',
      endDisplayDetails: valid ? endMoment.format('DD/MM/YYYY HH:mm:ss') : '—',
      remainingDisplay: 'Complete',
      hasEstimate: Boolean(endRaw),
      endMoment: valid ? endMoment : null,
      isOverdue: false,
    };
  }

  const endMoment = getEstimatedEndMoment(row);
  if (!endMoment) {
    return { ...EMPTY_ESTIMATE };
  }

  const remainingMs = endMoment.diff(now);

  if (remainingMs <= 0) {
    return {
      endDisplay: '—',
      endDisplayDetails: '—',
      remainingDisplay: 'Overdue',
      hasEstimate: true,
      endMoment,
      isOverdue: true,
    };
  }

  return {
    endDisplay: endMoment.format('YYYY-MM-DD HH:mm:ss'),
    endDisplayDetails: endMoment.format('DD/MM/YYYY HH:mm:ss'),
    remainingDisplay: formatDurationMs(remainingMs),
    hasEstimate: true,
    endMoment,
    isOverdue: false,
  };
}
