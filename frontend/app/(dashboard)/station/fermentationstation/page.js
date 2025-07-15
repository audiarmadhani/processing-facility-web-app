"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  Menu,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Alert from '@mui/material/Alert';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import axios from "axios";
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
dayjs.extend(duration);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Makassar');

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://processing-facility-backend.onrender.com';

const FermentationStation = () => {
  const { data: session, status } = useSession();
  const [batchNumber, setBatchNumber] = useState('');
  const [tank, setTank] = useState('');
  const [blueBarrelCode, setBlueBarrelCode] = useState('');
  const [startDate, setStartDate] = useState(dayjs().tz('Asia/Makassar').format('YYYY-MM-DDTHH:mm:ss'));
  const [fermentationData, setFermentationData] = useState([]);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [availableTanks, setAvailableTanks] = useState([]);
  const [isLoadingTanks, setIsLoadingTanks] = useState(false);
  const [tankError, setTankError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [tabValue, setTabValue] = useState('Biomaster');
  const [openWeightDialog, setOpenWeightDialog] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [weightMeasurements, setWeightMeasurements] = useState([]);
  const [newWeight, setNewWeight] = useState('');
  const [newProcessingType, setNewProcessingType] = useState('');
  const [newWeightDate, setNewWeightDate] = useState(dayjs().tz('Asia/Makassar').format('YYYY-MM-DD'));
  const [newProducer, setNewProducer] = useState('HQ');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [openFinishDialog, setOpenFinishDialog] = useState(false);
  const [endDateTime, setEndDateTime] = useState(dayjs().tz('Asia/Makassar').format('YYYY-MM-DDTHH:mm:ss'));

  // Hardcoded processing types as fallback
  const defaultProcessingTypes = [
    "Aerobic Natural",
    "Aerobic Pulped Natural",
    "Aerobic Washed",
    "Anaerobic Natural",
    "Anaerobic Pulped Natural",
    "Anaerobic Washed",
    "CM Natural",
    "CM Pulped Natural",
    "CM Washed",
    "Natural",
    "O2 Natural",
    "O2 Pulped Natural",
    "O2 Washed",
    "Pulped Natural",
    "Washed"
  ];

  const [availableProcessingTypes, setAvailableProcessingTypes] = useState(defaultProcessingTypes);

  const blueBarrelCodes = Array.from({ length: 15 }, (_, i) => 
    `BB-HQ-${String(i + 1).padStart(4, '0')}`
  );

  const producers = ['HQ', 'BTM'];

  const ITEM_HEIGHT = 48;
  const ITEM_PADDING_TOP = 8;
  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
        width: 350,
      },
    },
  };

  const fetchAvailableBatches = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/fermentation/available-batches`);
      const data = Array.isArray(response.data) ? response.data : response.data ? [response.data] : [];
      if (data.length === 0) {
        console.warn('fetchAvailableBatches: No batch data received:', response.data);
        setAvailableBatches([]);
        setSnackbarMessage('No batches available.');
        setSnackbarSeverity('warning');
        setOpenSnackbar(true);
        return;
      }
      setAvailableBatches(data);
    } catch (error) {
      console.error('Error fetching available batches:', error, 'Response:', error.response);
      setSnackbarMessage('Failed to fetch available batches.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      setAvailableBatches([]);
    }
  };

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

      const batchWeights = new Map();
      for (const batch of response.data) {
        const batchKey = batch.batchNumber;
        if (!batchWeights.has(batchKey)) {
          batchWeights.set(batchKey, {});
        }
        const weights = await axios.get(`${API_BASE_URL}/api/fermentation-weight-measurements/${batchKey}`);
        if (weights.data) {
          const dataArray = Array.isArray(weights.data) ? weights.data : [weights.data];
          const totalWeights = {};
          dataArray.forEach(measurement => {
            totalWeights[measurement.processingType] = (totalWeights[measurement.processingType] || 0) + parseFloat(measurement.weight);
          });
          batchWeights.set(batchKey, totalWeights);
        }
      }

      const updatedData = response.data.map(batch => ({
        ...batch,
        totalWeights: batchWeights.get(batch.batchNumber) || {},
      }));
      setFermentationData(updatedData);
    } catch (error) {
      console.error('Error fetching fermentation data:', error, 'Response:', error.response);
      setSnackbarMessage('Failed to fetch fermentation data. Please try again.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      setFermentationData([]);
    }
  };

  const fetchWeightMeasurements = async (batchNumber) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/fermentation-weight-measurements/${batchNumber}`);
      if (response.data) {
        const dataArray = Array.isArray(response.data) ? response.data : [response.data];
        setWeightMeasurements(dataArray);
      } else {
        console.error('fetchWeightMeasurements: No data received:', response.data);
        setWeightMeasurements([]);
        setSnackbarMessage('Invalid weight measurements received.');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error fetching weight measurements:', error, 'Response:', error.response);
      setSnackbarMessage('Failed to fetch weight measurements.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      setWeightMeasurements([]);
    }
  };

  const fetchPreprocessingData = async (batchNumber) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/preprocessing/${batchNumber}`);
      if (response.data && Array.isArray(response.data.preprocessingData)) {
        const uniqueProcessingTypes = [...new Set(response.data.preprocessingData.map(item => item.processingType))];
        setAvailableProcessingTypes(uniqueProcessingTypes.length > 0 ? uniqueProcessingTypes : defaultProcessingTypes);
        if (uniqueProcessingTypes.length > 0 && !newProcessingType) {
          setNewProcessingType(uniqueProcessingTypes[0]);
        }
      } else {
        console.error('fetchPreprocessingData: Expected preprocessingData array, got:', response.data);
        setAvailableProcessingTypes(defaultProcessingTypes);
        setSnackbarMessage('Invalid preprocessing data received. Using default processing types.');
        setSnackbarSeverity('warning');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error fetching preprocessing data:', error, 'Response:', error.response);
      setAvailableProcessingTypes(defaultProcessingTypes);
      setSnackbarMessage('Failed to fetch preprocessing data. Using default processing types.');
      setSnackbarSeverity('warning');
      setOpenSnackbar(true);
    }
  };

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

    if (!batchNumber || !tank || (tank === 'Blue Barrel' && !blueBarrelCode)) {
      setSnackbarMessage('All required fields must be filled.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    const payload = {
      batchNumber: batchNumber.trim(),
      tank: tank === 'Blue Barrel' ? blueBarrelCode : tank,
      startDate: dayjs(startDate).tz('Asia/Makassar', true).toISOString(),
      createdBy: session.user.name,
    };

    try {
      await axios.post(`${API_BASE_URL}/api/fermentation`, payload);
      setSnackbarMessage(`Fermentation started for batch ${batchNumber} in ${payload.tank}.`);
      setSnackbarSeverity('success');
      setBatchNumber('');
      setTank('');
      setBlueBarrelCode('');
      setStartDate(dayjs().tz('Asia/Makassar').format('YYYY-MM-DDTHH:mm:ss'));
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

  const handleFinishFermentation = async () => {
    try {
      const endDate = dayjs(endDateTime).tz('Asia/Makassar', true).toISOString();
      const startDateObj = dayjs(selectedRow.startDate).tz('Asia/Makassar');
      const endDateObj = dayjs(endDateTime).tz('Asia/Makassar');

      if (endDateObj.isBefore(startDateObj)) {
        setSnackbarMessage('End date cannot be before start date.');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
        return;
      }

      const now = dayjs().tz('Asia/Makassar');
      if (endDateObj.isAfter(now)) {
        setSnackbarMessage('End date cannot be in the future.');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
        return;
      }

      await axios.put(`${API_BASE_URL}/api/fermentation/finish/${selectedRow.batchNumber}`, { endDate });
      setSnackbarMessage(`Fermentation finished for batch ${selectedRow.batchNumber}.`);
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
      setOpenFinishDialog(false);
      setAnchorEl(null);
    }
  };

  const handleTrackWeight = async (row) => {
    setSelectedBatch(row);
    await fetchWeightMeasurements(row.batchNumber);
    setNewWeight('');
    setNewWeightDate(dayjs().tz('Asia/Makassar').format('YYYY-MM-DD'));
    setNewProducer('HQ');
    // Fetch preprocessing data to set batch-specific processing types
    await fetchPreprocessingData(row.batchNumber);
    setOpenWeightDialog(true);
    setAnchorEl(null);
  };

  const handleAddWeight = async () => {
    if (!newWeight || isNaN(newWeight) || parseFloat(newWeight) <= 0) {
      setSnackbarMessage('Enter a valid weight (positive number).');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    if (!newProcessingType) {
      setSnackbarMessage('Select a processing type.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    const selectedDate = new Date(newWeightDate);
    const startDateObj = new Date(selectedBatch.startDate);
    const now = new Date();

    if (isNaN(selectedDate.getTime())) {
      setSnackbarMessage('Invalid measurement date.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    if (selectedDate > now) {
      setSnackbarMessage('Measurement date cannot be in the future.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    if (selectedDate < startDateObj) {
      setSnackbarMessage('Measurement date cannot be before the start date.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    try {
      const payload = {
        batchNumber: selectedBatch.batchNumber,
        processingType: newProcessingType,
        weight: parseFloat(newWeight),
        measurement_date: newWeightDate,
        producer: newProducer,
      };
      const response = await axios.post(`${API_BASE_URL}/api/fermentation-weight-measurement`, payload);
      setWeightMeasurements([...weightMeasurements, response.data.measurement]);
      setNewWeight('');
      setNewProcessingType(availableProcessingTypes[0] || ''); // Reset to first available or empty
      setNewWeightDate(dayjs().tz('Asia/Makassar').format('YYYY-MM-DD'));
      setNewProducer('HQ');
      setSnackbarMessage('Weight measurement added successfully.');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      await fetchFermentationData();
    } catch (error) {
      console.error('Error adding weight measurement:', error, 'Response:', error.response);
      setSnackbarMessage(error.response?.data?.error || 'Failed to add weight measurement.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  const handleMenuClick = (event, row) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const calculateElapsedTime = (startDate, endDate) => {
    const start = dayjs.tz(startDate, 'Asia/Makassar');
    const end = endDate ? dayjs.tz(endDate, 'Asia/Makassar') : dayjs.tz();
    const duration = dayjs.duration(end.diff(start));
    const days = Math.floor(duration.asDays());
    const hours = Math.floor(duration.asHours() % 24);
    const minutes = Math.floor(duration.asMinutes() % 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const fermentationColumns = [
    { field: 'batchNumber', headerName: 'Batch Number', width: 180 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: ({ row }) => (
        <>
          <Button
            variant="contained"
            size="small"
            endIcon={<ArrowDropDownIcon />}
            aria-controls={`actions-menu-${row.id}`}
            aria-haspopup="true"
            onClick={(event) => handleMenuClick(event, row)}
          >
            Action
          </Button>
          <Menu
            id={`actions-menu-${row.id}`}
            anchorEl={anchorEl}
            open={Boolean(anchorEl) && selectedRow?.id === row.id}
            onClose={handleMenuClose}
            MenuListProps={{
              'aria-labelledby': `actions-button-${row.id}`,
            }}
          >
            <MenuItem onClick={() => handleTrackWeight(row)}>
              Track Weight
            </MenuItem>
            <MenuItem
              onClick={() => {
                setEndDateTime(dayjs().tz('Asia/Makassar').format('YYYY-MM-DDTHH:mm:ss'));
                setOpenFinishDialog(true);
              }}
              disabled={row.status === 'Finished'}
            >
              Finish
            </MenuItem>
          </Menu>
        </>
      ),
    },
    { field: 'tank', headerName: 'Tank', width: 140 },
    {
      field: 'elapsedTime',
      headerName: 'Elapsed Time',
      width: 130,
      renderCell: ({ row }) => calculateElapsedTime(row.startDate, row.endDate),
    },
    {
      field: 'startDate',
      headerName: 'Start Date',
      width: 180,
      renderCell: ({ value }) => dayjs.tz(value, 'Asia/Makassar').format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      field: 'endDate',
      headerName: 'End Date',
      width: 180,
      renderCell: ({ value }) => value ? dayjs.tz(value, 'Asia/Makassar').format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    { field: 'farmerName', headerName: 'Farmer Name', width: 150 },
    { 
      field: 'totalWeights', 
      headerName: 'Fermentation Weight (kg)', 
      width: 200,
      renderCell: ({ row }) => {
        const weights = row.totalWeights || {};
        return Object.entries(weights).map(([type, weight]) => (
          <div key={type}>{`${type}: ${weight.toFixed(2)}kg`}</div>
        )) || '0.00';
      },
    },
    { field: 'status', headerName: 'Status', width: 120 },
    { field: 'createdBy', headerName: 'Created By', width: 150 },
  ];

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  if (!session?.user || !['admin', 'manager', 'staff'].includes(session.user.role)) {
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
                          Farmer: {batch.farmerName}, {batch.weight}kg
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
                  <MenuItem value="Washing Track" disabled={!availableTanks.includes('Washing Track')}>
                    Washing Track {availableTanks.includes('Washing Track') ? '' : '(In Use)'}
                  </MenuItem>
                  <MenuItem value="Blue Barrel" disabled={!availableTanks.some(tank => tank.startsWith('BB-HQ-'))}>
                    Blue Barrel {availableTanks.some(tank => tank.startsWith('BB-HQ-')) ? '' : '(All In Use)'}
                  </MenuItem>
                  <MenuItem value="Fermentation Bucket">
                    Fermentation Bucket
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
              <Tab label="Washing Track" value="Washing Track" />
              <Tab label="Blue Barrel" value="Blue Barrel" />
              <Tab label="Fermentation Bucket" value="Fermentation Bucket" />
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

      <Dialog open={openWeightDialog} onClose={() => setOpenWeightDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Track Weight - Batch {selectedBatch?.batchNumber}</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>Add Weight Measurement</Typography>
          <Grid container spacing={2} sx={{ mb: 2, mt: 1 }}>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel id="processing-type-label">Processing Type</InputLabel>
                <Select
                  labelId="processing-type-label"
                  value={newProcessingType}
                  onChange={(e) => setNewProcessingType(e.target.value)}
                  label="Processing Type"
                >
                  {availableProcessingTypes.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Weight (kg)"
                type="number"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                fullWidth
                inputProps={{ min: 0.01, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Measurement Date"
                type="date"
                value={newWeightDate}
                onChange={(e) => setNewWeightDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel id="producer-label">Producer</InputLabel>
                <Select
                  labelId="producer-label"
                  value={newProducer}
                  onChange={(e) => setNewProducer(e.target.value)}
                  label="Producer"
                >
                  {producers.map(prod => (
                    <MenuItem key={prod} value={prod}>{prod}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddWeight}
            fullWidth
            sx={{ mb: 2 }}
            disabled={!newWeight || !newProcessingType || !newWeightDate}
          >
            Add Weight
          </Button>
          <Typography variant="h6" gutterBottom>Weight History</Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Processing Type</TableCell>
                <TableCell>Weight (kg)</TableCell>
                <TableCell>Producer</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {weightMeasurements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">No weight measurements recorded.</TableCell>
                </TableRow>
              ) : (
                weightMeasurements.map(m => (
                  <TableRow key={m.id}>
                    <TableCell>{dayjs(m.measurement_date).format('YYYY-MM-DD')}</TableCell>
                    <TableCell>{m.processingType}</TableCell>
                    <TableCell>{parseFloat(m.weight).toFixed(2)}</TableCell>
                    <TableCell>{m.producer}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenWeightDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openFinishDialog} onClose={() => setOpenFinishDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Finish Fermentation - Batch {selectedRow?.batchNumber}</DialogTitle>
        <DialogContent>
          <TextField
            label="End Date and Time"
            type="datetime-local"
            value={endDateTime}
            onChange={(e) => setEndDateTime(e.target.value)}
            fullWidth
            required
            margin="normal"
            InputLabelProps={{ shrink: true }}
            inputProps={{
              min: selectedRow?.startDate || dayjs().tz('Asia/Makassar').format('YYYY-MM-DDTHH:mm:ss'),
              max: dayjs().tz('Asia/Makassar').format('YYYY-MM-DDTHH:mm:ss'),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFinishDialog(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleFinishFermentation} disabled={!endDateTime}>
            Finish
          </Button>
        </DialogActions>
      </Dialog>

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