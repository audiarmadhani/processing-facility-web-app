'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import { Button, Menu, MenuItem, Box, Chip } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import {
  API_BASE_URL,
  defaultProcessingTypes,
  producers,
  BAG_TANK,
  getRowTanks,
  tanksToDisplay,
  normalizeTanksSelection,
  isBarrelOrBucket,
} from '../constants';
import { wideMenuProps as MenuProps } from '../../_shared/constants/menuProps';
import { formatDateTimeLocal } from '../utils/formatDateTimeLocal';
import {
  formatFermentationDisplay,
  getPrimaryFermentationEstimate,
  isFermentationOverdue,
} from '../utils/fermentationDateTime';
import { generateOrderSheet as generateOrderSheetPdf, generateOrderSheetRow as generateOrderSheetRowPdf } from '../utils/exportOrderSheet';
import { resolveCherryQuantity } from '../utils/resolveCherryQuantity';
import { downloadFermentationDataExcel } from '../utils/exportFullXlsx';

export function useFermentationForm(session, { onCheckInSuccess } = {}) {
  const [batchNumber, setBatchNumber] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [version, setVersion] = useState('');
  const fullReferenceNumber =
    referenceNumber && version
      ? `${referenceNumber}-${version}`
      : '';
  const [experimentNumber, setExperimentNumber] = useState('');
  const [processingType, setProcessingType] = useState('');
  const [purpose, setPurpose] = useState('');
  const [description, setDescription] = useState('');
  const [farmerName, setFarmerName] = useState('');
  const [type, setType] = useState('');
  const [variety, setVariety] = useState('');
  const [harvestDate, setHarvestDate] = useState('');
  const [harvestAt, setHarvestAt] = useState('');
  const [receivedAt, setReceivedAt] = useState('');
  const [receivedWeight, setReceivedWeight] = useState('');
  const [rejectWeight, setRejectWeight] = useState('');
  const [defectWeight, setDefectWeight] = useState('');
  const [damagedWeight, setDamagedWeight] = useState('');
  const [lostWeight, setLostWeight] = useState('');
  const [preprocessingWeight, setPreprocessingWeight] = useState('');
  const [cherryWeight, setCherryWeight] = useState(null);
  const [cherryWeightSource, setCherryWeightSource] = useState(null);
  const [cherryWeightLoading, setCherryWeightLoading] = useState(false);
  const [quality, setQuality] = useState('');
  const [brix, setBrix] = useState('');
  const [preStorage, setPreStorage] = useState('');
  const [preStorageCondition, setPreStorageCondition] = useState('');
  const [preFermentationStorageGoal, setPreFermentationStorageGoal] = useState('');
  const [preFermentationStorageStart, setPreFermentationStorageStart] = useState('');
  const [preFermentationStorageEnd, setPreFermentationStorageEnd] = useState('');
  const [prePulped, setPrePulped] = useState('');
  const [prePulpedDelva, setPrePulpedDelva] = useState('');
  const [preFermentationTimeAfterPulping, setPreFermentationTimeAfterPulping] = useState('');
  const [prePulpedWeight, setPrePulpedWeight] = useState('');
  const [cherryType, setCherryType] = useState('');
  const [fermentationCherryWeight, setFermentationCherryWeight] = useState('');
  const [fermentation, setFermentation] = useState('');
  const [tanks, setTanks] = useState([]);
  const [fermentationStarter, setFermentationStarter] = useState('');
  const [fermentationStarterAmount, setFermentationStarterAmount] = useState('');
  const [gas, setGas] = useState('');
  const [pressure, setPressure] = useState('');
  const [isSubmerged, setIsSubmerged] = useState('');
  const [totalVolume, setTotalVolume] = useState('');
  const [waterUsed, setWaterUsed] = useState('');
  const [starterUsed, setStarterUsed] = useState('');
  const [stirring, setStirring] = useState('');
  const [fermentationTemperature, setFermentationTemperature] = useState('');
  const [pH, setPH] = useState('');
  const [fermentationTimeTarget, setFermentationTimeTarget] = useState('');
  const [fermentationStart, setFermentationStart] = useState('');
  const [fermentationEnd, setFermentationEnd] = useState('');
  const [finalPH, setFinalPH] = useState('');
  const [finalTDS, setFinalTDS] = useState('');
  const [finalTemperature, setFinalTemperature] = useState('');
  const [postFermentationWeight, setPostFermentationWeight] = useState('');
  const [postPulped, setPostPulped] = useState('');
  const [postPulpedDelva, setPostPulpedDelva] = useState('');
  const [secondFermentation, setSecondFermentation] = useState('');
  const [secondFermentationTank, setSecondFermentationTank] = useState('');
  const [secondPostPulped, setSecondPostPulped] = useState('');
  const [secondPostPulpedDelva, setSecondPostPulpedDelva] = useState('');
  const [secondWashed, setSecondWashed] = useState('');
  const [secondFermentationCherryWeight, setSecondFermentationCherryWeight] = useState('');
  const [secondFermentationPulpedWeight, setSecondFermentationPulpedWeight] = useState('');
  const [secondStarterType, setSecondStarterType] = useState('');
  const [secondGas, setSecondGas] = useState('');
  const [secondPressure, setSecondPressure] = useState('');
  const [secondIsSubmerged, setSecondIsSubmerged] = useState('');
  const [secondTotalVolume, setSecondTotalVolume] = useState('');
  const [secondWaterUsed, setSecondWaterUsed] = useState('');
  const [secondMosstoUsed, setSecondMosstoUsed] = useState('');
  const [secondActualVolume, setSecondActualVolume] = useState('');
  const [secondTemperature, setSecondTemperature] = useState('');
  const [secondFermentationTimeTarget, setSecondFermentationTimeTarget] = useState('');
  const [secondFermentationStart, setSecondFermentationStart] = useState('');
  const [secondFermentationEnd, setSecondFermentationEnd] = useState('');
  const [dryingArea, setDryingArea] = useState('');
  const [avgTemperature, setAvgTemperature] = useState('');
  const [preDryingWeight, setPreDryingWeight] = useState('');
  const [finalMoisture, setFinalMoisture] = useState('');
  const [postDryingWeight, setPostDryingWeight] = useState('');
  const [dryingStart, setDryingStart] = useState('');
  const [dryingEnd, setDryingEnd] = useState('');
  const [secondDrying, setSecondDrying] = useState('');
  const [secondDryingArea, setSecondDryingArea] = useState('');
  const [secondAverageTemperature, setSecondAverageTemperature] = useState('');
  const [secondFinalMoisture, setSecondFinalMoisture] = useState('');
  const [secondPostDryingWeight, setSecondPostDryingWeight] = useState('');
  const [secondDryingStart, setSecondDryingStart] = useState('');
  const [secondDryingEnd, setSecondDryingEnd] = useState('');
  const [rehydration, setRehydration] = useState('');
  const [storage, setStorage] = useState('');
  const [storageTemperature, setStorageTemperature] = useState('');
  const [hullingTime, setHullingTime] = useState('');
  const [bagType, setBagType] = useState('');
  const [postHullingWeight, setPostHullingWeight] = useState('');
  const [productLine, setProductLine] = useState('N/A');
  const [wesorter, setWesorter] = useState('');
  const [preClassifier, setPreClassifier] = useState('');
  const [airlock, setAirlock] = useState('');
  const [tankAmount, setTankAmount] = useState('');
  const [leachateTarget, setLeachateTarget] = useState('');
  const [leachate, setLeachate] = useState('');
  const [brewTankTemperature, setBrewTankTemperature] = useState('');
  const [waterTemperature, setWaterTemperature] = useState('');
  const [coolerTemperature, setCoolerTemperature] = useState('');
  const [drying, setDrying] = useState('');
  const [fermentationData, setFermentationData] = useState([]);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [availableTanks, setAvailableTanks] = useState([]);
  const [isLoadingTanks, setIsLoadingTanks] = useState(false);
  const [tankError, setTankError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [tabValue, setTabValue] = useState('Biomaster');
  const [estimateNowTick, setEstimateNowTick] = useState(0);
  const [openWeightDialog, setOpenWeightDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [openAssignBatchDialog, setOpenAssignBatchDialog] = useState(false);
  const [assignBatchRow, setAssignBatchRow] = useState(null);
  const [assignBatchNumber, setAssignBatchNumber] = useState('');
  const [openCheckInDialog, setOpenCheckInDialog] = useState(false);
  const [checkInRow, setCheckInRow] = useState(null);
  const [checkInPeriod, setCheckInPeriod] = useState(null);
  const [checkInBusy, setCheckInBusy] = useState(false);
  const checkInWebcamRef = useRef(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [weightMeasurements, setWeightMeasurements] = useState([]);
  const [newWeight, setNewWeight] = useState('');
  const [newProcessingType, setNewProcessingType] = useState('');
  const [newWeightDate, setNewWeightDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [newProducer, setNewProducer] = useState('HQ');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [openFinishDialog, setOpenFinishDialog] = useState(false);
  const [endDateTime, setEndDateTime] = useState(dayjs().format('YYYY-MM-DDTHH:mm:ss'));
  const [detailsData, setDetailsData] = useState({});
  const [referenceMappings, setReferenceMappings] = useState([]);

  const derivedDate = fermentationStart
    ? formatFermentationDisplay(fermentationStart)
    : dayjs().format('DD/MM/YYYY HH:mm:ss');

  const [availableProcessingTypes, setAvailableProcessingTypes] = useState(defaultProcessingTypes);

  const tank = tanksToDisplay(tanks);

  const isCarrybrew = tanks.includes('Carrybrew');
  const isBiomaster = tanks.includes('Biomaster');
  const isBucketOrBB = tanks.some(
    (t) => isBarrelOrBucket(t) || t === BAG_TANK
  );

  const fieldDisabled = {
    // temperature related
    fermentationTemperature: isBucketOrBB,
    brewTankTemperature: isBiomaster || isBucketOrBB,
    waterTemperature: isBiomaster || isBucketOrBB,
    coolerTemperature: isBiomaster || isBucketOrBB,

    // mechanics
    stirring: isBiomaster || isBucketOrBB,
    airlock: isCarrybrew || isBiomaster,
    gas: isBucketOrBB,

    // chemistry
    pH: isCarrybrew || isBucketOrBB,
    leachateTarget: isCarrybrew || isBucketOrBB,

    // capacity
    tankAmount: isBiomaster || isBucketOrBB,
  };

  const detailsTanks = getRowTanks(detailsData);
  const tanksLocked = detailsData.status === 'In Progress';

  const detailsIsCarrybrew = detailsTanks.includes('Carrybrew');
  const detailsIsBiomaster = detailsTanks.includes('Biomaster');
  const detailsIsBucketOrBB = detailsTanks.some(
    (t) => isBarrelOrBucket(t) || t === BAG_TANK
  );

  const detailsFieldDisabled = {
    fermentationTemperature: detailsIsBucketOrBB,
    brewTankTemperature: detailsIsBiomaster || detailsIsBucketOrBB,
    waterTemperature: detailsIsBiomaster || detailsIsBucketOrBB,
    coolerTemperature: detailsIsBiomaster || detailsIsBucketOrBB,
    stirring: detailsIsBiomaster || detailsIsBucketOrBB,
    airlock: detailsIsCarrybrew || detailsIsBiomaster,
    gas: detailsIsBucketOrBB,
    pH: detailsIsCarrybrew || detailsIsBucketOrBB,
    leachateTarget: detailsIsCarrybrew || detailsIsBucketOrBB,
    tankAmount: detailsIsBiomaster || detailsIsBucketOrBB,
  };

  const isSecondFermentationDisabled = secondFermentation === 'no';

  const isDetailsSecondFermentationDisabled =
  detailsData.secondFermentation === 'no';

  const fetchAvailableBatches = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/fermentation/available-batches`);
      const data = Array.isArray(response.data) ? response.data : response.data ? [response.data] : [];
      if (data.length === 0) {
        console.warn('fetchAvailableBatches: No batch data received:', response.data);
        setAvailableBatches([]);
        setSnackbarMessage('No batches available.');
        setSnackbarSeverity('warning');
        setOpenSnackbar(true);
        return;
      }
      setAvailableBatches(data);
    } catch (error) {
      console.error('Error fetching available batches:', error, 'Response:', error.response);
      setSnackbarMessage('Failed to fetch available batches.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      setAvailableBatches([]);
    }
  };

  const fetchReferenceMappings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/reference-mappings`);
      const data = Array.isArray(response.data) ? response.data : response.data ? [response.data] : [];
      setReferenceMappings(data);
    } catch (error) {
      console.error('Error fetching reference mappings:', error, 'Response:', error.response);
      setSnackbarMessage(error.response?.data?.error || 'Failed to fetch reference mappings.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      setReferenceMappings([]);
    }
  };

  const checkExperimentNumber = async (overrideExperiment, overrideExcludeId) => {
    const exp = overrideExperiment ?? experimentNumber;
    if (!exp) return true;

    const excludeId = overrideExcludeId ?? editingEntryId ?? detailsData?.id ?? selectedBatch?.id;
    const params = new URLSearchParams({ experimentNumber: exp });
    if (excludeId) params.set('excludeId', String(excludeId));

    const res = await fetch(
      `${API_BASE_URL}/api/fermentation/check-experiment?${params.toString()}`
    );

    const data = await res.json();

    if (data.exists) {
      alert('Experiment number already exists');
      return false;
    }

    return true;
  };

  const fetchAvailableTanks = async () => {
    setIsLoadingTanks(true);
    try {
      const excludeId = editingEntryId || detailsData?.id;
      const params = excludeId ? { excludeFermentationId: excludeId } : {};
      const response = await axios.get(`${API_BASE_URL}/api/fermentation/available-tanks`, { params });
      if (!Array.isArray(response.data)) {
        console.error('fetchAvailableTanks: Expected array, got:', response.data);
        setAvailableTanks([]);
        setTankError('Invalid tank data received. Please try again.');
        setSnackbarMessage('Failed to fetch available tanks.');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
        return;
      }
      const keepSelected = [...new Set([...tanks, ...detailsTanks])];
      setAvailableTanks([...new Set([...response.data, ...keepSelected])]);
      setTankError(null);
    } catch (error) {
      console.error('Error fetching available tanks:', error, 'Response:', error.response);
      setSnackbarMessage('Failed to fetch available tanks.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      setAvailableTanks([]);
      setTankError('Unable to load tank availability. Please try again.');
    } finally {
      setIsLoadingTanks(false);
    }
  };

  const fetchFermentationData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/fermentation`);
      if (!Array.isArray(response.data)) {
        console.error('fetchFermentationData: Expected array, got:', response.data);
        setFermentationData([]);
        setSnackbarMessage('Invalid fermentation data received.');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
        return;
      }
      setFermentationData(response.data.map((row) => ({ ...row })));
    } catch (error) {
      console.error('Error fetching fermentation data:', error, 'Response:', error.response);
      setSnackbarMessage('Failed to fetch fermentation data. Please try again.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      setFermentationData([]);
    }
  };

  const fetchWeightMeasurements = async (batchNumber) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/fermentation-weight-measurements/${batchNumber}`);
      if (response.data) {
        const dataArray = Array.isArray(response.data) ? response.data : [response.data];
        setWeightMeasurements(dataArray);
      } else {
        console.error('fetchWeightMeasurements: No data received:', response.data);
        setWeightMeasurements([]);
        setSnackbarMessage('Invalid weight measurements received.');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error fetching weight measurements:', error, 'Response:', error.response);
      setSnackbarMessage('Failed to fetch weight measurements.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      setWeightMeasurements([]);
    }
  };

  const fetchPreprocessingData = async (batchNumber) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/preprocessing/${batchNumber}`);
      if (response.data && Array.isArray(response.data.preprocessingData)) {
        const uniqueProcessingTypes = [...new Set(response.data.preprocessingData.map(item => item.processingType))];
        setAvailableProcessingTypes(uniqueProcessingTypes.length > 0 ? uniqueProcessingTypes : defaultProcessingTypes);
        if (uniqueProcessingTypes.length > 0 && !newProcessingType) {
          setNewProcessingType(uniqueProcessingTypes[0]);
        }
      } else {
        console.error('fetchPreprocessingData: Expected preprocessingData array, got:', response.data);
        setAvailableProcessingTypes(defaultProcessingTypes);
        setSnackbarMessage('Invalid preprocessing data received. Using default processing types.');
        setSnackbarSeverity('warning');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error fetching preprocessing data:', error, 'Response:', error.response);
      setAvailableProcessingTypes(defaultProcessingTypes);
      setSnackbarMessage('Failed to fetch preprocessing data. Using default processing types.');
      setSnackbarSeverity('warning');
      setOpenSnackbar(true);
    }
  };

  const fetchDetailsData = async (rowOrBatch, referenceNumber, experimentNumber) => {
    try {
      const isRow = rowOrBatch && typeof rowOrBatch === 'object';
      const batchNumber = isRow ? rowOrBatch.batchNumber : rowOrBatch;
      const entryId = isRow ? rowOrBatch.id : null;

      if (entryId && !batchNumber) {
        const response = await axios.get(`${API_BASE_URL}/api/fermentation/details/id/${entryId}`);
        const raw = response.data?.[0] || {};
        const rowTanks = getRowTanks(raw);
        setDetailsData({ ...raw, tanks: rowTanks, tank: tanksToDisplay(rowTanks) });
        await loadCherryWeight(null);
        return;
      }

      const queryParams = new URLSearchParams();
      if (referenceNumber) queryParams.append('referenceNumber', referenceNumber);
      if (experimentNumber) queryParams.append('experimentNumber', experimentNumber);

      const response = await axios.get(
        `${API_BASE_URL}/api/fermentation/details/${batchNumber}?${queryParams.toString()}`
      );

      const raw = response.data?.[0] || {};
      const rowTanks = getRowTanks(raw);
      const data = { ...raw, tanks: rowTanks, tank: tanksToDisplay(rowTanks) };
      setDetailsData(data);
      await loadCherryWeight(batchNumber, data.preprocessingWeight);

    } catch (error) {
      console.error('Error fetching details data:', error);
      setDetailsData({});
      setCherryWeight(null);
      setCherryWeightSource(null);
    }
  };

  const loadCherryWeight = async (batchNumber, preprocessingFallback = null) => {
    if (!batchNumber?.trim()) {
      setCherryWeight(null);
      setCherryWeightSource(null);
      setCherryWeightLoading(false);
      return;
    }

    setCherryWeightLoading(true);
    try {
      const { value, source } = await resolveCherryQuantity(batchNumber, preprocessingFallback);
      setCherryWeight(value);
      setCherryWeightSource(source);
    } catch (error) {
      console.error('Error loading cherry weight:', error);
      setCherryWeight(null);
      setCherryWeightSource(null);
    } finally {
      setCherryWeightLoading(false);
    }
  };

  useEffect(() => {
    fetchFermentationData();
    fetchAvailableBatches();
    fetchAvailableTanks();
    fetchReferenceMappings();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setEstimateNowTick((t) => t + 1);
    }, 60_000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
  if (fieldDisabled.fermentationTemperature) setFermentationTemperature('');
  if (fieldDisabled.pH) setPH('');
  if (fieldDisabled.stirring) setStirring('');
  if (fieldDisabled.airlock) setAirlock('');
  if (fieldDisabled.gas) setGas('');
  if (fieldDisabled.leachateTarget) setLeachateTarget('');
  if (fieldDisabled.tankAmount) setTankAmount('');
  if (fieldDisabled.brewTankTemperature) setBrewTankTemperature('');
  if (fieldDisabled.waterTemperature) setWaterTemperature('');
  if (fieldDisabled.coolerTemperature) setCoolerTemperature('');
}, [tanks]);

useEffect(() => {
  if (secondFermentation === 'no') {
    setSecondFermentationTank('');
    setSecondWashed('');
    setSecondStarterType('');
    setSecondGas('');
    setSecondPressure('');
    setSecondIsSubmerged('');
    setSecondTotalVolume('');
    setSecondWaterUsed('');
    setSecondMosstoUsed('');
    setSecondActualVolume('');
    setSecondTemperature('');
    setSecondFermentationTimeTarget('');
    setSecondFermentationStart('');
    setSecondFermentationEnd('');
  }
}, [secondFermentation]);

  const handleBatchNumberChange = async (newBatchNumber) => {
    setBatchNumber(newBatchNumber);
    if (!newBatchNumber) {
      setCherryWeight(null);
      setCherryWeightSource(null);
      setFarmerName('');
      setType('');
      setVariety('');
      return;
    }

    setCherryWeight(null);
    setCherryWeightSource(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/api/receiving/${newBatchNumber}`);
      const data = Array.isArray(response.data) ? response.data[0] : response.data;
      if (data) {
        setFarmerName((prev) => prev || data.farmerName || '');
        setType((prev) => prev || data.type || '');
        setVariety((prev) => prev || data.variety || '');
        await loadCherryWeight(newBatchNumber);
      } else {
        setSnackbarMessage('No data found for selected batch.');
        setSnackbarSeverity('warning');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error fetching batch details:', error, 'Response:', error.response);
      setSnackbarMessage(error.response?.data?.message || 'Failed to fetch batch details.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  // Add handlers for referenceNumber and processingType linkage
  const handleReferenceNumberChange = (value) => {
    setReferenceNumber(value);
    const selectedMapping = referenceMappings.find(mapping => mapping.referenceNumber === value);
    if (selectedMapping) {
      setProcessingType(selectedMapping.processingType || '');
    } else {
      setProcessingType('');
    }
  };

  const handleProcessingTypeChange = (value) => {
    setProcessingType(value);

    // ❌ REMOVE auto-fill
    // DO NOTHING to referenceNumber
  };

  const handleTanksChange = (_, newValue) => {
    const normalized = normalizeTanksSelection(newValue);
    setTanks(normalized);
    if (!normalized.includes('Carrybrew')) {
      setLeachateTarget('');
      setBrewTankTemperature('');
      setWaterTemperature('');
      setCoolerTemperature('');
    }
  };

  const handleDetailsTanksChange = (_, newValue) => {
    const normalized = normalizeTanksSelection(newValue);
    setDetailsData((prev) => ({
      ...prev,
      tanks: normalized,
      tank: tanksToDisplay(normalized),
    }));
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const toRaw = (value) => {
    return value || null;
  };

  const validateOrderSheetFields = () => {
    if (!referenceNumber || !version || !experimentNumber) {
      setSnackbarMessage('Reference number, version, and experiment number are required.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return false;
    }
    if (!tanks.length) {
      setSnackbarMessage('At least one fermentation tank is required.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return false;
    }
    return true;
  };

  const buildFermentationPayload = () => ({
    batchNumber: batchNumber?.trim() || null,
    referenceNumber,
    version,
    experimentNumber,
    processingType,
    purpose,
    description,
    farmerName: batchNumber ? farmerName : null,
    type: batchNumber ? type : null,
    variety: batchNumber ? variety : null,
    harvestDate: toRaw(harvestDate),
    harvestAt: toRaw(harvestAt),
    receivedAt: toRaw(receivedAt),
    receivedWeight: receivedWeight ? parseFloat(receivedWeight) : null,
    rejectWeight: rejectWeight ? parseFloat(rejectWeight) : null,
    defectWeight: defectWeight ? parseFloat(defectWeight) : null,
    damagedWeight: damagedWeight ? parseFloat(damagedWeight) : null,
    lostWeight: lostWeight ? parseFloat(lostWeight) : null,
    preprocessingWeight: preprocessingWeight ? parseFloat(preprocessingWeight) : null,
    quality: quality ? parseFloat(quality) : null,
    brix: brix ? parseFloat(brix) : null,
    preStorage,
    preStorageCondition,
    preFermentationStorageGoal: preFermentationStorageGoal ? parseFloat(preFermentationStorageGoal) : null,
    preFermentationStorageStart: toRaw(preFermentationStorageStart),
    preFermentationStorageEnd: toRaw(preFermentationStorageEnd),
    prePulped,
    prePulpedDelva,
    preFermentationTimeAfterPulping: preFermentationTimeAfterPulping ? parseFloat(preFermentationTimeAfterPulping) : null,
    prePulpedWeight: prePulpedWeight ? parseFloat(prePulpedWeight) : null,
    cherryType,
    fermentationCherryWeight: fermentationCherryWeight ? parseFloat(fermentationCherryWeight) : null,
    fermentation,
    tanks,
    tank,
    fermentationStarter,
    fermentationStarterAmount: fermentationStarterAmount ? parseFloat(fermentationStarterAmount) : null,
    gas,
    pressure: pressure ? parseFloat(pressure) : null,
    isSubmerged,
    totalVolume: totalVolume ? parseFloat(totalVolume) : null,
    waterUsed: waterUsed ? parseFloat(waterUsed) : null,
    starterUsed: starterUsed ? parseFloat(starterUsed) : null,
    stirring: stirring ? parseFloat(stirring) : null,
    fermentationTemperature,
    pH: pH ? parseFloat(pH) : null,
    fermentationTimeTarget: fermentationTimeTarget ? parseInt(fermentationTimeTarget) : null,
    fermentationStart: toRaw(fermentationStart),
    fermentationEnd: toRaw(fermentationEnd),
    finalPH: finalPH ? parseFloat(finalPH) : null,
    finalTDS: finalTDS ? parseFloat(finalTDS) : null,
    finalTemperature,
    postFermentationWeight: postFermentationWeight ? parseFloat(postFermentationWeight) : null,
    postPulped,
    postPulpedDelva,
    secondFermentation,
    secondFermentationTank,
    secondPostPulped,
    secondPostPulpedDelva,
    secondWashed,
    secondFermentationCherryWeight: secondFermentationCherryWeight ? parseFloat(secondFermentationCherryWeight) : null,
    secondFermentationPulpedWeight: secondFermentationPulpedWeight ? parseFloat(secondFermentationPulpedWeight) : null,
    secondStarterType,
    secondGas,
    secondPressure: secondPressure ? parseFloat(secondPressure) : null,
    secondIsSubmerged,
    secondTotalVolume: secondTotalVolume ? parseFloat(secondTotalVolume) : null,
    secondWaterUsed: secondWaterUsed ? parseFloat(secondWaterUsed) : null,
    secondMosstoUsed: secondMosstoUsed ? parseFloat(secondMosstoUsed) : null,
    secondActualVolume: secondActualVolume ? parseFloat(secondActualVolume) : null,
    secondTemperature,
    secondFermentationTimeTarget: secondFermentationTimeTarget ? parseInt(secondFermentationTimeTarget) : null,
    secondFermentationStart: toRaw(secondFermentationStart),
    secondFermentationEnd: toRaw(secondFermentationEnd),
    dryingArea,
    avgTemperature: avgTemperature ? parseFloat(avgTemperature) : null,
    preDryingWeight: preDryingWeight ? parseFloat(preDryingWeight) : null,
    finalMoisture: finalMoisture ? parseFloat(finalMoisture) : null,
    postDryingWeight: postDryingWeight ? parseFloat(postDryingWeight) : null,
    dryingStart: toRaw(dryingStart),
    dryingEnd: toRaw(dryingEnd),
    secondDrying,
    secondDryingArea,
    secondAverageTemperature: secondAverageTemperature ? parseFloat(secondAverageTemperature) : null,
    secondFinalMoisture: secondFinalMoisture ? parseFloat(secondFinalMoisture) : null,
    secondPostDryingWeight: secondPostDryingWeight ? parseFloat(secondPostDryingWeight) : null,
    secondDryingStart: toRaw(secondDryingStart),
    secondDryingEnd: toRaw(secondDryingEnd),
    rehydration,
    storage,
    storageTemperature: storageTemperature ? parseFloat(storageTemperature) : null,
    hullingTime: toRaw(hullingTime),
    bagType,
    postHullingWeight: postHullingWeight ? parseFloat(postHullingWeight) : null,
    productLine,
    wesorter,
    preClassifier,
    airlock,
    tankAmount: tankAmount ? parseInt(tankAmount) : null,
    leachateTarget: leachateTarget ? parseFloat(leachateTarget) : null,
    leachate: leachate ? parseFloat(leachate) : null,
    brewTankTemperature: brewTankTemperature ? parseFloat(brewTankTemperature) : null,
    waterTemperature: waterTemperature ? parseFloat(waterTemperature) : null,
    coolerTemperature: coolerTemperature ? parseFloat(coolerTemperature) : null,
    drying,
    createdBy: session?.user?.name,
  });

  const submitFermentation = async () => {
    if (!session || !session.user) {
      setSnackbarMessage('No user session found.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    if (!validateOrderSheetFields()) return;

    const isValid = await checkExperimentNumber();
    if (!isValid) return;

    const payload = buildFermentationPayload();

    try {
      const response = await axios.post(`${API_BASE_URL}/api/fermentation`, payload);
      if (response.data?.id) setEditingEntryId(response.data.id);

      const status = response.data?.status;
      if (status === 'Awaiting Batch') {
        setSnackbarMessage('Order sheet saved — awaiting batch assignment.');
      } else {
        setSnackbarMessage(`Fermentation started for batch ${batchNumber} in ${tank || 'assigned tanks'}.`);
      }
      setSnackbarSeverity('success');
      resetForm();
      await fetchFermentationData();
      await fetchAvailableBatches();
      await fetchAvailableTanks();
    } catch (error) {
      console.error('Error submitting fermentation data:', error, 'Response:', error.response);
      setSnackbarMessage(error.response?.data?.error || 'Failed to save fermentation. Please try again.');
      setSnackbarSeverity('error');
    } finally {
      setOpenSnackbar(true);
    }
  };

  const handleStartFermentation = async (e) => {
    e?.preventDefault();
    await submitFermentation();
  };

  const handleSubmit = handleStartFermentation;

  const handleDeleteBatch = async (row) => {
    const batchLabel = row.batchNumber || 'TBD';
    const confirmDelete = window.confirm(
      `Delete order sheet ${batchLabel} (${tanksToDisplay(getRowTanks(row)) || 'No Tank'})?`
    );

    if (!confirmDelete) return;

    try {
      if (row.id) {
        await axios.delete(`${API_BASE_URL}/api/fermentation/id/${row.id}`);
      } else if (row.batchNumber) {
        await axios.delete(
          `${API_BASE_URL}/api/fermentation/${row.batchNumber}`,
          { params: { tank: row.tank || null } }
        );
      } else {
        throw new Error('Cannot delete entry');
      }

      setSnackbarMessage(`Order sheet ${batchLabel} deleted`);
      setSnackbarSeverity('success');

      await fetchFermentationData();
      await fetchAvailableBatches();
    } catch (error) {
      console.error(error);
      setSnackbarMessage(error.response?.data?.error || 'Failed to delete entry');
      setSnackbarSeverity('error');
    } finally {
      setOpenSnackbar(true);
    }
  };

  const resetForm = () => {
    setBatchNumber('');
    setReferenceNumber('');
    setVersion('');
    setExperimentNumber('');
    setProcessingType('');
    setPurpose('');
    setDescription('');
    setFarmerName('');
    setType('');
    setVariety('');
    setHarvestDate('');
    setHarvestAt('');
    setReceivedAt('');
    setReceivedWeight('');
    setRejectWeight('');
    setDefectWeight('');
    setDamagedWeight('');
    setLostWeight('');
    setPreprocessingWeight('');
    setCherryWeight(null);
    setCherryWeightSource(null);
    setCherryWeightLoading(false);
    setQuality('');
    setBrix('');
    setPreStorage('');
    setPreStorageCondition('');
    setPreFermentationStorageGoal('');
    setPreFermentationStorageStart('');
    setPreFermentationStorageEnd('');
    setPrePulped('');
    setPrePulpedDelva('');
    setPreFermentationTimeAfterPulping('');
    setPrePulpedWeight('');
    setCherryType('');
    setFermentationCherryWeight('');
    setFermentation('');
    setTanks([]);
    setFermentationStarter('');
    setFermentationStarterAmount('');
    setGas('');
    setPressure('');
    setIsSubmerged('');
    setTotalVolume('');
    setWaterUsed('');
    setStarterUsed('');
    setStirring('');
    setFermentationTemperature('');
    setPH('');
    setFermentationTimeTarget('');
    setFermentationStart('');
    setFermentationEnd('');
    setFinalPH('');
    setFinalTDS('');
    setFinalTemperature('');
    setPostFermentationWeight('');
    setPostPulped('');
    setPostPulpedDelva('');
    setSecondFermentation('');
    setSecondFermentationTank('');
    setSecondPostPulped('');
    setSecondPostPulpedDelva('');
    setSecondWashed('');
    setSecondFermentationCherryWeight('');
    setSecondFermentationPulpedWeight('');
    setSecondStarterType('');
    setSecondGas('');
    setSecondPressure('');
    setSecondIsSubmerged('');
    setSecondTotalVolume('');
    setSecondWaterUsed('');
    setSecondMosstoUsed('');
    setSecondActualVolume('');
    setSecondTemperature('');
    setSecondFermentationTimeTarget('');
    setSecondFermentationStart('');
    setSecondFermentationEnd('');
    setDryingArea('');
    setAvgTemperature('');
    setPreDryingWeight('');
    setFinalMoisture('');
    setPostDryingWeight('');
    setDryingStart('');
    setDryingEnd('');
    setSecondDrying('');
    setSecondDryingArea('');
    setSecondAverageTemperature('');
    setSecondFinalMoisture('');
    setSecondPostDryingWeight('');
    setSecondDryingStart('');
    setSecondDryingEnd('');
    setRehydration('');
    setStorage('');
    setStorageTemperature('');
    setHullingTime('');
    setBagType('');
    setPostHullingWeight('');
    setProductLine('N/A');
    setWesorter('');
    setPreClassifier('');
    setAirlock('');
    setTankAmount('');
    setLeachateTarget('');
    setBrewTankTemperature('');
    setWaterTemperature('');
    setCoolerTemperature('');
    setDrying('');
    setEditingEntryId(null);
  };

  const handleUpdateDetails = async () => {
    try {
      const payload = {};

      if (detailsData.status !== 'In Progress') {
        const detailTanks = getRowTanks(detailsData);
        if (detailTanks.length) {
          payload.tanks = detailTanks;
        }
      }

      if (selectedBatch?.batchNumber) {
        payload.batchNumber = selectedBatch.batchNumber;
      }

      // -------------------------
      // 🧠 HELPERS
      // -------------------------
      const setIfValid = (key, value) => {
        if (value !== undefined && value !== null && value !== '') {
          payload[key] = value;
        }
      };

      const setNumber = (key, value) => {
        if (value !== undefined && value !== null && value !== '') {
          const num = Number(value);
          if (!isNaN(num)) payload[key] = num;
        }
      };

      const setInt = (key, value) => {
        if (value !== undefined && value !== null && value !== '') {
          const num = parseInt(value);
          if (!isNaN(num)) payload[key] = num;
        }
      };

      const setDate = (key, value) => {
        if (value) {
          payload[key] = value; // store exactly what user inputs
        }
      };

      // -------------------------
      // ✏️ BASIC FIELDS
      // -------------------------
      setIfValid('referenceNumber', detailsData.referenceNumber);
      setInt('version', detailsData.version);
      setIfValid('experimentNumber', detailsData.experimentNumber);
      setIfValid('processingType', detailsData.processingType);
      setIfValid('purpose', detailsData.purpose);
      setIfValid('description', detailsData.description);
      setIfValid('farmerName', detailsData.farmerName);
      setIfValid('type', detailsData.type);
      setIfValid('variety', detailsData.variety);

      // -------------------------
      // 📅 DATES
      // -------------------------
      setDate('harvestAt', detailsData.harvestAt);
      setDate('harvestDate', detailsData.harvestDate);
      setDate('receivedAt', detailsData.receivedAt);
      setDate('fermentationStart', detailsData.fermentationStart);
      setDate('fermentationEnd', detailsData.fermentationEnd);
      setDate('preFermentationStorageStart', detailsData.preFermentationStorageStart);
      setDate('preFermentationStorageEnd', detailsData.preFermentationStorageEnd);

      // -------------------------
      // 🔢 NUMBERS
      // -------------------------
      setNumber('receivedWeight', detailsData.receivedWeight);
      setNumber('rejectWeight', detailsData.rejectWeight);
      setNumber('defectWeight', detailsData.defectWeight);
      setNumber('damagedWeight', detailsData.damagedWeight);
      setNumber('lostWeight', detailsData.lostWeight);
      setNumber('preprocessingWeight', detailsData.preprocessingWeight);
      setNumber('quality', detailsData.quality);
      setNumber('brix', detailsData.brix);

      setNumber('pressure', detailsData.pressure);
      setNumber('totalVolume', detailsData.totalVolume);
      setNumber('waterUsed', detailsData.waterUsed);
      setNumber('starterUsed', detailsData.starterUsed);
      setNumber('stirring', detailsData.stirring);
      setNumber('avgTemperature', detailsData.avgTemperature);
      setNumber('pH', detailsData.pH);
      setNumber('leachateTarget', detailsData.leachateTarget);
      setNumber('leachate', detailsData.leachate);
      setNumber('brewTankTemperature', detailsData.brewTankTemperature);
      setNumber('waterTemperature', detailsData.waterTemperature);
      setNumber('coolerTemperature', detailsData.coolerTemperature);
      setNumber('secondPressure', detailsData.secondPressure);
      setNumber('secondTemperature', detailsData.secondTemperature);

      setInt('fermentationTimeTarget', detailsData.fermentationTimeTarget);
      setInt('secondFermentationTimeTarget', detailsData.secondFermentationTimeTarget);
      setInt('tankAmount', detailsData.tankAmount);

      // -------------------------
      // 🧪 ENUM / TEXT
      // -------------------------
      setIfValid('fermentation', detailsData.fermentation);
      setIfValid('secondFermentation', detailsData.secondFermentation);
      setIfValid('secondFermentationTank', detailsData.secondFermentationTank);
      setIfValid('gas', detailsData.gas);
      setIfValid('secondGas', detailsData.secondGas);
      setIfValid('isSubmerged', detailsData.isSubmerged);
      setIfValid('secondIsSubmerged', detailsData.secondIsSubmerged);
      setIfValid('fermentationStarter', detailsData.fermentationStarter);
      setNumber('fermentationStarterAmount', detailsData.fermentationStarterAmount);

      // -------------------------
      // 🧾 META
      // -------------------------
      payload.createdBy = session.user.name;

      // -------------------------
      // 🚨 NOTHING TO UPDATE
      // -------------------------
      if (Object.keys(payload).length <= 2) {
        setSnackbarMessage('No changes detected.');
        setSnackbarSeverity('warning');
        setOpenSnackbar(true);
        return;
      }

      // -------------------------
      // 🚀 API CALL
      // -------------------------
      const updateUrl = selectedBatch?.id && !selectedBatch?.batchNumber
        ? `${API_BASE_URL}/api/fermentation/details/id/${selectedBatch.id}`
        : `${API_BASE_URL}/api/fermentation/details/${selectedBatch.batchNumber}`;

      await axios.patch(updateUrl, payload);

      const label = selectedBatch.batchNumber || 'TBD';
      setSnackbarMessage(`Details updated for batch ${label}.`);
      setSnackbarSeverity('success');
      setOpenDetailsDialog(false);
      await fetchFermentationData();

    } catch (error) {
      console.error('Error updating fermentation details:', error);
      setSnackbarMessage(
        error.response?.data?.error || 'Failed to update details.'
      );
      setSnackbarSeverity('error');
    } finally {
      setOpenSnackbar(true);
    }
  };

  const generateOrderSheet = async () => {
    let cherryQuantity = cherryWeight;
    if (cherryQuantity == null && batchNumber) {
      const { value, source } = await resolveCherryQuantity(batchNumber, preprocessingWeight || null);
      cherryQuantity = value;
      setCherryWeight(value);
      setCherryWeightSource(source);
    }

    generateOrderSheetPdf({
      batchNumber, referenceNumber, version, experimentNumber, processingType, purpose, description,
      farmerName, type, variety, productLine, preStorage, preFermentationStorageGoal,
      preFermentationStorageStart, preFermentationStorageEnd, prePulped, prePulpedDelva,
      wesorter, preClassifier, cherryType, fermentation, tank, fermentationStarter,
      fermentationStarterAmount, gas, pressure, isSubmerged, totalVolume, stirring,
      fermentationTemperature, pH, fermentationTimeTarget, fermentationStart, postPulped,
      postPulpedDelva, airlock, tankAmount, leachateTarget, brewTankTemperature,
      waterTemperature, coolerTemperature, secondFermentation, secondFermentationTank,
      secondPostPulped, secondPostPulpedDelva, secondWashed, secondStarterType, secondGas,
      secondPressure, secondIsSubmerged, secondTotalVolume, secondTemperature,
      secondFermentationTimeTarget, drying, secondDrying, rehydration, cherryQuantity,
    });
  };

  const generateOrderSheetRow = async (row) => {
    let cherryQuantity = null;
    if (row.batchNumber) {
      const { value } = await resolveCherryQuantity(
        row.batchNumber,
        row.preprocessingWeight ?? null
      );
      cherryQuantity = value;
    }
    generateOrderSheetRowPdf({ ...row, cherryQuantity });
  };

  const handleFinishFermentation = async () => {
    try {
      const endDate = dayjs(endDateTime);
      const startDateObj = dayjs(selectedRow.fermentationStart);
      const endDateObj = dayjs(endDateTime);

      if (endDateObj.isBefore(startDateObj)) {
        setSnackbarMessage('End date cannot be before start date.');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
        return;
      }

      const now = dayjs();
      if (endDateObj.isAfter(now)) {
        setSnackbarMessage('End date cannot be in the future.');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
        return;
      }

      const finishPayload = { fermentationEnd: endDate };
      if (selectedRow.batchNumber) {
        await axios.put(
          `${API_BASE_URL}/api/fermentation/finish/${selectedRow.batchNumber}`,
          finishPayload
        );
      } else if (selectedRow.id) {
        await axios.put(
          `${API_BASE_URL}/api/fermentation/finish/id/${selectedRow.id}`,
          finishPayload
        );
      } else {
        throw new Error('Cannot finish fermentation');
      }

      const label = selectedRow.batchNumber || 'TBD';
      setSnackbarMessage(`Fermentation finished for batch ${label}.`);
      setSnackbarSeverity('success');
      await fetchFermentationData();
      await fetchAvailableBatches();
      await fetchAvailableTanks();
    } catch (error) {
      console.error('Error finishing fermentation:', error, 'Response:', error.response);
      setSnackbarMessage('Failed to finish fermentation. Please try again.');
      setSnackbarSeverity('error');
    } finally {
      setOpenSnackbar(true);
      setOpenFinishDialog(false);
      setAnchorEl(null);
    }
  };

  const handleTrackWeight = async (row) => {
    setSelectedBatch(row);
    await fetchWeightMeasurements(row.batchNumber);
    setNewWeight('');
    setNewWeightDate(dayjs().format('YYYY-MM-DD'));
    setNewProducer('HQ');
    await fetchPreprocessingData(row.batchNumber);
    setOpenWeightDialog(true);
    setAnchorEl(null);
  };

  const handleAddWeight = async () => {
    if (!newWeight || isNaN(newWeight) || parseFloat(newWeight) <= 0) {
      setSnackbarMessage('Enter a valid weight (positive number).');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    if (!newProcessingType) {
      setSnackbarMessage('Select a processing type.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    const selectedDate = new Date(newWeightDate);
    const startDateObj = new Date(selectedBatch.fermentationStart);
    const now = new Date();

    if (isNaN(selectedDate.getTime())) {
      setSnackbarMessage('Invalid measurement date.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    if (selectedDate > now) {
      setSnackbarMessage('Measurement date cannot be in the future.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    if (selectedDate < startDateObj) {
      setSnackbarMessage('Measurement date cannot be before the start date.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    try {
      const payload = {
        batchNumber: selectedBatch.batchNumber,
        processingType: newProcessingType,
        weight: parseFloat(newWeight),
        measurement_date: newWeightDate,
        producer: newProducer,
      };
      const response = await axios.post(`${API_BASE_URL}/api/fermentation-weight-measurement`, payload);
      setWeightMeasurements([...weightMeasurements, response.data.measurement]);
      setNewWeight('');
      setNewProcessingType(availableProcessingTypes[0] || '');
      setNewWeightDate(dayjs().format('YYYY-MM-DD'));
      setNewProducer('HQ');
      setSnackbarMessage('Weight measurement added successfully.');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      await fetchFermentationData();
    } catch (error) {
      console.error('Error adding weight measurement:', error, 'Response:', error.response);
      setSnackbarMessage(error.response?.data?.error || 'Failed to add weight measurement.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  const handleMenuClick = (event, row) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const handleDetailsClick = async (row) => {
    setSelectedBatch(row);
    handleMenuClose();

    try {
      await fetchDetailsData(row);
      setOpenDetailsDialog(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignBatchClick = (row) => {
    setAssignBatchRow(row);
    setAssignBatchNumber('');
    setOpenAssignBatchDialog(true);
    handleMenuClose();
    fetchAvailableBatches();
  };

  const handleCloseAssignBatchDialog = () => {
    setOpenAssignBatchDialog(false);
    setAssignBatchRow(null);
    setAssignBatchNumber('');
  };

  const handleConfirmAssignBatch = async () => {
    if (!assignBatchRow?.id || !assignBatchNumber) return;

    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/fermentation/${assignBatchRow.id}/assign-batch`,
        { batchNumber: assignBatchNumber }
      );

      const newStatus = response.data?.status;
      setSnackbarMessage(
        newStatus === 'In Progress'
          ? `Batch ${assignBatchNumber} assigned — fermentation now in progress.`
          : `Batch ${assignBatchNumber} assigned successfully.`
      );
      setSnackbarSeverity('success');
      handleCloseAssignBatchDialog();
      await fetchFermentationData();
      await fetchAvailableBatches();
      await fetchAvailableTanks();
    } catch (error) {
      console.error('Error assigning batch:', error);
      setSnackbarMessage(error.response?.data?.error || 'Failed to assign batch.');
      setSnackbarSeverity('error');
    } finally {
      setOpenSnackbar(true);
    }
  };

  const rowHasBatch = (row) => Boolean(row.batchNumber?.trim());

  const handleCheckInClick = async (row, periodOverride) => {
    handleMenuClose();

    let period = periodOverride;
    if (!period) {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/fermentation/check-ins/pending`);
        const activePeriod = response.data?.activePeriod;
        const dueForRow = [...(response.data?.pending || []), ...(response.data?.overdue || [])]
          .find((item) => item.id === row.id);
        period = dueForRow?.missingPeriod || activePeriod;
      } catch (error) {
        console.error('Error resolving check-in period:', error);
      }
    }

    if (!period) {
      setSnackbarMessage('Check-in is only available during morning (06:00–12:00 WITA) or evening (17:00–21:00 WITA) windows.');
      setSnackbarSeverity('warning');
      setOpenSnackbar(true);
      return;
    }

    setCheckInRow(row);
    setCheckInPeriod(period);
    setOpenCheckInDialog(true);
  };

  const handleCloseCheckInDialog = () => {
    if (checkInBusy) return;
    setOpenCheckInDialog(false);
    setCheckInRow(null);
    setCheckInPeriod(null);
  };

  const handleSubmitCheckIn = async ({ notes, imageFile, period }) => {
    if (!checkInRow?.id || !imageFile || !session?.user?.name) {
      setSnackbarMessage('Missing check-in data or user session.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    setCheckInBusy(true);
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('batchNumber', checkInRow.batchNumber);
      formData.append('module', 'Fermentation-CheckIn');

      const uploadRes = await axios.post(`${API_BASE_URL}/api/upload-image`, formData);
      const imageUrl = uploadRes.data?.url;
      if (!imageUrl) {
        throw new Error('Upload did not return an image URL');
      }

      await axios.post(`${API_BASE_URL}/api/fermentation/${checkInRow.id}/check-in`, {
        notes,
        imageUrl,
        period,
        createdBy: session.user.name,
      });

      setSnackbarMessage(`${period === 'morning' ? 'Morning' : 'Evening'} check-in saved for batch ${checkInRow.batchNumber}.`);
      setSnackbarSeverity('success');
      handleCloseCheckInDialog();
      onCheckInSuccess?.();
    } catch (error) {
      console.error('Error submitting check-in:', error);
      setSnackbarMessage(error.response?.data?.error || 'Failed to save check-in.');
      setSnackbarSeverity('error');
    } finally {
      setCheckInBusy(false);
      setOpenSnackbar(true);
    }
  };

  const statusChipProps = (status) => {
    switch (status) {
      case 'Awaiting Batch':
        return { label: 'Awaiting Batch', color: 'warning', sx: { bgcolor: '#FFE0B2', color: '#E65100' } };
      case 'In Progress':
        return { label: 'In Progress', color: 'info', sx: { bgcolor: '#FFF9C4', color: '#F57F17' } };
      case 'Finished':
        return { label: 'Finished', color: 'success', sx: { bgcolor: '#C8E6C9', color: '#1B5E20' } };
      default:
        return { label: status || 'Unknown', color: 'default' };
    }
  };

  const batchCellStyle = (row) => {
    switch (row.status) {
      case 'Finished':
        return { backgroundColor: '#C8E6C9', color: '#1B5E20' };
      case 'Awaiting Batch':
        return { backgroundColor: '#FFE0B2', color: '#E65100' };
      default:
        if (isFermentationOverdue(row, dayjs())) {
          return { backgroundColor: '#FFCDD2', color: '#B71C1C' };
        }
        return { backgroundColor: '#FFF9C4', color: '#F57F17' };
    }
  };

  const calculateElapsedTime = (row) => {
    const startDate = row?.fermentationStart ?? row?.startDate;
    if (!startDate) return '';

    const start = dayjs(startDate);
    if (!start.isValid()) return '';

    const useActualEnd = row.status === 'Finished' && (row.fermentationEnd ?? row.endDate);
    const end = useActualEnd ? dayjs(row.fermentationEnd ?? row.endDate) : dayjs();
    if (!end.isValid()) return '';

    const diffMs = Math.max(0, end.diff(start));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);

    return `${days}d ${hours}h ${minutes}m`;
  };

  const handleDeleteWeight = async (weight) => {
    console.log('Deleting:', weight);

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/fermentation-weight-measurements`,
        {
          params: {
            id: weight.id,
            batchNumber: weight.batchNumber,
            processingType: weight.processingType,
            measurement_date: dayjs(weight.measurement_date).format('YYYY-MM-DD'),
          },
        }
      );

      console.log(response.data);

      await fetchWeightMeasurements(selectedBatch.batchNumber);

      setSnackbarMessage('Weight deleted successfully');
      setSnackbarSeverity('success');
    } catch (err) {
      console.error(err);

      setSnackbarMessage(
        err.response?.data?.error || 'Failed to delete weight'
      );
      setSnackbarSeverity('error');
    } finally {
      setOpenSnackbar(true);
    }
  };


  const fermentationColumns = useMemo(() => [
    {
      field: 'batchNumber',
      headerName: 'Batch Number',
      width: 220,
      renderCell: ({ row }) => {
        const displayBatch = row.batchNumber || 'TBD';
        const cellStyle = batchCellStyle(row);

        return (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              px: 1.5,
              fontWeight: 600,
              borderRadius: 0,
              ...cellStyle,
            }}
          >
            {displayBatch}
          </Box>
        );
      },
    },
    { field: 'referenceNumber', headerName: 'Reference Number', width: 180 },
    { field: 'version', headerName: 'Version', width: 100 },
    { field: 'experimentNumber', headerName: 'Experiment Number', width: 180 },
    { field: 'processingType', headerName: 'Processing Type', width: 180 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: ({ row }) => (
        <>
          <Button
            variant="contained"
            size="small"
            endIcon={<ArrowDropDownIcon />}
            aria-controls={`actions-menu-${row.id}`}
            aria-haspopup="true"
            onClick={(event) => handleMenuClick(event, row)}
          >
            Action
          </Button>
          <Menu
            id={`actions-menu-${row.id}`}
            anchorEl={anchorEl}
            open={Boolean(anchorEl) && selectedRow?.id === row.id}
            onClose={handleMenuClose}
            MenuListProps={{
              'aria-labelledby': `actions-button-${row.id}`,
            }}
          >
            <MenuItem
              onClick={() => handleTrackWeight(row)}
              disabled={!rowHasBatch(row)}
            >
              Track Weight
            </MenuItem>

            <MenuItem
              onClick={() => handleCheckInClick(row)}
              disabled={!rowHasBatch(row) || row.status !== 'In Progress'}
            >
              Check in
            </MenuItem>

            {!rowHasBatch(row) && row.status === 'Awaiting Batch' && (
              <MenuItem onClick={() => handleAssignBatchClick(row)}>
                Assign Batch
              </MenuItem>
            )}

            <MenuItem
              onClick={() => {
                setEndDateTime(dayjs().format('YYYY-MM-DDTHH:mm:ss'));
                setOpenFinishDialog(true);
              }}
              disabled={!rowHasBatch(row) || row.status !== 'In Progress'}
            >
              Finish
            </MenuItem>

            <MenuItem onClick={() => handleDetailsClick(row)}>
              Details
            </MenuItem>

            <MenuItem
              onClick={async () => {
                await generateOrderSheetRow(row);
                handleMenuClose();
              }}
            >
              Generate Order Sheet
            </MenuItem>

            <MenuItem
              onClick={() => {
                downloadFermentationDataExcel(row);
                handleMenuClose();
              }}
            >
              Download Data
            </MenuItem>

            <MenuItem
              onClick={() => {
                handleDeleteBatch(row);
                handleMenuClose();
              }}
              disabled={row.status === 'In Progress'}
              sx={{ color: 'error.main' }}
            >
              Delete
            </MenuItem>
          </Menu>
        </>
      ),
    },
    {
      field: 'tank',
      headerName: 'Tank',
      width: 220,
      valueGetter: (value, row) => tanksToDisplay(getRowTanks(row)) || value || '',
    },
    {
      field: 'description',
      headerName: 'Description',
      minWidth: 250
    },
    {
      field: 'elapsedTime',
      headerName: 'Elapsed Time',
      width: 130,
      renderCell: ({ row }) => calculateElapsedTime(row),
    },
    {
      field: 'estimatedEnd',
      headerName: 'Estimated End',
      width: 180,
      sortable: false,
      renderCell: ({ row }) => {
        const { endDisplay } = getPrimaryFermentationEstimate(row, dayjs());
        return endDisplay;
      },
    },
    {
      field: 'estimatedRemaining',
      headerName: 'Time Remaining',
      width: 150,
      sortable: false,
      renderCell: ({ row }) => {
        const { remainingDisplay } = getPrimaryFermentationEstimate(row, dayjs());
        return remainingDisplay;
      },
    },
    {
      field: 'fermentationStart',
      headerName: 'Start Date',
      width: 180,
      renderCell: ({ value }) => value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      field: 'fermentationEnd',
      headerName: 'End Date',
      width: 180,
      renderCell: ({ row, value }) => {
        if (row.status !== 'Finished') return '—';
        return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '—';
      },
    },
    { field: 'farmerName', headerName: 'Farmer Name', width: 150 },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: ({ row }) => {
        const chip = statusChipProps(row.status);
        return (
          <Chip
            label={chip.label}
            size="small"
            sx={{ fontWeight: 600, ...chip.sx }}
          />
        );
      },
    },
    { field: 'createdBy', headerName: 'Created By', width: 150 },
  ], [
    estimateNowTick,
    anchorEl,
    selectedRow,
    handleMenuClick,
    handleMenuClose,
    handleTrackWeight,
    handleCheckInClick,
    handleAssignBatchClick,
    handleDetailsClick,
    generateOrderSheetRow,
    downloadFermentationDataExcel,
    handleDeleteBatch,
    rowHasBatch,
    setEndDateTime,
    setOpenFinishDialog,
  ]);

  return {
    batchNumber, setBatchNumber,
    referenceNumber, setReferenceNumber,
    version, setVersion,
    fullReferenceNumber,
    experimentNumber, setExperimentNumber,
    processingType, setProcessingType,
    purpose, setPurpose,
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
    cherryWeight,
    cherryWeightSource,
    cherryWeightLoading,
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
    tanks, setTanks,
    tank,
    handleTanksChange,
    handleDetailsTanksChange,
    tanksLocked,
    detailsTanks,
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
    editingEntryId,
    openAssignBatchDialog,
    assignBatchRow,
    assignBatchNumber,
    setAssignBatchNumber,
    handleAssignBatchClick,
    handleCloseAssignBatchDialog,
    handleConfirmAssignBatch,
    openCheckInDialog,
    checkInRow,
    checkInPeriod,
    checkInBusy,
    checkInWebcamRef,
    handleCheckInClick,
    handleCloseCheckInDialog,
    handleSubmitCheckIn,
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
    handleTanksChange,
    handleDetailsTanksChange,
    handleSubmit,
    handleStartFermentation,
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
    estimateNowTick,
    getPrimaryFermentationEstimate,
    downloadFermentationDataExcel,
    calculateElapsedTime,
    fetchFermentationData,
    handleCloseSnackbar,
    producers,
    MenuProps,
  };
}
