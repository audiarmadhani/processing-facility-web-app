"use client"; 

import React, { useState, useEffect, useRef } from 'react'; // Add useRef
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
  const [receivingData, setReceivingData] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState('success'); // Add severity
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [type, setType] = useState('');
  const [assigningRFID, setAssigningRFID] = useState(false); // Flag: are we assigning RFID?
  const [lastCreatedBatchNumber, setLastCreatedBatchNumber] = useState(null); // Store newly created batch


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
  }, [bagWeights, session]); // Add session to the dependency array

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
    // No need to check session here, do it before calling the function
    if (!session || !session.user) return; // Early return if no session

    try {
      const response = await fetch('https://processing-facility-backend.onrender.com/api/receiving');
      if (!response.ok) throw new Error("Failed to fetch receiving data");

      const data = await response.json();
      console.log("Fetched data:", data);

      if (data && Array.isArray(data.allRows) && Array.isArray(data.todayData)) {
        let filteredData = [];
        if (["admin", "manager"].includes(session.user.role)) {
            // Use map directly on the array
            filteredData = data.allRows.map((row, index) => ({ ...row, id: index }));
        } else if (["staff", "receiving"].includes(session.user.role)) {
             // Use map directly on the array
            filteredData = data.todayData.map((row, index) => ({ ...row, id: index }));
        }
        setReceivingData(filteredData); // Set the filtered data
        console.log("user role:", session.user.role);
        console.log("user name:", session.user.name);
        console.log("Filtered Data:", filteredData);
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

  const handleFarmerChange = (event, newValue) => {
    setSelectedFarmerDetails(newValue); // Store the entire farmer object
    setFarmerName(newValue ? newValue.farmerName : ""); // Update farmerName state
  };

  //NEW FUNCTION
  const getRfidData = async () => {
    try {
      const response = await fetch('https://processing-facility-backend.onrender.com/api/get-rfid');
      if (!response.ok) {
        throw new Error(`Failed to fetch RFID data: ${response.status}`);
      }
      const data = await response.json();
      console.log("getRfidData response:", data); // Add this for debugging
      // Access the RFID UID correctly.  Handle the case where it's 0.
      if (data.getRfid && data.getRfid.rfid) { // Check for the existence of getRfid and rfid
          return data.getRfid.rfid;  // Access the nested rfid property
      } else {
          return ''; // Return empty string if no RFID
      }
    } catch (error) {
      console.error("Error getting RFID data:", error);
      return ''; // Return empty string on error.  Important!
    }
  }

  //NEW FUNCTION
  const clearRfidData = async() => {
    try{
      const response = await fetch('https://processing-facility-backend.onrender.com/api/clear-rfid', {method: 'DELETE'});
      if(!response.ok){
        throw new Error(`Failed to clear RFID Data: ${response.status}`)
      }

    }
    catch(error){
      console.error("Error clearing RFID Data:", error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!session || !session.user) {
        console.error("No user session found.");
        return;
    }

    const payload = {
        farmerID: selectedFarmerDetails ? selectedFarmerDetails.farmerID : null,
        farmerName,
        notes,
        weight: totalWeight,
        totalBags: bagWeights.length,
        type,
        bagPayload: bagWeights.map((weight, index) => ({
            bagNumber: index + 1,
            weight: parseFloat(weight) || 0,
        })),
        createdBy: session.user.name,
        updatedBy: session.user.name,
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
            const responseData = await response.json();
            const batchNumber = responseData.receivingData.batchNumber;

            // --- RFID Assignment ---
            const scannedRFID = await getRfidData();  // Get RFID *before* assignment

            if (scannedRFID) {
                try {
                    const rfidResponse = await fetch('https://processing-facility-backend.onrender.com/api/assign-rfid', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            batchNumber, // Use newly created batchNumber
                            rfid: scannedRFID, // Use the UID from getRfidData
                        }),
                    });

                    if (rfidResponse.ok) {
                        setSnackbarMessage(`Batch ${batchNumber} created and RFID tag assigned!`);
                        setSnackbarSeverity('success');
                        setOpenSnackbar(true); // Show success message
                        await clearRfidData(); //clear rfid data
                    } else {
                        const errorData = await rfidResponse.json();
                        setSnackbarMessage(errorData.error || `Failed to assign RFID tag to batch ${batchNumber}.`);
                        setSnackbarSeverity('error');
                        setOpenSnackbar(true); // Show error message
                    }
                } catch (rfidError) {
                    console.error('Error assigning RFID:', rfidError);
                    setSnackbarMessage(`Error assigning RFID tag to batch ${batchNumber}.`);
                    setSnackbarSeverity('error');
                    setOpenSnackbar(true); // Show error message
                }
            }
             else {
              setSnackbarMessage(`Batch ${batchNumber} created successfully! No RFID assigned`);
              setSnackbarSeverity('success');
              setOpenSnackbar(true); // Show success message
            }

            // Reset form fields *after* successful RFID assignment (or skipping it)
            setFarmerName('');
            setBagWeights(['']);
            setNotes('');
            setNumberOfBags(1);
            setTotalWeight(0);
            setType('');
            fetchReceivingData(); // Refresh the data *NOW*



        } else {
            const errorData = await response.json();
            console.error(errorData.message || 'Error creating batch.');
            setSnackbarMessage(errorData.message || 'Error creating batch.');
            setSnackbarSeverity('error');
            setOpenSnackbar(true);  // Open snackbar on error
        }
    } catch (error) {
        console.error('Failed to communicate with the backend:', error);
        setSnackbarMessage('Failed to communicate with the backend.');
        setSnackbarSeverity('error');
        setOpenSnackbar(true); // Open snackbar on error
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const columns = [
    { field: 'batchNumber', headerName: 'Batch Number', width: 160, sortable: true },
    { field: 'receivingDateTrunc', headerName: 'Received Date', width: 160, sortable: true },
    { field: 'farmerName', headerName: 'Farmer Name', width: 180, sortable: true },
    { field: 'farmerID', headerName: 'Farmer ID', width: 100, sortable: true },
    { field: 'type', headerName: 'Type', width: 110, sortable: true },
    { field: 'weight', headerName: 'Total Weight (kg)', width: 150, sortable: true },
    { field: 'notes', headerName: 'Notes', width: 250, sortable: true },
    { field: 'createdBy', headerName: 'Created By', width: 180, sortable: true }, // Add createdBy column
  ];

  // Show loading screen while session is loading
  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  // Redirect to the sign-in page if the user is not logged in or doesn't have the admin role
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'manager' && session.user.role !== 'staff')) {
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
                    color="primary"
                    type="submit"
                    disabled={assigningRFID}
                      sx={{ mr: 2 }}
                  >
                    Submit
                  </Button>

                  <Button //Removed onClick
                      variant="contained"
                      color="secondary"
                      disabled={!lastCreatedBatchNumber} // Only enabled after a submit
                                       
                  >
                    Assign Card
                  </Button>

                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Grid>

      {/* Data Grid for Receiving Data */}
      {["admin", "manager", "receiving","staff"].includes(session?.user?.role) && (
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
                  rowHeight={35}
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