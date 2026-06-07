'use client';

import { useCallback, useEffect, useState } from 'react';
import { FARMER_API_BASE } from '../constants';

export function useDriverPickups(initialYear) {
  const [year, setYear] = useState(initialYear);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPickups = useCallback(async (targetYear) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${FARMER_API_BASE}/driver-pickups?year=${encodeURIComponent(targetYear)}`
      );
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to fetch driver pickups');
      }
      const data = await response.json();
      setRows(
        (data.rows || []).map((row) => ({
          ...row,
          id: row.id,
        }))
      );
    } catch (err) {
      setRows([]);
      setError(err.message || 'Failed to fetch driver pickups');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPickups(year);
  }, [year, fetchPickups]);

  return {
    year,
    setYear,
    rows,
    loading,
    error,
    refetch: () => fetchPickups(year),
  };
}
