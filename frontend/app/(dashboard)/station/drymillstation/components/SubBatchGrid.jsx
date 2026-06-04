'use client';

import { Typography } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';

export default function SubBatchGrid({ rows, columns, dataGridError }) {
  if (dataGridError) {
    return (
      <Typography variant="body1" color="error" sx={{ p: 3 }}>
        {dataGridError}
      </Typography>
    );
  }

  if (rows.length === 0) {
    return (
      <Typography variant="body1" color="text.secondary" sx={{ p: 3 }}>
        No green bean sub-batches to show. This section is for reference only; process weights are recorded via Process on each batch above.
      </Typography>
    );
  }

  return (
    <DataGrid
      rows={rows}
      columns={columns}
      initialState={{ pagination: { paginationModel: { pageSize: 100 } } }}
      pageSizeOptions={[10, 50, 100]}
      disableRowSelectionOnClick
      getRowId={(row) => row.id}
      slots={{ toolbar: GridToolbar }}
      autosizeOnMount
      autosizeOptions={{
        includeHeaders: true,
        includeOutliers: true,
        expand: true,
      }}
      rowHeight={35}
      sx={{ height: 600, width: '100%' }}
    />
  );
}
