'use client';

import { Box, Button, Card, CardContent, Divider, FormControl, Grid, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { useSession } from 'next-auth/react';
import { getPreprocessingColumns, getUnprocessedColumns } from './columns';
import MergeBatchesDialog from './components/MergeBatchesDialog';
import PreprocessingScanCard from './components/PreprocessingScanCard';
import SplitBatchDialog from './components/SplitBatchDialog';
import WeightHistoryDialog from './components/WeightHistoryDialog';
import { PREPROCESSING_ALLOWED_ROLES, usePreprocessingStation } from './hooks/usePreprocessingStation';

function PreprocessingStation() {
  const { data: session, status } = useSession();
  const station = usePreprocessingStation(session);

  if (status === 'loading') {
    return <Typography>Loading...</Typography>;
  }

  if (!session?.user || !PREPROCESSING_ALLOWED_ROLES.includes(session.user.role)) {
    return (
      <Typography variant="h6">
        Access Denied. You do not have permission to view this page.
      </Typography>
    );
  }

  const unprocessedColumns = getUnprocessedColumns({
    selectedBatches: station.selectedBatches,
    setSelectedBatches: station.setSelectedBatches,
    openFinishConfirmation: station.openFinishConfirmation,
  });

  const columns = getPreprocessingColumns({
    handleOpenEditMetadata: station.handleOpenEditMetadata,
  });

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <PreprocessingScanCard station={station} />
        <WeightHistoryDialog
          open={station.openHistory}
          onClose={station.handleCloseHistory}
          weightHistory={station.weightHistory}
        />
        <MergeBatchesDialog
          open={station.openMergeDialog}
          onClose={station.handleCloseMergeDialog}
          newBatchNumber={station.newBatchNumber}
          selectedBatches={station.selectedBatches}
          setSelectedBatches={station.setSelectedBatches}
          mergeNotes={station.mergeNotes}
          setMergeNotes={station.setMergeNotes}
          unprocessedBatches={station.unprocessedBatches}
          onMerge={station.handleMergeBatches}
        />
        <SplitBatchDialog
          open={station.openSplitDialog}
          onClose={station.handleCloseSplitDialog}
          splitBatchNumber={station.splitBatchNumber}
          splitCount={station.splitCount}
          setSplitCount={station.setSplitCount}
          splitWeights={station.splitWeights}
          setSplitWeights={station.setSplitWeights}
          weightAvailable={station.weightAvailable}
          scannedRfids={station.scannedRfids}
          rfidScanMessage={station.rfidScanMessage}
          onFetchRfid={station.fetchRfid}
          onSplit={station.handleSplitBatches}
          parseWeightInput={station.parseWeightInput}
          onSplitCountChange={station.handleSplitCountChange}
        />
      </Grid>

      <Grid item xs={12} md={8}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Pending Processing
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={station.handleOpenMergeDialog}
                disabled={station.selectedBatches.length < 2}
              >
                Merge Batches
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => station.handleOpenSplitDialog(station.selectedBatches[0] || '')}
                sx={{ ml: 2 }}
                disabled={!station.selectedBatches.length || station.selectedBatches.length > 1}
              >
                Split Batch
              </Button>
            </Box>
            <Box sx={{ height: 600, width: '100%' }}>
              <DataGrid
                rows={station.unprocessedBatches}
                columns={unprocessedColumns}
                pageSizeOptions={[5, 10, 20]}
                disableRowSelectionOnClick
                sortingOrder={['asc', 'desc']}
                getRowId={(row) => row.id}
                slots={{ toolbar: GridToolbar }}
                autosizeOnMount
                autosizeOptions={{
                  includeHeaders: true,
                  includeOutliers: true,
                  expand: true,
                }}
                rowHeight={35}
              />
            </Box>
          </CardContent>
        </Card>

        <Divider sx={{ my: 2 }} />

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Processing Order Book
            </Typography>
            <FormControl sx={{ mb: 2, mt: 2, minWidth: 120 }}>
              <InputLabel id="producer-filter-label">Producer</InputLabel>
              <Select
                labelId="producer-filter-label"
                value={station.producerFilter}
                onChange={(e) => station.setProducerFilter(e.target.value)}
                label="Producer"
              >
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="HQ">HEQA</MenuItem>
                <MenuItem value="BTM">BTM</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ height: 1000, width: '100%' }}>
              <DataGrid
                rows={station.filteredPreprocessingData}
                columns={columns}
                pageSizeOptions={[5, 10, 20]}
                disableRowSelectionOnClick
                sortingOrder={['asc', 'desc']}
                getRowId={(row) => row.id}
                slots={{ toolbar: GridToolbar }}
                autosizeOnMount
                autosizeOptions={{
                  includeHeaders: true,
                  includeOutliers: true,
                  expand: true,
                }}
                rowHeight={35}
                treeData
                getTreeDataPath={(row) => [row.batchNumber, row.id]}
                groupingColDef={{
                  headerName: 'Batch Number',
                  width: 160,
                }}
                defaultGroupingExpansionDepth={-1}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default PreprocessingStation;
