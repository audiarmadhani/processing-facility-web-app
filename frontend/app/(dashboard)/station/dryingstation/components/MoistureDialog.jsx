'use client';

import { useMemo, useCallback } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import './chartSetup';

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
  const generateOptimalCurve = useCallback(() => {
    if (!selectedBatch || selectedBatch.startDryingDate === 'N/A') return { labels: [], data: [] };
    const startDate = new Date(selectedBatch.startDryingDate);
    const labels = [];
    const data = [];
    for (let i = 0; i <= 168; i += 24) {
      const date = new Date(startDate);
      date.setHours(date.getHours() + i);
      labels.push(date.toLocaleDateString());
      data.push(50 * Math.exp(-0.00858 * i));
    }
    return { labels, data };
  }, [selectedBatch]);

  const optimalCurve = generateOptimalCurve();

  const moistureChartData = useMemo(
    () => ({
      labels: optimalCurve.labels,
      datasets: [
        {
          label: 'Measured Moisture',
          data: dryingMeasurements.map((m) => ({
            x: new Date(m.measurement_date).toLocaleDateString(),
            y: m.moisture,
          })),
          type: 'scatter',
          backgroundColor: 'rgba(75,192,192,1)',
          borderColor: 'rgba(75,192,192,0.2)',
          pointRadius: 5,
        },
        {
          label: 'Optimal Natural Sun Drying Curve',
          data: optimalCurve.data,
          fill: false,
          borderColor: 'rgba(255,99,132,1)',
          borderDash: [5, 5],
          tension: 0.4,
        },
      ],
    }),
    [optimalCurve, dryingMeasurements]
  );

  const moistureChartOptions = useMemo(
    () => ({
      scales: {
        x: { title: { display: true, text: 'Date' }, type: 'category' },
        y: { title: { display: true, text: 'Moisture (%)' }, min: 0, max: 60 },
      },
      plugins: { legend: { display: true }, tooltip: { mode: 'index', intersect: false } },
    }),
    []
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
        <Line data={moistureChartData} options={moistureChartOptions} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
