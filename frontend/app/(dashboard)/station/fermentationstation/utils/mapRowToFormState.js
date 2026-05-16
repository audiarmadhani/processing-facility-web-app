'use client';

export function mapRowToFormState(row) {
  if (!row) return {};
  return { ...row };
}
