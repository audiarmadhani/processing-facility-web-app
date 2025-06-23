"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from "next-auth/react";
import {
  TextField,
  Button,
  Typography,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import axios from 'axios';

const API_BASE_URL = 'https://processing-facility-backend.onrender.com/api';

const PreprocessingStation = () => {
  const { data: session, status } = useSession();
  const [rfid, setRfid] = useState('');
  const [rfidTag, setRfidTag] = useState('');
  const [weightProcessed, setWeightProcessed] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [lotNumber, setLotNumber] = useState('N/A'); // Initialize as N/A
  const [referenceNumber, setReferenceNumber] = useState('N/A'); // Initialize as N/A
  const [weightAvailable, setWeightAvailable] = useState(0);
  const [totalProcessedWeight, setTotalProcessedWeight] = useState(0);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [farmerName, setFarmerName] = useState('');
  const [receivingDate, setReceivingDate] = useState('');
  const [qcDate, setQCDate] = useState('');
  const [totalWeight, setTotalWeight] = useState('');
  const [totalBags, setTotalBags] = useState('');
  const [openHistory, setOpenHistory] = useState(false);
  const [weightHistory, setWeightHistory] = useState([]);
  const [preprocessingData, setPreprocessingData] = useState([]);
  const [unprocessedBatches, setUnprocessedBatches] = useState([]);
  const [producer, setProducer] = useState('');
  const [productLine, setProductLine] = useState('');
  const [processingType, setProcessingType] = useState('');
  const [quality, setQuality] = useState('');
  const [notes, setNotes] = useState('');
  const [producerFilter, setProducerFilter] = useState('All');
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [selectedBatchNumber, setSelectedBatchNumber] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);

  const fetchAvailableWeight = useCallback(async (batchNumber, totalWeight) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/preprocessing/${batchNumber}`, {
        timeout: 10000,
      });
      const preprocessingResponse = response.data;
      const totalProcessedWeight = parseFloat(preprocessingResponse.totalWeightProcessed || 0);
      const weightAvailable = totalWeight - totalProcessedWeight;
      const latestRecord = preprocessingResponse.preprocessingData?.length > 0 
        ? preprocessingResponse.preprocessingData.sort((a, b) => 
            new Date(b.processingDate) - new Date(a.processingDate))[0]
        : null;

      return {
        weightAvailable,
        totalProcessedWeight,
        finished: preprocessingResponse.finished || false,
        lotNumber: latestRecord?.lotNumber || 'N/A',
        referenceNumber: latestRecord?.referenceNumber || 'N/A',
      };
    } catch (error) {
      console.error('Error fetching available weight:', error);
      return {
        weightAvailable: totalWeight,
        totalProcessedWeight: 0,
        finished: false,
        lotNumber: 'N/A',
        referenceNumber: 'N/A',
      };
    }
  }, []);

  const fetchBatchData = useCallback(async (batchNumber) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/receiving/${batchNumber}`, {
        timeout: 10000,
      });
      const dataArray = response.data;
      if (!dataArray.length) throw new Error('No data found for the provided batch number.');
      const data = dataArray[0];
      const { weightAvailable, totalProcessedWeight, finished, lotNumber, referenceNumber } = 
        await fetchAvailableWeight(batchNumber, data.weight);

      setFarmerName(data.farmerName || '');
      setReceivingDate(data.receivingDateTrunc || '');
      setQCDate(data.qcDateTrunc || '');
      setTotalWeight(data.weight || '');
      setTotalBags(data.totalBags || '');
      setLotNumber(lotNumber);
      setReferenceNumber(referenceNumber);
      setWeightAvailable(weightAvailable);
      setTotalProcessedWeight(totalProcessedWeight);

      if (finished) {
        setSnackbarMessage(`Batch ${batchNumber} is already marked as complete.`);
        setSnackbarSeverity('warning');
      } else {
        setSnackbarMessage(`Data for batch ${batchNumber} retrieved successfully!`);
        setSnackbarSeverity('success');
      }
    } catch (error) {
      handleError('Error retrieving batch data. Please try again.', error);
    } finally {
      setOpenSnackbar(true);
    }
  }, [fetchAvailableWeight]);

  const handleRfidScan = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/get-rfid/Warehouse_Exit`, {
        timeout: 10000,
      });
      const data = response.data;

      if (data.rfid) {
        setRfid(data.rfid);
        setRfidTag(data.rfid);
        const receivingResponse = await axios.get(`${API_BASE_URL}/receivingrfid/${data.rfid}`, {
          timeout: 10000,
        });
        const receivingData = receivingResponse.data;

        if (receivingData && receivingData.length > 0) {
          const batchData = receivingData[0];
          setBatchNumber(batchData.batchNumber);
          setFarmerName(batchData.farmerName || '');
          setReceivingDate(batchData.receivingDateTrunc || '');
          setQCDate(batchData.qcDateTrunc || '');
          setTotalWeight(batchData.weight || '');
          setTotalBags(batchData.totalBags || '');
          const { weightAvailable, totalProcessedWeight, finished, lotNumber, referenceNumber } = 
            await fetchAvailableWeight(batchData.batchNumber, batchData.weight);
          setWeightAvailable(weightAvailable);
          setTotalProcessedWeight(totalProcessedWeight);
          setLotNumber(lotNumber);
          setReferenceNumber(referenceNumber);

          if (finished) {
            setSnackbarMessage(`Batch ${batchData.batchNumber} is already marked as complete.`);
            setSnackbarSeverity('warning');
          } else {
            setSnackbarMessage(`Data for batch ${batchData.batchNumber} retrieved successfully!`);
            setSnackbarSeverity('success');
          }

          await clearRfidData("Preprocessing");
        } else {
          setSnackbarMessage('No receiving data found for this RFID.');
          setSnackbarSeverity('warning');
        }
      } else {
        setSnackbarMessage('No RFID tag scanned yet.');
        setSnackbarSeverity('warning');
      }
    } catch (error) {
      handleError('Error retrieving data. Please try again.', error);
    } finally {
      setOpenSnackbar(true);
    }
  }, [fetchAvailableWeight]);

  const clearRfidData = async (scannedAt) => {
    try {
      await axios.delete(`${API_BASE_URL}/clear-rfid/${scannedAt}`, {
        timeout: 10000,
      });
    } catch (error) {
      console.error("Error clearing RFID Data:", error);
    }
  };

  const handleAllWeight = () => {
    if (weightAvailable > 0) {
      setWeightProcessed(weightAvailable);
    } else {
      setWeightProcessed('');
      setSnackbarMessage('No weight available to process.');
      setSnackbarSeverity('warning');
      setOpenSnackbar(true);
    }
  };

  const handleBatchNumberSearch = async () => {
    if (!batchNumber) {
      setSnackbarMessage('Please enter a batch number.');
      setSnackbarSeverity('warning');
      setOpenSnackbar(true);
      return;
    }
    await fetchBatchData(batchNumber);
  };

  const handleFinishBatch = async (batchNumber) => {
    setIsFinishing(true);
    try {
      const response = await axios.put(`${API_BASE_URL}/preprocessing/${batchNumber}/finish`, { createdBy: session.user.name }, {
        timeout: 10000,
      });
      setSnackbarMessage(response.data.message || `Batch ${batchNumber} marked as complete successfully!`);
      setSnackbarSeverity('success');
      await fetchPreprocessingData();
      if (batchNumber === batchNumber.trim()) {
        resetForm();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || `Failed to mark batch ${batchNumber} as complete: ${error.message}`;
      handleError(errorMessage, error);
    } finally {
      setIsFinishing(false);
      setOpenConfirmDialog(false);
    }
  };

  const openFinishConfirmation = (batchNumber) => {
    setSelectedBatchNumber(batchNumber);
    setOpenConfirmDialog(true);
  };

  const handleCancelFinish = () => {
    setOpenConfirmDialog(false);
    setSelectedBatchNumber('');
  };

  const fetchWeightHistory = async () => {
    try {
      const [batchesResponse, processedResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/receiving`, { timeout: 10000 }),
        axios.get(`${API_BASE_URL}/preprocessing`, { timeout: 10000 }),
      ]);
      const batches = batchesResponse.data;
      const processedWeights = processedResponse.data.allRows || processedResponse.data;

      const historyData = batches.map((batch) => {
        const processedLogs = processedWeights.filter(log => log.batchNumber.toLowerCase() === batch.batchNumber.toLowerCase());
        const totalProcessedWeight = processedLogs.reduce((acc, log) => acc + parseFloat(log.weightProcessed || 0), 0);
        const weightAvailable = parseFloat(batch.weight || 0) - totalProcessedWeight;
        return {
          batchNumber: batch.batchNumber,
          lotNumber: processedLogs.length > 0 ? processedLogs[processedLogs.length - 1].lotNumber || 'N/A' : 'N/A',
          referenceNumber: processedLogs.length > 0 ? processedLogs[processedLogs.length - 1].referenceNumber || 'N/A' : 'N/A',
          totalWeight: parseFloat(batch.weight || 0),
          totalProcessedWeight,
          weightAvailable,
          finished: processedLogs.length > 0 ? processedLogs[0].finished : false,
          processedLogs: processedLogs.map(log => ({
            processingDate: log.processingDate,
            weightProcessed: parseFloat(log.weightProcessed || 0),
            processingType: log.processingType,
            notes: log.notes,
            lotNumber: log.lotNumber || 'N/A',
            referenceNumber: log.referenceNumber || 'N/A',
          })),
        };
      });

      setWeightHistory(historyData);
      setOpenHistory(true);
    } catch (error) {
      handleError("Error fetching weight history.", error);
    }
  };

  const showWeightHistory = () => {
    fetchWeightHistory();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedBatchNumber = batchNumber.trim();
    const trimmedWeightProcessed = parseFloat(weightProcessed);

    if (isNaN(trimmedWeightProcessed) || trimmedWeightProcessed <= 0) {
      setSnackbarMessage('Please enter a valid weight to process.');
      setSnackbarSeverity('warning');
      setOpenSnackbar(true);
      return;
    }

    if (trimmedWeightProcessed > weightAvailable) {
      setSnackbarMessage(`Cannot process more weight than available. Available: ${weightAvailable} kg`);
      setSnackbarSeverity('warning');
      setOpenSnackbar(true);
      return;
    }

    if (!producer || !productLine || !processingType || !quality) {
      setSnackbarMessage('Please select all required fields: Producer, Product Line, Processing Type, and Quality.');
      setSnackbarSeverity('warning');
      setOpenSnackbar(true);
      return;
    }

    const preprocessingData = {
      batchNumber: trimmedBatchNumber,
      weightProcessed: trimmedWeightProcessed,
      producer,
      productLine,
      processingType,
      quality,
      createdBy: session.user.name,
      notes: notes.trim() || null,
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/preprocessing`, preprocessingData, {
        timeout: 10000,
      });
      const { lotNumber, referenceNumber } = response.data.preprocessingData[0];
      setLotNumber(lotNumber || 'N/A');
      setReferenceNumber(referenceNumber || 'N/A');
      setSnackbarMessage(`Preprocessing started for batch ${trimmedBatchNumber} on ${trimmedWeightProcessed} kg! Lot Number: ${lotNumber || 'N/A'}`);
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      await fetchPreprocessingData();
      resetForm();
    } catch (error) {
      handleError('Failed to start preprocessing. Please try again.', error);
    }
  };

  const handleError = (message, error) => {
    console.error(message, error);
    setSnackbarMessage(message);
    setSnackbarSeverity('error');
    setOpenSnackbar(true);
  };

  const resetForm = () => {
    setRfid('');
    setRfidTag('');
    setWeightProcessed('');
    setBatchNumber('');
    setLotNumber('N/A');
    setReferenceNumber('N/A');
    setWeightAvailable(0);
    setTotalProcessedWeight(0);
    setFarmerName('');
    setReceivingDate('');
    setQCDate('');
    setTotalWeight('');
    setTotalBags('');
    setProducer('');
    setProductLine('');
    setProcessingType('');
    setQuality('');
    setNotes('');
  };

  const handleCloseHistory = () => {
    setOpenHistory(false);
  };

  const fetchPreprocessingData = useCallback(async () => {
    try {
      const [qcResponse, preprocessingResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/qc`, { timeout: 10000 }),
        axios.get(`${API_BASE_URL}/preprocessing`, { timeout: 10000 }),
      ]);
      const qcResult = qcResponse.data.allRows || [];
      const preprocessingResult = preprocessingResponse.data.allRows || preprocessingResponse.data;

      const finishedStatusMap = new Map();
      preprocessingResult.forEach(row => {
        const batchNumber = row.batchNumber.toLowerCase();
        finishedStatusMap.set(batchNumber, finishedStatusMap.get(batchNumber) || row.finished || false);
      });

      const preprocessingMap = new Map();
      preprocessingResult.forEach(row => {
        const key = `${row.batchNumber}-${row.processingType || 'unknown'}`;
        const existing = preprocessingMap.get(key);
        const rowDate = new Date(row.processingDate || row.createdAt || '1970-01-01');
        const existingDate = existing ? new Date(existing.processingDate || existing.createdAt || '1970-01-01') : new Date('1970-01-01');

        if (!existing || rowDate > existingDate) {
          preprocessingMap.set(key, {
            batchNumber: row.batchNumber,
            lotNumber: row.lotNumber || 'N/A',
            referenceNumber: row.referenceNumber || 'N/A',
            processingType: row.processingType,
            notes: row.notes || '',
            weightProcessed: parseFloat(row.weightProcessed || 0),
            producer: row.producer,
            productLine: row.productLine,
            quality: row.quality,
            processingDate: row.processingDate,
            finished: row.finished || false,
          });
        }
      });

      const qcRowMap = new Map();
      qcResult.forEach(batch => {
        const key = `${batch.batchNumber}-${batch.processingType || 'unknown'}`;
        const existing = qcRowMap.get(key);
        const batchDate = new Date(batch.lastProcessingDate || batch.startProcessingDate || '1970-01-01');
        const existingDate = existing ? new Date(existing.lastProcessingDate || existing.startProcessingDate || '1970-01-01') : new Date('1970-01-01');

        if (!existing || batchDate > existingDate) {
          qcRowMap.set(key, batch);
        }
      });

      const dedupedRows = Array.from(qcRowMap.values());

      const today = new Date();
      const formattedData = dedupedRows.map(batch => {
        const receivingDate = new Date(batch.receivingDate);
        let sla = 'N/A';
        if (!isNaN(receivingDate)) {
          const diffTime = Math.abs(today - receivingDate);
          sla = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        const preprocessingKey = `${batch.batchNumber}-${batch.processingType || 'unknown'}`;
        const preprocessingRow = preprocessingMap.get(preprocessingKey) || {};

        return {
          id: `${batch.batchNumber}-${batch.processingType || 'unknown'}`,
          batchNumber: batch.batchNumber,
          lotNumber: preprocessingRow.lotNumber || 'N/A',
          referenceNumber: preprocessingRow.referenceNumber || 'N/A',
          type: batch.type,
          producer: batch.producer || preprocessingRow.producer || 'Unknown',
          productLine: batch.productLine || preprocessingRow.productLine || 'Unknown',
          processingType: batch.processingType || 'unknown',
          quality: batch.quality || preprocessingRow.quality || 'Unknown',
          weight: parseFloat(batch.weight || 0),
          processedWeight: parseFloat(batch.processedWeight || preprocessingRow.weightProcessed || 0),
          availableWeight: parseFloat(batch.availableWeight || 0),
          startProcessingDate: batch.startProcessingDate ? new Date(batch.startProcessingDate).toISOString().slice(0, 10) : 'N/A',
          lastProcessingDate: batch.lastProcessingDate ? new Date(batch.lastProcessingDate).toISOString().slice(0, 10) : 'N/A',
          preprocessing_notes: preprocessingRow.notes || '',
          finished: finishedStatusMap.get(batch.batchNumber.toLowerCase()) || batch.finished || false,
          sla,
          overallQuality: batch.overallQuality,
          receivingDate: batch.receivingDate,
          qcDate: batch.qcDate,
          cherryScore: batch.cherryScore,
          cherryGroup: batch.cherryGroup,
          ripeness: batch.ripeness,
          color: batch.color,
          foreignMatter: batch.foreignMatter,
        };
      });

      const batchMap = new Map();
      dedupedRows.forEach(batch => {
        const key = batch.batchNumber;
        const preprocessingKey = `${batch.batchNumber}-${batch.processingType || 'unknown'}`;
        const preprocessingRow = preprocessingMap.get(preprocessingKey) || {};
        if (!batchMap.has(key)) {
          batchMap.set(key, {
            batchNumber: batch.batchNumber,
            lotNumber: preprocessingRow.lotNumber || 'N/A',
            referenceNumber: preprocessingRow.referenceNumber || 'N/A',
            type: batch.type,
            overallQuality: batch.overallQuality,
            weight: parseFloat(batch.weight || 0),
            availableWeight: parseFloat(batch.availableWeight || 0),
            receivingDate: batch.receivingDate,
            qcDate: batch.qcDate,
            cherryScore: batch.cherryScore,
            cherryGroup: batch.cherryGroup,
            ripeness: batch.ripeness,
            color: batch.color,
            foreignMatter: batch.foreignMatter,
            finished: finishedStatusMap.get(batch.batchNumber.toLowerCase()) || batch.finished || false,
          });
        }
      });

      const unprocessedBatches = Array.from(batchMap.values())
        .filter(batch => parseFloat(batch.availableWeight) > 0 && !batch.finished)
        .sort((a, b) => {
          if (a.type !== b.type) return a.type.localeCompare(b.type);
          if (a.cherryGroup !== b.cherryGroup) return a.cherryGroup.localeCompare(b.cherryGroup);
          if (a.ripeness !== b.ripeness) return a.ripeness.localeCompare(b.ripeness);
          if (a.color !== b.color) return a.color.localeCompare(b.color);
          if (a.foreignMatter !== b.foreignMatter) return a.foreignMatter.localeCompare(b.foreignMatter);
          if (a.overallQuality !== b.overallQuality) return a.overallQuality.localeCompare(b.overallQuality);
          return 0;
        });

      setUnprocessedBatches(unprocessedBatches);
      setPreprocessingData(formattedData);
    } catch (error) {
      handleError('Error fetching preprocessing data.', error);
    }
  }, []);

  const filteredPreprocessingData = producerFilter === 'All'
    ? preprocessingData.filter(row => parseFloat(row.processedWeight) > 0)
    : preprocessingData.filter(row => row.producer === producerFilter && parseFloat(row.processedWeight) > 0);

  useEffect(() => {
    fetchPreprocessingData();
  }, [fetchPreprocessingData]);

  const ITEM_HEIGHT = 48;
  const ITEM_PADDING_TOP = 8;
  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
        width: 250,
      },
    },
  };

  const producerOptions = {
    "": [" "],
    HQ: ["Regional Lot", "Micro Lot", "Experimental Lot", "Competition Lot"],
    BTM: ["Commercial Lot"],
  };

  const productLineOptions = {
    "": [" "],
    "Regional Lot": ["Natural", "Washed", "Pulped Natural"],
    "Micro Lot": ["Natural", "Washed", "Pulped Natural", "CM Natural", "CM Washed", "CM Pulped Natural", "Anaerobic Natural", "Anaerobic Washed", "Anaerobic Pulped Natural", "Aerobic Natural", "Aerobic Washed", "Aerobic Pulped Natural", "O2 Natural", "O2 Washed", "O2 Pulped Natural"],
    "Experimental Lot": ["CM Natural", "CM Washed", "CM Pulped Natural", "Anaerobic Natural", "Anaerobic Washed", "Anaerobic Pulped Natural", "Aerobic Natural", "Aerobic Washed", "Aerobic Pulped Natural", "O2 Natural", "O2 Washed", "O2 Pulped Natural"],
    "Competition Lot": ["CM Natural", "CM Washed", "CM Pulped Natural", "Anaerobic Natural", "Anaerobic Washed", "Anaerobic Pulped Natural", "Aerobic Natural", "Aerobic Washed", "Aerobic Pulped Natural", "O2 Natural", "O2 Washed", "O2 Pulped Natural"],
    "Commercial Lot": ["Natural", "Washed"],
  };

  const processingTypeOptions = {
    "": [" "],
    "Natural": ["Specialty", "G1", "G2", "G3", "G4"],
    "Washed": ["Specialty", "G1", "G2", "G3", "G4"],
    "Pulped Natural": ["Specialty"],
    "CM Natural": ["Specialty"],
    "CM Washed": ["Specialty"],
    "CM Pulped Natural": ["Specialty"],
    "Anaerobic Natural": ["Specialty"],
    "Anaerobic Washed": ["Specialty"],
    "Anaerobic Pulped Natural": ["Specialty"],
    "Aerobic Natural": ["Specialty"],
    "Aerobic Washed": ["Specialty"],
    "Aerobic Pulped Natural": ["Specialty"],
    "O2 Natural": ["Specialty"],
    "O2 Washed": ["Specialty"],
    "O2 Pulped Natural": ["Specialty"],
  };

  useEffect(() => {
    if (producer && !producerOptions[producer].includes(productLine)) {
      setProductLine('');
    }
  }, [producer]);

  useEffect(() => {
    if (productLine && !productLineOptions[productLine].includes(processingType)) {
      setProcessingType('');
    }
  }, [productLine]);

  useEffect(() => {
    if (processingType && !processingTypeOptions[processingType].includes(quality)) {
      setQuality('');
    }
  }, [processingType]);

  const unprocessedColumns = [
    { field: 'batchNumber', headerName: 'Batch Number', width: 180, sortable: true },
    { field: 'lotNumber', headerName: 'Lot Number', width: 180, sortable: true },
    { field: 'referenceNumber', headerName: 'Reference Number', width: 180, sortable: true },
    { field: 'type', headerName: 'Type', width: 130, sortable: true },
    { field: 'overallQuality', headerName: 'Overall Quality', width: 150, sortable: true },
    {
      field: 'action',
      headerName: 'Action',
      width: 180,
      sortable: false,
      renderCell: ({ row }) => (
        <Button
          variant="contained"
          color="warning"
          size="small"
          onClick={() => openFinishConfirmation(row.batchNumber)}
          disabled={row.finished || parseFloat(row.availableWeight) <= 0}
        >
          Mark as Complete
        </Button>
      ),
    },
    { field: 'weight', headerName: 'Total Weight (kg)', width: 180, sortable: true },
    { field: 'availableWeight', headerName: 'Available Weight (kg)', width: 180, sortable: true },
    { field: 'receivingDate', headerName: 'Receiving Date', width: 180, sortable: true },
    { field: 'qcDate', headerName: 'QC Date', width: 180, sortable: true },
    { field: 'cherryScore', headerName: 'Cherry Score', width: 150, sortable: true },
    { field: 'cherryGroup', headerName: 'Cherry Group', width: 150, sortable: true },
    { field: 'ripeness', headerName: 'Ripeness', width: 150, sortable: true },
    { field: 'color', headerName: 'Color', width: 150, sortable: true },
    { field: 'foreignMatter', headerName: 'Foreign Matter', width: 150, sortable: true },
  ];

  const columns = [
    { field: 'batchNumber', headerName: 'Batch Number', width: 160, sortable: true },
    { field: 'lotNumber', headerName: 'Lot Number', width: 180, sortable: true },
    { field: 'referenceNumber', headerName: 'Reference Number', width: 180, sortable: true },
    { field: 'type', headerName: 'Type', width: 100, sortable: true },
    { field: 'producer', headerName: 'Producer', width: 100, sortable: true },
    { field: 'productLine', headerName: 'Product Line', width: 150, sortable: true },
    { field: 'processingType', headerName: 'Processing Type', width: 160, sortable: true },
    { field: 'quality', headerName: 'Quality', width: 130, sortable: true },
    { field: 'weight', headerName: 'Total Weight (kg)', width: 180, sortable: true },
    { field: 'processedWeight', headerName: 'Processed Weight (kg)', width: 180, sortable: true },
    { field: 'availableWeight', headerName: 'Available Weight (kg)', width: 180, sortable: true },
    { field: 'startProcessingDate', headerName: 'Start Processing Date', width: 180, sortable: true },
    { field: 'lastProcessingDate', headerName: 'Last Processing Date', width: 180, sortable: true },
    { field: 'preprocessing_notes', headerName: 'Notes', width: 200, sortable: true },
    {
      field: 'finished',
      headerName: 'Finished',
      width: 100,
      sortable: true,
      renderCell: ({ value }) => (value ? 'Yes' : 'No'),
    },
  ];

  if (status === 'loading') {
    return <Typography>Loading...</Typography>;
  }

  if (!session?.user || !['admin', 'manager', 'preprocessing'].includes(session.user.role)) {
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
              Processing Station
            </Typography>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2} alignItems="center">
                <Grid item>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleRfidScan}
                    style={{ marginTop: '12px' }}
                  >
                    Get RFID Tag
                  </Button>
                </Grid>
                <Grid item xs>
                  <TextField
                    label="Batch Number Lookup"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder="Enter batch number to search"
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                <Grid item>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleBatchNumberSearch}
                    style={{ marginTop: '12px' }}
                  >
                    Search
                  </Button>
                </Grid>
              </Grid>

              <Grid container spacing={2} style={{ marginTop: '16px' }}>
                <Grid item xs={12}>
                  <TextField
                    label="Farmer Name"
                    value={farmerName || ''}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Lot Number"
                    value={lotNumber}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Reference Number"
                    value={referenceNumber}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Date Received"
                    value={receivingDate || ''}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Date QC"
                    value={qcDate || ''}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Total Weight (kg)"
                    value={totalWeight || ''}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Total Bags"
                    value={totalBags || ''}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
              </Grid>

              <Divider style={{ margin: '16px 0' }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Total Processed Weight (kg)"
                    value={totalProcessedWeight || '0.00'}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Weight Available (kg)"
                    value={weightAvailable || '0.00'}
                    InputProps={{
                      readOnly: true,
                      style: { color: weightAvailable <= 0 ? 'red' : 'inherit' },
                    }}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2} alignItems="center">
                <Grid item xs={6}>
                  <TextField
                    type="number"
                    label="Weight to Process (kg)"
                    value={weightProcessed}
                    onChange={(e) => setWeightProcessed(e.target.value)}
                    fullWidth
                    margin="normal"
                    inputProps={{ step: 0.01, min: 0 }}
                  />
                </Grid>
                <Grid item>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAllWeight}
                  >
                    Process All Weight
                  </Button>
                </Grid>
              </Grid>

              <Divider style={{ margin: '16px 0' }} />

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel id="pd-label">Producer</InputLabel>
                    <Select
                      labelId="pd-label"
                      id="pd"
                      value={producer}
                      onChange={(e) => setProducer(e.target.value)}
                      input={<OutlinedInput label="Producer" />}
                      MenuProps={MenuProps}
                    >
                      <MenuItem value=""><em>None</em></MenuItem>
                      <MenuItem value="HQ">HEQA</MenuItem>
                      <MenuItem value="BTM">BTM</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel id="pl-label">Product Line</InputLabel>
                    <Select
                      labelId="pl-label"
                      id="pl"
                      value={productLine}
                      onChange={(e) => setProductLine(e.target.value)}
                      input={<OutlinedInput label="Product Line" />}
                      MenuProps={MenuProps}
                      disabled={!producer}
                    >
                      <MenuItem value=""><em>None</em></MenuItem>
                      {producerOptions[producer]?.map((option) => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel id="pt-label">Processing Type</InputLabel>
                    <Select
                      labelId="pt-label"
                      id="pt"
                      value={processingType}
                      onChange={(e) => setProcessingType(e.target.value)}
                      input={<OutlinedInput label="Processing Type" />}
                      MenuProps={MenuProps}
                      disabled={!productLine}
                    >
                      <MenuItem value=""><em>None</em></MenuItem>
                      {productLineOptions[productLine]?.map((option) => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel id="ql-label">Quality</InputLabel>
                    <Select
                      labelId="ql-label"
                      id="ql"
                      value={quality}
                      onChange={(e) => setQuality(e.target.value)}
                      input={<OutlinedInput label="Quality" />}
                      MenuProps={MenuProps}
                      disabled={!processingType}
                    >
                      <MenuItem value=""><em>None</em></MenuItem>
                      {processingTypeOptions[processingType]?.map((option) => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Notes"
                    multiline
                    rows={5}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    fullWidth
                    margin="normal"
                  />
                </Grid>

                <Grid item>
                  <Button type="submit" variant="contained" color="success">
                    Send to Wet Mill
                  </Button>
                </Grid>
              </Grid>
            </form>

            <Grid container spacing={2} style={{ marginTop: '16px' }}>
              <Grid item>
                <Button variant="contained" color="info" onClick={showWeightHistory}>
                  Show Processing History
                </Button>
              </Grid>
            </Grid>

            <Snackbar
              open={openSnackbar}
              autoHideDuration={6000}
              onClose={() => setOpenSnackbar(false)}
            >
              <Alert onClose={() => setOpenSnackbar(false)} severity={snackbarSeverity}>
                {snackbarMessage}
              </Alert>
            </Snackbar>

            <Dialog open={openHistory} onClose={handleCloseHistory}>
              <DialogTitle>Weight Processing History</DialogTitle>
              <DialogContent>
                {weightHistory.length === 0 ? (
                  <Typography>No processing history available.</Typography>
                ) : (
                  weightHistory.map((history, index) => (
                    <div key={index} style={{ marginBottom: '16px' }}>
                      <Typography variant="h6">Batch: {history.batchNumber}</Typography>
                      <Typography>Lot Number: {history.lotNumber}</Typography>
                      <Typography>Reference Number: {history.referenceNumber}</Typography>
                      <Typography>Total Weight: {history.totalWeight} kg</Typography>
                      <Typography>Processed Weight: {history.totalProcessedWeight} kg</Typography>
                      <Typography>Available Weight: {history.weightAvailable} kg</Typography>
                      <Typography>Finished: {history.finished ? 'Yes' : 'No'}</Typography>
                      <Divider style={{ margin: '8px 0' }} />
                      <Typography variant="subtitle1">Processing Logs:</Typography>
                      {history.processedLogs.length === 0 ? (
                        <Typography>No processing logs available for this batch.</Typography>
                      ) : (
                        history.processedLogs.map((log, logIndex) => (
                          <div key={logIndex} style={{ marginLeft: '16px' }}>
                            <Typography>Processing Date: {new Date(log.processingDate).toISOString().slice(0, 10)}</Typography>
                            <Typography>Weight Processed: {log.weightProcessed} kg</Typography>
                            <Typography>Processing Type: {log.processingType}</Typography>
                            <Typography>Lot Number: {log.lotNumber}</Typography>
                            <Typography>Reference Number: {log.referenceNumber}</Typography>
                            {log.notes && <Typography>Notes: {log.notes}</Typography>}
                            <Divider style={{ margin: '4px 0' }} />
                          </div>
                        ))
                      )}
                    </div>
                  ))
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseHistory} color="primary">
                  Close
                </Button>
              </DialogActions>
            </Dialog>

            <Dialog
              open={openConfirmDialog}
              onClose={handleCancelFinish}
            >
              <DialogTitle>Confirm Mark as Complete</DialogTitle>
              <DialogContent>
                <Typography>
                  Are you sure you want to mark batch {selectedBatchNumber} as complete? This action cannot be undone.
                </Typography>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCancelFinish} color="primary" disabled={isFinishing}>
                  Cancel
                </Button>
                <Button
                  onClick={() => handleFinishBatch(selectedBatchNumber)}
                  color="warning"
                  variant="contained"
                  disabled={isFinishing}
                >
                  {isFinishing ? 'Processing...' : 'Confirm'}
                </Button>
              </DialogActions>
            </Dialog>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Pending Processing
            </Typography>
            <div style={{ height: 600, width: '100%' }}>
              <DataGrid
                rows={unprocessedBatches}
                columns={unprocessedColumns}
                pageSizeOptions={[5, 10, 20]}
                disableRowSelectionOnClick
                sortingOrder={['asc', 'desc']}
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
            </div>
          </CardContent>
        </Card>

        <Divider style={{ margin: '16px 0' }} />

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Processing Order Book
            </Typography>
            <FormControl sx={{ mb: 2, mt: 2, minWidth: 120 }}>
              <InputLabel id="producer-filter-label">Producer</InputLabel>
              <Select
                labelId="producer-filter-label"
                value={producerFilter}
                onChange={(e) => setProducerFilter(e.target.value)}
                label="Producer"
              >
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="HQ">HEQA</MenuItem>
                <MenuItem value="BTM">BTM</MenuItem>
              </Select>
            </FormControl>
            <div style={{ height: 1000, width: '100%' }}>
              <DataGrid
                rows={filteredPreprocessingData}
                columns={columns}
                pageSizeOptions={[5, 10, 20]}
                disableRowSelectionOnClick
                sortingOrder={['asc', 'desc']}
                getRowId={(row) => row.id}
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
    </Grid>
  );
};

export default PreprocessingStation;