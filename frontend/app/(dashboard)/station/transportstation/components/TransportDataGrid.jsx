'use client';

import { Typography, Card, CardContent } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { getTransportColumns } from '../columns';

export default function TransportDataGrid({ rows, onDownloadInvoices }) {
  const columns = getTransportColumns(onDownloadInvoices);

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h5" gutterBottom>Transport Data</Typography>
        <div style={{ height: 700, width: '100%' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={5}
            slots={{ toolbar: GridToolbar }}
            autosizeOnMount
            autosizeOptions={{
              includeHeaders: true,
              includeOutliers: true,
              expand: true,
            }}
            rowHeight={35}
          />
        </div>
      </CardContent>
    </Card>
  );
}
