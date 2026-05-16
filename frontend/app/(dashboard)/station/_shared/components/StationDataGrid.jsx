'use client';

import { DataGrid, GridToolbar } from '@mui/x-data-grid';

const defaultAutosizeOptions = {
  includeHeaders: true,
  includeOutliers: true,
  expand: true,
};

export default function StationDataGrid({
  rows,
  columns,
  height = 800,
  pageSizeOptions = [5, 10, 20],
  rowHeight = 35,
  sortingOrder = ['desc', 'asc'],
  ...rest
}) {
  return (
    <div style={{ height, width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSizeOptions={pageSizeOptions}
        disableSelectionOnClick
        sortingOrder={sortingOrder}
        slots={{ toolbar: GridToolbar }}
        autosizeOnMount
        autosizeOptions={defaultAutosizeOptions}
        rowHeight={rowHeight}
        {...rest}
      />
    </div>
  );
}
