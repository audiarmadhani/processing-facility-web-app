'use client';

import { generateQcPdf } from './utils/generateQcPdf';

export function getQcColumns() {
  return [
    {
      field: "export",
      headerName: "Export Data",
      width: 130,
      renderCell: (params) => (
        <button
          onClick={() => generateQcPdf(params.row)}
          style={{
            padding: "6px 12px",
            backgroundColor: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Export PDF
        </button>
      ),
    },
    { field: 'batchNumber', headerName: 'Batch Number', width: 180 },
    { field: 'receivingDate', headerName: 'Receiving Date', width: 150 },
    { field: 'qcDate', headerName: 'QC Date', width: 110 },
    { field: 'farmerName', headerName: 'Farmer Name', width: 140 },
    {
      field: 'price',
      headerName: 'Cherry Price (/kg)',
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
      field: 'total_price',
      headerName: 'Total Cherry Price',
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
    { field: 'type', headerName: 'Type', width: 110 },
    { field: 'ripeness', headerName: 'Ripeness', width: 140 },
    { field: 'color', headerName: 'Color', width: 140 },
    {
      field: "foreignMatter",
      headerName: "Foreign Matter",
      width: 150,
      renderCell: (params) => {
        const color =
          params.value === "None"
            ? "rgb(123, 216, 123)"
            : params.value === "Some"
            ? "rgb(228, 228, 149)"
            : params.value === "Yes"
            ? "rgb(241, 145, 145)"
            : "transparent";

        return (
          <div
            style={{
              backgroundColor: color,
              color: color === "rgba(255, 0, 0, 0.5)" || color === "rgba(0, 255, 0, 0.5)" ? "black" : "black",
              padding: "8px",
              borderRadius: "4px",
            }}
          >
            {params.value}
          </div>
        );
      },
    },
    { field: 'unripePercentage', headerName: 'Unripe (%)', width: 180 },
    { field: 'semiripePercentage', headerName: 'Semi Ripe (%)', width: 180 },
    { field: 'ripePercentage', headerName: 'Ripe (%)', width: 180 },
    { field: 'overripePercentage', headerName: 'Overripe (%)', width: 180 },
    { field: 'overallQuality', headerName: 'Overall Quality', width: 140 },
    { field: 'paymentMethod', headerName: 'Payment Method', width: 140 },
    { field: 'bankAccount', headerName: 'Bank Account', width: 140 },
    { field: 'bankName', headerName: 'Bank Name', width: 140 },
    { field: 'qcNotes', headerName: 'QC Notes', width: 180 },
    { field: 'receivingNotes', headerName: 'Receiving Notes', width: 180 },
    { field: 'cherryGroup', headerName: 'Cherry Quality Group', width: 140 },
    { field: 'priceGroup', headerName: 'Cherry Price Group', width: 140 },
    { field: 'minPrice', headerName: 'Minimum Price', width: 140 },
    { field: 'maxPrice', headerName: 'Maximum Price', width: 140 },
    { field: 'validAt', headerName: 'Price Valid At', width: 140 },
    { field: 'validUntil', headerName: 'Price Valid Until', width: 140 },
    { field: 'receivingUpdatedBy', headerName: 'Receiving Staff', width: 140 },
    { field: 'qcCreatedBy', headerName: 'QC Staff', width: 140 },
  ];
}

export const pendingQcColumns = [
  { field: 'batchNumber', headerName: 'Batch Number', width: 180 },
  { field: 'farmerName', headerName: 'Farmer Name', width: 150 },
  { field: 'receivingDateTrunc', headerName: 'Receiving Date', width: 120 },
  { field: 'weight', headerName: 'Weight (kg)', width: 150 },
  { field: 'totalBags', headerName: 'Total Bags', width: 150 },
  { field: 'slaDays', headerName: 'SLA (Days)', width: 150 },
];
