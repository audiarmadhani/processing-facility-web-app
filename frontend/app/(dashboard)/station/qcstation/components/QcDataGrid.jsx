'use client';

import { Typography, Button, Card, CardContent, Divider } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { getQcColumns, pendingQcColumns } from '../columns';

export function QcPendingGrid({ receivingData, onRefresh }) {
  return (
    <>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Pending QC
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={onRefresh}
            style={{ marginBottom: '16px' }}
          >
            Refresh Data
          </Button>
          <div style={{ height: 800, width: '100%' }}>
            <DataGrid
              rows={receivingData.map((row, index) => ({
                id: index + 1,
                ...row,
              }))}
              columns={pendingQcColumns}
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
      <Divider style={{ margin: '16px 0' }} />
    </>
  );
}

export function QcCompletedGrid({ qcData, onRefresh, onOpenCapture }) {
  const qcColumns = getQcColumns(onOpenCapture);

  return (
    <Card style={{ marginTop: '16px' }} variant="outlined">
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Completed QC
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={onRefresh}
          style={{ marginBottom: '16px' }}
        >
          Refresh Data
        </Button>
        <div style={{ height: 1000, width: '100%' }}>
          <DataGrid
            rows={qcData.map((row) => ({
              ...row,
              id: row.id ?? row.batchNumber,
            }))}
            columns={qcColumns}
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

export default function QcDataGrid({ receivingData, qcData, onRefresh, onOpenCapture }) {
  return (
    <>
      <QcPendingGrid receivingData={receivingData} onRefresh={onRefresh} />
      <QcCompletedGrid qcData={qcData} onRefresh={onRefresh} onOpenCapture={onOpenCapture} />
    </>
  );
}
