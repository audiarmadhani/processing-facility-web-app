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

function PostProcessingQCPage() {
  const { data: session, status } = useSession();
  const station = useGbQcStation(session);

  return (
    <StationAccessGate status={status} session={session} allowedRoles={GB_QC_ALLOWED_ROLES}>
      <Grid container spacing={3}>
        <GbQcGrids
          notQcedBatches={station.notQcedBatches}
          completedQCBatches={station.completedQCBatches}
          isLoading={station.isLoading}
          onRefresh={station.fetchData}
          onStartQC={station.handleStartQC}
          onExportPdf={station.handleExportToPDF}
        />

        <GbQcDialog
          open={station.openDialog}
          selectedBatch={station.selectedBatch}
          formData={station.formData}
          onFormChange={station.handleFormChange}
          onClose={station.handleCloseDialog}
          onOpenCamera={() => station.setOpenCamera(true)}
          onSave={station.handleSaveQC}
          onComplete={station.handleSaveQC}
          isFormComplete={station.isFormComplete()}
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
