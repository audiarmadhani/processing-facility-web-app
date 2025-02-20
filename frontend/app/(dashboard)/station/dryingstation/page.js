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

const DryingStation = () => {
  const { data: session, status } = useSession();
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [dryingData, setDryingData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDryingData = async () => {
    setIsLoading(true);
    try {
      const qcResponse = await fetch('https://processing-facility-backend.onrender.com/api/qc');
      if (!qcResponse.ok) throw new Error('Failed to fetch QC data');
      const qcResult = await qcResponse.json();
      const pendingPreprocessingData = qcResult.allRows || [];

      const dryingResponse = await fetch('https://processing-facility-backend.onrender.com/api/drying-data');
      if (!dryingResponse.ok) throw new Error('Failed to fetch drying data');
      const dryingDataRaw = await dryingResponse.json();

      const formattedData = pendingPreprocessingData.map(batch => {
        const batchDryingData = dryingDataRaw.filter(data => data.batchNumber === batch.batchNumber);
        const latestEntry = batchDryingData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        const status = latestEntry
          ? latestEntry.exited_at
            ? 'Dried'
            : 'In Drying'
          : 'Not in Drying';
        const dryingArea = latestEntry ? latestEntry.drying_area : 'N/A';

        return {
          ...batch,
          status,
          dryingArea,
          startProcessingDate: batch.startProcessingDate ? new Date(batch.startProcessingDate).toISOString().slice(0, 10) : 'N/A',
          lastProcessingDate: batch.lastProcessingDate ? new Date(batch.lastProcessingDate).toISOString().slice(0, 10) : 'N/A',
        };
      });

      setDryingData(formattedData);
    } catch (error) {
      console.error('Error fetching drying data:', error);
      setSnackbarMessage(error.message || 'Error fetching data. Please try again.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDryingData();
    const intervalId = setInterval(() => {
      fetchDryingData();
    }, 300000); // 5 minutes
    return () => clearInterval(intervalId);
  }, []);

  const handleRefreshData = () => {
    fetchDryingData();
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
          case 'In Drying':
            color = 'primary'; // Blue
            break;
          case 'Dried':
            color = 'success'; // Green
            break;
          case 'Not in Drying':
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
            sx={{ borderRadius: '16px', fontWeight: 'medium' }}
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

  const dryingAreas = [
    "Drying Area 1",
    "Drying Area 2",
    "Drying Area 3",
    "Drying Area 4",
    "Drying Area 5",
  ];

  const getAreaData = (area) => {
    return dryingData.filter(batch => batch.dryingArea === area);
  };

  const renderDataGrid = (area) => {
    const areaData = getAreaData(area);
    return (
      <>
        <Typography variant="h6" gutterBottom>{area}</Typography>
        <div style={{ height: 400, width: '100%' }}>
          {areaData.length === 0 ? (
            <Typography variant="body1" align="center" color="textSecondary" style={{ paddingTop: '180px' }}>
              No batches in {area}
            </Typography>
          ) : (
            <DataGrid
              rows={areaData}
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
          )}
        </div>
      </>
    );
  };

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'manager' && session.user.role !== 'drying')) {
    return (
      <Typography variant="h6">
        Access Denied. You do not have permission to view this page.
      </Typography>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Drying Station
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

            {/* Row 1: Drying Area 1 and 2 */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                {renderDataGrid('Drying Area 1')}
              </Grid>
              <Grid item xs={12} md={6}>
                {renderDataGrid('Drying Area 2')}
              </Grid>
            </Grid>

            {/* Row 2: Drying Area 3 and 4 */}
            <Grid container spacing={3} style={{ marginTop: '16px' }}>
              <Grid item xs={12} md={6}>
                {renderDataGrid('Drying Area 3')}
              </Grid>
              <Grid item xs={12} md={6}>
                {renderDataGrid('Drying Area 4')}
              </Grid>
            </Grid>

            {/* Row 3: Drying Area 5 */}
            <Grid container spacing={3} style={{ marginTop: '16px' }}>
              <Grid item xs={12} md={6}>
                {renderDataGrid('Drying Area 5')}
              </Grid>
            </Grid>
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

export default DryingStation;