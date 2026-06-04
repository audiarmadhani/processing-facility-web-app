'use client';

import { Grid, Card, CardContent, Typography, Button, CircularProgress, Box } from '@mui/material';
import StationDataGrid from '../../_shared/components/StationDataGrid';
import {
  getDryingColumns,
  getDriedColumns,
  getRoastColumns,
  getReadyForQcColumns,
  getCompletedQCColumns,
} from '../columns';

function PipelineSection({ title, subtitle, count, children }) {
  return (
    <Grid item xs={12}>
      <Card variant="outlined">
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h5" gutterBottom>
              {title}
              {count !== undefined && (
                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  ({count})
                </Typography>
              )}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {children}
        </CardContent>
      </Card>
    </Grid>
  );
}

export default function GbQcGrids({
  dryingBatches,
  driedBatches,
  roastBatches,
  readyForQcBatches,
  completedQCBatches,
  isLoading,
  onRefresh,
  onRecordRoast,
  onStartQC,
  onExportPdf,
}) {
  return (
    <>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button
            variant="contained"
            color="secondary"
            onClick={onRefresh}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Box>
      </Grid>

      <PipelineSection
        title="Drying List"
        subtitle="Batches still in the drying process"
        count={dryingBatches.length}
      >
        <StationDataGrid
          rows={dryingBatches}
          columns={getDryingColumns()}
          height={360}
          pageSizeOptions={[5, 10, 20]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        />
      </PipelineSection>

      <PipelineSection
        title="Dried List"
        subtitle="Drying finished — not yet entered dry mill"
        count={driedBatches.length}
      >
        <StationDataGrid
          rows={driedBatches}
          columns={getDriedColumns()}
          height={360}
          pageSizeOptions={[5, 10, 20]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        />
      </PipelineSection>

      <PipelineSection
        title="Roast List"
        subtitle="Dry mill complete — record sample roast before QC"
        count={roastBatches.length}
      >
        <StationDataGrid
          rows={roastBatches}
          columns={getRoastColumns(onRecordRoast)}
          height={360}
          pageSizeOptions={[5, 10, 20]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        />
      </PipelineSection>

      <PipelineSection
        title="Ready for QC"
        subtitle="Roast recorded — start or continue green bean QC"
        count={readyForQcBatches.length}
      >
        <StationDataGrid
          rows={readyForQcBatches}
          columns={getReadyForQcColumns(onStartQC)}
          height={360}
          pageSizeOptions={[5, 10, 20]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        />
      </PipelineSection>

      <PipelineSection title="Completed QC" count={completedQCBatches.length}>
        <StationDataGrid
          rows={completedQCBatches}
          columns={getCompletedQCColumns(onExportPdf)}
          height={600}
          pageSizeOptions={[10, 20, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        />
      </PipelineSection>
    </>
  );
}
