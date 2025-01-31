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
  Chip,
  Autocomplete,
  OutlinedInput
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const TransportStation = () => {
  const { data: session, status } = useSession();
  const [batchNumbers, setBatchNumbers] = useState([]);
  const [selectedBatchNumbers, setSelectedBatchNumbers] = useState([]);
  const [desa, setDesa] = useState(null);
  const [kecamatan, setKecamatan] = useState(null);
  const [kabupaten, setKabupaten] = useState(null);
  const [cost, setCost] = useState('');
  const [paidTo, setPaidTo] = useState('');
  const [farmerID, setFarmerID] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [farmers, setFarmers] = useState([]);
  const [bankAccount, setBankAccount] = useState(null);
  const [bankName, setBankName] = useState('');
  const [transportData, setTransportData] = useState([]);
  const [locationData, setLocationData] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedFarmerDetails, setSelectedFarmerDetails] = useState(null);

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
      if (Array.isArray(data)) {
        setTransportData(
          data.map(row => ({
            ...row,
            cost: Number(row.cost), // Ensure cost is a number
            createdAt: new Date(row.createdAt).toLocaleString(), // Format timestamp
          }))
        );
      } else {
        throw new Error("Invalid data format received");
      }
    } catch (error) {
      console.error("Error fetching transport data:", error);
      setTransportData([]);
      setSnackbarMessage('Failed to fetch transport data.');
      setSnackbarOpen(true);
    }
  };

  const fetchLocationData = async () => {
    try {
      const response = await axios.get(`https://processing-facility-backend.onrender.com/api/location`);
      setLocationData(response.data || []);
    } catch (error) {
      console.error('Error fetching location data:', error);
      setSnackbarMessage('Failed to fetch location data.');
      setSnackbarOpen(true);
    }
  };

  useEffect(() => {
    if (session) {
      fetchBatchNumbers();
      fetchFarmers();
      fetchTransportData();
      fetchLocationData();
    }
  }, [session]);

  const handleKabupatenChange = (event, newValue) => {
    setKabupaten(newValue);
    setKecamatan(null);
    setDesa(null);
  };

  const handleKecamatanChange = (event, newValue) => {
    setKecamatan(newValue);
    setDesa(null);
  };

  const handleDesaChange = (event, newValue) => {
    setDesa(newValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      // Post to the transport API
      const response = await axios.post(`${API_BASE_URL}/transport`, {
        batchNumber: selectedBatchNumbers.join(','),
        desa,
        kecamatan,
        kabupaten,
        cost,
        paidTo,
        paymentMethod,
        farmerID: selectedFarmerDetails.farmerID,
        bankAccount,
        bankName,
      });
  
      if (response.status === 200) {
        // Prepare payment payload
        const paymentPayload = {
          farmerName: paidTo, // Assuming paidTo holds the farmer's name
          farmerID: selectedFarmerDetails.farmerID, // Ensure farmerID is defined
          totalAmount: parseFloat(cost) || 0, // Use the cost as totalAmount
          date: new Date().toISOString(), // Use the current date
          paymentMethod,
          paymentDescription: 'Transport Cost', // Fixed description
          isPaid: 0, // Set isPaid to 0
        };
  
        // Post to the payment API
        const paymentResponse = await axios.post(`${API_BASE_URL}/payment`, paymentPayload);
  
        if (paymentResponse.status === 200) {
          // Reset form fields
          setSelectedBatchNumbers([]); // Reset selected batch numbers
          setDesa('');
          setKecamatan('');
          setKabupaten('');
          setCost('');
          setPaidTo('');
          setPaymentMethod('');
          setBankAccount(null);
          setBankName('');
          setSnackbarMessage('Transport data and payment successfully created!');
          setSnackbarOpen(true);
  
          fetchTransportData(); // Fetch updated transport data
        } else {
          const paymentErrorData = await paymentResponse.data;
          console.error(paymentErrorData.message || 'Error creating payment data.');
          setSnackbarMessage(paymentErrorData.message || 'Error creating payment data.');
          setSnackbarOpen(true);
        }
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
      setSelectedFarmerDetails({
        farmerID: selectedFarmer.farmerID,
        farmerAddress: selectedFarmer.farmerAddress || 'N/A',  // Ensure address is handled
        bankAccount: selectedFarmer.bankAccount,
        bankName: selectedFarmer.bankName,
      });
    } else {
      setSelectedFarmerDetails(null);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const columns = [
    { field: 'batchNumber', headerName: 'Batch Number', sortable: true },
    { field: 'kabupaten', headerName: 'Kabupaten', sortable: true },
    { field: 'kecamatan', headerName: 'Kecamatan', sortable: true },
    { field: 'desa', headerName: 'Desa', sortable: true },
    { field: 'cost', headerName: 'Cost', sortable: true },
    { field: 'paidTo', headerName: 'Paid To', sortable: true },
    { field: 'bankAccount', headerName: 'Bank Account', sortable: true },
    { field: 'bankName', headerName: 'Bank Name', sortable: true },
  ];

  const kabupatenList = [...new Set(locationData.map(item => item.kabupaten))];
  const kecamatanList = kabupaten ? [...new Set(locationData.filter(item => item.kabupaten === kabupaten).map(item => item.kecamatan))] : [];
  const desaList = kecamatan ? locationData.filter(item => item.kecamatan === kecamatan).map(item => item.desa) : [];

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
                      input={<OutlinedInput label="Batch Number" />}
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
                  <Autocomplete
                    options={kabupatenList}
                    value={kabupaten}
                    onChange={handleKabupatenChange}
                    renderInput={(params) => <TextField {...params} label="Kabupaten" />}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Autocomplete
                    options={kecamatanList}
                    value={kecamatan}
                    onChange={handleKecamatanChange}
                    disabled={!kabupaten}
                    renderInput={(params) => <TextField {...params} label="Kecamatan" />}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Autocomplete
                    options={desaList}
                    value={desa}
                    onChange={handleDesaChange}
                    disabled={!kecamatan}
                    renderInput={(params) => <TextField {...params} label="Desa" />}
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
                    <Select 
                      value={paidTo} onChange={handlePaidToChange}
                      input={<OutlinedInput label="Paid To" />}
                    >
                      {farmers.map((farmer) => (
                        <MenuItem key={farmer.farmerID} value={farmer.farmerName}>
                          {farmer.farmerName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {selectedFarmerDetails && (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        label="Farmer ID"
                        value={selectedFarmerDetails.farmerID}
                        fullWidth
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
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
                  <FormControl fullWidth>
                    <InputLabel>Payment Method</InputLabel>
                    <Select 
                      value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                      input={<OutlinedInput label="Payment Method" />}
                      >
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
                autosizeOnMount
                autosizeOptions={{
                  includeHeaders: true,
                  includeOutliers: true,
                  expand: true,
                }}
              />
            </div>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default TransportStation;