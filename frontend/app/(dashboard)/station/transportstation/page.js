"use client"

import React, { useEffect, useState } from 'react';
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
  Chip
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const TransportStation = () => {
  const { data: session, status } = useSession();
  const [batchNumbers, setBatchNumbers] = useState([]);
  const [selectedBatchNumbers, setSelectedBatchNumbers] = useState([]);
  const [desa, setDesa] = useState('');
  const [kecamatan, setKecamatan] = useState('');
  const [kabupaten, setKabupaten] = useState('');
  const [cost, setCost] = useState('');
  const [paidTo, setPaidTo] = useState('');
  const [farmerID, setFarmerID] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [farmers, setFarmers] = useState([]);
  const [bankAccount, setBankAccount] = useState('');
  const [bankName, setBankName] = useState('');
  const [transportData, setTransportData] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    const fetchBatchNumbers = async () => {
      try {
        const response = await axios.get(`https://processing-facility-backend.onrender.com/api/receiving`);
        const todayData = response.data.todayData;

        if (Array.isArray(todayData)) {
          const batchNumbers = todayData.map(item => item.batchNumber);
          setBatchNumbers(batchNumbers);
        } else {
          console.error('todayData is not an array:', todayData);
        }
      } catch (error) {
        console.error('Error fetching batch numbers:', error);
        setSnackbarMessage('Failed to fetch batch numbers.');
        setSnackbarOpen(true);
      }
    };

    const fetchFarmers = async () => {
      try {
        const response = await axios.get(`https://processing-facility-backend.onrender.com/api/farmer`);
        const allFarmers = response.data.allRows;

        if (Array.isArray(allFarmers)) {
          setFarmers(allFarmers);
        } else {
          console.error('Farmers data is not an array:', allFarmers);
        }
      } catch (error) {
        console.error('Error fetching farmers:', error);
        setSnackbarMessage('Failed to fetch farmers.');
        setSnackbarOpen(true);
      }
    };

    const fetchTransportData = async () => {
      try {
        const response = await fetch(`https://processing-facility-backend.onrender.com/api/transport`);
        if (!response.ok) throw new Error("Failed to fetch transport data");
  
        const data = await response.json();
        if (data) {
          const userRole = session.user.role;
          setTransportData(
            data.allTransportData.map((row, index) => ({ ...row, id: index }))
          );
        }
      } catch (error) {
        console.error("Error fetching transport data:", error);
        setTransportData([]);
        setSnackbarMessage('Failed to fetch transport data.');
        setSnackbarOpen(true);
      }
    };

    fetchBatchNumbers();
    fetchFarmers();
    fetchTransportData();
  }, [session]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${API_BASE_URL}/transport`, {
        batchNumber: selectedBatchNumbers.join(','),
        desa,
        kecamatan,
        kabupaten,
        cost,
        paidTo,
        paymentMethod,
        farmerID,
        bankAccount,
        bankName,
      });

      if (response.status === 200) {
        setSelectedBatchNumbers([]); // Reset selected batch numbers
        setDesa('');
        setKecamatan('');
        setKabupaten('');
        setCost('');
        setPaidTo('');
        setPaymentMethod('');
        setBankAccount('');
        setBankName('');
        fetchTransportData();
        setSnackbarMessage('Transport data successfully created!');
        setSnackbarOpen(true);
      } else {
        const errorData = await response.data;
        console.error(errorData.message || 'Error creating transport data.');
        setSnackbarMessage(errorData.message || 'Error creating transport data.');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Failed to communicate with the backend:', error);
      setSnackbarMessage('Failed to create transport data.');
      setSnackbarOpen(true);
    }
  };

  const handleBatchSelect = (event) => {
    setSelectedBatchNumbers(event.target.value);
  };

  const handlePaidToChange = (event) => {
    const selectedFarmer = farmers.find(farmer => farmer.farmerName === event.target.value);
    setPaidTo(event.target.value);
    if (selectedFarmer) {
      setFarmerID(selectedFarmer.farmerID);
      setBankAccount(selectedFarmer.bankAccount);
      setBankName(selectedFarmer.bankName);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const columns = [
    { field: 'batchNumber', headerName: 'Batch Number', width: 160, sortable: true },
    { field: 'receivingDate', headerName: 'Received Date', width: 160, sortable: true },
    { field: 'farmerName', headerName: 'Farmer Name', width: 180, sortable: true },
    { field: 'farmerID', headerName: 'Farmer ID', width: 100, sortable: true },
    { field: 'type', headerName: 'Type', width: 110, sortable: true },
    { field: 'weight', headerName: 'Total Weight (kg)', width: 150, sortable: true },
    { field: 'price', headerName: 'Price (/kg)', width: 150, sortable: true },
    { field: 'paymentMethod', headerName: 'Payment Method', width: 180, sortable: true },
    { field: 'notes', headerName: 'Notes', width: 250, sortable: true },
  ];

  // Show loading screen while session is loading
  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  // Redirect to the sign-in page if the user is not logged in or doesn't have the admin role
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'manager' && session.user.role !== 'receiving')) {
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
              Transport Station Form
            </Typography>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Batch Number</InputLabel>
                    <Select
                      multiple
                      value={selectedBatchNumbers}
                      onChange={handleBatchSelect}
                      renderValue={(selected) => (
                        <div>
                          {selected.map((value) => (
                            <Chip key={value} label={value} />
                          ))}
                        </div>
                      )}
                    >
                      {batchNumbers.map((batchNumber) => (
                        <MenuItem key={batchNumber} value={batchNumber}>
                          {batchNumber}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Desa"
                    value={desa}
                    onChange={(e) => setDesa(e.target.value)}
                    fullWidth
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Kecamatan"
                    value={kecamatan}
                    onChange={(e) => setKecamatan(e.target.value)}
                    fullWidth
                    required
                  />
                </Grid>
                  
                <Grid item xs={12}>
                  <TextField
                    label="Kabupaten"
                    value={kabupaten}
                    onChange={(e) => setKabupaten(e.target.value)}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Cost"
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Paid To</InputLabel>
                    <Select value={paidTo} onChange={handlePaidToChange}>
                      {farmers.map((farmer) => (
                        <MenuItem key={farmer.farmerID} value={farmer.farmerName}>
                          {farmer.farmerName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Method</InputLabel>
                    <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                      <MenuItem value="cash">Cash</MenuItem>
                      <MenuItem value="bank transfer">Bank Transfer</MenuItem>
                      <MenuItem value="check">Check</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Button type="submit" variant="contained" color="primary">
                    Submit
                  </Button>
                </Grid>
              </Grid>
            </form>
            <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
              <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
                {snackbarMessage}
              </Alert>
            </Snackbar>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={8}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Transport Data
            </Typography>
            <div style={{ height: 400, width: '100%' }}>
              <DataGrid
                rows={transportData}
                columns={columns}
                pageSize={5}
                rowsPerPageOptions={[5]}
                components={{ Toolbar: GridToolbar }}
                disableSelectionOnClick
              />
            </div>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default TransportStation;