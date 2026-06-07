'use client';

import {
  Alert, Box, Button, Card, CardContent, CircularProgress, Collapse, Dialog, DialogActions,
  DialogContent, DialogTitle, Grid, Snackbar, Table, TableBody, TableCell, TableHead,
  TableRow, TextField, Typography,
} from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useState } from 'react';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { useSession } from 'next-auth/react';
import { EnterDryMillDialog, ExitDryMillDialog } from './components/EnterExitDryMillDialog';
import MergeBatchesDialog from './components/MergeBatchesDialog';
import ParentBatchGrid from './components/ParentBatchGrid';
import ProcessSheetEditor from './components/ProcessSheetEditor';
import SampleTrackingDialog from './components/SampleTrackingDialog';
import SubBatchGrid from './components/SubBatchGrid';
import { DRY_MILL_ALLOWED_ROLES, useDryMillData } from './hooks/useDryMillData';

function DryMillStation() {
  const { data: session, status } = useSession();
  const dm = useDryMillData(session);
  const [subBatchesOpen, setSubBatchesOpen] = useState(false);

  const showSnackbar = (message, severity) => {
    dm.setSnackbarMessage(message);
    dm.setSnackbarSeverity(severity);
    dm.setOpenSnackbar(true);
  };

  if (status === 'loading') {
    return <Typography>Loading data...</Typography>;
  }

  if (!session?.user || !DRY_MILL_ALLOWED_ROLES.includes(session.user.role)) {
    return (
      <Typography variant="h6">
        Access Denied. You do not have permission to view this page.
      </Typography>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Dry Mill Station - Active Batches
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Batches awaiting or currently in dry mill. Use Select to choose entered rows for merge.
            </Typography>
            <Box
              sx={{
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                flexWrap: 'wrap',
              }}
            >
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Button
                  variant="contained"
                  onClick={dm.handleRefreshData}
                  disabled={dm.isLoading}
                  startIcon={dm.isLoading ? <CircularProgress size={18} /> : undefined}
                >
                  {dm.isLoading ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Button variant="contained" disabled>
                  Filter
                </Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Button variant="contained" color="primary" disabled size="small">
                  New Batch
                </Button>
                {dm.selectedBatches.length > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    {dm.selectedBatches.length} selected · {dm.totalSelectedWeight.toFixed(2)} kg
                  </Typography>
                )}
                <Button
                  variant="contained"
                  color="primary"
                  onClick={dm.handleOpenMergeDialog}
                  disabled={dm.selectedBatches.length < 2 || dm.isLoading}
                  size="small"
                >
                  Merge
                </Button>
              </Box>
            </Box>
            {dm.sortedParentBatches.length === 0 && !dm.isLoading ? (
              <Typography variant="body1" color="text.secondary" sx={{ py: 3 }}>
                No active or pending dry mill batches.
              </Typography>
            ) : (
              <ParentBatchGrid rows={dm.sortedParentBatches} columns={dm.parentColumns} />
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Sample Overview
            </Typography>
            <DataGrid
              rows={dm.sampleData}
              columns={dm.sampleOverviewColumns}
              initialState={{ pagination: { paginationModel: { pageSize: 100 } } }}
              pageSizeOptions={[10, 50, 100]}
              disableRowSelectionOnClick
              getRowId={(row) => row.id}
              slots={{ toolbar: GridToolbar }}
              autosizeOnMount
              autosizeOptions={{
                includeHeaders: true,
                includeOutliers: true,
                expand: true,
              }}
              rowHeight={35}
              sx={{ height: 400, width: '100%' }}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
              onClick={() => setSubBatchesOpen((o) => !o)}
            >
              <Box>
                <Typography variant="h5">Green Bean Sub-Batches</Typography>
                <Typography variant="body2" color="text.secondary">
                  Reference only — process weights are recorded via Process on each batch above.
                </Typography>
              </Box>
              <Button
                size="small"
                endIcon={subBatchesOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  setSubBatchesOpen((o) => !o);
                }}
              >
                {subBatchesOpen ? 'Hide' : 'Show'}
              </Button>
            </Box>
            <Collapse in={subBatchesOpen}>
              <Box sx={{ mt: 2 }}>
                <SubBatchGrid
                  rows={dm.getSubBatches()}
                  columns={dm.subBatchColumns}
                  dataGridError={dm.dataGridError}
                />
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      </Grid>

      <Dialog open={dm.openDialog} onClose={dm.handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Process batch {dm.selectedBatch?.batchNumber}
        </DialogTitle>
        <DialogContent>
          {dm.selectedBatch && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2">
                {dm.selectedBatch.processingType} · {dm.selectedBatch.producerLabel} ·{' '}
                {dm.selectedBatch.batchType}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Lot: {dm.selectedBatch.lotNumber} · Ref: {dm.selectedBatch.referenceNumber} ·
                Drying weight: {dm.selectedBatch.drying_weight} kg
              </Typography>
            </Box>
          )}
          <ProcessSheetEditor
            active={dm.openDialog}
            selectedBatch={dm.selectedBatch}
            session={session}
            isLoading={dm.isLoading}
            setIsLoading={dm.setIsLoading}
            showSnackbar={showSnackbar}
            logError={dm.logError}
            fetchDryMillData={dm.fetchDryMillData}
            setHasUnsavedChanges={dm.setHasUnsavedChanges}
            onProcessSaved={dm.handleProcessSaved}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mr: 'auto' }}>
            <Button onClick={dm.handleCloseDialog} disabled={dm.isLoading}>
              Close
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => dm.setOpenSampleHistoryDialog(true)}
              disabled={!dm.selectedBatch}
            >
              Sample History
            </Button>
          </Box>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => dm.setOpenCompleteDialog(true)}
            disabled={
              dm.isLoading ||
              !dm.selectedBatch ||
              !['admin', 'manager'].includes(session.user.role)
            }
          >
            Mark Complete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dm.openCompleteDialog} onClose={dm.handleCloseCompleteDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Mark as Processed</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Confirm marking Batch {dm.selectedBatch?.batchNumber} as processed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={dm.handleCloseCompleteDialog} disabled={dm.isLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={dm.handleConfirmComplete}
            disabled={dm.isLoading}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dm.openStorageDialog} onClose={dm.handleCloseStorageDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Storage in Warehouse</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Enter the RFID tag to confirm storage in the warehouse for Batch{' '}
            {dm.selectedBatch?.batchNumber}.
          </Typography>
          <TextField
            label="RFID Tag"
            value={dm.rfid}
            onChange={(e) => dm.setRfid(e.target.value)}
            onKeyPress={dm.handleRfidKeyPress}
            fullWidth
            variant="contained"
            inputRef={dm.rfidInputRef}
            disabled={dm.isLoading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={dm.handleCloseStorageDialog} disabled={dm.isLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={dm.handleConfirmStorage}
            disabled={dm.isLoading}
          >
            Confirm Storage
          </Button>
        </DialogActions>
      </Dialog>

      <SampleTrackingDialog
        open={dm.openSampleTrackingDialog}
        onClose={dm.handleCloseSampleTrackingDialog}
        selectedBatch={dm.selectedBatch}
        sampleDateTaken={dm.sampleDateTaken}
        setSampleDateTaken={dm.setSampleDateTaken}
        sampleWeightTaken={dm.sampleWeightTaken}
        setSampleWeightTaken={dm.setSampleWeightTaken}
        sampleHistory={dm.sampleHistory}
        setSampleHistory={dm.setSampleHistory}
        isLoading={dm.isLoading}
        onAddSample={dm.handleAddSample}
        fetchDryMillData={dm.fetchDryMillData}
        logError={dm.logError}
        setSnackbarMessage={dm.setSnackbarMessage}
        setSnackbarSeverity={dm.setSnackbarSeverity}
        setOpenSnackbar={dm.setOpenSnackbar}
      />

      <Dialog
        open={dm.openSampleHistoryDialog}
        onClose={dm.handleCloseSampleHistoryDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Sample History - Batch {dm.selectedBatch?.batchNumber}</DialogTitle>
        <DialogContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date Taken</TableCell>
                <TableCell>Weight Taken (kg)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dm.sampleHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} align="center">
                    No samples recorded.
                  </TableCell>
                </TableRow>
              ) : (
                dm.sampleHistory.map((sample, index) => (
                  <TableRow key={index}>
                    <TableCell>{new Date(sample.dateTaken).toLocaleDateString()}</TableCell>
                    <TableCell>{parseFloat(sample.weightTaken).toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Typography variant="h6" sx={{ mt: 2 }}>
            Total Sample Weight Taken:{' '}
            {dm.sampleHistory
              .reduce((acc, sample) => acc + parseFloat(sample.weightTaken || 0), 0)
              .toFixed(2)}{' '}
            kg
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={dm.handleCloseSampleHistoryDialog} disabled={dm.isLoading}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <MergeBatchesDialog
        open={dm.openMergeDialog}
        onClose={dm.handleCloseMergeDialog}
        newBatchNumber={dm.newBatchNumber}
        totalSelectedWeight={dm.totalSelectedWeight}
        selectedBatchDetails={dm.mergeSelectedDetails}
        mergeNotes={dm.mergeNotes}
        setMergeNotes={dm.setMergeNotes}
        onMerge={dm.handleMergeBatches}
        isLoading={dm.isLoading}
      />

      <EnterDryMillDialog
        open={dm.openEnterDialog}
        enteredAt={dm.enteredAt}
        setEnteredAt={dm.setEnteredAt}
        onClose={() => {
          dm.setOpenEnterDialog(false);
          dm.setSelectedBatch(null);
        }}
        onSubmit={dm.handleSubmitEnter}
      />

      <ExitDryMillDialog
        open={dm.openExitDialog}
        exitedAt={dm.exitedAt}
        setExitedAt={dm.setExitedAt}
        onClose={() => {
          dm.setOpenExitDialog(false);
          dm.setSelectedBatch(null);
        }}
        onSubmit={dm.handleSubmitExit}
      />

      <Snackbar open={dm.openSnackbar} autoHideDuration={6000} onClose={dm.handleCloseSnackbar}>
        <Alert onClose={dm.handleCloseSnackbar} severity={dm.snackbarSeverity} sx={{ width: '100%' }}>
          {dm.snackbarMessage}
        </Alert>
      </Snackbar>
    </Grid>
  );
}

export default DryMillStation;
