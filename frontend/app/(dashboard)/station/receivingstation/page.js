"use client"; 

import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';

function ReceivingStation() {
  const [farmerName, setFarmerName] = useState('');
  const [farmerList, setFarmerList] = useState([]);
  const [notes, setNotes] = useState('');
  const [numberOfBags, setNumberOfBags] = useState(1);
  const [bagWeights, setBagWeights] = useState(['']);
  const [totalWeight, setTotalWeight] = useState(0);
  const [receivingData, setReceivingData] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [price, setPrice] = useState('');
  const [type, setType] = useState('');

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
  }, [bagWeights]);

  // Fetch farmers data from API
  const fetchFarmerList = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/farmer');
      if (!response.ok) throw new Error('Failed to fetch farmers');

      const data = await response.json();
      if (data && Array.isArray(data.latestRows)) {
        setFarmerList(data.latestRows);
      } else {
        console.error('Unexpected data format:', data);
      }
    } catch (error) {
      console.error('Error fetching farmers:', error);
    }
  };

  const fetchReceivingData = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/receiving');
      if (!response.ok) throw new Error('Failed to fetch receiving data');

      const data = await response.json();
      console.log('Fetched data:', data); // Log the fetched data for debugging

      if (data && Array.isArray(data.latestRows)) {
        setReceivingData(data.latestRows.map((row, index) => ({ ...row, id: index }))); // Add unique id
      } else {
        console.error('Unexpected data format:', data);
        setReceivingData([]);
      }
    } catch (error) {
      console.error('Error fetching receiving data:', error);
      setReceivingData([]);
    }
  };

  const handleBagWeightChange = (index, value) => {
    const updatedBagWeights = [...bagWeights];
    updatedBagWeights[index] = value;
    setBagWeights(updatedBagWeights);
  };

  const handleNumberOfBagsChange = (e) => {
    const value = Math.max(1, parseInt(e.target.value, 10));
    setNumberOfBags(value);

    if (value > bagWeights.length) {
      const newWeights = [...bagWeights, ...Array(value - bagWeights.length).fill('')];
      setBagWeights(newWeights);
    } else {
      setBagWeights(bagWeights.slice(0, value));
    }
  };

  const updateTotalWeight = () => {
    const calculatedTotalWeight = bagWeights.reduce((total, weight) => total + parseFloat(weight || 0), 0);
    setTotalWeight(calculatedTotalWeight);
  };

  const handleWriteToCard = () => {
    console.log('Writing to RFID card:', { farmerName, notes, bagWeights, totalWeight });
    alert('RFID card written successfully!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      farmerName,
      notes,
      weight: totalWeight,
      totalBags: bagWeights.length,
      price: parseFloat(price) || 0, // Include price here
      type,
      bagPayload: bagWeights.map((weight, index) => ({
        bagNumber: index + 1,
        weight: parseFloat(weight) || 0,
      })),
    };

    try {
      const response = await fetch('http://localhost:5001/api/receiving', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setFarmerName('');
        setBagWeights(['']);
        setNotes('');
        setNumberOfBags(1);
        setTotalWeight(0);
        setPrice('');
        setType('');
        fetchReceivingData();
        setSnackbarOpen(true);
      } else {
        const errorData = await response.json();
        console.error(errorData.message || 'Error creating batch.');
      }
    } catch (error) {
      console.error('Failed to communicate with the backend:', error);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const columns = [
    { field: 'batchNumber', headerName: 'Batch Number', width: 160, sortable: true },
    { field: 'receivingDate', headerName: 'Received Date', width: 160, sortable: true },
    { field: 'farmerName', headerName: 'Farmer Name', width: 180, sortable: true },
    { field: 'type', headerName: 'Type', width: 110, sortable: true },
    { field: 'weight', headerName: 'Total Weight (kg)', width: 150, sortable: true },
    { field: 'price', headerName: 'Price (/kg)', width: 150, sortable: true },
    { field: 'notes', headerName: 'Notes', width: 250, sortable: true },
  ];


  return (
    <Grid container spacing={3}>
      {/* Receiving Station Form */}
      <Grid item xs={12} md={4}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Receiving Station Form
            </Typography>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
              <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel id="farmer-label">Farmer Name</InputLabel>
                    <Select
                      labelId="farmer-label"
                      id="farmer"
                      value={farmerName}
                      onChange={(e) => setFarmerName(e.target.value)}
                      input={<OutlinedInput label="Farmer Name" />}
                    >
                      {farmerList.map((farmer) => (
                        <MenuItem key={farmer.farmerID} value={farmer.farmerName}>
                          {farmer.farmerName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
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
                    label="Number of Bags"
                    type="number"
                    value={numberOfBags}
                    onChange={handleNumberOfBagsChange}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Price per KG"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    fullWidth
                    required
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
                    />
                  </Grid>
                ))}
                <Grid item xs={12}>
                  <Typography variant="h6">Total Weight: {totalWeight.toFixed(2)} kg</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleWriteToCard}
                    style={{ marginRight: '16px' }}
                  >
                    Write to RFID Card
                  </Button>
                  <Button variant="contained" color="primary" type="submit">
                    Submit
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Grid>

      {/* Data Grid for Receiving Data */}
      <Grid item xs={12} md={8}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Receiving Data
            </Typography>
            <div style={{ height: 1000, width: '100%' }}>
              <DataGrid
                rows={receivingData}
                columns={columns}
                pageSize={5}
                rowsPerPageOptions={[5, 10, 20]}
                disableSelectionOnClick
                sortingOrder={['asc', 'desc']}
                slots={{ toolbar: GridToolbar }}
              />
            </div>
          </CardContent>
        </Card>
      </Grid>

      {/* Snackbar for notifications */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Batch successfully created!
        </Alert>
      </Snackbar>
    </Grid>
  );
}

export default ReceivingStation;