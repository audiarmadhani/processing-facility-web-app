'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import NfcIcon from '@mui/icons-material/Nfc';
import { DataGrid } from '@mui/x-data-grid';
import { useRfidUnassign } from './hooks/useRfidUnassign';

function formatReceivingDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function RfidUnassignPage() {
  const { data: session, status } = useSession();
  const {
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
  } = useRfidUnassign();

  const [selectionModel, setSelectionModel] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedRows = useMemo(
    () => rows.filter((row) => selectionModel.includes(row.id)),
    [rows, selectionModel]
  );

  const selectedWithActiveStations = useMemo(
    () => selectedRows.filter((row) => row.hasActiveStation),
    [selectedRows]
  );

  useEffect(() => {
    if (status === 'authenticated' && ['admin', 'manager'].includes(session?.user?.role)) {
      fetchAssignedBatches();
    }
  }, [status, session?.user?.role, fetchAssignedBatches]);

  const columns = useMemo(
    () => [
      { field: 'batchNumber', headerName: 'Batch', flex: 1, minWidth: 150 },
      {
        field: 'experimentNumber',
        headerName: 'Experiment',
        width: 120,
        type: 'number',
        align: 'left',
        headerAlign: 'left',
        valueGetter: (_value, row) => {
          const n = Number(row.experimentNumber);
          return Number.isFinite(n) ? n : null;
        },
        valueFormatter: (value) => (value == null ? '—' : String(value)),
      },
      { field: 'rfid', headerName: 'RFID', flex: 1, minWidth: 140 },
      { field: 'farmerName', headerName: 'Farmer', flex: 1, minWidth: 160 },
      { field: 'commodityType', headerName: 'Commodity', width: 120 },
      {
        field: 'receivingDate',
        headerName: 'Receiving date',
        width: 170,
        valueFormatter: (value) => formatReceivingDate(value),
      },
      { field: 'type', headerName: 'Type', width: 110 },
      { field: 'producer', headerName: 'Producer', width: 100 },
      {
        field: 'activeStations',
        headerName: 'Active stations',
        flex: 1,
        minWidth: 160,
        valueGetter: (_value, row) =>
          row.activeStations?.length ? row.activeStations.join(', ') : '—',
      },
    ],
    []
  );

  const handleConfirmUnassign = async () => {
    if (!selectedRows.length) return;

    setSubmitting(true);
    try {
      const results = await Promise.allSettled(
        selectedRows.map((row) =>
          unassignBatch(row.batchNumber, session?.user?.name || null)
        )
      );

      const succeeded = [];
      const failed = [];

      results.forEach((result, index) => {
        const row = selectedRows[index];
        if (result.status === 'fulfilled') {
          succeeded.push(row);
        } else {
          failed.push({
            row,
            error:
              result.reason?.response?.data?.error ||
              result.reason?.message ||
              'Failed to unassign',
          });
        }
      });

      if (failed.length === 0) {
        setSnackbarMessage(
          succeeded.length === 1
            ? `RFID ${succeeded[0].rfid} released from batch ${succeeded[0].batchNumber}.`
            : `Released ${succeeded.length} RFID assignments.`
        );
        setSnackbarSeverity('success');
      } else if (succeeded.length === 0) {
        setSnackbarMessage(
          failed.length === 1
            ? failed[0].error
            : `Failed to unassign ${failed.length} batches.`
        );
        setSnackbarSeverity('error');
      } else {
        setSnackbarMessage(
          `Released ${succeeded.length} batch(es). ${failed.length} failed: ${failed
            .map((item) => item.row.batchNumber)
            .join(', ')}.`
        );
        setSnackbarSeverity('warning');
      }

      setOpenSnackbar(true);
      setConfirmOpen(false);
      setSelectionModel([]);
      await fetchAssignedBatches();
    } catch (error) {
      console.error('Error unassigning RFID:', error);
      setSnackbarMessage(error.response?.data?.error || 'Failed to unassign RFID.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') {
    return <Typography sx={{ p: 2 }}>Loading...</Typography>;
  }

  if (!session?.user || !['admin', 'manager'].includes(session.user.role)) {
    return (
      <Typography variant="h6" sx={{ p: 2 }}>
        Access Denied. You do not have permission to view this page.
      </Typography>
    );
  }

  return (
    <Box sx={{ p: 2, height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5" gutterBottom>
        Unassign RFID
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 900 }}>
        Release RFID cards from batches that still block reuse at Receiving. This only sets{' '}
        <code>currentAssign = 0</code> on the receiving record; station history tables are not
        modified. After unassigning, scan the card at Receiving to create a new batch.
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchAssignedBatches}
          disabled={loading || submitting}
        >
          Refresh
        </Button>
        <Button
          variant="contained"
          color="warning"
          startIcon={<NfcIcon />}
          disabled={!selectedRows.length || submitting}
          onClick={() => setConfirmOpen(true)}
        >
          Unassign selected{selectedRows.length ? ` (${selectedRows.length})` : ''}
        </Button>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          checkboxSelection
          rowSelectionModel={selectionModel}
          onRowSelectionModelChange={(newSelection) => {
            setSelectionModel(Array.isArray(newSelection) ? newSelection : []);
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          sx={{ height: '100%' }}
        />
      </Box>

      <Dialog open={confirmOpen} onClose={() => !submitting && setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Unassign RFID{selectedRows.length > 1 ? ` (${selectedRows.length} batches)` : ''}?
        </DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            {selectedRows.length === 1 ? (
              <>
                <Typography gutterBottom>
                  Release RFID <strong>{selectedRows[0].rfid}</strong> from batch{' '}
                  <strong>{selectedRows[0].batchNumber}</strong>?
                </Typography>
                <Typography gutterBottom>
                  Farmer: {selectedRows[0].farmerName || '—'}
                </Typography>
              </>
            ) : (
              <>
                <Typography gutterBottom>
                  Release RFID cards from the following {selectedRows.length} batches?
                </Typography>
                <Box component="ul" sx={{ pl: 2, my: 1 }}>
                  {selectedRows.map((row) => (
                    <Typography component="li" key={row.batchNumber} variant="body2">
                      {row.batchNumber} — {row.rfid}
                      {row.farmerName ? ` (${row.farmerName})` : ''}
                    </Typography>
                  ))}
                </Box>
              </>
            )}
            {selectedWithActiveStations.length > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {selectedWithActiveStations.length === 1
                  ? `Batch ${selectedWithActiveStations[0].batchNumber} still has open station entries (${selectedWithActiveStations[0].activeStations?.join(', ')}).`
                  : `${selectedWithActiveStations.length} selected batch(es) still have open station entries.`}{' '}
                Unassigning will not close them; physical cards will track new batches after
                Receiving.
              </Alert>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleConfirmUnassign}
            disabled={submitting}
          >
            {submitting ? 'Unassigning…' : 'Unassign'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
