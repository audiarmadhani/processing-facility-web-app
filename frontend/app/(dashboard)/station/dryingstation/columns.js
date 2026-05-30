'use client';

import { Button, Chip, FormControl, MenuItem, Select } from '@mui/material';

export function getDryingColumns({
  onDetailsClick,
  onMoveClick,
  onWeightClick,
  onFinishClick,
}) {
  return [
    { field: 'batchNumber', headerName: 'Batch Number', width: 150 },
    { field: 'farmerName', headerName: 'Farmer Name', width: 160 },
    { field: 'farmVarieties', headerName: 'Farm Varieties', width: 160 },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: ({ value }) => (
        <Chip
          label={value}
          color={value === 'In Drying' ? 'primary' : value === 'Dried' ? 'success' : 'default'}
          size="small"
          sx={{ borderRadius: '16px', fontWeight: 'medium' }}
        />
      ),
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 110,
      renderCell: ({ value }) => {
        if (value == null) return '—';
        const chipColor =
          value === 'High' ? 'error' : value === 'Medium' ? 'warning' : 'default';
        return (
          <Chip
            label={value}
            color={chipColor}
            size="small"
            variant={value === 'Low' ? 'outlined' : 'filled'}
          />
        );
      },
    },
    {
      field: 'currentMoisture',
      headerName: 'Current Moisture (%)',
      width: 160,
      renderCell: ({ value }) =>
        value != null && value !== '' ? `${parseFloat(value).toFixed(1)}%` : '—',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      sortable: false,
      renderCell: ({ row }) => (
        <FormControl size="small" fullWidth>
          <Select
            displayEmpty
            defaultValue=""
            onChange={(e) => {
              const action = e.target.value;

              if (action === 'details') onDetailsClick(row);
              if (action === 'move') onMoveClick(row);
              if (action === 'weight') onWeightClick(row);
              if (action === 'finish') onFinishClick(row);

              e.target.value = '';
            }}
          >
            <MenuItem value="">Actions</MenuItem>
            <MenuItem value="details">Details</MenuItem>
            <MenuItem value="move" disabled={row.status !== 'In Drying'}>
              Move
            </MenuItem>
            <MenuItem value="weight">Track Weight</MenuItem>
            <MenuItem value="finish" disabled={row.status !== 'In Drying'}>
              Finish Drying
            </MenuItem>
          </Select>
        </FormControl>
      ),
    },
    { field: 'startDryingDate', headerName: 'Start Drying Date', width: 150 },
    { field: 'endDryingDate', headerName: 'End Drying Date', width: 150 },
    { field: 'wetmillWeight', headerName: 'Wetmill Weight (kg)', width: 160 },
    { field: 'weight', headerName: 'Dry Weight (kg)', width: 140 },
    { field: 'type', headerName: 'Type', width: 90 },
    { field: 'producer', headerName: 'Producer', width: 90 },
    { field: 'productLine', headerName: 'Product Line', width: 150 },
    { field: 'processingType', headerName: 'Processing Type', width: 200 },
    { field: 'quality', headerName: 'Quality', width: 160 },
  ];
}

export function getEnvColumns() {
  return [
    { field: 'recorded_at', headerName: 'Date (WITA)', width: 180 },
    { field: 'temperature', headerName: 'Temperature (°C)', width: 150 },
    { field: 'humidity', headerName: 'Humidity (%)', width: 150 },
  ];
}

export function getPendingDryingColumns(onAssignClick) {
  return [
    { field: 'batchNumber', headerName: 'Batch', width: 150 },
    { field: 'farmerName', headerName: 'Farmer', width: 250 },
    { field: 'processingType', headerName: 'Process', width: 180 },
    { field: 'type', headerName: 'Type', width: 100 },
    {
      field: 'action',
      headerName: 'Assign',
      width: 150,
      renderCell: ({ row }) => (
        <Button variant="contained" size="small" onClick={() => onAssignClick(row)}>
          Assign
        </Button>
      ),
    },
  ];
}
