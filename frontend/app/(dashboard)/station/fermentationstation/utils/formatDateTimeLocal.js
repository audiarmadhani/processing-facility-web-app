'use client';

import dayjs from 'dayjs';

export function formatDateTimeLocal(date) {
  if (!date) return '';
  const d = dayjs(date);
  if (!d.isValid()) return '';
  return d.format('YYYY-MM-DDTHH:mm');
}
