import fs from 'fs';
import path from 'path';

const root = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const logic = fs.readFileSync(path.join(root, 'scripts/_hookLogic.txt'), 'utf8').split('\n');

function range(start, end) {
  return logic.slice(start - 1, end).join('\n');
}

const formBody = [
  range(1, 107),
  range(139, 141),
  range(162, 273),
  range(275, 404),
  range(474, 490),
  range(499, 873),
  range(875, 1015),
].join('\n');

const bookBody = [
  range(108, 130),
  range(406, 472),
  range(492, 497),
  range(1296, 1610),
].join('\n');

const formHook = `'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import {
  API_BASE_URL,
  defaultProcessingTypes,
  producers,
} from '../constants';
import { formatDateTimeLocal } from '../utils/formatDateTimeLocal';
import { generateOrderSheet as generateOrderSheetPdf, generateOrderSheetRow } from '../utils/exportOrderSheet';

export function useFermentationForm(session, notify) {
${formBody}

  const generateOrderSheet = useCallback(() => {
    generateOrderSheetPdf({
      batchNumber, referenceNumber, version, experimentNumber, processingType, description,
      farmerName, type, variety, productLine, preStorage, preFermentationStorageGoal,
      preFermentationStorageStart, preFermentationStorageEnd, prePulped, prePulpedDelva,
      wesorter, preClassifier, cherryType, fermentation, tank, fermentationStarter,
      fermentationStarterAmount, gas, pressure, isSubmerged, totalVolume, stirring,
      fermentationTemperature, pH, fermentationTimeTarget, fermentationStart, postPulped,
      postPulpedDelva, airlock, tankAmount, leachateTarget, brewTankTemperature,
      waterTemperature, coolerTemperature, secondFermentation, secondFermentationTank,
      secondPostPulped, secondPostPulpedDelva, secondWashed, secondStarterType, secondGas,
      secondPressure, secondIsSubmerged, secondTotalVolume, secondTemperature,
      secondFermentationTimeTarget, drying, secondDrying, rehydration,
    });
  }, [
    batchNumber, referenceNumber, version, experimentNumber, processingType, description,
    farmerName, type, variety, productLine, preStorage, preFermentationStorageGoal,
    preFermentationStorageStart, preFermentationStorageEnd, prePulped, prePulpedDelva,
    wesorter, preClassifier, cherryType, fermentation, tank, fermentationStarter,
    fermentationStarterAmount, gas, pressure, isSubmerged, totalVolume, stirring,
    fermentationTemperature, pH, fermentationTimeTarget, fermentationStart, postPulped,
    postPulpedDelva, airlock, tankAmount, leachateTarget, brewTankTemperature,
    waterTemperature, coolerTemperature, secondFermentation, secondFermentationTank,
    secondPostPulped, secondPostPulpedDelva, secondWashed, secondStarterType, secondGas,
    secondPressure, secondIsSubmerged, secondTotalVolume, secondTemperature,
    secondFermentationTimeTarget, drying, secondDrying, rehydration,
  ]);

  const showSnackbar = notify?.showSnackbar || ((msg, sev) => {
    notify?.setSnackbarMessage?.(msg);
    notify?.setSnackbarSeverity?.(sev);
    notify?.setOpenSnackbar?.(true);
  });

  return {
    batchNumber, setBatchNumber,
    referenceNumber, setReferenceNumber,
    version, setVersion,
    fullReferenceNumber,
    experimentNumber, setExperimentNumber,
    processingType, setProcessingType,
    description, setDescription,
    farmerName, setFarmerName,
    type, setType,
    variety, setVariety,
    harvestDate, setHarvestDate,
    harvestAt, setHarvestAt,
    receivedAt, setReceivedAt,
    receivedWeight, setReceivedWeight,
    rejectWeight, setRejectWeight,
    defectWeight, setDefectWeight,
    damagedWeight, setDamagedWeight,
    lostWeight, setLostWeight,
    preprocessingWeight, setPreprocessingWeight,
    quality, setQuality,
    brix, setBrix,
    preStorage, setPreStorage,
    preStorageCondition, setPreStorageCondition,
    preFermentationStorageGoal, setPreFermentationStorageGoal,
    preFermentationStorageStart, setPreFermentationStorageStart,
    preFermentationStorageEnd, setPreFermentationStorageEnd,
    prePulped, setPrePulped,
    prePulpedDelva, setPrePulpedDelva,
    preFermentationTimeAfterPulping, setPreFermentationTimeAfterPulping,
    prePulpedWeight, setPrePulpedWeight,
    cherryType, setCherryType,
    fermentationCherryWeight, setFermentationCherryWeight,
    fermentation, setFermentation,
    tank, setTank,
    fermentationStarter, setFermentationStarter,
    fermentationStarterAmount, setFermentationStarterAmount,
    gas, setGas,
    pressure, setPressure,
    isSubmerged, setIsSubmerged,
    totalVolume, setTotalVolume,
    waterUsed, setWaterUsed,
    starterUsed, setStarterUsed,
    stirring, setStirring,
    fermentationTemperature, setFermentationTemperature,
    pH, setPH,
    fermentationTimeTarget, setFermentationTimeTarget,
    fermentationStart, setFermentationStart,
    fermentationEnd, setFermentationEnd,
    finalPH, setFinalPH,
    finalTDS, setFinalTDS,
    finalTemperature, setFinalTemperature,
    postFermentationWeight, setPostFermentationWeight,
    postPulped, setPostPulped,
    postPulpedDelva, setPostPulpedDelva,
    secondFermentation, setSecondFermentation,
    secondFermentationTank, setSecondFermentationTank,
    secondPostPulped, setSecondPostPulped,
    secondPostPulpedDelva, setSecondPostPulpedDelva,
    secondWashed, setSecondWashed,
    secondFermentationCherryWeight, setSecondFermentationCherryWeight,
    secondFermentationPulpedWeight, setSecondFermentationPulpedWeight,
    secondStarterType, setSecondStarterType,
    secondGas, setSecondGas,
    secondPressure, setSecondPressure,
    secondIsSubmerged, setSecondIsSubmerged,
    secondTotalVolume, setSecondTotalVolume,
    secondWaterUsed, setSecondWaterUsed,
    secondMosstoUsed, setSecondMosstoUsed,
    secondActualVolume, setSecondActualVolume,
    secondTemperature, setSecondTemperature,
    secondFermentationTimeTarget, setSecondFermentationTimeTarget,
    secondFermentationStart, setSecondFermentationStart,
    secondFermentationEnd, setSecondFermentationEnd,
    dryingArea, setDryingArea,
    avgTemperature, setAvgTemperature,
    preDryingWeight, setPreDryingWeight,
    finalMoisture, setFinalMoisture,
    postDryingWeight, setPostDryingWeight,
    dryingStart, setDryingStart,
    dryingEnd, setDryingEnd,
    secondDrying, setSecondDrying,
    secondDryingArea, setSecondDryingArea,
    secondAverageTemperature, setSecondAverageTemperature,
    secondFinalMoisture, setSecondFinalMoisture,
    secondPostDryingWeight, setSecondPostDryingWeight,
    secondDryingStart, setSecondDryingStart,
    secondDryingEnd, setSecondDryingEnd,
    rehydration, setRehydration,
    storage, setStorage,
    storageTemperature, setStorageTemperature,
    hullingTime, setHullingTime,
    bagType, setBagType,
    postHullingWeight, setPostHullingWeight,
    productLine, setProductLine,
    wesorter, setWesorter,
    preClassifier, setPreClassifier,
    airlock, setAirlock,
    tankAmount, setTankAmount,
    leachateTarget, setLeachateTarget,
    leachate, setLeachate,
    brewTankTemperature, setBrewTankTemperature,
    waterTemperature, setWaterTemperature,
    coolerTemperature, setCoolerTemperature,
    drying, setDrying,
    availableBatches,
    availableTanks,
    isLoadingTanks,
    tankError,
    referenceMappings,
    availableProcessingTypes,
    fieldDisabled,
    detailsFieldDisabled,
    isSecondFermentationDisabled,
    isDetailsSecondFermentationDisabled,
    derivedDate,
    formatDateTimeLocal,
    handleBatchNumberChange,
    handleReferenceNumberChange,
    handleProcessingTypeChange,
    handleTankChange,
    handleSubmit,
    resetForm,
    checkExperimentNumber,
    generateOrderSheet,
    generateOrderSheetRow,
    detailsData,
    setDetailsData,
    handleUpdateDetails,
    selectedBatch,
    setSelectedBatch,
    openDetailsDialog,
    setOpenDetailsDialog,
    handleDetailsClick,
    fetchDetailsData,
    fetchAvailableBatches,
    fetchAvailableTanks,
    fetchReferenceMappings,
    fetchFermentationData,
    producers,
  };
}
`;

