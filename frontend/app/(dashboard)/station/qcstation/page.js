"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from "next-auth/react";
import {
  Typography,
  Grid,
  Button,
  TextField,
  Snackbar,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  OutlinedInput,
} from '@mui/material';
import Alert from '@mui/material/Alert';
import Webcam from 'react-webcam';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;


const QCStation = () => {
  const { data: session, status } = useSession();
  const [rfidTag, setRfidTag] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [farmerName, setFarmerName] = useState('');
  const [receivingDate, setReceivingDate] = useState('');
  const [weight, setWeight] = useState('');
  const [totalBags, setTotalBags] = useState('');
  const [ripeness, setRipeness] = useState([]);
  const [color, setColor] = useState([]);
  const [foreignMatter, setForeignMatter] = useState('');
  const [overallQuality, setOverallQuality] = useState('');
  const [qcNotes, setQcNotes] = useState('');
  const [qcData, setQcData] = useState([]);
  const [receivingData, setReceivingData] = useState([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [rfidVisible, setRfidVisible] = useState(false);

  const [open, setOpen] = useState(false);
  const webcamRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(null);

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


  const handleCapture = () => {
    const video = webcamRef.current.video; // Get the video element
    const canvas = document.createElement('canvas'); // Create a canvas element
    const context = canvas.getContext('2d'); // Get the 2D drawing context
  
    // Set canvas dimensions to match the video
    canvas.width = 3840;
    canvas.height = 2160;
  
    // Draw the video frame on the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get today's date and format it
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  
    // Set overlay text properties
    context.fillStyle = 'rgba(255, 255, 255, 0.7)'; // Background for the text
    context.fillRect(10, canvas.height - 100, 400, 240); // Draw background rectangle
    context.fillStyle = '#fff'; // Text color
    context.font = '20px Arial'; // Font size and family
    context.fillText(`Batch Number: ${batchNumber}`, 20, canvas.height - 210); // Batch number
    context.fillText(`Farmer Name: ${farmerName}`, 20, canvas.height - 180); // farmerName
    context.fillText(`Ripeness: ${ripeness}`, 20, canvas.height - 150); // Ripeness
    context.fillText(`Color: ${color}`, 20, canvas.height - 120); // Ripeness
    context.fillText(`Foreign Matter: ${foreignMatter}`, 20, canvas.height - 90); // Ripeness
    context.fillText(`Overall Quality: ${overallQuality}`, 20, canvas.height - 60); // overallQuality
    context.fillText(`Date: ${formattedDate}`, 20, canvas.height - 30); // Today's date
  
    // Capture the image from the canvas
    const imageSrc = canvas.toDataURL('image/jpeg', 1); // Get the image data as a JPEG
    setImageSrc(imageSrc); // Set the image source for preview/display
  
    // Convert the Base64 image to a Blob for uploading
    const byteString = atob(imageSrc.split(',')[1]); // Decode the Base64 string to binary
    const mimeString = imageSrc.split(',')[0].split(':')[1].split(';')[0]; // Extract MIME type
    const ab = new ArrayBuffer(byteString.length); // Create an ArrayBuffer to hold the binary data
    const ia = new Uint8Array(ab); // Create a typed array for the ArrayBuffer
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i); // Fill the typed array with the binary data
    }
    const file = new Blob([ab], { type: mimeString }); // Create a Blob from the typed array
  
    // Clean the batch number by removing whitespace
    const cleanBatchNumber = batchNumber.trim().replace(/\s+/g, '');
  
    // Create a File object with a cleaned batch number
    const jpegFile = new File([file], `image_${cleanBatchNumber}.jpeg`, { type: 'image/jpeg' });
  
    uploadImage(jpegFile, cleanBatchNumber); // Upload the JPEG file
    setOpen(false); // Close the dialog after capturing
  };

const uploadImage = async (file, batchNumber) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('batchNumber', batchNumber);

    const response = await fetch('https://processing-facility-backend.onrender.com/api/upload-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    console.log('Image uploaded successfully:', data);
  } catch (error) {
    console.error('Error uploading image:', error);
  }
};

  // Effect to fetch QC data on component mount
  useEffect(() => {
    (async () => {
      try {
        const response = await fetch('https://processing-facility-backend.onrender.com/api/qc');
        if (!response.ok) throw new Error('Failed to fetch QC data');
        const data = await response.json();
        setQcData(data.allRows || []);
      } catch (error) {
        console.error('Error fetching QC data:', error);
      }
    })();
  }, []);

  // Effect to fetch Receiving data on component mount
  useEffect(() => {
    const fetchReceivingData = async () => {
      try {
        const response = await fetch('https://processing-facility-backend.onrender.com/api/receiving');
        if (!response.ok) throw new Error('Failed to fetch receiving data');
  
        const data = await response.json();
        if (data && Array.isArray(data.allRows)) {
          // Get batch numbers from QC data
          const qcBatchNumbers = new Set(qcData.map(qc => qc.batchNumber));
          
          // Filter and map receiving data
          const filteredReceivingData = data.allRows
            .filter(receiving => !qcBatchNumbers.has(receiving.batchNumber))
            .map(receiving => ({
              ...receiving,
              slaDays: calculateSLA(receiving.receivingDate, receiving.lastProcessingDate),
            }));
  
          setReceivingData(filteredReceivingData);
        } else {
          console.error('Unexpected data format:', data);
          setReceivingData([]);
        }
      } catch (error) {
        console.error('Error fetching receiving data:', error);
        setReceivingData([]);
      }
    };

    fetchReceivingData();
  }, [qcData]); // Re-fetch receiving data when qcData changes

  // Function to calculate SLA in days
  const calculateSLA = (receivingDate, lastProcessingDate) => {
    const received = new Date(receivingDate);
    let endDate;
  
    if (lastProcessingDate && lastProcessingDate !== 'N/A') {
      endDate = new Date(lastProcessingDate);
    } else {
      endDate = new Date(); // Use the current date
    }
  
    const diffTime = Math.abs(endDate - received);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert milliseconds to days
    return diffDays;
  };

  // Handle RFID scan
  const handleRfidScan = async (e) => {
    const scannedTag = e.target.value;
    setRfidTag(scannedTag);

    try {
      const response = await fetch(`/api/getBatchByRfid/${scannedTag}`);
      if (!response.ok) throw new Error('Failed to fetch batch number');
      const data = await response.json();
      setBatchNumber(data.batchNumber);
      setSnackbarMessage(`Batch number ${data.batchNumber} retrieved successfully!`);
      setSnackbarSeverity('success');
    } catch (error) {
      console.error('Error fetching batch number:', error);
      setSnackbarMessage('Error retrieving batch number. Please try again.');
      setSnackbarSeverity('error');
    } finally {
      setOpenSnackbar(true);
    }
  };

  // Handle batch number search
  const handleBatchNumberSearch = async () => {
    try {
      const response = await fetch(`https://processing-facility-backend.onrender.com/api/receiving/${batchNumber}`);
      if (!response.ok) throw new Error('Failed to fetch receiving data');
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const batchData = data[0];
        setFarmerName(batchData.farmerName || '');
        setReceivingDate(batchData.receivingDate || '');
        setWeight(batchData.weight || '');
        setTotalBags(batchData.totalBags || '');
        setSnackbarMessage(`Data for batch ${batchNumber} retrieved successfully!`);
        setSnackbarSeverity('success');
      } else {
        setSnackbarMessage('No valid data found for this batch number.');
        setSnackbarSeverity('warning');
      }
    } catch (error) {
      console.error('Error fetching receiving data:', error);
      setSnackbarMessage(`Error: ${error.message}`);
      setSnackbarSeverity('error');
    } finally {
      setOpenSnackbar(true);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const ripenessCSV = ripeness.join(", ");
    const colorCSV = color.join(", ");

    const qcDataPayload = {
      batchNumber: batchNumber.trim(), // Trim whitespace from batchNumber
      rfidTag: rfidTag.trim(), // Trim whitespace from rfidTag
      ripeness: ripenessCSV, // Trim whitespace from ripeness
      color: colorCSV, // Trim whitespace from color
      foreignMatter: foreignMatter.trim(), // Trim whitespace from foreignMatter
      overallQuality: overallQuality.trim(), // Trim whitespace from overallQuality
      qcNotes: qcNotes.trim(), // Trim whitespace from qcNotes
    };

    try {
      const response = await fetch('https://processing-facility-backend.onrender.com/api/qc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(qcDataPayload),
      });
      if (!response.ok) throw new Error('Failed to submit QC data');

      setSnackbarMessage(`QC data for batch ${batchNumber} submitted successfully!`);
      setSnackbarSeverity('success');

      // Reset form fields
      setRfidTag('');
      setBatchNumber('');
      setFarmerName('');
      setReceivingDate('');
      setWeight('');
      setTotalBags('');
      setRipeness([]);
      setColor([]);
      setForeignMatter('');
      setOverallQuality('');
      setQcNotes('');

      // Refresh the QC data
      const refreshQCData = await fetch('https://processing-facility-backend.onrender.com/api/qc');
      const refreshData = await refreshQCData.json();
      setQcData(refreshData.allRows || []);

    } catch (error) {
      console.error('Error submitting QC data:', error);
      setSnackbarMessage('Failed to submit QC data. Please try again.');
      setSnackbarSeverity('error');
    } finally {
      setOpenSnackbar(true);
    }
  };

  const qcColumns = [
    // { field: 'id', headerName: 'ID', width: 80 },
    { field: 'batchNumber', headerName: 'Batch Number', width: 150 },
    { field: 'qcDate', headerName: 'QC Date', width: 190 },
    { field: 'ripeness', headerName: 'Ripeness', width: 140 },
    { field: 'color', headerName: 'Color', width: 140 },
    { field: 'foreignMatter', headerName: 'Foreign Matter', width: 140 },
    { field: 'overallQuality', headerName: 'Overall Quality', width: 140 },
    { field: 'qcNotes', headerName: 'Notes', width: 180 },
  ];

  const pendingQcColumns = [
    // { field: 'id', headerName: 'ID', width: 80 },
    { field: 'batchNumber', headerName: 'Batch Number', width: 150 },
    { field: 'farmerName', headerName: 'Farmer Name', width: 150 },
    { field: 'receivingDate', headerName: 'Receiving Date', width: 250 },
    { field: 'weight', headerName: 'Weight (kg)', width: 150 },
    { field: 'totalBags', headerName: 'Total Bags', width: 150 },
    { field: 'slaDays', headerName: 'SLA (Days)', width: 150 },
  ];

  const getCellStyle = (value) => {
    if (value === "None") {
      return { backgroundColor: 'green', color: 'white' }; // Green for "None"
    } else if (value === "Some") {
      return { backgroundColor: 'yellow' }; // Yellow for "Some"
    } else if (value === "Yes") {
      return { backgroundColor: 'red', color: 'white' }; // Red for "Yes"
    }
    return {}; // Default style
  };

  // Show loading screen while session is loading
  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  // Redirect to the sign-in page if the user is not logged in or doesn't have the admin role
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'manager' && session.user.role !== 'qc')) {
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
              QC Station Form
            </Typography>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setRfidVisible(true)}
                    style={{ marginTop: '24px' }}
                  >
                    Scan RFID Tag
                  </Button>
                </Grid>
                <Grid item>
                  {rfidVisible && (
                    <TextField
                      id="rfid-input"
                      type="text"
                      value={rfidTag}
                      onChange={handleRfidScan}
                      placeholder="Scan RFID tag here"
                      fullWidth
                      required
                      autoFocus={false}
                      margin="normal"
                    />
                  )}
                </Grid>
                <Grid item xs>
                  <TextField
                    label="Batch Number Lookup"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder="Enter batch number to search"
                    fullWidth
                    required
                    margin="normal"
                  />
                </Grid>
                <Grid item>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleBatchNumberSearch}
                    style={{ marginTop: '24px' }}
                  >
                    Search
                  </Button>
                </Grid>
              </Grid>
              {farmerName && (
                <div>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        label="Farmer Name"
                        value={farmerName}
                        InputProps={{ readOnly: true }}
                        fullWidth
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Date Received"
                        value={receivingDate}
                        InputProps={{ readOnly: true }}
                        fullWidth
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Total Weight"
                        value={weight}
                        InputProps={{ readOnly: true }}
                        fullWidth
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Total Bags"
                        value={totalBags}
                        InputProps={{ readOnly: true }}
                        fullWidth
                        margin="normal"
                      />
                    </Grid>
                  </Grid>
                  <Divider style={{ margin: '16px 0' }} />
                </div>
              )}

              <FormControl fullWidth required sx={{marginTop: "16px"}}>
                <InputLabel id="ripeness-label">Ripeness</InputLabel>
                <Select
                  labelId="ripeness-label"
                  id="ripeness"
                  multiple
                  value={ripeness}
                  onChange={(e) => setRipeness(e.target.value)}
                  input={<OutlinedInput label="Ripeness" />}
                  MenuProps={MenuProps}
                >
                  <MenuItem value="Unripe">Unripe</MenuItem>
                  <MenuItem value="Ripe">Ripe</MenuItem>
                  <MenuItem value="Overripe">Overripe</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth required sx={{marginTop: "16px"}}>
                <InputLabel id="color-label">Color</InputLabel>
                <Select
                  labelId="color-label"
                  id="color"
                  multiple
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  input={<OutlinedInput label="Color" />}
                  MenuProps={MenuProps}
                >
                  <MenuItem value="Green">Green</MenuItem>
                  <MenuItem value="Yellowish Green">Yellowish Green</MenuItem>
                  <MenuItem value="Yellow">Yellow</MenuItem>
                  <MenuItem value="Red">Red</MenuItem>
                  <MenuItem value="Dark Red">Dark Red</MenuItem>
                  <MenuItem value="Black">Black</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth required sx={{marginTop: "16px"}}>
                <InputLabel id="fm-label">Foreign Matter</InputLabel>
                <Select
                  labelId="fm-label"
                  id="fm"
                  value={foreignMatter}
                  onChange={(e) => setForeignMatter(e.target.value)}
                  input={<OutlinedInput label="Foreign Matter" />}
                  MenuProps={MenuProps}
                >
                  <MenuItem value="None">None</MenuItem>
                  <MenuItem value="Some">Some</MenuItem>
                  <MenuItem value="Yes">Yes</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth required sx={{marginTop: "16px"}}>
                <InputLabel id="oq-label">Overall Quality</InputLabel>
                <Select
                  labelId="oq-label"
                  id="oq"
                  value={overallQuality}
                  onChange={(e) => setOverallQuality(e.target.value)}
                  input={<OutlinedInput label="Overall Quality" />}
                  MenuProps={MenuProps}
                >
                  <MenuItem value="Poor">Poor</MenuItem>
                  <MenuItem value="Fair">Fair</MenuItem>
                  <MenuItem value="Good">Good</MenuItem>
                  <MenuItem value="Excellent">Excellent</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                label="QC Notes"
                multiline
                rows={4}
                value={qcNotes}
                onChange={(e) => setQcNotes(e.target.value)}
                placeholder="Add QC notes"
                fullWidth
                margin="normal"
              />
              <Button 
                variant="contained" 
                color="secondary" 
                onClick={() => setOpen(true)} 
                style={{ marginTop: '16px', marginRight: '16px' }}
                disabled={!batchNumber}
                >
                Capture Sample Image
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                style={{ marginTop: '16px' }}
                disabled={!batchNumber}
                >
                Submit QC Data
              </Button>

              <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xl" fullWidth>
                <DialogTitle>Capture Sample Image</DialogTitle>
                <DialogContent>
                  <Card variant="outlined" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
                    <CardContent>
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        videoConstraints={{
                          width: 1920, // 1080p for the video feed
                          height: 1080,
                          facingMode: "user", // or "environment" for rear camera
                        }}
                        screenshotFormat="image/jpeg"
                        onUserMediaError={error => console.error('Webcam error:', error)}
                      />
                    </CardContent>
                  </Card>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center' }}>
                  <Button onClick={handleCapture} color="primary" variant="contained">
                    Capture
                  </Button>
                  <Button onClick={() => setOpen(false)} color="secondary" variant="contained">
                    Cancel
                  </Button>
                </DialogActions>
              </Dialog>


            </form>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Pending QC
            </Typography>
            <div style={{ height: 600, width: '100%' }}>
              <DataGrid
                rows={receivingData.map((row, index) => ({
                  id: index + 1,
                  ...row,
                }))}
                columns={pendingQcColumns}
                pageSize={5}
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

        <Divider style={{ margin: '16px 0' }} /> {/* Add a Divider here */}
        
        {/* Completed QC Section */}
        <Card style={{ marginTop: '16px' }} variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Completed QC
            </Typography>
            <div style={{ height: 1000, width: '100%' }}>
            <DataGrid
              rows={qcData.map((row, index) => ({
                id: index + 1,
                ...row,
              }))}
              columns={qcColumns}
              pageSize={5}
              slots={{ toolbar: GridToolbar }}
              autosizeOnMount
              autosizeOptions={{
                includeHeaders: true,
                includeOutliers: true,
                expand: true,
              }}
              getCellClassName={(params) => {
                if (params.field === 'foreignMatter') {
                  const style = getCellStyle(params.value);
                  return style; // Apply inline styles
                }
                return ''; // Default class
              }}
              renderCell={(params) => {
                if (params.field === 'foreignMatter') {
                  return (
                    <div style={getCellStyle(params.value)}>
                      {params.value}
                    </div>
                  );
                }
                return params.value; // Render other cells normally
              }}
            />
            </div>
          </CardContent>
        </Card>

      </Grid>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert onClose={() => setOpenSnackbar(false)} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default QCStation;