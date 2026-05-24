import { formatIdr, formatReceivingDate } from '../../_shared/utils/format';
import { buildWeightStatusColumn, buildWeightActionsColumn } from './weightColumns';

export function buildCherryColumns({ onRecordWeight, isPendingWeight }) {
  return [
  { field: 'batchNumber', headerName: 'Batch Number', width: 160, sortable: true },
  {
    field: 'receivingDate',
    headerName: 'Received Date',
    width: 180,
    sortable: true,
    valueFormatter: (value) => formatReceivingDate(value),
  },
  { field: 'farmerName', headerName: 'Farmer Name', width: 180, sortable: true },
  { field: 'broker', headerName: 'Broker Name', width: 180, sortable: true },
  {
    field: 'price',
    headerName: 'Cherry Price (/kg)',
    width: 180,
    sortable: true,
    renderCell: ({ value }) => formatIdr(value),
  },
  {
    field: 'total_price',
    headerName: 'Total Cherry Price',
    width: 180,
    sortable: true,
    renderCell: ({ value }) => formatIdr(value),
  },
  { field: 'type', headerName: 'Type', width: 110, sortable: true },
  { field: 'farmVarieties', headerName: 'Varieties', width: 150, sortable: true },
  {
    field: 'weight',
    headerName: 'Total Weight (kg)',
    width: 150,
    sortable: true,
    renderCell: ({ value, row }) => {
      const pending = isPendingWeight(row);
      return pending ? '—' : value;
    },
  },
  buildWeightStatusColumn(),
  { field: 'brix', headerName: 'Brix (°Bx)', width: 120, sortable: true },
  { field: 'producer', headerName: 'Producer', width: 150, sortable: true },
  { field: 'notes', headerName: 'Notes', width: 250, sortable: true },
  { field: 'createdBy', headerName: 'Created By', width: 180, sortable: true },
  buildWeightActionsColumn(onRecordWeight, isPendingWeight),
  ];
}
