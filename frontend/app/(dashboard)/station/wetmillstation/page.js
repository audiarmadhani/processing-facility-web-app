"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import {
  TextField,
  Button,
  Typography,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  CircularProgress,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const WetmillStation = () => {
  const { data: session, status } = useSession();
  const [rfidTag, setRfidTag] = useState('');
  const [bagsProcessed, setBagsProcessed] = useState(1);
  const [batchNumber, setBatchNumber] = useState('');
  const [bagsAvailable, setBagsAvailable] = useState(0);
  const [totalProcessedBags, setTotalProcessedBags] = useState(0);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [rfidVisible, setRfidVisible] = useState(false);
  const [farmerName, setFarmerName] = useState('');
  const [receivingDate, setReceivingDate] = useState('');
  const [receivingdatedata, setreceivingdatedata] = useState('');
  const [receivingDateTrunc, setReceivingDateTrunc] = useState('');
  const [qcDate, setQCDate] = useState('');
  const [qcdatedata, setqcdatedata] = useState('');
  const [qcDateTrunc, setQCDateTrunc] = useState('');
  const [weight, setWeight] = useState('');
  const [totalBags, setTotalBags] = useState('');
  const [openHistory, setOpenHistory] = useState(false);
  const [bagsHistory, setBagsHistory] = useState([]);
  const [preprocessingData, setPreprocessingData] = useState([]);
  const [unprocessedBatches, setUnprocessedBatches] = useState([]);
  const [producer, setProducer] = useState('');
  const [productLine, setProductLine] = useState('');
  const [processingType, setProcessingType] = useState('');
  const [quality, setQuality] = useState('');
  const [isLoading, setIsLoading] = useState(false); // New state for loading

  const fetchOrderBook = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://processing-facility-backend.onrender.com/api/qc');
      if (!response.ok) {
        throw new Error('Failed to fetch data from server');
      }
      const result = await response.json();
      const pendingPreprocessingData = result.allRows || [];

      // Calculate SLA (days since receiving)
      const today = new Date();
      const formattedData = pendingPreprocessingData.map(batch => {
        const receivingDate = new Date(batch.receivingDate);
        let sla = 'N/A';

        if (!isNaN(receivingDate)) {
          const diffTime = Math.abs(today - receivingDate);
          sla = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        return {
          ...batch,
          sla,
          startProcessingDate: batch.startProcessingDate ? new Date(batch.startProcessingDate).toISOString().slice(0, 10) : 'N/A',
          lastProcessingDate: batch.lastProcessingDate ? new Date(batch.lastProcessingDate).toISOString().slice(0, 10) : 'N/A'
        };
      });

      // Filter and sort unprocessed batches
      const unprocessedBatches = formattedData.filter(batch => batch.availableBags > 0);
      const sortedUnprocessedBatches = unprocessedBatches.sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        if (a.cherryGroup !== b.cherryGroup) return a.cherryGroup.localeCompare(b.cherryGroup);
        if (a.ripeness !== b.ripeness) return a.ripeness.localeCompare(b.ripeness);
        if (a.color !== b.color) return a.color.localeCompare(b.color);
        if (a.foreignMatter !== b.foreignMatter) return a.foreignMatter.localeCompare(b.foreignMatter);
        if (a.overallQuality !== b.overallQuality) return a.overallQuality.localeCompare(b.overallQuality);
        return 0;
      });

      // Filter and sort processed batches
      const processedBatches = formattedData.filter(batch => batch.processedBags > 0);
      const sortedDataType = processedBatches.sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return 0;
      });
      const sortedData = sortedDataType.sort((a, b) => {
        if (a.startProcessingDate === 'N/A' && b.startProcessingDate !== 'N/A') { return -1; }
        if (a.startProcessingDate !== 'N/A' && b.startProcessingDate === 'N/A') { return 1; }
        return b.availableBags - a.availableBags;
      });

      setPreprocessingData(sortedData);
      setUnprocessedBatches(sortedUnprocessedBatches);
    } catch (error) {
      console.error('Error fetching preprocessing data:', error);
      setSnackbarMessage(error.message || 'Error fetching data. Please try again.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderBook(); // Initial fetch on mount

    // Auto-refresh every 5 minutes (300,000 ms)
    const intervalId = setInterval(() => {
      fetchOrderBook();
    }, 300000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const handleRefreshData = () => {
    fetchOrderBook(); // Manual refresh on button click
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const columns = [
    { field: 'batchNumber', headerName: 'Batch Number', width: 160, sortable: true },
    { field: 'startProcessingDate', headerName: 'Start Processing Date', width: 180, sortable: true },
    { field: 'lastProcessingDate', headerName: 'Last Processing Date', width: 180, sortable: true },
    { field: 'totalBags', headerName: 'Total Bags', width: 100, sortable: true },
    { field: 'processedBags', headerName: 'Processed Bags', width: 130, sortable: true },
    { field: 'availableBags', headerName: 'Available Bags', width: 130, sortable: true },
    { field: 'type', headerName: 'Type', width: 100, sortable: true },
    { field: 'producer', headerName: 'Producer', width: 100, sortable: true },
    { field: 'productLine', headerName: 'Product Line', width: 130, sortable: true },
    { field: 'processingType', headerName: 'Processing Type', width: 160, sortable: true },
    { field: 'quality', headerName: 'Quality', width: 130, sortable: true },
  ];

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'manager' && session.user.role !== 'preprocessing')) {
    return (
      <Typography variant="h6">
        Access Denied. You do not have permission to view this page.
      </Typography>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={12}>  
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Processing Order Book
            </Typography>

            {/* Refresh Data Button with Spinner */}
            <Button
              variant="contained"
              color="primary"
              onClick={handleRefreshData}
              disabled={isLoading}
              style={{ marginBottom: '16px' }}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isLoading ? 'Refreshing...' : 'Refresh Data'}
            </Button>

            {/* Table for Preprocessing Data */}
            <div style={{ height: 1500, width: '100%' }}>
              <DataGrid
                rows={preprocessingData}
                columns={columns}
                pageSize={5}
                rowsPerPageOptions={[5, 10, 20]}
                disableSelectionOnClick
                sortingOrder={['asc', 'desc']}
                getRowId={(row) => row.batchNumber}
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

      {/* Snackbar for Error Feedback */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default WetmillStation;