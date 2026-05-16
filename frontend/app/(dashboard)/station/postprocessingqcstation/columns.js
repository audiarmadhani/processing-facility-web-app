'use client';

import { Button, Chip } from '@mui/material';

export function getNotQcedColumns(onStartQC) {
  return [
    { field: 'batchNumber', headerName: 'Lot Number', width: 170 },
    { field: 'referenceNumber', headerName: 'Reference Number', width: 170 },
    { field: 'storedDate', headerName: 'Stored Date', width: 150 },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === 'QC Not Started'
              ? 'primary'
              : params.value === 'QC Started'
                ? 'success'
                : 'default'
          }
          size="small"
          sx={{ borderRadius: '16px', fontWeight: 'medium' }}
        />
      ),
    },
    {
      field: 'action',
      headerName: 'Action',
      width: 130,
      renderCell: (params) => (
        <Button variant="outlined" size="small" onClick={() => onStartQC(params.row)}>
          Start QC
        </Button>
      ),
    },
    { field: 'processingType', headerName: 'Processing Type', width: 180 },
    { field: 'productLine', headerName: 'Product Line', width: 150 },
    { field: 'producer', headerName: 'Producer', width: 130 },
    { field: 'type', headerName: 'Type', width: 130 },
    { field: 'quality', headerName: 'Quality', width: 130 },
    { field: 'weight', headerName: 'Total Weight (kg)', width: 150 },
    { field: 'totalBags', headerName: 'Total Bags', width: 130 },
    { field: 'notes', headerName: 'Notes', width: 180 },
  ];
}

export function getCompletedQCColumns(onExportPdf) {
  return [
    {
      field: 'export',
      headerName: 'Export Data',
      width: 130,
      renderCell: (params) => (
        <button
          onClick={() => onExportPdf(params.row)}
          style={{
            padding: '6px 12px',
            backgroundColor: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Export PDF
        </button>
      ),
    },
    { field: 'batchNumber', headerName: 'Lot Number', width: 180 },
    { field: 'referenceNumber', headerName: 'Reference Number', width: 170 },
    { field: 'storedDate', headerName: 'Stored Date', width: 150 },
    { field: 'qcDate', headerName: 'QC Date', width: 150 },
    { field: 'generalQuality', headerName: 'General Quality', width: 180 },
    { field: 'actualGrade', headerName: 'Actual Grade', width: 150 },
    { field: 'kelembapan', headerName: 'Kelembapan (%)', width: 130 },
    { field: 'triage', headerName: 'Triage', width: 130 },
    { field: 'waterActivity', headerName: 'Water Activity', width: 150 },
    { field: 'seranggaHidup', headerName: 'Serangga Hidup', width: 150 },
    { field: 'bijiBauBusuk', headerName: 'Biji Bau Busuk', width: 150 },
    { field: 'defectScore', headerName: 'Defect Score', width: 140 },
    { field: 'totalBobotKotoran', headerName: 'Total Bobot Kotoran', width: 180 },
    { field: 'defectWeightPercentage', headerName: 'Defect Weight (%)', width: 180 },
    { field: 'bijiHitam', headerName: 'Biji Hitam', width: 130 },
    { field: 'bijiHitamSebagian', headerName: 'Biji Hitam Sebagian', width: 160 },
    { field: 'bijiPecah', headerName: 'Biji Pecah', width: 130 },
    { field: 'kopiGelondong', headerName: 'Kopi Gelondong', width: 150 },
    { field: 'bijiCoklat', headerName: 'Biji Coklat', width: 130 },
    { field: 'kulitKopiBesar', headerName: 'Kulit Kopi Besar', width: 150 },
    { field: 'kulitKopiSedang', headerName: 'Kulit Kopi Sedang', width: 150 },
    { field: 'kulitKopiKecil', headerName: 'Kulit Kopi Kecil', width: 150 },
    { field: 'bijiBerKulitTanduk', headerName: 'Biji Berkulit Tanduk', width: 180 },
    { field: 'kulitTandukBesar', headerName: 'Kulit Tanduk Besar', width: 160 },
    { field: 'kulitTandukSedang', headerName: 'Kulit Tanduk Sedang', width: 160 },
    { field: 'kulitTandukKecil', headerName: 'Kulit Tanduk Kecil', width: 160 },
    { field: 'bijiMuda', headerName: 'Biji Muda', width: 130 },
    { field: 'bijiBerlubangSatu', headerName: 'Biji Berlubang Satu', width: 170 },
    { field: 'bijiBerlubangLebihSatu', headerName: 'Biji Berlubang >1', width: 180 },
    { field: 'bijiBertutul', headerName: 'Biji Bertutul', width: 140 },
    { field: 'rantingBesar', headerName: 'Ranting Besar', width: 150 },
    { field: 'rantingSedang', headerName: 'Ranting Sedang', width: 150 },
    { field: 'rantingKecil', headerName: 'Ranting Kecil', width: 150 },
  ];
}
