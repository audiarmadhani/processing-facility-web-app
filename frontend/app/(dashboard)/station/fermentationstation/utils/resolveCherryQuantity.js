'use client';

import axios from 'axios';
import { API_BASE_URL } from '../constants';

/**
 * Resolve cherry weight for cross-check and order sheet PDF.
 * Priority: wet mill tracked weights → preprocessing fallback → preprocessing API.
 */
export async function resolveCherryQuantity(batchNumber, preprocessingFallback = null) {
  if (!batchNumber?.trim()) {
    return { value: null, source: null };
  }

  const trimmed = batchNumber.trim();

  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/wetmill-weight-measurements/${encodeURIComponent(trimmed)}`
    );
    const measurements = Array.isArray(response.data) ? response.data : [];
    const total = measurements.reduce((sum, m) => {
      const w = Number(m.weight);
      return sum + (Number.isFinite(w) && w >= 0 ? w : 0);
    }, 0);
    if (total > 0) {
      return { value: total, source: 'wetmill' };
    }
  } catch (error) {
    console.error('resolveCherryQuantity: wet mill fetch failed', error);
  }

  const prepFallback =
    preprocessingFallback != null && preprocessingFallback !== ''
      ? Number(preprocessingFallback)
      : null;
  if (prepFallback != null && Number.isFinite(prepFallback) && prepFallback > 0) {
    return { value: prepFallback, source: 'preprocessing' };
  }

  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/preprocessing/${encodeURIComponent(trimmed)}`
    );
    const totalProcessed = Number(response.data?.totalWeightProcessed);
    if (Number.isFinite(totalProcessed) && totalProcessed > 0) {
      return { value: totalProcessed, source: 'preprocessing' };
    }
  } catch (error) {
    console.error('resolveCherryQuantity: preprocessing fetch failed', error);
  }

  return { value: null, source: null };
}

export function formatCherryQuantityKg(value) {
  if (value === null || value === undefined || value === '') return 'N/A';
  const num = Number(value);
  if (!Number.isFinite(num)) return 'N/A';
  return `${num.toFixed(2)} kg`;
}
