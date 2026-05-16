'use client';

import { IconButton } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

export function getTransportColumns(onDownloadInvoices) {
  return [
    { field: 'batchNumber', headerName: 'Batch Number', width: 150 },
    { field: 'createdAtTrunc', headerName: 'Receiving Date', width: 150 },
    { field: 'kabupaten', headerName: 'Kabupaten', width: 150 },
    { field: 'kecamatan', headerName: 'Kecamatan', width: 150 },
    { field: 'desa', headerName: 'Desa', width: 150 },
    {
      field: 'cost',
      headerName: 'TC Farm to Facility',
      width: 180,
      sortable: true,
      renderCell: ({ value }) => {
        if (value == null || isNaN(value)) return 'N/A';
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0
        }).format(value);
      }
    },
    {
      field: 'transportCostFarmToCollection',
      headerName: 'TC Farm to Collection',
      width: 180,
      sortable: true,
      renderCell: ({ value }) => {
        if (value == null || isNaN(value)) return 'N/A';
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0
        }).format(value);
      }
    },
    {
      field: 'transportCostCollectionToFacility',
      headerName: 'TC Collection to Facility',
      width: 180,
      sortable: true,
      renderCell: ({ value }) => {
        if (value == null || isNaN(value)) return 'N/A';
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0
        }).format(value);
      }
    },
    {
      field: 'loadingWorkerCost',
      headerName: 'Loading Worker Cost',
      width: 180,
      sortable: true,
      renderCell: ({ row }) => {
        const value = (Number(row.loadingWorkerCount) || 0) * (Number(row.loadingWorkerCostPerPerson) || 0);
        if (value == null || isNaN(value)) return 'N/A';
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0
        }).format(value);
      }
    },
    {
      field: 'unloadingWorkerCost',
      headerName: 'Unloading Worker Cost',
      width: 180,
      sortable: true,
      renderCell: ({ row }) => {
        const value = (Number(row.unloadingWorkerCount) || 0) * (Number(row.unloadingWorkerCostPerPerson) || 0);
        if (value == null || isNaN(value)) return 'N/A';
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0
        }).format(value);
      }
    },
    {
      field: 'harvestWorkerCost',
      headerName: 'Harvest Worker Cost',
      width: 180,
      sortable: true,
      renderCell: ({ row }) => {
        const value = (Number(row.harvestWorkerCount) || 0) * (Number(row.harvestWorkerCostPerPerson) || 0);
        if (value == null || isNaN(value)) return 'N/A';
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0
        }).format(value);
      }
    },
    {
      field: 'totalCost',
      headerName: 'Total Cost',
      width: 180,
      sortable: true,
      renderCell: ({ value }) => {
        if (value == null || isNaN(value)) return 'N/A';
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0
        }).format(value);
      }
    },
    { field: 'paidTo', headerName: 'Paid To', width: 150 },
    { field: 'bankAccount', headerName: 'Bank Account Number', width: 200 },
    { field: 'bankName', headerName: 'Bank Name', width: 150 },
    {
      field: 'downloadInvoices',
      headerName: 'Download Invoices',
      width: 180,
      renderCell: ({ row }) => (
        <IconButton
          color="primary"
          onClick={() => onDownloadInvoices(row)}
        >
          <PictureAsPdfIcon />
        </IconButton>
      )
    }
  ];
}
