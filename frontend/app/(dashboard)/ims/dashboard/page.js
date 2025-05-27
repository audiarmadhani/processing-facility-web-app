"use client";

import React, { useState, useEffect } from 'react';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Button,
  Modal,
  Paper,
  IconButton,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import CloseIcon from '@mui/icons-material/Close';

const API_BASE_URL = 'https://processing-facility-backend.onrender.com';

function InventoryManagement() {
  const [cherryData, setCherryData] = useState([]);
  const [greenBeanData, setGreenBeanData] = useState([]); // Raw data for details modal
  const [aggregatedGreenBeanData, setAggregatedGreenBeanData] = useState([]); // Aggregated data for table
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('error');
  const [cherryFilterType, setCherryFilterType] = useState('');
  const [cherryFilterStatus, setCherryFilterStatus] = useState('');
  const [greenBeanFilterType, setGreenBeanFilterType] = useState('');
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

  useEffect(() => {
    fetchCherryData();
    fetchGreenBeanData();
  }, []);

  const fetchCherryData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/inventory/cherries`);
      if (!response.ok) throw new Error('Failed to fetch cherry data');
      const data = await response.json();
      setCherryData(data.map((row, index) => ({ ...row, id: index })));
    } catch (error) {
      console.error('Error fetching cherry data:', error);
      setSnackbarMessage('Failed to load cherry inventory.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setCherryData([]);
    }
  };

  const fetchGreenBeanData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/inventory/green-beans`);
      if (!response.ok) throw new Error('Failed to fetch green bean data');
      const data = await response.json();
      const mappedData = data.map((row, index) => ({
        ...row,
        id: index,
        type: row.type || row.beanType || 'Unknown', // Handle potential type field mismatch
      }));
      setGreenBeanData(mappedData);
      // Aggregate data by batchNumber
      const aggregated = Object.values(
        mappedData.reduce((acc, row) => {
          const key = row.batchNumber;
          if (!acc[key]) {
            acc[key] = {
              id: key, // Use batchNumber as ID for DataGrid
              batchNumber: row.batchNumber,
              parentBatchNumber: row.parentBatchNumber,
              type: row.type,
              quality: row.quality,
              weight: 0,
              totalBags: 0,
              storedDateTrunc: row.storedDateTrunc, // Use latest stored date
              processingType: row.processingType,
            };
          }
          acc[key].weight += parseFloat(row.weight || 0);
          acc[key].totalBags += parseInt(row.totalBags || 0, 10);
          // Update storedDateTrunc if newer
          if (
            row.storedDateTrunc &&
            (!acc[key].storedDateTrunc || new Date(row.storedDateTrunc) > new Date(acc[key].storedDateTrunc))
          ) {
            acc[key].storedDateTrunc = row.storedDateTrunc;
          }
          return acc;
        }, {})
      );
      setAggregatedGreenBeanData(aggregated);
    } catch (error) {
      console.error('Error fetching green bean data:', error);
      setSnackbarMessage('Failed to load green bean inventory.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setGreenBeanData([]);
      setAggregatedGreenBeanData([]);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleOpenDetailsModal = (batchNumber) => {
    setSelectedBatch(batchNumber);
    setOpenDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setOpenDetailsModal(false);
    setSelectedBatch(null);
  };

  const cherryColumns = [
    { field: 'batchNumber', headerName: 'Batch Number', width: 160, sortable: true },
    { field: 'farmerName', headerName: 'Farmer Name', width: 180, sortable: true },
    { field: 'type', headerName: 'Type', width: 110, sortable: true },
    { field: 'status', headerName: 'Status', width: 150, sortable: true },
    { field: 'weight', headerName: 'Weight (kg)', width: 120, sortable: true },
    { field: 'totalBags', headerName: 'Total Bags', width: 100, sortable: true },
    { field: 'receivingDateTrunc', headerName: 'Received Date', width: 160, sortable: true },
    { field: 'rfid', headerName: 'RFID', width: 120, sortable: true },
    { field: 'notes', headerName: 'Notes', width: 250, sortable: true },
  ];

  const greenBeanColumns = [
    { field: 'batchNumber', headerName: 'Batch Number', width: 160, sortable: true },
    { field: 'parentBatchNumber', headerName: 'Cherry Batch', width: 160, sortable: true },
    { field: 'type', headerName: 'Type', width: 110, sortable: true },
    { field: 'quality', headerName: 'Quality', width: 100, sortable: true },
    { field: 'weight', headerName: 'Total Weight (kg)', width: 140, sortable: true },
    { field: 'totalBags', headerName: 'Total Bags', width: 100, sortable: true },
    { field: 'storedDateTrunc', headerName: 'Latest Stored Date', width: 160, sortable: true },
    { field: 'processingType', headerName: 'Processing Type', width: 150, sortable: true },
    {
      field: 'details',
      headerName: 'Details',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Button
          variant="outlined"
          size="small"
          onClick={() => handleOpenDetailsModal(params.row.batchNumber)}
        >
          Details
        </Button>
      ),
    },
  ];

  const detailColumns = [
    { field: 'storedDateTrunc', headerName: 'Stored Date', width: 160, sortable: true },
    { field: 'weight', headerName: 'Weight (kg)', width: 120, sortable: true },
    { field: 'totalBags', headerName: 'Total Bags', width: 100, sortable: true },
    { field: 'parentBatchNumber', headerName: 'Cherry Batch', width: 160, sortable: true },
    { field: 'quality', headerName: 'Quality', width: 100, sortable: true },
    { field: 'processingType', headerName: 'Processing Type', width: 150, sortable: true },
    { field: 'type', headerName: 'Type', width: 110, sortable: true },
  ];

  const filteredCherryData = cherryData.filter(
    (row) =>
      (!cherryFilterType || row.type === cherryFilterType) &&
      (!cherryFilterStatus || row.status === cherryFilterStatus)
  );

  const filteredGreenBeanData = aggregatedGreenBeanData.filter(
    (row) => !greenBeanFilterType || row.type === greenBeanFilterType
  );

  const batchDetails = greenBeanData
    .filter((row) => row.batchNumber === selectedBatch)
    .map((row, index) => ({ ...row, id: index }));

  return (
    <Grid container spacing={3}>
      {/* Cherry Inventory */}
      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Cherry Inventory
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={cherryFilterType}
                  onChange={(e) => setCherryFilterType(e.target.value)}
                  label="Type"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Arabica">Arabica</MenuItem>
                  <MenuItem value="Robusta">Robusta</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={cherryFilterStatus}
                  onChange={(e) => setCherryFilterStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Stored">Stored</MenuItem>
                  <MenuItem value="In Dry Mill">In Dry Mill</MenuItem>
                  <MenuItem value="Drying">Drying</MenuItem>
                  <MenuItem value="Processed">Processed</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <div style={{ height: 400, width: '100%' }}>
              <DataGrid
                rows={filteredCherryData}
                columns={cherryColumns}
                pageSize={5}
                rowsPerPageOptions={[5, 10, 20]}
                disableSelectionOnClick
                sortingOrder={['asc', 'desc']}
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

      {/* Green Bean Inventory */}
      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Green Bean Inventory
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={greenBeanFilterType}
                  onChange={(e) => setGreenBeanFilterType(e.target.value)}
                  label="Type"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Arabica">Arabica</MenuItem>
                  <MenuItem value="Robusta">Robusta</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <div style={{ height: 400, width: '100%' }}>
              <DataGrid
                rows={filteredGreenBeanData}
                columns={greenBeanColumns}
                pageSize={5}
                rowsPerPageOptions={[5, 10, 20]}
                disableSelectionOnClick
                sortingOrder={['asc', 'desc']}
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

      {/* Batch Details Modal */}
      <Modal open={openDetailsModal} onClose={handleCloseDetailsModal}>
        <Paper
          sx={{
            p: 3,
            maxWidth: 800,
            maxHeight: '80vh',
            overflowY: 'auto',
            mx: 'auto',
            mt: '5vh',
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Batch Details: {selectedBatch}
            </Typography>
            <IconButton onClick={handleCloseDetailsModal}>
              <CloseIcon />
            </IconButton>
          </Box>
          <div style={{ height: 300, width: '100%' }}>
            <DataGrid
              rows={batchDetails}
              columns={detailColumns}
              pageSize={5}
              rowsPerPageOptions={[5, 10, 20]}
              disableSelectionOnClick
              sortingOrder={['asc', 'desc']}
              autosizeOnMount
              autosizeOptions={{
                includeHeaders: true,
                includeOutliers: true,
                expand: true,
              }}
              rowHeight={35}
            />
          </div>
        </Paper>
      </Modal>

      {/* Snackbar */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Grid>
  );
}

export default InventoryManagement;