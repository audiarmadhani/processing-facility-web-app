'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { getUpdatesColumns } from './columns';
import { API_BASE_URL, UPDATE_STATIONS } from './constants';

const dataGridSx = {
  minHeight: 400,
  border: '1px solid rgba(0,0,0,0.12)',
  '& .MuiDataGrid-footerContainer': { borderTop: 'none' },
};

export default function UpdatesPage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [stationFilter, setStationFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('error');

  const columns = useMemo(() => getUpdatesColumns(), []);

  const fetchUpdates = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ limit: '500', offset: '0' });
      if (stationFilter) params.set('station', stationFilter);
      if (batchFilter.trim()) params.set('batchNumber', batchFilter.trim());

      const response = await fetch(`${API_BASE_URL}/api/updates?${params.toString()}`);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch updates');
      }

      const data = await response.json();
      setRows(Array.isArray(data.rows) ? data.rows : []);
      setTotal(typeof data.total === 'number' ? data.total : data.rows?.length ?? 0);
    } catch (error) {
      setRows([]);
      setTotal(0);
      setSnackbarMessage(error.message || 'Failed to fetch updates');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  }, [stationFilter, batchFilter]);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  return (
    <Grid container spacing={3} sx={{ p: 2 }}>
      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Updates
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Recent activity across processing stations (last 90 days). Edits to existing records may
              not appear yet.
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2, alignItems: 'center' }}>
              <Button
                variant="contained"
                onClick={fetchUpdates}
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {isLoading ? 'Refreshing…' : 'Refresh'}
              </Button>

              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="updates-station-filter">Station</InputLabel>
                <Select
                  labelId="updates-station-filter"
                  label="Station"
                  value={stationFilter}
                  onChange={(e) => setStationFilter(e.target.value)}
                >
                  <MenuItem value="">
                    <em>All stations</em>
                  </MenuItem>
                  {UPDATE_STATIONS.map((station) => (
                    <MenuItem key={station} value={station}>
                      {station}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                size="small"
                label="Batch search"
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                placeholder="e.g. 2026001"
                sx={{ minWidth: 200 }}
              />
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Showing {rows.length} of {total} events
            </Typography>

            <Box sx={{ height: 720, width: '100%' }}>
              <DataGrid
                rows={rows}
                columns={columns}
                getRowId={(row) => row.id}
                loading={isLoading}
                disableRowSelectionOnClick
                slots={{ toolbar: GridToolbar }}
                pageSizeOptions={[25, 50, 100]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 50, page: 0 } },
                }}
                sx={dataGridSx}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbarSeverity} onClose={() => setSnackbarOpen(false)}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Grid>
  );
}
