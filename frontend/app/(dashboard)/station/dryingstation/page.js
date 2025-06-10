"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import {
  Button, Typography, Snackbar, Alert, Grid, Card, CardContent, CircularProgress, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField
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
  TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns'; // For time scale support

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  ScatterController,
  TimeScale
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
  const [newMeasurementDate, setNewMeasurementDate] = useState('');
  const [greenhouseData, setGreenhouseData] = useState({});
  const [openEnvDialog, setOpenEnvDialog] = useState(false);
  const [historicalEnvData, setHistoricalEnvData] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const dryingAreas = ["Drying Area 1", "Drying Area 2", "Drying Area 3", "Drying Area 4", "Drying Area 5", "Drying Room"];
  const deviceMapping = {
    "Drying Area 1": "GH_SENSOR_1",
    "Drying Area 2": "GH_SENSOR_2",
    "Drying Area 3": "GH_SENSOR_3",
    "Drying Area 4": "GH_SENSOR_4",
    "Drying Area 5": "GH_SENSOR_5",
    "Drying Room": "GH_SENSOR_6"
  };

  const fetchDryingData = async () => {
    setIsLoading(true);
    try {
      const [qcResponse, dryingResponse, greenhouseResponse] = await Promise.all([
        fetch('https://processing-facility-backend.onrender.com/api/qc'),
        fetch('https://processing-facility-backend.onrender.com/api/drying-data'),
        fetch('https://processing-facility-backend.onrender.com/api/greenhouse-latest')
      ]);
      if (!qcResponse.ok || !dryingResponse.ok || !greenhouseResponse.ok) {
        throw new Error('Failed to fetch data');
      }
      const [qcResult, dryingDataRaw, greenhouseResult] = await Promise.all([
        qcResponse.json(),
        dryingResponse.json(),
        greenhouseResponse.json()
      ]);
      const pendingPreprocessingData = qcResult.distinctRows || [];

      const formattedData = pendingPreprocessingData.map(batch => {
        const batchDryingData = dryingDataRaw.filter(data => data.batchNumber === batch.batchNumber);
        const latestEntry = batchDryingData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        return {
          ...batch,
          status: latestEntry ? (latestEntry.exited_at ? 'Dried' : 'In Drying') : 'Not in Drying',
          dryingArea: latestEntry?.dryingArea || 'N/A',
          startDryingDate: latestEntry?.entered_at ? new Date(latestEntry.entered_at).toISOString().slice(0, 10) : 'N/A',
          endDryingDate: latestEntry?.exited_at ? new Date(latestEntry.exited_at).toISOString().slice(0, 10) : 'N/A',
          weight: batch.weight || 'N/A',
          type: batch.type || 'N/A',
          producer: batch.producer || 'N/A',
          productLine: batch.productLine || 'N/A',
          processingType: batch.processingType || 'N/A',
          quality: batch.quality || 'N/A'
        };
      });

      setDryingData(formattedData);
      setGreenhouseData(greenhouseResult.reduce((acc, { device_id, temperature, humidity }) => ({
        ...acc,
        [device_id]: { temperature: temperature || 0, humidity: humidity || 0 }
      }), {}));
    } catch (error) {
      setSnackbarMessage(error.message || 'Error fetching data');
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
      setSnackbarMessage(error.message || 'Failed to fetch drying measurements');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  const fetchHistoricalEnvData = async (device_id) => {
    try {
      const response = await fetch(`https://processing-facility-backend.onrender.com/api/greenhouse-historical/${device_id}`);
      if (!response.ok) throw new Error('Failed to fetch historical environmental data');
      const data = await response.json();
      setHistoricalEnvData(data);
    } catch (error) {
      setSnackbarMessage(error.message || 'Failed to fetch historical environmental data');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  const handleAddMoisture = async () => {
    if (!newMoisture || isNaN(newMoisture) || newMoisture < 0 || newMoisture > 100) {
      setSnackbarMessage('Enter a valid moisture value (0-100)');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const measurementDate = newMeasurementDate || today;
    const selectedDate = new Date(measurementDate);
    const startDryingDate = selectedBatch?.startDryingDate !== 'N/A' ? new Date(selectedBatch.startDryingDate) : null;
    const now = new Date();

    if (selectedDate > now) {
      setSnackbarMessage('Measurement date cannot be in the future');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    if (startDryingDate && selectedDate < startDryingDate) {
      setSnackbarMessage('Measurement date cannot be before the start drying date');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    try {
      const payload = {
        batchNumber: selectedBatch.batchNumber,
        moisture: parseFloat(newMoisture),
        measurement_date: selectedDate
      };
      const response = await fetch('https://processing-facility-backend.onrender.com/api/drying-measurement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Failed to save drying measurement');
      const result = await response.json();
      setDryingMeasurements([...dryingMeasurements, result.measurement]);
      setNewMoisture('');
      setNewMeasurementDate('');
      setSnackbarMessage('Drying measurement added successfully');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
    } catch (error) {
      setSnackbarMessage(error.message || 'Failed to add drying measurement');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  useEffect(() => {
    fetchDryingData();
    const intervalId = setInterval(fetchDryingData, 300000); // 5 minutes
    return () => clearInterval(intervalId);
  }, []);

  const handleRefreshData = () => fetchDryingData();

  const handleDetailsClick = (batch) => {
    setSelectedBatch(batch);
    fetchDryingMeasurements(batch.batchNumber);
    setOpenDialog(true);
  };

  const handleEnvDetailsClick = (device_id) => {
    setSelectedDevice(device_id);
    fetchHistoricalEnvData(device_id);
    setOpenEnvDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBatch(null);
    setDryingMeasurements([]);
    setNewMoisture('');
    setNewMeasurementDate('');
  };

  const handleCloseEnvDialog = () => {
    setOpenEnvDialog(false);
    setSelectedDevice(null);
    setHistoricalEnvData([]);
  };

  const columns = [
    { field: 'batchNumber', headerName: 'Batch Number', width: 150 },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: ({ value }) => (
        <Chip
          label={value}
          color={value === 'In Drying' ? 'primary' : value === 'Dried' ? 'success' : 'default'}
          size="small"
          sx={{ borderRadius: '16px', fontWeight: 'medium' }}
        />
      )
    },
    {
      field: 'details',
      headerName: 'Details',
      width: 100,
      sortable: false,
      renderCell: ({ row }) => (
        <Button variant="outlined" size="small" onClick={() => handleDetailsClick(row)}>
          Details
        </Button>
      )
    },
    { field: 'startDryingDate', headerName: 'Start Drying Date', width: 150 },
    { field: 'endDryingDate', headerName: 'End Drying Date', width: 150 },
    { field: 'weight', headerName: 'Weight', width: 100 },
    { field: 'type', headerName: 'Type', width: 90 },
    { field: 'producer', headerName: 'Producer', width: 90 },
    { field: 'productLine', headerName: 'Product Line', width: 150 },
    { field: 'processingType', headerName: 'Processing Type', width: 200 },
    { field: 'quality', headerName: 'Quality', width: 100 }
  ];

  const getAreaData = (area) => {
    return dryingData
      .filter(batch => batch.dryingArea === area)
      .sort((a, b) => {
        const statusOrder = { 'In Drying': 0, 'Not in Drying': 1, 'Dried': 2 };
        const statusA = statusOrder[a.status] || 3;
        const statusB = statusOrder[b.status] || 3;
        if (statusA !== statusB) return statusA - statusB;
        if (a.startDryingDate !== b.startDryingDate) return a.startDryingDate.localeCompare(b.startDryingDate);
        const typeOrder = { 'Arabica': 0, 'Robusta': 1 };
        const typeA = typeOrder[a.type] ?? 2;
        const typeB = typeOrder[b.type] ?? 2;
        return typeA - typeB;
      });
  };

  const renderDataGrid = (area) => {
    const areaData = getAreaData(area);
    const deviceId = deviceMapping[area];
    const envData = greenhouseData[deviceId] || { temperature: 0, humidity: 0 };
    return (
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          {area}
        </Typography>
        <Typography variant="body2" gutterBottom>
          Temp: {envData.temperature}°C | Humidity: {envData.humidity}%
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleEnvDetailsClick(deviceId)}
            sx={{ ml: 2 }}
          >
            See Details
          </Button>
        </Typography>
        <div style={{ height: 400, width: '100%' }}>
          {areaData.length === 0 ? (
            <Typography variant="body1" align="center" color="textSecondary" sx={{ pt: '180px' }}>
              No batches in {area}
            </Typography>
          ) : (
            <DataGrid
              rows={areaData}
              columns={columns}
              pageSizeOptions={[5, 10, 20]}
              disableRowSelectionOnClick
              getRowId={row => row.batchNumber}
              slots={{ toolbar: GridToolbar }}
              autoHeight
              rowHeight={35}
            />
          )}
        </div>
      </Grid>
    );
  };

  const generateOptimalCurve = () => {
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
  };

  const optimalCurve = generateOptimalCurve();

  const moistureChartData = {
    labels: optimalCurve.labels,
    datasets: [
      {
        label: 'Measured Moisture',
        data: dryingMeasurements.map(m => ({
          x: new Date(m.measurement_date).toLocaleDateString(),
          y: m.moisture
        })),
        type: 'scatter',
        backgroundColor: 'rgba(75,192,192,1)',
        borderColor: 'rgba(75,192,192,0.2)',
        pointRadius: 5
      },
      {
        label: 'Optimal Natural Sun Drying Curve',
        data: optimalCurve.data,
        fill: false,
        borderColor: 'rgba(255,99,132,1)',
        borderDash: [5, 5],
        tension: 0.4
      }
    ]
  };

  const moistureChartOptions = {
    scales: {
      x: { title: { display: true, text: 'Date' }, type: 'category' },
      y: { title: { display: true, text: 'Moisture (%)' }, min: 0, max: 60 }
    },
    plugins: { legend: { display: true }, tooltip: { mode: 'index', intersect: false } }
  };

  const envChartData = {
    labels: historicalEnvData.map(d => {
      const date = new Date(d.recorded_at);
      // Adjust UTC to WITA (+8 hours)
      date.setHours(date.getHours() + 8);
      // Format as YYYY-MM-DD HH:mm
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }),
    datasets: [
      {
        label: 'Temperature (°C)',
        data: historicalEnvData.map(d => d.temperature),
        borderColor: 'rgba(255,99,132,1)',
        fill: false,
        tension: 0.1
      },
      {
        label: 'Humidity (%)',
        data: historicalEnvData.map(d => d.humidity),
        borderColor: 'rgba(75,192,192,1)',
        fill: false,
        tension: 0.1
      }
    ]
  };

  const envChartOptions = {
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'hour',
          displayFormats: {
            hour: 'yyyy-MM-dd HH:mm'
          },
          tooltipFormat: 'yyyy-MM-dd HH:mm'
        },
        title: { display: true, text: 'Date and Time (WITA)' }
      },
      y: { 
        title: { display: true, text: 'Value' }, 
        min: 0, 
        max: 100 
      }
    },
    plugins: { 
      legend: { display: true }, 
      tooltip: { mode: 'index', intersect: false } 
    }
  };

  if (status === 'loading') return <p>Loading...</p>;
  if (!session?.user || !['admin', 'manager', 'drying'].includes(session.user.role)) {
    return <Typography variant="h6">Access Denied</Typography>;
  }

  return (
    <Grid container spacing={3} sx={{ p: 2 }}>
      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>Drying Station</Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleRefreshData}
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{ mb: 2 }}
            >
              {isLoading ? 'Refreshing...' : 'Refresh Data'}
            </Button>
            <Grid container spacing={3}>
              {dryingAreas.map(area => renderDataGrid(area))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Drying Details - Batch {selectedBatch?.batchNumber}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mb: 2, mt: 1 }}>
            <Grid item xs={5}>
              <TextField
                label="Moisture (%)"
                value={newMoisture}
                onChange={e => setNewMoisture(e.target.value)}
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
                onChange={e => setNewMeasurementDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={2}>
              <Button variant="contained" color="primary" onClick={handleAddMoisture} fullWidth sx={{ height: '100%' }}>
                Add Measurement
              </Button>
            </Grid>
          </Grid>
          <Line data={moistureChartData} options={moistureChartOptions} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openEnvDialog} onClose={handleCloseEnvDialog} maxWidth="md" fullWidth>
        <DialogTitle>Environmental Data - Device {selectedDevice}</DialogTitle>
        <DialogContent>
          <Line data={envChartData} options={envChartOptions} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEnvDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default DryingStation;