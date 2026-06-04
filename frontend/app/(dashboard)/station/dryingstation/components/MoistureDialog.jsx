'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Box,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Chart } from 'react-chartjs-2';
import './chartSetup';
import {
  buildMoistureChartData,
  buildMeasurementTableRows,
} from '../utils/moistureChartUtils';

const measurementColumns = [
  { field: 'dateDisplay', headerName: 'Date', width: 140 },
  {
    field: 'moisture',
    headerName: 'Moisture (%)',
    width: 130,
    valueFormatter: (value) =>
      value != null && !Number.isNaN(Number(value)) ? Number(value).toFixed(1) : '—',
  },
  { field: 'vsOptimal', headerName: 'vs optimal', width: 120 },
];

export default function MoistureDialog({
  open,
  selectedBatch,
  dryingMeasurements,
  newMoisture,
  onMoistureChange,
  newMeasurementDate,
  onMeasurementDateChange,
  onAddMoisture,
  onClose,
}) {
  const [highlightedMeasurementId, setHighlightedMeasurementId] = useState(null);

  useEffect(() => {
    if (!open) setHighlightedMeasurementId(null);
  }, [open]);

  const chartModel = useMemo(
    () =>
      buildMoistureChartData(
        selectedBatch,
        dryingMeasurements,
        highlightedMeasurementId
      ),
    [selectedBatch, dryingMeasurements, highlightedMeasurementId]
  );

  const tableRows = useMemo(
    () => buildMeasurementTableRows(dryingMeasurements, selectedBatch),
    [dryingMeasurements, selectedBatch]
  );

  const moistureChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day',
            tooltipFormat: 'yyyy-MM-dd',
          },
          title: { display: true, text: 'Date (WITA)' },
        },
        y: {
          min: 0,
          max: chartModel.yMax,
          title: { display: true, text: 'Moisture (%)' },
        },
      },
      plugins: {
        legend: { display: true, position: 'top' },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const y = ctx.parsed?.y;
              if (y == null || Number.isNaN(y)) return ctx.dataset.label;
              return `${ctx.dataset.label}: ${y.toFixed(1)}%`;
            },
          },
        },
      },
    }),
    [chartModel.yMax]
  );

  const handleRowMouseEnter = useCallback(({ row }) => {
    setHighlightedMeasurementId(row.id);
  }, []);

  const handleRowMouseLeave = useCallback(() => {
    setHighlightedMeasurementId(null);
  }, []);

  const handleRowClick = useCallback(({ row }) => {
    setHighlightedMeasurementId((prev) => (prev === row.id ? null : row.id));
  }, []);

  const showNoOptimalNote =
    selectedBatch && !chartModel.hasOptimalCurve && !selectedBatch.dryingEnteredAt;

  const chartKey = `${selectedBatch?.batchNumber ?? 'none'}-${dryingMeasurements.length}-${highlightedMeasurementId ?? 'none'}`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      disableEnforceFocus
    >
      <DialogTitle>Drying Details - Batch {selectedBatch?.batchNumber}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mb: 2, mt: 1 }}>
          <Grid item xs={5}>
            <TextField
              label="Moisture (%)"
              value={newMoisture}
              onChange={(e) => onMoistureChange(e.target.value)}
              type="number"
              fullWidth
              inputProps={{ min: 0, max: 100, step: 0.01 }}
            />
          </Grid>
          <Grid item xs={5}>
            <TextField
              label="Measurement Date"
              type="date"
              value={newMeasurementDate}
              onChange={(e) => onMeasurementDateChange(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={onAddMoisture}
              fullWidth
              sx={{ height: '100%' }}
            >
              Add Measurement
            </Button>
          </Grid>
        </Grid>

        {showNoOptimalNote && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Optimal drying curve unavailable (no drying entry time). Measured points are still
            shown.
          </Typography>
        )}

        {chartModel.datasets.length === 0 ? (
          <Typography variant="body1" align="center" color="text.secondary" sx={{ py: 4 }}>
            No moisture measurements or optimal curve data to display.
          </Typography>
        ) : (
          <Box sx={{ position: 'relative', height: 400, width: '100%', mb: 2 }}>
            <Chart
              key={chartKey}
              type="line"
              data={{ datasets: chartModel.datasets }}
              options={moistureChartOptions}
            />
          </Box>
        )}

        <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
          Moisture measurements
        </Typography>
        <Box sx={{ height: 220, width: '100%' }}>
          <DataGrid
            rows={tableRows}
            columns={measurementColumns}
            disableRowSelectionOnClick={false}
            onRowMouseEnter={handleRowMouseEnter}
            onRowMouseLeave={handleRowMouseLeave}
            onRowClick={handleRowClick}
            getRowClassName={({ id }) =>
              highlightedMeasurementId != null && String(id) === String(highlightedMeasurementId)
                ? 'moisture-row-highlighted'
                : ''
            }
            pageSizeOptions={[5, 10, 25]}
            initialState={{
              pagination: { paginationModel: { pageSize: 5 } },
              sorting: { sortModel: [{ field: 'dateDisplay', sort: 'asc' }] },
            }}
            sx={{
              border: '1px solid rgba(255,255,255,0.12)',
              '& .moisture-row-highlighted': {
                backgroundColor: 'rgba(255, 206, 86, 0.15)',
              },
              '& .MuiDataGrid-row:hover': {
                cursor: 'pointer',
              },
            }}
            rowHeight={36}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
