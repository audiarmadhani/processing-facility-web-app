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
  const [desa, setDesa] = useState('');
  const [kecamatan, setKecamatan] = useState('');
  const [kabupaten, setKabupaten] = useState('');
  const [locationData, setLocationData] = useState([]);
  const [isContract, setIsContract] = useState('');

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
    'Bank Mandiri',
    'Bank Rakyat Indonesia (BRI)',
    'Bank Central Asia (BCA)',
    'Bank Negara Indonesia (BNI)',
    'Bank Tabungan Negara (BTN)',
    'Bank Syariah Indonesia (BSI)',
    'Bank CIMB Niaga',
    'Bank OCBC NISP',
    'Permata Bank',
    'Bank Danamon',
    'Bank BPD Bali',
    // Add more banks as needed
  ];

  useEffect(() => {
    if (session?.user?.role) {
      fetchFarmerData();
      fetchLocationData();
    }
  }, [session?.user?.role]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const farmVarietiesCSV = farmVarieties.join(", ");

    const payload = {
      farmerName : farmerName.trim(),
      desa,
      kecamatan,
      kabupaten,
      farmerAddress,
      bankAccount,
      bankName,
      farmerLandArea,
      farmerContact,
      latitude: latitude.trim() === "" ? null : parseFloat(latitude),
      longitude: longitude.trim() === "" ? null : parseFloat(longitude),
      farmType,
      notes,
      farmVarieties : farmVarietiesCSV.trim(),
      isContract,
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
        setIsContract('');

        await fetchFarmerData();

        setSnackbarOpen(true);
        
      } else {
        const errorData = await response.json();
        console.error(errorData.message || "Error creating batch.");
      }
    } catch (error) {
      console.error("Failed to communicate with the backend:", error);
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
    { field: "farmerID", headerName: "ID", sortable: true },
    { field: "farmerName", headerName: "Name", sortable: true },
    { field: "desa", headerName: "Desa", sortable: true },
    { field: "kecamatan", headerName: "Kecamatan", sortable: true },
    { field: "kabupaten", headerName: "Kabupaten", sortable: true },
    { field: "farmerAddress", headerName: "Address", sortable: true },
    { field: "isContract", headerName: "Contract", sortable: true },
    { field: "bankAccount", headerName: "Bank Account", sortable: true },
    { field: "bankName", headerName: "Bank Name", sortable: true },
    { field: "farmerLandArea", headerName: "Land Area", sortable: true },
    { field: "farmerContact", headerName: "Contact", sortable: true },
    // { field: "latitude", headerName: "Latitude", sortable: true },
    // { field: "longitude", headerName: "Longitude", sortable: true },
    { field: "farmType", headerName: "Type", sortable: true },
    { field: "farmVarieties", headerName: "Coffee Varieties", sortable: true },
    { field: "registrationDate", headerName: "Registration Date", sortable: true },
    // { field: "isActive", headerName: "Active", sortable: true },
    { field: "notes", headerName: "Notes", sortable: true },
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
      {/* Farmer Form */}
      <Grid item xs={12} md={3}>
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
                    label="Farmer Address"
                    type="text"
                    value={farmerAddress}
                    onChange={(e) => setFarmerAddress(e.target.value)}
                    fullWidth
                    required
                    input={<OutlinedInput label="Farmer Address" />}
                  />
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
                    label="Farmer Land Area"
                    type="text"
                    value={farmerLandArea}
                    onChange={(e) => setFarmerLandArea(e.target.value)}
                    fullWidth
                    required
                    input={<OutlinedInput label="Farmer Land Area" />}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="contract-label">Land Contract</InputLabel>
                    <Select
                      labelId="contract-label"
                      id="contract"
                      multiple
                      value={isContract}
                      onChange={(e) => setIsContract(e.target.value)}
                      input={<OutlinedInput label="Land Contract" />}
                      MenuProps={MenuProps}
                    >
                      <MenuItem value="Yes">Yes</MenuItem>
                      <MenuItem value="No">No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel id="type-label">Farm Type</InputLabel>
                    <Select
                      labelId="type-label"
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
                  <FormControl fullWidth>
                    <InputLabel id="variety-label">Farm Varieties</InputLabel>
                    <Select
                      labelId="variety-label"
                      id="variety"
                      multiple
                      value={farmVarieties}
                      onChange={(e) => setFarmVarieties(e.target.value)}
                      input={<OutlinedInput label="Coffee Varieties" />}
                      MenuProps={MenuProps}
                    >
                      <MenuItem value="Bourbon">Bourbon</MenuItem>
                      <MenuItem value="Java">Java</MenuItem>
                      <MenuItem value="S795">S795</MenuItem>
                      <MenuItem value="Typica">Typica</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Bank Account"
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    fullWidth
                    required
                    input={<OutlinedInput label="Bank Account" />}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Autocomplete
                    freeSolo
                    options={bankOptions}
                    value={bankName}
                    onChange={(event, newValue) => setBankName(newValue)}
                    onInputChange={(event, newInputValue) => setBankName(newInputValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Bank Name"
                        fullWidth
                        required
                      />
                    )}
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
        <Grid item xs={12} md={9}>
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
          severity="success"
          sx={{ width: "100%" }}
        >
          Farmer successfully added!
        </Alert>
      </Snackbar>
    </Grid>
  );
}

export default FarmerInputStation;