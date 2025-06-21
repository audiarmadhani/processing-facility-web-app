"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import {
  Button, Typography, Snackbar, Alert, Grid, Card, CardContent, CircularProgress, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, InputLabel,
  Table, TableBody, TableCell, TableHead, TableRow
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
import 'chartjs-adapter-date-fns';

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
  const [dryingData, setDryingData] = useState({});
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
  const [openMoveDialog, setOpenMoveDialog] = useState(false);
  const [newDryingArea, setNewDryingArea] = useState('');
  const [openWeightDialog, setOpenWeightDialog] = useState(false);
  const [weightMeasurements, setWeightMeasurements] = useState([]);
  const [newBagWeight, setNewBagWeight] = useState('');
  const [newBagNumber, setNewBagNumber] = useState(1);
  const [newProcessingType, setNewProcessingType] = useState('');
  const [newWeightDate, setNewWeightDate] = useState('');

  const dryingAreas = ["Drying Area 1", "Drying Area 2", "Drying Area 3", "Drying Area 4", "Drying Area 5", "Drying Sun Dry", "Drying Room"];
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
      const [qcResponse, dryingResponse, greenhouseResponse, weightResponse] = await Promise.all([
        fetch('https://processing-facility-backend.onrender.com/api/qc'),
        fetch('https://processing-facility-backend.onrender.com/api/drying-data'),
        fetch('https://processing-facility-backend.onrender.com/api/greenhouse-latest'),
        fetch('https://processing-facility-backend.onrender.com/api/drying-weight-measurements/all') // Assume an endpoint to fetch all weight measurements
      ]);
      if (!qcResponse.ok || !dryingResponse.ok || !greenhouseResponse.ok) {
        throw new Error('Failed to fetch data');
      }
      const [qcResult, dryingDataRaw, greenhouseResult, weightResult] = await Promise.all([
        qcResponse.json(),
        dryingResponse.json(),
        greenhouseResponse.json(),
        weightResponse.ok ? weightResponse.json() : []
      ]);
      const pendingPreprocessingData = qcResult.distinctRows || [];

      // Calculate total weight per batch for the latest measurement date
      const batchWeights = {};
      weightResult.forEach(measurement => {
        const { batchNumber, weight, measurement_date } = measurement;
        if (!batchWeights[batchNumber] || new Date(measurement_date) > new Date(batchWeights[batchNumber].date)) {
          batchWeights[batchNumber] = { date: measurement_date, total: 0 };
        }
        if (new Date(measurement_date).getTime() === new Date(batchWeights[batchNumber].date).getTime()) {
          batchWeights[batchNumber].total += weight;
        }
      });

      const formattedData = dryingAreas.reduce((acc, area) => {
        acc[area] = pendingPreprocessingData
          .filter(batch => {
            const batchDryingData = dryingDataRaw.find(data => data.batchNumber === batch.batchNumber && data.dryingArea === area);
            return !!batchDryingData;
          })
          .map(batch => {
            const batchDryingData = dryingDataRaw.filter(data => data.batchNumber === batch.batchNumber && data.dryingArea === area);
            const latestEntry = batchDryingData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
            return {
              ...batch,
              status: latestEntry ? (latestEntry.exited_at ? 'Dried' : 'In Drying') : 'Not in Drying',
              dryingArea: latestEntry?.dryingArea || 'N/A',
              startDryingDate: latestEntry?.entered_at ? new Date(latestEntry.entered_at).toISOString().slice(0, 10) : 'N/A',
              endDryingDate: latestEntry?.exited_at ? new Date(latestEntry.exited_at).toISOString().slice(0, 10) : 'N/A',
              weight: batchWeights[batch.batchNumber] ? batchWeights[batchNumber].total.toFixed(2) : 'N/A',
              type: batch.type || 'N/A',
              producer: batch.producer || 'N/A',
              productLine: batch.productLine || 'N/A',
              processingType: batch.processingType || 'N/A',
              quality: batch.quality || 'N/A',
              farmerName: batch.farmerName || 'N/A',
              farmVarieties: batch.farmVarieties || 'N/A',
              rfid: latestEntry?.rfid || 'N/A',
            };
          })
          .sort((a, b) => {
            const statusOrder = { 'In Drying': 0, 'Not in Drying': 1, 'Dried': 2 };
            const statusA = statusOrder[a.status] || 3;
            const statusB = statusOrder[b.status] || 3;
            if (statusA !== statusB) return statusA - statusB;
            const dateA = a.startDryingDate === 'N/A' ? '' : a.startDryingDate;
            const dateB = b.startDryingDate === 'N/A' ? '' : b.startDryingDate;
            if (dateA !== dateB) return dateA.localeCompare(dateB);
            const typeOrder = { 'Arabica': 0, 'Robusta': 1 };
            const typeA = typeOrder[a.type] ?? 2;
            const typeB = typeOrder[b.type] ?? 2;
            return typeA - typeB;
          });
        return acc;
      }, {});

      setDryingData(formattedData);
      setGreenhouseData(greenhouseResult.reduce((data, { device_id, temperature, humidity }) => ({
        ...data,
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

  const fetchWeightMeasurements = async (batchNumber) => {
    try {
      const response = await fetch(`https://processing-facility-backend.onrender.com/api/drying-weight-measurements/${batchNumber}`);
      if (!response.ok) throw new Error('Failed to fetch weight measurements');
      const data = await response.json();
      setWeightMeasurements(data);
    } catch (error) {
      setSnackbarMessage(error.message || 'Failed to fetch weight measurements');
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

  const handleMoveBatch = async () => {
    if (!newDryingArea) {
      setSnackbarMessage('Please select a drying area');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    try {
      const payload = {
        batchNumber: selectedBatch.batchNumber,
        newDryingArea,
        rfid: selectedBatch.rfid
      };
      const response = await fetch('https://processing-facility-backend.onrender.com/api/move-drying-area', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to move batch');
      }
      const result = await response.json();
      setSnackbarMessage(result.message);
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      setOpenMoveDialog(false);
      setNewDryingArea('');
      setSelectedBatch(null);
      await fetchDryingData();
    } catch (error) {
      setSnackbarMessage(error.message || 'Failed to move batch');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  const handleAddBagWeight = async () => {
    if (!newBagWeight || isNaN(newBagWeight) || newBagWeight <= 0) {
      setSnackbarMessage('Enter a valid weight (positive number)');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }
    if (!newProcessingType) {
      setSnackbarMessage('Select a processing type');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }
    if (!newWeightDate) {
      setSnackbarMessage('Select a measurement date');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    const selectedDate = new Date(newWeightDate);
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
        processingType: newProcessingType,
        bagNumber: newBagNumber,
        weight: parseFloat(newBagWeight),
        measurement_date: newWeightDate
      };
      const response = await fetch('https://processing-facility-backend.onrender.com/api/drying-weight-measurement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Failed to save weight measurement');
      const result = await response.json();
      setWeightMeasurements([...weightMeasurements, result.measurement]);
      setNewBagWeight('');
      setNewBagNumber(newBagNumber + 1);
      setSnackbarMessage('Bag weight added successfully');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      await fetchDryingData(); // Refresh to update total weight
    } catch (error) {
      setSnackbarMessage(error.message || 'Failed to add weight measurement');
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

  const handleMoveClick = (batch) => {
    setSelectedBatch(batch);
    setOpenMoveDialog(true);
  };

  const handleWeightClick = (batch) => {
    setSelectedBatch(batch);
    fetchWeightMeasurements(batch.batchNumber);
    setNewBagNumber(1);
    setNewProcessingType('');
    setNewBagWeight('');
    setNewWeightDate(new Date().toISOString().slice(0, 10));
    setOpenWeightDialog(true);
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

  const handleCloseMoveDialog = () => {
    setOpenMoveDialog(false);
    setNewDryingArea('');
    setSelectedBatch(null);
  };

  const handleCloseWeightDialog = () => {
    setOpenWeightDialog(false);
    setSelectedBatch(null);
    setWeightMeasurements([]);
    setNewBagWeight('');
    setNewBagNumber(1);
    setNewProcessingType('');
    setNewWeightDate('');
  };

  const handleCloseEnvDialog = () => {
    setOpenEnvDialog(false);
    setSelectedDevice(null);
    setHistoricalEnvData([]);
  };

  const columns = [
    { field: 'batchNumber', headerName: 'Batch Number', width: 150 },
    { field: 'farmerName', headerName: 'Farmer Name', width: 160 },
    { field: 'farmVarieties', headerName: 'Farm Varieties', width: 160 },
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
      width: 110,
      sortable: false,
      renderCell: ({ row }) => (
        <Button variant="outlined" size="small" onClick={() => handleDetailsClick(row)}>
          Details
        </Button>
      )
    },
    {
      field: 'move',
      headerName: 'Move',
      width: 110,
      sortable: false,
      renderCell: ({ row }) => (
        <Button
          variant="outlined"
          size="small"
          color="secondary"
          onClick={() => handleMoveClick(row)}
          disabled={row.status !== 'In Drying'}
        >
          Move
        </Button>
      )
    },
    {
      field: 'trackWeight',
      headerName: 'Track Weight',
      width: 130,
      sortable: false,
      renderCell: ({ row }) => (
        <Button
          variant="outlined"
          size="small"
          color="info"
          onClick={() => handleWeightClick(row)}
        >
          Track Weight
        </Button>
      )
    },
    { field: 'startDryingDate', headerName: 'Start Drying Date', width: 150 },
    { field: 'endDryingDate', headerName: 'End Drying Date', width: 150 },
    { field: 'weight', headerName: 'Dry Weight (kg)', width: 120 },
    { field: 'type', headerName: 'Type', width: 90 },
    { field: 'producer', headerName: 'Producer', width: 90 },
    { field: 'productLine', headerName: 'Product Line', width: 150 },
    { field: 'processingType', headerName: 'Processing Type', width: 200 },
    { field: 'quality', headerName: 'Quality', width: 100 }
  ];

  const renderDataGrid = (area) => {
    const areaData = dryingData[area] || [];
    const deviceId = deviceMapping[area];
    const envData = greenhouseData[deviceId] || { temperature: 0, humidity: 0 };
    return (
      <Grid item xs={12}>
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
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
            <div style={{ height: 400, width: '100%', overflow: 'auto' }}>
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
                  sx={{ 
                    maxHeight: 400, 
                    border: '1px solid rgba(0,0,0,0.12)', 
                    '& .MuiDataGrid-footerContainer': { borderTop: 'none' }
                  }}
                  rowHeight={35}
                />
              )}
            </div>
          </CardContent>
        </Card>
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
      date.setHours(date.getHours() + 8);
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

  // Calculate total weights for display in the weight dialog
  const getTotalWeights = () => {
    const totals = {};
    weightMeasurements.forEach(m => {
      const date = new Date(m.measurement_date).toISOString().slice(0, 10);
      if (!totals[date]) totals[date] = {};
      if (!totals[date][m.processingType]) totals[date][m.processingType] = 0;
      totals[date][m.processingType] += m.weight;
    });
    return totals;
  };

  const processingTypes = selectedBatch?.processingType && selectedBatch.processingType !== 'N/A' 
    ? selectedBatch.processingType.split(',').map(type => type.trim()) 
    : ['Washed', 'Natural'];

  const totalWeights = getTotalWeights();

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

      <Dialog open={openMoveDialog} onClose={handleCloseMoveDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Move Batch {selectedBatch?.batchNumber}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="drying-area-label">New Drying Area</InputLabel>
            <Select
              labelId="drying-area-label"
              value={newDryingArea}
              onChange={e => setNewDryingArea(e.target.value)}
              label="New Drying Area"
            >
              {dryingAreas
                .filter(area => area !== selectedBatch?.dryingArea)
                .map(area => (
                  <MenuItem key={area} value={area}>{area}</MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMoveDialog}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleMoveBatch} disabled={!newDryingArea}>
            Move
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openWeightDialog} onClose={handleCloseWeightDialog} maxWidth="md" fullWidth>
        <DialogTitle>Track Weight - Batch {selectedBatch?.batchNumber}</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>Add Bag Weight</Typography>
          <Grid container spacing={2} sx={{ mb: 2, mt: 1 }}>
            <Grid item xs={3}>
              <FormControl fullWidth>
                <InputLabel id="processing-type-label">Processing Type</InputLabel>
                <Select
                  labelId="processing-type-label"
                  value={newProcessingType}
                  onChange={e => setNewProcessingType(e.target.value)}
                  label="Processing Type"
                >
                  {processingTypes.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={2}>
              <TextField
                label="Bag Number"
                value={newBagNumber}
                onChange={e => setNewBagNumber(parseInt(e.target.value) || 1)}
                type="number"
                fullWidth
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Weight (kg)"
                value={newBagWeight}
                onChange={e => setNewBagWeight(e.target.value)}
                type="number"
                fullWidth
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                label="Measurement Date"
                type="date"
                value={newWeightDate}
                onChange={e => setNewWeightDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={2}>
              <Button variant="contained" color="primary" onClick={handleAddBagWeight} fullWidth sx={{ height: '100%' }}>
                Add Bag
              </Button>
            </Grid>
          </Grid>

          {processingTypes.map(type => {
            const typeMeasurements = weightMeasurements.filter(m => m.processingType === type);
            const latestDate = typeMeasurements.length > 0 
              ? new Date(Math.max(...typeMeasurements.map(m => new Date(m.measurement_date)))).toISOString().slice(0, 10)
              : null;
            const total = totalWeights[latestDate]?.[type] || 0;
            return (
              <div key={type}>
                <Typography variant="subtitle1" gutterBottom>{type} Total: {total.toFixed(2)} kg</Typography>
              </div>
            );
          })}

          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Weight History</Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Processing Type</TableCell>
                <TableCell>Bag Number</TableCell>
                <TableCell>Weight (kg)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {weightMeasurements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">No weight measurements recorded</TableCell>
                </TableRow>
              ) : (
                weightMeasurements.map(m => (
                  <TableRow key={m.id}>
                    <TableCell>{new Date(m.measurement_date).toLocaleDateString()}</TableCell>
                    <TableCell>{m.processingType}</TableCell>
                    <TableCell>{m.bagNumber}</TableCell>
                    <TableCell>{m.weight.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseWeightDialog}>Close</Button>
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