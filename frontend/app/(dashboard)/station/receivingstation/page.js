"use client";

import { Tabs, Tab, Box, Grid } from '@mui/material';
import { useSession } from 'next-auth/react';
import TabPanel from '../_shared/components/TabPanel';
import StationAccessGate from '../_shared/components/StationAccessGate';
import StationSnackbar from '../_shared/components/StationSnackbar';
import { useReceivingStation, RECEIVING_ALLOWED_ROLES } from './hooks/useReceivingStation';
import CherryReceivingForm from './components/CherryReceivingForm';
import GreenBeanReceivingForm from './components/GreenBeanReceivingForm';
import ReceivingDataPanel from './components/ReceivingDataPanel';
import RecordWeightDialog from './components/RecordWeightDialog';

function ReceivingStation() {
  const { data: session, status } = useSession();
  const station = useReceivingStation(session);
  const rw = station.recordWeight;

  return (
    <StationAccessGate
      status={status}
      session={session}
      allowedRoles={RECEIVING_ALLOWED_ROLES}
    >
      <Box sx={{ width: '100%' }}>
        <Tabs value={station.tabValue} onChange={station.handleTabChange} aria-label="receiving tabs">
          <Tab label="Cherry Receiving" />
          <Tab label="Green Bean Receiving" />
        </Tabs>

        <TabPanel value={station.tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <CherryReceivingForm
                farmerList={station.farmerList}
                selectedFarmerDetails={station.selectedFarmerDetails}
                onFarmerChange={station.handleFarmerChange}
                type={station.type}
                setType={station.setType}
                producer={station.producer}
                setProducer={station.setProducer}
                notes={station.notes}
                setNotes={station.setNotes}
                brix={station.brix}
                setBrix={station.setBrix}
                driverPickupHandoffCode={station.driverPickupHandoffCode}
                setDriverPickupHandoffCode={station.setDriverPickupHandoffCode}
                assigningRFID={station.assigningRFID}
                onSubmit={station.handleSubmit}
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <ReceivingDataPanel
                title="Cherry Receiving Data"
                rows={station.cherryData}
                columns={station.cherryColumns}
                reportDate={station.cherryReportDate}
                onReportDateChange={station.setCherryReportDate}
                onGenerateReport={station.handleGenerateCherryReport}
                reportGenerating={station.cherryReportGenerating}
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={station.tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <GreenBeanReceivingForm
                farmerList={station.farmerList}
                selectedFarmerDetails={station.selectedFarmerDetails}
                onFarmerChange={station.handleFarmerChange}
                type={station.type}
                setType={station.setType}
                producer={station.producer}
                setProducer={station.setProducer}
                processingType={station.processingType}
                setProcessingType={station.setProcessingType}
                grade={station.grade}
                setGrade={station.setGrade}
                price={station.price}
                setPrice={station.setPrice}
                moisture={station.moisture}
                setMoisture={station.setMoisture}
                notes={station.notes}
                setNotes={station.setNotes}
                driverPickupHandoffCode={station.driverPickupHandoffCode}
                setDriverPickupHandoffCode={station.setDriverPickupHandoffCode}
                assigningRFID={station.assigningRFID}
                onSubmit={station.handleSubmit}
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <ReceivingDataPanel
                title="Green Bean Data"
                rows={station.greenBeanData}
                columns={station.greenBeanColumns}
              />
            </Grid>
          </Grid>
        </TabPanel>

        <RecordWeightDialog
          open={rw.dialogOpen}
          batchNumber={rw.selectedBatch?.batchNumber}
          isEdit={rw.selectedBatch && !rw.isPendingWeight(rw.selectedBatch)}
          loading={rw.loading}
          saving={rw.saving}
          bagCountInput={rw.bagCountInput}
          onBagCountInputChange={rw.handleBagCountInputChange}
          onBagCountBlur={rw.handleBagCountBlur}
          bagWeights={rw.bagWeights}
          onBagWeightChange={rw.handleBagWeightChange}
          totalWeight={rw.totalWeight}
          onClose={rw.closeDialog}
          onSave={rw.handleSave}
        />

        <StationSnackbar {...station.snackbar.snackbarProps} />
      </Box>
    </StationAccessGate>
  );
}

export default ReceivingStation;
