"use client";

import React, { useState, useEffect } from 'react';
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
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

const API_BASE_URL = 'https://processing-facility-backend.onrender.com/api/targets';

function TargetInputStation() {
  const { data: session, status } = useSession();
  const [type, setType] = useState('');
  const [processingType, setProcessingType] = useState('');
  const [productLine, setProductLine] = useState('');
  const [producer, setProducer] = useState('');
  const [quality, setQuality] = useState('');
  const [metric, setMetric] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [startDate, setStartDate] = useState(dayjs());
  const [endDate, setEndDate] = useState(dayjs());
  const [timeFrame, setTimeFrame] = useState('');
  const [currentTargets, setCurrentTargets] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [timeframeSelect, setTimeframeSelect] = useState('this-week');
  const [data, setData] = useState([]);

  // Predefined options
  const predefinedProcesses = ['Pulped Natural', 'Washed', 'Natural', 'Anaerobic Natural', 'Anaerobic Washed', 'Anaerobic Honey', 'CM Natural', 'CM Washed'];
  const predefinedProductLine = ['Regional Lot', 'Micro Lot', 'Competition Lot'];
  const predefinedProducer = ['HQ', 'BTM'];
  const predefinedMetrics = ['Total Weight Produced'];
  const timeframes = ['this-week', 'next-week', 'previous-week', 'this-month', 'next-month', 'previous-month'];

  // Date calculation function
  const getStartAndEndDates = (timeframe) => {
    const today = dayjs();
    let startDate, endDate;

    switch (timeframe) {
      case 'this-week':
        startDate = today.startOf('isoWeek');
        endDate = today.endOf('isoWeek');
        break;
      case 'next-week':
        startDate = today.add(1, 'week').startOf('isoWeek');
        endDate = today.add(1, 'week').endOf('isoWeek');
        break;
      case 'previous-week':
        startDate = today.subtract(1, 'week').startOf('isoWeek');
        endDate = today.subtract(1, 'week').endOf('isoWeek');
        break;
      case 'this-month':
        startDate = today.startOf('month');
        endDate = today.endOf('month');
        break;
      case 'next-month':
        startDate = today.add(1, 'month').startOf('month');
        endDate = today.add(1, 'month').endOf('month');
        break;
      case 'previous-month':
        startDate = today.subtract(1, 'month').startOf('month');
        endDate = today.subtract(1, 'month').endOf('month');
        break;
      default:
        return { startDate: null, endDate: null };
    }

    return { 
      startDate: startDate.format('YYYY-MM-DD'), 
      endDate: endDate.format('YYYY-MM-DD') 
    };
  };

  // Fetch targets and data
  useEffect(() => {
    const fetchTargets = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/${timeframeSelect}`);
        if (!response.ok) throw new Error('Failed to fetch targets');
        const data = await response.json();
        setCurrentTargets(data);
      } catch (error) {
        console.error('Error fetching targets:', error);
        setCurrentTargets([]);
      }
    };

    fetchTargets();
  }, [timeframeSelect]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/${timeframeSelect}`);
        if (!response.ok) throw new Error('Failed to fetch data');
        const result = await response.json();

        // Complex multi-field sorting
        const sortedData = result.sort((a, b) => {
          if (a.type !== b.type) return a.type.localeCompare(b.type);
          if (a.producer !== b.producer) return a.producer.localeCompare(b.producer);
          if (a.productLine !== b.productLine) return a.productLine.localeCompare(b.productLine);
          if (a.processingType !== b.processingType) return a.processingType.localeCompare(b.processingType);
          if (a.quality !== b.quality) return a.quality.localeCompare(b.quality);
          if (a.metric !== b.metric) return a.metric.localeCompare(b.metric);
          return 0;
        });

        setData(sortedData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setData([]);
      }
    };

    fetchData();
  }, [timeframeSelect, currentTargets]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      type,
      processingType,
      productLine,
      producer,
      quality,
      metric,
      timeFrame,
      targetValue,
      startDate: startDate.format('YYYY-MM-DD'),
      endDate: endDate.format('YYYY-MM-DD'),
    };

    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to create target');

      // Reset form
      setType('');
      setProcessingType('');
      setProductLine('');
      setProducer('');
      setQuality('');
      setMetric('');
      setTimeFrame('');
      setTargetValue('');
      setStartDate(dayjs());
      setEndDate(dayjs());

      // Refresh data
      setCurrentTargets(prev => [...prev, payload]); // Optimistic update
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Submission error:', error);
    }
  };

  const { startDate: displayStart, endDate: displayEnd } = getStartAndEndDates(timeframeSelect);

  const columns = [
    { 
      field: 'type', 
      headerName: 'Type', 
      minWidth: 80, // Minimum width
      flex: 1, // Allows column to grow
    },
    { 
      field: 'processingType', 
      headerName: 'Processing Type', 
      minWidth: 140,
      flex: 1,
    },
    { 
      field: 'productLine', 
      headerName: 'Product Line', 
      minWidth: 140,
      flex: 1,
    },
    { 
      field: 'producer', 
      headerName: 'Producer', 
      minWidth: 140,
      flex: 1,
    },
    { 
      field: 'quality', 
      headerName: 'Quality', 
      minWidth: 100,
      flex: 1,
    },
    { 
      field: 'metric', 
      headerName: 'Metric', 
      minWidth: 180,
      flex: 2, // Give more space to longer content
    },
    { 
      field: 'targetValue', 
      headerName: 'Target', 
      minWidth: 90,
      flex: 1,
    },
    { 
      field: 'achievement', 
      headerName: 'Achievement', 
      minWidth: 110,
      flex: 1,
    },
  ];

  if (status === 'loading') return <p>Loading...</p>;

  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'manager')) {
    return (
      <Typography variant="h6">
        Access Denied. You do not have permission to view this page.
      </Typography>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Input Form */}
      <Grid item xs={12} md={4}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Target Setting
            </Typography>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                {/* Form Fields */}
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel id="type-label">Type</InputLabel>
                    <Select
                      labelId="type-label"
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
                    options={predefinedProducer}
                    value={producer}
                    onChange={(_, newValue) => setProducer(newValue || '')}
                    renderInput={(params) => (
                      <TextField {...params} label="Producer" required />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Autocomplete
                    freeSolo
                    options={predefinedProductLine}
                    value={productLine}
                    onChange={(_, newValue) => setProductLine(newValue || '')}
                    renderInput={(params) => (
                      <TextField {...params} label="Product Line" required />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Autocomplete
                    freeSolo
                    options={predefinedProcesses}
                    value={processingType}
                    onChange={(_, newValue) => setProcessingType(newValue || '')}
                    renderInput={(params) => (
                      <TextField {...params} label="Process" required />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel id="quality-label">Quality</InputLabel>
                    <Select
                      labelId="quality-label"
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
                    onChange={(_, newValue) => setMetric(newValue || '')}
                    renderInput={(params) => (
                      <TextField {...params} label="Metric" required />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Target Value"
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
                      format="YYYY-MM-DD"
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid item xs={6}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="End Date"
                      value={endDate}
                      onChange={setEndDate}
                      format="YYYY-MM-DD"
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid item xs={12}>
                  <Button variant="contained" type="submit" fullWidth>
                    Submit Target
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Grid>

      {/* Data Display */}
      <Grid item xs={12} md={8}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel id="timeframe-select-label">Select Timeframe</InputLabel>
              <Select
                value={timeframeSelect}
                onChange={({ target: { value } }) => setTimeframeSelect(value)}
                input={<OutlinedInput label="Select Timeframe" />}
              >
                {timeframes.map((timeframe) => (
                  <MenuItem key={timeframe} value={timeframe}>
                    {timeframe.replace('-', ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase())}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="body2" color="textSecondary" mt={1}>
              Date Range: {displayStart} - {displayEnd}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Targets Overview
                </Typography>
                <div style={{ width: '100%', overflowX: 'auto' }}>
                  <DataGrid
                    rows={data}
                    columns={columns}
                    autoHeight
                    pageSize={5}
                    slots={{ toolbar: GridToolbar }}
                    disableRowSelectionOnClick
                    disableColumnMenu
                    disableColumnSelector
                    disableDensitySelector
                    columnBuffer={columns.length}
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
      </Grid>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert severity="success">
          Target created successfully!
        </Alert>
      </Snackbar>
    </Grid>
  );
}

export default TargetInputStation;