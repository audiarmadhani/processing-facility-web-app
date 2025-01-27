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
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function FarmerInputStation() {
  const { data: session, status } = useSession();

  // State Declarations
  const [farmerData, setFarmerData] = useState([]);
  const [farmerName, setFarmerName] = useState('');
  const [farmerAddress, setFarmerAddress] = useState('');
  const [farmerLandArea, setFarmerLandArea] = useState('');
  const [farmerContact, setFarmerContact] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [farmType, setFarmType] = useState('');
  const [notes, setNotes] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    if (session?.user?.role) {
      fetchFarmerData();
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      farmerName,
      farmerAddress,
      farmerLandArea,
      farmerContact,
      latitude: latitude.trim() === "" ? null : parseFloat(latitude),
      longitude: longitude.trim() === "" ? null : parseFloat(longitude),
      farmType,
      notes,
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
        console.error(errorData.message || "Error creating batch.");
      }
    } catch (error) {
      console.error("Failed to communicate with the backend:", error);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const columns = [
    { field: "farmerID", headerName: "ID", width: 140, sortable: true },
    { field: "farmerName", headerName: "Name", width: 180, sortable: true },
    { field: "farmerAddress", headerName: "Address", width: 180, sortable: true },
    { field: "farmerLandArea", headerName: "Land Area", width: 180, sortable: true },
    { field: "farmerContact", headerName: "Contact", width: 180, sortable: true },
    { field: "latitude", headerName: "Latitude", width: 180, sortable: true },
    { field: "longitude", headerName: "Longitude", width: 180, sortable: true },
    { field: "farmType", headerName: "Type", width: 180, sortable: true },
    { field: "registrationDate", headerName: "Registration Date", width: 180, sortable: true },
    { field: "isActive", headerName: "Active", width: 180, sortable: true },
    { field: "notes", headerName: "Notes", width: 180, sortable: true },
  ];

  return (
    <Grid container spacing={3}>
      {/* Farmer Form */}
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
      {["admin", "manager", "staff"].includes(session?.user?.role) && (
        <Grid item xs={12} md={9}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Farmer Data
              </Typography>
              <div style={{ height: 500, width: "100%" }}>
                <DataGrid
                  rows={farmerData}
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