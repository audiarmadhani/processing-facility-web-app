'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import TabPanel from '../../_shared/components/TabPanel';
import StationDataGrid from '../../_shared/components/StationDataGrid';
import {
  getDryingColumns,
  getDriedColumns,
  getRoastColumns,
  getReadyForQcColumns,
  getCompletedQCColumns,
} from '../columns';

const GRID_HEIGHT = 560;

const gridDefaults = {
  height: GRID_HEIGHT,
  pageSizeOptions: [25, 50, 100],
  initialState: { pagination: { paginationModel: { pageSize: 100 } } },
  getRowId: (row) => row.id,
};

const TAB_CONFIG = [
  { key: 'drying', title: 'Drying List' },
  { key: 'dried', title: 'Dried List' },
  { key: 'roast', title: 'Roast List' },
  { key: 'ready', title: 'Ready for QC' },
  { key: 'completed', title: 'Completed QC' },
];

export default function GbQcGrids({
  dryingBatches,
  driedBatches,
  roastBatches,
  readyForQcBatches,
  completedQCBatches,
  isLoading,
  onRefresh,
  onRecordRoast,
  onOpenCupping,
  onOpenGbQc,
  onExportPdf,
  readyQcActionAnchorEl,
  readyQcActionRow,
  onReadyQcActionMenuOpen,
  onReadyQcActionMenuClose,
}) {
  const [tabValue, setTabValue] = useState(0);

  const batchCounts = [
    dryingBatches.length,
    driedBatches.length,
    roastBatches.length,
    readyForQcBatches.length,
    completedQCBatches.length,
  ];

  const readyForQcColumns = getReadyForQcColumns({
    onOpenCupping,
    onOpenGbQc,
    onRecordRoast,
    actionAnchorEl: readyQcActionAnchorEl,
    selectedActionRow: readyQcActionRow,
    handleActionMenuOpen: onReadyQcActionMenuOpen,
    handleActionMenuClose: onReadyQcActionMenuClose,
  });

  const tabGrids = [
    {
      subtitle: 'Batches still in the drying process',
      rows: dryingBatches,
      columns: getDryingColumns(),
    },
    {
      subtitle: 'Drying finished — not yet entered dry mill',
      rows: driedBatches,
      columns: getDriedColumns(),
    },
    {
      subtitle: 'Hulled batches in dry mill — record sample roast before merge.',
      rows: roastBatches,
      columns: getRoastColumns(onRecordRoast),
    },
    {
      subtitle: 'Roast recorded — cupping or GB QC',
      rows: readyForQcBatches,
      columns: readyForQcColumns,
    },
    {
      subtitle: null,
      rows: completedQCBatches,
      columns: getCompletedQCColumns(onExportPdf),
    },
  ];

  return (
    <Box sx={{ width: '100%' }}>
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

      <Card variant="outlined">
        <Tabs
          value={tabValue}
          onChange={(_, value) => setTabValue(value)}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="GB QC pipeline tabs"
        >
          {TAB_CONFIG.map((tab, index) => (
            <Tab
              key={tab.key}
              label={`${tab.title} (${batchCounts[index]})`}
              id={`gb-qc-tab-${index}`}
              aria-controls={`gb-qc-tabpanel-${index}`}
            />
          ))}
        </Tabs>

        {tabGrids.map((grid, index) => (
          <TabPanel key={TAB_CONFIG[index].key} value={tabValue} index={index}>
            {grid.subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {grid.subtitle}
              </Typography>
            )}
            <StationDataGrid rows={grid.rows} columns={grid.columns} {...gridDefaults} />
          </TabPanel>
        ))}
      </Card>
    </Box>
  );
}
