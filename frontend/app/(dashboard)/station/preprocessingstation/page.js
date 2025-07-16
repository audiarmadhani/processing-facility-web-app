"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from "next-auth/react";
import {
  TextField,
  Box,
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
  Checkbox,
  ListItemText,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import axios from 'axios';
import axiosRetry from 'axios-retry';

const API_BASE_URL = 'https://processing-facility-backend.onrender.com/api';

// Configure axios-retry
axiosRetry(axios, { retries: 3, retryDelay: (retryCount) => retryCount * 2000 });

const PreprocessingStation = () => {
  const { data: session, status } = useSession();
  const [rfid, setRfid] = useState('');
  const [rfidTag, setRfidTag] = useState('');
  const [weightProcessed, setWeightProcessed] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [lotNumber, setLotNumber] = useState('N/A');
  const [referenceNumber, setReferenceNumber] = useState('N/A');
  const [openHistory, setOpenHistory] = useState(false);
  const [weightAvailable, setWeightAvailable] = useState('0.00');
  const [totalProcessedWeight, setTotalProcessedWeight] = useState('0.00');
  const [farmerName, setFarmerName] = useState('');
  const [receivingDate, setReceivingDate] = useState('');
  const [qcDate, setQCDate] = useState('');
  const [totalWeight, setTotalWeight] = useState('');
  const [totalBags, setTotalBags] = useState('');
  const [openSnackBar, setOpenSnackBar] = useState(false);
  const [snackBarMessage, setSnackBarMessage] = useState('');
  const [snackBarSeverity, setSnackBarSeverity] = useState('success');
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
  const [openMergeDialog, setOpenMergeDialog] = useState(false);
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [mergeNotes, setMergeNotes] = useState('');
  const [newBatchNumber, setNewBatchNumber] = useState('');
  const [openSplitDialog, setOpenSplitDialog] = useState(false);
  const [splitBatchNumber, setSplitBatchNumber] = useState('');
  const [splitCount, setSplitCount] = useState(2);
  const [splitWeight, setSplitWeight] = useState('');
  const [scannedRfids, setScannedRfids] = useState([]);
  const [rfidScanIndex, setRfidScanIndex] = useState(0);
  const [rfidScanMessage, setRfidScanMessage] = useState('');
  const [splitWeights, setSplitWeights] = useState([]);

  // Debug re-renders
  useEffect(() => {
    console.log('PreprocessingStation component rendered');
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().slice(0, 10); // YYYY-MM-DD
    } catch {
      return '';
    }
  };

  const parseWeightInput = (value) => {
    if (!value) return '';
    const cleaned = value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return cleaned;
  };

  const fetchRfid = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/get-rfid/Receiving`, { timeout: 15000 });
    const data = response.data;
    if (data.rfid && data.rfid !== '') {
      setScannedRfids((prev) => [...prev, data.rfid]);
      await axios.delete(`${API_BASE_URL}/clear-rfid/Receiving`, { timeout: 15000 });
      setRfidScanIndex((prev) => prev + 1);
      setRfidScanMessage(`RFID ${rfidScanIndex + 1} scanned successfully.`);
    } else {
      setRfidScanMessage('Please scan a new RFID card.');
    }
  } catch (error) {
    handleError('Error fetching RFID: ' + (error.response?.data?.error || error.message), error);
  } finally {
    setOpenSnackBar(true);
  }
};

  const fetchAvailableWeight = useCallback(async (batchNumber, totalWeight) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/preprocessing/${batchNumber}`, { timeout: 15000 });
      const preprocessingResponse = response.data;
      const totalProcessedWeight = parseFloat(preprocessingResponse.totalWeightProcessed || 0).toFixed(2);
      const weightAvailable = parseFloat(preprocessingResponse.weightAvailable || (totalWeight - totalProcessedWeight)).toFixed(2);

      return {
        weightAvailable,
        totalProcessedWeight,
        finished: preprocessingResponse.finished || false,
        lotNumber: preprocessingResponse.lotNumber || 'N/A',
        referenceNumber: preprocessingResponse.referenceNumber || 'N/A',
        mergedFrom: preprocessingResponse.mergedFrom || [],
      };
    } catch (error) {
      console.error('Error fetching available weight:', error);
      setSnackBarMessage(error.response?.data?.error || 'No preprocessing data found; using total weight.');
      setSnackBarSeverity('info');
      setOpenSnackBar(true);
      return {
        weightAvailable: totalWeight.toFixed(2),
        totalProcessedWeight: 0,
        finished: false,
        lotNumber: 'N/A',
        referenceNumber: 'N/A',
        mergedFrom: [],
      };
    }
  }, []);

  const fetchBatchData = useCallback(async (batchNumber) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/receiving/${batchNumber}`, { timeout: 15000 });
      const dataArray = response.data;
      if (!dataArray.length) throw new Error('No data found for the provided batch number.');
      const data = dataArray[0];
      const totalWeightNum = parseFloat(data.weight || 0);
      const { weightAvailable, totalProcessedWeight, finished, lotNumber, referenceNumber, mergedFrom } = 
        await fetchAvailableWeight(batchNumber, totalWeightNum);

      setFarmerName(data.farmerName || 'Multiple');
      setReceivingDate(formatDate(data.receivingDate));
      setQCDate(formatDate(data.qcDate));
      setTotalWeight(totalWeightNum.toFixed(2));
      setTotalBags(data.totalBags || 'N/A');
      setLotNumber(lotNumber);
      setReferenceNumber(referenceNumber);
      setWeightAvailable(weightAvailable);
      setTotalProcessedWeight(totalProcessedWeight);

      if (finished) {
        setSnackBarMessage(`Batch ${batchNumber} is already marked as complete.`);
        setSnackBarSeverity('warning');
      } else if (mergedFrom.length > 0) {
        setSnackBarMessage(`Data for merged batch ${batchNumber} retrieved successfully! Original batches: ${mergedFrom.join(', ')}`);
        setSnackBarSeverity('success');
      } else {
        setSnackBarMessage(`Data for batch ${batchNumber} retrieved successfully!`);
        setSnackBarSeverity('success');
      }
    } catch (error) {
      handleError('Error retrieving batch data. Please try again.', error);
    } finally {
      setOpenSnackBar(true);
    }
  }, [fetchAvailableWeight]);

  const handleRfidScan = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/get-rfid/Warehouse_Exit`, { timeout: 15000 });
      const data = response.data;

      if (data.rfid) {
        setRfid(data.rfid);
        setRfidTag(data.rfid);
        const receivingResponse = await axios.get(`${API_BASE_URL}/receivingrfid/${data.rfid}`, { timeout: 15000 });
        const receivingData = receivingResponse.data;

        if (receivingData && receivingData.length > 0) {
          const batchData = receivingData[0];
          let finalBatchNumber = batchData.batchNumber;
          let mergedData = null;

          // Check if the batch is merged
          if (batchData.merged) {
            const mergeResponse = await axios.get(`${API_BASE_URL}/batch-merges/original/${batchData.batchNumber}`, { timeout: 15000 });
            const mergeInfo = mergeResponse.data;
            if (!mergeInfo || !mergeInfo.new_batch_number) {
              throw new Error('Merged batch found, but no new batch number available.');
            }
            finalBatchNumber = mergeInfo.new_batch_number;

            // Fetch merged batch data
            const mergedResponse = await axios.get(`${API_BASE_URL}/receiving/${finalBatchNumber}`, { timeout: 15000 });
            if (!mergedResponse.data.length) {
              throw new Error('No data found for the merged batch.');
            }
            mergedData = mergedResponse.data[0];
          } else {
            mergedData = batchData;
          }

          const totalWeightNum = parseFloat(mergedData.weight || 0);
          setBatchNumber(finalBatchNumber);
          setFarmerName(mergedData.farmerName || 'Multiple');
          setReceivingDate(formatDate(mergedData.receivingDate));
          setQCDate(formatDate(mergedData.qcDate));
          setTotalWeight(totalWeightNum.toFixed(2));
          setTotalBags(mergedData.totalBags || 'N/A');
          const { weightAvailable, totalProcessedWeight, finished, lotNumber, referenceNumber, mergedFrom } = 
            await fetchAvailableWeight(finalBatchNumber, totalWeightNum);
          setWeightAvailable(weightAvailable);
          setTotalProcessedWeight(totalProcessedWeight);
          setLotNumber(lotNumber);
          setReferenceNumber(referenceNumber);

          if (finished) {
            setSnackBarMessage(`Batch ${finalBatchNumber} is already marked as complete.`);
            setSnackBarSeverity('warning');
          } else if (mergedFrom.length > 0) {
            setSnackBarMessage(`Data for merged batch ${finalBatchNumber} retrieved successfully! Original batches: ${mergedFrom.join(', ')}`);
            setSnackBarSeverity('success');
          } else {
            setSnackBarMessage(`Data for batch ${finalBatchNumber} retrieved successfully!`);
            setSnackBarSeverity('success');
          }

          await clearRfidData('Preprocessing');
        } else {
          throw new Error('No receiving data found for this RFID.');
        }
      } else {
        throw new Error('No RFID tag scanned yet.');
      }
    } catch (error) {
      handleError(error.message || 'Error retrieving data.', error);
    } finally {
      setOpenSnackBar(true);
    }
  }, [fetchAvailableWeight]);

  const clearRfidData = async (scannedAt) => {
    try {
      await axios.delete(`${API_BASE_URL}/scanning-rfid/${scannedAt}`, { timeout: 15000 });
    } catch (error) {
      console.error("Error clearing RFID data:", error);
    }
  };

  const handleAllWeight = () => {
    if (parseFloat(weightAvailable) > 0) {
      setWeightProcessed(weightAvailable);
    } else {
      setWeightProcessed('');
      setSnackBarMessage('No weight available to process.');
      setSnackBarSeverity('warning');
      setOpenSnackBar(true);
    }
  };

  const handleBatchNumberSearch = async () => {
    if (!batchNumber.trim()) {
      setSnackBarMessage('Please enter a batch number.');
      setSnackBarSeverity('warning');
      setOpenSnackBar(true);
      return;
    }
    await fetchBatchData(batchNumber.trim());
  };

  const handleFinishBatch = async (batchNumber) => {
    setIsFinishing(true);
    try {
      const response = await axios.put(`${API_BASE_URL}/preprocessing/${batchNumber}/finish`, 
        { createdBy: session?.user?.name || 'Unknown' }, 
        { timeout: 15000 }
      );
      setSnackBarMessage(response.data.message || `Batch ${batchNumber} marked as complete successfully!`);
      setSnackBarSeverity('success');
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
      const [batchesResponse, processedResponse, mergeResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/receiving`, { timeout: 15000 }),
        axios.get(`${API_BASE_URL}/preprocessing`, { timeout: 15000 }),
        axios.get(`${API_BASE_URL}/batch-merges`, { timeout: 15000 }),
      ]);
      const batches = Array.isArray(batchesResponse.data.allRows) ? batchesResponse.data.allRows : [];
      const processedWeights = Array.isArray(processedResponse.data.allRows) ? processedResponse.data.allRows : [];
      const mergeData = Array.isArray(mergeResponse.data) ? mergeResponse.data : [];

      const historyData = batches.map((batch) => {
        const processedLogs = processedWeights.filter(log => 
          log.batchNumber.toLowerCase() === batch.batchNumber.toLowerCase());
        const totalProcessedWeight = processedLogs.reduce((acc, log) => 
          acc + parseFloat(log.weightProcessed || 0), 0).toFixed(2);
        const weightAvailable = (parseFloat(batch.weight || 0) - totalProcessedWeight).toFixed(2);
        const mergeInfo = mergeData.find(m => 
          m.new_batch_number.toLowerCase() === batch.batchNumber.toLowerCase());
        
        return {
          batchNumber: batch.batchNumber,
          lotNumber: processedLogs.length > 0 ? processedLogs[processedLogs.length - 1].lotNumber || 'N/A' : 'N/A',
          referenceNumber: processedLogs.length > 0 ? processedLogs[processedLogs.length - 1].referenceNumber || 'N/A' : 'N/A',
          totalWeight: parseFloat(batch.weight || 0).toFixed(2),
          totalProcessedWeight,
          weightAvailable,
          finished: processedLogs.length > 0 ? processedLogs[0].finished : false,
          merged: batch.merged || false,
          mergedFrom: mergeInfo ? mergeInfo.original_batch_numbers : [],
          mergedAt: mergeInfo ? formatDate(mergeInfo.merged_at) : 'N/A',
          mergeCreatedBy: mergeInfo ? mergeInfo.created_by : 'N/A',
          mergeNotes: mergeInfo ? mergeInfo.notes || 'N/A' : 'N/A',
          processedLogs: processedLogs.map(log => ({
            processingDate: formatDate(log.processingDate),
            weightProcessed: parseFloat(log.weightProcessed || 0).toFixed(2),
            processingType: log.processingType || 'N/A',
            notes: log.notes || '',
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

  const handleOpenMergeDialog = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/new-batch-number`, { timeout: 15000 });
      setNewBatchNumber(response.data.newBatchNumber);
      setOpenMergeDialog(true);
    } catch (error) {
      handleError('Failed to fetch new batch number for merging.', error);
    }
  };

  const handleCloseMergeDialog = () => {
    setOpenMergeDialog(false);
    setSelectedBatches([]);
    setMergeNotes('');
    setNewBatchNumber('');
  };

  const handleMergeBatches = async () => {
    if (selectedBatches.length < 2) {
      setSnackBarMessage('Please select at least two batches to merge.');
      setSnackBarSeverity('warning');
      setOpenSnackBar(true);
      return;
    }

    // Validate same type
    const selectedBatchDetails = unprocessedBatches.filter(b => selectedBatches.includes(b.batchNumber));
    const type = selectedBatchDetails[0]?.type;
    if (!selectedBatchDetails.every(b => b.type === type)) {
      setSnackBarMessage('All selected batches must have the same type (e.g., Arabica or Robusta).');
      setSnackBarSeverity('error');
      setOpenSnackBar(true);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/merge`, {
        batchNumbers: selectedBatches,
        notes: mergeNotes.trim() || null,
        createdBy: session?.user?.name || 'Unknown',
      }, { timeout: 15000 });

      setSnackBarMessage(`Batches merged successfully into ${response.data.newBatchNumber} with total weight ${response.data.totalWeight} kg.`);
      setSnackBarSeverity('success');
      await fetchPreprocessingData();
      handleCloseMergeDialog();
    } catch (error) {
      const errorMessage = error.response?.data?.error || `Failed to merge batches: ${error.message}`;
      handleError(errorMessage, error);
    } finally {
      setOpenSnackBar(true);
    }
  };

  const handleOpenSplitDialog = (batchNumber) => {
    setSplitBatchNumber(batchNumber);
    setSplitCount(2);
    setSplitWeights(Array(2).fill('')); // Initialize with 2 empty weights
    setScannedRfids([]);
    setRfidScanIndex(0);
    setRfidScanMessage('');
    setOpenSplitDialog(true);
  };

  const handleSplitBatches = async () => {
    const availableWeight = parseFloat(unprocessedBatches.find(b => b.batchNumber === splitBatchNumber)?.availableWeight || 0);
    const totalSplitWeight = splitWeights.reduce((sum, w) => sum + parseFloat(w || 0), 0);

    if (totalSplitWeight <= 0) {
      setSnackBarMessage('Please enter valid weights for all splits.');
      setSnackBarSeverity('warning');
      setOpenSnackBar(true);
      return;
    }

    if (totalSplitWeight > availableWeight) {
      setSnackBarMessage(`Total split weight (${totalSplitWeight.toFixed(2)} kg) exceeds available weight (${availableWeight.toFixed(2)} kg).`);
      setSnackBarSeverity('error');
      setOpenSnackBar(true);
      return;
    }

    // Validate RFID scans based on splitCount - 1 (since first uses original RFID)
    if (scannedRfids.length < (splitCount - 1)) {
      setRfidScanMessage(`Please scan ${splitCount - scannedRfids.length} more RFID card(s).`);
      setSnackBarSeverity('warning');
      setOpenSnackBar(true);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/split`, {
        originalBatchNumber: splitBatchNumber,
        splitCount,
        splitWeights: splitWeights.map(w => parseFloat(w)),
        createdBy: session?.user?.name || 'Unknown',
        scannedRfids: scannedRfids, // Add scanned RFIDs to the payload
      }, { timeout: 15000 });

      setSnackBarMessage(`Batch ${splitBatchNumber} split successfully into ${splitCount} batches with new RFIDs assigned.`);
      setSnackBarSeverity('success');
      await fetchPreprocessingData();
      setOpenSplitDialog(false);
      setScannedRfids([]);
      setRfidScanIndex(0);
      setRfidScanMessage('');
    } catch (error) {
      const errorMessage = error.response?.data?.error || `Failed to split batch: ${error.message}`;
      handleError(errorMessage, error);
    } finally {
      setOpenSnackBar(true);
    }
  };

  const handleCloseSplitDialog = () => {
    setOpenSplitDialog(false);
    setSplitBatchNumber('');
    setSplitCount(2);
    setSplitWeights([]);
    setScannedRfids([]);
    setRfidScanIndex(0);
    setRfidScanMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedBatchNumber = batchNumber.trim();
    const parsedWeight = parseFloat(parseWeightInput(weightProcessed));

    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      setSnackBarMessage('Please enter a valid weight to process.');
      setSnackBarSeverity('warning');
      setOpenSnackBar(true);
      return;
    }

    if (parsedWeight > parseFloat(weightAvailable)) {
      setSnackBarMessage(`Cannot process more weight than available. Available: ${weightAvailable} kg`);
      setSnackBarSeverity('error');
      setOpenSnackBar(true);
      return;
    }

    if (!producer || !productLine || !processingType || !quality) {
      setSnackBarMessage('Please select all required fields: Producer, Product Line, Processing Type, and Quality.');
      setSnackBarSeverity('warning');
      setOpenSnackBar(true);
      return;
    }

    const preprocessingData = {
      batchNumber: trimmedBatchNumber,
      weightProcessed: parsedWeight,
      producer,
      productLine,
      processingType,
      quality,
      createdBy: session?.user?.name || 'Unknown',
      notes: notes.trim() || null,
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/preprocessing`, preprocessingData, { timeout: 15000 });
      const { lotNumber, referenceNumber } = response.data.preprocessingData[0] || {};
      setLotNumber(lotNumber || 'N/A');
      setReferenceNumber(referenceNumber || 'N/A');
      setSnackBarMessage(`Preprocessing started for batch ${trimmedBatchNumber} on ${parsedWeight} kg. Lot Number: ${lotNumber || 'N/A'}`);
      setSnackBarSeverity('success');
      setOpenSnackBar(true);
      await fetchPreprocessingData();
      resetForm();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 
        error.response?.status === 502 
          ? 'Server is temporarily unavailable. Please try again later.' 
          : `Failed to start preprocessing: ${error.message}`;
      handleError(errorMessage, error);
    }
  };

  const handleError = (message, error) => {
    console.error(message, error);
    setSnackBarMessage(message);
    setSnackBarSeverity('error');
    setOpenSnackBar(true);
  };

  const resetForm = () => {
    setRfid('');
    setRfidTag('');
    setWeightProcessed('');
    setBatchNumber('');
    setLotNumber('N/A');
    setReferenceNumber('N/A');
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
    console.log('fetchPreprocessingData called at', new Date().toISOString());
    try {
      const [receivingResponse, preprocessingResponse, qcResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/receiving`, { timeout: 15000 }),
        axios.get(`${API_BASE_URL}/preprocessing`, { timeout: 15000 }),
        axios.get(`${API_BASE_URL}/qc`, { timeout: 15000 }),
      ]);

      const receivingData = Array.isArray(receivingResponse.data.allRows)
        ? receivingResponse.data.allRows
        : [];
      if (!Array.isArray(receivingResponse.data.allRows)) {
        console.warn('Receiving data.allRows is not an array:', receivingResponse.data.allRows);
      }

      const preprocessingResult = Array.isArray(preprocessingResponse.data.allRows)
        ? preprocessingResponse.data.allRows
        : [];
      if (!Array.isArray(preprocessingResponse.data.allRows)) {
        console.warn('Preprocessing allRows is not an array:', preprocessingResponse.data.allRows);
      }

      const qcData = Array.isArray(qcResponse.data.allRows)
        ? qcResponse.data.allRows
        : [];
      if (!Array.isArray(qcResponse.data.allRows)) {
        console.warn('QC data.allRows is not an array:', qcResponse.data.allRows);
      }

      const receivingMap = new Map();
      receivingData.forEach(batch => {
        if (!batch.merged) {
          receivingMap.set(batch.batchNumber.toLowerCase(), {
            batchNumber: batch.batchNumber,
            type: batch.type || 'N/A',
            weight: parseFloat(batch.weight || 0),
            receivingDate: formatDate(batch.receivingDate),
            commodityType: batch.commodityType || 'N/A',
            totalBags: batch.totalBags || 'N/A',
            farmerName: batch.farmerName || 'N/A',
          });
        }
      });

      const qcMap = new Map();
      qcData.forEach(batch => {
        if (!batch.merged) {
          qcMap.set(batch.batchNumber.toLowerCase(), {
            qcDate: formatDate(batch.qcDate),
            cherryScore: batch.cherryScore ? parseFloat(batch.cherryScore).toFixed(3) : 'N/A',
            cherryGroup: batch.cherryGroup || 'N/A',
            ripeness: batch.ripeness || 'N/A',
            color: batch.color || 'N/A',
            foreignMatter: batch.foreignMatter || 'N/A',
            overallQuality: batch.overallQuality || 'N/A',
          });
        }
      });

      const batchProcessedWeight = new Map();
      preprocessingResult.forEach(row => {
        if (!row.merged) {
          const batchNumber = row.batchNumber.toLowerCase();
          const weight = parseFloat(row.weightProcessed || 0);
          batchProcessedWeight.set(batchNumber, (batchProcessedWeight.get(batchNumber) || 0) + weight);
        }
      });

      const formattedData = preprocessingResult.filter(row => !row.merged).map(row => {
        const batchNumberLower = row.batchNumber.toLowerCase();
        const receivingBatch = receivingMap.get(batchNumberLower) || {};
        const qcBatch = qcMap.get(batchNumberLower) || {};
        const totalWeight = parseFloat(receivingBatch.weight || 0).toFixed(2);
        const totalProcessedWeight = parseFloat(batchProcessedWeight.get(batchNumberLower) || 0).toFixed(2);
        const availableWeightRaw = totalWeight - totalProcessedWeight;
        const availableWeight = Math.abs(availableWeightRaw) < 0.01 ? '0.00' : availableWeightRaw.toFixed(2);

        return {
          id: `${row.id}-${row.batchNumber}`,
          batchNumber: row.batchNumber,
          type: receivingBatch.type || 'N/A',
          producer: row.producer || 'N/A',
          productLine: row.productLine || 'N/A',
          processingType: row.processingType || 'N/A',
          quality: row.quality || 'N/A',
          lotNumber: row.lotNumber || 'N/A',
          referenceNumber: row.referenceNumber || 'N/A',
          weight: totalWeight,
          processedWeight: parseFloat(row.weightProcessed || 0).toFixed(2),
          totalProcessedWeight: totalProcessedWeight,
          availableWeight: availableWeight,
          startProcessingDate: formatDate(row.processingDate),
          lastProcessingDate: formatDate(row.processingDate),
          preprocessingNotes: row.notes || 'N/A',
          finished: row.finished || false,
          receivingDate: receivingBatch.receivingDate || 'N/A',
          qcDate: qcBatch.qcDate || 'N/A',
          cherryScore: qcBatch.cherryScore || 'N/A',
          cherryGroup: qcBatch.cherryGroup || 'N/A',
          ripeness: qcBatch.ripeness || 'N/A',
          color: qcBatch.color || 'N/A',
          foreignMatter: qcBatch.foreignMatter || 'N/A',
          overallQuality: qcBatch.overallQuality || 'N/A',
          mergedFrom: row.mergedFrom || [],
        };
      });

      const batchAvailableWeight = new Map();

      formattedData.forEach(row => {
        const batchNumber = row.batchNumber.toLowerCase();
        if (!row.finished && parseFloat(row.availableWeight) > 0 && !row.merged) {
          batchAvailableWeight.set(batchNumber, {
            ...row,
            id: row.batchNumber,
            processedWeight: parseFloat(batchProcessedWeight.get(batchNumber) || 0).toFixed(2),
          });
        }
      });

      receivingData.forEach(batch => {
        const batchNumberLower = batch.batchNumber.toLowerCase();
        if (!batchAvailableWeight.has(batchNumberLower) && batch.commodityType !== 'Green Bean' && !batch.merged) {
          const totalWeight = parseFloat(batch.weight || 0);
          const processedWeight = parseFloat(batchProcessedWeight.get(batchNumberLower) || 0);
          const availableWeightRaw = totalWeight - processedWeight;
          const availableWeight = Math.abs(availableWeightRaw) < 0.01 ? '0.00' : availableWeightRaw.toFixed(2);
          const isFinished = preprocessingResult.some(row => 
            row.batchNumber.toLowerCase() === batchNumberLower && row.finished
          );
          const qcBatch = qcMap.get(batchNumberLower) || {};

          if (parseFloat(availableWeight) > 0 && !isFinished) {
            batchAvailableWeight.set(batchNumberLower, {
              id: batch.batchNumber,
              batchNumber: batch.batchNumber,
              type: batch.type || 'N/A',
              weight: totalWeight.toFixed(2),
              totalProcessedWeight: processedWeight.toFixed(2),
              availableWeight: availableWeight,
              receivingDate: formatDate(batch.receivingDate),
              qcDate: qcBatch.qcDate || 'N/A',
              cherryScore: qcBatch.cherryScore || 'N/A',
              cherryGroup: qcBatch.cherryGroup || 'N/A',
              ripeness: qcBatch.ripeness || 'N/A',
              color: qcBatch.color || 'N/A',
              foreignMatter: qcBatch.foreignMatter || 'N/A',
              overallQuality: qcBatch.overallQuality || 'N/A',
              finished: false,
              producer: 'N/A',
              productLine: 'N/A',
              processingType: 'N/A',
              quality: 'N/A',
              lotNumber: 'N/A',
              referenceNumber: 'N/A',
              startProcessingDate: 'N/A',
              preprocessingNotes: 'N/A',
              totalBags: batch.totalBags || 'N/A',
              farmerName: batch.farmerName || 'N/A',
              mergedFrom: [],
            });
          }
        }
      });

      const unprocessedBatches = Array.from(batchAvailableWeight.values()).sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        if (a.cherryGroup !== b.cherryGroup) return a.cherryGroup.localeCompare(b.cherryGroup);
        if (a.ripeness !== b.ripeness) return a.ripeness.localeCompare(b.ripeness);
        if (a.color !== b.color) return a.color.localeCompare(b.color);
        if (a.foreignMatter !== b.foreignMatter) return a.foreignMatter.localeCompare(b.foreignMatter);
        if (a.overallQuality !== b.overallQuality) return a.overallQuality.localeCompare(b.cherryGroup);
        return 0;
      });

      console.log('Unprocessed Batches:', unprocessedBatches);
      setUnprocessedBatches(unprocessedBatches);
      setPreprocessingData(formattedData);
    } catch (error) {
      console.error('Error fetching preprocessing data:', error);
      setSnackBarMessage(`Error fetching preprocessing data: ${error.message}`);
      setSnackBarSeverity('error');
      setOpenSnackBar(true);
    }
  }, []);

  const filteredPreprocessingData = producerFilter === 'All'
    ? preprocessingData
    : preprocessingData.filter(row => row.producer.includes(producerFilter));

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
    "": [""],
    HQ: ["Regional Lot", "Micro Lot", "Experimental Lot", "Competition Lot"],
    BTM: ["Commercial Lot"],
  };

  const productLineOptions = {
    "": [""],
    "Regional Lot": ["Natural", "Washed", "Pulped Natural"],
    "Micro Lot": [
      "Natural", "Washed", "Pulped Natural",
      "CM Natural", "CM Washed", "CM Pulped Natural",
      "Anaerobic Natural", "Anaerobic Washed", "Anaerobic Pulped Natural",
      "Aerobic Natural", "Aerobic Washed", "Aerobic Pulped Natural",
      "O2 Natural", "O2 Washed", "O2 Pulped Natural"
    ],
    "Experimental Lot": [
      "CM Natural", "CM Washed", "CM Pulped Natural",
      "Anaerobic Natural", "Anaerobic Washed", "Anaerobic Pulped Natural",
      "Aerobic Natural", "Aerobic Washed", "Aerobic Pulped Natural",
      "O2 Natural", "O2 Washed", "O2 Pulped Natural"
    ],
    "Competition Lot": [
      "CM Natural", "CM Washed", "CM Pulped Natural",
      "Anaerobic Natural", "Anaerobic Washed", "Anaerobic Pulped Natural",
      "Aerobic Natural", "Aerobic Washed", "Aerobic Pulped Natural",
      "O2 Natural", "O2 Washed", "O2 Pulped Natural"
    ],
    "Commercial Lot": ["Natural", "Washed"],
  };

  const processingTypeOptions = {
    "": [""],
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
    {
      field: 'select',
      headerName: 'Select',
      width: 100,
      sortable: false,
      renderCell: ({ row }) => (
        <Checkbox
          checked={selectedBatches.includes(row.batchNumber)}
          onChange={(e) => {
            setSelectedBatches(prev => 
              e.target.checked 
                ? [...prev, row.batchNumber]
                : prev.filter(b => b !== row.batchNumber)
            );
          }}
          disabled={row.finished || parseFloat(row.availableWeight) <= 0 || row.commodityType === 'Green Bean'}
        />
      ),
    },
    { field: 'batchNumber', headerName: 'Batch Number', width: 180, sortable: true },
    { field: 'type', headerName: 'Type', width: 130, sortable: true },
    { field: 'farmerName', headerName: 'Farmer Name', width: 150, sortable: true },
    { field: 'totalBags', headerName: 'Total Bags', width: 130, sortable: true },
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
    {
      field: 'split',
      headerName: 'Split Batch',
      width: 180,
      sortable: false,
      renderCell: ({ row }) => (
        <Button
          variant="contained"
          color="secondary"
          size="small"
          onClick={() => handleOpenSplitDialog(row.batchNumber)}
          disabled={row.finished || parseFloat(row.availableWeight) <= 0}
        >
          Split Batch
        </Button>
      ),
    },
    { field: 'weight', headerName: 'Total Weight (kg)', width: 180, sortable: true },
    { field: 'totalProcessedWeight', headerName: 'Processed Weight (kg)', width: 180, sortable: true },
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
    { 
      field: 'batchNumber', 
      headerName: 'Batch Number', 
      width: 180, 
      sortable: true,
      groupable: true,
      aggregable: false,
    },
    { field: 'lotNumber', headerName: 'Lot Number', width: 180, sortable: true },
    { field: 'referenceNumber', headerName: 'Reference Number', width: 180, sortable: true },
    { field: 'type', headerName: 'Type', width: 100, sortable: true },
    { field: 'producer', headerName: 'Producer', width: 100, sortable: true },
    { field: 'productLine', headerName: 'Product Line', width: 150, sortable: true },
    { field: 'processingType', headerName: 'Processing Type', width: 200, sortable: true },
    { field: 'quality', headerName: 'Quality', width: 130, sortable: true },
    { field: 'weight', headerName: 'Total Weight (kg)', width: 180, sortable: true },
    { field: 'processedWeight', headerName: 'Processed Weight (kg)', width: 180, sortable: true },
    { field: 'totalProcessedWeight', headerName: 'Total Processed Weight (kg)', width: 180, sortable: true },
    { field: 'availableWeight', headerName: 'Available Weight (kg)', width: 180, sortable: true },
    { field: 'startProcessingDate', headerName: 'Processing Date', width: 180, sortable: true },
    { field: 'preprocessingNotes', headerName: 'Notes', weight: 200, sortable: true },
    {
      field: 'mergedFrom',
      headerName: 'Merged From',
      width: 200,
      sortable: true,
      renderCell: ({ value }) => (value && value.length > 0 ? value.join(', ') : 'N/A'),
    },
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
                    sx={{ mt: 1.5 }}
                    fullWidth
                  >
                    Get RFID Tag
                  </Button>
                </Grid>
              </Grid>
              <Grid container spacing={2} alignItems="center">
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
                    sx={{ mt: 1.5 }}
                  >
                    Search
                  </Button>
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12}>
                  <TextField
                    label="Farmer Name"
                    value={farmerName || ''}
                    InputProps={{ readOnly: true }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Lot Number"
                    value={lotNumber}
                    InputProps={{ readOnly: true }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Reference Number"
                    value={referenceNumber}
                    InputProps={{ readOnly: true }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Date Received"
                    value={receivingDate || ''}
                    InputProps={{ readOnly: true }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Date QC"
                    value={qcDate || ''}
                    InputProps={{ readOnly: true }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Total Weight (kg)"
                    value={totalWeight || ''}
                    InputProps={{ readOnly: true }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Total Bags"
                    value={totalBags || ''}
                    InputProps={{ readOnly: true }}
                    fullWidth
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

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
                      style: { color: parseFloat(weightAvailable) <= 0 ? 'red' : 'inherit' },
                    }}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2} alignItems="center">
                <Grid item xs={6}>
                  <TextField
                    label="Weight to Process (kg)"
                    value={weightProcessed}
                    onChange={(e) => setWeightProcessed(parseWeightInput(e.target.value))}
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

              <Divider sx={{ my: 2 }} />

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

            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item>
                <Button variant="contained" color="info" onClick={showWeightHistory}>
                  Show Processing History
                </Button>
              </Grid>
            </Grid>

            <Snackbar
              open={openSnackBar}
              autoHideDuration={6000}
              onClose={() => setOpenSnackBar(false)}
            >
              <Alert onClose={() => setOpenSnackBar(false)} severity={snackBarSeverity}>
                {snackBarMessage}
              </Alert>
            </Snackbar>

            <Dialog open={openHistory} onClose={handleCloseHistory}>
              <DialogTitle>Weight Processing History</DialogTitle>
              <DialogContent>
                {weightHistory.length === 0 ? (
                  <Typography>No processing history available.</Typography>
                ) : (
                  weightHistory.map((history, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Typography variant="h6">Batch: {history.batchNumber}</Typography>
                      {history.merged && (
                        <>
                          <Typography>Status: Merged</Typography>
                          <Typography>Merged From: {history.mergedFrom.join(', ') || 'N/A'}</Typography>
                          <Typography>Merged At: {history.mergedAt}</Typography>
                          <Typography>Merged By: {history.mergeCreatedBy}</Typography>
                          {history.mergeNotes !== 'N/A' && (
                            <Typography>Merge Notes: {history.mergeNotes}</Typography>
                          )}
                          <Divider sx={{ my: 1 }} />
                        </>
                      )}
                      <Typography>Lot Number: {history.lotNumber}</Typography>
                      <Typography>Reference Number: {history.referenceNumber}</Typography>
                      <Typography>Total Weight: {history.totalWeight} kg</Typography>
                      <Typography>Processed Weight: {history.totalProcessedWeight} kg</Typography>
                      <Typography>Available Weight: {history.weightAvailable} kg</Typography>
                      <Typography>Finished: {history.finished ? 'Yes' : 'No'}</Typography>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle1">Processing Logs:</Typography>
                      {history.processedLogs.length === 0 ? (
                        <Typography>No processing logs available for this batch.</Typography>
                      ) : (
                        history.processedLogs.map((log, logIndex) => (
                          <Box key={logIndex} sx={{ ml: 2 }}>
                            <Typography>Processing Date: {log.processingDate}</Typography>
                            <Typography>Weight Processed: {log.weightProcessed} kg</Typography>
                            <Typography>Processing Type: {log.processingType}</Typography>
                            <Typography>Lot Number: {log.lotNumber}</Typography>
                            <Typography>Reference Number: {log.referenceNumber}</Typography>
                            {log.notes && <Typography>Notes: {log.notes}</Typography>}
                            <Divider sx={{ my: 0.5 }} />
                          </Box>
                        ))
                      )}
                    </Box>
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

            <Dialog
              open={openMergeDialog}
              onClose={handleCloseMergeDialog}
            >
              <DialogTitle>Merge Batches</DialogTitle>
              <DialogContent>
                <Typography>Select batches to merge into new batch: {newBatchNumber}</Typography>
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel id="merge-batches-label">Select Batches</InputLabel>
                  <Select
                    labelId="merge-batches-label"
                    multiple
                    value={selectedBatches}
                    onChange={(e) => setSelectedBatches(e.target.value)}
                    input={<OutlinedInput label="Select Batches" />}
                    renderValue={(selected) => selected.join(', ')}
                    MenuProps={MenuProps}
                  >
                    {unprocessedBatches.map((batch) => (
                      <MenuItem
                        key={batch.batchNumber}
                        value={batch.batchNumber}
                        disabled={batch.finished || parseFloat(batch.availableWeight) <= 0 || batch.commodityType === 'Green Bean'}
                      >
                        <Checkbox checked={selectedBatches.includes(batch.batchNumber)} />
                        <ListItemText primary={`${batch.batchNumber} (${batch.type}, ${batch.availableWeight} kg)`} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Merge Notes"
                  multiline
                  rows={4}
                  value={mergeNotes}
                  onChange={(e) => setMergeNotes(e.target.value)}
                  fullWidth
                  margin="normal"
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseMergeDialog} color="primary">
                  Cancel
                </Button>
                <Button
                  onClick={handleMergeBatches}
                  color="primary"
                  variant="contained"
                  disabled={selectedBatches.length < 2}
                >
                  Merge
                </Button>
              </DialogActions>
            </Dialog>

            <Dialog
              open={openSplitDialog}
              onClose={handleCloseSplitDialog}
            >
              <DialogTitle>Split Batch {splitBatchNumber}</DialogTitle>
              <DialogContent>
                <Typography>Enter details to split batch into new batches with suffix -SB-xxx:</Typography>
                <TextField
                  label="Number of Splits"
                  type="number"
                  value={splitCount}
                  onChange={(e) => {
                    const newCount = Math.max(2, parseInt(e.target.value) || 2);
                    setSplitCount(newCount);
                    setSplitWeights(Array(newCount).fill('')); // Reset weights array
                    setScannedRfids([]); // Reset RFIDs when split count changes
                    setRfidScanIndex(0);
                    setRfidScanMessage('');
                  }}
                  fullWidth
                  margin="normal"
                  inputProps={{ min: 2 }}
                />
                {Array.from({ length: splitCount }, (_, index) => (
                  <TextField
                    key={index}
                    label={`Weight for Split ${index + 1} (kg)`}
                    type="number"
                    value={splitWeights[index] || ''}
                    onChange={(e) => {
                      const newWeights = [...splitWeights];
                      newWeights[index] = parseWeightInput(e.target.value);
                      setSplitWeights(newWeights);
                    }}
                    fullWidth
                    margin="normal"
                    inputProps={{ step: 0.01, min: 0 }}
                    helperText={index === 0 ? `Total available weight: ${weightAvailable} kg` : ''}
                  />
                ))}
                <Typography sx={{ mt: 2 }}>
                  {`Scan ${splitCount - 1} new RFID card(s) for the split batches (first uses original RFID).`}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={fetchRfid}
                  sx={{ mt: 1 }}
                  disabled={scannedRfids.length >= (splitCount - 1)}
                >
                  Scan Next RFID
                </Button>
                <Typography sx={{ mt: 2 }}>
                  {`Scan ${splitCount - 1} new RFID card(s) for the split batches (first uses original RFID).`}
                </Typography>
                <Typography color={rfidScanMessage.includes('Please') ? 'error' : 'inherit'}>
                  {rfidScanMessage}
                </Typography>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseSplitDialog} color="primary">
                  Cancel
                </Button>
                <Button
                  onClick={handleSplitBatches}
                  color="secondary"
                  variant="contained"
                  disabled={!splitWeights.every(w => parseFloat(w) > 0) || scannedRfids.length < (splitCount - 1)}
                >
                  Split
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
            <Box sx={{ mb: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleOpenMergeDialog}
                disabled={selectedBatches.length < 2}
              >
                Merge Batches
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => handleOpenSplitDialog(selectedBatches[0] || '')}
                sx={{ ml: 2 }}
                disabled={!selectedBatches.length || selectedBatches.length > 1}
              >
                Split Batch
              </Button>
            </Box>
            <Box sx={{ height: 600, width: '100%' }}>
              <DataGrid
                rows={unprocessedBatches}
                columns={unprocessedColumns}
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
            </Box>
          </CardContent>
        </Card>

        <Divider sx={{ my: 2 }} />

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
            <Box sx={{ height: 1000, width: '100%' }}>
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
                treeData
                getTreeDataPath={(row) => [row.batchNumber, row.id]}
                groupingColDef={{
                  headerName: 'Batch Number',
                  width: 160,
                }}
                defaultGroupingExpansionDepth={-1}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default PreprocessingStation;