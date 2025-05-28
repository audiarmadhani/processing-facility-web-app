"use client";

import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function FarmerInputStation() {
  const { data: session, status } = useSession();

  // State Declarations
  const [farmerData, setFarmerData] = useState([]);
  const [farmerName, setFarmerName] = useState('');
  const [farmerAddress, setFarmerAddress] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankName, setBankName] = useState('');
  const [farmerLandArea, setFarmerLandArea] = useState('');
  const [farmerContact, setFarmerContact] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [farmType, setFarmType] = useState('');
  const [notes, setNotes] = useState('');
  const [farmVarieties, setFarmVarieties] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [desa, setDesa] = useState('');
  const [kecamatan, setKecamatan] = useState('');
  const [kabupaten, setKabupaten] = useState('');
  const [locationData, setLocationData] = useState([]);
  const [contractType, setContractType] = useState('');
  const [broker, setBroker] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

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

  const bankOptions = [
    'Bank Mandiri', 'BRI', 'BCA', 'BNI', 'BTN', 'BSI',
    'CIMB Niaga', 'OCBC NISP', 'Permata Bank', 'Danamon', 'BPD Bali'
  ];

  const brokerOptions = ['Nyoman', 'Agus TS'];

  const paymentMethodOptions = [
    'Bank Transfer to Farmer', 'Bank Transfer to Broker',
    'Cash to Farmer', 'Cash to Broker'
  ];

  const contractTypeOptions = ['Contract', 'Beli Putus'];

  const varietyOptions = {
    Arabica: ['Cobra', 'Yellow Caturra', 'Kopyol'],
    Robusta: ['BP42']
  };

  useEffect(() => {
    if (session?.user?.role) {
      fetchFarmerData();
      fetchLocationData();
    }
  }, [session?.user?.role]);

  useEffect(() => {
    // Reset farmVarieties when farmType changes
    setFarmVarieties([]);
  }, [farmType]);

  const fetchFarmerData = async () => {
    try {
      const response = await fetch(
        "https://processing-facility-backend.onrender.com/api/farmer"
      );
      if (!response.ok) throw new Error("Failed to fetch farmer data");

      const data = await response.json();
      console.log("Fetched data:", data);

      if (data) {
        // Filter rows based on user role
        if (session.user.role === "staff") {
          setFarmerData(
            data.latestRows.map((row, index) => ({ ...row, id: index }))
          );
        } else if (["admin", "manager"].includes(session.user.role)) {
          setFarmerData(
            data.allRows.map((row, index) => ({ ...row, id: index }))
          );
        }
      }
    } catch (error) {
      console.error("Error fetching farmer data:", error);
      setFarmerData([]);
      setSnackbarMessage('Failed to fetch farmer data.');
      setSnackbarSeverity('error');
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
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate bank details for bank transfer methods
    if (['Bank Transfer to Farmer', 'Bank Transfer to Broker'].includes(paymentMethod) &&
        (!bankAccount.trim() || !bankName.trim())) {
      setSnackbarMessage('Bank account and bank name are required for bank transfer methods.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    const farmVarietiesCSV = farmVarieties.join(", ");

    const payload = {
      farmerName: farmerName.trim(),
      desa,
      kecamatan,
      kabupaten,
      farmerAddress,
      bankAccount: bankAccount.trim() || null,
      bankName: bankName.trim() || null,
      farmerLandArea,
      farmerContact,
      latitude: latitude.trim() === "" ? null : parseFloat(latitude),
      longitude: longitude.trim() === "" ? null : parseFloat(longitude),
      farmType,
      notes,
      farmVarieties: farmVarietiesCSV.trim() || null,
      contractType,
      broker: broker || null,
      paymentMethod
    };

    try {
      const response = await fetch("https://processing-facility-backend.onrender.com/api/farmer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Clear form inputs after a successful submission
        setFarmerName('');
        setDesa('');
        setKecamatan('');
        setKabupaten('');
        setFarmerAddress('');
        setBankAccount('');
        setBankName('');
        setFarmerLandArea('');
        setFarmerContact('');
        setLatitude('');
        setLongitude('');
        setFarmType('');
        setNotes('');
        setFarmVarieties([]);
        setContractType('');
        setBroker('');
        setPaymentMethod('');

        await fetchFarmerData();

        setSnackbarMessage('Farmer successfully added!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        const errorData = await response.json();
        console.error(errorData.message || "Error creating farmer.");
        setSnackbarMessage(errorData.message || 'Failed to add farmer.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Failed to communicate with the backend:", error);
      setSnackbarMessage('Failed to communicate with the backend.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

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

  const kabupatenList = [...new Set(locationData.map(item => item.kabupaten))];
  const kecamatanList = kabupaten ? [...new Set(locationData.filter(item => item.kabupaten === kabupaten).map(item => item.kecamatan))] : [];
  const desaList = kecamatan ? locationData.filter(item => item.kecamatan === kecamatan).map(item => item.desa) : [];

  const columns = [
    { field: "farmerID", headerName: "ID", sortable: true, width: 40 },
    { field: "farmerName", headerName: "Name", sortable: true, width: 150 },
    { field: "desa", headerName: "Desa", sortable: true, width: 120 },
    { field: "kecamatan", headerName: "Kecamatan", sortable: true, width: 120 },
    { field: "kabupaten", headerName: "Kabupaten", sortable: true, width: 120 },
    { field: "farmerAddress", headerName: "Address", sortable: true, width: 200 },
    { field: "contractType", headerName: "Contract Type", sortable: true, width: 120 },
    { field: "broker", headerName: "Broker", sortable: true, width: 100 },
    { field: "paymentMethod", headerName: "Payment Method", sortable: true, width: 150 },
    { field: "bankAccount", headerName: "Bank Account", sortable: true, width: 150 },
    { field: "bankName", headerName: "Bank Name", sortable: true, width: 120 },
    { field: "farmerLandArea", headerName: "Land Area", sortable: true, width: 120 },
    { field: "farmerContact", headerName: "Contact", sortable: true, width: 150 },
    { field: "farmType", headerName: "Type", sortable: true, width: 90 },
    { field: "farmVarieties", headerName: "Coffee Varieties", sortable: true, width: 180 },
    { field: "registrationDate", headerName: "Registration Date", sortable: true, width: 150 },
    { field: "notes", headerName: "Notes", sortable: true, width: 150 },
  ];

  // Show loading screen while session is loading
  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  // Restrict access to admin, manager, or receiving roles
  if (!session?.user || !['admin', 'manager', 'receiving'].includes(session.user.role)) {
    return (
      <Typography variant="h6">
        Access Denied. You do not have permission to view this page.
      </Typography>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Farmer Form */}
      <Grid item xs={12} md={5}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
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
                    input={<OutlinedInput label="Farmer Name" />}
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
                    input={<OutlinedInput label="Farmer Contact" />}
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
                    input={<OutlinedInput label="Farmer Address" />}
                  />
                </Grid>

                <Grid item xs={6}>
                  <Autocomplete
                    options={kabupatenList}
                    value={kabupaten}
                    onChange={handleKabupatenChange}
                    renderInput={(params) => <TextField {...params} label="Kabupaten" />}
                  />
                </Grid>

                <Grid item xs={6}>
                  <Autocomplete
                    options={kecamatanList}
                    value={kecamatan}
                    onChange={handleKecamatanChange}
                    disabled={!kabupaten}
                    renderInput={(params) => <TextField {...params} label="Kecamatan" />}
                  />
                </Grid>

                <Grid item xs={6}>
                  <Autocomplete
                    options={desaList}
                    value={desa}
                    onChange={handleDesaChange}
                    disabled={!kecamatan}
                    renderInput={(params) => <TextField {...params} label="Desa" />}
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    label="Farmer Land Area"
                    type="text"
                    value={farmerLandArea}
                    onChange={(e) => setFarmerLandArea(e.target.value)}
                    fullWidth
                    required
                    input={<OutlinedInput label="Farmer Land Area" />}
                  />
                </Grid>

                <Grid item xs={6}>
                  <FormControl fullWidth required>
                    <InputLabel id="contract-type-label">Contract Type</InputLabel>
                    <Select
                      labelId="contract-type-label"
                      value={contractType}
                      onChange={(e) => setContractType(e.target.value)}
                      input={<OutlinedInput label="Contract Type" />}
                    >
                      {contractTypeOptions.map(option => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6}>
                  <FormControl fullWidth required>
                    <InputLabel id="farm-type-label">Farm Type</InputLabel>
                    <Select
                      labelId="farm-type-label"
                      value={farmType}
                      onChange={(e) => setFarmType(e.target.value)}
                      input={<OutlinedInput label="Farm Type" />}
                    >
                      <MenuItem value="Arabica">Arabica</MenuItem>
                      <MenuItem value="Robusta">Robusta</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth disabled={!farmType}>
                    <InputLabel id="variety-label">Farm Varieties</InputLabel>
                    <Select
                      labelId="variety-label"
                      multiple
                      value={farmVarieties}
                      onChange={(e) => setFarmVarieties(e.target.value)}
                      input={<OutlinedInput label="Farm Varieties" />}
                      MenuProps={MenuProps}
                    >
                      {(varietyOptions[farmType] || []).map(variety => (
                        <MenuItem key={variety} value={variety}>{variety}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel id="broker-label">Broker</InputLabel>
                    <Select
                      labelId="broker-label"
                      value={broker}
                      onChange={(e) => setBroker(e.target.value)}
                      input={<OutlinedInput label="Broker" />}
                    >
                      <MenuItem value=""><em>None</em></MenuItem>
                      {brokerOptions.map(option => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6}>
                  <FormControl fullWidth required>
                    <InputLabel id="payment-method-label">Payment Method</InputLabel>
                    <Select
                      labelId="payment-method-label"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      input={<OutlinedInput label="Payment Method" />}
                    >
                      {paymentMethodOptions.map(option => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={4}>
                  <Autocomplete
                    freeSolo
                    options={bankOptions}
                    value={bankName}
                    onChange={(event, newValue) => setBankName(newValue || '')}
                    onInputChange={(event, newInputValue) => setBankName(newInputValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Bank Name"
                        multiline
                        fullWidth
                        required={paymentMethod.includes('Bank Transfer')}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={8}>
                  <TextField
                    label="Bank Account Number"
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    fullWidth
                    required={paymentMethod.includes('Bank Transfer')}
                    input={<OutlinedInput label="Bank Account Number" />}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Notes"
                    multiline
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    input={<OutlinedInput label="Notes" />}
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

      {/* Data Grid for Farmer Data */}
      {["admin", "manager", "receiving"].includes(session?.user?.role) && (
        <Grid item xs={12} md={7}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Farmer Data
              </Typography>
              <div style={{ height: 800, width: "100%" }}>
                <DataGrid
                  rows={farmerData}
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

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Grid>
  );
}

export default FarmerInputStation;