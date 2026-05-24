'use client';

import { Grid } from '@mui/material';
import { useSession } from 'next-auth/react';
import StationAccessGate from '../_shared/components/StationAccessGate';
import StationSnackbar from '../_shared/components/StationSnackbar';
import { QC_ALLOWED_ROLES } from './constants';
import { useQcStation } from './hooks/useQcStation';
import QcAssessmentForm from './components/QcAssessmentForm';
import { QcPendingGrid, QcCompletedGrid } from './components/QcDataGrid';
import CherryQcCaptureDialog from './components/CherryQcCaptureDialog';

function QCStation() {
  const { data: session, status } = useSession();
  const station = useQcStation(session);

  return (
    <StationAccessGate status={status} session={session} allowedRoles={QC_ALLOWED_ROLES}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <QcAssessmentForm station={station} />
        </Grid>

        <Grid item xs={12} md={8}>
          <QcPendingGrid
            receivingData={station.receivingData}
            onRefresh={station.fetchData}
          />
        </Grid>

        <Grid item xs={12} md={12}>
          <QcCompletedGrid
            qcData={station.qcData}
            onRefresh={station.fetchData}
            onOpenCapture={station.openGridCapture}
          />
        </Grid>
      </Grid>

      <CherryQcCaptureDialog
        open={station.open}
        onClose={station.handleCloseCapture}
        webcamRef={station.webcamRef}
        batchNumber={station.captureBatchNumber}
        busy={station.captureBusy}
        onCaptureFromCamera={station.handleCaptureFromCamera}
        onCaptureFromFile={station.handleCaptureFromFile}
      />

      <StationSnackbar {...station.snackbar.snackbarProps} />
    </StationAccessGate>
  );
}

export default QCStation;
