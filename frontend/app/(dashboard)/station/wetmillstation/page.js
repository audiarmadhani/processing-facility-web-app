"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import {
  Button,
  Typography,
  Snackbar,
  Alert,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Chip,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';

const WetmillStation = () => {
  const { data: session, status } = useSession();
  const [preprocessingData, setPreprocessingData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const fetchOrderBook = async () => {
    setIsLoading(true);
    try {
      const qcResponse = await fetch('https://processing-facility-backend.onrender.com/api/qc');
      if (!qcResponse.ok) throw new Error('Failed to fetch QC data');
      const qcResult = await qcResponse.json();
      const qcData = qcResult.distinctRows || [];

      const wetmillResponse = await fetch('https://processing-facility-backend.onrender.com/api/wetmill-data');
      if (!wetmillResponse.ok) throw new Error('Failed to fetch wet mill data');
      const wetmillData = await wetmillResponse.json();

      const dryingResponse = await fetch('https://processing-facility-backend.onrender.com/api/drying-data');
      if (!dryingResponse.ok) throw new Error('Failed to fetch drying data');
      const dryingData = await dryingResponse.json();

      const today = new Date();
      const formattedData = qcData
        .filter(batch => !dryingData.some(d => d.batchNumber === batch.batchNumber && d.entered_at)) // Exclude batches in Drying
        .map(batch => {
          const receivingDate = new Date(batch.receivingDate);
          const sla = isNaN(receivingDate)
            ? 'N/A'
            : Math.ceil(Math.abs(today - receivingDate) / (1000 * 60 * 60 * 24));

          const batchWetmillData = wetmillData.filter(data => data.batchNumber === batch.batchNumber);
          const latestEntry = batchWetmillData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
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
        })
        .sort((a, b) => {
          // Sort by type: Arabica (0), Robusta (1), others (2+)
          const typeOrder = { 'Arabica': 0, 'Robusta': 1 };
          const typeA = typeOrder[a.type] !== undefined ? typeOrder[a.type] : 2 + (a.type || '').localeCompare('');
          const typeB = typeOrder[b.type] !== undefined ? typeOrder[b.type] : 2 + (b.type || '').localeCompare('');
          if (typeA !== typeB) return typeA - typeB;

          // Sort by status: Entered Wet Mill (0), Not Scanned (1), Exited Wet Mill (2)
          const statusOrder = { 'Entered Wet Mill': 0, 'Not Scanned': 2, 'Exited Wet Mill': 1 };
          const statusA = statusOrder[a.status] || 3;
          const statusB = statusOrder[b.status] || 3;
          if (statusA !== statusB) return statusA - statusB;

          // Sort by startProcessingDate (oldest first, N/A last)
          if (a.startProcessingDate === 'N/A' && b.startProcessingDate !== 'N/A') return 1;
          if (a.startProcessingDate !== 'N/A' && b.startProcessingDate === 'N/A') return -1;
          if (a.startProcessingDate !== b.startProcessingDate) return a.startProcessingDate.localeCompare(b.startProcessingDate);

          return 0;
        });

      setPreprocessingData(formattedData);
    } catch (error) {
      console.error('Error fetching order book data:', error);
      setSnackbarMessage(error.message || 'Error fetching data. Please try again.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderBook();
    const intervalId = setInterval(fetchOrderBook, 300000); // 5 minutes
    return () => clearInterval(intervalId);
  }, []);

  const handleRefreshData = () => fetchOrderBook();

  const handleCloseSnackbar = () => setOpenSnackbar(false);

  const columns = [
    { field: 'batchNumber', headerName: 'Batch Number', width: 160 },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 150, 
      renderCell: (params) => {
        const status = params.value;
        const color = {
          'Entered Wet Mill': 'primary',
          'Exited Wet Mill': 'success',
          'Not Scanned': 'default',
        }[status] || 'default';
        return (
          <Chip
            label={status}
            color={color}
            size="small"
            sx={{ borderRadius: '16px', fontWeight: 'medium' }}
          />
        );
      },
    },
    { field: 'farmerName', headerName: 'Farmer Name', width: 160 },
    { field: 'type', headerName: 'Type', width: 140 },
    { field: 'farmVarieties', headerName: 'Farm Varieties', width: 160 },
    { field: 'startProcessingDate', headerName: 'Start Processing Date', width: 180 },
    { field: 'lastProcessingDate', headerName: 'Last Processing Date', width: 180 },
    { field: 'totalBags', headerName: 'Total Bags', width: 100 },
    { field: 'weight', headerName: 'Total Weight (kg)', width: 180 },
    { field: 'availableWeight', headerName: 'Available Weight (kg)', width: 180 },
    { field: 'processedWeight', headerName: 'Processed Weight (kg)', width: 180 },
    { field: 'type', headerName: 'Type', width: 100 },
    { field: 'producer', headerName: 'Producer', width: 100 },
    { field: 'productLine', headerName: 'Product Line', width: 180 },
    { field: 'processingType', headerName: 'Processing Type', width: 220 },
    { field: 'quality', headerName: 'Quality', width: 130 },
    { field: 'preprocessing_notes', headerName: 'Preprocessing Notes', width: 200 },
  ];

  if (status === 'loading') return <p>Loading...</p>;

  if (!session?.user || !['admin', 'manager', 'preprocessing'].includes(session.user.role)) {
    return <Typography variant="h6">Access Denied. You do not have permission to view this page.</Typography>;
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>Processing Order Book</Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleRefreshData}
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{ mb: 2, mt: 2 }}
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
                getRowId={(row) => row.batchNumber}
                slots={{ toolbar: GridToolbar }}
                autosizeOnMount
                autosizeOptions={{ includeHeaders: true, includeOutliers: true, expand: true }}
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