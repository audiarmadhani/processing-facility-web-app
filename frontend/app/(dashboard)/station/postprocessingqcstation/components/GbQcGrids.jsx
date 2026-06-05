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

const PIPELINE_GRID_HEIGHT = 480;
const ROAST_GRID_HEIGHT = 480;

const pipelineGridDefaults = {
  height: PIPELINE_GRID_HEIGHT,
  pageSizeOptions: [25, 50, 100],
  initialState: { pagination: { paginationModel: { pageSize: 100 } } },
  getRowId: (row) => row.id,
};

function PipelineSection({ title, subtitle, count, xs = 12, children }) {
  return (
    <Grid item xs={12} md={xs}>
      <Card variant="outlined" sx={{ height: '100%' }}>
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
  readyQcActionAnchorEl,
  readyQcActionRow,
  onReadyQcActionMenuOpen,
  onReadyQcActionMenuClose,
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
        xs={6}
      >
        <StationDataGrid
          rows={dryingBatches}
          columns={getDryingColumns()}
          {...pipelineGridDefaults}
        />
      </PipelineSection>

      <PipelineSection
        title="Dried List"
        subtitle="Drying finished — not yet entered dry mill"
        count={driedBatches.length}
        xs={6}
      >
        <StationDataGrid
          rows={driedBatches}
          columns={getDriedColumns()}
          {...pipelineGridDefaults}
        />
      </PipelineSection>

      <PipelineSection
        title="Roast List"
        subtitle="Hulled batches in dry mill — record sample roast before merge."
        count={roastBatches.length}
      >
        <StationDataGrid
          rows={roastBatches}
          columns={getRoastColumns(onRecordRoast)}
          height={ROAST_GRID_HEIGHT}
          pageSizeOptions={[25, 50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 100 } } }}
          getRowId={(row) => row.id}
        />
      </PipelineSection>

      <PipelineSection
        title="Ready for QC"
        subtitle="Roast recorded — start or continue green bean QC"
        count={readyForQcBatches.length}
        xs={6}
      >
        <StationDataGrid
          rows={readyForQcBatches}
          columns={getReadyForQcColumns({
            onStartQC,
            onRecordRoast,
            actionAnchorEl: readyQcActionAnchorEl,
            selectedActionRow: readyQcActionRow,
            handleActionMenuOpen: onReadyQcActionMenuOpen,
            handleActionMenuClose: onReadyQcActionMenuClose,
          })}
          {...pipelineGridDefaults}
        />
      </PipelineSection>

      <PipelineSection title="Completed QC" count={completedQCBatches.length} xs={6}>
        <StationDataGrid
          rows={completedQCBatches}
          columns={getCompletedQCColumns(onExportPdf)}
          {...pipelineGridDefaults}
        />
      </PipelineSection>
    </>
  );
}
