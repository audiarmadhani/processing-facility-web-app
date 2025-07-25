"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSession } from "next-auth/react";
import {
  Button, Typography, Snackbar, Alert, Grid, Card, CardContent, CircularProgress, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, InputLabel,
  Table, TableBody, TableCell, TableHead, TableRow, Checkbox, Box
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
  const [noDataAreas, setNoDataAreas] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [areaLoading, setAreaLoading] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [dryingMeasurements, setDryingMeasurements] = useState([]);
  const [newMoisture, setNewMoisture] = useState('');
  const [newMeasurementDate, setNewMeasurementDate] = useState('');
  const [greenhouseData, setGreenhouseData] = useState({});
  const [areaTotalWeights, setAreaTotalWeights] = useState({});
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
  const [newWeightDate, setNewWeightDate] = useState(new Date().toISOString().slice(0, 10));
  const [newProducer, setNewProducer] = useState('');
  const [editingWeightId, setEditingWeightId] = useState(null);
  const [selectedWeightIds, setSelectedWeightIds] = useState([]);
  const [openDeleteConfirmDialog, setOpenDeleteConfirmDialog] = useState(false);
  const [deletedWeights, setDeletedWeights] = useState([]);
  const isFetchingRef = useRef(false);

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

  const formatDateForDisplay = (dateString) => {
    if (!dateString || typeof dateString !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return 'N/A';
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date detected:', dateString);
      return 'N/A';
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatDateForGrid = (dateString) => {
    if (!dateString || typeof dateString !== 'string') {
      return 'N/A';
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date detected:', dateString);
      return 'N/A';
    }
    date.setHours(date.getHours() + 8); // Convert to WITA
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const fetchAreaData = useCallback(async (area, forceRefresh = false) => {
    if (!forceRefresh && (dryingData[area]?.length > 0 || noDataAreas.has(area))) return;
    setAreaLoading(prev => ({ ...prev, [area]: true }));
  
    try {
      const dryingResponse = await fetch('https://processing-facility-backend.onrender.com/api/drying-data');
      if (!dryingResponse.ok) throw new Error('Failed to fetch drying data');
      const dryingDataRaw = await dryingResponse.json();
  
      const areaBatchNumbers = dryingDataRaw
        .filter(data => data.dryingArea === area && data.batchNumber)
        .map(data => data.batchNumber);
  
      if (areaBatchNumbers.length === 0) {
        setNoDataAreas(prev => new Set(prev).add(area));
        setDryingData(prev => ({ ...prev, [area]: [] }));
        setAreaTotalWeights(prev => ({ ...prev, [area]: 0 }));
        return;
      }
  
      const [qcResponse, greenhouseResponse, ghweightResponse, wetmillWeightResponse] = await Promise.all([
        fetch('https://processing-facility-backend.onrender.com/api/qc'),
        fetch('https://processing-facility-backend.onrender.com/api/greenhouse-latest'),
        fetch('https://processing-facility-backend.onrender.com/api/greenhouse-weight'),
        fetch('https://processing-facility-backend.onrender.com/api/wetmill-weights')
      ]);
  
      if (!qcResponse.ok || !greenhouseResponse.ok || !ghweightResponse.ok || !wetmillWeightResponse.ok) {
        throw new Error('Failed to fetch data from one or more endpoints');
      }
  
      const [qcResult, greenhouseResult, ghweightResult, wetmillWeightResult] = await Promise.all([
        qcResponse.json(),
        greenhouseResponse.json(),
        ghweightResponse.json(),
        wetmillWeightResponse.json()
      ]);
  
      const pendingPreprocessingData = (qcResult.distinctRows || []).filter(batch => 
        batch && batch.batchNumber && typeof batch.batchNumber === 'string'
      );
  
      let weightsResult = [];
      if (areaBatchNumbers.length > 0) {
        const weightsResponse = await fetch(
          `https://processing-facility-backend.onrender.com/api/drying-weight-measurements/aggregated?batchNumbers=${areaBatchNumbers.join(',')}`
        );
        if (!weightsResponse.ok) throw new Error('Failed to fetch aggregated weights');
        weightsResult = await weightsResponse.json();
      }
  
      const batchWeights = {};
      weightsResult.forEach(({ batchNumber, total_weight, measurement_date }) => {
        if (batchNumber) {
          batchWeights[batchNumber] = { 
            total: parseFloat(total_weight) || 0, 
            date: measurement_date 
          };
        } else {
          console.warn('Skipping weight record with undefined batchNumber:', { total_weight, measurement_date });
        }
      });

      const wetmillWeights = {};
      wetmillWeightResult.forEach(({ batchNumber, wetmill_weight }) => {
        if (batchNumber) {
          wetmillWeights[batchNumber] = parseFloat(wetmill_weight) || 0;
        }
      });
  
      const areaData = pendingPreprocessingData
        .filter(batch => areaBatchNumbers.includes(batch.batchNumber))
        .map(batch => {
          const batchDryingData = dryingDataRaw.filter(data => 
            data.batchNumber === batch.batchNumber && data.dryingArea === area);
          const latestEntry = batchDryingData[0];
  
          return {
            ...batch,
            status: latestEntry ? (latestEntry.exited_at ? 'Dried' : 'In Drying') : 'Not in Drying',
            dryingArea: latestEntry?.dryingArea || 'N/A',
            startDryingDate: latestEntry?.entered_at ? new Date(latestEntry.entered_at).toISOString().slice(0, 10) : 'N/A',
            endDryingDate: latestEntry?.exited_at ? new Date(latestEntry.exited_at).toISOString().slice(0, 10) : 'N/A',
            weight: batchWeights[batch.batchNumber] ? parseFloat(batchWeights[batch.batchNumber].total).toFixed(2) : '0',
            wetmillWeight: wetmillWeights[batch.batchNumber] ? parseFloat(wetmillWeights[batch.batchNumber]).toFixed(2) : '0',
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
        // .sort((a, b) => {
        //   const statusOrder = { 'In Drying': 0, 'Dried': 1 };
        //   const statusA = statusOrder[a.status] || 3;
        //   const statusB = statusOrder[b.status] || 3;
        //   if (statusA !== statusB) return statusA - statusB;
        //   const dateA = a.startDryingDate === 'N/A' ? '' : a.startDryingDate;
        //   const dateB = b.startDryingDate === 'N/A' ? '' : b.startDryingDate;
        //   if (dateA !== dateB) return dateA.localeCompare(dateB);
        //   const typeOrder = { 'Arabica': 0, 'Robusta': 1 };
        //   const typeA = typeOrder[a.type] ?? 2;
        //   const typeB = typeOrder[b.type] ?? 2;
        //   return typeA - typeB;
        // });
  
      const totalWeight = ghweightResult.find(item => item.dryingArea === area)?.total_weight || 0;
  
      setDryingData(prev => ({ ...prev, [area]: areaData }));
      setAreaTotalWeights(prev => ({ ...prev, [area]: parseFloat(totalWeight).toFixed(2) }));
      setNoDataAreas(prev => {
        const newSet = new Set(prev);
        newSet.delete(area);
        return newSet;
      });
      setGreenhouseData(prev => ({
        ...prev,
        ...greenhouseResult.reduce((data, { device_id, temperature, humidity }) => ({
          ...data,
          [device_id]: { temperature: parseFloat(temperature) || 0, humidity: parseFloat(humidity) || 0 }
        }), {})
      }));
    } catch (error) {
      console.error(`Error fetching data for ${area}:`, error);
      setSnackbarMessage(error.message || `Error fetching data for ${area}`);
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      setAreaTotalWeights(prev => ({ ...prev, [area]: 'N/A' }));
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
      console.log('Fetched weight measurements:', data);
      const parsedData = data.map(m => ({
        ...m,
        weight: parseFloat(m.weight) || 0,
        measurement_date: m.measurement_date || 'N/A',
        lotNumbers: m.lotNumbers && Array.isArray(m.lotNumbers) ? m.lotNumbers[0] || 'N/A' : 'N/A',
        referenceNumbers: m.referenceNumbers && Array.isArray(m.referenceNumbers) ? m.referenceNumbers[0] || 'N/A' : 'N/A',
        lotMapping: m.lotMapping && Array.isArray(m.lotMapping) ? m.lotMapping.reduce((acc, item) => ({
          ...acc,
          [item.processingType]: { lotNumber: item.lotNumber || 'N/A', referenceNumber: item.referenceNumber || 'N/A' }
        }), {}) : {}
      }));
      setWeightMeasurements(parsedData);
      // Set newProducer based on the latest measurement
      if (parsedData.length > 0) {
        const latestMeasurement = parsedData.reduce((latest, current) =>
          new Date(latest.measurement_date) > new Date(current.measurement_date) ? latest : current
        );
        setNewProducer(latestMeasurement.producer || '');
      } else {
        setNewProducer('');
      }
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
      if (!Array.isArray(data)) {
        console.error('Expected array for historical env data, got:', data);
        throw new Error('Invalid data format');
      }
      const parsedData = data
        .filter(d => 
          d.recorded_at && !isNaN(new Date(d.recorded_at).getTime()) &&
          typeof d.temperature !== 'undefined' && typeof d.humidity !== 'undefined'
        )
        .map(d => ({
          ...d,
          temperature: d.temperature || '',
          humidity: d.humidity || '',
        }));
      setHistoricalEnvData(parsedData);
    } catch (error) {
      console.error('Error fetching historical env data:', error);
      setSnackbarMessage(error.message || 'Failed to fetch historical environmental data');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      setHistoricalEnvData([]);
    }
  }, []);

  const handleAddOrUpdateBagWeight = useCallback(async () => {
    if (!newBagWeight || isNaN(newBagWeight) || parseFloat(newBagWeight) <= 0) {
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
    if (!newProducer) {
      setSnackbarMessage('Select a producer');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    const selectedDate = new Date(newWeightDate);
    const startDryingDate = selectedBatch?.startDryingDate !== 'N/A' ? new Date(selectedBatch.startDryingDate) : null;
    const now = new Date();

    if (isNaN(selectedDate.getTime())) {
      setSnackbarMessage('Invalid measurement date');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

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
          measurement_date: newWeightDate,
        };
        const response = await fetch(`https://processing-facility-backend.onrender.com/api/drying-weight-measurement/${editingWeightId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to update weight measurement');
        const result = await response.json();
        console.log('Updated weight measurement:', result);
        setWeightMeasurements(weightMeasurements.map(m =>
          m.id === editingWeightId
            ? {
                ...result.measurement,
                weight: parseFloat(result.measurement.weight) || 0,
                measurement_date: result.measurement.measurement_date || 'N/A'
              }
            : m
        ));
        setSnackbarMessage('Weight measurement updated successfully');
        setSnackbarSeverity('success');
        setEditingWeightId(null);
      } else {
        const payload = {
          batchNumber: selectedBatch.batchNumber,
          processingType: newProcessingType,
          bagNumber: newBagNumber,
          weight: parseFloat(newBagWeight),
          measurement_date: newWeightDate,
          producer: newProducer,
        };
        const response = await fetch('https://processing-facility-backend.onrender.com/api/drying-weight-measurement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to save weight measurement');
        const result = await response.json();
        console.log('Added weight measurement:', result);
        const newMeasurement = {
          ...result.measurement,
          weight: parseFloat(result.measurement.weight) || 0,
          measurement_date: result.measurement.measurement_date || 'N/A'
        };
        setWeightMeasurements([...weightMeasurements, newMeasurement]);
        setNewBagNumber(newBagNumber + 1);
        setNewProducer('');
        setSnackbarMessage('Weight measurement added successfully');
        setSnackbarSeverity('success');
      }
      setNewBagWeight('');
      setNewWeightDate(new Date().toISOString().slice(0, 10));
      await fetchAreaData(selectedBatch.dryingArea, true);
    } catch (error) {
      console.error('Error saving weight measurement:', error);
      setSnackbarMessage(error.message || 'Failed to save weight measurement');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  }, [
    newBagWeight,
    newProcessingType,
    newWeightDate,
    newProducer,
    editingWeightId,
    newBagNumber,
    selectedBatch,
    weightMeasurements,
    fetchAreaData,
  ]);

  const handleEditBagWeight = useCallback((measurement) => {
    setEditingWeightId(measurement.id);
    setNewProcessingType(measurement.processingType);
    setNewBagNumber(measurement.bagNumber);
    setNewBagWeight(parseFloat(measurement.weight).toString());
    const date = measurement.measurement_date !== 'N/A' && !isNaN(new Date(measurement.measurement_date).getTime())
      ? measurement.measurement_date
      : new Date().toISOString().slice(0, 10);
    setNewWeightDate(date);
    setNewProducer(measurement.producer);
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
      await fetchAreaData(selectedBatch.dryingArea, true);
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
          measurement_date: weight.measurement_date,
          producer: weight.producer,
        };
        const response = await fetch('https://processing-facility-backend.onrender.com/api/drying-weight-measurement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Failed to restore weight measurement');
        const result = await response.json();
        restoredWeights.push({
          ...result.measurement,
          measurement_date: result.measurement.measurement_date || 'N/A'
        });
      }
      setWeightMeasurements([...weightMeasurements, ...restoredWeights]);
      setDeletedWeights([]);
      setSnackbarMessage('Weight measurements restored successfully');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      await fetchAreaData(selectedBatch.dryingArea, true);
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

    if (isNaN(selectedDate.getTime())) {
      setSnackbarMessage('Invalid measurement date');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

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
        measurement_date: measurementDate
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
      await Promise.all([fetchAreaData(selectedBatch.dryingArea, true), fetchAreaData(newDryingArea, true)]);
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
      await Promise.all(dryingAreas.map(area => fetchAreaData(area, true)));
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
    // Initialize newProducer from the latest weight measurement if available
    const latestWeight = weightMeasurements.length > 0 ? weightMeasurements.reduce((latest, current) =>
      new Date(latest.measurement_date) > new Date(current.measurement_date) ? latest : current
    ) : null;
    setNewProducer(latestWeight?.producer || '');
    setEditingWeightId(null);
    setSelectedWeightIds([]);
    setDeletedWeights([]);
    setOpenWeightDialog(true);
  }, [fetchWeightMeasurements, weightMeasurements]);

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
    setNewProducer('');
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
    { field: 'wetmillWeight', headerName: 'Wetmill Weight (kg)', width: 160 },
    { field: 'weight', headerName: 'Dry Weight (kg)', width: 140 },
    { field: 'type', headerName: 'Type', width: 90 },
    { field: 'producer', headerName: 'Producer', width: 90 },
    { field: 'productLine', headerName: 'Product Line', width: 150 },
    { field: 'processingType', headerName: 'Processing Type', width: 200 },
    { field: 'quality', headerName: 'Quality', width: 160 }
  ], [handleDetailsClick, handleMoveClick, handleWeightClick]);

  const envColumns = useMemo(() => [
    { 
      field: 'recorded_at', 
      headerName: 'Date (WITA)', 
      width: 180,
    },
    { 
      field: 'temperature', 
      headerName: 'Temperature (°C)', 
      width: 150,
    },
    { 
      field: 'humidity', 
      headerName: 'Humidity (%)', 
      width: 150,
    }
  ], []);

  const renderDataGrid = useCallback((area) => {
    const areaData = dryingData[area] || [];
    const deviceId = deviceMapping[area];
    const envData = greenhouseData[deviceId] || { temperature: 0, humidity: 0 };
    const totalWeight = areaTotalWeights[area] || 'N/A';

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
          Total Weight: {totalWeight} kg
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
        <div style={{ height: '600px', width: '100%', overflow: 'auto' }}>
          {areaData.length === 0 ? (
            <Typography variant="body1" align="center" color="textSecondary" sx={{ pt: '180px' }}>
              No batches in {area}
            </Typography>
          ) : (
            <DataGrid
              rows={areaData}
              columns={columns}
              pageSizeOptions={[20, 50, 100]}
              disableRowSelectionOnClick
              getRowId={row => row.batchNumber}
              slots={{ toolbar: GridToolbar }}
              sx={ { 
                maxHeight: 600, 
                border: '1px solid rgba(0,0,0,0.12)', 
                '& .MuiDataGrid-footerContainer': { borderTop: 'none' }
              }}
              rowHeight={35}
              pagination
              initialState={{
                pagination: { paginationModel: { pageSize: 50 } }
              }}
            />
          )}
        </div>
      </>
    );
  }, [dryingData, areaLoading, greenhouseData, areaTotalWeights, deviceMapping, columns]);

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
        data: historicalEnvData.map(d => Number(d.temperature)),
        borderColor: 'rgba(255,99,132,1)',
        fill: false,
        tension: 0.1
      },
      {
        label: 'Humidity (%)',
        data: historicalEnvData.map(d => Number(d.humidity)),
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
          parser: (value) => {
            const [datePart, timePart] = value.split(' ');
            const [year, month, day] = datePart.split('-').map(Number);
            const [hours, minutes] = timePart.split(':').map(Number);
            const utcDate = new Date(Date.UTC(year, month - 1, day, hours - 8, minutes));
            return utcDate;
          },
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
      tooltip: { 
        mode: 'index', 
        intersect: false,
        callbacks: {
          title: (tooltipItems) => {
            const date = new Date(tooltipItems[0].parsed.x);
            date.setHours(date.getHours() + 8);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
          }
        }
      } 
    }
  }), []);

  const getTotalWeights = useCallback(() => {
    const totals = {};
    weightMeasurements.forEach(m => {
      const date = m.measurement_date !== 'N/A' && !isNaN(new Date(m.measurement_date).getTime())
        ? new Date(m.measurement_date).toISOString().slice(0, 10)
        : 'N/A';
      if (!totals[date]) totals[date] = {};
      if (!totals[date][m.processingType]) totals[date][m.processingType] = 0;
      totals[date][m.processingType] += parseFloat(m.weight);
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
          <DialogTitle>Track Weight - Batch {selectedBatch?.batchNumber || 'N/A'}</DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                {editingWeightId ? 'Edit Bag Weight' : 'Add Bag Weight'}
              </Typography>
              <Grid container spacing={1} alignItems="center">
                <Grid item xs={3}>
                  <FormControl fullWidth size="small">
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
                  <FormControl fullWidth size="small">
                    <InputLabel id="producer-label">Producer</InputLabel>
                    <Select
                      labelId="producer-label"
                      value={newProducer}
                      onChange={e => setNewProducer(e.target.value)}
                      label="Producer"
                      disabled={editingWeightId !== null}
                    >
                      <MenuItem value="HQ">HQ</MenuItem>
                      <MenuItem value="BTM">BTM</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    label="Bag Number"
                    value={newBagNumber}
                    InputProps={{ readOnly: true }}
                    size="small"
                    fullWidth
                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    label="Weight (kg)"
                    value={newBagWeight}
                    onChange={e => setNewBagWeight(e.target.value)}
                    type="number"
                    size="small"
                    fullWidth
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    label="Date"
                    type="date"
                    value={newWeightDate}
                    onChange={e => setNewWeightDate(e.target.value)}
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      min: selectedBatch ? (selectedBatch.startDryingDate !== 'N/A' ? selectedBatch.startDryingDate : new Date('1970-01-01').toISOString().slice(0, 10)) : new Date('1970-01-01').toISOString().slice(0, 10),
                      max: new Date().toISOString().slice(0, 10),
                    }}
                  />
                </Grid>
                <Grid item xs={1}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddOrUpdateBagWeight}
                    fullWidth
                    size="small"
                    disabled={!newProcessingType || !newProducer || !newBagWeight}
                  >
                    {editingWeightId ? 'Update' : 'Add'}
                  </Button>
                </Grid>
              </Grid>
            </Box>

            <Typography variant="h6" gutterBottom>Batch Summary</Typography>
            <Table size="small" sx={{ mb: 2 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Processing Type</TableCell>
                  <TableCell>Producer</TableCell>
                  <TableCell>Reference Number</TableCell>
                  <TableCell>Lot Number</TableCell>
                  <TableCell align="right">Total Weight (kg)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {processingTypes.map(type => {
                  const typeMeasurements = weightMeasurements.filter(m => m.processingType === type);
                  const latestDate = typeMeasurements.length > 0
                    ? typeMeasurements.reduce((latest, m) => 
                        m.measurement_date !== 'N/A' && (!latest || m.measurement_date > latest) 
                          ? m.measurement_date : latest, null)
                    : null;
                  const total = latestDate && totalWeights[latestDate]?.[type] || 0;
                  const referenceNumber = typeMeasurements.length > 0 
                    ? typeMeasurements.find(m => m.processingType === type)?.lotMapping[type]?.referenceNumber || 'N/A'
                    : 'N/A';
                  const lotNumber = typeMeasurements.length > 0 
                    ? typeMeasurements.find(m => m.processingType === type)?.lotMapping[type]?.lotNumber || 'N/A'
                    : 'N/A';
                  return (
                    <TableRow key={type}>
                      <TableCell>{type}</TableCell>
                      <TableCell>{newProducer || 'N/A'}</TableCell>
                      <TableCell>{referenceNumber}</TableCell>
                      <TableCell>{lotNumber}</TableCell>
                      <TableCell align="right">{total.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <Typography variant="h6" gutterBottom>Weight History</Typography>
            <Button
              variant="contained"
              color="error"
              onClick={handleOpenDeleteConfirmDialog}
              disabled={selectedWeightIds.length === 0}
              sx={{ mb: 2 }}
            >
              Delete Selected
            </Button>
            <Table size="small">
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
                  <TableCell>Producer</TableCell>
                  <TableCell>Bag Number</TableCell>
                  <TableCell align="right">Weight (kg)</TableCell>
                  <TableCell>Reference Number</TableCell>
                  <TableCell>Lot Number</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {weightMeasurements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">No weight measurements recorded</TableCell>
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
                      <TableCell>{formatDateForDisplay(m.measurement_date)}</TableCell>
                      <TableCell>{m.processingType}</TableCell>
                      <TableCell>{m.producer || 'N/A'}</TableCell>
                      <TableCell>{m.bagNumber}</TableCell>
                      <TableCell align="right">{parseFloat(m.weight).toFixed(2)}</TableCell>
                      <TableCell>{m.referenceNumbers}</TableCell>
                      <TableCell>{m.lotNumbers}</TableCell>
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
                  .map(m => `Bag ${m.bagNumber} (${m.processingType}, ${m.producer || 'N/A'}, ${m.weight.toFixed(2)} kg)`)
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
            {historicalEnvData.length === 0 ? (
              <Typography variant="body1" align="center" color="textSecondary" sx={{ mt: 2 }}>
                No environmental data available
              </Typography>
            ) : (
              <>
                <Line data={envChartData} options={envChartOptions} />
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Historical Environmental Data
                </Typography>
                <div style={{ height: 300, width: '100%' }}>
                  <DataGrid
                    rows={historicalEnvData.map((row, index) => ({ id: index, ...row }))}
                    columns={envColumns}
                    pageSizeOptions={[100, 200, 500]}
                    slots={{ toolbar: GridToolbar }}
                    sx={ { 
                      border: '1px solid rgba(0,0,0,0.12)', 
                      '& .MuiDataGrid-footerContainer': { borderTop: 'none' }
                    }}
                    rowHeight={35}
                    pagination
                    initialState={{
                      pagination: { paginationModel: { pageSize: 100 } },
                      sorting: { sortModel: [{ field: 'recorded_at', sort: 'desc' }] }
                    }}
                  />
                </div>
              </>
            )}
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