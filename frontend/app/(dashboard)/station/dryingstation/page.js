"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import {
  Button,
  Typography,
  Snackbar,
  Alert,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ScatterController,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ScatterController
);

const DryingStation = () => {
  const { data: session, status } = useSession();
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [dryingData, setDryingData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [dryingMeasurements, setDryingMeasurements] = useState([]);
  const [newMoisture, setNewMoisture] = useState('');

  const fetchDryingData = async () => {
    setIsLoading(true);
    try {
      const qcResponse = await fetch('https://processing-facility-backend.onrender.com/api/qc');
      if (!qcResponse.ok) throw new Error('Failed to fetch QC data');
      const qcResult = await qcResponse.json();
      const pendingPreprocessingData = qcResult.allRows || [];

      const dryingResponse = await fetch('https://processing-facility-backend.onrender.com/api/drying-data');
      if (!dryingResponse.ok) throw new Error('Failed to fetch drying data');
      const dryingDataRaw = await dryingResponse.json();

      const formattedData = pendingPreprocessingData.map(batch => {
        const batchDryingData = dryingDataRaw.filter(data => data.batchNumber === batch.batchNumber);
        const latestEntry = batchDryingData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        const status = latestEntry
          ? latestEntry.exited_at
            ? 'Dried'
            : 'In Drying'
          : 'Not in Drying';
        const dryingArea = latestEntry ? latestEntry.dryingArea : 'N/A';

        return {
          ...batch,
          status,
          dryingArea,
          startDryingDate: latestEntry?.entered_at ? new Date(latestEntry.entered_at).toISOString().slice(0, 10) : 'N/A',
          endDryingDate: latestEntry?.exited_at ? new Date(latestEntry.exited_at).toISOString().slice(0, 10) : 'N/A',
          weight: batch.weight || 'N/A',
          type: batch.type || 'N/A',
          producer: batch.producer || 'N/A',
          productLine: batch.productLine || 'N/A',
          processingType: batch.processingType || 'N/A',
          quality: batch.quality || 'N/A',
        };
      });

      setDryingData(formattedData);
    } catch (error) {
      console.error('Error fetching drying data:', error);
      setSnackbarMessage(error.message || 'Error fetching data. Please try again.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDryingMeasurements = async (batchNumber) => {
    try {
      const response = await fetch(`https://processing-facility-backend.onrender.com/api/drying-measurements/${batchNumber}`);
      if (!response.ok) throw new Error('Failed to fetch drying measurements');
      const data = await response.json();
      setDryingMeasurements(data);
    } catch (error) {
      console.error('Error fetching drying measurements:', error);
      setSnackbarMessage(error.message || 'Failed to fetch drying measurements');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  const handleAddMoisture = async () => {
    if (!newMoisture || isNaN(newMoisture) || newMoisture < 0 || newMoisture > 100) {
      setSnackbarMessage('Please enter a valid moisture value (0-100)');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    try {
      const response = await fetch('https://processing-facility-backend.onrender.com/api/drying-measurement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchNumber: selectedBatch.batchNumber, moisture: parseFloat(newMoisture) }),
      });
      if (!response.ok) throw new Error('Failed to save drying measurement');
      const result = await response.json();
      setDryingMeasurements([...dryingMeasurements, result.measurement]);
      setNewMoisture('');
      setSnackbarMessage('Drying measurement added successfully');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
    } catch (error) {
      console.error('Error adding drying measurement:', error);
      setSnackbarMessage(error.message || 'Failed to add drying measurement');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  useEffect(() => {
    fetchDryingData();
    const intervalId = setInterval(() => {
      fetchDryingData();
    }, 300000); // 5 minutes
    return () => clearInterval(intervalId);
  }, []);

  const handleRefreshData = () => {
    fetchDryingData();
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleDetailsClick = (batch) => {
    setSelectedBatch(batch);
    fetchDryingMeasurements(batch.batchNumber);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBatch(null);
    setDryingMeasurements([]);
    setNewMoisture('');
  };

  const columns = [
    { field: 'batchNumber', headerName: 'Batch Number', width: 160 },
    {
      field: 'status',
      headerName: 'Status',
      width: 90,
      renderCell: (params) => {
        const status = params.value;
        let color;
        switch (status) {
          case 'In Drying':
            color = 'primary';
            break;
          case 'Dried':
            color = 'success';
            break;
          case 'Not in Drying':
            color = 'default';
            break;
          default:
            color = 'default';
        }
        return (
          <Chip
            label={status}
            color={color}
            size="small"
            sx={{ borderRadius: '16px', fontWeight: 'medium' }}
          />
        );
      },
    },
    { field: 'startDryingDate', headerName: 'Start Drying Date', width: 150 },
    { field: 'endDryingDate', headerName: 'End Drying Date', width: 150 },
    { field: 'weight', headerName: 'Weight', width: 100 },
    { field: 'type', headerName: 'Type', width: 90 },
    { field: 'producer', headerName: 'Producer', width: 90 },
    { field: 'productLine', headerName: 'Product Line', width: 130 },
    { field: 'processingType', headerName: 'Processing Type', width: 160 },
    { field: 'quality', headerName: 'Quality', width: 100 },
    {
      field: 'details',
      headerName: 'Details',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Button
          variant="outlined"
          size="small"
          onClick={() => handleDetailsClick(params.row)}
        >
          Details
        </Button>
      ),
    },
  ];

  const dryingAreas = [
    "Drying Area 1",
    "Drying Area 2",
    "Drying Area 3",
    "Drying Area 4",
    "Drying Area 5",
  ];

  const getAreaData = (area) => {
    const areaData = dryingData.filter(batch => batch.dryingArea === area);
    return areaData.sort((a, b) => {
      if (a.type !== b.type) return b.type.localeCompare(a.type);
      if (a.startDryingDate !== b.startDryingDate) return a.startDryingDate.localeCompare(b.startDryingDate);
      return a.batchNumber.localeCompare(b.batchNumber);
    });
  };

  const renderDataGrid = (area) => {
    const areaData = getAreaData(area);
    return (
      <>
        <Typography variant="h6" gutterBottom>{area}</Typography>
        <div style={{ height: 400, width: '100%' }}>
          {areaData.length === 0 ? (
            <Typography variant="body1" align="center" color="textSecondary" style={{ paddingTop: '180px' }}>
              No batches in {area}
            </Typography>
          ) : (
            <DataGrid
              rows={areaData}
              columns={columns}
              pageSize={5}
              rowsPerPageOptions={[5, 10, 20]}
              disableSelectionOnClick
              sortingOrder={['desc', 'asc']}
              getRowId={(row) => row.batchNumber}
              slots={{ toolbar: GridToolbar }}
              autosizeOnMount
              autosizeOptions={{
                includeHeaders: true,
                includeOutliers: true,
                expand: true,
              }}
              rowHeight={35}
            />
          )}
        </div>
      </>
    );
  };

  // Generate 7-day optimal curve starting from startDryingDate
  const generateOptimalCurve = () => {
    if (!selectedBatch || selectedBatch.startDryingDate === 'N/A') {
      return { labels: [], data: [] }; // Return empty arrays if no valid start date
    }
    const startDate = new Date(selectedBatch.startDryingDate);
    const labels = [];
    const data = [];
    for (let i = 0; i <= 168; i += 24) { // Every 24 hours for 7 days
      const date = new Date(startDate);
      date.setHours(date.getHours() + i);
      labels.push(date.toLocaleDateString());
      data.push(50 * Math.exp(-0.00858 * i)); // 50% to 12% over 168 hours
    }
    return { labels, data };
  };

  const optimalCurve = generateOptimalCurve();

  // Graph data with fixed 7-day optimal curve and user measurements
  const chartData = {
    labels: optimalCurve.labels, // Use the 7-day labels from optimal curve
    datasets: [
      {
        label: 'Measured Moisture',
        data: dryingMeasurements.map(m => ({
          x: new Date(m.measurement_date).toLocaleDateString(),
          y: m.moisture,
        })),
        fill: false,
        backgroundColor: 'rgba(75,192,192,1)',
        borderColor: 'rgba(75,192,192,0.2)',
        type: 'scatter',
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
  };

  const chartOptions = {
    scales: {
      x: {
        title: { display: true, text: 'Date' },
        type: 'category', // Use category scale for discrete dates
      },
      y: {
        title: { display: true, text: 'Moisture (%)' },
        min: 0,
        max: 60,
      },
    },
    plugins: {
      legend: { display: true },
      tooltip: { mode: 'index', intersect: false },
    },
  };

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'manager' && session.user.role !== 'drying')) {
    return (
      <Typography variant="h6">
        Access Denied. You do not have permission to view this page.
      </Typography>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Drying Station
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleRefreshData}
              disabled={isLoading}
              style={{ marginBottom: '16px' }}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isLoading ? 'Refreshing...' : 'Refresh Data'}
            </Button>

            {/* Row 1: Drying Area 1 and 2 */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                {renderDataGrid('Drying Area 1')}
              </Grid>
              <Grid item xs={12} md={6}>
                {renderDataGrid('Drying Area 2')}
              </Grid>
            </Grid>

            {/* Row 2: Drying Area 3 and 4 */}
            <Grid container spacing={3} style={{ marginTop: '16px' }}>
              <Grid item xs={12} md={6}>
                {renderDataGrid('Drying Area 3')}
              </Grid>
              <Grid item xs={12} md={6}>
                {renderDataGrid('Drying Area 4')}
              </Grid>
            </Grid>

            {/* Row 3: Drying Area 5 */}
            <Grid container spacing={3} style={{ marginTop: '16px' }}>
              <Grid item xs={12} md={6}>
                {renderDataGrid('Drying Area 5')}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Drying Measurement Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Drying Details - Batch {selectedBatch?.batchNumber}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} style={{ marginBottom: '16px', marginTop: '16px' }}>
            <Grid item xs={8}>
              <TextField
                label="Moisture (%)"
                value={newMoisture}
                onChange={(e) => setNewMoisture(e.target.value)}
                type="number"
                fullWidth
                inputProps={{ min: 0, max: 100, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={4}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddMoisture}
                fullWidth
                style={{ height: '100%' }}
              >
                Add Measurement
              </Button>
            </Grid>
          </Grid>
          <Line data={chartData} options={chartOptions} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default DryingStation;