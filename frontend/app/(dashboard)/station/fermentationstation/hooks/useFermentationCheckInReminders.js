'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../constants';

const POLL_INTERVAL_MS = 5 * 60 * 1000;

export function useFermentationCheckInReminders({ enabled = true } = {}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    activePeriod: null,
    inReminderWindow: false,
    checkInDate: null,
    pending: [],
    overdue: [],
  });

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/fermentation/check-ins/pending`);
      setData({
        activePeriod: response.data?.activePeriod ?? null,
        inReminderWindow: Boolean(response.data?.inReminderWindow),
        checkInDate: response.data?.checkInDate ?? null,
        pending: response.data?.pending ?? [],
        overdue: response.data?.overdue ?? [],
      });
    } catch (error) {
      console.error('Failed to fetch check-in reminders:', error);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return undefined;
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [enabled, refresh]);

  const totalDue = useMemo(() => {
    const key = (item) => `${item.id}-${item.missingPeriod}`;
    const seen = new Set();
    const combined = [...data.pending, ...data.overdue];
    return combined.filter((item) => {
      const k = key(item);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).length;
  }, [data.pending, data.overdue]);

  const dueItems = useMemo(() => {
    const key = (item) => `${item.id}-${item.missingPeriod}`;
    const seen = new Set();
    const combined = [...data.pending, ...data.overdue];
    return combined.filter((item) => {
      const k = key(item);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [data.pending, data.overdue]);

  const showBanner = useMemo(
    () => (data.inReminderWindow && data.pending.length > 0) || data.overdue.length > 0,
    [data.inReminderWindow, data.pending.length, data.overdue.length]
  );

  return {
    loading,
    activePeriod: data.activePeriod,
    inReminderWindow: data.inReminderWindow,
    checkInDate: data.checkInDate,
    pending: data.pending,
    overdue: data.overdue,
    dueItems,
    totalDue,
    showBanner,
    refresh,
  };
}
