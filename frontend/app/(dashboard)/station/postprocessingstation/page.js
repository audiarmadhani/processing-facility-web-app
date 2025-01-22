"use client"; 

import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';

function PostprocessingStation() {
  const [notes, setNotes] = useState('');
  const [totalBags, setTotalBags] = useState('');
  const [weight, setWeight] = useState('');
  const [postprocessingData, setPostprocessingData] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [type, setType] = useState('');
  const [processingType, setProcessingType] = useState('');
  const [quality, setQuality] = useState('');


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
    fetchPostprocessingData();
  }, []);

  const fetchPostprocessingData = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/postprocessing');
      if (!response.ok) throw new Error('Failed to fetch post processing data');

      const data = await response.json();
      console.log('Fetched data:', data); // Log the fetched data for debugging

      if (data && Array.isArray(data.latestRows)) {
        setPostprocessingData(data.latestRows.map((row, index) => ({ ...row, id: index }))); // Add unique id
      } else {
        console.error('Unexpected data format:', data);
        setPostprocessingData([]);
      }
    } catch (error) {
      console.error('Error fetching post processing data:', error);
      setPostprocessingData([]);
    }
  };

  const handleWriteToCard = () => {
    console.log('Writing to RFID card:', { farmerName, notes, bagWeights, totalWeight });
    alert('RFID card written successfully!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      type,
      processingType,
      weight,
      totalBags,
      quality,
      notes,
    };

    try {
      const response = await fetch('http://localhost:5001/api/postprocessing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setType('');
        setNotes('');
        setTotalBags('');
        setWeight('');
        setProcessingType('');
        setQuality('');
        fetchPostprocessingData();
        setSnackbarOpen(true);
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
    { field: 'batchNumber', headerName: 'Batch Number', width: 150, sortable: true },
    { field: 'storedDate', headerName: 'Stored Date', width: 180, sortable: true },
    { field: 'processingType', headerName: 'Process', width: 90, sortable: true },
    { field: 'type', headerName: 'Type', width: 90, sortable: true },
    { field: 'quality', headerName: 'Quality', width: 90, sortable: true },
    { field: 'weight', headerName: 'Total Weight (kg)', width: 160, sortable: true },
    { field: 'totalBags', headerName: 'Bags Qty', width: 90, sortable: true },
    { field: 'notes', headerName: 'Notes', width: 200, sortable: true },
  ];


  return (
    <Grid container spacing={3}>
      {/* Receiving Station Form */}
      <Grid item xs={12} md={4}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Post Processing Station Form
            </Typography>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>

                <Grid item xs={12}>
                  <FormControl fullWidth required sx={{marginTop: "16px"}}>
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
                  <FormControl fullWidth required>
                    <InputLabel id="process-label">Process</InputLabel>
                    <Select
                      labelId="process-label"
                      id="process"
                      value={processingType}
                      onChange={(e) => setProcessingType(e.target.value)}
                      input={<OutlinedInput label="Process" />}
                      MenuProps={MenuProps}
                    >
                      <MenuItem value="Natural">Natural</MenuItem>
                      <MenuItem value="Wet Hulled">Wet Hulled</MenuItem>
                      <MenuItem value="Honey">Honey</MenuItem>
                      <MenuItem value="Experimental">Experimental</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel id="quality-label">Quality</InputLabel>
                    <Select
                      labelId="quality-label"
                      id="quality"
                      value={quality}
                      onChange={(e) => setQuality(e.target.value)}
                      input={<OutlinedInput label="Quality" />}
                      MenuProps={MenuProps}
                    >
                      <MenuItem value="Specialty">Specialty</MenuItem>
                      <MenuItem value="G1">G1</MenuItem>
                      <MenuItem value="G2">G2</MenuItem>
                      <MenuItem value="G3">G3</MenuItem>
                      <MenuItem value="G4">G4</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Total Bags"
                    type="totalbags"
                    value={totalBags}
                    onChange={(e) => setTotalBags(e.target.value)}
                    fullWidth
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Total Weight"
                    type="weight"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
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
      <Grid item xs={12} md={8}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Post Processing Data
            </Typography>
            <div style={{ height: 1000, width: '100%' }}>
              <DataGrid
                rows={postprocessingData}
                columns={columns}
                pageSize={5}
                rowsPerPageOptions={[5, 10, 20]}
                disableSelectionOnClick
                sortingOrder={['asc', 'desc']}
                slots={{ toolbar: GridToolbar }}
              />
            </div>
          </CardContent>
        </Card>
      </Grid>

      {/* Snackbar for notifications */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Batch successfully created!
        </Alert>
      </Snackbar>
    </Grid>
  );
}

export default PostprocessingStation;