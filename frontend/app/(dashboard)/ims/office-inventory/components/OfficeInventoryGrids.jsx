'use client';

import { useMemo, useState } from 'react';
import {
  Autocomplete,
  Box,
  Chip,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { DEFAULT_PAGE_SIZE, formatStockQuantity } from '../constants';
import { getHistoryColumns, getSearchColumns, getStockColumns } from '../columns';

const dataGridSx = {
  border: '1px solid rgba(0,0,0,0.12)',
  '& .MuiDataGrid-footerContainer': { borderTop: 'none' },
};

const gridPagination = {
  pageSizeOptions: [25, 50, 100],
  initialState: {
    pagination: { paginationModel: { pageSize: DEFAULT_PAGE_SIZE } },
  },
};

export default function OfficeInventoryGrids({
  items,
  movements,
  itemsLoading,
  movementsLoading,
  searchItem,
  searchMovements,
  searchLoading,
  onSearchItemChange,
}) {
  const [tab, setTab] = useState(0);
  const stockColumns = useMemo(() => getStockColumns(), []);
  const historyColumns = useMemo(() => getHistoryColumns(), []);
  const searchColumns = useMemo(() => getSearchColumns(), []);

  const stockRows = useMemo(
    () => items.map((row) => ({ ...row, id: row.id })),
    [items]
  );

  const historyRows = useMemo(
    () => movements.map((row) => ({ ...row, id: row.id })),
    [movements]
  );

  const searchRows = useMemo(
    () => searchMovements.map((row) => ({ ...row, id: row.id })),
    [searchMovements]
  );

  const searchSubtitle = useMemo(() => {
    if (!searchItem) return null;
    const pic =
      searchMovements.length > 0
        ? searchMovements[searchMovements.length - 1]?.pic
        : null;
    return [searchItem.category, pic].filter(Boolean).join(' - ') || null;
  }, [searchItem, searchMovements]);

  return (
    <Box sx={{ mt: 2 }}>
      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Current stock" />
        <Tab label="Transaction history" />
        <Tab label="Search" />
      </Tabs>

      {tab === 0 && (
        <>
          <Typography variant="subtitle2" gutterBottom>
            Current stock ({stockRows.length} items)
          </Typography>
          <Box sx={{ height: 1200, width: '100%' }}>
            <DataGrid
              rows={stockRows}
              columns={stockColumns}
              loading={itemsLoading}
              disableRowSelectionOnClick
              slots={{ toolbar: GridToolbar }}
              {...gridPagination}
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
              initialState={{
                ...gridPagination.initialState,
                sorting: { sortModel: [{ field: 'transactionDate', sort: 'desc' }] },
              }}
              pageSizeOptions={gridPagination.pageSizeOptions}
              sx={dataGridSx}
              rowHeight={40}
            />
          </Box>
        </>
      )}

      {tab === 2 && (
        <>
          <Box
            sx={{
              mb: 2,
              p: 2,
              borderRadius: 1,
              bgcolor: 'success.dark',
              color: 'success.contrastText',
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Pencarian By Nama Barang
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <Autocomplete
                sx={{ minWidth: 320, flex: 1, bgcolor: 'background.paper', borderRadius: 1 }}
                options={items}
                getOptionLabel={(option) => option.name || ''}
                value={searchItem}
                onChange={(_e, value) => onSearchItemChange(value)}
                loading={itemsLoading}
                renderInput={(params) => (
                  <TextField {...params} label="Nama Barang" size="small" />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
              {searchItem && searchSubtitle && (
                <Chip
                  label={searchSubtitle}
                  sx={{ bgcolor: 'success.main', color: 'success.contrastText', fontWeight: 600 }}
                />
              )}
            </Box>
          </Box>

          {!searchItem ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              Select an item to view its stock movement history.
            </Typography>
          ) : (
            <>
              <Typography variant="subtitle2" gutterBottom>
                {searchItem.name} — {searchRows.length} movements (current stock:{' '}
                {formatStockQuantity(searchItem.currentStock, searchItem.unit)}{' '}
                {searchItem.unit})
              </Typography>
              <Box sx={{ height: 600, width: '100%' }}>
                <DataGrid
                  rows={searchRows}
                  columns={searchColumns}
                  loading={searchLoading}
                  disableRowSelectionOnClick
                  slots={{ toolbar: GridToolbar }}
                  {...gridPagination}
                  sx={dataGridSx}
                  rowHeight={40}
                />
              </Box>
            </>
          )}
        </>
      )}
    </Box>
  );
}
