'use client';

import { Grid } from '@mui/material';
import { useSession } from 'next-auth/react';
import StationAccessGate from '../_shared/components/StationAccessGate';
import StationSnackbar from '../_shared/components/StationSnackbar';
import { GB_QC_ALLOWED_ROLES } from './constants';
import { useGbQcStation } from './hooks/useGbQcStation';
import GbQcGrids from './components/GbQcGrids';
import GbQcDialog from './components/GbQcDialog';
import GbQcCameraDialog from './components/GbQcCameraDialog';
import RecordRoastDialog from './components/RecordRoastDialog';

function PostProcessingQCPage() {
  const { data: session, status } = useSession();
  const station = useGbQcStation(session);

  return (
    <StationAccessGate status={status} session={session} allowedRoles={GB_QC_ALLOWED_ROLES}>
      <Grid container spacing={3}>
        <GbQcGrids
          dryingBatches={station.dryingBatches}
          driedBatches={station.driedBatches}
          roastBatches={station.roastBatches}
          readyForQcBatches={station.readyForQcBatches}
          completedQCBatches={station.completedQCBatches}
          isLoading={station.isLoading}
          onRefresh={station.fetchData}
          onRecordRoast={station.handleOpenRecordRoast}
          onStartQC={station.handleStartQC}
          onExportPdf={station.handleExportToPDF}
          readyQcActionAnchorEl={station.readyQcActionAnchorEl}
          readyQcActionRow={station.readyQcActionRow}
          onReadyQcActionMenuOpen={station.handleReadyQcActionMenuOpen}
          onReadyQcActionMenuClose={station.handleReadyQcActionMenuClose}
        />

        <RecordRoastDialog
          open={station.openRoastDialog}
          batch={station.roastTarget}
          roastHistory={station.roastHistory}
          roastedAt={station.roastedAt}
          setRoastedAt={station.setRoastedAt}
          roastProfile={station.roastProfile}
          setRoastProfile={station.setRoastProfile}
          endTemp={station.endTemp}
          setEndTemp={station.setEndTemp}
          firstCrackMinutes={station.firstCrackMinutes}
          setFirstCrackMinutes={station.setFirstCrackMinutes}
          notes={station.roastNotes}
          setNotes={station.setRoastNotes}
          startQcAfter={station.startQcAfterRoast}
          setStartQcAfter={station.setStartQcAfterRoast}
          isLoading={station.isLoading}
          onClose={station.handleCloseRoastDialog}
          onAddRoast={station.handleAddRoast}
        />

        <GbQcDialog
          open={station.openDialog}
          selectedBatch={station.selectedBatch}
          formData={station.formData}
          onFormChange={station.handleFormChange}
          onAddCuppingEntry={station.handleAddCuppingEntry}
          onRemoveCuppingEntry={station.handleRemoveCuppingEntry}
          onClose={station.handleCloseDialog}
          onOpenCamera={() => station.setOpenCamera(true)}
          onSave={station.handleSaveQC}
          onComplete={station.handleSaveQC}
          isFormComplete={station.isFormComplete}
        />

        <GbQcCameraDialog
          open={station.openCamera}
          onClose={() => station.setOpenCamera(false)}
          webcamRef={station.webcamRef}
          onCapture={station.handleCapture}
        />

        <StationSnackbar
          open={station.snackbar.open}
          message={station.snackbar.message}
          severity={station.snackbar.severity}
          onClose={() => station.setSnackbar({ ...station.snackbar, open: false })}
        />
      </Grid>
    </StationAccessGate>
  );
}

export default PostProcessingQCPage;
