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
  Autocomplete,
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  OutlinedInput,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';

const API_BASE_URL = 'https://processing-facility-backend.onrender.com/api/targets'; // Define your base API URL here

function TargetInputStation() {

  const { data: session, status } = useSession(); // Access session data and status

  const [type, setType] = useState('');
  const [processingType, setProcessingType] = useState('');
  const [quality, setQuality] = useState('');
  const [metric, setMetric] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [timeFrame, setTimeFrame] = useState('');
  const [currentTargets, setCurrentTargets] = useState([]);
  const [nextTargets, setNextTargets] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [timeframeSelect, setTimeframeSelect] = useState('this-week'); // State for selected timeframe
  const [data, setData] = useState([]);

  const predefinedProcesses = ['Natural', 'Wet Hulled', 'Honey', 'Experimental'];
  const predefinedMetrics = ['Total Weight Produced'];
  const timeframes = ['this-week', 'next-week', 'previous-week', 'this-month', 'next-month', 'previous-month']; // Add more timeframes if needed

  useEffect(() => {
    fetchTargets(timeframeSelect, setCurrentTargets);
  }, [timeframeSelect]); // Fetch targets whenever the selected timeframe changes

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/${timeframeSelect}`);
        const result = await response.json();
  
        // Manual sorting logic
        const sortedData = result.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type.localeCompare(b.type);
          }
          if (a.processingType !== b.processingType) {
            return a.processingType.localeCompare(b.processingType);
          }
          if (a.quality !== b.quality) {
            return a.quality.localeCompare(b.quality);
          }
          if (a.metric !== b.metric) {
            return a.metric.localeCompare(b.metric);
          }
          return 0; // Maintain the order if all fields are equal
        });
  
        setData(sortedData); // Set the manually sorted data
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
  
    fetchData();
  }, [timeframeSelect]);

  const fetchTargets = async (timeframe, setter) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${timeframe}`);
      if (!response.ok) throw new Error(`Failed to fetch ${timeframe} targets`);
      const data = await response.json();
      setter(data);
    } catch (error) {
      console.error(error);
      setter([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      type,
      processingType,
      quality,
      metric,
      timeFrame,
      targetValue,
      startDate,
      endDate,
    };

    console.log('Payload:', payload);

    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Reset form
        setType('');
        setProcessingType('');
        setQuality('');
        setMetric('');
        setTimeFrame('');
        setTargetValue('');
        setStartDate(null);
        setEndDate(null);

        // Fetch the updated targets
        fetchTargets(timeframeSelect, setCurrentTargets);
        fetchData(); // Call this to refresh the table data

        // Show success notification
        setSnackbarOpen(true);
      } else {
        const errorData = await response.json();
        console.error(errorData.message || 'Error creating target.');
      }
    } catch (error) {
      console.error('Failed to communicate with the backend:', error);
    }
  };  

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const columns = [
    // { field: 'id', headerName: 'ID', width: 70 },
    // { field: 'timeFrame', headerName: 'Timeframe', width: 130 },
    { field: 'type', headerName: 'Type', width: 80 },
    { field: 'processingType', headerName: 'Processing Type', width: 140 },
    { field: 'quality', headerName: 'Quality', width: 100 },
    { field: 'metric', headerName: 'Metric', width: 180, rowSpanValueGetter: () => null },
    { field: 'targetValue', headerName: 'Target', width: 90, rowSpanValueGetter: () => null },
    { field: 'achievement', headerName: 'Achievement', width: 110, rowSpanValueGetter: () => null },
    // { field: 'startDate', headerName: 'Start Date', width: 130 },
    // { field: 'endDate', headerName: 'End Date', width: 130 },
  ];

  
  // Show loading screen while session is loading
  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  // Redirect to the sign-in page if the user is not logged in or doesn't have the admin role
  if (!session?.user || session.user.role !== 'admin') {
    return <Typography variant="h6">Access Denied. You do not have permission to view this page.</Typography>;
  }


  return (
    <Grid container spacing={3}>
    
      {/* Target Input Form */}
      <Grid item xs={12} md={4}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Target Setting
            </Typography>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                
                <Grid item xs={12}>
                  <FormControl fullWidth required sx={{ marginTop: "16px" }}>
                    <InputLabel id="type-label">Type</InputLabel>
                    <Select
                      labelId="type-label"
                      id="type"
                      value={type}
                      onChange={({ target: { value } }) => setType(value)}
                      input={<OutlinedInput label="Type" />}
                    >
                      <MenuItem value="Arabica">Arabica</MenuItem>
                      <MenuItem value="Robusta">Robusta</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Autocomplete
                    freeSolo
                    options={predefinedProcesses}
                    value={processingType}
                    onChange={(event, newValue) => setProcessingType(newValue)}
                    onInputChange={(event, newValue) => setProcessingType(newValue)}
                    renderInput={(params) => <TextField {...params} label="Process" fullWidth required />}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel id="quality-label">Quality</InputLabel>
                    <Select
                      labelId="quality-label"
                      id="quality"
                      value={quality}
                      onChange={({ target: { value } }) => setQuality(value)}
                      input={<OutlinedInput label="Quality" />}
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
                  <FormControl fullWidth required>
                    <InputLabel id="timeframe-label">Timeframe</InputLabel>
                    <Select
                      labelId="timeframe-label"
                      id="timeframe"
                      value={timeFrame}
                      onChange={({ target: { value } }) => setTimeFrame(value)}
                      input={<OutlinedInput label="Timeframe" />}
                    >
                      <MenuItem value="Weekly">Weekly</MenuItem>
                      <MenuItem value="Monthly">Monthly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Autocomplete
                    freeSolo
                    options={predefinedMetrics}
                    value={metric}
                    onChange={(event, newValue) => setMetric(newValue)}
                    onInputChange={(event, newValue) => setMetric(newValue)}
                    renderInput={(params) => <TextField {...params} label="Metric" fullWidth required />}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Target Value"
                    type="text"
                    value={targetValue}
                    onChange={({ target: { value } }) => setTargetValue(value)}
                    fullWidth
                    required
                  />
                </Grid>

                <Grid item xs={6}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Start Date"
                      value={startDate}
                      onChange={setStartDate}
                      renderInput={(params) => <TextField {...params} fullWidth required />}
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid item xs={6}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="End Date"
                      value={endDate}
                      onChange={setEndDate}
                      renderInput={(params) => <TextField {...params} fullWidth required />}
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid item xs={12}>
                  <Button variant="contained" color="primary" type="submit" fullWidth>
                    Submit Target
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Grid>

      {/* Targets Table */}
      <Grid item xs={12} md={8}>
        {/* Timeframe Selection Dropdown */}
        <Grid item xs={4} style={{ marginBottom: '16px' }}>
          <FormControl fullWidth>
            <InputLabel id="timeframe-select-label">Select Timeframe</InputLabel>
            <Select
              labelId="timeframe-select-label"
              value={timeframeSelect}
              onChange={({ target: { value } }) => setTimeframeSelect(value)}
              input={<OutlinedInput label="Select Timeframe" />}
            >
              {timeframes.map((timeframe) => (
                <MenuItem key={timeframe} value={timeframe}>
                  {timeframe.charAt(0).toUpperCase() + timeframe.slice(1).replace('-', ' ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Targets Overview
            </Typography>
            <DataGrid
              rows={data}
              columns={columns}
              autoHeight
              pageSize={5}
              rowsPerPageOptions={[5]}
              unstable_rowSpanning
              hideFooter
              showCellVerticalBorder
              showColumnVerticalBorder
              disableRowSelectionOnClick
              slots={{ toolbar: GridToolbar }}
            />
          </CardContent>
        </Card>
      </Grid>

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          Target created successfully!
        </Alert>
      </Snackbar>
    </Grid>
  );
}

export default TargetInputStation;