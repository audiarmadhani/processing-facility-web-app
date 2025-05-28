"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import {
  TextField, Button, Typography, Snackbar, Alert, Grid, Card, CardContent,
  FormControl, InputLabel, Select, MenuItem, Chip, Autocomplete, OutlinedInput
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import axios from 'axios';

const TransportStation = () => {
  const { data: session, status } = useSession();
  const [batchNumbers, setBatchNumbers] = useState([]);
  const [selectedBatchNumbers, setSelectedBatchNumbers] = useState([]);
  const [desa, setDesa] = useState(null);
  const [kecamatan, setKecamatan] = useState(null);
  const [kabupaten, setKabupaten] = useState(null);
  const [cost, setCost] = useState('');
  const [paidTo, setPaidTo] = useState('');
  const [isOtherFarmer, setIsOtherFarmer] = useState(false);
  const [customPaidTo, setCustomPaidTo] = useState('');
  const [customFarmerAddress, setCustomFarmerAddress] = useState('');
  const [customBankAccount, setCustomBankAccount] = useState('');
  const [customBankName, setCustomBankName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [farmers, setFarmers] = useState([]);
  const [transportData, setTransportData] = useState([]);
  const [locationData, setLocationData] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedFarmerDetails, setSelectedFarmerDetails] = useState(null);

  const fetchBatchNumbers = async () => {
    try {
      const response = await axios.get('https://processing-facility-backend.onrender.com/api/receiving');
      setBatchNumbers(response.data.todayData?.map(item => item.batchNumber) || []);
    } catch (error) {
      setSnackbarMessage('Failed to fetch batch numbers.');
      setSnackbarOpen(true);
    }
  };

  const fetchFarmers = async () => {
    try {
      const response = await axios.get('https://processing-facility-backend.onrender.com/api/farmer');
      setFarmers(response.data.allRows || []);
    } catch (error) {
      setSnackbarMessage('Failed to fetch farmers.');
      setSnackbarOpen(true);
    }
  };

  const fetchTransportData = async () => {
    try {
      const response = await fetch('https://processing-facility-backend.onrender.com/api/transport');
      if (!response.ok) throw new Error('Failed to fetch transport data');
      const data = await response.json();
      setTransportData(data.map(row => ({
        ...row,
        cost: Number(row.cost) || 0,
        createdAt: new Date(row.createdAt).toLocaleString()
      })) || []);
    } catch (error) {
      setTransportData([]);
      setSnackbarMessage('Failed to fetch transport data.');
      setSnackbarOpen(true);
    }
  };

  const fetchLocationData = async () => {
    try {
      const response = await axios.get('https://processing-facility-backend.onrender.com/api/location');
      setLocationData(response.data || []);
    } catch (error) {
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

  const handlePaidToChange = (event) => {
    const value = event.target.value;
    setPaidTo(value);
    if (value === 'Others') {
      setIsOtherFarmer(true);
      setSelectedFarmerDetails(null);
      setCustomPaidTo('');
      setCustomFarmerAddress('');
      setCustomBankAccount('');
      setCustomBankName('');
    } else {
      setIsOtherFarmer(false);
      const selectedFarmer = farmers.find(farmer => farmer.farmerName === value);
      setSelectedFarmerDetails(selectedFarmer ? {
        farmerID: selectedFarmer.farmerID,
        farmerAddress: selectedFarmer.farmerAddress || 'N/A',
        bankAccount: selectedFarmer.bankAccount || '',
        bankName: selectedFarmer.bankName || ''
      } : null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isOtherFarmer && !customPaidTo) {
      setSnackbarMessage('Please enter a name for Paid To.');
      setSnackbarOpen(true);
      return;
    }
    try {
      const payload = {
        batchNumber: selectedBatchNumbers.join(','),
        desa,
        kecamatan,
        kabupaten,
        cost: Number(cost) || 0,
        paidTo: isOtherFarmer ? customPaidTo : paidTo,
        farmerID: isOtherFarmer ? null : selectedFarmerDetails?.farmerID,
        paymentMethod,
        bankAccount: isOtherFarmer ? customBankAccount || null : selectedFarmerDetails?.bankAccount || null,
        bankName: isOtherFarmer ? customBankName || null : selectedFarmerDetails?.bankName || null
      };
      const response = await axios.post('https://processing-facility-backend.onrender.com/api/transport', payload);
      if (response.status === 201) {
        const paymentPayload = {
          farmerName: isOtherFarmer ? customPaidTo : paidTo,
          farmerID: isOtherFarmer ? null : selectedFarmerDetails?.farmerID,
          totalAmount: Number(cost) || 0,
          date: new Date().toISOString(),
          paymentMethod,
          paymentDescription: 'Transport Cost',
          isPaid: 0
        };
        const paymentResponse = await axios.post('https://processing-facility-backend.onrender.com/api/payment', paymentPayload);
        if (paymentResponse.status === 200) {
          setSelectedBatchNumbers([]);
          setDesa(null);
          setKecamatan(null);
          setKabupaten(null);
          setCost('');
          setPaidTo('');
          setCustomPaidTo('');
          setCustomFarmerAddress('');
          setCustomBankAccount('');
          setCustomBankName('');
          setIsOtherFarmer(false);
          setPaymentMethod('');
          setSelectedFarmerDetails(null);
          setSnackbarMessage('Transport data and payment created successfully!');
          setSnackbarOpen(true);
          fetchTransportData();
        } else {
          throw new Error('Failed to create payment data');
        }
      }
    } catch (error) {
      setSnackbarMessage(error.message || 'Failed to create transport data.');
      setSnackbarOpen(true);
    }
  };

  const columns = [
    { field: 'batchNumber', headerName: 'Batch Number', sortable: true },
    { field: 'createdAtTrunc', headerName: 'Created At', sortable: true },
    { field: 'kabupaten', headerName: 'Kabupaten', sortable: true },
    { field: 'kecamatan', headerName: 'Kecamatan', sortable: true },
    { field: 'desa', headerName: 'Desa', sortable: true },
    { field: 'cost', headerName: 'Cost', sortable: true },
    { field: 'paidTo', headerName: 'Paid To', sortable: true },
    { field: 'bankAccount', headerName: 'Bank Account', sortable: true },
    { field: 'bankName', headerName: 'Bank Name', sortable: true }
  ];

  const kabupatenList = [...new Set(locationData.map(item => item.kabupaten))];
  const kecamatanList = kabupaten ? [...new Set(locationData.filter(item => item.kabupaten === kabupaten).map(item => item.kecamatan))] : [];
  const desaList = kecamatan ? locationData.filter(item => item.kecamatan === kecamatan).map(item => item.desa) : [];

  if (status === 'loading') return <p>Loading...</p>;
  if (!session?.user || !['admin', 'manager', 'receiving'].includes(session.user.role)) {
    return <Typography variant="h6">Access Denied</Typography>;
  }

  return (
    <Grid container spacing={3} sx={{ p: 2 }}>
      <Grid item xs={12} md={4}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>Transport Station Form</Typography>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Batch Number</InputLabel>
                    <Select
                      multiple
                      value={selectedBatchNumbers}
                      onChange={e => setSelectedBatchNumbers(e.target.value)}
                      input={<OutlinedInput label="Batch Number" />}
                      renderValue={selected => (
                        <div>
                          {selected.map(value => <Chip key={value} label={value} />)}
                        </div>
                      )}
                    >
                      {batchNumbers.map(batchNumber => (
                        <MenuItem key={batchNumber} value={batchNumber}>{batchNumber}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Autocomplete
                    options={kabupatenList}
                    value={kabupaten}
                    onChange={handleKabupatenChange}
                    renderInput={params => <TextField {...params} label="Kabupaten" />}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Autocomplete
                    options={kecamatanList}
                    value={kecamatan}
                    onChange={handleKecamatanChange}
                    disabled={!kabupaten}
                    renderInput={params => <TextField {...params} label="Kecamatan" />}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Autocomplete
                    options={desaList}
                    value={desa}
                    onChange={handleDesaChange}
                    disabled={!kecamatan}
                    renderInput={params => <TextField {...params} label="Desa" />}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Cost"
                    type="number"
                    value={cost}
                    onChange={e => setCost(e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Paid To</InputLabel>
                    <Select
                      value={paidTo}
                      onChange={handlePaidToChange}
                      input={<OutlinedInput label="Paid To" />}
                    >
                      {farmers.map(farmer => (
                        <MenuItem key={farmer.farmerID} value={farmer.farmerName}>
                          {farmer.farmerName}
                        </MenuItem>
                      ))}
                      <MenuItem value="Others">Others</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {isOtherFarmer && (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        label="Paid To Name"
                        value={customPaidTo}
                        onChange={e => setCustomPaidTo(e.target.value)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Address"
                        value={customFarmerAddress}
                        onChange={e => setCustomFarmerAddress(e.target.value)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Bank Account"
                        value={customBankAccount}
                        onChange={e => setCustomBankAccount(e.target.value)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Bank Name"
                        value={customBankName}
                        onChange={e => setCustomBankName(e.target.value)}
                        fullWidth
                      />
                    </Grid>
                  </>
                )}
                {!isOtherFarmer && selectedFarmerDetails && (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        label="Farmer ID"
                        value={selectedFarmerDetails.farmerID || ''}
                        fullWidth
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Farmer Address"
                        value={selectedFarmerDetails.farmerAddress || 'N/A'}
                        fullWidth
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Bank Account"
                        value={selectedFarmerDetails.bankAccount || ''}
                        fullWidth
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Bank Name"
                        value={selectedFarmerDetails.bankName || ''}
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
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value)}
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
            <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)}>
              <Alert severity="error" sx={{ width: '100%' }}>{snackbarMessage}</Alert>
            </Snackbar>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={8}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>Transport Data</Typography>
            <div style={{ height: 400, width: '100%' }}>
              <DataGrid
                rows={transportData}
                columns={columns}
                pageSizeOptions={[5]}
                slots={{ toolbar: GridToolbar }}
                disableRowSelectionOnClick
                autoHeight
                rowHeight={35}
              />
            </div>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default TransportStation;