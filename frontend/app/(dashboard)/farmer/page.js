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
  MenuItem
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';

function FarmerInputStation() {
  const [farmerName, setFarmerName] = useState('');
  const [farmerAddress, setFarmerAddress] = useState('');
  const [farmerLandArea, setFarmerLandArea] = useState('');
  const [farmerContact, setFarmerContact] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [farmType, setFarmType] = useState('');
  const [notes, setNotes] = useState('');

  const [farmerData, setFarmerData] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);


  useEffect(() => {
    fetchFarmerData();
  }, []);

  const fetchFarmerData = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/farmer');
      if (!response.ok) throw new Error('Failed to fetch farmer data');

      const data = await response.json();
      console.log('Fetched data:', data); // Log the fetched data for debugging

      if (data && Array.isArray(data.latestRows)) {
        setFarmerData(data.latestRows.map((row, index) => ({ ...row, id: index }))); // Add unique id
      } else {
        console.error('Unexpected data format:', data);
        setFarmerData([]);
      }
    } catch (error) {
      console.error('Error fetching farmer data:', error);
      setFarmerData([]);
    }
  };

  const handleWriteToCard = () => {
    console.log('Writing to RFID card:', { farmerName });
    alert('RFID card written successfully!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      farmerName,
      farmerAddress,
      farmerLandArea,
      farmerContact,
      latitude,
      longitude,
      farmType,
      notes,
    };

    try {
      const response = await fetch('http://localhost:5001/api/farmer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setFarmerName('');
        setFarmerAddress('');
        setFarmerLandArea('');
        setFarmerContact('');
        setLatitude('');
        setLongitude('');
        setFarmType('');
        setNotes('');
        fetchFarmerData();
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
    { field: 'farmerID', headerName: 'ID', width: 140, sortable: true },
    { field: 'farmerName', headerName: 'Name', width: 180, sortable: true },
    { field: 'farmerAddress', headerName: 'Address', width: 180, sortable: true },
    { field: 'farmerLandArea', headerName: 'Land Area', width: 180, sortable: true },
    { field: 'farmerContact', headerName: 'Contact', width: 180, sortable: true },
    { field: 'latitude', headerName: 'Latitude', width: 180, sortable: true },
    { field: 'longitude', headerName: 'Longitude', width: 180, sortable: true },
    { field: 'farmType', headerName: 'Type', width: 180, sortable: true },
    { field: 'registrationDate', headerName: 'Registration Date', width: 180, sortable: true },
    { field: 'isActive', headerName: 'Active', width: 180, sortable: true },
    { field: 'notes', headerName: 'Notes', width: 180, sortable: true },
  ];


  return (
    <Grid container spacing={3}>
      {/* Farmer Input Station Form */}
      <Grid item xs={12} md={3}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Farmer Form
            </Typography>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Farmer Name"
                    type="text"
                    value={farmerName}
                    onChange={(e) => setFarmerName(e.target.value)}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Farmer Address"
                    type="text"
                    value={farmerAddress}
                    onChange={(e) => setFarmerAddress(e.target.value)}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Farmer Land Area"
                    type="text"
                    value={farmerLandArea}
                    onChange={(e) => setFarmerLandArea(e.target.value)}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Farmer Contact"
                    type="text"
                    value={farmerContact}
                    onChange={(e) => setFarmerContact(e.target.value)}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel id="type-label">Farm Type</InputLabel>
                    <Select
                      labelId="type-label"
                      value={farmType}
                      onChange={(e) => setFarmType(e.target.value)}
                    >
                      <MenuItem value="Arabica">Arabica</MenuItem>
                      <MenuItem value="Robusta">Robusta</MenuItem>
                      <MenuItem value="Mix">Mix</MenuItem>
                    </Select>
                  </FormControl>
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

      {/* Data Grid for Farmer Data */}
      <Grid item xs={12} md={9}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Farmer Data
            </Typography>
            <div style={{ height: 1000, width: '100%' }}>
              <DataGrid
                rows={farmerData}
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
          Farmer successfully added!
        </Alert>
      </Snackbar>
    </Grid>
  );
}

export default FarmerInputStation;