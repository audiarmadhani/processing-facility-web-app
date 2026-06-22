'use client';

import { useCallback, useState } from 'react';
import axios from 'axios';
import { apiUrl } from '../../../station/_shared/config';

export function useRfidUnassign() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const fetchAssignedBatches = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(apiUrl('/rfid/assigned-batches'));
      const data = Array.isArray(response.data) ? response.data : [];
      setRows(
        data.map((row) => ({
          ...row,
          id: row.batchNumber,
        }))
      );
    } catch (error) {
      console.error('Error fetching assigned RFID batches:', error);
      setSnackbarMessage(
        error.response?.data?.error || 'Failed to fetch assigned RFID batches.'
      );
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const unassignBatch = useCallback(async (batchNumber, unassignedBy) => {
    const response = await axios.post(apiUrl('/rfid/unassign'), {
      batchNumber,
      unassignedBy,
    });
    return response.data;
  }, []);

  return {
    rows,
    loading,
    fetchAssignedBatches,
    unassignBatch,
    snackbarMessage,
    setSnackbarMessage,
    snackbarSeverity,
    setSnackbarSeverity,
    openSnackbar,
    setOpenSnackbar,
  };
}
