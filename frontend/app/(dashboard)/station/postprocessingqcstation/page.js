'use client';

import { Box } from '@mui/material';
import { useSession } from 'next-auth/react';
import StationAccessGate from '../_shared/components/StationAccessGate';
import StationSnackbar from '../_shared/components/StationSnackbar';
import { GB_QC_ALLOWED_ROLES } from './constants';
import { useGbQcStation } from './hooks/useGbQcStation';
import GbQcGrids from './components/GbQcGrids';
import GbQcDialog from './components/GbQcDialog';
import GbQcCuppingDialog from './components/GbQcCuppingDialog';
import GbQcCameraDialog from './components/GbQcCameraDialog';
import RecordRoastDialog from './components/RecordRoastDialog';

function PostProcessingQCPage() {
  const { data: session, status } = useSession();
  const station = useGbQcStation(session);

  return (
    <StationAccessGate status={status} session={session} allowedRoles={GB_QC_ALLOWED_ROLES}>
      <Box sx={{ width: '100%' }}>
        <GbQcGrids
          dryingBatches={station.dryingBatches}
          driedBatches={station.driedBatches}
          roastBatches={station.roastBatches}
          readyForQcBatches={station.readyForQcBatches}
          completedQCBatches={station.completedQCBatches}
          isLoading={station.isLoading}
          onRefresh={station.fetchData}
          onRecordRoast={station.handleOpenRecordRoast}
          onOpenCupping={station.handleOpenCupping}
          onOpenGbQc={station.handleOpenGbQc}
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
          isLoading={station.isLoading}
          onClose={station.handleCloseRoastDialog}
          onAddRoast={station.handleAddRoast}
        />

        <GbQcCuppingDialog
          open={station.openCuppingDialog}
          selectedBatch={station.selectedBatch}
          formData={station.formData}
          onFormChange={station.handleFormChange}
          onEditCuppingEntry={station.handleEditCuppingEntry}
          onCancelCuppingEdit={station.handleCancelCuppingEdit}
          onAddCuppingEntry={station.handleAddCuppingEntry}
          onRemoveCuppingEntry={station.handleRemoveCuppingEntry}
          onClose={station.handleCloseCuppingDialog}
          onSave={station.handleSaveCupping}
          saving={station.cuppingSaving}
        />

        <GbQcDialog
          open={station.openQcDialog}
          selectedBatch={station.selectedBatch}
          formData={station.formData}
          onFormChange={station.handleFormChange}
          onClose={station.handleCloseQcDialog}
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
      </Box>
    </StationAccessGate>
  );
}

export default PostProcessingQCPage;
