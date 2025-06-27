"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import {
  Typography,
  Grid,
  Button,
  TextField,
  Snackbar,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Tabs,
  Tab,
  Box,
} from '@mui/material';
import Alert from '@mui/material/Alert';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import axios from "axios";
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
dayjs.extend(duration);

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://processing-facility-backend.onrender.com';

const FermentationStation = () => {
  const { data: session, status } = useSession();
  const [batchNumber, setBatchNumber] = useState('');
  const [tank, setTank] = useState('');
  const [startDate, setStartDate] = useState(dayjs().format('YYYY-MM-DDTHH:mm:ss'));
  const [fermentationData, setFermentationData] = useState([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [tabValue, setTabValue] = useState('Biomaster');

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

  // Fetch fermentation data
  const fetchFermentationData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/fermentation`);
      setFermentationData(response.data || []);
    } catch (error) {
      console.error('Error fetching fermentation data:', error);
      setSnackbarMessage('Failed to fetch fermentation data. Please try again.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      setFermentationData([]);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchFermentationData();
  }, []);

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleBatchNumberSearch = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/receiving/${batchNumber}`);
      const data = response.data;

      if (Array.isArray(data) && data.length > 0) {
        setSnackbarMessage(`Batch ${batchNumber} found. Please select a tank and submit.`);
        setSnackbarSeverity('success');
      } else {
        setSnackbarMessage('No valid data found for this batch number.');
        setSnackbarSeverity('warning');
        setBatchNumber('');
      }
    } catch (error) {
      console.error('Error fetching batch data:', error);
      setSnackbarMessage(`Error: ${error.message}`);
      setSnackbarSeverity('error');
      setBatchNumber('');
    } finally {
      setOpenSnackbar(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!session || !session.user) {
      setSnackbarMessage('No user session found.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    if (!batchNumber || !tank || !startDate) {
      setSnackbarMessage('All fields are required.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    const payload = {
      batchNumber: batchNumber.trim(),
      tank,
      startDate: dayjs(startDate).toISOString(),
      createdBy: session.user.name,
    };

    try {
      await axios.post(`${API_BASE_URL}/api/fermentation`, payload);
      setSnackbarMessage(`Fermentation started for batch ${batchNumber} in ${tank}.`);
      setSnackbarSeverity('success');
      setBatchNumber('');
      setTank('');
      setStartDate(dayjs().format('YYYY-MM-DDTHH:mm:ss'));
      await fetchFermentationData();
    } catch (error) {
      console.error('Error submitting fermentation data:', error);
      setSnackbarMessage('Failed to start fermentation. Please try again.');
      setSnackbarSeverity('error');
    } finally {
      setOpenSnackbar(true);
    }
  };

  const handleFinishFermentation = async (batchNumber) => {
    try {
      await axios.put(`${API_BASE_URL}/api/fermentation/finish/${batchNumber}`);
      setSnackbarMessage(`Fermentation finished for batch ${batchNumber}.`);
      setSnackbarSeverity('success');
      await fetchFermentationData();
    } catch (error) {
      console.error('Error finishing fermentation:', error);
      setSnackbarMessage('Failed to finish fermentation. Please try again.');
      setSnackbarSeverity('error');
    } finally {
      setOpenSnackbar(true);
    }
  };

  const calculateElapsedTime = (startDate, endDate) => {
    if (endDate) return '-';
    const start = dayjs(startDate);
    const now = dayjs();
    const duration = dayjs.duration(now.diff(start));
    const days = Math.floor(duration.asDays());
    const hours = Math.floor(duration.asHours() % 24);
    const minutes = Math.floor(duration.asMinutes() % 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const fermentationColumns = [
    { field: 'batchNumber', headerName: 'Batch Number', width: 180 },
    { field: 'lotNumber', headerName: 'Lot Number', width: 180 },
    { field: 'farmerName', headerName: 'Farmer Name', width: 150 },
    { field: 'weight', headerName: 'Weight (kg)', width: 120 },
    { field: 'tank', headerName: 'Tank', width: 150 },
    {
      field: 'startDate',
      headerName: 'Start Date',
      width: 180,
      renderCell: ({ value }) => dayjs(value).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      field: 'elapsedTime',
      headerName: 'Elapsed Time',
      width: 150,
      renderCell: ({ row }) => calculateElapsedTime(row.startDate, row.endDate),
    },
    {
      field: 'endDate',
      headerName: 'End Date',
      width: 180,
      renderCell: ({ value }) => value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    { field: 'status', headerName: 'Status', width: 120 },
    { field: 'createdBy', headerName: 'Created By', width: 150 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: ({ row }) => (
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() => handleFinishFermentation(row.batchNumber)}
          disabled={row.status === 'Finished'}
        >
          Finish
        </Button>
      ),
    },
  ];

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'manager' && session.user.role !== 'staff')) {
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
              Fermentation Station Form
            </Typography>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs>
                  <TextField
                    label="Batch Number"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder="Enter batch number"
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
              <FormControl fullWidth required sx={{ marginTop: '16px' }}>
                <InputLabel id="tank-label">Tank</InputLabel>
                <Select
                  labelId="tank-label"
                  id="tank"
                  value={tank}
                  onChange={(e) => setTank(e.target.value)}
                  input={<OutlinedInput label="Tank" />}
                  MenuProps={MenuProps}
                >
                  <MenuItem value="Biomaster">Biomaster</MenuItem>
                  <MenuItem value="Carrybrew Tank">Carrybrew Tank</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Start Date and Time"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                fullWidth
                required
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                style={{ marginTop: '16px' }}
                disabled={!batchNumber || !tank}
              >
                Start Fermentation
              </Button>
            </form>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Fermentation Batches
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={fetchFermentationData}
              style={{ marginBottom: '16px' }}
            >
              Refresh Data
            </Button>
            <Tabs
              value={tabValue}
              onChange={(e, newValue) => setTabValue(newValue)}
              sx={{ marginBottom: '16px' }}
            >
              <Tab label="Biomaster" value="Biomaster" />
              <Tab label="Carrybrew" value="Carrybrew Tank" />
            </Tabs>
            <div style={{ height: 800, width: '100%' }}>
              <DataGrid
                rows={fermentationData
                  .filter(row => row.tank === tabValue)
                  .map((row, index) => ({ id: index + 1, ...row }))}
                columns={fermentationColumns}
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

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default FermentationStation;