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
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const PreprocessingStation = () => {
  const { data: session, status } = useSession();
  const [rfidTag, setRfidTag] = useState('');
  const [bagsProcessed, setBagsProcessed] = useState(1);
  const [batchNumber, setBatchNumber] = useState('');
  const [bagsAvailable, setBagsAvailable] = useState(0);
  const [totalProcessedBags, setTotalProcessedBags] = useState(0);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [rfidVisible, setRfidVisible] = useState(false);
  const [farmerName, setFarmerName] = useState('');
  const [receivingDate, setReceivingDate] = useState('');
  const [weight, setWeight] = useState('');
  const [totalBags, setTotalBags] = useState('');
  const [openHistory, setOpenHistory] = useState(false);
  const [bagsHistory, setBagsHistory] = useState([]);
  const [preprocessingData, setPreprocessingData] = useState([]);
  const [unprocessedBatches, setUnprocessedBatches] = useState([]);

  const columns = [
    { field: 'batchNumber', headerName: 'Batch Number', width: 180, sortable: true },
    { field: 'startProcessingDate', headerName: 'Start Processing Date', width: 180, sortable: true },
    { field: 'lastProcessingDate', headerName: 'Last Processing Date', width: 180, sortable: true },
    { field: 'totalBags', headerName: 'Total Bags', width: 130, sortable: true },
    { field: 'processedBags', headerName: 'Processed Bags', width: 130, sortable: true },
    { field: 'availableBags', headerName: 'Available Bags', width: 130, sortable: true },
    { field: 'sla', headerName: 'SLA (days)', width: 130, sortable: true },
  ];

  const unprocessedColumns = [
    { field: 'ripeness', headerName: 'Ripeness', width: 150, sortable: true },
    { field: 'color', headerName: 'Color', width: 150, sortable: true },
    { field: 'foreignMatter', headerName: 'Foreign Matter', width: 150, sortable: true },
    { field: 'overallQuality', headerName: 'Overall Quality', width: 150, sortable: true },
    {
      field: 'batches',
      headerName: 'Batches',
      width: 300,
      renderCell: (params) => (
        <div>
          {params.row.batches.map((batch, index) => (
            <div key={index}>
              {batch.batchNumber} - {batch.availableBags} bags
            </div>
          ))}
        </div>
      ),
    },
  ];

  const fetchAvailableBags = async (batchNumber, totalBags) => {
    try {
      const response = await fetch(`https://processing-facility-backend.onrender.com/api/preprocessing/${batchNumber}`);
      if (!response.ok) throw new Error('Failed to fetch preprocessing data');
      const preprocessingResponse = await response.json();
      // Log the preprocessing response
      console.log('Preprocessing Response:', preprocessingResponse);
      // Check if the preprocessing response has totalBagsProcessed
      if (preprocessingResponse && typeof preprocessingResponse.totalBagsProcessed === 'number') {
        const totalProcessedBags = preprocessingResponse.totalBagsProcessed;
        const availableBags = totalBags - totalProcessedBags;
        // Log total bags, total processed, and available bags
        console.log('Total Bags:', totalBags);
        console.log('Total Processed Bags:', totalProcessedBags);
        console.log('Available Bags:', availableBags);
        return { availableBags, totalProcessedBags };
      } else {
        throw new Error('Total bags processed is not a valid number');
      }
    } catch (error) {
      console.error('Error fetching available bags:', error);
      return { availableBags: 0, totalProcessedBags: 0 }; // Return default values on error
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
      // Log the result of fetchAvailableBags
      console.log('fetchAvailableBags result:', { availableBags, totalProcessedBags });
      setFarmerName(data.farmerName);
      setReceivingDate(data.receivingDate);
      setWeight(data.weight);
      setTotalBags(data.totalBags);
      setBagsAvailable(availableBags);
      setTotalProcessedBags(totalProcessedBags);
      // Log total bags, total processed bags, and available bags to the console
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

  const handleAllBags = () => {
    if (bagsAvailable) {
      setBagsProcessed(bagsAvailable);
    } else {
      console.warn('No available bags to process.');
      setBagsProcessed(1);
    }
  };

  const handleRfidScan = async (e) => {
    const scannedTag = e.target.value;
    setRfidTag(scannedTag);
    try {
      const response = await fetch(`https://processing-facility-backend.onrender.com/api/getBatchDetails/${scannedTag}`);
      if (!response.ok) throw new Error('Failed to fetch batch details');
      const data = await response.json();
      setBatchNumber(data.batchNumber);
      await fetchBatchData(data.batchNumber);
    } catch (error) {
      handleError('Error retrieving batch details. Please try again.', error);
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
        const processedLogs = processedBags.filter(
          (log) => log.batchNumber === batch.batchNumber
        );
        const totalProcessedBags = processedLogs.reduce((acc, log) => acc + log.bagsProcessed, 0);
        const bagsAvailable = batch.totalBags - totalProcessedBags;
        return {
          batchNumber: batch.batchNumber,
          totalBags: batch.totalBags,
          bagsProcessed: totalProcessedBags,
          bagsAvailable,
          processedDate: processedLogs.length > 0 ? processedLogs[0].date : "N/A",
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
    // Trim the batch number and bags processed
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
      setOpenSnackbar(true); // Show the snackbar here
      // Call fetchPreprocessingData after successful submission
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
    setRfidTag('');
    setBagsProcessed(1);
    setBatchNumber('');
    setBagsAvailable(0);
  };

  const handleCloseHistory = () => {
    setOpenHistory(false);
  };

  const fetchPreprocessingData = async () => {
    try {
      const receivingResponse = await fetch('https://processing-facility-backend.onrender.com/api/receiving');
      const QCResponse = await fetch('https://processing-facility-backend.onrender.com/api/qc');
      const preprocessingResponse = await fetch('https://processing-facility-backend.onrender.com/api/preprocessing');

      const receivingRawResult = await receivingResponse.json();
      const QCResult = await QCResponse.json();
      const preprocessingResult = await preprocessingResponse.json();

      // Extracting the relevant data from the responses
      const receivingData = receivingRawResult.allRows || []; // Corrected to access All Rows
      const QCData = QCResult.allRows || [];
      const preprocessingData = preprocessingResult.allRows || [];

      // Create a map for QC data for quick lookup
      const QCDataMap = QCData.reduce((acc, qc) => {
        acc[qc.batchNumber.trim()] = {
          ripeness: qc.ripeness,
          color: qc.color,
          foreignMatter: qc.foreignMatter,
          overallQuality: qc.overallQuality,
        };
        return acc;
      }, {});

      // Filter receiving data based on QC batch numbers
      const receivingResult = receivingData.filter(item => QCDataMap[item.batchNumber.trim()]); // Use trim to ensure matching

      const joinedData = receivingResult.map((receiving) => {
        const relatedPreprocessingLogs = preprocessingData.filter(log => log.batchNumber === receiving.batchNumber);

        const totalProcessedBags = relatedPreprocessingLogs.reduce((sum, log) => sum + log.bagsProcessed, 0);
        const bagsAvailable = receiving.totalBags - totalProcessedBags;

        const dates = relatedPreprocessingLogs.map(log => new Date(log.processingDate));
        const startProcessingDate = dates.length > 0 ? new Date(Math.min(...dates)) : 'N/A';
        const lastProcessingDate = dates.length > 0 ? new Date(Math.max(...dates)) : 'N/A';

        // Calculate SLA
        let sla = 'N/A';
        const receivingDateObj = new Date(receiving.receivingDate);
        if (!isNaN(receivingDateObj)) {
          const today = new Date();
          const diffTime = Math.abs(today - receivingDateObj);
          sla = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        // Get QC data for the current batch
        const qcData = QCDataMap[receiving.batchNumber.trim()] || {};

        return {
          batchNumber: receiving.batchNumber,
          startProcessingDate: startProcessingDate === 'N/A' ? 'N/A' : startProcessingDate.toISOString().slice(0, 10),
          lastProcessingDate: lastProcessingDate === 'N/A' ? 'N/A' : lastProcessingDate.toISOString().slice(0, 10),
          totalBags: receiving.totalBags,
          processedBags: totalProcessedBags,
          availableBags: bagsAvailable,
          sla,
          ripeness: qcData.ripeness || 'N/A',
          color: qcData.color || 'N/A',
          foreignMatter: qcData.foreignMatter || 'N/A',
          overallQuality: qcData.overallQuality || 'N/A',
        };
      });

      // Filter out batches with available bags
      const unprocessedBatches = joinedData.filter(batch => batch.availableBags > 0);

      // Group unprocessed batches by ripeness, color, foreignMatter, and overallQuality
      const groupedUnprocessedBatches = unprocessedBatches.reduce((acc, batch) => {
        const key = `${batch.ripeness}-${batch.color}-${batch.foreignMatter}-${batch.overallQuality}`;
        if (!acc[key]) {
          acc[key] = {
            ripeness: batch.ripeness,
            color: batch.color,
            foreignMatter: batch.foreignMatter,
            overallQuality: batch.overallQuality,
            batches: [],
          };
        }
        acc[key].batches.push(batch);
        return acc;
      }, {});

      const groupedUnprocessedBatchesArray = Object.values(groupedUnprocessedBatches).map(group => ({
        id: `${group.ripeness}-${group.color}-${group.foreignMatter}-${group.overallQuality}`,
        ripeness: group.ripeness,
        color: group.color,
        foreignMatter: group.foreignMatter,
        overallQuality: group.overallQuality,
        batches: group.batches,
      }));

      const sortedData = joinedData.sort((a, b) => {
        const availableBagsA = a.totalBags - a.processedBags;
        const availableBagsB = b.totalBags - b.processedBags;

        if (a.startProcessingDate === 'N/A' && b.startProcessingDate !== 'N/A') {
          return -1;
        }
        if (a.startProcessingDate !== 'N/A' && b.startProcessingDate === 'N/A') {
          return 1;
        }
        return availableBagsB - availableBagsA;
      });

      setPreprocessingData(sortedData);
      setUnprocessedBatches(groupedUnprocessedBatchesArray);
    } catch (error) {
      console.error('Error fetching preprocessing data:', error);
    }
  };

  useEffect(() => {
    fetchPreprocessingData(); // Fetch preprocessing data only once on mount
  }, []);

  // Show loading screen while session is loading
  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  // Redirect to the sign-in page if the user is not logged in or doesn't have the admin role
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'manager' && session.user.role !== 'preprocessing')) {
    return (
      <div>Access Denied. You do not have permission to view this page.</div>
    );
  }

  return (
    <div>
      <Typography variant="h4">Preprocessing Station</Typography>
      {/* RFID and Batch Number Lookup */}
      <Button variant="contained" color="primary" onClick={() => setRfidVisible(true)} style={{ marginTop: '12px' }}>
        Scan RFID Tag
      </Button>
      {rfidVisible && (
        <TextField
          value={rfidTag}
          onChange={(e) => setRfidTag(e.target.value)}
          placeholder="Enter RFID tag"
          fullWidth
          margin="normal"
        />
      )}
      <TextField
        value={batchNumber}
        onChange={(e) => setBatchNumber(e.target.value)}
        placeholder="Enter batch number to search"
        fullWidth
        margin="normal"
      />
      <Button variant="contained" color="primary" onClick={handleBatchNumberSearch}>
        Search
      </Button>
      {/* Farmer and Batch Details */}
      <Card style={{ marginTop: '16px' }}>
        <CardContent>
          <Typography variant="h6">Farmer Details</Typography>
          <Divider />
          <Typography>Farmer Name: {farmerName}</Typography>
          <Typography>Receiving Date: {receivingDate}</Typography>
          <Typography>Weight: {weight} kg</Typography>
          <Typography>Total Bags: {totalBags}</Typography>
          <Typography>Processed Bags: {totalProcessedBags}</Typography>
          <Typography>Available Bags: {bagsAvailable}</Typography>
        </CardContent>
      </Card>
      {/* Bag Processing Section */}
      <TextField
        value={bagsProcessed}
        onChange={(e) => setBagsProcessed(Number(e.target.value))}
        placeholder="Enter number of bags to process"
        fullWidth
        margin="normal"
        type="number"
        min="1"
        max={bagsAvailable}
      />
      <Button variant="contained" color="secondary" onClick={handleAllBags}>
        Process All Bags
      </Button>
      <Button variant="contained" color="primary" onClick={handleSubmit}>
        Start Processing
      </Button>
      {/* View Bags History Button */}
      <Button variant="contained" color="default" onClick={showBagsHistory} style={{ marginTop: '16px' }}>
        View Bags History
      </Button>
      {/* Snackbar Notifications */}
      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={() => setOpenSnackbar(false)}>
        <Alert onClose={() => setOpenSnackbar(false)} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
      {/* Bags Processing History Dialog */}
      <Dialog open={openHistory} onClose={handleCloseHistory}>
        <DialogTitle>Bags Processing History</DialogTitle>
        <DialogContent>
          {bagsHistory.length === 0 ? (
            <Typography>No processing history available.</Typography>
          ) : (
            bagsHistory.map((history, index) => (
              <div key={index}>
                <Typography>
                  Batch: {history.batchNumber}, Total Bags: {history.totalBags}, Bags Processed: {history.bagsProcessed}, Bags Available: {history.bagsAvailable}, Processed Date: {history.processedDate}
                </Typography>
                <Divider style={{ margin: '8px 0' }} />
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
      {/* Unprocessed Batches DataGrid */}
      <Typography variant="h5" style={{ marginTop: '32px' }}>Unprocessed Batches</Typography>
      <DataGrid
        rows={unprocessedBatches}
        columns={unprocessedColumns}
        slots={{ toolbar: GridToolbar }}
        pageSize={5}
        rowsPerPageOptions={[5]}
        checkboxSelection
        disableRowSelectionOnClick
        initialState={{
          sorting: {
            sortModel: [{ field: 'ripeness', sort: 'asc' }],
          },
        }}
        style={{ height: 400, width: '100%' }}
      />
      {/* Processing Data DataGrid */}
      <Typography variant="h5" style={{ marginTop: '32px' }}>Processing Data</Typography>
      <DataGrid
        rows={preprocessingData}
        columns={columns}
        slots={{ toolbar: GridToolbar }}
        pageSize={5}
        rowsPerPageOptions={[5]}
        checkboxSelection
        disableRowSelectionOnClick
        initialState={{
          sorting: {
            sortModel: [{ field: 'availableBags', sort: 'desc' }],
          },
        }}
        style={{ height: 400, width: '100%' }}
      />
    </div>
  );
};

export default PreprocessingStation;