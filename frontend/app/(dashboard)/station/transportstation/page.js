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
  OutlinedInput,
  Autocomplete,
  Chip
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
import axios from 'axios';

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

  useEffect(() => {
    const fetchBatchNumbers = async () => {
      try {
        const response = await axios.get('https://processing-facility-backend.onrender.com/api/receiving');
        console.log('Batch Numbers Response:', response.data);
        const todayData = response.data.todayData;

        if (Array.isArray(todayData)) {
          const batchNumbers = todayData.map(item => item.batchNumber);
          setBatchNumbers(batchNumbers);
        } else {
          console.error('todayData is not an array:', todayData);
        }
      } catch (error) {
        console.error('Error fetching batch numbers:', error);
      }
    };

    const fetchFarmers = async () => {
      try {
        const response = await axios.get('https://processing-facility-backend.onrender.com/api/farmer');
        console.log('Farmers Response:', response.data);
        const allFarmers = response.data.allRows; // Use allRows to get all farmers

        if (Array.isArray(allFarmers)) {
          setFarmers(allFarmers); // Adjust based on your response structure
        } else {
          console.error('Farmers data is not an array:', allFarmers);
        }
      } catch (error) {
        console.error('Error fetching farmers:', error);
      }
    };

    fetchBatchNumbers();
    fetchFarmers();
  }, []);

  const fetchTransportData = async () => {
    try {
      const response = await fetch('https://processing-facility-backend.onrender.com/api/transport');
      if (!response.ok) throw new Error("Failed to fetch transport data");

      const data = await response.json();
      console.log("Fetched data:", data);

      if (data) {
        // Filter rows based on user role
        if (session.user.role === "staff") {
          setTransportData(
            data.allTransportData.map((row, index) => ({ ...row, id: index }))
          );
        } else if (["admin", "manager"].includes(session.user.role)) {
          setTransportData(
            data.allTransportData.map((row, index) => ({ ...row, id: index }))
          );
        }
      }
    } catch (error) {
      console.error("Error fetching transport data:", error);
      setTransportData([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('https://processing-facility-backend.onrender.com/api/transport', {
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

      console.log('Transport data submitted:', response.data);
      // Reset form or handle success
    } catch (error) {
      console.error('Error submitting transport data:', error);
    }
  };

  const handleBatchSelect = (event) => {
    setSelectedBatchNumbers(event.target.value);
  };

  const handlePaidToChange = (event) => {
    const selectedFarmer = farmers.find(farmer => farmer.farmerName === event.target.value);
    setPaidTo(event.target.value);
    if (selectedFarmer) {
      setFarmerID(selectedFarmer.farmerID); // Set farmerID when a farmer is selected
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
      {/* Receiving Station Form */}
      <Grid item xs={12} md={4}>
        <Card variant="outlined">
          <CardContent>
          <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
            Receiving Station Form
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
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    fullWidth
                    type="number"
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Paid To</InputLabel>
                    <Select
                      value={paidTo}
                      onChange={handlePaidToChange}
                    >
                      {farmers.map((farmer) => (
                        <MenuItem key={farmer.farmerID} value={farmer.farmerName}>
                          {farmer.farmerName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <MenuItem value="cash">Cash</MenuItem>
                      <MenuItem value="bank transfer">Bank Transfer</MenuItem>
                      <MenuItem value="check">Check</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Bank Account"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Bank Name"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12}>
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
      {["admin", "manager", "receiving"].includes(session?.user?.role) && (
        <Grid item xs={12} md={8}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h5" gutterBottom>
              Transport Data
              </Typography>
              <div style={{ height: 800, width: "100%" }}>
                <DataGrid
                  rows={transportData}
                  columns={columns}
                  pageSize={5}
                  rowsPerPageOptions={[5, 10, 20]}
                  disableSelectionOnClick
                  sortingOrder={["asc", "desc"]}
                  slots={{ toolbar: GridToolbar }}
                />
              </div>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Snackbar for notifications */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Transport data successfully created!
        </Alert>
      </Snackbar>
    </Grid>
  );
}

export default TransportStation;