const bookHook = `'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_BASE_URL, producers, defaultProcessingTypes } from '../constants';
import { downloadFermentationDataExcel } from '../utils/exportFullXlsx';
import { generateOrderSheetRow } from '../utils/exportOrderSheet';

export function useFermentationOrderBook(session, form, snackbar) {
  const {
    setOpenSnackbar,
    setSnackbarMessage,
    setSnackbarSeverity,
    openSnackbar,
    snackbarMessage,
    snackbarSeverity,
  } = snackbar;

  const {
    resetForm,
    fetchAvailableBatches,
    fetchAvailableTanks,
    fetchFermentationData,
    fetchDetailsData,
    setSelectedBatch,
    setOpenDetailsDialog,
    detailsData,
    setDetailsData,
    availableTanks,
    availableProcessingTypes,
    setAvailableProcessingTypes,
    referenceMappings,
    generateOrderSheetRow: generateOrderSheetRowFromForm,
  } = form;

${bookBody}

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return {
    fermentationData,
    tabValue,
    setTabValue,
    openWeightDialog,
    setOpenWeightDialog,
    openFinishDialog,
    setOpenFinishDialog,
    openDetailsDialog,
    setOpenDetailsDialog,
    selectedBatch,
    selectedRow,
    anchorEl,
    weightMeasurements,
    newWeight,
    setNewWeight,
    newProcessingType,
    setNewProcessingType,
    newWeightDate,
    setNewWeightDate,
    newProducer,
    setNewProducer,
    endDateTime,
    setEndDateTime,
    detailsData,
    setDetailsData,
    availableProcessingTypes,
    fermentationColumns,
    handleFinishFermentation,
    handleTrackWeight,
    handleAddWeight,
    handleMenuClick,
    handleMenuClose,
    handleDetailsClick,
    handleDeleteWeight,
    handleDeleteBatch,
    fetchFermentationData,
    downloadFermentationDataExcel,
    generateOrderSheetRow: generateOrderSheetRowFromForm || generateOrderSheetRow,
    calculateElapsedTime,
    openSnackbar,
    snackbarMessage,
    snackbarSeverity,
    handleCloseSnackbar,
    availableTanks,
    referenceMappings,
    isDetailsSecondFermentationDisabled: form.isDetailsSecondFermentationDisabled,
    detailsFieldDisabled: form.detailsFieldDisabled,
    formatDateTimeLocal: form.formatDateTimeLocal,
    checkExperimentNumber: form.checkExperimentNumber,
    handleUpdateDetails: form.handleUpdateDetails,
    fieldDisabled: form.fieldDisabled,
    tankAmount: form.tankAmount,
    setTankAmount: form.setTankAmount,
    leachateTarget: form.leachateTarget,
    setLeachateTarget: form.setLeachateTarget,
    brewTankTemperature: form.brewTankTemperature,
    setBrewTankTemperature: form.setBrewTankTemperature,
    waterTemperature: form.waterTemperature,
    setWaterTemperature: form.setWaterTemperature,
    coolerTemperature: form.coolerTemperature,
    setCoolerTemperature: form.setCoolerTemperature,
    producers,
  };
}
`;

fs.writeFileSync(path.join(root, 'hooks/useFermentationForm.js'), formHook);
fs.writeFileSync(path.join(root, 'hooks/useFermentationOrderBook.js'), bookHook);
console.log('hooks written');
