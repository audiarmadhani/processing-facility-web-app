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
  const [bagWeights, setBagWeights] = useState(['']);
  const [totalWeight, setTotalWeight] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('');
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
    try {
      const response = await fetch('https://processing-facility-backend.onrender.com/api/receiving');
      if (!response.ok) throw new Error("Failed to fetch receiving data");

      const data = await response.json();
      console.log("Fetched data:", data);

      if (data) {
        // Filter rows based on user role
        if (session.user.role === "staff") {
          setReceivingData(
            data.latestRows.map((row, index) => ({ ...row, id: index }))
          );
        } else if (["admin", "manager"].includes(session.user.role)) {
          setReceivingData(
            data.allRows.map((row, index) => ({ ...row, id: index }))
          );
        }
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

  const handleFarmerChange = (event) => {
    const selectedFarmerName = event.target.value;
    setFarmerName(selectedFarmerName);

    const farmerDetails = farmerList.find((farmer) => farmer.farmerName === selectedFarmerName);
    setSelectedFarmerDetails(farmerDetails || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Calculate totalAmount as weight * price
    const totalAmount = (parseFloat(totalWeight) || 0) * (parseFloat(price) || 0); // Ensure price is a number
  
    const payload = {
      farmerID: selectedFarmerDetails ? selectedFarmerDetails.farmerID : null, // Include farmer ID
      farmerName,
      notes,
      weight: totalWeight,
      totalBags: bagWeights.length,
      price: parseFloat(price) || 0, // Include price here
      type,
      paymentMethod,
      bagPayload: bagWeights.map((weight, index) => ({
        bagNumber: index + 1,
        weight: parseFloat(weight) || 0,
      })),
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
        // Prepare the payload for the payment API
        const paymentPayload = {
          farmerName, // Ensure this variable holds the correct value
          farmerID: selectedFarmerDetails ? selectedFarmerDetails.farmerID : null, // Include farmer ID
          totalAmount, // Calculate totalAmount based on weight and price
          date: new Date().toISOString(), // Use the current date
          paymentMethod,
          paymentDescription: 'Cherry receiving', // Fixed description
          isPaid: 0, // Set isPaid to 0
        };
  
        // Post to the payment API
        const paymentResponse = await fetch('https://processing-facility-backend.onrender.com/api/payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentPayload),
        });
  
        if (paymentResponse.ok) {
          // Clear form fields after successful submission to both APIs
          setFarmerName('');
          setBagWeights(['']);
          setNotes('');
          setNumberOfBags(1);
          setTotalWeight(0);
          setPrice('');
          setType('');
          setPaymentMethod('');
          fetchReceivingData(); // Fetch updated receiving data
          setSnackbarOpen(true); // Show success message for payment
        } else {
          const paymentErrorData = await paymentResponse.json();
          console.error(paymentErrorData.message || 'Error creating payment.');
        }
  
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
    { field: 'farmerID', headerName: 'Farmer ID', width: 100, sortable: true },
    { field: 'type', headerName: 'Type', width: 110, sortable: true },
    { field: 'weight', headerName: 'Total Weight (kg)', width: 150, sortable: true },
    { 
      field: 'price', 
      headerName: 'Price (/kg)', 
      width: 150, 
      sortable: true, 
      valueFormatter: (params) => {
        return new Intl.NumberFormat().format(params.value); // Format with thousand separators
      }
    },
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
                  <Autocomplete
                    options={farmerList}
                    getOptionLabel={(option) => option.farmerName}
                    value={selectedFarmerDetails} // This ensures the selected value is displayed correctly
                    onChange={(event, newValue) => {
                      setSelectedFarmerDetails(newValue); // Store the entire farmer object
                      setFarmerName(newValue ? newValue.farmerName : ""); // Update farmerName state
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Farmer Name" required fullWidth />
                    )}
                  />
                </Grid>

                {selectedFarmerDetails && (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        label="Farmer ID"
                        value={selectedFarmerDetails.farmerID}
                        fullWidth
                        InputProps={{
                          readOnly: true,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Farmer Address"
                        value={selectedFarmerDetails.farmerAddress}
                        fullWidth
                        InputProps={{
                          readOnly: true,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Bank Account"
                        value={selectedFarmerDetails.bankAccount}
                        fullWidth
                        InputProps={{
                          readOnly: true,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Bank Name"
                        value={selectedFarmerDetails.bankName}
                        fullWidth
                        InputProps={{
                          readOnly: true,
                        }}
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
                  <FormControl fullWidth required>
                    <InputLabel id="payment-label">Payment Method</InputLabel>
                    <Select
                      labelId="payment-label"
                      id="payment"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      input={<OutlinedInput label="Payment Method" />}
                      MenuProps={MenuProps}
                    >
                      <MenuItem value="Cash">Cash</MenuItem>
                      <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                      <MenuItem value="Check">Check</MenuItem>
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
      {["admin", "manager", "receiving"].includes(session?.user?.role) && (
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
                />
              </div>
            </CardContent>
          </Card>
        </Grid>
      )}

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