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
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import StationAccessGate from '../_shared/components/StationAccessGate';
import { useDryingStation, DRYING_ALLOWED_ROLES } from './hooks/useDryingStation';
import { getDryingColumns, getPendingDryingColumns } from './columns';
import StationErrorBoundary from './components/StationErrorBoundary';
import DryingAreaPanel from './components/DryingAreaPanel';
import MoistureDialog from './components/MoistureDialog';
import MoveBatchDialog from './components/MoveBatchDialog';
import DryingWeightDialog from './components/DryingWeightDialog';
import EnvironmentChartDialog from './components/EnvironmentChartDialog';
import AssignDryingDialog from './components/AssignDryingDialog';
import FinishDryingDialog from './components/FinishDryingDialog';
import WeightDeleteConfirmDialog from './components/WeightDeleteConfirmDialog';

function DryingStationPage() {
  const { data: session, status } = useSession();
  const station = useDryingStation(session);

  const columns = useMemo(
    () =>
      getDryingColumns({
        onDetailsClick: station.handleDetailsClick,
        onMoveClick: station.handleMoveClick,
        onWeightClick: station.handleWeightClick,
        onFinishClick: (row) => {
          station.setSelectedRowForFinish(row);
          station.setFinishDate(new Date().toISOString().slice(0, 10));
          station.setOpenFinishDialog(true);
        },
      }),
    [
      station.handleDetailsClick,
      station.handleMoveClick,
      station.handleWeightClick,
      station.setSelectedRowForFinish,
      station.setFinishDate,
      station.setOpenFinishDialog,
    ]
  );

  const pendingColumns = useMemo(
    () =>
      getPendingDryingColumns((row) => {
        const now = new Date();
        station.setAssignBatch(row.batchNumber);
        station.setAssignArea('');
        station.setAssignDate(now.toISOString().slice(0, 10));
        station.setAssignTime(
          `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        );
        station.setOpenAssignDialog(true);
      }),
    [
      station.setAssignBatch,
      station.setAssignArea,
      station.setAssignDate,
      station.setAssignTime,
      station.setOpenAssignDialog,
    ]
  );

  return (
    <StationAccessGate
      status={status}
      session={session}
      allowedRoles={DRYING_ALLOWED_ROLES}
      deniedMessage="Access Denied"
    >
      <StationErrorBoundary>
        <Grid container spacing={3} sx={{ p: 2 }}>
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Pending Drying
                </Typography>
                <div style={{ height: 500 }}>
                  <DataGrid
                    rows={station.pendingDrying}
                    getRowId={(row) => row.batchNumber}
                    columns={pendingColumns}
                    pageSizeOptions={[100, 200, 500]}
                    slots={{ toolbar: GridToolbar }}
                    sx={{
                      border: '1px solid rgba(0,0,0,0.12)',
                      '& .MuiDataGrid-footerContainer': { borderTop: 'none' },
                    }}
                    rowHeight={40}
                    pagination
                    initialState={{
                      pagination: { paginationModel: { pageSize: 100 } },
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Drying Station
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={station.handleRefreshData}
                  disabled={station.isLoading}
                  startIcon={
                    station.isLoading ? <CircularProgress size={20} color="inherit" /> : null
                  }
                  sx={{ mb: 2 }}
                >
                  {station.isLoading ? 'Refreshing...' : 'Refresh Data'}
                </Button>
                <Grid container spacing={3}>
                  {station.dryingAreas.map((area) => {
                    const deviceId = station.deviceMapping[area];
                    const envData = station.greenhouseData[deviceId] || {
                      temperature: 0,
                      humidity: 0,
                    };
                    return (
                      <Grid item xs={12} key={area}>
                        <DryingAreaPanel
                          area={area}
                          areaData={station.dryingData[area] || []}
                          areaLoading={station.areaLoading[area]}
                          totalWeight={station.areaTotalWeights[area] || 'N/A'}
                          envData={envData}
                          deviceId={deviceId}
                          columns={columns}
                          onEnvDetailsClick={station.handleEnvDetailsClick}
                        />
                      </Grid>
                    );
                  })}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <MoistureDialog
            open={station.openDialog}
            selectedBatch={station.selectedBatch}
            dryingMeasurements={station.dryingMeasurements}
            newMoisture={station.newMoisture}
            onMoistureChange={station.setNewMoisture}
            newMeasurementDate={station.newMeasurementDate}
            onMeasurementDateChange={station.setNewMeasurementDate}
            onAddMoisture={station.handleAddMoisture}
            onClose={station.handleCloseDialog}
          />

          <MoveBatchDialog
            open={station.openMoveDialog}
            selectedBatch={station.selectedBatch}
            dryingAreas={station.dryingAreas}
            newDryingArea={station.newDryingArea}
            onDryingAreaChange={station.setNewDryingArea}
            onClose={station.handleCloseMoveDialog}
            onConfirm={station.handleMoveBatch}
          />

          <DryingWeightDialog
            open={station.openWeightDialog}
            selectedBatch={station.selectedBatch}
            editingWeightId={station.editingWeightId}
            processingTypes={station.processingTypes}
            newProcessingType={station.newProcessingType}
            onProcessingTypeChange={station.handleProcessingTypeChange}
            newProducer={station.newProducer}
            onProducerChange={station.setNewProducer}
            newBagNumber={station.newBagNumber}
            newBagWeight={station.newBagWeight}
            onBagWeightChange={station.setNewBagWeight}
            newWeightDate={station.newWeightDate}
            onWeightDateChange={station.setNewWeightDate}
            onAddOrUpdate={station.handleAddOrUpdateBagWeight}
            totalWeights={station.totalWeights}
            weightMeasurements={station.weightMeasurements}
            newProducerDisplay={station.newProducer}
            formatDateForDisplay={station.formatDateForDisplay}
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
            onClose={station.handleCloseDeleteConfirmDialog}
            onConfirm={station.handleDeleteBagWeights}
          />

          <EnvironmentChartDialog
            open={station.openEnvDialog}
            selectedDevice={station.selectedDevice}
            historicalEnvData={station.historicalEnvData}
            onClose={station.handleCloseEnvDialog}
          />

          <AssignDryingDialog
            open={station.openAssignDialog}
            assignBatch={station.assignBatch}
            assignArea={station.assignArea}
            assignDate={station.assignDate}
            assignTime={station.assignTime}
            dryingAreas={station.dryingAreas}
            onAreaChange={station.setAssignArea}
            onDateChange={station.setAssignDate}
            onTimeChange={station.setAssignTime}
            onClose={() => station.setOpenAssignDialog(false)}
            onConfirm={async () => {
              if (!station.assignArea) {
                station.setSnackbarMessage('Please select drying area');
                station.setSnackbarSeverity('error');
                station.setOpenSnackbar(true);
                return;
              }
              await station.handleAssignDrying(
                station.assignBatch,
                station.assignArea,
                station.assignDate,
                station.assignTime
              );
              station.setOpenAssignDialog(false);
              station.setAssignBatch(null);
              station.setAssignArea('');
            }}
          />

          <FinishDryingDialog
            open={station.openFinishDialog}
            batchNumber={station.selectedRowForFinish?.batchNumber}
            finishDate={station.finishDate}
            minFinishDate={station.selectedRowForFinish?.startDryingDate}
            onDateChange={station.setFinishDate}
            onClose={() => station.setOpenFinishDialog(false)}
            onConfirm={station.handleFinishDrying}
          />

          <Snackbar
            open={station.openSnackbar}
            autoHideDuration={30000}
            onClose={() => {
              station.setOpenSnackbar(false);
              station.setDeletedWeights([]);
            }}
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
      </StationErrorBoundary>
    </StationAccessGate>
  );
}

export default DryingStationPage;
