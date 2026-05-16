'use client';

import { useMemo } from 'react';

/**
 * Order-book view over the shared station state from useFermentationForm.
 * Call useFermentationForm(session) once in page.js, then pass its return value here.
 */
export function useFermentationOrderBook(station) {
  return useMemo(
    () => ({
      fermentationData: station.fermentationData,
      tabValue: station.tabValue,
      setTabValue: station.setTabValue,
      openWeightDialog: station.openWeightDialog,
      setOpenWeightDialog: station.setOpenWeightDialog,
      openFinishDialog: station.openFinishDialog,
      setOpenFinishDialog: station.setOpenFinishDialog,
      openDetailsDialog: station.openDetailsDialog,
      setOpenDetailsDialog: station.setOpenDetailsDialog,
      selectedBatch: station.selectedBatch,
      selectedRow: station.selectedRow,
      anchorEl: station.anchorEl,
      weightMeasurements: station.weightMeasurements,
      newWeight: station.newWeight,
      setNewWeight: station.setNewWeight,
      newProcessingType: station.newProcessingType,
      setNewProcessingType: station.setNewProcessingType,
      newWeightDate: station.newWeightDate,
      setNewWeightDate: station.setNewWeightDate,
      newProducer: station.newProducer,
      setNewProducer: station.setNewProducer,
      endDateTime: station.endDateTime,
      setEndDateTime: station.setEndDateTime,
      availableProcessingTypes: station.availableProcessingTypes,
      fermentationColumns: station.fermentationColumns,
      handleFinishFermentation: station.handleFinishFermentation,
      handleTrackWeight: station.handleTrackWeight,
      handleAddWeight: station.handleAddWeight,
      handleMenuClick: station.handleMenuClick,
      handleMenuClose: station.handleMenuClose,
      handleDetailsClick: station.handleDetailsClick,
      handleDeleteWeight: station.handleDeleteWeight,
      handleDeleteBatch: station.handleDeleteBatch,
      fetchFermentationData: station.fetchFermentationData,
      downloadFermentationDataExcel: station.downloadFermentationDataExcel,
      generateOrderSheetRow: station.generateOrderSheetRow,
      producers: station.producers,
    }),
    [station]
  );
}
