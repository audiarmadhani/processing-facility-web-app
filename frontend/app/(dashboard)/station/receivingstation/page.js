"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import {
  TextField,
  Button,
  Typography,
  Snackbar,
  Alert,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Autocomplete
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function ReceivingStation() {
  const { data: session, status } = useSession();

  const [farmerName, setFarmerName] = useState('');
  const [farmerList, setFarmerList] = useState([]);
  const [selectedFarmerDetails, setSelectedFarmerDetails] = useState(null);
  const [notes, setNotes] = useState('');
  const [numberOfBags, setNumberOfBags] = useState(1);
  const [bagCountInput, setBagCountInput] = useState('1'); // Temporary input state
  const [bagWeights, setBagWeights] = useState(['']);
  const [totalWeight, setTotalWeight] = useState(0);
  const [brix, setBrix] = useState('');
  const [receivingData, setReceivingData] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [type, setType] = useState('');
  const [assigningRFID, setAssigningRFID] = useState(false);
  const [lastCreatedBatchNumber, setLastCreatedBatchNumber] = useState(null);

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

  useEffect(() => {
    fetchFarmerList();
    fetchReceivingData();
    updateTotalWeight();
  }, [bagWeights, session]);

  const fetchFarmerList = async () => {
    try {
      const response = await fetch('https://processing-facility-backend.onrender.com/api/farmer');
      if (!response.ok) throw new Error('Failed to fetch farmers');

      const data = await response.json();
      if (data && Array.isArray(data.allRows)) {
        setFarmerList(data.allRows);
      } else {
        console.error('Unexpected data format:', data);
      }
    } catch (error) {
      console.error('Error fetching farmers:', error);
    }
  };

  const fetchReceivingData = async () => {
    if (!session || !session.user) return;

    try {
      const response = await fetch('https://processing-facility-backend.onrender.com/api/receiving');
      if (!response.ok) throw new Error(`Failed to fetch receiving data: ${response.status}`);

      const data = await response.json();
      if (data && Array.isArray(data.allRows) && Array.isArray(data.todayData)) {
        let filteredData = [];
        if (["admin", "manager"].includes(session.user.role)) {
          filteredData = data.allRows.map((row, index) => ({ ...row, id: index }));
        } else if (["staff", "receiving"].includes(session.user.role)) {
          filteredData = data.todayData.map((row, index) => ({ ...row, id: index }));
        }
        setReceivingData(filteredData);
      } else {
        console.error("Unexpected data format from /api/receiving:", data);
        setReceivingData([]);
      }
    } catch (error) {
      console.error("Error fetching receiving data:", error);
      setReceivingData([]);
    }
  };

  const handleBagWeightChange = (index, value) => {
    const updatedBagWeights = [...bagWeights];
    updatedBagWeights[index] = value;
    setBagWeights(updatedBagWeights);
  };

  const handleBagCountInputChange = (e) => {
    setBagCountInput(e.target.value);
  };

  const handleBagCountBlur = () => {
    const parsedValue = parseInt(bagCountInput, 10);
    const newValue = isNaN(parsedValue) || parsedValue < 1 ? 1 : parsedValue;
    setNumberOfBags(newValue);
    setBagCountInput(newValue.toString());

    if (newValue > bagWeights.length) {
      // Add new empty fields
      setBagWeights([...bagWeights, ...Array(newValue - bagWeights.length).fill('')]);
    } else {
      // Truncate to new length, preserving weights
      setBagWeights(bagWeights.slice(0, newValue));
    }
  };

  const updateTotalWeight = () => {
    const calculatedTotalWeight = bagWeights.reduce((total, weight) => total + parseFloat(weight || 0), 0);
    setTotalWeight(calculatedTotalWeight);
  };

  const handleFarmerChange = (event, newValue) => {
    setSelectedFarmerDetails(newValue);
    setFarmerName(newValue ? newValue.farmerName : "");
  };

  const getRfidData = async () => {
    try {
      const response = await fetch('https://processing-facility-backend.onrender.com/api/get-rfid/Receiving');
      if (!response.ok) {
        throw new Error(`Failed to fetch RFID data: ${response.status}`);
      }
      const data = await response.json();
      if (data && typeof data.rfid === 'string' && data.rfid.trim().length > 0) {
        return data.rfid;
      } else {
        return '';
      }
    } catch (error) {
      console.error("Error getting RFID data:", error);
      return '';
    }
  };

  const clearRfidData = async () => {
    try {
      const response = await fetch(`https://processing-facility-backend.onrender.com/api/clear-rfid/Receiving`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error(`Failed to clear RFID Data: ${response.status}`);
      }
    } catch (error) {
      console.error("Error clearing RFID Data:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!session || !session.user) {
      console.error("No user session found.");
      setSnackbarMessage('No user session found.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    const scannedRFID = await getRfidData();
    if (!scannedRFID) {
      setSnackbarMessage('Please scan an RFID tag before submitting.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      const rfidCheckResponse = await fetch(`https://processing-facility-backend.onrender.com/api/check-rfid/${scannedRFID}`);
      if (!rfidCheckResponse.ok) {
        throw new Error(`RFID check failed: ${rfidCheckResponse.status}`);
      }
      const rfidCheckData = await rfidCheckResponse.json();
      if (rfidCheckData.isAssigned) {
        setSnackbarMessage('RFID tag is already assigned to another batch. Please scan a different tag.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }
    } catch (error) {
      console.error("Error during RFID check:", error);
      setSnackbarMessage('Error checking RFID tag. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    const payload = {
      farmerID: selectedFarmerDetails ? selectedFarmerDetails.farmerID : null,
      farmerName,
      notes,
      weight: totalWeight,
      totalBags: bagWeights.length,
      type,
      brix: brix ? parseFloat(brix) : null,
      bagPayload: bagWeights.map((weight, index) => ({
        bagNumber: index + 1,
        weight: parseFloat(weight) || 0,
      })),
      createdBy: session.user.name,
      updatedBy: session.user.name,
      rfid: scannedRFID,
    };

    try {
      const response = await fetch('https://processing-facility-backend.onrender.com/api/receiving', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const responseData = await response.json();
        const batchNumber = responseData.receivingData.batchNumber;
        setSnackbarMessage(`Batch ${batchNumber} created and RFID tag assigned!`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        await clearRfidData();

        setFarmerName('');
        setSelectedFarmerDetails(null);
        setBagWeights(['']);
        setNotes('');
        setNumberOfBags(1);
        setBagCountInput('1');
        setTotalWeight(0);
        setType('');
        setBrix('');
        fetchReceivingData();
      } else {
        const errorData = await response.json();
        console.error(errorData.message || 'Error creating batch.');
        setSnackbarMessage(errorData.message || 'Error creating batch.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Failed to communicate with the backend:', error);
      setSnackbarMessage('Failed to communicate with the backend.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const columns = [
    { field: 'batchNumber', headerName: 'Batch Number', width: 160, sortable: true },
    { field: 'receivingDateTrunc', headerName: 'Received Date', width: 160, sortable: true },
    { field: 'farmerName', headerName: 'Farmer Name', width: 180, sortable: true },
    { field: 'farmerID', headerName: 'Farmer ID', width: 100, sortable: true },
    { field: 'type', headerName: 'Type', width: 110, sortable: true },
    { field: 'weight', headerName: 'Total Weight (kg)', width: 150, sortable: true },
    { field: 'brix', headerName: 'Brix (°Bx)', width: 120, sortable: true },
    { field: 'notes', headerName: 'Notes', width: 250, sortable: true },
    { field: 'createdBy', headerName: 'Created By', width: 180, sortable: true },
  ];

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'manager' && session.user.role !== 'staff')) {
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
              Receiving Station Form
            </Typography>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Autocomplete
                    options={farmerList}
                    getOptionLabel={(option) => option.farmerName}
                    value={selectedFarmerDetails}
                    onChange={handleFarmerChange}
                    renderInput={(params) => (
                      <TextField {...params} label="Farmer Name" required fullWidth />
                    )}
                  />
                </Grid>

                {selectedFarmerDetails && (
                  <>
                    {/* <Grid item xs={12}>
                      <TextField
                        label="Farmer ID"
                        value={selectedFarmerDetails.farmerID}
                        fullWidth
                        InputProps={{ readOnly: true }}
                      />
                    </Grid> */}
                    <Grid item xs={12}>
                      <TextField
                        label="Farmer Address"
                        value={selectedFarmerDetails.farmerAddress}
                        fullWidth
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Bank Account"
                        value={selectedFarmerDetails.bankAccount}
                        fullWidth
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Bank Name"
                        value={selectedFarmerDetails.bankName}
                        fullWidth
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                  </>
                )}

                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel id="type-label">Type</InputLabel>
                    <Select
                      labelId="type-label"
                      id="type"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      input={<OutlinedInput label="Type" />}
                      MenuProps={MenuProps}
                    >
                      <MenuItem value="Arabica">Arabica</MenuItem>
                      <MenuItem value="Robusta">Robusta</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Brix (°Bx)"
                    type="number"
                    value={brix}
                    onChange={(e) => setBrix(e.target.value)}
                    fullWidth
                    inputProps={{ step: 0.1, min: 0 }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Number of Bags"
                    type="number"
                    value={bagCountInput}
                    onChange={handleBagCountInputChange}
                    onBlur={handleBagCountBlur}
                    fullWidth
                    required
                    inputProps={{ min: 1 }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Notes"
                    multiline
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6">Bag Weights</Typography>
                </Grid>
                {bagWeights.map((weight, index) => (
                  <Grid item xs={6} md={3} key={index}>
                    <TextField
                      label={`Bag ${index + 1}`}
                      type="number"
                      value={weight}
                      onChange={(e) => handleBagWeightChange(index, e.target.value)}
                      fullWidth
                      inputProps={{ step: 0.1, min: 0 }}
                    />
                  </Grid>
                ))}
                <Grid item xs={12}>
                  <Typography variant="h6">Total Weight: {totalWeight.toFixed(2)} kg</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    disabled={assigningRFID}
                    sx={{ mr: 2 }}
                  >
                    Submit
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Grid>

      {["admin", "manager", "receiving", "staff"].includes(session?.user?.role) && (
        <Grid item xs={12} md={8}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Receiving Data
              </Typography>
              <div style={{ height: 800, width: "100%" }}>
                <DataGrid
                  rows={receivingData}
                  columns={columns}
                  pageSize={5}
                  rowsPerPageOptions={[5, 10, 20]}
                  disableSelectionOnClick
                  sortingOrder={["asc", "desc"]}
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
      )}

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Grid>
  );
}

export default ReceivingStation;