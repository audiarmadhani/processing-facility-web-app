"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import {
  TextField, Button, Typography, Snackbar, Alert, Grid, Card, CardContent,
  FormControl, InputLabel, Select, MenuItem, Chip, Autocomplete, OutlinedInput,
  Collapse, Tooltip
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
  const [loadingWorkerCount, setLoadingWorkerCount] = useState('');
  const [loadingWorkerCostPerPerson, setLoadingWorkerCostPerPerson] = useState('');
  const [unloadingWorkerCount, setUnloadingWorkerCount] = useState('');
  const [unloadingWorkerCostPerPerson, setUnloadingWorkerCostPerPerson] = useState('');
  const [harvestWorkerCount, setHarvestWorkerCount] = useState('');
  const [harvestWorkerCostPerPerson, setHarvestWorkerCostPerPerson] = useState('');
  const [transportCostFarmToCollection, setTransportCostFarmToCollection] = useState('');
  const [transportCostCollectionToFacility, setTransportCostCollectionToFacility] = useState('');
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
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [selectedFarmerDetails, setSelectedFarmerDetails] = useState(null);
  const [farmerName, setFarmerName] = useState('');
  const [contractType, setContractType] = useState('');

  const fetchBatchNumbers = async () => {
    try {
      const response = await axios.get('https://processing-facility-backend.onrender.com/api/receiving');
      setBatchNumbers(response.data.allRows?.map(item => ({
        batchNumber: item.batchNumber,
        farmerId: item.farmerID,
        farmerName: item.farmerName
      })) || []);
    } catch (error) {
      setSnackbarMessage('Failed to fetch batch numbers.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const fetchFarmers = async () => {
    try {
      const response = await axios.get('https://processing-facility-backend.onrender.com/api/farmer');
      setFarmers(response.data.allRows || []);
    } catch (error) {
      setSnackbarMessage('Failed to fetch farmers.');
      setSnackbarSeverity('error');
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
        loadingWorkerCount: Number(row.loadingWorkerCount) || 0,
        loadingWorkerCostPerPerson: Number(row.loadingWorkerCostPerPerson) || 0,
        unloadingWorkerCount: Number(row.unloadingWorkerCount) || 0,
        unloadingWorkerCostPerPerson: Number(row.unloadingWorkerCostPerPerson) || 0,
        harvestWorkerCount: Number(row.harvestWorkerCount) || 0,
        harvestWorkerCostPerPerson: Number(row.harvestWorkerCostPerPerson) || 0,
        transportCostFarmToCollection: Number(row.transportCostFarmToCollection) || 0,
        transportCostCollectionToFacility: Number(row.transportCostCollectionToFacility) || 0,
        totalCost: Number(row.totalCost) ||0,
        createdAt: new Date(row.createdAt).toLocaleString()
      })) || []);
    } catch(error) {
      setTransportData([]);
      setSnackBarMessage('Failed to fetch transport data');
      setSnackBarSeverity('error');
      setSnackBarOpen(true);
    }
  };

  const fetchLocationData = async () => {
    try {
      const response = await axios.get('https://processing-facility-backend.onrender.com/api/location');
      setLocationData(response.data ||[]);
    } catch (error) {
      setSnackBarMessage('Failed to fetch location data');
      setSnackBarSeverity('error');
      setSnackBarOpen(true);
    }
  };

  const fetchContractType = async (farmerId) => {
    try {
      const response = await axios.get(`https://processing-facility-backend.onrender.com/api/farmer/${farmerId}`);
      setContractType(response.data.contractType || '');
      setFarmerName(response.data.farmerName || '');
    } catch (error) {
      setSnackBarMessage('Failed to fetch contract type');
      setSnackBarSeverity('error');
      setSnackBarOpen(true);
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

  useEffect(() => {
    if (selectedBatchNumbers.length > 0) {
      const selectedBatches =batchNumbers.filter(batch => 
        selectedBatchNumbers.includes(batch.batchNumber));
      const uniqueFarmerIds = [...new Set(selectedBatches.map(batch => batch.farmerId))];
      if (uniqueFarmerIds.length > 1) {
        setSnackBarMessage('Please select batch numbers from the same farmer');
        setSnackBarSeverity('error');
        setSnackBarOpen(true);
        setSelectedBatchNumbers([]);
        setContractedType('');
        setFarmerName('');
      } else if (uniqueFarmerIds.length === 1) {
        fetchContractType(uniqueFarmerIds[0]);
      } else {
        setContractType('');
        setFarmerName('');
      }
    }
  }, [selectedBatchNumbers, batchNumbers]);

  const handleKabupatenChange = (event, newValue) => {
    setKabupaten(newValue);
    setKecamatan(null);
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
        farmerID: selectedFarmer.farmerId,
        farmerAddress: selectedFarmer.farmerAddress ||'N/A',
        bankAccount: selectedFarmer.bankAccount || '',
        bankName: selectedFarmer.bankName || ''
      } : null);
    }
  };

  const calculateTotalCost = () => {
    const loadingCost = Number(loadingWorkerCount) * Number(loadingWorkerCostPerPerson);
    const unloadingCostPerPerson = Number(unloadingWorkerCount) * Number(unloadingCostWorkerCostPerPerson);
    const harvestCost = Number(harvestWorkerCount) * Number(harvestCostWorkerCountPerPerson);
    const transportCost = contractType === 'Kontrak Lahan' ? 
      (Number(transportCostFarmToCollection) + Number(transportCostToCollectionToFacility)) :
      Number(cost);

    return loadingCost + unloadingCost + harvestCost + transportCost;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedBatchNumbers.length) {
      setSnackBarMessage('Please select at least one batch number');
      setSnackBarSeverity('error');
      setSnackBarOpen(true);
      return;
    }

    if (!desa || !kecamatan || !kabupaten) {
      setSnackBarMessage('Please complete all location fields');
      setSnackBarSeverity('error');
      setSnackBarOpen(true);
      return;
    }

    if (isOtherFarmer && !customPaidTo) {
      setSnackBarMessage('Please enter a name for Paid To');
      setSnackBarSeverity('error');
      setSnackBarOpen(true);
      return;
    }

    if (!paymentMethod) {
      setSnackBarMessage('Please select a payment method');
      setSnackBarSeverity('error');
      setSnackBarOpen(true);
      return;
    }

    try {
      const payload = {
        batchNumber: selectedBatchNumbers.join(','),
        desa,
        kecamatan,
        kabupaten,
        cost: contractType === 'Kontrak Lahan' ? null : Number(cost) || 0,
        loadingWorkerCount: Number(loadingWorkerCount) || null,
        loadingWorkerCostPerPerson: Number(loadingWorkerCostPerPerson) || null,
        unloadingWorkerCount: Number(unloadingWorkerCount) || null,
        unloadingWorkerCostPerPerson: Number(unloadingWorkerCostPerPerson) || null,
        harvestWorkerCount: contractType === 'Kontrak Lahan' ? Number(harvestWorkerCount) || null : null,
        harvestWorkerCostPerPerson: contractType === 'Kontrak Lahan' ? Number(harvestWorkerCostPerPerson) || null : null,
        transportCostFarmToCollection: contractType === 'Kontrak Lahan' ? Number(transportCostFarmToCollection) || null : null,
        transportCostCollectionToFacility: contractType === 'Kontrak Lahan' ? Number(transportCostCollectionToFacility) || null : null,
        paidTo: isOtherFarmer ? customPaidTo : paidTo,
        farmerID: isOtherFarmer ? null : selectedFarmerDetails?.farmerID,
        paymentMethod,
        bankAccount: isOtherFarmer ? customBankAccount || null : selectedFarmerDetails?.bankAccount || null,
        bankName: isOtherFarmer ? customBankName || null : selectedFarmerDetails?.bankName || null
      };

      const response = await axios.post('https://processing-facility-backend.onrender.com/api/transport', payload);
      if (response.status === 201) {
        const totalCost = calculateTotalCost();
        const paymentPayload = {
          farmerName: isOtherFarmer ? customPaidTo : paidTo,
          farmerID: isOtherFarmer ? null : selectedFarmerDetails?.farmerID,
          totalAmount: totalCost || 0,
          date: new Date().toISOString(),
          paymentMethod,
          paymentDescription: 'Transport and Manpower Cost',
          isPaid: 0
        };

        const paymentResponse = await axios.post('https://processing-facility-backend.onrender.com/api/payment', paymentPayload);
        if (paymentResponse.status === 200) {
          setSelectedBatchNumbers([]);
          setDesa(null);
          setKecamatan(null);
          setKabupaten(null);
          setCost('');
          setLoadingWorkerCount('');
          setLoadingWorkerCostPerPerson('');
          setUnloadingWorkerCount('');
          setUnloadingWorkerCostPerPerson('');
          setHarvestWorkerCount('');
          setHarvestWorkerCostPerPerson('');
          setTransportCostFarmToCollection('');
          setTransportCostCollectionToFacility('');
          setPaidTo('');
          setCustomPaidTo('');
          setCustomFarmerAddress('');
          setCustomBankAccount('');
          setCustomBankName('');
          setIsOtherFarmer(false);
          setPaymentMethod('');
          setSelectedFarmerDetails(null);
          setFarmerName('');
          setContractType('');
          setSnackbarMessage('Transport data and payment created successfully!');
          setSnackBarSeverity('success');
          setSnackBarOpen(true);
          fetchTransportData();
        } else {
          throw new Error('Failed to create payment data');
        }
      }
    } catch (error) {
          setSnackBarMessage(error.message || 'Failed to create transport data');
          setSnackBarSeverity('error');
          setSnackBarOpen(true);
      }
    };

  const columns = [
    { field: 'batchNumber', headerName: 'Batch Number', width: 150 },
    { field: 'createdAtTrunc', headerName: 'Receiving Date', width: 150 },
    { field: 'kabupaten', headerName: 'Kabupaten', width: 150 },
    { field: 'kecamatan', headerName: 'Kecamatan', width: 150 },
    { field: 'desa', headerName: 'Desa', width: 150 },
    {
      field: 'cost',
      headerName: 'Transport Cost (Farm to Facility)',
      width: 180,
      sortable: true,
      renderCell: ({ value }) => {
        if (value == null || isNaN(value)) return 'N/A';
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0
        }).format(value);
      }
    },
    {
      field: 'transportCostFarmToCollection',
      headerName: 'Transport Cost (Farm to Collection)',
      width: 180,
      sortable: true,
      renderCell: ({ value }) => {
        if (value == null || isNaN(value)) return 'N/A';
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0
        }).format(value);
      }
    },
    {
      field: 'transportCostCollectionToFacility',
      headerName: 'Transport Cost (Collection to Facility)',
      width: 180,
      sortable: true,
      renderCell: ({ value }) => {
        if (value == null || isNaN(value)) return 'N/A';
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0
        }).format(value);
      }
    },
    {
      field: 'loadingWorkerCost',
      headerName: 'Loading Worker Cost',
      width: 180,
      sortable: true,
      renderCell: ({ row }) => {
        const value = (Number(row.loadingWorkerCount) || 0) * (Number(row.loadingWorkerCostPerPerson) || 0);
        if (value == null || isNaN(value)) return 'N/A';
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0
        }).format(value);
      }
    },
    {
      field: 'unloadingWorkerCost',
      headerName: 'Unloading Worker Cost',
      width: 180,
      sortable: true,
      renderCell: ({ row }) => {
        const value = (Number(row.unloadingWorkerCount) || 0) * (Number(row.unloadingWorkerCostPerPerson) || 0);
        if (value == null || isNaN(value)) return 'N/A';
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0
        }).format(value);
      }
    },
    {
      field: 'harvestWorkerCost',
      headerName: 'Harvest Worker Cost',
      width: 180,
      sortable: true,
      renderCell: ({ row }) => {
        const value = (Number(row.harvestWorkerCount) || 0) * (Number(row.harvestWorkerCostPerPerson) || 0);
        if (value == null || isNaN(value)) return 'N/A';
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0
        }).format(value);
      }
    },
    {
      field: 'totalCost',
      headerName: 'Total Cost',
      width: 180,
      sortable: true,
      renderCell: ({ value }) => {
        if (value == null || isNaN(value)) return 'N/A';
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0
        }).format(value);
      }
    },
    { field: 'paidTo', headerName: 'Paid To', width: 150 },
    { field: 'bankAccount', headerName: 'Bank Account Number', width: 200 },
    { field: 'bankName', headerName: 'Bank Name', width: 150 },
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
                      {batchNumbers.map(batch => (
                        <MenuItem key={batch.batchNumber} value={batch.batchNumber}>{batch.batchNumber}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Farmer Name"
                    value={farmerName}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Contract Type"
                    value={contractType}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
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
                  <Typography variant="h6" sx={{ mt: 2 }}>Cost Details</Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label={contractType === 'Kontrak Lahan' ? 'Transport Cost (Collection Point to Facility)' : 'Transport Cost (Farm to Facility)'}
                    type="number"
                    value={contractType === 'Kontrak Lahan' ? transportCostCollectionToFacility : cost}
                    onChange={e => contractType === 'Kontrak Lahan' ? setTransportCostCollectionToFacility(e.target.value) : setCost(e.target.value)}
                    fullWidth
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <Tooltip title="Number of workers loading cherries onto the truck">
                    <TextField
                      label="Loading Workers Count"
                      type="number"
                      value={loadingWorkerCount}
                      onChange={e => setLoadingWorkerCount(e.target.value)}
                      fullWidth
                      inputProps={{ min: 0 }}
                    />
                  </Tooltip>
                </Grid>
                <Grid item xs={4}>
                  <Tooltip title="Cost per worker for loading (IDR)">
                    <TextField
                      label="Cost per Loading Worker"
                      type="number"
                      value={loadingWorkerCostPerPerson}
                      onChange={e => setLoadingWorkerCostPerPerson(e.target.value)}
                      fullWidth
                      inputProps={{ min: 0 }}
                    />
                  </Tooltip>
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Total Loading Cost"
                    value={(Number(loadingWorkerCount) * Number(loadingWorkerCostPerPerson)).toFixed(0)}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <Tooltip title="Number of workers unloading cherries from the truck">
                    <TextField
                      label="Unloading Workers Count"
                      type="number"
                      value={unloadingWorkerCount}
                      onChange={e => setUnloadingWorkerCount(e.target.value)}
                      fullWidth
                      inputProps={{ min: 0 }}
                    />
                  </Tooltip>
                </Grid>
                <Grid item xs={4}>
                  <Tooltip title="Cost per worker for unloading (IDR)">
                    <TextField
                      label="Cost per Unloading Worker"
                      type="number"
                      value={unloadingWorkerCostPerPerson}
                      onChange={e => setUnloadingWorkerCostPerPerson(e.target.value)}
                      fullWidth
                      inputProps={{ min: 0 }}
                    />
                  </Tooltip>
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Total Unloading Cost"
                    value={(Number(unloadingWorkerCount) * Number(unloadingWorkerCostPerPerson)).toFixed(0)}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Collapse in={contractType === 'Kontrak Lahan'}>
                  <Grid item xs={12}>
                    <TextField
                      label="Transport Cost (Farm to Collection Point)"
                      type="number"
                      value={transportCostFarmToCollection}
                      onChange={e => setTransportCostFarmToCollection(e.target.value)}
                      fullWidth
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <Tooltip title="Number of workers harvesting cherries at the farm">
                      <TextField
                        label="Harvest Workers Count (Buruh Petik)"
                        type="number"
                        value={harvestWorkerCount}
                        onChange={e => setHarvestWorkerCount(e.target.value)}
                        fullWidth
                        inputProps={{ min: 0 }}
                      />
                    </Tooltip>
                  </Grid>
                  <Grid item xs={4}>
                    <Tooltip title="Cost per worker for harvesting (IDR)">
                      <TextField
                        label="Cost per Harvest Worker"
                        type="number"
                        value={harvestWorkerCostPerPerson}
                        onChange={e => setHarvestWorkerCostPerPerson(e.target.value)}
                        fullWidth
                        inputProps={{ min: 0 }}
                      />
                    </Tooltip>
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      label="Total Harvest Cost"
                      value={(Number(harvestWorkerCount) * Number(harvestWorkerCostPerPerson)).toFixed(0)}
                      fullWidth
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                </Collapse>
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
              <Alert severity={snackbarSeverity} sx={{ width: '100%' }}>{snackbarMessage}</Alert>
            </Snackbar>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={8}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>Transport Data</Typography>
            <div style={{ height: 520, width: '100%' }}>
              <DataGrid
                rows={transportData}
                columns={columns}
                pageSize={5}
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

export default TransportStation;