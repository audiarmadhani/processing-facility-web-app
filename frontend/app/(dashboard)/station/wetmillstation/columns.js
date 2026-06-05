'use client';

import { Button, Chip } from '@mui/material';
import { experimentNumberColumn } from '../../_shared/constants/experimentNumber';

export function getWetMillColumns(handleWeightClick) {
  return [
    { field: 'batchNumber', headerName: 'Batch Number', width: 180 },
    experimentNumberColumn,
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: ({ value }) => {
        const color = {
          'Entered Wet Mill': 'primary',
          'Exited Wet Mill': 'success',
          'Not Scanned': 'default',
          'In Drying': 'info',
        }[value] || 'default';
        return (
          <Chip
            label={value}
            color={color}
            size="small"
            sx={{ borderRadius: '16px', fontWeight: 'medium' }}
          />
        );
      },
    },
    {
      field: 'trackWeight',
      headerName: 'Track Weight',
      width: 130,
      sortable: false,
      renderCell: ({ row }) => (
        <Button
          variant="outlined"
          color="info"
          size="small"
          onClick={() => handleWeightClick(row)}
          disabled={row.status === 'Not Scanned'}
        >
          Track Weight
        </Button>
      ),
    },
    { field: 'farmerName', headerName: 'Farmer Name', width: 160 },
    { field: 'farmVarieties', headerName: 'Farm Varieties', width: 160 },
    { field: 'startProcessingDate', headerName: 'Start Processing Date', width: 180 },
    { field: 'lastProcessingDate', headerName: 'Last Processing Date', width: 180 },
    { field: 'weight', headerName: 'Processed Weight (kg)', width: 180 },
    { field: 'type', headerName: 'Type', width: 100 },
    { field: 'producer', headerName: 'Producer', width: 100 },
    { field: 'productLine', headerName: 'Product Line', width: 180 },
    { field: 'processingType', headerName: 'Processing Type', width: 220 },
    { field: 'quality', headerName: 'Quality', width: 130 },
    {
      field: 'lotNumbers',
      headerName: 'Lot Numbers',
      width: 200,
      renderCell: ({ value }) => value.join(', ') || 'N/A',
    },
    {
      field: 'referenceNumbers',
      headerName: 'Reference Numbers',
      width: 200,
      renderCell: ({ value }) => value.join(', ') || 'N/A',
    },
    { field: 'preprocessing_notes', headerName: 'Preprocessing Notes', width: 200 },
  ];
}
