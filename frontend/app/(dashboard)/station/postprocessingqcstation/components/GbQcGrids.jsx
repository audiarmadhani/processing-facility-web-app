'use client';

import { Grid, Card, CardContent, Typography, Button, CircularProgress } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { getNotQcedColumns, getCompletedQCColumns } from '../columns';

export default function GbQcGrids({
  notQcedBatches,
  completedQCBatches,
  isLoading,
  onRefresh,
  onStartQC,
  onExportPdf,
}) {
  const notQcedColumns = getNotQcedColumns(onStartQC);
  const completedQCColumns = getCompletedQCColumns(onExportPdf);

  return (
    <>
      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Green Bean Batches Not Yet QCed
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              onClick={onRefresh}
              disabled={isLoading}
              sx={{ mb: 2 }}
              startIcon={isLoading ? <CircularProgress size={20} /> : null}
            >
              {isLoading ? 'Refreshing...' : 'Refresh Data'}
            </Button>
            <div style={{ height: 400, width: '100%' }}>
              <DataGrid
                rows={notQcedBatches.map((row, index) => ({ id: index + 1, ...row }))}
                columns={notQcedColumns}
                initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
                pageSizeOptions={[5, 10, 20]}
                disableRowSelectionOnClick
                getRowId={(row) => row.batchNumber}
                slots={{ toolbar: GridToolbar }}
                rowHeight={35}
              />
            </div>
            </CardContent>
            </Card>
      </Grid>

      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Completed QC Batches
            </Typography>
            <div style={{ height: 600, width: '100%' }}>
              <DataGrid
                rows={completedQCBatches.map((row, index) => ({ id: index + 1, ...row }))}
                columns={completedQCColumns}
                initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                pageSizeOptions={[10, 20, 50]}
                disableRowSelectionOnClick
                getRowId={(row) => row.batchNumber}
                slots={{ toolbar: GridToolbar }}
                rowHeight={35}
              />
            </div>
          </CardContent>
        </Card>
      </Grid>
    </>
  );
}
