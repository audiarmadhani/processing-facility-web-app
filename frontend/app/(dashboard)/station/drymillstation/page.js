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
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';

const DryMillStation = () => {
  const { data: session, status } = useSession();
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [dryMillData, setDryMillData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [grades, setGrades] = useState([
    { grade: 'Grade 1', weight: '' },
    { grade: 'Grade 2', weight: '' },
    { grade: 'Grade 3', weight: '' },
    { grade: 'Grade 4', weight: '' },
  ]);

  const fetchDryMillData = async () => {
    setIsLoading(true);
    try {
      const qcResponse = await fetch('https://processing-facility-backend.onrender.com/api/qc');
      if (!qcResponse.ok) throw new Error('Failed to fetch QC data');
      const qcResult = await qcResponse.json();
      const qcData = qcResult.allRows || [];
  
      const dryMillResponse = await fetch('https://processing-facility-backend.onrender.com/api/dry-mill-data');
      if (!dryMillResponse.ok) throw new Error('Failed to fetch dry mill data');
      const dryMillDataRaw = await dryMillResponse.json();
  
      // Filter qcData to only include batches that have entered the dry mill
      const formattedData = qcData
        .filter(batch => dryMillDataRaw.some(data => data.batchNumber === batch.batchNumber && data.entered_at))
        .map(batch => {
          const batchDryMillData = dryMillDataRaw.filter(data => data.batchNumber === batch.batchNumber);
          const latestEntry = batchDryMillData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
          const status = latestEntry.exited_at ? 'Processed' : 'In Dry Mill';
  
          const subBatches = batchDryMillData
            .filter(data => data.subBatchId)
            .map(data => ({
              subBatchId: data.subBatchId,
              grade: data.grade,
              weight: data.weight,
              sortedAt: data.sorted_at,
            }));
  
          return {
            ...batch,
            status,
            enteredAt: latestEntry?.entered_at ? new Date(latestEntry.entered_at).toISOString().slice(0, 10) : 'N/A',
            exitedAt: latestEntry?.exited_at ? new Date(latestEntry.exited_at).toISOString().slice(0, 10) : 'N/A',
            subBatches: subBatches.length > 0 ? subBatches : null,
          };
        });
  
      setDryMillData(formattedData);
    } catch (error) {
      console.error('Error fetching dry mill data:', error);
      setSnackbarMessage(error.message || 'Error fetching data. Please try again.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSortAndWeigh = async () => {
    const validGrades = grades.filter(g => g.weight && !isNaN(g.weight) && g.weight > 0);
    if (validGrades.length === 0) {
      setSnackbarMessage('Please enter at least one valid weight.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    try {
      const response = await fetch('https://processing-facility-backend.onrender.com/api/dry-mill-grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchNumber: selectedBatch.batchNumber, grades: validGrades }),
      });
      if (!response.ok) throw new Error('Failed to save dry mill grades');
      await fetchDryMillData(); // Refresh data
      setGrades(grades.map(g => ({ ...g, weight: '' }))); // Reset form
      setSnackbarMessage('Grades saved successfully');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
    } catch (error) {
      console.error('Error saving dry mill grades:', error);
      setSnackbarMessage(error.message || 'Failed to save grades');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  useEffect(() => {
    fetchDryMillData();
    const intervalId = setInterval(() => {
      fetchDryMillData();
    }, 300000); // 5 minutes
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

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBatch(null);
    setGrades(grades.map(g => ({ ...g, weight: '' }))); // Reset form
  };

  const columns = [
    { field: 'batchNumber', headerName: 'Batch Number', width: 160 },
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
          case 'Not in Dry Mill':
            color = 'default';
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
    { field: 'enteredAt', headerName: 'Entered At', width: 150 },
    { field: 'exitedAt', headerName: 'Exited At', width: 150 },
    { field: 'weight', headerName: 'Total Weight', width: 100 },
    { field: 'type', headerName: 'Type', width: 90 },
    { field: 'producer', headerName: 'Producer', width: 90 },
    { field: 'productLine', headerName: 'Product Line', width: 130 },
    { field: 'processingType', headerName: 'Processing Type', width: 160 },
    { field: 'quality', headerName: 'Target Quality', width: 130 },
  ];

  const getDryMillData = () => {
    return dryMillData.sort((a, b) => {
      // Sort by type: Arabica (0), Robusta (1), others (2+)
      const typeOrder = {
        'Arabica': 0,
        'Robusta': 1,
      };
      const typeA = typeOrder[a.type] !== undefined ? typeOrder[a.type] : 2 + (a.type || '').localeCompare('');
      const typeB = typeOrder[b.type] !== undefined ? typeOrder[b.type] : 2 + (b.type || '').localeCompare('');
      if (typeA !== typeB) return typeA - typeB;
  
      // Sort by status: In Dry Mill (0), Not in Dry Mill (1), Processed (2)
      const statusOrder = {
        'In Dry Mill': 0,
        'Not in Dry Mill': 1,
        'Processed': 2,
      };
      const statusA = statusOrder[a.status] || 3;
      const statusB = statusOrder[b.status] || 3;
      if (statusA !== statusB) return statusA - statusB;
  
      // Sort by enteredAt (oldest first, ascending)
      if (a.enteredAt !== b.enteredAt) {
        return a.enteredAt.localeCompare(b.enteredAt);
      }
  
      return 0; // If all criteria are equal, maintain original order
    });
  };

  const renderDataGrid = () => {
    const sortedData = getDryMillData();
    return (
      <div style={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={sortedData}
          columns={columns}
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
              Dry Mill Station
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
            {renderDataGrid()}
          </CardContent>
        </Card>
      </Grid>

      {/* Sort and Weigh Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Sort and Weigh - Batch {selectedBatch?.batchNumber}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} style={{ marginTop: '16px' }}>
            {grades.map((grade, index) => (
              <Grid item xs={12} key={grade.grade}>
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
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSortAndWeigh}>Save Grades</Button>
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