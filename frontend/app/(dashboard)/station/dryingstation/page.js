"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSession } from "next-auth/react";
import {
  Button, Typography, Snackbar, Alert, Grid, Card, CardContent, CircularProgress, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, InputLabel,
  Table, TableBody, TableCell, TableHead, TableRow, Checkbox
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

// Simple debounce utility
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card variant="outlined" sx={{ p: 2, m: 2 }}>
          <Typography color="error">Something went wrong: {this.state.error?.message || 'Unknown error'}</Typography>
          <Button onClick={() => this.setState({ hasError: false, error: null })}>Retry</Button>
        </Card>
      );
    }
    return this.props.children;
  }
}

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
  const [noDataAreas, setNoDataAreas] = useState(new Set()); // Track areas with no data
  const [isLoading, setIsLoading] = useState(false);
  const [areaLoading, setAreaLoading] = useState({});
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
  const [editingWeightId, setEditingWeightId] = useState(null);
  const [selectedWeightIds, setSelectedWeightIds] = useState([]);
  const [openDeleteConfirmDialog, setOpenDeleteConfirmDialog] = useState(false);
  const [deletedWeights, setDeletedWeights] = useState([]);
  const isFetchingRef = useRef(false); // Prevent concurrent fetches

  const dryingAreas = useMemo(() => [
    "Drying Area 1", "Drying Area 2", "Drying Area 3", "Drying Area 4", 
    "Drying Area 5", "Drying Sun Dry", "Drying Room"
  ], []);

  const deviceMapping = useMemo(() => ({
    "Drying Area 1": "GH_SENSOR_1",
    "Drying Area 2": "GH_SENSOR_2",
    "Drying Area 3": "GH_SENSOR_3",
    "Drying Area 4": "GH_SENSOR_4",
    "Drying Area 5": "GH_SENSOR_5",
    "Drying Room": "GH_SENSOR_6"
  }), []);

  const fetchAreaData = useCallback(async (area, forceRefresh = false) => {
    if (!forceRefresh && (dryingData[area]?.length > 0 || noDataAreas.has(area))) return; // Skip if data exists or area is empty
    setAreaLoading(prev => ({ ...prev, [area]: true }));

    try {
      // Fetch drying data first to check if area has batches
      const dryingResponse = await fetch('https://processing-facility-backend.onrender.com/api/drying-data');
      if (!dryingResponse.ok) throw new Error('Failed to fetch drying data');
      const dryingDataRaw = await dryingResponse.json();

      // Get batch numbers for this area
      const areaBatchNumbers = dryingDataRaw
        .filter(data => data.dryingArea === area && data.batchNumber)
        .map(data => data.batchNumber);

      // If no batches, mark as no-data and skip further fetches
      if (areaBatchNumbers.length === 0) {
        setNoDataAreas(prev => new Set(prev).add(area));
        setDryingData(prev => ({ ...prev, [area]: [] }));
        return;
      }

      // Fetch remaining data only if there are batches
      const [qcResponse, greenhouseResponse] = await Promise.all([
        fetch('https://processing-facility-backend.onrender.com/api/qc'),
        fetch('https://processing-facility-backend.onrender.com/api/greenhouse-latest')
      ]);

      if (!qcResponse.ok || !greenhouseResponse.ok) {
        throw new Error('Failed to fetch data from one or more endpoints');
      }

      const [qcResult, greenhouseResult] = await Promise.all([
        qcResponse.json(),
        greenhouseResponse.json()
      ]);

      // Filter valid qc data
      const pendingPreprocessingData = (qcResult.distinctRows || []).filter(batch => 
        batch && batch.batchNumber && typeof batch.batchNumber === 'string'
      );

      // Fetch weights only for relevant batches
      let weightsResult = [];
      if (areaBatchNumbers.length > 0) {
        const weightsResponse = await fetch(
          `https://processing-facility-backend.onrender.com/api/drying-weight-measurements/aggregated?batchNumbers=${areaBatchNumbers.join(',')}`
        );
        if (!weightsResponse.ok) throw new Error('Failed to fetch aggregated weights');
        weightsResult = await weightsResponse.json();
      }

      // Create batch weights lookup
      const batchWeights = {};
      weightsResult.forEach(({ batchNumber, total_weight, measurement_date }) => {
        if (batchNumber) {
          batchWeights[batchNumber] = { total: total_weight, date: measurement_date };
        } else {
          console.warn('Skipping weight record with undefined batchNumber:', { total_weight, measurement_date });
        }
      });

      // Format data for this area
      const areaData = pendingPreprocessingData
        .filter(batch => areaBatchNumbers.includes(batch.batchNumber))
        .map(batch => {
          const batchDryingData = dryingDataRaw.filter(data => 
            data.batchNumber === batch.batchNumber && data.dryingArea === area
          );
          const latestEntry = batchDryingData.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
          )[0];

          return {
            ...batch,
            status: latestEntry ? (latestEntry.exited_at ? 'Dried' : 'In Drying') : 'Not in Drying',
            dryingArea: latestEntry?.dryingArea || 'N/A',
            startDryingDate: latestEntry?.entered_at ? new Date(latestEntry.entered_at).toISOString().slice(0, 10) : 'N/A',
            endDryingDate: latestEntry?.exited_at ? new Date(latestEntry.exited_at).toISOString().slice(0, 10) : 'N/A',
            weight: batchWeights[batch.batchNumber] ? batchWeights[batch.batchNumber].total.toFixed(2) : 'N/A',
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

      setDryingData(prev => ({ ...prev, [area]: areaData }));
      setNoDataAreas(prev => {
        const newSet = new Set(prev);
        newSet.delete(area); // Remove from no-data if data was found
        return newSet;
      });
      setGreenhouseData(prev => ({
        ...prev,
        ...greenhouseResult.reduce((data, { device_id, temperature, humidity }) => ({
          ...data,
          [device_id]: { temperature: temperature || 0, humidity: humidity || 0 }
        }), {})
      }));
    } catch (error) {
      console.error(`Error fetching data for ${area}:`, error);
      setSnackbarMessage(error.message || `Error fetching data for ${area}`);
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setAreaLoading(prev => ({ ...prev, [area]: false }));
    }
  }, [dryingData, noDataAreas]);

  const fetchDryingMeasurements = useCallback(async (batchNumber) => {
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
  }, []);

  const fetchWeightMeasurements = useCallback(async (batchNumber) => {
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
  }, []);

  const fetchMaxBagNumber = useCallback(async (batchNumber, processingType) => {
    try {
      const response = await fetch(`https://processing-facility-backend.onrender.com/api/drying-weight-measurements/${batchNumber}/${processingType}/max-bag-number`);
      if (!response.ok) throw new Error('Failed to fetch max bag number');
      const { maxBagNumber } = await response.json();
      setNewBagNumber(maxBagNumber + 1);
    } catch (error) {
      setSnackbarMessage(error.message || 'Failed to fetch max bag number, starting at 1');
      setSnackbarSeverity('warning');
      setNewBagNumber(1);
    }
  }, []);

  const fetchHistoricalEnvData = useCallback(async (device_id) => {
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
  }, []);

  const handleAddOrUpdateBagWeight = useCallback(async () => {
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
      if (editingWeightId) {
        const payload = {
          weight: parseFloat(newBagWeight),
          measurement_date: newWeightDate
        };
        const response = await fetch(`https://processing-facility-backend.onrender.com/api/drying-weight-measurement/${editingWeightId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Failed to update weight measurement');
        const result = await response.json();
        setWeightMeasurements(weightMeasurements.map(m => m.id === editingWeightId ? result.measurement : m));
        setSnackbarMessage(`Bag ${newBagNumber} weight updated successfully`);
        setSnackbarSeverity('success');
        setEditingWeightId(null);
      } else {
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
        setNewBagNumber(newBagNumber + 1);
        setSnackbarMessage(`Bag ${newBagNumber} weight added successfully`);
        setSnackbarSeverity('success');
      }
      setNewBagWeight('');
      setNewWeightDate(new Date().toISOString().slice(0, 10));
      await fetchAreaData(selectedBatch.dryingArea, true); // Force refresh affected area
    } catch (error) {
      setSnackbarMessage(error.message || 'Failed to save weight measurement');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  }, [
    newBagWeight, newProcessingType, newWeightDate, editingWeightId, newBagNumber,
    selectedBatch, weightMeasurements, fetchAreaData
  ]);

  const handleEditBagWeight = useCallback((measurement) => {
    setEditingWeightId(measurement.id);
    setNewProcessingType(measurement.processingType);
    setNewBagNumber(measurement.bagNumber);
    setNewBagWeight(measurement.weight.toString());
    setNewWeightDate(new Date(measurement.measurement_date).toISOString().slice(0, 10));
  }, []);

  const handleDeleteBagWeights = useCallback(async () => {
    try {
      const weightsToDelete = weightMeasurements.filter(m => selectedWeightIds.includes(m.id));
      const response = await fetch('https://processing-facility-backend.onrender.com/api/drying-weight-measurements/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedWeightIds })
      });
      if (!response.ok) throw new Error('Failed to delete weight measurements');
      const result = await response.json();
      setWeightMeasurements(weightMeasurements.filter(m => !selectedWeightIds.includes(m.id)));
      setDeletedWeights(weightsToDelete);
      setSelectedWeightIds([]);
      setOpenDeleteConfirmDialog(false);
      setSnackbarMessage(result.message);
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      await fetchAreaData(selectedBatch.dryingArea, true); // Force refresh affected area
    } catch (error) {
      setSnackbarMessage(error.message || 'Failed to delete weight measurements');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  }, [weightMeasurements, selectedWeightIds, selectedBatch, fetchAreaData]);

  const handleUndoDelete = useCallback(async () => {
    try {
      const restoredWeights = [];
      for (const weight of deletedWeights) {
        const payload = {
          batchNumber: weight.batchNumber,
          processingType: weight.processingType,
          bagNumber: weight.bagNumber,
          weight: weight.weight,
          measurement_date: weight.measurement_date
        };
        const response = await fetch('https://processing-facility-backend.onrender.com/api/drying-weight-measurement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Failed to restore weight measurement');
        const result = await response.json();
        restoredWeights.push(result.measurement);
      }
      setWeightMeasurements([...weightMeasurements, ...restoredWeights]);
      setDeletedWeights([]);
      setSnackbarMessage('Weight measurements restored successfully');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      await fetchAreaData(selectedBatch.dryingArea, true); // Force refresh affected area
    } catch (error) {
      setSnackbarMessage(error.message || 'Failed to restore weight measurements');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  }, [deletedWeights, weightMeasurements, selectedBatch, fetchAreaData]);

  const handleAddMoisture = useCallback(async () => {
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
  }, [newMoisture, newMeasurementDate, selectedBatch, dryingMeasurements]);

  const handleMoveBatch = useCallback(async () => {
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
      await fetchAreaData(newDryingArea, true); // Force refresh destination area
    } catch (error) {
      setSnackbarMessage(error.message || 'Failed to move batch');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  }, [newDryingArea, selectedBatch, fetchAreaData]);

  const handleRefreshData = useMemo(() => debounce(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoading(true);
    setAreaLoading(dryingAreas.reduce((acc, area) => ({ ...acc, [area]: true }), {}));

    try {
      await Promise.all(dryingAreas.map(area => fetchAreaData(area, true))); // Force refresh all areas
    } catch (error) {
      console.error('Error refreshing data:', error);
      setSnackbarMessage(error.message || 'Error refreshing data');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
      setAreaLoading(dryingAreas.reduce((acc, area) => ({ ...acc, [area]: false }), {}));
    }
  }, 2000), [dryingAreas, fetchAreaData]);

  useEffect(() => {
    // Fetch data for all areas on mount
    if (!isFetchingRef.current) {
      isFetchingRef.current = true;
      setIsLoading(true);
      Promise.all(dryingAreas.map(area => fetchAreaData(area)))
        .catch(error => {
          console.error('Initial data fetch error:', error);
          setSnackbarMessage('Failed to load initial data');
          setSnackbarSeverity('error');
          setOpenSnackbar(true);
        })
        .finally(() => {
          isFetchingRef.current = false;
          setIsLoading(false);
        });
    }
  }, [dryingAreas, fetchAreaData]);

  const handleDetailsClick = useCallback((batch) => {
    setSelectedBatch(batch);
    fetchDryingMeasurements(batch.batchNumber);
    setOpenDialog(true);
  }, [fetchDryingMeasurements]);

  const handleMoveClick = useCallback((batch) => {
    setSelectedBatch(batch);
    setOpenMoveDialog(true);
  }, []);

  const handleWeightClick = useCallback((batch) => {
    setSelectedBatch(batch);
    fetchWeightMeasurements(batch.batchNumber);
    setNewBagWeight('');
    setNewProcessingType('');
    setNewWeightDate(new Date().toISOString().slice(0, 10));
    setNewBagNumber(1);
    setEditingWeightId(null);
    setSelectedWeightIds([]);
    setDeletedWeights([]);
    setOpenWeightDialog(true);
  }, [fetchWeightMeasurements]);

  const handleProcessingTypeChange = useCallback(async (value) => {
    setNewProcessingType(value);
    if (value && selectedBatch && !editingWeightId) {
      await fetchMaxBagNumber(selectedBatch.batchNumber, value);
    }
  }, [selectedBatch, editingWeightId, fetchMaxBagNumber]);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setSelectedBatch(null);
    setDryingMeasurements([]);
    setNewMoisture('');
    setNewMeasurementDate('');
  }, []);

  const handleCloseMoveDialog = useCallback(() => {
    setOpenMoveDialog(false);
    setNewDryingArea('');
    setSelectedBatch(null);
  }, []);

  const handleCloseWeightDialog = useCallback(() => {
    setOpenWeightDialog(false);
    setSelectedBatch(null);
    setWeightMeasurements([]);
    setNewBagWeight('');
    setNewBagNumber(1);
    setNewProcessingType('');
    setNewWeightDate('');
    setEditingWeightId(null);
    setSelectedWeightIds([]);
    setDeletedWeights([]);
  }, []);

  const handleCloseEnvDialog = useCallback(() => {
    setOpenEnvDialog(false);
    setSelectedDevice(null);
    setHistoricalEnvData([]);
  }, []);

  const handleSelectWeight = useCallback((id) => {
    setSelectedWeightIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAllWeights = useCallback((event) => {
    if (event.target.checked) {
      setSelectedWeightIds(weightMeasurements.map(m => m.id));
    } else {
      setSelectedWeightIds([]);
    }
  }, [weightMeasurements]);

  const handleOpenDeleteConfirmDialog = useCallback(() => {
    if (selectedWeightIds.length === 0) {
      setSnackbarMessage('Please select at least one weight to delete');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }
    setOpenDeleteConfirmDialog(true);
  }, [selectedWeightIds]);

  const handleCloseDeleteConfirmDialog = useCallback(() => {
    setOpenDeleteConfirmDialog(false);
  }, []);

  const columns = useMemo(() => [
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
          color="secondary"
          size="small"
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
          color="info"
          size="small"
          onClick={() => handleWeightClick(row)}
        >
          Track Weight
        </Button>
      )
    },
    { field: 'startDryingDate', headerName: 'Start Drying Date', width: 150 },
    { field: 'endDryingDate', headerName: 'End Drying Date', width: 150 },
    { field: 'weight', headerName: 'Dry Weight (kg)', width: 140 },
    { field: 'type', headerName: 'Type', width: 90 },
    { field: 'producer', headerName: 'Producer', width: 90 },
    { field: 'productLine', headerName: 'Product Line', width: 150 },
    { field: 'processingType', headerName: 'Processing Type', width: 200 },
    { field: 'quality', headerName: 'Quality', width: 160 }
  ], [handleDetailsClick, handleMoveClick, handleWeightClick]);

  const renderDataGrid = useCallback((area) => {
    const areaData = dryingData[area] || [];
    const deviceId = deviceMapping[area];
    const envData = greenhouseData[deviceId] || { temperature: 0, humidity: 0 };

    if (areaLoading[area]) {
      return (
        <Typography variant="body1" align="center" color="textSecondary">
          Loading...
        </Typography>
      );
    }

    return (
      <>
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
        <div style={{ height: '400px', width: '100%', overflow: 'auto' }}>
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
              pagination
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } }
              }}
            />
          )}
        </div>
      </>
    );
  }, [dryingData, areaLoading, greenhouseData, deviceMapping, columns]);

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

  const moistureChartData = useMemo(() => ({
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
  }), [optimalCurve, dryingMeasurements]);

  const moistureChartOptions = useMemo(() => ({
    scales: {
      x: { title: { display: true, text: 'Date' }, type: 'category' },
      y: { title: { display: true, text: 'Moisture (%)' }, min: 0, max: 60 }
    },
    plugins: { legend: { display: true }, tooltip: { mode: 'index', intersect: false } }
  }), []);

  const envChartData = useMemo(() => ({
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
  }), [historicalEnvData]);

  const envChartOptions = useMemo(() => ({
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
  }), []);

  const getTotalWeights = useCallback(() => {
    const totals = {};
    weightMeasurements.forEach(m => {
      const date = new Date(m.measurement_date).toISOString().slice(0, 10);
      if (!totals[date]) totals[date] = {};
      if (!totals[date][m.processingType]) totals[date][m.processingType] = 0;
      totals[date][m.processingType] += m.weight;
    });
    return totals;
  }, [weightMeasurements]);

  const processingTypes = useMemo(() => 
    selectedBatch?.processingType && selectedBatch.processingType !== 'N/A' 
      ? selectedBatch.processingType.split(',').map(type => type.trim()) 
      : ['Washed', 'Natural'],
    [selectedBatch]
  );

  const totalWeights = getTotalWeights();

  const handleEnvDetailsClick = useCallback((device_id) => {
    setSelectedDevice(device_id);
    fetchHistoricalEnvData(device_id);
    setOpenEnvDialog(true);
  }, [fetchHistoricalEnvData]);

  if (status === 'loading') return <p>Loading...</p>;
  if (!session?.user || !['admin', 'manager', 'drying'].includes(session.user.role)) {
    return <Typography variant="h6">Access Denied</Typography>;
  }

  return (
    <ErrorBoundary>
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
                {dryingAreas.map(area => (
                  <Grid item xs={12} key={area}>
                    {renderDataGrid(area)}
                  </Grid>
                ))}
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
            <Typography variant="h6" gutterBottom>{editingWeightId ? 'Edit Bag Weight' : 'Add Bag Weight'}</Typography>
            <Grid container spacing={2} sx={{ mb: 2, mt: 1 }}>
              <Grid item xs={3}>
                <FormControl fullWidth>
                  <InputLabel id="processing-type-label">Processing Type</InputLabel>
                  <Select
                    labelId="processing-type-label"
                    value={newProcessingType}
                    onChange={e => handleProcessingTypeChange(e.target.value)}
                    label="Processing Type"
                    disabled={editingWeightId !== null}
                  >
                    {processingTypes.map(type => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="body1" sx={{ mt: 2 }}>
                  Bag Number: {newBagNumber}
                </Typography>
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
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAddOrUpdateBagWeight}
                  fullWidth
                  sx={{ height: '100%' }}
                >
                  {editingWeightId ? 'Update' : 'Add'} Bag
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
            <Button
              variant="contained"
              color="error"
              onClick={handleOpenDeleteConfirmDialog}
              disabled={selectedWeightIds.length === 0}
              sx={{ mb: 2 }}
            >
              Delete Selected
            </Button>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedWeightIds.length === weightMeasurements.length && weightMeasurements.length > 0}
                      onChange={handleSelectAllWeights}
                    />
                  </TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Processing Type</TableCell>
                  <TableCell>Bag Number</TableCell>
                  <TableCell>Weight (kg)</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {weightMeasurements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">No weight measurements recorded</TableCell>
                  </TableRow>
                ) : (
                  weightMeasurements.map(m => (
                    <TableRow key={m.id}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedWeightIds.includes(m.id)}
                          onChange={() => handleSelectWeight(m.id)}
                        />
                      </TableCell>
                      <TableCell>{new Date(m.measurement_date).toLocaleDateString()}</TableCell>
                      <TableCell>{m.processingType}</TableCell>
                      <TableCell>{m.bagNumber}</TableCell>
                      <TableCell>{m.weight.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleEditBagWeight(m)}
                          sx={{ mr: 1 }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          onClick={() => {
                            setSelectedWeightIds([m.id]);
                            setOpenDeleteConfirmDialog(true);
                          }}
                        >
                          Delete
                        </Button>
                      </TableCell>
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

        <Dialog open={openDeleteConfirmDialog} onClose={handleCloseDeleteConfirmDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete {selectedWeightIds.length} weight measurement{selectedWeightIds.length > 1 ? 's' : ''}?
            </Typography>
            {selectedWeightIds.length > 0 && (
              <Typography variant="body2" sx={{ mt: 2 }}>
                Affected bags: {weightMeasurements
                  .filter(m => selectedWeightIds.includes(m.id))
                  .map(m => `Bag ${m.bagNumber} (${m.processingType}, ${m.weight.toFixed(2)} kg)`)
                  .join(', ')}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteConfirmDialog}>Cancel</Button>
            <Button variant="contained" color="error" onClick={handleDeleteBagWeights}>
              Delete
            </Button>
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
          autoHideDuration={30000}
          onClose={() => {
            setOpenSnackbar(false);
            setDeletedWeights([]);
          }}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity={snackbarSeverity}
            sx={{ width: '100%' }}
            action={deletedWeights.length > 0 ? (
              <Button color="inherit" size="small" onClick={handleUndoDelete}>
                Undo
              </Button>
            ) : null}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Grid>
    </ErrorBoundary>
  );
};

export default DryingStation;