"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import {
  Typography,
  Grid,
  Button,
  TextField,
  Snackbar,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Tabs,
  Tab,
  Box,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import Alert from '@mui/material/Alert';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import axios from "axios";
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
dayjs.extend(duration);

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://processing-facility-backend.onrender.com';

const FermentationStation = () => {
  const { data: session, status } = useSession();
  const [batchNumber, setBatchNumber] = useState('');
  const [tank, setTank] = useState('');
  const [blueBarrelCode, setBlueBarrelCode] = useState('');
  const [weight, setWeight] = useState('');
  const [startDate, setStartDate] = useState(dayjs().format('YYYY-MM-DDTHH:mm:ss'));
  const [fermentationData, setFermentationData] = useState([]);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [availableTanks, setAvailableTanks] = useState([]);
  const [isLoadingTanks, setIsLoadingTanks] = useState(false);
  const [tankError, setTankError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [tabValue, setTabValue] = useState('Biomaster');

  const blueBarrelCodes = Array.from({ length: 15 }, (_, i) => 
    `BB-HQ-${String(i + 1).padStart(4, '0')}`
  );

  const ITEM_HEIGHT = 48;
  const ITEM_PADDING_TOP = 8;
  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
        width: 350, // Increased width to accommodate additional info
      },
    },
  };

  // Fetch available batches for dropdown
  const fetchAvailableBatches = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/fermentation/available-batches`);
      if (!Array.isArray(response.data)) {
        console.error('fetchAvailableBatches: Expected array, got:', response.data);
        setAvailableBatches([]);
        setSnackbarMessage('Invalid batch data received.');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
        return;
      }
      setAvailableBatches(response.data);
    } catch (error) {
      console.error('Error fetching available batches:', error, 'Response:', error.response);
      setSnackbarMessage('Failed to fetch available batches.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      setAvailableBatches([]);
    }
  };

  // Fetch available tanks
  const fetchAvailableTanks = async () => {
    setIsLoadingTanks(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/fermentation/available-tanks`);
      if (!Array.isArray(response.data)) {
        console.error('fetchAvailableTanks: Expected array, got:', response.data);
        setAvailableTanks([]);
        setTankError('Invalid tank data received. Please try again.');
        setSnackbarMessage('Failed to fetch available tanks.');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
        return;
      }
      setAvailableTanks(response.data);
      setTankError(null);
    } catch (error) {
      console.error('Error fetching available tanks:', error, 'Response:', error.response);
      setSnackbarMessage('Failed to fetch available tanks.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      setAvailableTanks([]);
      setTankError('Unable to load tank availability. Please try again.');
    } finally {
      setIsLoadingTanks(false);
    }
  };

  // Fetch fermentation data
  const fetchFermentationData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/fermentation`);
      if (!Array.isArray(response.data)) {
        console.error('fetchFermentationData: Expected array, got:', response.data);
        setFermentationData([]);
        setSnackbarMessage('Invalid fermentation data received.');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
        return;
      }
      setFermentationData(response.data);
    } catch (error) {
      console.error('Error fetching fermentation data:', error, 'Response:', error.response);
      setSnackbarMessage('Failed to fetch fermentation data. Please try again.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      setFermentationData([]);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchFermentationData();
    fetchAvailableBatches();
    fetchAvailableTanks();
  }, []);

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!session || !session.user) {
      setSnackbarMessage('No user session found.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    if (!batchNumber || !tank || (tank === 'Blue Barrel' && !blueBarrelCode) || !weight) {
      setSnackbarMessage('All required fields must be filled.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      setSnackbarMessage('Weight must be a positive number.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    const payload = {
      batchNumber: batchNumber.trim(),
      tank: tank === 'Blue Barrel' ? blueBarrelCode : tank,
      startDate: dayjs(startDate).toISOString(),
      weight: weightNum,
      createdBy: session.user.name,
    };

    try {
      await axios.post(`${API_BASE_URL}/api/fermentation`, payload);
      setSnackbarMessage(`Fermentation started for batch ${batchNumber} in ${payload.tank} with weight ${weightNum}kg.`);
      setSnackbarSeverity('success');
      setBatchNumber('');
      setTank('');
      setBlueBarrelCode('');
      setWeight('');
      setStartDate(dayjs().format('YYYY-MM-DDTHH:mm:ss'));
      await fetchFermentationData();
      await fetchAvailableBatches();
      await fetchAvailableTanks();
    } catch (error) {
      console.error('Error submitting fermentation data:', error, 'Response:', error.response);
      setSnackbarMessage(error.response?.data?.error || 'Failed to start fermentation. Please try again.');
      setSnackbarSeverity('error');
    } finally {
      setOpenSnackbar(true);
    }
  };

  const handleFinishFermentation = async (batchNumber) => {
    try {
      await axios.put(`${API_BASE_URL}/api/fermentation/finish/${batchNumber}`);
      setSnackbarMessage(`Fermentation finished for batch ${batchNumber}.`);
      setSnackbarSeverity('success');
      await fetchFermentationData();
      await fetchAvailableBatches();
      await fetchAvailableTanks();
    } catch (error) {
      console.error('Error finishing fermentation:', error, 'Response:', error.response);
      setSnackbarMessage('Failed to finish fermentation. Please try again.');
      setSnackbarSeverity('error');
    } finally {
      setOpenSnackbar(true);
    }
  };

  const calculateElapsedTime = (startDate, endDate) => {
    if (endDate) return '-';
    const start = dayjs(startDate);
    const now = dayjs();
    const duration = dayjs.duration(now.diff(start));
    const days = Math.floor(duration.asDays());
    const hours = Math.floor(duration.asHours() % 24);
    const minutes = Math.floor(duration.asMinutes() % 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const fermentationColumns = [
    { field: 'batchNumber', headerName: 'Batch Number', width: 180 },
    { field: 'lotNumber', headerName: 'Lot Number', width: 180 },
    { field: 'farmerName', headerName: 'Farmer Name', width: 150 },
    { field: 'weight', headerName: 'Fermentation Weight (kg)', width: 180 },
    { field: 'tank', headerName: 'Tank', width: 150 },
    {
      field: 'startDate',
      headerName: 'Start Date',
      width: 180,
      renderCell: ({ value }) => dayjs(value).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      field: 'elapsedTime',
      headerName: 'Elapsed Time',
      width: 150,
      renderCell: ({ row }) => calculateElapsedTime(row.startDate, row.endDate),
    },
    {
      field: 'endDate',
      headerName: 'End Date',
      width: 180,
      renderCell: ({ value }) => value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    { field: 'status', headerName: 'Status', width: 120 },
    { field: 'createdBy', headerName: 'Created By', width: 150 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: ({ row }) => (
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() => handleFinishFermentation(row.batchNumber)}
          disabled={row.status === 'Finished'}
        >
          Finish
        </Button>
      ),
    },
  ];

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'manager' && session.user.role !== 'staff')) {
    return (
      <Typography variant="h6">
        Access Denied. You do not have permission to view this page.
      </Typography>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
              Fermentation Station Form
            </Typography>
            {tankError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {tankError}
              </Alert>
            )}
            <form onSubmit={handleSubmit}>
              <FormControl fullWidth required sx={{ marginTop: '16px' }}>
                <InputLabel id="batch-number-label">Batch Number</InputLabel>
                <Select
                  labelId="batch-number-label"
                  id="batch-number"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  input={<OutlinedInput label="Batch Number" />}
                  MenuProps={MenuProps}
                  renderValue={(selected) => selected || 'Select a batch'}
                >
                  {availableBatches.map(batch => (
                    <MenuItem key={batch.batchNumber} value={batch.batchNumber}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body1">{batch.batchNumber}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Lot: {batch.lotNumber}, Farmer: {batch.farmerName}, {batch.weight}kg
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth required sx={{ marginTop: '16px' }}>
                <InputLabel id="tank-label">Tank</InputLabel>
                <Select
                  labelId="tank-label"
                  id="tank"
                  value={tank}
                  onChange={(e) => {
                    setTank(e.target.value);
                    if (e.target.value !== 'Blue Barrel') setBlueBarrelCode('');
                  }}
                  input={<OutlinedInput label="Tank" />}
                  MenuProps={MenuProps}
                  disabled={isLoadingTanks || tankError}
                >
                  <MenuItem value="Biomaster" disabled={!availableTanks.includes('Biomaster')}>
                    Biomaster {availableTanks.includes('Biomaster') ? '' : '(In Use)'}
                  </MenuItem>
                  <MenuItem value="Carrybrew" disabled={!availableTanks.includes('Carrybrew')}>
                    Carrybrew {availableTanks.includes('Carrybrew') ? '' : '(In Use)'}
                  </MenuItem>
                  <MenuItem value="Blue Barrel" disabled={!availableTanks.some(tank => tank.startsWith('BB-HQ-'))}>
                    Blue Barrel {availableTanks.some(tank => tank.startsWith('BB-HQ-')) ? '' : '(All In Use)'}
                  </MenuItem>
                </Select>
              </FormControl>
              {tank === 'Blue Barrel' && (
                <Autocomplete
                  options={blueBarrelCodes.filter(code => availableTanks.includes(code))}
                  value={blueBarrelCode}
                  onChange={(e, newValue) => setBlueBarrelCode(newValue || '')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Blue Barrel Code"
                      required
                      margin="normal"
                      error={!blueBarrelCode && tank === 'Blue Barrel'}
                      helperText={!blueBarrelCode && tank === 'Blue Barrel' ? 'Please select a Blue Barrel code' : ''}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isLoadingTanks ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  sx={{ marginTop: '16px' }}
                  noOptionsText="No available Blue Barrels"
                  disabled={isLoadingTanks || tankError}
                />
              )}
              <TextField
                label="Weight (kg)"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                fullWidth
                required
                margin="normal"
                InputProps={{ inputProps: { min: 0.01, step: 0.01 } }}
                error={weight && (isNaN(parseFloat(weight)) || parseFloat(weight) <= 0)}
                helperText={
                  weight && (isNaN(parseFloat(weight)) || parseFloat(weight) <= 0)
                    ? 'Weight must be a positive number.'
                    : ''
                }
              />
              <TextField
                label="Start Date and Time"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                fullWidth
                required
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                style={{ marginTop: '16px' }}
                disabled={
                  !batchNumber ||
                  !tank ||
                  (tank === 'Blue Barrel' && !blueBarrelCode) ||
                  !weight ||
                  isNaN(parseFloat(weight)) ||
                  parseFloat(weight) <= 0 ||
                  isLoadingTanks ||
                  tankError
                }
              >
                Start Fermentation
              </Button>
            </form>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Fermentation Batches
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={fetchFermentationData}
              style={{ marginBottom: '16px' }}
            >
              Refresh Data
            </Button>
            <Tabs
              value={tabValue}
              onChange={(e, newValue) => setTabValue(newValue)}
              sx={{ marginBottom: '16px' }}
            >
              <Tab label="Biomaster" value="Biomaster" />
              <Tab label="Carrybrew" value="Carrybrew" />
              <Tab label="Blue Barrel" value="Blue Barrel" />
            </Tabs>
            <div style={{ height: 800, width: '100%' }}>
              <DataGrid
                rows={fermentationData
                  .filter(row => 
                    tabValue === 'Blue Barrel' 
                      ? row.tank.startsWith('BB-HQ-') 
                      : row.tank === tabValue
                  )
                  .map((row, index) => ({ id: index + 1, ...row }))}
                columns={fermentationColumns}
                pageSize={5}
                slots={{ toolbar: GridToolbar }}
                autosizeOnMount
                autosizeOptions={{
                  includeHeaders: true,
                  includeOutliers: true,
                  expand: true,
                }}
                rowHeight={35}
              />
            </div>
          </CardContent>
        </Card>
      </Grid>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default FermentationStation;