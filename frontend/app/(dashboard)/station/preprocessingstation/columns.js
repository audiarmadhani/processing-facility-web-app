'use client';

import { Button, Checkbox } from '@mui/material';

export const MENU_PROPS = {
  PaperProps: {
    style: {
      maxHeight: 48 * 4.5 + 8,
      width: 250,
    },
  },
};

export function getUnprocessedColumns({ selectedBatches, setSelectedBatches, openFinishConfirmation }) {
    return [
    {
      field: 'select',
      headerName: 'Select',
      width: 100,
      sortable: false,
      renderCell: ({ row }) => (
        <Checkbox
          checked={selectedBatches.includes(row.batchNumber)}
          onChange={(e) => {
            setSelectedBatches(prev => 
              e.target.checked 
                ? [...prev, row.batchNumber]
                : prev.filter(b => b !== row.batchNumber)
            );
          }}
          disabled={row.finished || parseFloat(row.availableWeight) <= 0 || row.commodityType === 'Green Bean'}
        />
      ),
    },
    { field: 'batchNumber', headerName: 'Batch Number', width: 200, sortable: true },
    { field: 'type', headerName: 'Type', width: 130, sortable: true },
    { field: 'farmerName', headerName: 'Farmer Name', width: 150, sortable: true },
    { field: 'totalBags', headerName: 'Total Bags', width: 130, sortable: true },
    { field: 'overallQuality', headerName: 'Overall Quality', width: 150, sortable: true },
    {
      field: 'action',
      headerName: 'Action',
      width: 120,
      sortable: false,
      renderCell: ({ row }) => (
        <Button
          variant="contained"
          color="warning"
          size="small"
          onClick={() => openFinishConfirmation(row.batchNumber)}
          disabled={row.finished || parseFloat(row.availableWeight) <= 0}
        >
          Complete
        </Button>
      ),
    },
    // {
    //   field: 'split',
    //   headerName: 'Split Batch',
    //   width: 180,
    //   sortable: false,
    //   renderCell: ({ row }) => (
    //     <Button
    //       variant="contained"
    //       color="secondary"
    //       size="small"
    //       onClick={() => handleOpenSplitDialog(row.batchNumber)}
    //       disabled={row.finished || parseFloat(row.availableWeight) <= 0}
    //     >
    //       Split Batch
    //     </Button>
    //   ),
    // },
    { field: 'weight', headerName: 'Total Weight (kg)', width: 180, sortable: true },
    { field: 'totalProcessedWeight', headerName: 'Processed Weight (kg)', width: 180, sortable: true },
    { field: 'availableWeight', headerName: 'Available Weight (kg)', width: 180, sortable: true },
    { field: 'receivingDate', headerName: 'Receiving Date', width: 180, sortable: true },
    { field: 'qcDate', headerName: 'QC Date', width: 180, sortable: true },
    { field: 'cherryScore', headerName: 'Cherry Score', width: 150, sortable: true },
    { field: 'cherryGroup', headerName: 'Cherry Group', width: 150, sortable: true },
    { field: 'ripeness', headerName: 'Ripeness', width: 150, sortable: true },
    { field: 'color', headerName: 'Color', width: 150, sortable: true },
    { field: 'foreignMatter', headerName: 'Foreign Matter', width: 150, sortable: true },
  ];

}

export function getPreprocessingColumns({ handleOpenEditMetadata }) {
    return [
    { 
      field: 'batchNumber', 
      headerName: 'Batch Number', 
      width: 180, 
      sortable: true,
      groupable: true,
      aggregable: false,
    },
    { field: 'lotNumber', headerName: 'Lot Number', width: 180, sortable: true },
    { field: 'referenceNumber', headerName: 'Reference Number', width: 180, sortable: true },
    { field: 'type', headerName: 'Type', width: 100, sortable: true },
    { field: 'producer', headerName: 'Producer', width: 100, sortable: true },
    { field: 'productLine', headerName: 'Product Line', width: 150, sortable: true },
    { field: 'processingType', headerName: 'Processing Type', width: 200, sortable: true },
    { field: 'quality', headerName: 'Quality', width: 130, sortable: true },
    { field: 'weight', headerName: 'Total Weight (kg)', width: 180, sortable: true },
    { field: 'processedWeight', headerName: 'Processed Weight (kg)', width: 180, sortable: true },
    { field: 'totalProcessedWeight', headerName: 'Total Processed Weight (kg)', width: 180, sortable: true },
    { field: 'availableWeight', headerName: 'Available Weight (kg)', width: 180, sortable: true },
    { field: 'startProcessingDate', headerName: 'Processing Date', width: 180, sortable: true },
    { field: 'preprocessingNotes', headerName: 'Notes', weight: 200, sortable: true },
    {
      field: 'mergedFrom',
      headerName: 'Merged From',
      width: 200,
      sortable: true,
      renderCell: ({ value }) => (value && value.length > 0 ? value.join(', ') : 'N/A'),
    },
    {
      field: 'finished',
      headerName: 'Finished',
      width: 100,
      sortable: true,
      renderCell: ({ value }) => (value ? 'Yes' : 'No'),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: ({ row }) => (
        <Button
          size="small"
          variant="outlined"
          onClick={() => handleOpenEditMetadata(row)}
        >
          Edit
        </Button>
      ),
    },
  ];

}
