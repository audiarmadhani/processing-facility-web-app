'use client';

import { Button, Chip } from '@mui/material';

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
};

const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d.getTime()) ? String(value) : d.toLocaleString();
};

const sharedBatchColumns = [
  { field: 'batchNumber', headerName: 'Batch', width: 150 },
  { field: 'processingType', headerName: 'Processing Type', width: 160 },
  { field: 'farmerName', headerName: 'Farmer', width: 140 },
  { field: 'lotNumber', headerName: 'Lot', width: 160 },
  { field: 'referenceNumber', headerName: 'Ref', width: 150 },
  { field: 'producer', headerName: 'Producer', width: 110 },
];

export function getDryingColumns() {
  return [
    ...sharedBatchColumns,
    { field: 'dryingArea', headerName: 'Drying area', width: 140 },
    {
      field: 'dryingEnteredAt',
      headerName: 'Entered',
      width: 150,
      valueFormatter: (value) => formatDateTime(value),
    },
    { field: 'dryingWeight', headerName: 'Weight (kg)', width: 120 },
    { field: 'latestMoisture', headerName: 'Moisture %', width: 110 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: ({ value }) => (
        <Chip label={value} size="small" color="primary" variant="outlined" />
      ),
    },
  ];
}

export function getDriedColumns() {
  return [
    ...sharedBatchColumns,
    { field: 'dryingArea', headerName: 'Last area', width: 130 },
    {
      field: 'dryingExitedAt',
      headerName: 'Drying finished',
      width: 150,
      valueFormatter: (value) => formatDateTime(value),
    },
    { field: 'dryingWeight', headerName: 'Weight (kg)', width: 120 },
    {
      field: 'status',
      headerName: 'Status',
      width: 180,
      renderCell: ({ value }) => (
        <Chip label={value} size="small" color="warning" variant="outlined" />
      ),
    },
  ];
}

export function getRoastColumns(onRecordRoast) {
  return [
    ...sharedBatchColumns,
    {
      field: 'dryMillExitedAt',
      headerName: 'Dry mill exited',
      width: 150,
      valueFormatter: (value) => formatDateTime(value),
    },
    { field: 'dryingWeight', headerName: 'Drying wt (kg)', width: 120 },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: ({ value }) => (
        <Chip label={value} size="small" color="secondary" variant="outlined" />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      renderCell: ({ row }) => (
        <Button variant="contained" size="small" onClick={() => onRecordRoast(row)}>
          Record roast
        </Button>
      ),
    },
  ];
}

export function getReadyForQcColumns(onStartQC) {
  return [
    ...sharedBatchColumns,
    {
      field: 'roastedAt',
      headerName: 'Roasted at',
      width: 160,
      valueFormatter: (value) => formatDateTime(value),
    },
    { field: 'roastedBy', headerName: 'Roasted by', width: 120 },
    { field: 'dryingWeight', headerName: 'Drying wt (kg)', width: 120 },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: ({ value }) => (
        <Chip
          label={value}
          size="small"
          color={value === 'QC started' ? 'warning' : 'success'}
          variant="outlined"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: ({ row }) => (
        <Button variant="contained" size="small" onClick={() => onStartQC(row)}>
          Start QC
        </Button>
      ),
    },
  ];
}

export function getCompletedQCColumns(onExportPdf) {
  return [
    {
      field: 'export',
      headerName: 'Export',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Button variant="contained" size="small" onClick={() => onExportPdf(params.row)}>
          PDF
        </Button>
      ),
    },
    { field: 'batchNumber', headerName: 'Batch', width: 150 },
    { field: 'referenceNumber', headerName: 'Reference', width: 150 },
    { field: 'storedDate', headerName: 'Stored', width: 120, valueFormatter: (value) => formatDate(value) },
    { field: 'qcDate', headerName: 'QC date', width: 120, valueFormatter: (value) => formatDate(value) },
    { field: 'generalQuality', headerName: 'Quality', width: 160 },
    { field: 'actualGrade', headerName: 'Grade', width: 120 },
    { field: 'kelembapan', headerName: 'Moisture %', width: 110 },
    { field: 'waterActivity', headerName: 'Water activity', width: 120 },
    { field: 'defectScore', headerName: 'Defect score', width: 120 },
  ];
}
