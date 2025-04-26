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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Box,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';

const DryMillStation = () => {
  const { data: session, status } = useSession();
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [parentBatches, setParentBatches] = useState([]);
  const [subBatches, setSubBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [grades, setGrades] = useState([
    { grade: 'Specialty', weight: '', bagged_at: new Date().toISOString().split('T')[0] },
    { grade: 'G1', weight: '', bagged_at: new Date().toISOString().split('T')[0] },
    { grade: 'G2', weight: '', bagged_at: new Date().toISOString().split('T')[0] },
    { grade: 'G3', weight: '', bagged_at: new Date().toISOString().split('T')[0] },
    { grade: 'G4', weight: '', bagged_at: new Date().toISOString().split('T')[0] },
  ]);
  const [rfid, setRfid] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [openCompleteDialog, setOpenCompleteDialog] = useState(false);
  const [openStorageDialog, setOpenStorageDialog] = useState(false);

  const fetchDryMillData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://processing-facility-backend.onrender.com/api/dry-mill-data');
      if (!response.ok) throw new Error('Failed to fetch dry mill data');
      const data = await response.json();

      const formattedData = data.map(batch => ({
        batchNumber: batch.batchNumber,
        referenceNumber: batch.referenceNumber || 'N/A',
        status: batch.status,
        dryMillEntered: batch.dryMillEntered,
        dryMillExited: batch.dryMillExited,
        cherry_weight: batch.cherry_weight,
        producer: batch.producer,
        productLine: batch.productLine,
        processingType: batch.processingType,
        quality: batch.quality,
        totalBags: batch.totalBags,
        notes: batch.notes,
        type: batch.type,
        storeddatetrunc: batch.storeddatetrunc,
        isStored: batch.isStored,
        rfid: batch.rfid,
        green_bean_splits: batch.green_bean_splits,
        parentBatchNumber: batch.parentBatchNumber,
      }));

      const parentBatchesData = formattedData.filter(batch => !batch.parentBatchNumber && !batch.isStored);
      const subBatchesData = formattedData.filter(batch => batch.parentBatchNumber || batch.isStored);

      setParentBatches(parentBatchesData);
      setSubBatches(subBatchesData);
    } catch (error) {
      console.error('Error fetching dry mill data:', error);
      setSnackbarMessage(error.message || 'Error fetching data. Please try again.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanRfid = async () => {
    setIsScanning(true);
    try {
      const response = await fetch('https://processing-facility-backend.onrender.com/api/dry-mill/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfid, scanned_at: 'Dry Mill' }),
      });

      if (!response.ok) throw new Error('Failed to scan RFID');
      const data = await response.json();

      setRfid('');
      setSnackbarMessage(data.message);
      setSnackbarSeverity('success');
      setOpenSnackbar(true);

      fetchDryMillData();

      if (data.exited_at) {
        setOpenStorageDialog(true);
      }
    } catch (error) {
      console.error('Error scanning RFID:', error);
      setSnackbarMessage(error.message || 'Failed to scan RFID');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirmComplete = async () => {
    try {
      const response = await fetch(`https://processing-facility-backend.onrender.com/api/dry-mill/${selectedBatch.batchNumber}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to mark batch as processed');
      const data = await response.json();

      setSnackbarMessage(data.message);
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      setOpenCompleteDialog(false);
      fetchDryMillData();
    } catch (error) {
      console.error('Error marking batch as processed:', error);
      setSnackbarMessage(error.message || 'Failed to mark batch as processed');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  const handleConfirmStorage = async () => {
    try {
      const response = await fetch('https://processing-facility-backend.onrender.com/api/warehouse/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfid, scanned_at: 'Warehouse' }),
      });

      if (!response.ok) throw new Error('Failed to confirm storage');
      const data = await response.json();

      setSnackbarMessage(data.message);
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      setOpenStorageDialog(false);
      fetchDryMillData();
    } catch (error) {
      console.error('Error confirming storage:', error);
      setSnackbarMessage(error.message || 'Failed to confirm storage');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  const handleSortAndWeigh = async () => {
    const validGrades = grades.filter(g => g.weight && !isNaN(g.weight) && g.weight > 0 && g.bagged_at);
    if (validGrades.length === 0) {
      setSnackbarMessage('Please enter at least one valid weight and bagging date.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    try {
      const response = await fetch(`https://processing-facility-backend.onrender.com/api/dry-mill/${selectedBatch.batchNumber}/split`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grades: validGrades }),
      });
      if (!response.ok) throw new Error('Failed to save green bean splits');
      await fetchDryMillData();
      setGrades(grades.map(g => ({ ...g, weight: '', bagged_at: new Date().toISOString().split('T')[0] })));
      setSnackbarMessage('Green bean splits saved successfully');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
    } catch (error) {
      console.error('Error saving green bean splits:', error);
      setSnackbarMessage(error.message || 'Failed to save green bean splits');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  const handleReuseTag = async (batchNumber) => {
    try {
      const response = await fetch('https://processing-facility-backend.onrender.com/api/rfid/reuse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfid: '', batchNumber }),
      });

      if (!response.ok) throw new Error('Failed to reuse RFID tag');
      const data = await response.json();

      setSnackbarMessage(data.message);
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      fetchDryMillData();
    } catch (error) {
      console.error('Error reusing RFID tag:', error);
      setSnackbarMessage(error.message || 'Failed to reuse RFID tag');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  useEffect(() => {
    fetchDryMillData();
    const intervalId = setInterval(() => {
      fetchDryMillData();
    }, 300000);
    return () => clearInterval(intervalId);
  }, []);

  const handleRefreshData = () => {
    fetchDryMillData();
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleDetailsClick = (batch) => {
    setSelectedBatch(batch);
    setOpenDialog(true);
  };

  const handleCompleteClick = (batch) => {
    setSelectedBatch(batch);
    setOpenCompleteDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBatch(null);
    setGrades(grades.map(g => ({ ...g, weight: '', bagged_at: new Date().toISOString().split('T')[0] })));
  };

  const handleCloseCompleteDialog = () => {
    setOpenCompleteDialog(false);
    setSelectedBatch(null);
  };

  const handleCloseStorageDialog = () => {
    setOpenStorageDialog(false);
  };

  const parentColumns = [
    { field: 'batchNumber', headerName: 'Batch Number', width: 160 },
    { field: 'referenceNumber', headerName: 'Ref Number', width: 180 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => {
        const status = params.value;
        let color;
        switch (status) {
          case 'In Dry Mill':
            color = 'primary';
            break;
          case 'Processed':
            color = 'success';
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
    {
      field: 'rfidScan',
      headerName: 'RFID Scan',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <IconButton
          onClick={() => setRfid(params.row.rfid || '')}
          disabled={!params.row.rfid || params.row.isStored}
        >
          <QrCodeScannerIcon />
        </IconButton>
      ),
    },
    {
      field: 'complete',
      headerName: 'Complete',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Button
          variant="outlined"
          size="small"
          onClick={() => handleCompleteClick(params.row)}
          disabled={params.row.status === 'Processed'}
        >
          Mark Complete
        </Button>
      ),
    },
    {
      field: 'details',
      headerName: 'Details',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Button
          variant="outlined"
          size="small"
          onClick={() => handleDetailsClick(params.row)}
        >
          Details
        </Button>
      ),
    },
    { field: 'dryMillEntered', headerName: 'Dry Mill Entered', width: 150 },
    { field: 'dryMillExited', headerName: 'Dry Mill Exited', width: 150 },
    { field: 'cherry_weight', headerName: 'Cherry Weight', width: 120 },
    { field: 'producer', headerName: 'Producer', width: 90 },
    { field: 'productLine', headerName: 'Product Line', width: 130 },
    { field: 'processingType', headerName: 'Processing Type', width: 160 },
    { field: 'type', headerName: 'Type', width: 100, sortable: true },
    { field: 'notes', headerName: 'Notes', width: 150, sortable: true },
    {
      field: 'green_bean_splits',
      headerName: 'Green Bean Splits',
      width: 300,
      renderCell: (params) => (
        <Box>
          {params.value ? 
            params.value.split('; ').map((split, index) => (
              <Typography key={index} variant="body2" color="text.secondary">
                {split}
              </Typography>
            )) : 'N/A'}
        </Box>
      ),
    },
    { field: 'rfid', headerName: 'RFID', width: 120 },
  ];

  const subBatchColumns = [
    { field: 'batchNumber', headerName: 'Batch Number', width: 160 },
    { field: 'parentBatchNumber', headerName: 'Parent Batch', width: 160 },
    { field: 'referenceNumber', headerName: 'Ref Number', width: 180 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => {
        const status = params.value;
        let color;
        switch (status) {
          case 'In Dry Mill':
            color = 'primary';
            break;
          case 'Processed':
            color = 'success';
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
    {
      field: 'reuseTag',
      headerName: 'Reuse Tag',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Button
          variant="outlined"
          size="small"
          onClick={() => handleReuseTag(params.row.parentBatchNumber)}
          disabled={!params.row.isStored}
        >
          Reuse Tag
        </Button>
      ),
    },
    { field: 'dryMillEntered', headerName: 'Dry Mill Entered', width: 150 },
    { field: 'dryMillExited', headerName: 'Dry Mill Exited', width: 150 },
    { field: 'storeddatetrunc', headerName: 'Stored Date', width: 150, sortable: true },
    { field: 'cherry_weight', headerName: 'Weight', width: 120 },
    { field: 'producer', headerName: 'Producer', width: 90 },
    { field: 'productLine', headerName: 'Product Line', width: 130 },
    { field: 'processingType', headerName: 'Processing Type', width: 160 },
    { field: 'type', headerName: 'Type', width: 100, sortable: true },
    { field: 'quality', headerName: 'Quality', width: 100, sortable: true },
    { field: 'totalBags', headerName: 'Bags Qty', width: 100, sortable: true },
    { field: 'notes', headerName: 'Notes', width: 150, sortable: true },
    {
      field: 'isStored',
      headerName: 'Storage Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Stored' : 'Not Stored'}
          color={params.value ? 'success' : 'default'}
          size="small"
          sx={{ borderRadius: '16px', fontWeight: 'medium' }}
        />
      ),
    },
  ];

  const getParentBatches = () => {
    return parentBatches.sort((a, b) => {
      const statusOrder = {
        'In Dry Mill': 0,
        'Processed': 1,
      };
      const statusA = statusOrder[a.status] || 2;
      const statusB = statusOrder[b.status] || 2;
      if (statusA !== statusB) return statusA - statusB;

      if (a.dryMillEntered !== b.dryMillEntered) {
        return (a.dryMillEntered === 'N/A' ? Infinity : new Date(a.dryMillEntered)) - 
               (b.dryMillEntered === 'N/A' ? Infinity : new Date(b.dryMillEntered));
      }

      return 0;
    });
  };

  const getSubBatches = () => {
    return subBatches.sort((a, b) => {
      if (a.parentBatchNumber !== b.parentBatchNumber) {
        return a.parentBatchNumber.localeCompare(b.parentBatchNumber);
      }
      return a.batchNumber.localeCompare(b.batchNumber);
    });
  };

  const renderParentDataGrid = () => {
    const sortedData = getParentBatches();
    return (
      <div style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={sortedData}
          columns={parentColumns}
          pageSize={5}
          rowsPerPageOptions={[5, 10, 20]}
          disableSelectionOnClick
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
    );
  };

  const renderSubBatchDataGrid = () => {
    const sortedData = getSubBatches();
    return (
      <div style={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={sortedData}
          columns={subBatchColumns}
          pageSize={10}
          rowsPerPageOptions={[10, 20, 50]}
          disableSelectionOnClick
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
    );
  };

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'manager' && session.user.role !== 'drymill')) {
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
              Dry Mill Station - Active Batches
            </Typography>
            <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                label="Scan RFID"
                value={rfid}
                onChange={(e) => setRfid(e.target.value.trim().toUpperCase())}
                variant="outlined"
                size="small"
                sx={{ width: 300 }}
                disabled={isScanning}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleScanRfid}
                disabled={isScanning || !rfid}
                startIcon={isScanning ? <CircularProgress size={20} color="inherit" /> : <QrCodeScannerIcon />}
              >
                {isScanning ? 'Scanning...' : 'Scan RFID'}
              </Button>
            </Box>
            <Button
              variant="contained"
              color="primary"
              onClick={handleRefreshData}
              disabled={isLoading}
              sx={{ mb: 2 }}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isLoading ? 'Refreshing...' : 'Refresh Data'}
            </Button>
            {renderParentDataGrid()}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Green Bean Sub-Batches
            </Typography>
            {renderSubBatchDataGrid()}
          </CardContent>
        </Card>
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Sort, Weigh, and Bag - Batch {selectedBatch?.batchNumber}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Enter the weight and bagging date for each green bean grade after dry milling. Use preprocessing data as a guide: Producer: {selectedBatch?.producer}, Product Line: {selectedBatch?.productLine}, Processing Type: {selectedBatch?.processingType}, Type: {selectedBatch?.type}. Note: Green bean weight may be less than cherry weight due to processing losses.
          </Typography>
          <Grid container spacing={2} style={{ marginTop: '16px' }}>
            {grades.map((grade, index) => (
              <Grid item xs={12} key={grade.grade}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <TextField
                    label={`${grade.grade} Weight (kg)`}
                    value={grade.weight}
                    onChange={(e) => {
                      const newGrades = [...grades];
                      newGrades[index].weight = e.target.value;
                      setGrades(newGrades);
                    }}
                    type="number"
                    fullWidth
                    inputProps={{ min: 0, step: 0.1 }}
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    label="Bagged On"
                    type="date"
                    value={grade.bagged_at}
                    onChange={(e) => {
                      const newGrades = [...grades];
                      newGrades[index].bagged_at = e.target.value;
                      setGrades(newGrades);
                    }}
                    fullWidth
                    sx={{ mb: 1, width: 200 }}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSortAndWeigh}>Save Splits</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openCompleteDialog} onClose={handleCloseCompleteDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Mark Batch as Processed</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to mark Batch {selectedBatch?.batchNumber} as processed completely? All splits must be weighed and bagged.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCompleteDialog}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleConfirmComplete}>Mark Processed</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openStorageDialog} onClose={handleCloseStorageDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Storage</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to mark Batch {selectedBatch?.batchNumber} green beans as stored in the warehouse?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStorageDialog}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleConfirmStorage}>Confirm Storage</Button>
        </DialogActions>
      </Dialog>

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

export default DryMillStation;