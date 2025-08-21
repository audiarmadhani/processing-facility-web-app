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
  const [referenceNumber, setReferenceNumber] = useState('');
  const [experimentNumber, setExperimentNumber] = useState('');
  const [processingType, setProcessingType] = useState('natural');
  const [description, setDescription] = useState('');
  const [farmerName, setFarmerName] = useState('');
  const [type, setType] = useState('arabica');
  const [variety, setVariety] = useState('cobra');
  const [preStorage, setPreStorage] = useState('no');
  const [preStorageCondition, setPreStorageCondition] = useState('');
  const [prePulped, setPrePulped] = useState('no');
  const [prePulpedDelva, setPrePulpedDelva] = useState('no');
  const [bulkDensity, setBulkDensity] = useState('0.62');
  const [gas, setGas] = useState('air');
  const [pressure, setPressure] = useState('');
  const [isSubmerged, setIsSubmerged] = useState('no');
  const [pH, setPH] = useState('4');
  const [fermentationTimeTarget, setFermentationTimeTarget] = useState('48');
  const [fermentation, setFermentation] = useState('yes');
  const [fermentationTank, setFermentationTank] = useState('biomaster');
  const [secondFermentation, setSecondFermentation] = useState('no');
  const [secondFermentationTank, setSecondFermentationTank] = useState('biomaster');
  const [secondFermentationTimeTarget, setSecondFermentationTimeTarget] = useState('0');
  const [secondGas, setSecondGas] = useState('air');
  const [secondPressure, setSecondPressure] = useState('');
  const [secondIsSubmerged, setSecondIsSubmerged] = useState('no');
  const [secondBulkDensity, setSecondBulkDensity] = useState('0.62');
  const [dryingArea, setDryingArea] = useState('greenhouse');
  const [secondDrying, setSecondDrying] = useState('no');
  const [secondDryingArea, setSecondDryingArea] = useState('greenhouse');
  const [rehydration, setRehydration] = useState('no');
  const [storage, setStorage] = useState('no');
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
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
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
  const [detailsData, setDetailsData] = useState({});

  const defaultProcessingTypes = [
    "Aerobic Natural", "Aerobic Pulped Natural", "Aerobic Washed",
    "Anaerobic Natural", "Anaerobic Pulped Natural", "Anaerobic Washed",
    "CM Natural", "CM Pulped Natural", "CM Washed",
    "Natural", "O2 Natural", "O2 Pulped Natural", "O2 Washed",
    "Pulped Natural", "Washed"
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
      setFermentationData(response.data.map((row, index) => ({ id: index + 1, ...row })));
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

  const fetchDetailsData = async (batchNumber) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/fermentation/details/${batchNumber}`);
      setDetailsData(response.data || {});
    } catch (error) {
      console.error('Error fetching details data:', error, 'Response:', error.response);
      setDetailsData({});
      setSnackbarMessage('Failed to fetch details data.');
      setSnackbarSeverity('error');
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

    if (!batchNumber || !referenceNumber || !experimentNumber || !processingType || !farmerName || !type || !variety || !tank || (tank === 'Blue Barrel' && !blueBarrelCode)) {
      setSnackbarMessage('All required fields must be filled.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    const payload = {
      batchNumber: batchNumber.trim(),
      referenceNumber,
      experimentNumber,
      processingType,
      description,
      farmerName,
      type,
      variety,
      preStorage,
      preStorageCondition,
      prePulped,
      prePulpedDelva,
      bulkDensity: parseFloat(bulkDensity),
      gas,
      pressure: pressure ? parseFloat(pressure) : null,
      isSubmerged,
      pH: parseFloat(pH),
      fermentationTimeTarget: parseInt(fermentationTimeTarget),
      fermentation,
      fermentationTank: tank === 'Blue Barrel' ? blueBarrelCode : tank,
      secondFermentation,
      secondFermentationTank,
      secondFermentationTimeTarget: parseInt(secondFermentationTimeTarget),
      secondGas,
      secondPressure: secondPressure ? parseFloat(secondPressure) : null,
      secondIsSubmerged,
      secondBulkDensity: parseFloat(secondBulkDensity),
      dryingArea,
      secondDrying,
      secondDryingArea,
      rehydration,
      storage,
      startDate: dayjs(startDate).tz('Asia/Makassar', true).toISOString(),
      createdBy: session.user.name,
    };

    try {
      await axios.post(`${API_BASE_URL}/api/fermentation`, payload);
      setSnackbarMessage(`Fermentation started for batch ${batchNumber} in ${payload.fermentationTank}.`);
      setSnackbarSeverity('success');
      resetForm();
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

  const resetForm = () => {
    setBatchNumber('');
    setReferenceNumber('');
    setExperimentNumber('');
    setProcessingType('natural');
    setDescription('');
    setFarmerName('');
    setType('arabica');
    setVariety('cobra');
    setPreStorage('no');
    setPreStorageCondition('');
    setPrePulped('no');
    setPrePulpedDelva('no');
    setBulkDensity('0.62');
    setGas('air');
    setPressure('');
    setIsSubmerged('no');
    setPH('4');
    setFermentationTimeTarget('48');
    setFermentation('yes');
    setFermentationTank('biomaster');
    setSecondFermentation('no');
    setSecondFermentationTank('biomaster');
    setSecondFermentationTimeTarget('0');
    setSecondGas('air');
    setSecondPressure('');
    setSecondIsSubmerged('no');
    setSecondBulkDensity('0.62');
    setDryingArea('greenhouse');
    setSecondDrying('no');
    setSecondDryingArea('greenhouse');
    setRehydration('no');
    setStorage('no');
    setTank('');
    setBlueBarrelCode('');
    setStartDate(dayjs().tz('Asia/Makassar').format('YYYY-MM-DDTHH:mm:ss'));
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
      setNewProcessingType(availableProcessingTypes[0] || '');
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

  const handleDetailsClick = async (row) => {
    setSelectedBatch(row);
    await fetchDetailsData(row.batchNumber);
    setOpenDetailsDialog(true);
    setAnchorEl(null);
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
      width: 150,
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
            <MenuItem onClick={() => handleDetailsClick(row)}>
              Details
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
      renderCell: ({ value }) => value ? dayjs.tz(value, 'Asia/Makassar').format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      field: 'endDate',
      headerName: 'End Date',
      width: 180,
      renderCell: ({ value }) => value ? dayjs.tz(value, 'Asia/Makassar').format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    { field: 'farmerName', headerName: 'Farmer Name', width: 150 },
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
              <Typography variant="h6" gutterBottom>Pre-fermentation Section</Typography>
              <FormControl fullWidth required sx={{ marginTop: '16px' }}>
                <InputLabel id="batch-number-label">Batch Number</InputLabel>
                <Select
                  labelId="batch-number-label"
                  id="batch-number"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  input={<OutlinedInput label="Batch Number" />}
                  MenuProps={MenuProps}
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
              <TextField
                label="Reference Number"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                fullWidth
                required
                margin="normal"
              />
              <TextField
                label="Experiment Number"
                type="number"
                value={experimentNumber}
                onChange={(e) => setExperimentNumber(e.target.value)}
                fullWidth
                required
                margin="normal"
              />
              <FormControl fullWidth required sx={{ marginTop: '16px' }}>
                <InputLabel id="processing-type-label">Processing Type</InputLabel>
                <Select
                  labelId="processing-type-label"
                  value={processingType}
                  onChange={(e) => setProcessingType(e.target.value)}
                  input={<OutlinedInput label="Processing Type" />}
                  MenuProps={MenuProps}
                >
                  {defaultProcessingTypes.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Farmer Name"
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                fullWidth
                required
                margin="normal"
              />
              <FormControl fullWidth required sx={{ marginTop: '16px' }}>
                <InputLabel id="type-label">Type</InputLabel>
                <Select
                  labelId="type-label"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  input={<OutlinedInput label="Type" />}
                  MenuProps={MenuProps}
                >
                  <MenuItem value="arabica">Arabica</MenuItem>
                  <MenuItem value="robusta">Robusta</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth required sx={{ marginTop: '16px' }}>
                <InputLabel id="variety-label">Variety</InputLabel>
                <Select
                  labelId="variety-label"
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  input={<OutlinedInput label="Variety" />}
                  MenuProps={MenuProps}
                >
                  <MenuItem value="cobra">Cobra</MenuItem>
                  <MenuItem value="yellow caturra">Yellow Caturra</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ marginTop: '16px' }}>
                <InputLabel id="pre-storage-label">Pre-storage</InputLabel>
                <Select
                  labelId="pre-storage-label"
                  value={preStorage}
                  onChange={(e) => setPreStorage(e.target.value)}
                  input={<OutlinedInput label="Pre-storage" />}
                  MenuProps={MenuProps}
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Pre-storage Condition"
                value={preStorageCondition}
                onChange={(e) => setPreStorageCondition(e.target.value)}
                fullWidth
                margin="normal"
              />
              <FormControl fullWidth sx={{ marginTop: '16px' }}>
                <InputLabel id="pre-pulped-label">Pre-pulped</InputLabel>
                <Select
                  labelId="pre-pulped-label"
                  value={prePulped}
                  onChange={(e) => setPrePulped(e.target.value)}
                  input={<OutlinedInput label="Pre-pulped" />}
                  MenuProps={MenuProps}
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ marginTop: '16px' }}>
                <InputLabel id="pre-pulped-delva-label">Pre-pulped Delva</InputLabel>
                <Select
                  labelId="pre-pulped-delva-label"
                  value={prePulpedDelva}
                  onChange={(e) => setPrePulpedDelva(e.target.value)}
                  input={<OutlinedInput label="Pre-pulped Delva" />}
                  MenuProps={MenuProps}
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Bulk Density"
                value={bulkDensity}
                onChange={(e) => setBulkDensity(e.target.value)}
                fullWidth
                margin="normal"
              />
              <FormControl fullWidth sx={{ marginTop: '16px' }}>
                <InputLabel id="gas-label">Gas</InputLabel>
                <Select
                  labelId="gas-label"
                  value={gas}
                  onChange={(e) => setGas(e.target.value)}
                  input={<OutlinedInput label="Gas" />}
                  MenuProps={MenuProps}
                >
                  <MenuItem value="air">Air</MenuItem>
                  <MenuItem value="co2">CO2</MenuItem>
                  <MenuItem value="n2">N2</MenuItem>
                  <MenuItem value="pure o2">Pure O2</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Pressure (psi)"
                type="number"
                value={pressure}
                onChange={(e) => setPressure(e.target.value)}
                fullWidth
                margin="normal"
              />
              <FormControl fullWidth sx={{ marginTop: '16px' }}>
                <InputLabel id="is-submerged-label">Is Submerged</InputLabel>
                <Select
                  labelId="is-submerged-label"
                  value={isSubmerged}
                  onChange={(e) => setIsSubmerged(e.target.value)}
                  input={<OutlinedInput label="Is Submerged" />}
                  MenuProps={MenuProps}
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="pH"
                type="number"
                value={pH}
                onChange={(e) => setPH(e.target.value)}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Fermentation Time Target (hours)"
                type="number"
                value={fermentationTimeTarget}
                onChange={(e) => setFermentationTimeTarget(e.target.value)}
                fullWidth
                margin="normal"
              />

              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Fermentation Section</Typography>
              <FormControl fullWidth sx={{ marginTop: '16px' }}>
                <InputLabel id="fermentation-label">Fermentation</InputLabel>
                <Select
                  labelId="fermentation-label"
                  value={fermentation}
                  onChange={(e) => setFermentation(e.target.value)}
                  input={<OutlinedInput label="Fermentation" />}
                  MenuProps={MenuProps}
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth required sx={{ marginTop: '16px' }}>
                <InputLabel id="fermentation-tank-label">Fermentation Tank</InputLabel>
                <Select
                  labelId="fermentation-tank-label"
                  value={fermentationTank}
                  onChange={(e) => {
                    setTank(e.target.value);
                    if (e.target.value !== 'Blue Barrel') setBlueBarrelCode('');
                  }}
                  input={<OutlinedInput label="Fermentation Tank" />}
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
              {fermentationTank === 'Blue Barrel' && (
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
                      error={!blueBarrelCode && fermentationTank === 'Blue Barrel'}
                      helperText={!blueBarrelCode && fermentationTank === 'Blue Barrel' ? 'Please select a Blue Barrel code' : ''}
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

              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Post-fermentation Section</Typography>
              <FormControl fullWidth sx={{ marginTop: '16px' }}>
                <InputLabel id="second-fermentation-label">Second Fermentation</InputLabel>
                <Select
                  labelId="second-fermentation-label"
                  value={secondFermentation}
                  onChange={(e) => setSecondFermentation(e.target.value)}
                  input={<OutlinedInput label="Second Fermentation" />}
                  MenuProps={MenuProps}
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ marginTop: '16px' }}>
                <InputLabel id="second-fermentation-tank-label">Second Fermentation Tank</InputLabel>
                <Select
                  labelId="second-fermentation-tank-label"
                  value={secondFermentationTank}
                  onChange={(e) => setSecondFermentationTank(e.target.value)}
                  input={<OutlinedInput label="Second Fermentation Tank" />}
                  MenuProps={MenuProps}
                >
                  <MenuItem value="Biomaster">Biomaster</MenuItem>
                  <MenuItem value="Carrybrew">Carrybrew</MenuItem>
                  <MenuItem value="Blue Barrel">Blue Barrel</MenuItem>
                  <MenuItem value="Fermentation Bucket">Fermentation Bucket</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Second Fermentation Time Target (hours)"
                type="number"
                value={secondFermentationTimeTarget}
                onChange={(e) => setSecondFermentationTimeTarget(e.target.value)}
                fullWidth
                margin="normal"
              />
              <FormControl fullWidth sx={{ marginTop: '16px' }}>
                <InputLabel id="second-gas-label">Second Gas</InputLabel>
                <Select
                  labelId="second-gas-label"
                  value={secondGas}
                  onChange={(e) => setSecondGas(e.target.value)}
                  input={<OutlinedInput label="Second Gas" />}
                  MenuProps={MenuProps}
                >
                  <MenuItem value="air">Air</MenuItem>
                  <MenuItem value="co2">CO2</MenuItem>
                  <MenuItem value="n2">N2</MenuItem>
                  <MenuItem value="pure o2">Pure O2</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Second Pressure (psi)"
                type="number"
                value={secondPressure}
                onChange={(e) => setSecondPressure(e.target.value)}
                fullWidth
                margin="normal"
              />
              <FormControl fullWidth sx={{ marginTop: '16px' }}>
                <InputLabel id="second-is-submerged-label">Second Is Submerged</InputLabel>
                <Select
                  labelId="second-is-submerged-label"
                  value={secondIsSubmerged}
                  onChange={(e) => setSecondIsSubmerged(e.target.value)}
                  input={<OutlinedInput label="Second Is Submerged" />}
                  MenuProps={MenuProps}
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Second Bulk Density"
                value={secondBulkDensity}
                onChange={(e) => setSecondBulkDensity(e.target.value)}
                fullWidth
                margin="normal"
              />

              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Drying Section</Typography>
              <FormControl fullWidth sx={{ marginTop: '16px' }}>
                <InputLabel id="drying-area-label">Drying Area</InputLabel>
                <Select
                  labelId="drying-area-label"
                  value={dryingArea}
                  onChange={(e) => setDryingArea(e.target.value)}
                  input={<OutlinedInput label="Drying Area" />}
                  MenuProps={MenuProps}
                >
                  <MenuItem value="greenhouse">Greenhouse</MenuItem>
                  <MenuItem value="outside">Outside</MenuItem>
                  <MenuItem value="drying room">Drying Room</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ marginTop: '16px' }}>
                <InputLabel id="second-drying-label">Second Drying</InputLabel>
                <Select
                  labelId="second-drying-label"
                  value={secondDrying}
                  onChange={(e) => setSecondDrying(e.target.value)}
                  input={<OutlinedInput label="Second Drying" />}
                  MenuProps={MenuProps}
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ marginTop: '16px' }}>
                <InputLabel id="second-drying-area-label">Second Drying Area</InputLabel>
                <Select
                  labelId="second-drying-area-label"
                  value={secondDryingArea}
                  onChange={(e) => setSecondDryingArea(e.target.value)}
                  input={<OutlinedInput label="Second Drying Area" />}
                  MenuProps={MenuProps}
                >
                  <MenuItem value="greenhouse">Greenhouse</MenuItem>
                  <MenuItem value="outside">Outside</MenuItem>
                  <MenuItem value="drying room">Drying Room</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ marginTop: '16px' }}>
                <InputLabel id="rehydration-label">Rehydration</InputLabel>
                <Select
                  labelId="rehydration-label"
                  value={rehydration}
                  onChange={(e) => setRehydration(e.target.value)}
                  input={<OutlinedInput label="Rehydration" />}
                  MenuProps={MenuProps}
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>

              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Post-drying Section</Typography>
              <FormControl fullWidth sx={{ marginTop: '16px' }}>
                <InputLabel id="storage-label">Storage</InputLabel>
                <Select
                  labelId="storage-label"
                  value={storage}
                  onChange={(e) => setStorage(e.target.value)}
                  input={<OutlinedInput label="Storage" />}
                  MenuProps={MenuProps}
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>

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
                  !referenceNumber ||
                  !experimentNumber ||
                  !processingType ||
                  !farmerName ||
                  !type ||
                  !variety ||
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
                  )}
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

      <Dialog open={openDetailsDialog} onClose={() => setOpenDetailsDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Details - Batch {selectedBatch?.batchNumber}</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>Harvest Details</Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={4}>
              <TextField label="Harvest Date" value={detailsData.harvestDate || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Harvest At" value={detailsData.harvestAt ? dayjs(detailsData.harvestAt).format('YYYY-MM-DD HH:mm:ss') : ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Received At" value={detailsData.receivedAt ? dayjs(detailsData.receivedAt).format('YYYY-MM-DD HH:mm:ss') : ''} fullWidth disabled />
            </Grid>
          </Grid>
          <Typography variant="h6" gutterBottom>Weight Details</Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={4}>
              <TextField label="Received Weight (kg)" value={detailsData.receivedWeight || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Reject Weight (kg)" value={detailsData.rejectWeight || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Defect Weight (kg)" value={detailsData.defectWeight || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Damaged Weight (kg)" value={detailsData.damagedWeight || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Lost Weight (kg)" value={detailsData.lostWeight || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Pre-processing Weight (kg)" value={detailsData.preprocessingWeight || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Quality (%)" value={detailsData.quality || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Brix" value={detailsData.brix || ''} fullWidth disabled />
            </Grid>
          </Grid>
          <Typography variant="h6" gutterBottom>Pre-fermentation Details</Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={4}>
              <TextField label="Pre-pulped Weight (kg)" value={detailsData.prePulpedWeight || ''} fullWidth disabled />
            </Grid>
          </Grid>
          <Typography variant="h6" gutterBottom>Fermentation Details</Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={4}>
              <TextField label="Cherry Type" value={detailsData.cherryType || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Starter Type" value={detailsData.starterType || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Total Volume" value={detailsData.totalVolume || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Water Used (L)" value={detailsData.waterUsed || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Starter Used" value={detailsData.starterUsed || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Stirring (Hz)" value={detailsData.stirring || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Fermentation Temperature" value={detailsData.fermentationTemperature || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Fermentation Start" value={detailsData.fermentationStart ? dayjs(detailsData.fermentationStart).format('DD-MM-YYYY HH:mm') : ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Fermentation End" value={detailsData.fermentationEnd ? dayjs(detailsData.fermentationEnd).format('DD-MM-YYYY HH:mm') : ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Fermentation Time Actual" value={detailsData.fermentationTimeActual || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Final pH" value={detailsData.finalPH || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Final TDS" value={detailsData.finalTDS || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Final Temperature" value={detailsData.finalTemperature || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Post Weight (kg)" value={detailsData.postWeight || ''} fullWidth disabled />
            </Grid>
          </Grid>
          <Typography variant="h6" gutterBottom>Post-fermentation Details</Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={4}>
              <TextField label="Post-pulped Weight (kg)" value={detailsData.postPulpedWeight || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Ratio" value={detailsData.ratio || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Second Starter Type" value={detailsData.secondStarterType || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Second Total Volume" value={detailsData.secondTotalVolume || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Second Water Used (L)" value={detailsData.secondWaterUsed || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Second Mossto Used" value={detailsData.secondMosstoUsed || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Second Actual Volume" value={detailsData.secondActualVolume || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Second Temperature" value={detailsData.secondTemperature || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Second Fermentation Start" value={detailsData.secondFermentationStart ? dayjs(detailsData.secondFermentationStart).format('DD-MM-YYYY HH:mm') : ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Second Fermentation End" value={detailsData.secondFermentationEnd ? dayjs(detailsData.secondFermentationEnd).format('DD-MM-YYYY HH:mm') : ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Second Fermentation Time Actual" value={detailsData.secondFermentationTimeActual || ''} fullWidth disabled />
            </Grid>
          </Grid>
          <Typography variant="h6" gutterBottom>Drying Details</Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={4}>
              <TextField label="Average Temperature (°C)" value={detailsData.avgTemperature || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Pre-drying Weight (kg)" value={detailsData.preDryingWeight || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Final Moisture (%)" value={detailsData.finalMoisture || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Post-drying Weight (kg)" value={detailsData.postDryingWeight || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Drying Start" value={detailsData.dryingStart ? dayjs(detailsData.dryingStart).format('DD-MM-YYYY HH:mm') : ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Drying End" value={detailsData.dryingEnd ? dayjs(detailsData.dryingEnd).format('DD-MM-YYYY HH:mm') : ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Total Drying Time" value={detailsData.totalDryingTime || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Second Average Temperature (°C)" value={detailsData.secondAverageTemperature || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Second Final Moisture (%)" value={detailsData.secondFinalMoisture || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Second Post-drying Weight (kg)" value={detailsData.secondPostDryingWeight || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Second Drying Start" value={detailsData.secondDryingStart ? dayjs(detailsData.secondDryingStart).format('DD-MM-YYYY HH:mm') : ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Second Drying End" value={detailsData.secondDryingEnd ? dayjs(detailsData.secondDryingEnd).format('DD-MM-YYYY HH:mm') : ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Second Total Drying Time" value={detailsData.secondTotalDryingTime || ''} fullWidth disabled />
            </Grid>
          </Grid>
          <Typography variant="h6" gutterBottom>Post-drying Details</Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={4}>
              <TextField label="Storage Temperature (°C)" value={detailsData.storageTemperature || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Hulling Time" value={detailsData.hullingTime ? dayjs(detailsData.hullingTime).format('DD-MM-YYYY HH:mm') : ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Bag Type" value={detailsData.bagType || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Post-hulling Weight (kg)" value={detailsData.postHullingWeight || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Cherry Dry Ratio" value={detailsData.cherryDryRatio || ''} fullWidth disabled />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Sorted Cherry Dry Ratio" value={detailsData.sortedCherryDryRatio || ''} fullWidth disabled />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailsDialog(false)}>Close</Button>
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