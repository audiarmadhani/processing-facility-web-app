'use client';

import { Button, Chip } from '@mui/material';

export function buildWeightStatusColumn() {
  return {
    field: 'weightStatus',
    headerName: 'Weight status',
    width: 140,
    sortable: false,
    renderCell: ({ row }) => {
      const w = parseFloat(row.weight);
      const bags = parseInt(row.totalBags, 10);
      const pending = (!w || w <= 0) || (!bags || bags <= 0);
      return pending ? (
        <Chip label="Pending weight" color="warning" size="small" variant="outlined" />
      ) : (
        <Chip label="Recorded" color="success" size="small" variant="outlined" />
      );
    },
  };
}

export function buildWeightActionsColumn(onRecordWeight, isPendingWeight) {
  return {
    field: 'weightActions',
    headerName: 'Actions',
    width: 150,
    sortable: false,
    renderCell: ({ row }) => {
      const pending = isPendingWeight(row);
      return (
        <Button
          size="small"
          variant="outlined"
          onClick={() => onRecordWeight(row)}
        >
          {pending ? 'Record weight' : 'Edit weight'}
        </Button>
      );
    },
  };
}
