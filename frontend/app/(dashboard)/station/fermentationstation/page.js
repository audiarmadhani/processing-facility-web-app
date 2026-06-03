'use client';

import { Grid } from '@mui/material';
import { useSession } from 'next-auth/react';
import StationAccessGate from '../_shared/components/StationAccessGate';
import StationSnackbar from '../_shared/components/StationSnackbar';
import { FERMENTATION_ALLOWED_ROLES } from './constants';
import { useFermentationForm } from './hooks/useFermentationForm';
import { useFermentationOrderBook } from './hooks/useFermentationOrderBook';
import { useFermentationCheckInReminders } from './hooks/useFermentationCheckInReminders';
import FermentationCreateForm from './components/FermentationCreateForm';
import FermentationOrderBookGrid from './components/FermentationOrderBookGrid';
import CheckInReminderBanner from './components/CheckInReminderBanner';
import AssignBatchDialog from './components/dialogs/AssignBatchDialog';
import CheckInDialog from './components/dialogs/CheckInDialog';
import WeightTrackingDialog from './components/dialogs/WeightTrackingDialog';
import FinishBatchDialog from './components/dialogs/FinishBatchDialog';
import BatchDetailsDialog from './components/dialogs/BatchDetailsDialog';

function FermentationStation() {
  const { data: session, status } = useSession();
  const reminders = useFermentationCheckInReminders();
  const form = useFermentationForm(session, { onCheckInSuccess: reminders.refresh });
  const book = useFermentationOrderBook(form);

  return (
    <StationAccessGate
      status={status}
      session={session}
      allowedRoles={FERMENTATION_ALLOWED_ROLES}
    >
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <CheckInReminderBanner
            reminders={reminders}
            onCheckIn={form.handleCheckInClick}
          />
        </Grid>

        <Grid item xs={12}>
          <FermentationCreateForm form={form} />
        </Grid>

        <Grid item xs={12}>
          <FermentationOrderBookGrid book={book} />
        </Grid>

        <WeightTrackingDialog book={book} form={form} />
        <FinishBatchDialog book={book} form={form} />
        <BatchDetailsDialog form={form} />
        <AssignBatchDialog
          open={form.openAssignBatchDialog}
          row={form.assignBatchRow}
          availableBatches={form.availableBatches}
          assignBatchNumber={form.assignBatchNumber}
          onBatchChange={form.setAssignBatchNumber}
          onClose={form.handleCloseAssignBatchDialog}
          onConfirm={form.handleConfirmAssignBatch}
        />
        <CheckInDialog
          open={form.openCheckInDialog}
          row={form.checkInRow}
          activePeriod={form.checkInPeriod}
          busy={form.checkInBusy}
          webcamRef={form.checkInWebcamRef}
          onClose={form.handleCloseCheckInDialog}
          onSubmit={form.handleSubmitCheckIn}
        />
      </Grid>

      <StationSnackbar
        open={form.openSnackbar}
        message={form.snackbarMessage}
        severity={form.snackbarSeverity}
        onClose={form.handleCloseSnackbar}
      />
    </StationAccessGate>
  );
}

export default FermentationStation;
