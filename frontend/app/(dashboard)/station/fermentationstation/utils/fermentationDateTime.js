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

export function formatDurationMs(diffMs) {
  if (!Number.isFinite(diffMs)) return '';
  const clamped = Math.max(0, diffMs);
  const days = Math.floor(clamped / (1000 * 60 * 60 * 24));
  const hours = Math.floor((clamped / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((clamped / (1000 * 60)) % 60);
  return `${days}d ${hours}h ${minutes}m`;
}

export function isFermentationFinished(row) {
  if (!row) return false;
  if (row.status === 'Finished') return true;
  const end = row.fermentationEnd ?? row.endDate;
  return end != null && end !== '';
}

function fermentationStartValue(row) {
  return row?.fermentationStart ?? row?.startDate;
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
    const endRaw = row.fermentationEnd ?? row.endDate;
    const endMoment = parseFermentationDateTime(endRaw) || dayjs(endRaw);
    const valid = Boolean(endMoment?.isValid?.());
    return {
      endDisplay: valid ? endMoment.format('YYYY-MM-DD HH:mm:ss') : '—',
      endDisplayDetails: valid ? endMoment.format('DD/MM/YYYY HH:mm:ss') : '—',
      remainingDisplay: 'Complete',
      hasEstimate: Boolean(endRaw),
      endMoment: valid ? endMoment : null,
    };
  }

  const startRaw = fermentationStartValue(row);
  const target = row.fermentationTimeTarget;
  if (!startRaw || target === '' || target == null) {
    return { ...EMPTY_ESTIMATE };
  }

  const start = parseFermentationDateTime(startRaw);
  const hours = parseFloat(target);
  if (!start || !Number.isFinite(hours)) {
    return { ...EMPTY_ESTIMATE };
  }

  const endMoment = start.add(hours, 'hour');
  const remainingMs = endMoment.diff(now);

  return {
    endDisplay: endMoment.format('YYYY-MM-DD HH:mm:ss'),
    endDisplayDetails: endMoment.format('DD/MM/YYYY HH:mm:ss'),
    remainingDisplay: formatDurationMs(remainingMs),
    hasEstimate: true,
    endMoment,
  };
}
