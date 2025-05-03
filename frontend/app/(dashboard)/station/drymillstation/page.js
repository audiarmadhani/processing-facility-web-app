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
  Box,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';

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
  const [grades, setGrades] = useState([]);
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
        status: batch.status,
        dryMillEntered: batch.dryMillEntered,
        dryMillExited: batch.dryMillExited,
        cherry_weight: batch.cherry_weight || 'N/A',
        producer: batch.producer || 'N/A',
        productLine: batch.productLine || 'N/A',
        processingType: batch.processingType || 'N/A',
        quality: batch.quality || 'N/A',
        totalBags: batch.totalBags || 'N/A',
        notes: batch.notes || 'N/A',
        type: batch.type || 'N/A',
        storeddatetrunc: batch.storeddatetrunc || 'N/A',
        isStored: batch.isStored || false,
        green_bean_splits: batch.green_bean_splits || 'N/A',
        parentBatchNumber: batch.parentBatchNumber || null,
        weight: batch.weight || 'N/A',
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

  const fetchExistingGrades = async (batchNumber) => {
    try {
      const response = await fetch(`https://processing-facility-backend.onrender.com/api/dry-mill-grades/${batchNumber}`);
      if (!response.ok) throw new Error('Failed to fetch existing grades');
      const data = await response.json();
      return data.map(grade => ({
        grade: grade.grade,
        weight: grade.weight || '',
        bagged_at: grade.bagged_at || new Date().toISOString().split('T')[0],
      }));
    } catch (error) {
      console.error('Error fetching existing grades:', error);
      setSnackbarMessage('Failed to fetch existing grades.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return [
        { grade: 'Specialty Grade', weight: '', bagged_at: new Date().toISOString().split('T')[0] },
        { grade: 'Grade 1', weight: '', bagged_at: new Date().toISOString().split('T')[0] },
        { grade: 'Grade 2', weight: '', bagged_at: new Date().toISOString().split('T')[0] },
        { grade: 'Grade 3', weight: '', bagged_at: new Date().toISOString().split('T')[0] },
        { grade: 'Grade 4', weight: '', bagged_at: new Date().toISOString().split('T')[0] },
      ];
    }
  };

  const fetchLatestRfid = async () => {
    try {
      const response = await fetch('https://processing-facility-backend.onrender.com/api/get-rfid');
      if (!response.ok) throw new Error('Failed to fetch latest RFID');
      const data = await response.json();
      setRfid(data.rfid || '');
    } catch (error) {
      console.error('Error fetching latest RFID:', error);
      setSnackbarMessage('Failed to fetch latest RFID.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  const handleScanRfid = async () => {
    if (!rfid) {
      setSnackbarMessage('Please enter or fetch an RFID value.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }
    setIsScanning(true);
    try {
      const response = await fetch('https://processing-facility-backend.onrender.com/api/scan-rfid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfid, scanned_at: 'Dry_Mill' }),
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
    if (!selectedBatch) return;
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
      setOpenDialog(false);
      fetchDryMillData();
    } catch (error) {
      console.error('Error marking batch as processed:', error);
      setSnackbarMessage(error.message || 'Failed to mark batch as processed');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  const handleConfirmStorage = async () => {
    if (!rfid) {
      setSnackbarMessage('Please enter an RFID value.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }
    try {
      const response = await fetch('https://processing-facility-backend.onrender.com/api/warehouse/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfid, scanned_at: 'Warehouse' }),
      });

      if (!response.ok) throw new Error('Failed to confirm storage');
      const data = await response.json();

      setRfid('');
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
    const validGrades = grades.filter(g => g.weight === '' || (!isNaN(g.weight) && g.weight > 0) && (g.bagged_at === '' || g.bagged_at));
    if (validGrades.length !== grades.length) {
      setSnackbarMessage('Invalid weight or bagging date for some grades.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    if (!selectedBatch) return;
    try {
      const response = await fetch(`https://processing-facility-backend.onrender.com/api/dry-mill/${selectedBatch.batchNumber}/split`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grades: grades.map(g => ({ grade: g.grade, weight: g.weight || null, bagged_at: g.bagged_at || null })) }),
      });
      if (!response.ok) throw new Error('Failed to save green bean splits');
      const data = await response.json();

      setSnackbarMessage(data.message);
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      setOpenDialog(false);
      fetchDryMillData();
    } catch (error) {
      console.error('Error saving green bean splits:', error);
      setSnackbarMessage(error.message || 'Failed to save green bean splits');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  const handleReuseTag = async (batchNumber) => {
    const parentBatch = parentBatches.find(b => b.batchNumber === batchNumber);
    if (!parentBatch || !parentBatch.rfid) return;

    try {
      const response = await fetch('https://processing-facility-backend.onrender.com/api/rfid/reuse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchNumber }),
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
    fetchLatestRfid();
    const intervalId = setInterval(() => {
      fetchDryMillData();
      fetchLatestRfid();
    }, 300000);
    return () => clearInterval(intervalId);
  }, []);

  const handleRefreshData = () => {
    fetchDryMillData();
    fetchLatestRfid();
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleDetailsClick = async (batch) => {
    setSelectedBatch(batch);
    const existingGrades = await fetchExistingGrades(batch.batchNumber);
    setGrades(existingGrades);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBatch(null);
  };

  const handleCloseCompleteDialog = () => {
    setOpenCompleteDialog(false);
    setSelectedBatch(null);
  };

  const handleCloseStorageDialog = () => {
    setOpenStorageDialog(false);
    setRfid('');
  };

  const parentColumns = [
    { field: 'batchNumber', headerName: 'Batch Number', width: 160 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'In Dry Mill' ? 'primary' : params.value === 'Processed' ? 'success' : 'default'}
          size="small"
          sx={{ borderRadius: '16px', fontWeight: 'medium' }}
        />
      ),
    },
    {
      field: 'complete',
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
    { field: 'cherry_weight', headerName: 'Cherry Weight (kg)', width: 140 },
    { field: 'producer', headerName: 'Producer', width: 120 },
    { field: 'productLine', headerName: 'Product Line', width: 160 },
    { field: 'processingType', headerName: 'Processing Type', width: 180 },
    { field: 'type', headerName: 'Type', width: 120 },
    { field: 'totalBags', headerName: 'Total Bags', width: 120 },
    { field: 'notes', headerName: 'Notes', width: 180 },
    {
      field: 'green_bean_splits',
      headerName: 'Green Bean Splits',
      width: 300,
      renderCell: (params) => (
        <Box>
          {params.value !== 'N/A' ? params.value.split('; ').map((split, index) => (
            <Typography key={index} variant="body2" color="text.secondary">
              {split}
            </Typography>
          )) : 'N/A'}
        </Box>
      ),
    },
  ];

  const subBatchColumns = [
    { field: 'batchNumber', headerName: 'Batch Number', width: 160 },
    { field: 'parentBatchNumber', headerName: 'Parent Batch', width: 160 },
    { field: 'referenceNumber', headerName: 'Ref Number', width: 180 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'In Dry Mill' ? 'primary' : params.value === 'Processed' ? 'success' : 'default'}
          size="small"
          sx={{ borderRadius: '16px', fontWeight: 'medium' }}
        />
      ),
    },
    { field: 'dryMillEntered', headerName: 'Dry Mill Entered', width: 150 },
    { field: 'dryMillExited', headerName: 'Dry Mill Exited', width: 150 },
    { field: 'storeddatetrunc', headerName: 'Stored Date', width: 150 },
    { field: 'weight', headerName: 'Weight (kg)', width: 140 },
    { field: 'producer', headerName: 'Producer', width: 120 },
    { field: 'productLine', headerName: 'Product Line', width: 160 },
    { field: 'processingType', headerName: 'Processing Type', width: 180 },
    { field: 'type', headerName: 'Type', width: 120 },
    { field: 'quality', headerName: 'Quality', width: 120 },
    { field: 'totalBags', headerName: 'Bags Qty', width: 120 },
    { field: 'notes', headerName: 'Notes', width: 180 },
    {
      field: 'isStored',
      headerName: 'Storage Status',
      width: 140,
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
    return [...parentBatches].sort((a, b) => {
      const statusOrder = { 'In Dry Mill': 0, 'Processed': 1, 'Not Started': 2 };
      return (statusOrder[a.status] || 2) - (statusOrder[b.status] || 2) || 
             (a.dryMillEntered === 'N/A' ? Infinity : new Date(a.dryMillEntered)) - 
             (b.dryMillEntered === 'N/A' ? Infinity : new Date(b.dryMillEntered));
    });
  };

  const getSubBatches = () => {
    return [...subBatches].sort((a, b) => 
      a.parentBatchNumber?.localeCompare(b.parentBatchNumber) || a.batchNumber.localeCompare(b.batchNumber)
    );
  };

  const renderParentDataGrid = () => {
    const sortedData = getParentBatches();
    return (
      <DataGrid
        rows={sortedData}
        columns={parentColumns}
        initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
        pageSizeOptions={[5, 10, 20]}
        disableRowSelectionOnClick
        getRowId={(row) => row.batchNumber}
        slots={{ toolbar: GridToolbar }}
        autosizeOnMount
        autosizeOptions={{ includeHeaders: true, includeOutliers: true, expand: true }}
        rowHeight={35}
        sx={{ height: 400, width: '100%' }}
      />
    );
  };

  const renderSubBatchDataGrid = () => {
    const sortedData = getSubBatches();
    return (
      <DataGrid
        rows={sortedData}
        columns={subBatchColumns}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        pageSizeOptions={[10, 20, 50]}
        disableRowSelectionOnClick
        getRowId={(row) => row.batchNumber}
        slots={{ toolbar: GridToolbar }}
        autosizeOnMount
        autosizeOptions={{ includeHeaders: true, includeOutliers: true, expand: true }}
        rowHeight={35}
        sx={{ height: 600, width: '100%' }}
      />
    );
  };

  if (status === 'loading') return <Typography>Loading...</Typography>;

  if (!session?.user || !['admin', 'manager', 'drymill'].includes(session.user.role)) {
    return <Typography variant="h6">Access Denied. You do not have permission to view this page.</Typography>;
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Dry Mill Station - Active Batches
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleRefreshData}
              disabled={isLoading}
              sx={{ mb: 2, ml: 0 }}
              startIcon={isLoading ? <CircularProgress size={20} /> : null}
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

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Sort, Weigh, and Bag - Batch {selectedBatch?.batchNumber}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Enter the weight and bagging date for each green bean grade. Preprocessing details: Producer: {selectedBatch?.producer}, Product Line: {selectedBatch?.productLine}, Processing Type: {selectedBatch?.processingType}, Type: {selectedBatch?.type}, Cherry Weight: {selectedBatch?.cherry_weight} kg. Note: Green bean weight may be less due to processing losses.
          </Typography>
          <Grid container spacing={2} sx={{ mt: 2 }}>
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
                    variant="outlined"
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
                    variant="outlined"
                    sx={{ width: 200 }}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSortAndWeigh} disabled={!selectedBatch}>
            Save Splits
          </Button>
          <Button variant="contained" color="secondary" onClick={handleConfirmComplete} disabled={!selectedBatch}>
            Mark Complete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openCompleteDialog} onClose={handleCloseCompleteDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Mark as Processed</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Confirm marking Batch {selectedBatch?.batchNumber} as processed. All splits must be weighed and bagged.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCompleteDialog}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleConfirmComplete} disabled={!selectedBatch}>
            Mark Processed
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openStorageDialog} onClose={handleCloseStorageDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Storage</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Confirm storage for Batch {selectedBatch?.batchNumber} green beans. Enter RFID to proceed.
          </Typography>
          <TextField
            label="RFID"
            value={rfid}
            onChange={(e) => setRfid(e.target.value.trim().toUpperCase())}
            variant="outlined"
            size="small"
            fullWidth
            sx={{ mb: 2 }}
            disabled={isScanning}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStorageDialog}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleConfirmStorage} disabled={isScanning || !rfid}>
            Confirm Storage
          </Button>
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