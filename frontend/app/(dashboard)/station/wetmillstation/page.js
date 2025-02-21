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
  Chip,
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
  const [isLoading, setIsLoading] = useState(false);

  const fetchOrderBook = async () => {
    setIsLoading(true);
    try {
      const qcResponse = await fetch('https://processing-facility-backend.onrender.com/api/qc');
      if (!qcResponse.ok) throw new Error('Failed to fetch QC data');
      const qcResult = await qcResponse.json();
      const pendingPreprocessingData = qcResult.allRows || [];
  
      const wetmillResponse = await fetch('https://processing-facility-backend.onrender.com/api/wetmill-data');
      if (!wetmillResponse.ok) throw new Error('Failed to fetch wet mill data');
      const wetmillData = await wetmillResponse.json();
  
      const today = new Date();
      const formattedData = pendingPreprocessingData.map(batch => {
        const receivingDate = new Date(batch.receivingDate);
        let sla = 'N/A';
        if (!isNaN(receivingDate)) {
          const diffTime = Math.abs(today - receivingDate);
          sla = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
  
        // Find the latest wet mill data for this batch
        const batchData = wetmillData.filter(data => data.batchNumber === batch.batchNumber);
        const latestEntry = batchData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        const status = latestEntry
          ? latestEntry.exited_at
            ? 'Exited Wet Mill'
            : 'Entered Wet Mill'
          : 'Not Scanned';
  
        return {
          ...batch,
          sla,
          status,
          startProcessingDate: batch.startProcessingDate ? new Date(batch.startProcessingDate).toISOString().slice(0, 10) : 'N/A',
          lastProcessingDate: batch.lastProcessingDate ? new Date(batch.lastProcessingDate).toISOString().slice(0, 10) : 'N/A',
        };
      });
  
      const unprocessedBatches = formattedData.filter(batch => batch.availableBags > 0);
      const sortedUnprocessedBatches = unprocessedBatches.sort((a, b) => {
        // Sort by type: Arabica (0), Robusta (1), others (2+)
        const typeOrder = {
          'Arabica': 0,
          'Robusta': 1,
        };
        const typeA = typeOrder[a.type] !== undefined ? typeOrder[a.type] : 2 + (a.type || '').localeCompare('');
        const typeB = typeOrder[b.type] !== undefined ? typeOrder[b.type] : 2 + (b.type || '').localeCompare('');
        if (typeA !== typeB) return typeA - typeB;
  
        // Secondary sorts (alphabetical)
        if (a.cherryGroup !== b.cherryGroup) return a.cherryGroup.localeCompare(b.cherryGroup);
        if (a.ripeness !== b.ripeness) return a.ripeness.localeCompare(b.ripeness);
        if (a.color !== b.color) return a.color.localeCompare(b.color);
        if (a.foreignMatter !== b.foreignMatter) return a.foreignMatter.localeCompare(b.foreignMatter);
        if (a.overallQuality !== b.overallQuality) return a.overallQuality.localeCompare(b.overallQuality);
        return 0;
      });
  
      const processedBatches = formattedData.filter(batch => batch.processedBags > 0);
      const sortedData = processedBatches.sort((a, b) => {
        // Sort by type: Arabica (0), Robusta (1), others (2+)
        const typeOrder = {
          'Arabica': 0,
          'Robusta': 1,
        };
        const typeA = typeOrder[a.type] !== undefined ? typeOrder[a.type] : 2 + (a.type || '').localeCompare('');
        const typeB = typeOrder[b.type] !== undefined ? typeOrder[b.type] : 2 + (b.type || '').localeCompare('');
        if (typeA !== typeB) return typeA - typeB;
  
        // Sort by startProcessingDate (N/A first, then oldest to newest)
        if (a.startProcessingDate === 'N/A' && b.startProcessingDate !== 'N/A') return -1;
        if (a.startProcessingDate !== 'N/A' && b.startProcessingDate === 'N/A') return 1;
        if (a.startProcessingDate !== b.startProcessingDate) return a.startProcessingDate.localeCompare(b.startProcessingDate);
  
        // Sort by availableBags (descending)
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
    fetchOrderBook();
    const intervalId = setInterval(() => {
      fetchOrderBook();
    }, 300000); // 5 minutes
    return () => clearInterval(intervalId);
  }, []);

  const handleRefreshData = () => {
    fetchOrderBook();
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const columns = [
    { field: 'batchNumber', headerName: 'Batch Number', width: 160, sortable: true },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      sortable: true,
      renderCell: (params) => {
        const status = params.value;
        let color;
        switch (status) {
          case 'Entered Wet Mill':
            color = 'primary'; // Blue
            break;
          case 'Exited Wet Mill':
            color = 'success'; // Green
            break;
          case 'Not Scanned':
            color = 'default'; // Grey
            break;
          default:
            color = 'default';
        }
        return (
          <Chip
            label={status}
            color={color}
            size="small"
            sx={{
              borderRadius: '16px',
              fontWeight: 'medium',
            }}
          />
        );
      },
    },
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