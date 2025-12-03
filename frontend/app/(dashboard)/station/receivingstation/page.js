"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
  Tabs,
  Tab,
  Box
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import dayjs from 'dayjs';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://processing-facility-backend.onrender.com';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function ReceivingStation() {
  const { data: session, status } = useSession();

  // Form state
  const [farmerName, setFarmerName] = useState('');
  const [farmerList, setFarmerList] = useState([]);
  const [selectedFarmerDetails, setSelectedFarmerDetails] = useState(null);
  const [notes, setNotes] = useState('');
  const [numberOfBags, setNumberOfBags] = useState(1);
  const [bagCountInput, setBagCountInput] = useState('1');
  const [bagWeights, setBagWeights] = useState(['']);
  const [totalWeight, setTotalWeight] = useState(0);
  const [brix, setBrix] = useState('');
  const [type, setType] = useState('');
  const [producer, setProducer] = useState('');
  const [processingType, setProcessingType] = useState('');
  const [grade, setGrade] = useState('');
  const [assigningRFID, setAssigningRFID] = useState(false);
  const [price, setPrice] = useState('');
  const [moisture, setMoisture] = useState('');

  // UI state
  const [tabValue, setTabValue] = useState(0); // 0: Cherry, 1: Green Bean
  const [cherryData, setCherryData] = useState([]);
  const [greenBeanData, setGreenBeanData] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [snackbarMessage, setSnackbarMessage] = useState('');

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
      const response = await fetch(`${API_BASE_URL}/api/farmer`);
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

  const fetchReceivingData = useCallback(async () => {
    if (!session || !session.user) return;

    try {
      // Fetch cherry data
      const cherryResponse = await fetch(`${API_BASE_URL}/api/receiving?commodityType=Cherry`);
      if (!cherryResponse.ok) throw new Error(`Failed to fetch cherry data: ${cherryResponse.status}`);
      const cherryData = await cherryResponse.json();
      let filteredCherryData = [];
      if (["admin", "manager"].includes(session.user.role)) {
        filteredCherryData = cherryData.allRows.map((row, index) => ({ ...row, id: index }));
      } else if (["staff", "receiving"].includes(session.user.role)) {
        filteredCherryData = cherryData.todayData.map((row, index) => ({ ...row, id: index }));
      }
      setCherryData(filteredCherryData);

      // Fetch green bean data
      const greenBeanResponse = await fetch(`${API_BASE_URL}/api/receiving?commodityType=Green%20Bean`);
      if (!greenBeanResponse.ok) throw new Error(`Failed to fetch green bean data: ${greenBeanResponse.status}`);
      const greenBeanData = await greenBeanResponse.json();
      let filteredGreenBeanData = [];
      if (["admin", "manager"].includes(session.user.role)) {
        filteredGreenBeanData = greenBeanData.allRows.map((row, index) => ({ ...row, id: index }));
      } else if (["staff", "receiving"].includes(session.user.role)) {
        filteredGreenBeanData = greenBeanData.todayData.map((row, index) => ({ ...row, id: index }));
      }
      setGreenBeanData(filteredGreenBeanData);
    } catch (error) {
      console.error("Error fetching receiving data:", error);
      setCherryData([]);
      setGreenBeanData([]);
    }
  }, [session]);

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
      setBagWeights([...bagWeights, ...Array(newValue - bagWeights.length).fill('')]);
    } else {
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
      const response = await fetch(`${API_BASE_URL}/api/get-rfid/Receiving`);
      if (!response.ok) throw new Error(`Failed to fetch RFID data: ${response.status}`);
      const data = await response.json();
      if (data && typeof data.rfid === 'string' && data.rfid.trim().length > 0) {
        return data.rfid;
      }
      return '';
    } catch (error) {
      console.error("Error getting RFID data:", error);
      return '';
    }
  };

  const clearRfidData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/clear-rfid/Receiving`, { method: 'DELETE' });
      if (!response.ok) throw new Error(`Failed to clear RFID Data: ${response.status}`);
    } catch (error) {
      console.error("Error clearing RFID Data:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!session || !session.user) {
      setSnackbarMessage('No user session found.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    // Validation
    if (!selectedFarmerDetails) {
      setSnackbarMessage('Please select a farmer.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    if (!type) {
      setSnackbarMessage('Please select a type.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    if (!producer) {
      setSnackbarMessage('Please select a producer.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    if (bagWeights.some(weight => !weight || parseFloat(weight) <= 0)) {
      setSnackbarMessage('Please enter valid weights for all bags.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    if (tabValue === 1) { // Green Bean validation
      if (!processingType) {
        setSnackbarMessage('Please select a processing type.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }
      if (!grade) {
        setSnackbarMessage('Please select a grade.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }
    }

    const scannedRFID = await getRfidData();
    if (!scannedRFID) {
      setSnackbarMessage('Please scan an RFID tag before submitting.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      const rfidCheckResponse = await fetch(`${API_BASE_URL}/api/check-rfid/${scannedRFID}`);
      if (!rfidCheckResponse.ok) throw new Error(`RFID check failed: ${rfidCheckResponse.status}`);
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

    const commodityType = tabValue === 0 ? 'Cherry' : 'Green Bean';
    const payload = {
      farmerID: selectedFarmerDetails.farmerID,
      farmerName: selectedFarmerDetails.farmerName,
      notes,
      weight: totalWeight,
      totalBags: bagWeights.length,
      type,
      producer,
      brix: commodityType === 'Cherry' ? (brix ? parseFloat(brix) : null) : null,
      processingType: commodityType === 'Green Bean' ? processingType : null,
      grade: commodityType === 'Green Bean' ? grade : null,
      commodityType,
      bagPayload: bagWeights.map((weight, index) => ({
        bagNumber: index + 1,
        weight: parseFloat(weight) || 0,
      })),
      createdBy: session.user.name,
      updatedBy: session.user.name,
      rfid: scannedRFID,
      // new fields:
      price: commodityType === 'Green Bean' ? (price !== '' ? Number(price) : null) : null,
      moisture: commodityType === 'Green Bean' ? (moisture !== '' ? Number(moisture) : null) : null,
    };

    try {
      setAssigningRFID(true);
      const endpoint = commodityType === 'Cherry' ? `${API_BASE_URL}/api/receiving` : `${API_BASE_URL}/api/receiving-green-beans`;
      const response = await fetch(endpoint, {
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

        // Reset form
        setFarmerName('');
        setSelectedFarmerDetails(null);
        setBagWeights(['']);
        setNotes('');
        setNumberOfBags(1);
        setBagCountInput('1');
        setTotalWeight(0);
        setType('');
        setProducer('');
        setBrix('');
        setProcessingType('');
        setGrade('');
        fetchReceivingData();
      } else {
        const errorData = await response.json();
        setSnackbarMessage(errorData.error || 'Error creating batch.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Failed to communicate with the backend:', error);
      setSnackbarMessage('Failed to communicate with the backend.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setAssigningRFID(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    // Reset form when switching tabs
    setFarmerName('');
    setSelectedFarmerDetails(null);
    setBagWeights(['']);
    setNotes('');
    setNumberOfBags(1);
    setBagCountInput('1');
    setTotalWeight(0);
    setType('');
    setProducer('');
    setBrix('');
    setProcessingType('');
    setGrade('');
  };

  const cherryColumns = [
    { field: 'batchNumber', headerName: 'Batch Number', width: 160, sortable: true },
    { 
      field: 'receivingDate', 
      headerName: 'Received Date', 
      width: 180, 
      sortable: true,
      valueFormatter: (value) => value ? dayjs(value).format('DD-MM-YYYY HH:mm:ss') : 'N/A'
    },
    { field: 'farmerName', headerName: 'Farmer Name', width: 180, sortable: true },
    { field: 'broker', headerName: 'Broker Name', width: 180, sortable: true },
    {
      field: 'price',
      headerName: 'Cherry Price (/kg)',
      width: 180,
      sortable: true,
      renderCell: ({ value }) => value == null || isNaN(value) ? 'N/A' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value),
    },
    {
      field: 'total_price',
      headerName: 'Total Cherry Price',
      width: 180,
      sortable: true,
      renderCell: ({ value }) => value == null || isNaN(value) ? 'N/A' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value),
    },
    { field: 'type', headerName: 'Type', width: 110, sortable: true },
    { field: 'farmVarieties', headerName: 'Varieties', width: 150, sortable: true },
    { field: 'weight', headerName: 'Total Weight (kg)', width: 150, sortable: true },
    { field: 'brix', headerName: 'Brix (°Bx)', width: 120, sortable: true },
    { field: 'producer', headerName: 'Producer', width: 150, sortable: true },
    { field: 'notes', headerName: 'Notes', width: 250, sortable: true },
    { field: 'createdBy', headerName: 'Created By', width: 180, sortable: true },
  ];

  const greenBeanColumns = [
    { field: 'batchNumber', headerName: 'Batch Number', width: 160, sortable: true },
    { 
      field: 'receivingDate', 
      headerName: 'Received Date', 
      width: 180, 
      sortable: true,
      valueFormatter: (value) => value ? dayjs(value).format('DD-MM-YYYY HH:mm:ss') : 'N/A'
    },
    { field: 'farmerName', headerName: 'Farmer Name', width: 180, sortable: true },
    { field: 'broker', headerName: 'Broker Name', width: 180, sortable: true },
    {
      field: 'price',
      headerName: 'Green Bean Price (/kg)',
      width: 180,
      sortable: true,
      renderCell: ({ value }) => value == null || isNaN(value) ? 'N/A' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value),
    },
    {
      field: 'total_price',
      headerName: 'Total Green Bean Price',
      width: 180,
      sortable: true,
      renderCell: ({ value }) => value == null || isNaN(value) ? 'N/A' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value),
    },
    { field: 'type', headerName: 'Type', width: 110, sortable: true },
    { field: 'farmVarieties', headerName: 'Varieties', width: 150, sortable: true },
    { field: 'weight', headerName: 'Total Weight (kg)', width: 150, sortable: true },
    { field: 'processingType', headerName: 'Processing Type', width: 150, sortable: true },
    { field: 'grade', headerName: 'Grade', width: 120, sortable: true },
    { field: 'producer', headerName: 'Producer', width: 150, sortable: true },
    { field: 'notes', headerName: 'Notes', width: 250, sortable: true },
    { field: 'createdBy', headerName: 'Created By', width: 180, sortable: true },
  ];

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  if (!session?.user || !['admin', 'manager', 'staff', 'receiving'].includes(session.user.role)) {
    return (
      <Typography variant="h6">
        Access Denied. You do not have permission to view this page.
      </Typography>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Tabs value={tabValue} onChange={handleTabChange} aria-label="receiving tabs">
        <Tab label="Cherry Receiving" />
        <Tab label="Green Bean Receiving" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                  Cherry Receiving Form
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
                      <FormControl fullWidth required>
                        <InputLabel id="producer-label">Producer</InputLabel>
                        <Select
                          labelId="producer-label"
                          value={producer}
                          onChange={(e) => setProducer(e.target.value)}
                          input={<OutlinedInput label="Producer" />}
                          MenuProps={MenuProps}
                        >
                          <MenuItem value="BTM">BTM</MenuItem>
                          <MenuItem value="HEQA">HEQA</MenuItem>
                        </Select>
                      </FormControl>
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
          <Grid item xs={12} md={8}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Cherry Receiving Data
                </Typography>
                <div style={{ height: 800, width: "100%" }}>
                  <DataGrid
                    rows={cherryData}
                    columns={cherryColumns}
                    pageSizeOptions={[5, 10, 20]}
                    disableSelectionOnClick
                    sortingOrder={["desc", "asc"]}
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
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                  Green Bean Receiving Form
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
                          <TextField {...params} label="Farmer Name" required fullWidth /> // Corrected line
                        )}
                      />
                    </Grid>
                    {selectedFarmerDetails && (
                      <>
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
                      <FormControl fullWidth required>
                        <InputLabel id="producer-label">Producer</InputLabel>
                        <Select
                          labelId="producer-label"
                          value={producer}
                          onChange={(e) => setProducer(e.target.value)}
                          input={<OutlinedInput label="Producer" />}
                          MenuProps={MenuProps}
                        >
                          <MenuItem value="BTM">BTM</MenuItem>
                          <MenuItem value="HEQA">HEQA</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel id="processing-type-label">Processing Type</InputLabel>
                        <Select
                          labelId="processing-type-label"
                          value={processingType}
                          onChange={(e) => setProcessingType(e.target.value)}
                          input={<OutlinedInput label="Processing Type" />}
                          MenuProps={MenuProps}
                        >
                          <MenuItem value="Washed">Washed</MenuItem>
                          <MenuItem value="Natural">Natural</MenuItem>
                          <MenuItem value="Honey">Honey</MenuItem>
                          <MenuItem value="Anaerobic">Anaerobic</MenuItem>
                          <MenuItem value="CM Natural">CM Natural</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel id="grade-label">Grade</InputLabel>
                        <Select
                          labelId="grade-label"
                          value={grade}
                          onChange={(e) => setGrade(e.target.value)}
                          input={<OutlinedInput label="Grade" />}
                          MenuProps={MenuProps}
                        >
                          <MenuItem value="Specialty Grade">Specialty Grade</MenuItem>
                          <MenuItem value="Grade 1">Grade 1</MenuItem>
                          <MenuItem value="Grade 2">Grade 2</MenuItem>
                          <MenuItem value="Grade 3">Grade 3</MenuItem>
                          <MenuItem value="Grade 4">Grade 4</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Price (IDR/kg)"
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        fullWidth
                        inputProps={{ step: '0.1', min: '0' }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        label="Moisture (%)"
                        type="number"
                        value={moisture}
                        onChange={(e) => setMoisture(e.target.value)}
                        fullWidth
                        inputProps={{ step: '0.1', min: '0', max: '100' }}
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
                          inputProps={{ step: '0.1', min: '0' }}
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
          <Grid item xs={12} md={8}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Green Bean Data
                </Typography>
                <div style={{ height: 800, width: "100%" }}>
                  <DataGrid 
                    rows={greenBeanData}
                    columns={greenBeanColumns}
                    pageSizeOptions={[5, 10, 20]}
                    disableSelectionOnClick
                    sortingOrder={["desc", "asc"]}
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
      </TabPanel>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ReceivingStation;