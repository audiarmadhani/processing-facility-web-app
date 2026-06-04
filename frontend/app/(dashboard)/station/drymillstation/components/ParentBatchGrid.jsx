'use client';

import { DataGrid, GridToolbar } from '@mui/x-data-grid';

export default function ParentBatchGrid({
  rows,
  columns,
  rowSelectionModel,
  onRowSelectionModelChange,
  isRowSelectable,
}) {
  return (
    <DataGrid
      rows={rows}
      columns={columns}
      initialState={{ pagination: { paginationModel: { pageSize: 100 } } }}
      pageSizeOptions={[10, 50, 100]}
      checkboxSelection
      rowSelectionModel={rowSelectionModel}
      onRowSelectionModelChange={onRowSelectionModelChange}
      isRowSelectable={isRowSelectable}
      keepNonExistentRowsSelected
      disableRowSelectionOnClick
      getRowId={(row) => row.id}
      slots={{ toolbar: GridToolbar }}
      autosizeOnMount
      autosizeOptions={{
        includeHeaders: true,
        includeOutliers: true,
        expand: true,
      }}
      rowHeight={40}
      sx={{ height: 600, width: '100%' }}
    />
  );
}
