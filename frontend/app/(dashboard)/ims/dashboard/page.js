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
  Menu,
  MenuItem,
  Box,
  Button,
  Modal,
  Paper,
  IconButton,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import CloseIcon from '@mui/icons-material/Close';
import MoreVertIcon from '@mui/icons-material/MoreVert';

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
  const [anchorEl, setAnchorEl] = useState(null);
  const [actionBatch, setActionBatch] = useState(null);
  const openMenu = Boolean(anchorEl);
  const [submenuAnchor, setSubmenuAnchor] = useState(null);
  const [movementHistory, setMovementHistory] = useState([]);

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
              location: row.location || 'Bali',
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

  const handleOpenDetailsModal = async (batchNumber) => {
    try {
      setSelectedBatch(batchNumber);

      // Fetch movement history
      const movementRes = await fetch(
        `${API_BASE_URL}/api/inventory/greenbeans/movements/${batchNumber}`
      );

      if (!movementRes.ok) {
        throw new Error('Failed to fetch movement history');
      }

      const movementData = await movementRes.json();
      setMovementHistory(movementData || []);

      setOpenDetailsModal(true);

    } catch (error) {
      console.error('Error opening details modal:', error);

      setSnackbarMessage('Failed to load transfer history');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);

      setMovementHistory([]);
    }
  };

  const handleCloseDetailsModal = () => {
    setOpenDetailsModal(false);
    setSelectedBatch(null);
  };

  const handleOpenMenu = (event, batchNumber) => {
    setAnchorEl(event.currentTarget);
    setActionBatch(batchNumber);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setActionBatch(null);
  };

  const handleMove = async (newLocation) => {
    try {
      await fetch(`${API_BASE_URL}/api/inventory/greenbeans/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchNumber: actionBatch,
          newLocation,
          createdBy: 'system',
          updatedBy: 'system'
        })
      });

      fetchGreenBeanData();

      setSnackbarMessage('Batch moved successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

    } catch (err) {
      setSnackbarMessage('Failed to move batch');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }

    setSubmenuAnchor(null);
    handleCloseMenu();
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
    { field: 'batchNumber', headerName: 'Batch Number', width: 190, sortable: true },
    { field: 'parentBatchNumber', headerName: 'Cherry Batch', width: 160, sortable: true },
    { field: 'type', headerName: 'Type', width: 110, sortable: true },
    { field: 'quality', headerName: 'Quality', width: 100, sortable: true },
    { field: 'weight', headerName: 'Total Weight (kg)', width: 140, sortable: true },
    { field: 'totalBags', headerName: 'Total Bags', width: 100, sortable: true },
    { field: 'storedDateTrunc', headerName: 'Latest Stored Date', width: 160, sortable: true },
    { field: 'processingType', headerName: 'Processing Type', width: 150, sortable: true },
    { field: 'location', headerName: 'Location', width: 180, sortable: true },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <>
          <IconButton
            size="small"
            onClick={(event) => handleOpenMenu(event, params.row.batchNumber)}
          >
            <MoreVertIcon />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={openMenu && actionBatch === params.row.batchNumber}
            onClose={handleCloseMenu}
          >
            <MenuItem onClick={() => {
              handleOpenDetailsModal(actionBatch);
              handleCloseMenu();
            }}>
              Details
            </MenuItem>

            <MenuItem
              onClick={(e) => setSubmenuAnchor(e.currentTarget)}
            >
              Move
            </MenuItem>
          </Menu>

          <Menu
            anchorEl={submenuAnchor}
            open={Boolean(submenuAnchor)}
            onClose={() => setSubmenuAnchor(null)}
          >
            <MenuItem onClick={() => handleMove('Jakarta')}>
              Jakarta
            </MenuItem>
            <MenuItem onClick={() => handleMove('Surabaya')}>
              Surabaya
            </MenuItem>
            <MenuItem onClick={() => handleMove('Bali')}>
              Bali
            </MenuItem>
          </Menu>
        </>
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
      <Grid item xs={12} md={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Cherry Inventory
            </Typography>
            {/* <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
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
            </Box> */}
            <div style={{ height: 600, width: '100%' }}>
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
      <Grid item xs={12} md={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Green Bean Inventory
            </Typography>
            {/* <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
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
            </Box> */}
            <div style={{ height: 600, width: '100%' }}>
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
            <Typography variant="h6" sx={{ mt: 3 }}>
              Warehouse Transfer History
            </Typography>

            {movementHistory.length === 0 ? (
              <Typography>No transfer history</Typography>
            ) : (
              movementHistory.map((move, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    {move.fromLocation} → {move.toLocation}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(move.movedAt).toLocaleString()} | {move.createdBy}
                  </Typography>
                </Box>
              ))
            )}
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