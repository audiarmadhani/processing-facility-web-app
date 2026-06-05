import { formatFermentationGridDate } from '../station/fermentationstation/utils/fermentationDateTime';

export function getUpdatesColumns() {
  return [
    {
      field: 'occurredAt',
      headerName: 'When',
      width: 180,
      valueFormatter: (value) => formatFermentationGridDate(value, ''),
    },
    {
      field: 'station',
      headerName: 'Station',
      width: 130,
    },
    {
      field: 'action',
      headerName: 'Action',
      width: 220,
    },
    {
      field: 'batchNumber',
      headerName: 'Batch',
      width: 150,
      valueFormatter: (value) => (value == null || value === '' ? '' : String(value)),
    },
    {
      field: 'detail',
      headerName: 'Detail',
      flex: 1,
      minWidth: 200,
      valueFormatter: (value) => (value == null || value === '' ? '' : String(value)),
    },
    {
      field: 'actor',
      headerName: 'User',
      width: 140,
      valueFormatter: (value) => (value == null || value === '' ? '' : String(value)),
    },
  ];
}
