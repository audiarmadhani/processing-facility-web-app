'use client';

import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
  Button,
  Typography,
  Snackbar,
  Alert,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  Box,
  InputAdornment,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import StationAccessGate from '../_shared/components/StationAccessGate';
import { useWetMillOrderBook, WETMILL_ALLOWED_ROLES } from './hooks/useWetMillOrderBook';
import { getWetMillColumns } from './columns';
import WeightTrackingDialog from './components/WeightTrackingDialog';
import WeightDeleteConfirmDialog from './components/WeightDeleteConfirmDialog';
import RejectMergeDialog from './components/RejectMergeDialog';

const dataGridSx = {
  maxHeight: 600,
  border: '1px solid rgba(0,0,0,0.12)',
  '& .MuiDataGrid-footerContainer': { borderTop: 'none' },
};

function WetmillStationPage() {
  const { data: session, status } = useSession();
  const station = useWetMillOrderBook(session);
  const columns = useMemo(
    () => getWetMillColumns(station.handleWeightClick),
    [station.handleWeightClick]
  );

  return (
    <StationAccessGate status={status} session={session} allowedRoles={WETMILL_ALLOWED_ROLES}>
      <Grid container spacing={3} sx={{ p: 2 }}>
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Wet Mill Order Book
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={station.handleRefreshData}
                disabled={station.isLoading}
                startIcon={
                  station.isLoading ? <CircularProgress size={20} color="inherit" /> : null
                }
                sx={{ mb: 2, mt: 2 }}
              >
                {station.isLoading ? 'Refreshing...' : 'Refresh Data'}
              </Button>

              <Button
                variant="contained"
                color="error"
                disabled={
                  station.selectedRejectBatches.length === 0 ||
                  station.selectedProducers.length !== 1
                }
                onClick={station.handleOpenRejectMergeDialog}
                sx={{ ml: 2 }}
              >
                Merge Reject
              </Button>

              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Unprocessed and In-Progress Batches
                </Typography>
                <TextField
                  label="Search by Batch Number or Farmer Name"
                  value={station.unprocessedFilter}
                  onChange={(e) => station.setUnprocessedFilter(e.target.value)}
                  fullWidth
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <div style={{ height: 600, width: '100%' }}>
                  <DataGrid
                    rows={station.filteredUnprocessedBatches}
                    columns={columns}
                    pageSizeOptions={[10, 50, 100]}
                    checkboxSelection
                    onRowSelectionModelChange={station.setRowSelectionModel}
                    rowSelectionModel={station.rowSelectionModel}
                    keepNonExistentRowsSelected
                    getRowId={station.getRowId}
                    slots={{ toolbar: GridToolbar }}
                    sx={dataGridSx}
                    rowHeight={35}
                    pagination
                    initialState={{
                      pagination: { paginationModel: { pageSize: 50 } },
                    }}
                  />
                </div>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom>
                  Completed Wet Mill Batches
                </Typography>
                <TextField
                  label="Search by Batch Number or Farmer Name"
                  value={station.completedFilter}
                  onChange={(e) => station.setCompletedFilter(e.target.value)}
                  fullWidth
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <div style={{ height: 600, width: '100%' }}>
                  <DataGrid
                    rows={station.filteredCompletedBatches}
                    columns={columns}
                    pageSizeOptions={[10, 50, 100]}
                    getRowId={station.getBatchRowId}
                    slots={{ toolbar: GridToolbar }}
                    sx={dataGridSx}
                    rowHeight={35}
                    pagination
                    initialState={{
                      pagination: { paginationModel: { pageSize: 50 } },
                    }}
                  />
                </div>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <WeightTrackingDialog
          open={station.openWeightDialog}
          selectedBatch={station.selectedBatch}
          editingWeightId={station.editingWeightId}
          availableProcessingTypes={station.availableProcessingTypes}
          newProcessingType={station.newProcessingType}
          onProcessingTypeChange={station.handleProcessingTypeChange}
          availableProducersForType={station.availableProducersForType}
          newProducer={station.newProducer}
          onProducerChange={station.handleProducerChange}
          newBagNumber={station.newBagNumber}
          newBagWeight={station.newBagWeight}
          onWeightInputChange={station.handleWeightInputChange}
          newWeightDate={station.newWeightDate}
          onWeightDateChange={station.setNewWeightDate}
          onAddOrUpdate={station.handleAddOrUpdateBagWeight}
          totalWeights={station.totalWeights}
          weightMeasurements={station.weightMeasurements}
          selectedWeightIds={station.selectedWeightIds}
          onSelectAllWeights={station.handleSelectAllWeights}
          onSelectWeight={station.handleSelectWeight}
          onOpenDeleteConfirm={station.handleOpenDeleteConfirmDialog}
          onEditBagWeight={station.handleEditBagWeight}
          onDeleteSingle={(id) => {
            station.setSelectedWeightIds([id]);
            station.setOpenDeleteConfirmDialog(true);
          }}
          onClose={station.handleCloseWeightDialog}
        />

        <WeightDeleteConfirmDialog
          open={station.openDeleteConfirmDialog}
          selectedWeightIds={station.selectedWeightIds}
          weightMeasurements={station.weightMeasurements}
          selectedBatch={station.selectedBatch}
          onClose={station.handleCloseDeleteConfirmDialog}
          onConfirm={station.handleDeleteBagWeights}
        />

        <RejectMergeDialog
          open={station.openRejectMergeDialog}
          onClose={() => station.setOpenRejectMergeDialog(false)}
          selectedRejectBatches={station.selectedRejectBatches}
          rejectWeights={station.rejectWeights}
          onRejectWeightChange={(batchNumber, value) =>
            station.setRejectWeights((prev) => ({ ...prev, [batchNumber]: value }))
          }
          totalRejectWeight={station.totalRejectWeight}
          hasEmptyReject={station.hasEmptyReject}
          onConfirm={station.handleConfirmRejectMerge}
        />

        <Snackbar
          open={station.openSnackbar}
          autoHideDuration={6000}
          onClose={() => station.setOpenSnackbar(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity={station.snackbarSeverity}
            sx={{ width: '100%' }}
            action={
              station.deletedWeights.length > 0 ? (
                <Button color="inherit" size="small" onClick={station.handleUndoDelete}>
                  Undo
                </Button>
              ) : null
            }
          >
            {station.snackbarMessage}
          </Alert>
        </Snackbar>
      </Grid>
    </StationAccessGate>
  );
}

export default WetmillStationPage;
