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
  const [rfid, setRfid] = useState(''); // Store scanned RFID
  const [rfidTag, setRfidTag] = useState(''); // Store scanned RFID tag
  const [bagsProcessed, setBagsProcessed] = useState(1);
  const [batchNumber, setBatchNumber] = useState('');
  const [bagsAvailable, setBagsAvailable] = useState(0);
  const [totalProcessedBags, setTotalProcessedBags] = useState(0);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [farmerName, setFarmerName] = useState('');
  const [receivingDate, setReceivingDate] = useState('');
  const [qcDate, setQCDate] = useState('');
  const [weight, setWeight] = useState('');
  const [totalBags, setTotalBags] = useState('');
  const [openHistory, setOpenHistory] = useState(false);
  const [bagsHistory, setBagsHistory] = useState([]);
  const [preprocessingData, setPreprocessingData] = useState([]);
  const [unprocessedBatches, setUnprocessedBatches] = useState([]);
  const [producer, setProducer] = useState('');
  const [productLine, setProductLine] = useState('');
  const [processingType, setProcessingType] = useState('');
  const [quality, setQuality] = useState('');

  const fetchAvailableBags = async (batchNumber, totalBags) => {
    try {
      const response = await fetch(`https://processing-facility-backend.onrender.com/api/preprocessing/${batchNumber}`);
      if (!response.ok) throw new Error('Failed to fetch preprocessing data');
      const preprocessingResponse = await response.json();
      console.log('Preprocessing Response:', preprocessingResponse);
      if (preprocessingResponse && !isNaN(parseFloat(preprocessingResponse.totalBagsProcessed))) {
        const totalProcessedBags = parseFloat(preprocessingResponse.totalBagsProcessed);
        const availableBags = totalBags - totalProcessedBags;
        console.log('Total Bags:', totalBags);
        console.log('Total Processed Bags:', totalProcessedBags);
        console.log('Available Bags:', availableBags);
        return { availableBags, totalProcessedBags };
      } else {
        throw new Error('Total bags processed is not a valid number');
      }
    } catch (error) {
      console.error('Error fetching available bags:', error);
      return { availableBags: 0, totalProcessedBags: 0 };
    }
  };

  const fetchBatchData = async (batchNumber) => {
    try {
      const response = await fetch(`https://processing-facility-backend.onrender.com/api/receiving/${batchNumber}`);
      if (!response.ok) throw new Error('Failed to fetch receiving data');
  
      const dataArray = await response.json();
      if (!dataArray.length) throw new Error('No data found for the provided batch number.');
  
      const data = dataArray[0];
      const { availableBags, totalProcessedBags } = await fetchAvailableBags(batchNumber, data.totalBags);
  
      console.log('fetchAvailableBags result:', { availableBags, totalProcessedBags });
  
      setFarmerName(data.farmerName);
      setReceivingDate(data.receivingDateTrunc);
      setQCDate(data.qcDateTrunc);
      setWeight(data.weight);
      setTotalBags(data.totalBags);
      setBagsAvailable(availableBags);
      setTotalProcessedBags(totalProcessedBags);
  
      console.log('Total Bags:', data.totalBags);
      console.log('Total Processed Bags:', totalProcessedBags);
      console.log('Available Bags:', availableBags);
  
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
      if (!response.ok) {
        throw new Error(`Failed to fetch RFID: ${response.status}`);
      }
      const data = await response.json();

      if (data.rfid) {
        setRfid(data.rfid);
        setRfidTag(data.rfid);
        const receivingResponse = await fetch(`https://processing-facility-backend.onrender.com/api/receivingrfid/${data.rfid}`);
        if (!receivingResponse.ok) {
          throw new Error(`Failed to fetch receiving data: ${receivingResponse.status}`);
        }
        const receivingData = await receivingResponse.json();

        if (receivingData && receivingData.length > 0) {
          const batchData = receivingData[0];
          setBatchNumber(batchData.batchNumber);
          setFarmerName(batchData.farmerName);
          setReceivingDate(batchData.receivingDateTrunc || '');
          setQCDate(batchData.qcDateTrunc || '');
          setWeight(batchData.weight || '');
          setTotalBags(batchData.totalBags || '');
          setBagsAvailable(batchData.totalBags || 0);
          await fetchAvailableBags(batchData.batchNumber, batchData.totalBags);

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
      if (!response.ok) {
        throw new Error(`Failed to clear RFID Data: ${response.status}`);
      }
    } catch (error) {
      console.error("Error clearing RFID Data:", error);
    }
  };

  const handleAllBags = () => {
    if (bagsAvailable) {
      setBagsProcessed(bagsAvailable);
    } else {
      console.warn('No available bags to process.');
      setBagsProcessed(1);
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

  const fetchBagsHistory = async () => {
    try {
      const batchesResponse = await fetch("https://processing-facility-backend.onrender.com/api/receiving");
      const batches = await batchesResponse.json();
      const processedResponse = await fetch("https://processing-facility-backend.onrender.com/api/preprocessing");
      const processedBags = await processedResponse.json();
  
      const historyData = batches.map((batch) => {
        const processedLogs = processedBags.filter(log => log.batchNumber === batch.batchNumber);
        const totalProcessedBags = processedLogs.reduce((acc, log) => acc + log.bagsProcessed, 0);
        const bagsAvailable = batch.totalBags - totalProcessedBags;
        return {
          batchNumber: batch.batchNumber,
          totalBags: batch.totalBags,
          bagsProcessed: totalProcessedBags,
          bagsAvailable,
          processedLogs: processedLogs.map(log => ({
            processingDate: log.processingDate,
            bagsProcessed: log.bagsProcessed,
          })),
        };
      });
  
      setBagsHistory(historyData);
      setOpenHistory(true);
    } catch (error) {
      console.error("Error fetching bags history:", error);
    }
  };

  const showBagsHistory = () => {
    fetchBagsHistory();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedBatchNumber = batchNumber.trim();
    const trimmedBagsProcessed = bagsProcessed;

    if (trimmedBagsProcessed > bagsAvailable) {
      setSnackbarMessage(`Cannot process more bags than available. Available: ${bagsAvailable}`);
      setSnackbarSeverity('warning');
      setOpenSnackbar(true);
      return;
    }

    const preprocessingData = {
      bagsProcessed: trimmedBagsProcessed, 
      batchNumber: trimmedBatchNumber,
      producer: producer,
      productLine: productLine,
      processingType: processingType,
      quality: quality,
      createdBy: session.user.name,
    };

    try {
      const response = await fetch('https://processing-facility-backend.onrender.com/api/preprocessing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preprocessingData),
      });
      if (!response.ok) throw new Error('Failed to start processing');

      setSnackbarMessage(`Preprocessing started for batch ${trimmedBatchNumber} on ${trimmedBagsProcessed} bags!`);
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
    setBagsProcessed(1);
    setBatchNumber('');
    setBagsAvailable(0);
    setFarmerName('');
    setReceivingDate('');
    setQCDate('');
    setWeight('');
    setTotalBags('');
    setProducer('');
    setProductLine('');
    setProcessingType('');
    setQuality('');
    setTotalProcessedBags('');
    setBagsAvailable('');
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
          sla,
          startProcessingDate: batch.startProcessingDate ? new Date(batch.startProcessingDate).toISOString().slice(0, 10) : 'N/A',
          lastProcessingDate: batch.lastProcessingDate ? new Date(batch.lastProcessingDate).toISOString().slice(0, 10) : 'N/A'
        };
      });
  
      const unprocessedBatches = formattedData.filter(batch => batch.availableBags > 0);
  
      const sortedUnprocessedBatches = unprocessedBatches.sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        if (a.cherryGroup !== b.cherryGroup) return a.cherryGroup.localeCompare(b.cherryGroup);
        if (a.ripeness !== b.ripeness) return a.ripeness.localeCompare(b.ripeness);
        if (a.color !== b.color) return a.color.localeCompare(b.color);
        if (a.foreignMatter !== b.foreignMatter) return a.foreignMatter.localeCompare(b.foreignMatter);
        if (a.overallQuality !== b.overallQuality) return a.overallQuality.localeCompare(b.overallQuality);
        return 0;
      });

      const processedBatches = formattedData.filter(batch => batch.processedBags > 0);

      const sortedDataType = processedBatches.sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return 0;
      });
  
      const sortedData = sortedDataType.sort((a, b) => {
        if (a.startProcessingDate === 'N/A' && b.startProcessingDate !== 'N/A') {return -1;}
        if (a.startProcessingDate !== 'N/A' && b.startProcessingDate === 'N/A') {return 1;}
        return b.availableBags - a.availableBags;
      });
  
      setPreprocessingData(sortedData);
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
  }, [producer, productLine, producerOptions]);

  useEffect(() => {
    if (productLine && !productLineOptions[productLine].includes(processingType)) {
        setProcessingType('');
    }
  }, [productLine, processingType, productLineOptions]);

  useEffect(() => {
    if (processingType && !processingTypeOptions[processingType].includes(quality)) {
        setQuality('');
    }
  }, [processingType, quality, processingTypeOptions]);

  const columns = [
    { field: 'batchNumber', headerName: 'Batch Number', width: 160, sortable: true },
    { field: 'startProcessingDate', headerName: 'Start Processing Date', width: 180, sortable: true },
    { field: 'lastProcessingDate', headerName: 'Last Processing Date', width: 180, sortable: true },
    { field: 'totalBags', headerName: 'Total Bags', width: 100, sortable: true },
    { field: 'processedBags', headerName: 'Processed Bags', width: 130, sortable: true },
    { field: 'availableBags', headerName: 'Available Bags', width: 130, sortable: true },
    { field: 'type', headerName: 'Type', width: 100, sortable: true },
    { field: 'producer', headerName: 'Producer', width: 100, sortable: true },
    { field: 'productLine', headerName: 'Product Line', width: 130, sortable: true },
    { field: 'processingType', headerName: 'Processing Type', width: 160, sortable: true },
    { field: 'quality', headerName: 'Quality', width: 130, sortable: true },
  ];

  const unprocessedColumns = [
    { field: 'batchNumber', headerName: 'Batch Number', width: 180, sortable: true },
    { field: 'receivingDate', headerName: 'Receiving Date', width: 180, sortable: true },
    { field: 'qcDate', headerName: 'QC Date', width: 180, sortable: true },
    { field: 'type', headerName: 'Type', width: 150, sortable: true },
    { field: 'cherryScore', headerName: 'Cherry Score', width: 150, sortable: true },
    { field: 'cherryGroup', headerName: 'Cherry Group', width: 150, sortable: true },
    { field: 'ripeness', headerName: 'Ripeness', width: 150, sortable: true },
    { field: 'color', headerName: 'Color', width: 150, sortable: true },
    { field: 'foreignMatter', headerName: 'Foreign Matter', width: 150, sortable: true },
    { field: 'overallQuality', headerName: 'Overall Quality', width: 150, sortable: true },
    { field: 'weight', headerName: 'Total Weight', width: 150, sortable: true },
    { field: 'availableBags', headerName: 'Available Bags', width: 150, sortable: true },
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
                    label="Total Weight"
                    value={weight || ''}
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
                    label="Total Processed Bags"
                    value={totalProcessedBags || 0}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Total Bags Available"
                    value={bagsAvailable || 0}
                    InputProps={{
                      readOnly: true,
                      style: { color: bagsAvailable <= 0 ? 'red' : 'inherit' },
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
                    label="Bags to Process"
                    value={bagsProcessed}
                    onChange={(e) => setBagsProcessed(Number(e.target.value))}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                <Grid item>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAllBags}
                  >
                    Process All Bags
                  </Button>
                </Grid>
              </Grid>

              <Divider style={{ margin: '16px 0' }} />

              <Grid item xs={12} style={{ marginTop: '12px' }}>
                <FormControl fullWidth required>
                  <InputLabel id="pd-label">Producer</InputLabel>
                  <Select
                    labelId="pd-label"
                    id="pd"
                    value={producer}
                    onChange={(e) => {
                      setProducer(e.target.value);
                    }}
                    input={<OutlinedInput label="Producer" />}
                    MenuProps={MenuProps}
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    <MenuItem value="HQ">HEQA</MenuItem>
                    <MenuItem value="BTM">BTM</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} style={{ marginTop: '12px' }}>
                  <FormControl fullWidth required>
                    <InputLabel id="pl-label">Product Line</InputLabel>
                    <Select
                      labelId="pl-label"
                      id="pl"
                      value={productLine}
                      onChange={(e) => {
                        setProductLine(e.target.value);
                      }}
                      input={<OutlinedInput label="Product Line" />}
                      MenuProps={MenuProps}
                      disabled={!producer}
                    >
                      <MenuItem value=""><em>None</em></MenuItem>
                      {producerOptions[producer] ? producerOptions[producer].map((option) => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      )) : []}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} style={{ marginTop: '12px' }}>
                  <FormControl fullWidth required>
                    <InputLabel id="pt-label">Processing Type</InputLabel>
                    <Select
                      labelId="pt-label"
                      id="pt"
                      value={processingType}
                      onChange={(e) => {
                        setProcessingType(e.target.value);
                      }}
                      input={<OutlinedInput label="Processing Type" />}
                      MenuProps={MenuProps}
                      disabled={!productLine}
                    >
                      <MenuItem value=""><em>None</em></MenuItem>
                      {productLineOptions[productLine] ? productLineOptions[productLine].map((option) => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      )) : []}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} style={{ marginTop: '12px' }}>
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
                      {processingTypeOptions[processingType] ? processingTypeOptions[processingType].map((option) => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      )) : []}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item>
                  <Button type="submit" variant="contained" color="success">
                    Send to Wet Mill
                  </Button>
                </Grid>
              </Grid>
            </form>

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
              <DialogTitle>Bags Processing History</DialogTitle>
              <DialogContent>
                {bagsHistory.length === 0 ? (
                  <Typography>No processing history available.</Typography>
                ) : (
                  bagsHistory.map((history, index) => (
                    <div key={index} style={{ marginBottom: '16px' }}>
                      <Typography variant="h6">Batch: {history.batchNumber}</Typography>
                      <Typography>Total Bags: {history.totalBags}</Typography>
                      <Typography>Processed Bags: {history.bagsProcessed}</Typography>
                      <Typography>Available Bags: {history.bagsAvailable}</Typography>
                      <Divider style={{ margin: '8px 0' }} />
                      <Typography variant="subtitle1">Processing Logs:</Typography>
                      {history.processedLogs.length === 0 ? (
                        <Typography>No processing logs available for this batch.</Typography>
                      ) : (
                        history.processedLogs.map((log, logIndex) => (
                          <div key={logIndex} style={{ marginLeft: '16px' }}>
                            <Typography>Processing Date: {new Date(log.processingDate).toISOString().slice(0, 10)}</Typography>
                            <Typography>Bags Processed: {log.bagsProcessed}</Typography>
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
      </Grid>
    </Grid>
  );
};

export default PreprocessingStation;