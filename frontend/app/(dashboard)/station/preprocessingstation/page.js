"use client";

import React, { useState, useEffect } from 'react';
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

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const PreprocessingStation = () => {
  const { data: session, status } = useSession();
  const [rfid, setRfid] = useState('');
  const [rfidTag, setRfidTag] = useState('');
  const [weightProcessed, setWeightProcessed] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
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

  const fetchAvailableWeight = async (batchNumber, totalWeight) => {
    try {
      const response = await fetch(`https://processing-facility-backend.onrender.com/api/preprocessing/${batchNumber}`);
      if (!response.ok) throw new Error('Failed to fetch preprocessing data');
      const preprocessingResponse = await response.json();
      if (preprocessingResponse && !isNaN(parseFloat(preprocessingResponse.totalWeightProcessed))) {
        const totalProcessedWeight = parseFloat(preprocessingResponse.totalWeightProcessed);
        const weightAvailable = totalWeight - totalProcessedWeight;
        return { weightAvailable, totalProcessedWeight };
      } else {
        return { weightAvailable: totalWeight, totalProcessedWeight: 0 };
      }
    } catch (error) {
      console.error('Error fetching available weight:', error);
      return { weightAvailable: totalWeight, totalProcessedWeight: 0 };
    }
  };

  const fetchBatchData = async (batchNumber) => {
    try {
      const response = await fetch(`https://processing-facility-backend.onrender.com/api/receiving/${batchNumber}`);
      if (!response.ok) throw new Error('Failed to fetch receiving data');
  
      const dataArray = await response.json();
      if (!dataArray.length) throw new Error('No data found for the provided batch number.');
  
      const data = dataArray[0];
      const { weightAvailable, totalProcessedWeight } = await fetchAvailableWeight(batchNumber, data.weight);

      setFarmerName(data.farmerName);
      setReceivingDate(data.receivingDateTrunc);
      setQCDate(data.qcDateTrunc);
      setTotalWeight(data.weight);
      setTotalBags(data.totalBags);
      setWeightAvailable(weightAvailable);
      setTotalProcessedWeight(totalProcessedWeight);

      setSnackbarMessage(`Data for batch ${batchNumber} retrieved successfully!`);
      setSnackbarSeverity('success');
    } catch (error) {
      handleError('Error retrieving batch data. Please try again.', error);
    } finally {
      setOpenSnackbar(true);
    }
  };

  const handleRfidScan = async () => {
    try {
      const response = await fetch(`https://processing-facility-backend.onrender.com/api/get-rfid/Warehouse_Exit`);
      if (!response.ok) throw new Error(`Failed to fetch RFID: ${response.status}`);
      const data = await response.json();

      if (data.rfid) {
        setRfid(data.rfid);
        setRfidTag(data.rfid);
        const receivingResponse = await fetch(`https://processing-facility-backend.onrender.com/api/receivingrfid/${data.rfid}`);
        if (!receivingResponse.ok) throw new Error(`Failed to fetch receiving data: ${receivingResponse.status}`);
        const receivingData = await receivingResponse.json();

        if (receivingData && receivingData.length > 0) {
          const batchData = receivingData[0];
          setBatchNumber(batchData.batchNumber);
          setFarmerName(batchData.farmerName);
          setReceivingDate(batchData.receivingDateTrunc || '');
          setQCDate(batchData.qcDateTrunc || '');
          setTotalWeight(batchData.weight || '');
          setTotalBags(batchData.totalBags || '');
          const { weightAvailable, totalProcessedWeight } = await fetchAvailableWeight(batchData.batchNumber, batchData.weight);
          setWeightAvailable(weightAvailable);
          setTotalProcessedWeight(totalProcessedWeight);

          setSnackbarMessage(`Data for batch ${batchData.batchNumber} retrieved successfully!`);
          setSnackbarSeverity('success');

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
      console.error('Error fetching batch number or receiving data:', error);
      setSnackbarMessage('Error retrieving data. Please try again.');
      setSnackbarSeverity('error');
    } finally {
      setOpenSnackbar(true);
    }
  };

  const clearRfidData = async (scannedAt) => {
    try {
      const response = await fetch(`https://processing-facility-backend.onrender.com/api/clear-rfid/${scannedAt}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(`Failed to clear RFID Data: ${response.status}`);
    } catch (error) {
      console.error("Error clearing RFID Data:", error);
    }
  };

  const handleAllWeight = () => {
    if (weightAvailable > 0) {
      setWeightProcessed(weightAvailable.toFixed(2));
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

  const fetchWeightHistory = async () => {
    try {
      const batchesResponse = await fetch("https://processing-facility-backend.onrender.com/api/receiving");
      const batches = await batchesResponse.json();
      const processedResponse = await fetch("https://processing-facility-backend.onrender.com/api/preprocessing");
      const processedWeights = await processedResponse.json();

      const historyData = batches.map((batch) => {
        const processedLogs = processedWeights.filter(log => log.batchNumber === batch.batchNumber);
        const totalProcessedWeight = processedLogs.reduce((acc, log) => acc + parseFloat(log.weightProcessed || 0), 0);
        const weightAvailable = batch.weight - totalProcessedWeight;
        return {
          batchNumber: batch.batchNumber,
          totalWeight: batch.weight,
          totalProcessedWeight: totalProcessedWeight.toFixed(2),
          weightAvailable: weightAvailable.toFixed(2),
          processedLogs: processedLogs.map(log => ({
            processingDate: log.processingDate,
            weightProcessed: parseFloat(log.weightProcessed || 0).toFixed(2),
            notes: log.notes,
          })),
        };
      });

      setWeightHistory(historyData);
      setOpenHistory(true);
    } catch (error) {
      console.error("Error fetching weight history:", error);
    }
  };

  const showWeightHistory = () => {
    fetchWeightHistory();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedBatchNumber = batchNumber.trim();
    const trimmedWeightProcessed = parseFloat(weightProcessed);

    console.log("trimmedWeightProcessed:", trimmedWeightProcessed);
    console.log("weightAvailable:", weightAvailable);

    if (isNaN(trimmedWeightProcessed) || trimmedWeightProcessed <= 0) {
      setSnackbarMessage('Please enter a valid weight to process.');
      setSnackbarSeverity('warning');
      setOpenSnackbar(true);
      return;
    }

    if (trimmedWeightProcessed > weightAvailable) {
      setSnackbarMessage(`Cannot process more weight than available. Available: ${weightAvailable.toFixed(2)} kg`);
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
      const response = await fetch('https://processing-facility-backend.onrender.com/api/preprocessing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preprocessingData),
      });
      if (!response.ok) throw new Error('Failed to start processing');

      setSnackbarMessage(`Preprocessing started for batch ${trimmedBatchNumber} on ${trimmedWeightProcessed.toFixed(2)} kg!`);
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

  const fetchPreprocessingData = async () => {
    try {
      const response = await fetch('https://processing-facility-backend.onrender.com/api/qc');
      const result = await response.json();
      const pendingPreprocessingData = result.allRows || [];

      const today = new Date();
      const formattedData = pendingPreprocessingData.map(batch => {
        const receivingDate = new Date(batch.receivingDate);
        let sla = 'N/A';

        if (!isNaN(receivingDate)) {
          const diffTime = Math.abs(today - receivingDate);
          sla = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        return {
          ...batch,
          id: `${batch.batchNumber}-${batch.processingType || 'unknown'}`, // Unique ID
          sla,
          startProcessingDate: batch.startProcessingDate ? new Date(batch.startProcessingDate).toISOString().slice(0, 10) : 'N/A',
          lastProcessingDate: batch.lastProcessingDate ? new Date(batch.lastProcessingDate).toISOString().slice(0, 10) : 'N/A',
        };
      });
      const unprocessedBatches = formattedData.filter(batch => parseFloat(batch.availableWeight) > 0);

      const sortedUnprocessedBatches = unprocessedBatches.sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        if (a.cherryGroup !== b.cherryGroup) return a.cherryGroup.localeCompare(b.cherryGroup);
        if (a.ripeness !== b.ripeness) return a.ripeness.localeCompare(b.ripeness);
        if (a.color !== b.color) return a.color.localeCompare(b.color);
        if (a.foreignMatter !== b.foreignMatter) return a.foreignMatter.localeCompare(b.foreignMatter);
        if (a.overallQuality !== b.overallQuality) return a.overallQuality.localeCompare(b.overallQuality);
        return 0;
      });

      const processedBatches = formattedData.filter(batch => parseFloat(batch.processedWeight) > 0);

      // const sortedDataType = processedBatches.sort((a, b) => {
        // if (a.type !== b.type) return a.type.localeCompare(b.type);
        // return 0;
      // });

      // const sortedData = sortedDataType.sort((a, b) => {
        // if (a.startProcessingDate === 'N/A' && b.startProcessingDate !== 'N/A') return -1;
        // if (a.startProcessingDate !== 'N/A' && b.startProcessingDate === 'N/A') return 1;
        // return parseFloat(b.weightAvailable) - parseFloat(a.weightAvailable);
      // });

      setPreprocessingData(processedBatches);
      setUnprocessedBatches(sortedUnprocessedBatches);
    } catch (error) {
      console.error('Error fetching preprocessing data:', error);
    }
  };

  useEffect(() => {
    fetchPreprocessingData();
  }, []);

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
    HQ: ["Regional Lot", "Micro Lot", "Experimental Lot"],
    BTM: ["Commercial Lot"],
  };

  const productLineOptions = {
    "": [" "],
    "Regional Lot": ["Pulped Natural", "Washed"],
    "Micro Lot": ["Natural", "Washed", "Anaerobic Natural", "Anaerobic Washed", "Anaerobic Honey", "CM Natural", "CM Washed", "CM Honey"],
    "Experimental Lot": ["CM Natural", "CM Washed", "CM Honey"],
    "Commercial Lot": ["Washed", "Natural"],
  };

  const processingTypeOptions = {
    "": [" "],
    "Pulped Natural": ["Specialty"],
    "Washed": ["Specialty", "G1", "G2", "G3", "G4"],
    "Natural": ["Specialty", "G1", "G2", "G3", "G4"],
    "Anaerobic Natural": ["Specialty"],
    "Anaerobic Washed": ["Specialty"],
    "Anaerobic Honey": ["Specialty"],
    "CM Natural": ["Specialty"],
    "CM Washed": ["Specialty"],
    "CM Honey": ["Specialty"],
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

  const columns = [
    { field: 'batchNumber', headerName: 'Batch Number', width: 160, sortable: true },

    { field: 'type', headerName: 'Type', width: 100, sortable: true },
    { field: 'producer', headerName: 'Producer', width: 100, sortable: true },
    { field: 'productLine', headerName: 'Product Line', width: 150, sortable: true },
    { field: 'processingType', headerName: 'Processing Type', width: 160, sortable: true },
    { field: 'quality', headerName: 'Quality', width: 130, sortable: true },
    { field: 'weight', headerName: 'Total Weight (kg)', width: 180, sortable: true },
    { field: 'processedWeight', headerName: 'Processed Weight (kg)', width: 180, sortable: true },
    { field: 'availableWeight', headerName: 'Available Weight (kg)', width: 180, sortable: true },
    // { field: 'total_price', headerName: 'Total Cherry Price', width: 180, sortable: true, renderCell: ({ value }) => {
      // if (value == null || isNaN(value)) return 'N/A';
      // return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
    // }},
    { field: 'startProcessingDate', headerName: 'Start Processing Date', width: 180, sortable: true },
    { field: 'lastProcessingDate', headerName: 'Last Processing Date', width: 180, sortable: true },
    { field: 'preprocessing_notes', headerName: 'Notes', width: 200, sortable: true },
  ];

  const unprocessedColumns = [
    { field: 'batchNumber', headerName: 'Batch Number', width: 180, sortable: true },
    { field: 'type', headerName: 'Type', width: 150, sortable: true },
    { field: 'overallQuality', headerName: 'Overall Quality', width: 150, sortable: true },
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

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'manager' && session.user.role !== 'preprocessing')) {
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
              Preprocessing Station
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
                    value={totalProcessedWeight.toFixed(2) || '0.00'}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Weight Available (kg)"
                    value={weightAvailable.toFixed(2) || '0.00'}
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
                    rows= {5}
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
                      <Typography>Total Weight: {history.totalWeight} kg</Typography>
                      <Typography>Processed Weight: {history.totalProcessedWeight} kg</Typography>
                      <Typography>Available Weight: {history.weightAvailable} kg</Typography>
                      <Divider style={{ margin: '8px 0' }} />
                      <Typography variant="subtitle1">Processing Logs:</Typography>
                      {history.processedLogs.length === 0 ? (
                        <Typography>No processing logs available for this batch.</Typography>
                      ) : (
                        history.processedLogs.map((log, logIndex) => (
                          <div key={logIndex} style={{ marginLeft: '16px' }}>
                            <Typography>Processing Date: {new Date(log.processingDate).toISOString().slice(0, 10)}</Typography>
                            <Typography>Weight Processed: {log.weightProcessed} kg</Typography>
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
                pageSize={5}
                rowsPerPageOptions={[5, 10, 20]}
                disableSelectionOnClick
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
  
            <div style={{ height: 1000, width: '100%' }}>
              <DataGrid
                rows={preprocessingData}
                columns={columns}
                pageSize={5}
                rowsPerPageOptions={[5, 10, 20]}
                disableSelectionOnClick
                sortingOrder={['asc', 'desc']}
                getRowId={(row => row.id)} // Use composite ID
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