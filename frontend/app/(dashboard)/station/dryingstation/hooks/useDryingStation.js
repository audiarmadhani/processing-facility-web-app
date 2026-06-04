'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { apiUrl } from '../../_shared/config';
import { computeDryingPriority, formatDryingDateWita, sortDryingRows } from '../utils/dryingRowHelpers';

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const DRYING_ALLOWED_ROLES = ['admin', 'manager', 'drying'];

export function useDryingStation(session) {
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
  const [pendingDrying, setPendingDrying] = useState([]);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [assignBatch, setAssignBatch] = useState(null);
  const [assignArea, setAssignArea] = useState('');
  const [assignDate, setAssignDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [openFinishDialog, setOpenFinishDialog] = useState(false);
  const [selectedRowForFinish, setSelectedRowForFinish] = useState(null);
  const [finishDate, setFinishDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

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
      const dryingResponse = await fetch(apiUrl('/drying-data'));
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
        fetch(apiUrl('/qc')),
        fetch(apiUrl('/greenhouse-latest')),
        fetch(apiUrl('/greenhouse-weight')),
        fetch(apiUrl('/wetmill-weights')),
      ]);
  
      if (!greenhouseResponse.ok || !ghweightResponse.ok || !wetmillWeightResponse.ok) {
        throw new Error('Failed to fetch data from one or more endpoints');
      }
  
      const [greenhouseResult, ghweightResult, wetmillWeightResult] = await Promise.all([
        greenhouseResponse.json(),
        ghweightResponse.json(),
        wetmillWeightResponse.json(),
      ]);

      let qcResult = { distinctRows: [] };
      if (qcResponse.ok) {
        qcResult = await qcResponse.json();
      } else {
        console.warn(`QC data unavailable for ${area} (${qcResponse.status}); continuing without cherry QC rows`);
      }
  
      
      const pendingPreprocessingData = (qcResult.distinctRows || []).filter(batch => 
        batch && batch.batchNumber && typeof batch.batchNumber === 'string'
      );
  
      let weightsResult = [];
      let latestMoistureResult = [];
      if (areaBatchNumbers.length > 0) {
        const batchQuery = areaBatchNumbers.join(',');
        const [weightsResponse, moistureResponse] = await Promise.all([
          fetch(
            `https://processing-facility-backend.onrender.com/api/drying-weight-measurements/aggregated?batchNumbers=${batchQuery}`
          ),
          fetch(
            `https://processing-facility-backend.onrender.com/api/drying-measurements/latest?batchNumbers=${batchQuery}`
          ),
        ]);
        if (!weightsResponse.ok) throw new Error('Failed to fetch aggregated weights');
        weightsResult = await weightsResponse.json();
        if (moistureResponse.ok) {
          latestMoistureResult = await moistureResponse.json();
        }
      }

      const latestMoistureByBatch = {};
      latestMoistureResult.forEach(({ batchNumber, moisture }) => {
        if (batchNumber) {
          latestMoistureByBatch[batchNumber] = moisture;
        }
      });
  
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
          const status = latestEntry ? (latestEntry.exited_at ? 'Dried' : 'In Drying') : 'Not in Drying';
          const currentMoisture = latestMoistureByBatch[batch.batchNumber] ?? null;

          return {
            ...batch,
            status,
            currentMoisture,
            priority: computeDryingPriority(status, currentMoisture),
            dryingArea: latestEntry?.dryingArea || 'N/A',
            startDryingDate: formatDryingDateWita(latestEntry?.entered_at),
            endDryingDate: formatDryingDateWita(latestEntry?.exited_at),
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
        .sort(sortDryingRows);
  
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
      if (selectedBatch?.dryingArea) {
        await fetchAreaData(selectedBatch.dryingArea, true);
      }
    } catch (error) {
      setSnackbarMessage(error.message || 'Failed to add drying measurement');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  }, [newMoisture, newMeasurementDate, selectedBatch, dryingMeasurements, fetchAreaData]);

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
      await Promise.all([
        fetchPendingDrying(),
        ...dryingAreas.map(area => fetchAreaData(area, true))
      ]);
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
      Promise.all([
        fetchPendingDrying(),
        ...dryingAreas.map(area => fetchAreaData(area))
      ])
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

  const fetchPendingDrying = async () => {
    try {
      const res = await fetch(`https://processing-facility-backend.onrender.com/api/pending-drying`);
      const data = await res.json();
      setPendingDrying(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignDrying = async (batchNumber, dryingArea, enteredAt) => {
    try {
      await fetch(`https://processing-facility-backend.onrender.com/api/assign-drying`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          batchNumber,
          dryingArea,
          entered_at: enteredAt
        })
      });

      setSnackbarMessage(`Assigned ${batchNumber} → ${dryingArea}`);
      setSnackbarSeverity('success');

      await handleRefreshData();

    } catch (err) {
      setSnackbarMessage('Failed to assign drying');
      setSnackbarSeverity('error');
    } finally {
      setOpenSnackbar(true);
    }
  };

  const handleFinishDrying = useCallback(async () => {
    if (!selectedRowForFinish || !finishDate) return;

    const today = new Date().toISOString().slice(0, 10);
    if (finishDate > today) {
      setSnackbarMessage('Finish date cannot be in the future.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    const startDate = selectedRowForFinish.startDryingDate;
    if (startDate && startDate !== 'N/A' && finishDate < startDate) {
      setSnackbarMessage('Finish date cannot be before start drying date.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    try {
      const res = await fetch(
        `https://processing-facility-backend.onrender.com/api/finish-drying`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            batchNumber: selectedRowForFinish.batchNumber,
            rfid: selectedRowForFinish.rfid,
            exited_at: finishDate,
          })
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setSnackbarMessage(`Batch ${selectedRowForFinish.batchNumber} finished drying`);
      setSnackbarSeverity('success');

      await handleRefreshData();

    } catch (err) {
      setSnackbarMessage(err.message || 'Failed to finish drying');
      setSnackbarSeverity('error');
    } finally {
      setOpenSnackbar(true);
      setOpenFinishDialog(false);
      setSelectedRowForFinish(null);
    }

  }, [selectedRowForFinish, finishDate, handleRefreshData]);




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



  return {
    openSnackbar,
    setOpenSnackbar,
    snackbarMessage,
    snackbarSeverity,
    dryingData,
    noDataAreas,
    isLoading,
    areaLoading,
    openDialog,
    selectedBatch,
    dryingMeasurements,
    newMoisture,
    setNewMoisture,
    newMeasurementDate,
    setNewMeasurementDate,
    greenhouseData,
    areaTotalWeights,
    openEnvDialog,
    historicalEnvData,
    selectedDevice,
    openMoveDialog,
    newDryingArea,
    setNewDryingArea,
    openWeightDialog,
    weightMeasurements,
    newBagWeight,
    setNewBagWeight,
    newBagNumber,
    newProcessingType,
    setNewProcessingType,
    newWeightDate,
    setNewWeightDate,
    newProducer,
    setNewProducer,
    editingWeightId,
    selectedWeightIds,
    setSelectedWeightIds,
    openDeleteConfirmDialog,
    setOpenDeleteConfirmDialog,
    deletedWeights,
    setDeletedWeights,
    pendingDrying,
    openAssignDialog,
    setOpenAssignDialog,
    assignBatch,
    setAssignBatch,
    assignArea,
    setAssignArea,
    assignDate,
    setAssignDate,
    openFinishDialog,
    setOpenFinishDialog,
    selectedRowForFinish,
    setSelectedRowForFinish,
    finishDate,
    setFinishDate,
    dryingAreas,
    deviceMapping,
    formatDateForDisplay,
    formatDateForGrid,
    fetchAreaData,
    handleAddOrUpdateBagWeight,
    handleEditBagWeight,
    handleDeleteBagWeights,
    handleUndoDelete,
    handleAddMoisture,
    handleMoveBatch,
    handleRefreshData,
    handleDetailsClick,
    handleMoveClick,
    handleWeightClick,
    handleProcessingTypeChange,
    handleCloseDialog,
    handleCloseMoveDialog,
    handleCloseWeightDialog,
    handleCloseEnvDialog,
    handleSelectWeight,
    handleSelectAllWeights,
    handleOpenDeleteConfirmDialog,
    handleCloseDeleteConfirmDialog,
    handleAssignDrying,
    handleFinishDrying,
    processingTypes,
    totalWeights,
    handleEnvDetailsClick,
    fetchHistoricalEnvData,
  };
}
