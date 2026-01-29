"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSession } from "next-auth/react";
import {
  Button, Typography, Snackbar, Alert, Grid, Card, CardContent, CircularProgress, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, InputLabel,
  Table, TableBody, TableCell, TableHead, TableRow, Checkbox, Box, InputAdornment, Divider
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';

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

const WetmillStation = () => {
  const { data: session, status } = useSession();
  const [unprocessedAndInProgressBatches, setUnprocessedAndInProgressBatches] = useState([]);
  const [completedWetMillBatches, setCompletedWetMillBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [openWeightDialog, setOpenWeightDialog] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [weightMeasurements, setWeightMeasurements] = useState([]);
  const [newBagWeight, setNewBagWeight] = useState('');
  const [newBagNumber, setNewBagNumber] = useState(1);
  const [newProcessingType, setNewProcessingType] = useState('');
  const [newProducer, setNewProducer] = useState('');
  const [newWeightDate, setNewWeightDate] = useState(new Date().toISOString().slice(0, 10));
  const [editingWeightId, setEditingWeightId] = useState(null);
  const [selectedWeightIds, setSelectedWeightIds] = useState([]);
  const [openDeleteConfirmDialog, setOpenDeleteConfirmDialog] = useState(false);
  const [deletedWeights, setDeletedWeights] = useState([]);
  const [unprocessedFilter, setUnprocessedFilter] = useState('');
  const [completedFilter, setCompletedFilter] = useState('');
  const isFetchingRef = useRef(false);
  const [selectedRejectBatchIds, setSelectedRejectBatchIds] = useState([]);
  const [openRejectMergeDialog, setOpenRejectMergeDialog] = useState(false);
  const [rejectWeights, setRejectWeights] = useState({});

  const fetchOrderBook = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoading(true);
  
    try {
      const [qcResponse, wetmillResponse, dryingResponse] = await Promise.all([
        fetch('https://processing-facility-backend.onrender.com/api/qc'),
        fetch('https://processing-facility-backend.onrender.com/api/wetmill-data'),
        fetch('https://processing-facility-backend.onrender.com/api/drying-data'),
      ]);
  
      if (!qcResponse.ok || !wetmillResponse.ok || !dryingResponse.ok) {
        throw new Error('Failed to fetch data from one or more endpoints');
      }
  
      const [qcResult, wetmillData, dryingData] = await Promise.all([
        qcResponse.json(),
        wetmillResponse.json(),
        dryingResponse.json(),
      ]);
  
      const qcData = qcResult.distinctRows || [];
      const batchNumbers = qcData
        .filter(batch => batch && batch.batchNumber && typeof batch.batchNumber === 'string')
        .map(batch => batch.batchNumber);
  
      let weightsResult = [];
      if (batchNumbers.length > 0) {
        const weightsResponse = await fetch(
          `https://processing-facility-backend.onrender.com/api/wetmill-weight-measurements/aggregated?batchNumbers=${batchNumbers.join(',')}`
        );
        if (!weightsResponse.ok) throw new Error('Failed to fetch aggregated weights');
        weightsResult = await weightsResponse.json();
      }
  
      const batchWeights = {};
      weightsResult.forEach(({ batchNumber, producer, total_weight, measurement_date }) => {
        if (batchNumber) {
          const key = `${batchNumber}_${producer || 'N/A'}`;
          batchWeights[key] = { total: total_weight, date: measurement_date };
        }
      });
  
      const today = new Date();
      const formattedData = qcData
        .filter(batch => batch && batch.batchNumber && typeof batch.batchNumber === 'string')
        .map(batch => {
          const receivingDate = new Date(batch.receivingDate);
          const sla = isNaN(receivingDate)
            ? 'N/A'
            : Math.ceil(Math.abs(today - receivingDate) / (1000 * 60 * 60 * 24));
  
          const batchWetmillData = wetmillData.filter(data => data.batchNumber === batch.batchNumber);
          const latestWetmillEntry = batchWetmillData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
  
          const batchDryingData = dryingData.filter(data => data.batchNumber === batch.batchNumber);
          const latestDryingEntry = batchDryingData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
  
          const status = latestDryingEntry && latestDryingEntry.entered_at
            ? 'In Drying'
            : latestWetmillEntry
              ? latestWetmillEntry.exited_at
                ? 'Exited Wet Mill'
                : 'Entered Wet Mill'
              : 'Not Scanned';
  
          return {
            ...batch,
            sla,
            status,
            startProcessingDate: batch.startProcessingDate ? new Date(batch.startProcessingDate).toISOString().slice(0, 10) : 'N/A',
            lastProcessingDate: batch.lastProcessingDate ? new Date(batch.lastProcessingDate).toISOString().slice(0, 10) : 'N/A',
            weight: batchWeights[`${batch.batchNumber}_N/A`]?.total || batchWeights[`${batch.batchNumber}_HQ`]?.total || batchWeights[`${batch.batchNumber}_BTM`]?.total || 'N/A',
            producer: latestWetmillEntry?.producer || 'N/A',
            lotNumbers: latestWetmillEntry?.lotNumbers || ['N/A'],
            referenceNumbers: latestWetmillEntry?.referenceNumbers || ['N/A'],
            lotMapping: latestWetmillEntry?.lotMapping || [],
          };
        })
        .sort((a, b) => {
          const typeOrder = { 'Arabica': 0, 'Robusta': 1 };
          const typeA = typeOrder[a.type] ?? 2;
          const typeB = typeOrder[b.type] ?? 2;
          if (typeA !== typeB) return typeA - typeB;
  
          const statusOrder = { 'Entered Wet Mill': 0, 'Not Scanned': 1, 'Exited Wet Mill': 2, 'In Drying': 3 };
          const statusA = statusOrder[a.status] || 4;
          const statusB = statusOrder[b.status] || 4;
          if (statusA !== statusB) return statusA - statusB;
  
          const dateA = a.startProcessingDate === 'N/A' ? '' : a.startProcessingDate;
          const dateB = b.startProcessingDate === 'N/A' ? '' : b.startProcessingDate;
          if (dateA !== dateB) return dateA.localeCompare(dateB);
  
          return 0;
        });
  
      const unprocessedAndInProgress = formattedData.filter(batch => 
        batch.status === 'Not Scanned' || batch.status === 'Entered Wet Mill'
      );
      const completedWetMill = formattedData.filter(batch => 
        batch.status === 'Exited Wet Mill' || batch.status === 'In Drying'
      );
  
      setUnprocessedAndInProgressBatches(unprocessedAndInProgress);
      setCompletedWetMillBatches(completedWetMill);
    } catch (error) {
      console.error('Error fetching order book data:', error);
      setSnackbarMessage(error.message || 'Error fetching data. Please try again.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  const fetchWeightMeasurements = useCallback(async (batchNumber) => {
    try {
      if (!batchNumber) {
        throw new Error('Batch number is undefined');
      }
      const response = await fetch(`https://processing-facility-backend.onrender.com/api/wetmill-weight-measurements/${batchNumber}`);
      if (!response.ok) throw new Error('Failed to retrieve weight measurements.');
      const data = await response.json();
      const validMeasurements = data.filter(m => {
        const date = new Date(m.measurement_date);
        const isValidDate = !isNaN(date.getTime());
        const isValidWeight = typeof m.weight === 'number' && !isNaN(m.weight) && m.weight >= 0;
        if (!isValidDate) console.warn(`Invalid measurement_date in measurement ID ${m.id}: ${m.measurement_date}`);
        if (!isValidWeight) console.warn(`Invalid weight in measurement ID ${m.id}: ${m.weight}`);
        return isValidDate && isValidWeight;
      });
      setWeightMeasurements(validMeasurements);
      if (data.length !== validMeasurements.length) {
        const invalidCount = data.length - validMeasurements.length;
        setSnackbarMessage(`Skipped ${invalidCount} weight measurement${invalidCount > 1 ? 's' : ''} due to invalid dates or weights.`);
        setSnackbarSeverity('warning');
        setOpenSnackbar(true);
      }
    } catch (err) {
      setSnackbarMessage(err.message || 'Failed to retrieve weight measurements.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  }, []);

  const fetchMaxBagNumber = useCallback(async (batchNumber, processingType, producer) => {
    try {
      if (!batchNumber) {
        throw new Error('Batch number is undefined');
      }
      const url = new URL(`https://processing-facility-backend.onrender.com/api/wetmill-weight-measurements/${batchNumber}/${processingType}/max-bag-number`);
      if (producer) url.searchParams.append('producer', producer);
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to retrieve max bag number.');
      const { maxBagNumber } = await response.json();
      setNewBagNumber(maxBagNumber + 1 || 1);
    } catch (err) {
      setSnackbarMessage(err.message || 'Failed to retrieve max bag number, starting at 1.');
      setSnackbarSeverity('warning');
      setOpenSnackbar(true);
      setNewBagNumber(1);
    }
  }, []);

  const handleAddOrUpdateBagWeight = useCallback(async () => {
    const normalizedWeight = newBagWeight.replace(',', '.');
    const weightValue = parseFloat(normalizedWeight);
    
    if (!newBagWeight || isNaN(weightValue) || weightValue <= 0) {
      setSnackbarMessage('Please enter a valid weight measurement (positive number, e.g., 12.34 or 12,34).');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }
    if (!newProcessingType) {
      setSnackbarMessage('Please select a processing type.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }
    if (!newProducer) {
      setSnackbarMessage('Please select a producer.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }
    if (!newWeightDate) {
      setSnackbarMessage('Please select a measurement date.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }
  
    const selectedDate = new Date(newWeightDate);
    if (isNaN(selectedDate.getTime())) {
      setSnackbarMessage('Invalid measurement date selected.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }
  
    const startProcessingDate = selectedBatch?.startProcessingDate !== 'N/A' ? new Date(selectedBatch.startProcessingDate) : null;
    const now = new Date();
  
    if (selectedDate > now) {
      setSnackbarMessage('Measurement date cannot be in the future.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }
  
    if (startProcessingDate && selectedDate < startProcessingDate) {
      setSnackbarMessage('Measurement date cannot be before the start processing date.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }
  
    try {
      if (editingWeightId) {
        const payload = {
          weight: weightValue,
          measurement_date: newWeightDate,
          producer: newProducer,
        };
        const response = await fetch(`https://processing-facility-backend.onrender.com/api/wetmill-weight-measurement/${editingWeightId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to update weight measurement');
        const result = await response.json();
        setWeightMeasurements(weightMeasurements.map(m => m.id === editingWeightId ? { ...result.measurement, lotMapping: m.lotMapping } : m));
        setSnackbarMessage(`Bag ${newBagNumber} weight updated successfully`);
        setSnackbarSeverity('success');
        setEditingWeightId(null);
      } else {
        if (!selectedBatch?.batchNumber) {
          throw new Error('Selected batch is invalid');
        }
        const payload = {
          batchNumber: selectedBatch.batchNumber,
          processingType: newProcessingType,
          producer: newProducer,
          bagNumber: newBagNumber,
          weight: weightValue,
          measurement_date: newWeightDate,
        };
        const response = await fetch('https://processing-facility-backend.onrender.com/api/wetmill-weight-measurement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to save weight measurement');
        const result = await response.json();
        setWeightMeasurements([...weightMeasurements, { ...result.measurement, lotMapping: selectedBatch.lotMapping }]);
        setNewBagNumber(newBagNumber + 1);
        setSnackbarMessage(`Bag ${newBagNumber} weight added successfully`);
        setSnackbarSeverity('success');
      }
      setNewBagWeight('');
      setNewWeightDate(new Date().toISOString().slice(0, 10));
      await fetchOrderBook();
    } catch (error) {
      setSnackbarMessage(error.message || 'Failed to save weight measurement');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  }, [
    newBagWeight, newProcessingType, newProducer, newWeightDate, editingWeightId, newBagNumber,
    selectedBatch, weightMeasurements, fetchOrderBook,
  ]);

  const handleEditBagWeight = useCallback((measurement) => {
    if (!measurement || !measurement.id) {
      setSnackbarMessage('Invalid measurement selected for editing.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }
    setEditingWeightId(measurement.id);
    setNewProcessingType(measurement.processingType);
    setNewProducer(measurement.producer || deriveProducerFromLotMapping(measurement.processingType, selectedBatch?.lotMapping) || '');
    setNewBagNumber(measurement.bagNumber);
    setNewBagWeight(measurement.weight.toString());
    setNewWeightDate(new Date(measurement.measurement_date).toISOString().slice(0, 10));
  }, [selectedBatch]);

  const handleDeleteBagWeights = useCallback(async () => {
    try {
      if (selectedWeightIds.length === 0) {
        setSnackbarMessage('No weights selected for deletion.');
        setSnackbarSeverity('warning');
        setOpenSnackbar(true);
        return;
      }
      const weightsToDelete = weightMeasurements.filter(m => selectedWeightIds.includes(m.id));
      const response = await fetch('https://processing-facility-backend.onrender.com/api/wetmill-weight-measurements/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedWeightIds }),
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
      await fetchOrderBook();
    } catch (error) {
      setSnackbarMessage(error.message || 'Failed to delete weight measurements');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  }, [weightMeasurements, selectedWeightIds, fetchOrderBook]);

  const handleUndoDelete = useCallback(async () => {
    try {
      if (deletedWeights.length === 0) {
        setSnackbarMessage('No weights to restore.');
        setSnackbarSeverity('warning');
        setOpenSnackbar(true);
        return;
      }
      const restoredWeights = [];
      for (const weight of deletedWeights) {
        const payload = {
          batchNumber: weight.batchNumber,
          processingType: weight.processingType,
          producer: weight.producer,
          bagNumber: weight.bagNumber,
          weight: weight.weight,
          measurement_date: weight.measurement_date,
        };
        const response = await fetch('https://processing-facility-backend.onrender.com/api/wetmill-weight-measurement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to restore weight measurement');
        const result = await response.json();
        restoredWeights.push({ ...result.measurement, lotMapping: weight.lotMapping });
      }
      setWeightMeasurements([...weightMeasurements, ...restoredWeights]);
      setDeletedWeights([]);
      setSnackbarMessage('Weight measurements restored successfully');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      await fetchOrderBook();
    } catch (error) {
      setSnackbarMessage(error.message || 'Failed to restore weight measurements');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  }, [deletedWeights, weightMeasurements, fetchOrderBook]);

  const handleProcessingTypeChange = useCallback(async (value) => {
    setNewProcessingType(value);
    const derivedProducer = deriveProducerFromLotMapping(value, selectedBatch?.lotMapping) || '';
    setNewProducer(derivedProducer);
    if (value && selectedBatch && !editingWeightId && derivedProducer) {
      await fetchMaxBagNumber(selectedBatch.batchNumber, value, derivedProducer);
    }
  }, [selectedBatch, editingWeightId, fetchMaxBagNumber]);

  const handleProducerChange = useCallback(async (value) => {
    setNewProducer(value);
    if (newProcessingType && selectedBatch && !editingWeightId) {
      await fetchMaxBagNumber(selectedBatch.batchNumber, newProcessingType, value);
    }
  }, [selectedBatch, editingWeightId, fetchMaxBagNumber, newProcessingType]);

  const handleWeightClick = useCallback((batch) => {
    if (!batch || !batch.batchNumber || !batch.startProcessingDate) {
      setSnackbarMessage('Invalid batch selected or missing start processing date.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }
    setSelectedBatch(batch);
    fetchWeightMeasurements(batch.batchNumber);
    setNewBagWeight('');
    setNewProcessingType('');
    setNewProducer('');
    setNewWeightDate(new Date().toISOString().slice(0, 10));
    setNewBagNumber(1);
    setEditingWeightId(null);
    setSelectedWeightIds([]);
    setDeletedWeights([]);
    setOpenWeightDialog(true);
  }, [fetchWeightMeasurements]);

  const handleCloseWeightDialog = useCallback(() => {
    setOpenWeightDialog(false);
    if (selectedBatch) {
      setSelectedBatch(null);
    }
    setWeightMeasurements([]);
    setNewBagWeight('');
    setNewBagNumber(1);
    setNewProcessingType('');
    setNewProducer('');
    setNewWeightDate('');
    setEditingWeightId(null);
    setSelectedWeightIds([]);
    setDeletedWeights([]);
  }, [selectedBatch]);

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

  const handleRefreshData = useMemo(() => debounce(() => {
    fetchOrderBook();
  }, 2000), [fetchOrderBook]);

  const handleWeightInputChange = useCallback((e) => {
    const value = e.target.value.replace(',', '.');
    if (/^[0-9]*[,.]?[0-9]*$/.test(value) || value === '') {
      setNewBagWeight(value);
    }
  }, []);

  useEffect(() => {
    fetchOrderBook();
    const intervalId = setInterval(fetchOrderBook, 300000);
    return () => clearInterval(intervalId);
  }, [fetchOrderBook]);

  // Derive producer based on lotNumber
  const deriveProducerFromLotMapping = useCallback((processingType, lotMapping) => {
    if (!lotMapping || !Array.isArray(lotMapping)) return '';
    const mapping = lotMapping.find(m => m.processingType === processingType);
    if (!mapping || !mapping.lotNumber) return '';
    if (mapping.lotNumber.startsWith('HQ')) return 'HQ';
    if (mapping.lotNumber.startsWith('ID-BTM')) return 'BTM';
    return '';
  }, []);

  const availableProcessingTypes = useMemo(() => {
    return [...new Set(selectedBatch?.lotMapping?.map(m => m.processingType)) || ['Washed', 'Natural', 'Pulped Natural', 'CM Washed']];
  }, [selectedBatch]);

  const availableProducersForType = useMemo(() => {
    if (!newProcessingType || !selectedBatch?.lotMapping) return ['HQ', 'BTM'];
    const mappings = selectedBatch.lotMapping.filter(m => m.processingType === newProcessingType);
    return [...new Set(mappings.map(m => {
      if (m.lotNumber?.startsWith('HQ')) return 'HQ';
      if (m.lotNumber?.startsWith('ID-BTM')) return 'BTM';
      return 'HQ'; // Default fallback
    }))];
  }, [newProcessingType, selectedBatch]);

  const getTotalWeights = useCallback(() => {
    const totals = {};
    weightMeasurements.forEach(m => {
      const date = new Date(m.measurement_date);
      if (isNaN(date.getTime())) {
        console.warn(`Skipping invalid measurement_date: ${m.measurement_date}`);
        return;
      }
      const dateKey = date.toISOString().slice(0, 10);
      if (!totals[dateKey]) totals[dateKey] = {};
      const key = `${m.processingType}_${m.producer || 'N/A'}`;
      if (!totals[dateKey][key]) totals[dateKey][key] = 0;
      totals[dateKey][key] += m.weight || 0;
    });
    return totals;
  }, [weightMeasurements]);

  const totalWeights = getTotalWeights();

  const columns = useMemo(() => [
    { field: 'batchNumber', headerName: 'Batch Number', width: 180 },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: ({ value }) => {
        const color = {
          'Entered Wet Mill': 'primary',
          'Exited Wet Mill': 'success',
          'Not Scanned': 'default',
          'In Drying': 'info',
        }[value] || 'default';
        return (
          <Chip
            label={value}
            color={color}
            size="small"
            sx={{ borderRadius: '16px', fontWeight: 'medium' }}
          />
        );
      },
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
          disabled={row.status === 'Not Scanned'}
        >
          Track Weight
        </Button>
      ),
    },
    { field: 'farmerName', headerName: 'Farmer Name', width: 160 },
    { field: 'farmVarieties', headerName: 'Farm Varieties', width: 160 },
    { field: 'startProcessingDate', headerName: 'Start Processing Date', width: 180 },
    { field: 'lastProcessingDate', headerName: 'Last Processing Date', width: 180 },
    { field: 'weight', headerName: 'Processed Weight (kg)', width: 180 },
    { field: 'type', headerName: 'Type', width: 100 },
    { field: 'producer', headerName: 'Producer', width: 100 },
    { field: 'productLine', headerName: 'Product Line', width: 180 },
    { field: 'processingType', headerName: 'Processing Type', width: 220 },
    { field: 'quality', headerName: 'Quality', width: 130 },
    { 
      field: 'lotNumbers', 
      headerName: 'Lot Numbers', 
      width: 200, 
      renderCell: ({ value }) => value.join(', ') || 'N/A'
    },
    { 
      field: 'referenceNumbers', 
      headerName: 'Reference Numbers', 
      width: 200, 
      renderCell: ({ value }) => value.join(', ') || 'N/A'
    },
    { field: 'preprocessing_notes', headerName: 'Preprocessing Notes', width: 200 },
  ], [handleWeightClick]);

  const filteredUnprocessedBatches = useMemo(() => 
    unprocessedAndInProgressBatches.filter(batch => 
      batch.batchNumber?.toLowerCase().includes(unprocessedFilter.toLowerCase()) ||
      batch.farmerName?.toLowerCase().includes(unprocessedFilter.toLowerCase())
    ),
    [unprocessedAndInProgressBatches, unprocessedFilter]
  );

  const getBatchRowId = (row) =>
    `${row.batchNumber}_${row.producer}_${row.processingType}`;

  const selectedRejectBatches = useMemo(
    () =>
      unprocessedAndInProgressBatches.filter(b =>
        selectedRejectBatchIds.includes(getBatchRowId(b))
      ),
    [selectedRejectBatchIds, unprocessedAndInProgressBatches]
  );

  const handleOpenRejectMergeDialog = () => {
    const producers = [...new Set(selectedRejectBatches.map(b => b.producer))];

    if (producers.length !== 1) {
      setSnackbarMessage('All selected batches must have the same producer');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    initializeRejectWeights();
    setOpenRejectMergeDialog(true);
  };

  const initializeRejectWeights = () => {
    const initial = {};
    selectedRejectBatches.forEach(b => {
      initial[b.batchNumber] = '';
    });
    setRejectWeights(initial);
  };

  const handleConfirmRejectMerge = async () => {
    const producer = selectedRejectBatches[0].producer;

    const sourceBatches = selectedRejectBatches.map(b => ({
      batchNumber: b.batchNumber,
      rejectWeight: Number(rejectWeights[b.batchNumber] || 0)
    }));

    if (sourceBatches.some(b => b.rejectWeight <= 0)) {
      setSnackbarMessage('Reject weight must be greater than 0');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    const payload = {
      sourceBatches,
      producer,
      operator: session.user.name,
      notes: 'Reject batch merged from Wet Mill UI'
    };

    const res = await fetch('/api/wetmill/rejects/merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Failed to merge reject batch');

    setOpenRejectMergeDialog(false);
    setSelectedRejectBatchIds([]);
    fetchOrderBook();
  };

  const rejectValidation = useMemo(() => {
    let totalReject = 0;
    let hasError = false;

    const perBatch = selectedRejectBatches.map(b => {
      const reject = Number(rejectWeights[b.batchNumber] || 0);
      const available = Number(b.weight || 0);

      totalReject += reject;

      if (reject <= 0 || reject > available) {
        hasError = true;
      }

      return {
        batchNumber: b.batchNumber,
        reject,
        available,
        remaining: available - reject
      };
    });

    return {
      perBatch,
      totalReject,
      hasError
    };
  }, [selectedRejectBatches, rejectWeights]);

  const selectedProducers = useMemo(() => {
    const set = new Set(selectedRejectBatches.map(b => b.producer));
    return Array.from(set);
  }, [selectedRejectBatches]);

  const canOpenRejectMergeDialog =
    selectedRejectBatches.length > 0 &&
    selectedProducers.length === 1;

  const totalRejectWeight = selectedRejectBatches.reduce(
    (sum, b) =>
      sum + Number(rejectWeights[b.batchNumber] || 0),
    0
  );

  const hasEmptyReject = selectedRejectBatches.some(
    b => rejectWeights[b.batchNumber] === '' || rejectWeights[b.batchNumber] == null
  );

  const filteredCompletedBatches = useMemo(() => 
    completedWetMillBatches.filter(batch => 
      batch.batchNumber?.toLowerCase().includes(completedFilter.toLowerCase()) ||
      batch.farmerName?.toLowerCase().includes(completedFilter.toLowerCase())
    ),
    [completedWetMillBatches, completedFilter]
  );

  if (status === 'loading') return <p>Loading...</p>;

  if (!session?.user || !['admin', 'manager', 'preprocessing'].includes(session.user.role)) {
    return <Typography variant="h6">Access Denied. You do not have permission to view this page.</Typography>;
  }

  useEffect(() => {
    console.log('Selected Batch:', selectedBatch);
  }, [selectedBatch]);

  return (
    <ErrorBoundary>
      <Grid container spacing={3} sx={{ p: 2 }}>
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h5" gutterBottom>Wet Mill Order Book</Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handleRefreshData}
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                sx={{ mb: 2, mt: 2 }}
              >
                {isLoading ? 'Refreshing...' : 'Refresh Data'}
              </Button>

              <Button
                variant="contained"
                color="error"
                disabled={
                  selectedRejectBatches.length === 0 ||
                  selectedProducers.length !== 1
                }
                onClick={handleOpenRejectMergeDialog}
              >
                Merge Reject
              </Button>

              {/* Unprocessed and In-Progress Batches Grid */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>Unprocessed and In-Progress Batches</Typography>
                <TextField
                  label="Search by Batch Number or Farmer Name"
                  value={unprocessedFilter}
                  onChange={e => setUnprocessedFilter(e.target.value)}
                  fullWidth
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <div style={{ height: 600, width: '100%' }}>
                  <DataGrid
                    rows={filteredUnprocessedBatches}
                    columns={columns}
                    pageSizeOptions={[10, 50, 100]}
                    checkboxSelection
                    onRowSelectionModelChange={(ids) => setSelectedRejectBatchIds(ids)}
                    rowSelectionModel={selectedRejectBatchIds}
                    getRowId={getBatchRowId}
                    slots={{ toolbar: GridToolbar }}
                    sx={{
                      maxHeight: 600,
                      border: '1px solid rgba(0,0,0,0.12)',
                      '& .MuiDataGrid-footerContainer': { borderTop: 'none' },
                    }}
                    rowHeight={35}
                    pagination
                    initialState={{
                      pagination: { paginationModel: { pageSize: 50 } },
                    }}
                  />
                </div>
              </Box>

              {/* Completed Wet Mill Batches Grid */}
              <Box>
                <Typography variant="h6" gutterBottom>Completed Wet Mill Batches</Typography>
                <TextField
                  label="Search by Batch Number or Farmer Name"
                  value={completedFilter}
                  onChange={e => setCompletedFilter(e.target.value)}
                  fullWidth
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <div style={{ height: 600, width: '100%' }}>
                  <DataGrid
                    rows={filteredCompletedBatches}
                    columns={columns}
                    pageSizeOptions={[10, 50, 100]}
                    checkboxSelection
                    onRowSelectionModelChange={(ids) => setSelectedRejectBatchIds(ids)}
                    rowSelectionModel={selectedRejectBatchIds}
                    getRowId={getBatchRowId}
                    slots={{ toolbar: GridToolbar }}
                    sx={{
                      maxHeight: 600,
                      border: '1px solid rgba(0,0,0,0.12)',
                      '& .MuiDataGrid-footerContainer': { borderTop: 'none' },
                    }}
                    rowHeight={35}
                    pagination
                    initialState={{
                      pagination: { paginationModel: { pageSize: 50 } },
                    }}
                  />
                </div>
              </Box>
            </CardContent>
          </Card>
        </Grid>

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
                      {availableProcessingTypes.map(type => (
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
                      onChange={e => handleProducerChange(e.target.value)}
                      label="Producer"
                      disabled={editingWeightId !== null || !newProcessingType}
                    >
                      {availableProducersForType.map(prod => (
                        <MenuItem key={prod} value={prod}>{prod}</MenuItem>
                      ))}
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
                    onChange={handleWeightInputChange}
                    type="text"
                    size="small"
                    fullWidth
                    inputProps={{ pattern: "[0-9]*[,.]?[0-9]+" }}
                    placeholder="e.g., 12.34 or 12,34"
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
                      min: selectedBatch ? (selectedBatch.startProcessingDate !== 'N/A' ? selectedBatch.startProcessingDate : new Date('1970-01-01').toISOString().slice(0, 10)) : new Date('1970-01-01').toISOString().slice(0, 10),
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
                  <TableCell align="right">Total Weight (kg)</TableCell>
                  <TableCell>Lot Number</TableCell>
                  <TableCell>Reference Number</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedBatch?.lotMapping?.map((mapping, index) => {
                  const currentProducer = mapping.lotNumber?.startsWith('HQ') ? 'HQ' : mapping.lotNumber?.startsWith('ID-BTM') ? 'BTM' : 'N/A';
                  const typeMeasurements = weightMeasurements.filter(m => m.processingType === mapping.processingType && m.producer === currentProducer);
                  const latestDate = typeMeasurements.length > 0
                    ? new Date(Math.max(...typeMeasurements.map(m => new Date(m.measurement_date).getTime()))).toISOString().slice(0, 10)
                    : null;
                  const key = `${mapping.processingType}_${currentProducer}`;
                  const total = latestDate && totalWeights[latestDate]?.[key] ? totalWeights[latestDate][key] : 0;
                  return (
                    <TableRow key={index}>
                      <TableCell>{mapping.processingType}</TableCell>
                      <TableCell>{currentProducer}</TableCell>
                      <TableCell align="right">{total.toFixed(2)}</TableCell>
                      <TableCell>{mapping.lotNumber || 'N/A'}</TableCell>
                      <TableCell>{mapping.referenceNumber || 'N/A'}</TableCell>
                    </TableRow>
                  );
                }) || []}
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
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {weightMeasurements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">No weight measurements recorded</TableCell>
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
                      <TableCell>{new Date(m.measurement_date).toLocaleDateString('en-US', { timeZone: 'Asia/Makassar' })}</TableCell>
                      <TableCell>{m.processingType}</TableCell>
                      <TableCell>{m.producer || deriveProducerFromLotMapping(m.processingType, selectedBatch?.lotMapping) || 'N/A'}</TableCell>
                      <TableCell>{m.bagNumber}</TableCell>
                      <TableCell align="right">{m.weight.toFixed(2)}</TableCell>
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
                  .map(m => `Bag ${m.bagNumber} (${m.processingType}, ${m.producer || deriveProducerFromLotMapping(m.processingType, selectedBatch?.lotMapping) || 'N/A'}, ${m.weight.toFixed(2)} kg)`)
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

        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={() => setOpenSnackbar(false)}
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

      <Dialog
        open={openRejectMergeDialog}
        onClose={() => setOpenRejectMergeDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Merge Reject Batches</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {selectedRejectBatches.map(batch => {
              const availableWeight = Number(batch.weight || 0);
              const rejectValue = Number(rejectWeights[batch.batchNumber] || 0);
              const isError =
                rejectValue < 0 || rejectValue > availableWeight;

              return (
                <Box
                  key={batch.batchNumber}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr',
                    gap: 2,
                    alignItems: 'center'
                  }}
                >
                  {/* Batch info */}
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {batch.batchNumber}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {batch.farmerName}
                    </Typography>
                  </Box>

                  {/* Available weight (disabled) */}
                  <TextField
                    label="Available (kg)"
                    value={availableWeight.toFixed(2)}
                    size="small"
                    disabled
                    fullWidth
                  />

                  {/* Reject input */}
                  <TextField
                    label="Reject (kg)"
                    type="number"
                    size="small"
                    fullWidth
                    value={rejectWeights[batch.batchNumber] || ''}
                    onChange={e =>
                      setRejectWeights(prev => ({
                        ...prev,
                        [batch.batchNumber]: e.target.value
                      }))
                    }
                    inputProps={{ min: 0, step: 0.01 }}
                    error={isError}
                    helperText={
                      isError
                        ? 'Exceeds available'
                        : `Remaining ${(availableWeight - rejectValue).toFixed(2)} kg`
                    }
                  />
                </Box>
              );
            })}
          </Box>

          {/* ---- FOOTER ---- */}
          <Divider sx={{ my: 3 }} />

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Box>
              <Typography variant="subtitle2">
                Total Reject Weight
              </Typography>
              <Typography
                variant="h6"
                color={totalRejectWeight > 0 ? 'error.main' : 'text.secondary'}
              >
                {totalRejectWeight.toFixed(2)} kg
              </Typography>
            </Box>

            <Button
              variant="contained"
              color="error"
              onClick={handleConfirmRejectMerge}
              disabled={
                hasEmptyReject ||
                totalRejectWeight <= 0 ||
                selectedRejectBatches.some(b => {
                  const available = Number(b.weight || 0);
                  const reject = Number(rejectWeights[b.batchNumber]);
                  return reject <= 0 || reject > available;
                })
              }
            >
              Merge Reject
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  );
};

export default WetmillStation;