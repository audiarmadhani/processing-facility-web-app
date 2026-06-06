'use client';

import { useMemo, useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { getHistoryColumns, getStockColumns } from '../columns';

const dataGridSx = {
  border: '1px solid rgba(0,0,0,0.12)',
  '& .MuiDataGrid-footerContainer': { borderTop: 'none' },
};

export default function OfficeInventoryGrids({
  items,
  movements,
  itemsLoading,
  movementsLoading,
}) {
  const [tab, setTab] = useState(0);
  const stockColumns = useMemo(() => getStockColumns(), []);
  const historyColumns = useMemo(() => getHistoryColumns(), []);

  const stockRows = useMemo(
    () => items.map((row) => ({ ...row, id: row.id })),
    [items]
  );

  const historyRows = useMemo(
    () => movements.map((row) => ({ ...row, id: row.id })),
    [movements]
  );

  return (
    <Box sx={{ mt: 2 }}>
      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Current stock" />
        <Tab label="Transaction history" />
      </Tabs>

      {tab === 0 && (
        <>
          <Typography variant="subtitle2" gutterBottom>
            Current stock ({stockRows.length} items)
          </Typography>
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={stockRows}
              columns={stockColumns}
              loading={itemsLoading}
              disableRowSelectionOnClick
              slots={{ toolbar: GridToolbar }}
              pageSizeOptions={[25, 50, 100]}
              initialState={{
                pagination: { paginationModel: { pageSize: 50 } },
              }}
              sx={dataGridSx}
              rowHeight={40}
            />
          </Box>
        </>
      )}

      {tab === 1 && (
        <>
          <Typography variant="subtitle2" gutterBottom>
            Transaction history ({historyRows.length} shown)
          </Typography>
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={historyRows}
              columns={historyColumns}
              loading={movementsLoading}
              disableRowSelectionOnClick
              slots={{ toolbar: GridToolbar }}
              pageSizeOptions={[25, 50, 100]}
              initialState={{
                pagination: { paginationModel: { pageSize: 50 } },
                sorting: { sortModel: [{ field: 'transactionDate', sort: 'desc' }] },
              }}
              sx={dataGridSx}
              rowHeight={40}
            />
          </Box>
        </>
      )}
    </Box>
  );
}
