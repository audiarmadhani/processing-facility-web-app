import { formatStockQuantity } from './constants';

export function getStockColumns() {
  return [
    { field: 'name', headerName: 'Nama Barang', flex: 1, minWidth: 180 },
    { field: 'category', headerName: 'Kategori', width: 160 },
    { field: 'itemType', headerName: 'Jenis Barang', width: 150 },
    { field: 'unit', headerName: 'Satuan', width: 100 },
    {
      field: 'currentStock',
      headerName: 'Stock',
      width: 130,
      type: 'number',
      valueFormatter: (value, row) => formatStockQuantity(value, row?.unit),
    },
  ];
}

export function getHistoryColumns() {
  return [
    {
      field: 'transactionDate',
      headerName: 'Tgl',
      width: 110,
      valueFormatter: (value) => (value ? String(value).slice(0, 10) : ''),
    },
    { field: 'name', headerName: 'Nama Barang', flex: 1, minWidth: 160 },
    { field: 'category', headerName: 'Kategori', width: 140 },
    {
      field: 'quantityIn',
      headerName: 'IN',
      width: 90,
      valueGetter: (_value, row) =>
        row.movementType === 'IN' ? row.quantity : null,
      valueFormatter: (value, row) =>
        value != null ? formatStockQuantity(value, row?.unit) : '',
    },
    {
      field: 'quantityOut',
      headerName: 'OUT',
      width: 90,
      valueGetter: (_value, row) =>
        row.movementType === 'OUT' ? row.quantity : null,
      valueFormatter: (value, row) =>
        value != null ? formatStockQuantity(value, row?.unit) : '',
    },
    { field: 'unit', headerName: 'Satuan', width: 90 },
    { field: 'itemType', headerName: 'Jenis', width: 130 },
    { field: 'remarks', headerName: 'Remarks', width: 130 },
    { field: 'pic', headerName: 'PIC', width: 100 },
    { field: 'location', headerName: 'Location', width: 100 },
    { field: 'project', headerName: 'Project', width: 150 },
    { field: 'notes', headerName: 'Keterangan', width: 180 },
  ];
}
