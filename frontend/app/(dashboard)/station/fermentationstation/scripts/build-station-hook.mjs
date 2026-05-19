import fs from 'fs';
import path from 'path';

const root = path.dirname(path.dirname(new URL(import.meta.url).pathname));
let body = fs.readFileSync(path.join(root, 'scripts/_hookLogic.txt'), 'utf8');

// Remove moved pieces
body = body.replace(
  /  const formatDateTimeLocal = \(date\) => \{[\s\S]*?  \};\n\n/,
  ''
);
body = body.replace(
  /  const defaultProcessingTypes = \[[\s\S]*?  const \[availableProcessingTypes[\s\S]*?\);\n\n/,
  "  const [availableProcessingTypes, setAvailableProcessingTypes] = useState(defaultProcessingTypes);\n\n"
);
body = body.replace(
  /  const blueBarrelCodes[\s\S]*?  const producers = \['HQ', 'BTM'\];\n\n/,
  ''
);
body = body.replace(
  /  const ITEM_HEIGHT[\s\S]*?  const accordionDetailsSx = \{[\s\S]*?  \};\n\n/,
  ''
);

// Replace generateOrderSheet block with wrapper
body = body.replace(
  /  const generateOrderSheet = \(\) => \{[\s\S]*?  \};\n\n  const generateOrderSheetRow/,
  `  const generateOrderSheet = () => {
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
  };

  const generateOrderSheetRowLocal`
);

body = body.replace(/generateOrderSheetRowLocal/g, 'generateOrderSheetRow');
body = body.replace(
  /  const generateOrderSheetRow = \(row\) => \{[\s\S]*?  \};\n\s*\n  const handleFinishFermentation/,
  '  const handleFinishFermentation'
);

body = body.replace(
  /  const downloadFermentationDataExcel = \(row\) => \{[\s\S]*?  \};\n\n/,
  ''
);

const hook = `'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import {
  API_BASE_URL,
  defaultProcessingTypes,
  producers,
} from '../constants';
import { wideMenuProps as MenuProps } from '../_shared/constants/menuProps';
import { formatDateTimeLocal } from '../utils/formatDateTimeLocal';
import { generateOrderSheet as generateOrderSheetPdf, generateOrderSheetRow } from '../utils/exportOrderSheet';
import { downloadFermentationDataExcel } from '../utils/exportFullXlsx';

export function useFermentationStation(session) {
${body}

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

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
    fermentationData,
    availableBatches,
    availableTanks,
    isLoadingTanks,
    tankError,
    openSnackbar,
    snackbarMessage,
    snackbarSeverity,
    tabValue,
    setTabValue,
    openWeightDialog,
    setOpenWeightDialog,
    openDetailsDialog,
    setOpenDetailsDialog,
    selectedBatch,
    weightMeasurements,
    newWeight,
    setNewWeight,
    newProcessingType,
    setNewProcessingType,
    newWeightDate,
    setNewWeightDate,
    newProducer,
    setNewProducer,
    anchorEl,
    selectedRow,
    openFinishDialog,
    setOpenFinishDialog,
    endDateTime,
    setEndDateTime,
    detailsData,
    setDetailsData,
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
    handleUpdateDetails,
    handleFinishFermentation,
    handleTrackWeight,
    handleAddWeight,
    handleMenuClick,
    handleMenuClose,
    handleDetailsClick,
    handleDeleteWeight,
    handleDeleteBatch,
    fermentationColumns,
    downloadFermentationDataExcel,
    calculateElapsedTime,
    fetchFermentationData,
    handleCloseSnackbar,
    producers,
    MenuProps,
  };
}
`;

fs.writeFileSync(path.join(root, 'hooks/useFermentationStation.js'), hook);

// Form hook - alias export
fs.writeFileSync(
  path.join(root, 'hooks/useFermentationForm.js'),
  `'use client';

export { useFermentationStation as useFermentationForm } from './useFermentationStation';
`
);

fs.writeFileSync(
  path.join(root, 'hooks/useFermentationOrderBook.js'),
  `'use client';

export { useFermentationStation as useFermentationOrderBook } from './useFermentationStation';
`
);

console.log('station hook', hook.split('\n').length, 'lines');
