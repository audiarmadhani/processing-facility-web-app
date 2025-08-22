"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import {
  Typography,
  Grid,
  Button,
  TextField,
  Snackbar,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
  OutlinedInput,
  Tabs,
  Tab,
  Box,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Alert from '@mui/material/Alert';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { jsPDF } from 'jspdf';
import axios from "axios";
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
dayjs.extend(duration);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Makassar');

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://processing-facility-backend.onrender.com';

const FermentationStation = () => {
  const { data: session, status } = useSession();
  const [batchNumber, setBatchNumber] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [experimentNumber, setExperimentNumber] = useState('');
  const [processingType, setProcessingType] = useState('');
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
  const [fermentationTank, setFermentationTank] = useState('');
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
  const [secondFermentation, setSecondFermentation] = useState('');
  const [secondFermentationTank, setSecondFermentationTank] = useState('');
  const [secondWashedDelva, setSecondWashedDelva] = useState('');
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
  const [openWeightDialog, setOpenWeightDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [weightMeasurements, setWeightMeasurements] = useState([]);
  const [newWeight, setNewWeight] = useState('');
  const [newProcessingType, setNewProcessingType] = useState('');
  const [newWeightDate, setNewWeightDate] = useState(dayjs().tz('Asia/Makassar').format('YYYY-MM-DD'));
  const [newProducer, setNewProducer] = useState('HQ');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [openFinishDialog, setOpenFinishDialog] = useState(false);
  const [endDateTime, setEndDateTime] = useState(dayjs().tz('Asia/Makassar').format('YYYY-MM-DDTHH:mm:ss'));
  const [detailsData, setDetailsData] = useState({});
  const [referenceMappings, setReferenceMappings] = useState([]);

  const derivedDate = fermentationStart
    ? dayjs(fermentationStart).tz('Asia/Makassar').format('DD/MM/YYYY HH:mm:ss')
    : dayjs().tz('Asia/Makassar').format('DD/MM/YYYY HH:mm:ss');

  const defaultProcessingTypes = [
    "Aerobic Natural", "Aerobic Pulped Natural", "Aerobic Washed",
    "Anaerobic Natural", "Anaerobic Pulped Natural", "Anaerobic Washed",
    "CM Natural", "CM Pulped Natural", "CM Washed",
    "Natural", "O2 Natural", "O2 Pulped Natural", "O2 Washed",
    "Pulped Natural", "Washed"
  ];
  const [availableProcessingTypes, setAvailableProcessingTypes] = useState(defaultProcessingTypes);

  const blueBarrelCodes = Array.from({ length: 15 }, (_, i) => 
    `BB-HQ-${String(i + 1).padStart(4, '0')}`
  );
  const producers = ['HQ', 'BTM'];

  const ITEM_HEIGHT = 48;
  const ITEM_PADDING_TOP = 8;
  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
        width: 350,
      },
    },
  };

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

  const fetchAvailableTanks = async () => {
    setIsLoadingTanks(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/fermentation/available-tanks`);
      if (!Array.isArray(response.data)) {
        console.error('fetchAvailableTanks: Expected array, got:', response.data);
        setAvailableTanks([]);
        setTankError('Invalid tank data received. Please try again.');
        setSnackbarMessage('Failed to fetch available tanks.');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
        return;
      }
      setAvailableTanks(response.data);
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
      setFermentationData(response.data.map((row, index) => ({ id: index + 1, ...row })));
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

  const fetchDetailsData = async (batchNumber) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/fermentation/details/${batchNumber}`);
      setDetailsData(response.data || {});
    } catch (error) {
      console.error('Error fetching details data:', error, 'Response:', error.response);
      setDetailsData({});
      setSnackbarMessage('Failed to fetch details data.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  useEffect(() => {
    fetchFermentationData();
    fetchAvailableBatches();
    fetchAvailableTanks();
    fetchReferenceMappings();
  }, []);

  const handleBatchNumberChange = async (batchNumber) => {
    setBatchNumber(batchNumber);
    if (!batchNumber) {
      resetForm();
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/api/receiving/${batchNumber}`);
      const data = Array.isArray(response.data) ? response.data[0] : response.data;
      if (data) {
        setFarmerName(data.farmerName || '');
        setType(data.type || '');
      } else {
        setFarmerName('');
        setType('');
        setSnackbarMessage('No data found for selected batch.');
        setSnackbarSeverity('warning');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error fetching batch details:', error, 'Response:', error.response);
      setFarmerName('');
      setType('');
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
    const matchingReferences = referenceMappings.filter(mapping => mapping.processingType === value);
    if (matchingReferences.length > 0) {
      setReferenceNumber(matchingReferences[0].referenceNumber);
    } else {
      setReferenceNumber('');
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!session || !session.user) {
      setSnackbarMessage('No user session found.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    if (!batchNumber || !fermentationTank || !fermentationStart) {
      setSnackbarMessage('batchNumber, fermentationTank, and fermentationStart are required.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    const payload = {
      batchNumber: batchNumber.trim(),
      referenceNumber,
      experimentNumber,
      processingType,
      description,
      farmerName,
      type,
      variety,
      harvestDate,
      harvestAt,
      receivedAt,
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
      preFermentationStorageStart,
      preFermentationStorageEnd,
      prePulped,
      prePulpedDelva,
      preFermentationTimeAfterPulping: preFermentationTimeAfterPulping ? parseFloat(preFermentationTimeAfterPulping) : null,
      prePulpedWeight: prePulpedWeight ? parseFloat(prePulpedWeight) : null,
      cherryType,
      fermentationCherryWeight: fermentationCherryWeight ? parseFloat(fermentationCherryWeight) : null,
      fermentation,
      fermentationTank,
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
      fermentationStart,
      fermentationEnd,
      finalPH: finalPH ? parseFloat(finalPH) : null,
      finalTDS: finalTDS ? parseFloat(finalTDS) : null,
      finalTemperature,
      postFermentationWeight: postFermentationWeight ? parseFloat(postFermentationWeight) : null,
      postPulped,
      secondFermentation,
      secondFermentationTank,
      secondWashedDelva,
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
      secondFermentationStart,
      secondFermentationEnd,
      dryingArea,
      avgTemperature: avgTemperature ? parseFloat(avgTemperature) : null,
      preDryingWeight: preDryingWeight ? parseFloat(preDryingWeight) : null,
      finalMoisture: finalMoisture ? parseFloat(finalMoisture) : null,
      postDryingWeight: postDryingWeight ? parseFloat(postDryingWeight) : null,
      dryingStart,
      dryingEnd,
      secondDrying,
      secondDryingArea,
      secondAverageTemperature: secondAverageTemperature ? parseFloat(secondAverageTemperature) : null,
      secondFinalMoisture: secondFinalMoisture ? parseFloat(secondFinalMoisture) : null,
      secondPostDryingWeight: secondPostDryingWeight ? parseFloat(secondPostDryingWeight) : null,
      secondDryingStart,
      secondDryingEnd,
      rehydration,
      storage,
      storageTemperature: storageTemperature ? parseFloat(storageTemperature) : null,
      hullingTime,
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
      createdBy: session.user.name,
    };

    try {
      await axios.post(`${API_BASE_URL}/api/fermentation`, payload);
      setSnackbarMessage(`Fermentation started for batch ${batchNumber} in ${fermentationTank}.`);
      setSnackbarSeverity('success');
      resetForm();
      await fetchFermentationData();
      await fetchAvailableBatches();
      await fetchAvailableTanks();
    } catch (error) {
      console.error('Error submitting fermentation data:', error, 'Response:', error.response);
      setSnackbarMessage(error.response?.data?.error || 'Failed to start fermentation. Please try again.');
      setSnackbarSeverity('error');
    } finally {
      setOpenSnackbar(true);
    }
  };

  const resetForm = () => {
    setBatchNumber('');
    setReferenceNumber('');
    setExperimentNumber('');
    setProcessingType('');
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
    setFermentationTank('');
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
    setSecondFermentation('');
    setSecondFermentationTank('');
    setSecondWashedDelva('');
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
    setLeachate('');
    setBrewTankTemperature('');
    setWaterTemperature('');
    setCoolerTemperature('');
    setDrying('');
  };

  const handleUpdateDetails = async () => {
    try {
      const payload = {
        batchNumber: selectedBatch.batchNumber,
        referenceNumber: detailsData.referenceNumber || null,
        experimentNumber: detailsData.experimentNumber || null,
        processingType: detailsData.processingType || null,
        description: detailsData.description || null,
        farmerName: detailsData.farmerName || null,
        type: detailsData.type || null,
        variety: detailsData.variety || null,
        harvestDate: detailsData.harvestDate || null,
        harvestAt: detailsData.harvestAt || null,
        receivedAt: detailsData.receivedAt || null,
        receivedWeight: detailsData.receivedWeight ? parseFloat(detailsData.receivedWeight) : null,
        rejectWeight: detailsData.rejectWeight ? parseFloat(detailsData.rejectWeight) : null,
        defectWeight: detailsData.defectWeight ? parseFloat(detailsData.defectWeight) : null,
        damagedWeight: detailsData.damagedWeight ? parseFloat(detailsData.damagedWeight) : null,
        lostWeight: detailsData.lostWeight ? parseFloat(detailsData.lostWeight) : null,
        preprocessingWeight: detailsData.preprocessingWeight ? parseFloat(detailsData.preprocessingWeight) : null,
        quality: detailsData.quality ? parseFloat(detailsData.quality) : null,
        brix: detailsData.brix ? parseFloat(detailsData.brix) : null,
        preStorage: detailsData.preStorage || null,
        preStorageCondition: detailsData.preStorageCondition || null,
        preFermentationStorageGoal: detailsData.preFermentationStorageGoal ? parseFloat(detailsData.preFermentationStorageGoal) : null,
        preFermentationStorageStart: detailsData.preFermentationStorageStart || null,
        preFermentationStorageEnd: detailsData.preFermentationStorageEnd || null,
        prePulped: detailsData.prePulped || null,
        prePulpedDelva: detailsData.prePulpedDelva || null,
        preFermentationTimeAfterPulping: detailsData.preFermentationTimeAfterPulping ? parseFloat(detailsData.preFermentationTimeAfterPulping) : null,
        prePulpedWeight: detailsData.prePulpedWeight ? parseFloat(detailsData.prePulpedWeight) : null,
        cherryType: detailsData.cherryType || null,
        fermentationCherryWeight: detailsData.fermentationCherryWeight ? parseFloat(detailsData.fermentationCherryWeight) : null,
        fermentation: detailsData.fermentation || null,
        fermentationTank: detailsData.fermentationTank || null,
        fermentationStarter: detailsData.fermentationStarter || null,
        fermentationStarterAmount: detailsData.fermentationStarterAmount ? parseFloat(detailsData.fermentationStarterAmount) : null,
        gas: detailsData.gas || null,
        pressure: detailsData.pressure ? parseFloat(detailsData.pressure) : null,
        isSubmerged: detailsData.isSubmerged || null,
        totalVolume: detailsData.totalVolume ? parseFloat(detailsData.totalVolume) : null,
        waterUsed: detailsData.waterUsed ? parseFloat(detailsData.waterUsed) : null,
        starterUsed: detailsData.starterUsed ? parseFloat(detailsData.starterUsed) : null,
        stirring: detailsData.stirring ? parseFloat(detailsData.stirring) : null,
        fermentationTemperature: detailsData.fermentationTemperature || null,
        pH: detailsData.pH ? parseFloat(detailsData.pH) : null,
        fermentationTimeTarget: detailsData.fermentationTimeTarget ? parseInt(detailsData.fermentationTimeTarget) : null,
        fermentationStart: detailsData.fermentationStart || null,
        fermentationEnd: detailsData.fermentationEnd || null,
        finalPH: detailsData.finalPH ? parseFloat(detailsData.finalPH) : null,
        finalTDS: detailsData.finalTDS ? parseFloat(detailsData.finalTDS) : null,
        finalTemperature: detailsData.finalTemperature || null,
        postFermentationWeight: detailsData.postFermentationWeight ? parseFloat(detailsData.postFermentationWeight) : null,
        postPulped: detailsData.postPulped || null,
        secondFermentation: detailsData.secondFermentation || null,
        secondFermentationTank: detailsData.secondFermentationTank || null,
        secondWashedDelva: detailsData.secondWashedDelva || null,
        secondWashed: detailsData.secondWashed || null,
        secondFermentationCherryWeight: detailsData.secondFermentationCherryWeight ? parseFloat(detailsData.secondFermentationCherryWeight) : null,
        secondFermentationPulpedWeight: detailsData.secondFermentationPulpedWeight ? parseFloat(detailsData.secondFermentationPulpedWeight) : null,
        secondStarterType: detailsData.secondStarterType || null,
        secondGas: detailsData.secondGas || null,
        secondPressure: detailsData.secondPressure ? parseFloat(detailsData.secondPressure) : null,
        secondIsSubmerged: detailsData.secondIsSubmerged || null,
        secondTotalVolume: detailsData.secondTotalVolume ? parseFloat(detailsData.secondTotalVolume) : null,
        secondWaterUsed: detailsData.secondWaterUsed ? parseFloat(detailsData.secondWaterUsed) : null,
        secondMosstoUsed: detailsData.secondMosstoUsed ? parseFloat(detailsData.secondMosstoUsed) : null,
        secondActualVolume: detailsData.secondActualVolume ? parseFloat(detailsData.secondActualVolume) : null,
        secondTemperature: detailsData.secondTemperature || null,
        secondFermentationTimeTarget: detailsData.secondFermentationTimeTarget ? parseInt(detailsData.secondFermentationTimeTarget) : null,
        secondFermentationStart: detailsData.secondFermentationStart || null,
        secondFermentationEnd: detailsData.secondFermentationEnd || null,
        dryingArea: detailsData.dryingArea || null,
        avgTemperature: detailsData.avgTemperature ? parseFloat(detailsData.avgTemperature) : null,
        preDryingWeight: detailsData.preDryingWeight ? parseFloat(detailsData.preDryingWeight) : null,
        finalMoisture: detailsData.finalMoisture ? parseFloat(detailsData.finalMoisture) : null,
        postDryingWeight: detailsData.postDryingWeight ? parseFloat(detailsData.postDryingWeight) : null,
        dryingStart: detailsData.dryingStart || null,
        dryingEnd: detailsData.dryingEnd || null,
        secondDrying: detailsData.secondDrying || null,
        secondDryingArea: detailsData.secondDryingArea || null,
        secondAverageTemperature: detailsData.secondAverageTemperature ? parseFloat(detailsData.secondAverageTemperature) : null,
        secondFinalMoisture: detailsData.secondFinalMoisture ? parseFloat(detailsData.secondFinalMoisture) : null,
        secondPostDryingWeight: detailsData.secondPostDryingWeight ? parseFloat(detailsData.secondPostDryingWeight) : null,
        secondDryingStart: detailsData.secondDryingStart || null,
        secondDryingEnd: detailsData.secondDryingEnd || null,
        rehydration: detailsData.rehydration || null,
        storage: detailsData.storage || null,
        storageTemperature: detailsData.storageTemperature ? parseFloat(detailsData.storageTemperature) : null,
        hullingTime: detailsData.hullingTime || null,
        bagType: detailsData.bagType || null,
        postHullingWeight: detailsData.postHullingWeight ? parseFloat(detailsData.postHullingWeight) : null,
        productLine: detailsData.productLine || null,
        wesorter: detailsData.wesorter || null,
        preClassifier: detailsData.preClassifier || null,
        airlock: detailsData.airlock || null,
        tankAmount: detailsData.tankAmount ? parseInt(detailsData.tankAmount) : null,
        leachateTarget: detailsData.leachateTarget ? parseFloat(detailsData.leachateTarget) : null,
        leachate: detailsData.leachate ? parseFloat(detailsData.leachate) : null,
        brewTankTemperature: detailsData.brewTankTemperature ? parseFloat(detailsData.brewTankTemperature) : null,
        waterTemperature: detailsData.waterTemperature ? parseFloat(detailsData.waterTemperature) : null,
        coolerTemperature: detailsData.coolerTemperature ? parseFloat(detailsData.coolerTemperature) : null,
        drying: detailsData.drying || null,
        createdBy: session.user.name,
      };

      await axios.put(`${API_BASE_URL}/api/fermentation/details/${selectedBatch.batchNumber}`, payload);
      setSnackbarMessage(`Details updated for batch ${selectedBatch.batchNumber}.`);
      setSnackbarSeverity('success');
      setOpenDetailsDialog(false);
      await fetchFermentationData();
    } catch (error) {
      console.error('Error updating fermentation details:', error, 'Response:', error.response);
      setSnackbarMessage(error.response?.data?.error || 'Failed to update details. Please try again.');
      setSnackbarSeverity('error');
    } finally {
      setOpenSnackbar(true);
    }
  };

  const generateOrderSheet = () => {
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text('HEQA Fermentation Order Sheet', 20, 20);

    const fermentationEndGoal = fermentationStart && fermentationTimeTarget
      ? dayjs(fermentationStart).tz('Asia/Makassar').add(parseInt(fermentationTimeTarget), 'hour').format('DD/MM/YYYY HH:mm:ss')
      : 'N/A';

    const fields = [
      { label: 'Date', value: derivedDate },
      { label: 'Batch number', value: batchNumber || 'N/A' },
      { label: 'Farmer', value: farmerName || 'N/A' },
      { label: 'Variety', value: variety || 'N/A' },
      { label: 'Product line', value: productLine || 'N/A' },
      { label: 'Experiment', value: experimentNumber || 'N/A' },
      { label: 'Received coffee cherry', value: 'N/A' }, // Second step
      { label: 'Process', value: processingType || 'N/A' },
      { label: 'Pre-fermentation in bag', value: preStorage || 'N/A' },
      { label: 'Pre-fermentation time', value: preFermentationStorageGoal ? `${preFermentationStorageGoal} h` : 'N/A' },
      { label: 'Wesorter', value: wesorter || 'N/A' },
      { label: 'Pre-classifier', value: preClassifier || 'N/A' },
      { label: 'Fermentation', value: fermentation || 'N/A' },
      { label: 'Fermentation tank', value: fermentationTank || 'N/A' },
      { label: 'Airlock', value: airlock || 'N/A' },
      { label: 'Tank amount', value: tankAmount || 'N/A' },
      { label: 'Pulped', value: prePulped || 'N/A' },
      { label: 'Submerged', value: isSubmerged || 'N/A' },
      { label: 'Leachate target', value: leachateTarget ? `${leachateTarget} L` : 'N/A' },
      { label: 'Starter type', value: fermentationStarter || 'N/A' },
      { label: 'Starter target', value: fermentationStarterAmount ? `${fermentationStarterAmount} L` : 'N/A' },
      { label: 'Coffee weight', value: 'N/A' }, // Second step
      { label: 'Water amount', value: 'N/A' }, // Second step
      { label: 'Starter amount', value: 'N/A' }, // Second step
      { label: 'Leachate', value: 'N/A' }, // Second step
      { label: 'Set fermentation time', value: fermentationTimeTarget ? `${fermentationTimeTarget} h` : 'N/A' },
      { label: 'Gas', value: gas || 'N/A' },
      { label: 'Set temperature', value: fermentationTemperature || 'ambient' },
      { label: 'Set temperature/Brew tank', value: brewTankTemperature ? `${brewTankTemperature} °C` : 'N/A' },
      { label: 'Water temperature', value: 'N/A' }, // Second step
      { label: 'Cooler temperature', value: 'N/A' }, // Second step
      { label: 'Set pH', value: pH || 'N/A' },
      { label: 'Set pressure', value: pressure ? `${pressure} psi` : 'N/A' },
      { label: 'Fermentation start', value: 'N/A' }, // Second step
      { label: 'Fermentation end date goal', value: fermentationEndGoal },
      { label: 'Fermentation end date', value: 'N/A' }, // Second step
      { label: 'Post fermentation weight', value: 'N/A' }, // Second step
      { label: 'Post fermentation pulped', value: postPulped || 'N/A' },
      { label: 'Drying', value: drying || 'N/A' },
      { label: 'Drying Area', value: 'N/A' }, // Second step
      { label: 'Special note', value: description || 'N/A' },
    ];

    let y = 30;
    fields.forEach(field => {
      doc.text(`${field.label}: ${field.value}`, 20, y);
      y += 10;
    });

    doc.save(`HEQA_Fermentation_Order_Sheet_${batchNumber || 'Untitled'}.pdf`);
  };

  const handleFinishFermentation = async () => {
    try {
      const endDate = dayjs(endDateTime).tz('Asia/Makassar', true).toISOString();
      const startDateObj = dayjs(selectedRow.fermentationStart).tz('Asia/Makassar');
      const endDateObj = dayjs(endDateTime).tz('Asia/Makassar');

      if (endDateObj.isBefore(startDateObj)) {
        setSnackbarMessage('End date cannot be before start date.');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
        return;
      }

      const now = dayjs().tz('Asia/Makassar');
      if (endDateObj.isAfter(now)) {
        setSnackbarMessage('End date cannot be in the future.');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
        return;
      }

      await axios.put(`${API_BASE_URL}/api/fermentation/finish/${selectedRow.batchNumber}`, { fermentationEnd: endDate });
      setSnackbarMessage(`Fermentation finished for batch ${selectedRow.batchNumber}.`);
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
    setNewWeightDate(dayjs().tz('Asia/Makassar').format('YYYY-MM-DD'));
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
        measurement_date: dayjs(newWeightDate).tz('Asia/Makassar', true).toISOString(),
        producer: newProducer,
      };
      const response = await axios.post(`${API_BASE_URL}/api/fermentation-weight-measurement`, payload);
      setWeightMeasurements([...weightMeasurements, response.data.measurement]);
      setNewWeight('');
      setNewProcessingType(availableProcessingTypes[0] || '');
      setNewWeightDate(dayjs().tz('Asia/Makassar').format('YYYY-MM-DD'));
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
    await fetchDetailsData(row.batchNumber);
    setOpenDetailsDialog(true);
    setAnchorEl(null);
  };

  const calculateElapsedTime = (startDate, endDate) => {
    const start = dayjs.tz(startDate, 'Asia/Makassar');
    const end = endDate ? dayjs.tz(endDate, 'Asia/Makassar') : dayjs.tz();
    const duration = dayjs.duration(end.diff(start));
    const days = Math.floor(duration.asDays());
    const hours = Math.floor(duration.asHours() % 24);
    const minutes = Math.floor(duration.asMinutes() % 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const fermentationColumns = [
    { field: 'batchNumber', headerName: 'Batch Number', width: 180 },
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
            <MenuItem onClick={() => handleTrackWeight(row)}>
              Track Weight
            </MenuItem>
            <MenuItem
              onClick={() => {
                setEndDateTime(dayjs().tz('Asia/Makassar').format('YYYY-MM-DDTHH:mm:ss'));
                setOpenFinishDialog(true);
              }}
              disabled={row.status === 'Finished'}
            >
              Finish
            </MenuItem>
            <MenuItem onClick={() => handleDetailsClick(row)}>
              Details
            </MenuItem>
          </Menu>
        </>
      ),
    },
    { field: 'tank', headerName: 'Tank', width: 140 },
    {
      field: 'elapsedTime',
      headerName: 'Elapsed Time',
      width: 130,
      renderCell: ({ row }) => calculateElapsedTime(row.fermentationStart, row.fermentationEnd),
    },
    {
      field: 'fermentationStart',
      headerName: 'Start Date',
      width: 180,
      renderCell: ({ value }) => value ? dayjs.tz(value, 'Asia/Makassar').format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      field: 'fermentationEnd',
      headerName: 'End Date',
      width: 180,
      renderCell: ({ value }) => value ? dayjs.tz(value, 'Asia/Makassar').format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    { field: 'farmerName', headerName: 'Farmer Name', width: 150 },
    { field: 'status', headerName: 'Status', width: 120 },
    { field: 'createdBy', headerName: 'Created By', width: 150 },
  ];

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  if (!session?.user || !['admin', 'manager', 'staff'].includes(session.user.role)) {
    return (
      <Typography variant="h6">
        Access Denied. You do not have permission to view this page.
      </Typography>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={12}>
          <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
            Fermentation Station Form (First User)
          </Typography>
          {tankError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {tankError}
            </Alert>
          )}
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Cherry Information</Typography>
                    <FormControl fullWidth required sx={{ marginTop: '16px' }}>
                      <InputLabel id="batch-number-label">Batch Number</InputLabel>
                      <Select
                        labelId="batch-number-label"
                        id="batch-number"
                        value={batchNumber}
                        onChange={(e) => handleBatchNumberChange(e.target.value)}
                        input={<OutlinedInput label="Batch Number" />}
                        MenuProps={MenuProps}
                      >
                        {availableBatches.map(batch => (
                          <MenuItem key={batch.batchNumber} value={batch.batchNumber}>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="body1">{batch.batchNumber}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                Farmer: {batch.farmerName}, {batch.weight}kg, Type: {batch.type}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ marginTop: '16px' }}>
                      <InputLabel id="reference-number-label">Reference Number</InputLabel>
                      <Select
                        labelId="reference-number-label"
                        value={referenceNumber}
                        onChange={(e) => handleReferenceNumberChange(e.target.value)}
                        input={<OutlinedInput label="Reference Number" />}
                        MenuProps={MenuProps}
                      >
                        {referenceMappings
                          .filter(mapping => !processingType || mapping.processingType === processingType)
                          .map(mapping => (
                            <MenuItem key={mapping.id} value={mapping.referenceNumber}>
                              {mapping.referenceNumber}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth required sx={{ marginTop: '16px' }}>
                      <InputLabel id="processing-type-label">Processing Type</InputLabel>
                      <Select
                        labelId="processing-type-label"
                        value={processingType}
                        onChange={(e) => handleProcessingTypeChange(e.target.value)}
                        input={<OutlinedInput label="Processing Type" />}
                        MenuProps={MenuProps}
                      >
                        {[...new Set(referenceMappings.map(mapping => mapping.processingType))].map(type => (
                          <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField
                      label="Experiment Number"
                      type="number"
                      value={experimentNumber}
                      onChange={(e) => setExperimentNumber(e.target.value)}
                      fullWidth
                      required
                      margin="normal"
                    />

                    <TextField
                      label="Description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      fullWidth
                      margin="normal"
                    />

                    <TextField
                      label="Farmer Name"
                      value={farmerName}
                      disabled
                      fullWidth
                      margin="normal"
                    />

                    <TextField
                      label="Type"
                      value={type}
                      disabled
                      fullWidth
                      margin="normal"
                    />

                    <FormControl fullWidth required sx={{ marginTop: '16px' }}>
                      <InputLabel id="variety-label">Variety</InputLabel>
                      <Select
                        labelId="variety-label"
                        value={variety}
                        onChange={(e) => setVariety(e.target.value)}
                        input={<OutlinedInput label="Variety" />}
                        MenuProps={MenuProps}
                      >
                        <MenuItem value="cobra">Cobra</MenuItem>
                        <MenuItem value="yellow caturra">Yellow Caturra</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      label="Product Line"
                      value={productLine}
                      onChange={(e) => setProductLine(e.target.value)}
                      fullWidth
                      margin="normal"
                      placeholder="Enter product line or N/A"
                    />

                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Pre-Fermentation Section</Typography>

                    <TextField
                      label="Pre-Fermentation Storage Goal (h)"
                      type="number"
                      value={preFermentationStorageGoal}
                      onChange={(e) => setPreFermentationStorageGoal(e.target.value)}
                      fullWidth
                      margin="normal"
                    />

                    <FormControl fullWidth sx={{ marginTop: '16px' }}>
                      <InputLabel id="pre-pulped-label">Pre-pulped</InputLabel>
                      <Select
                        labelId="pre-pulped-label"
                        value={prePulped}
                        onChange={(e) => setPrePulped(e.target.value)}
                        input={<OutlinedInput label="Pre-pulped" />}
                        MenuProps={MenuProps}
                      >
                        <MenuItem value="yes">Yes</MenuItem>
                        <MenuItem value="no">No</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ marginTop: '16px' }}>
                      <InputLabel id="pre-pulped-delva-label">Pre-pulped Delva</InputLabel>
                      <Select
                        labelId="pre-pulped-delva-label"
                        value={prePulpedDelva}
                        onChange={(e) => setPrePulpedDelva(e.target.value)}
                        input={<OutlinedInput label="Pre-pulped Delva" />}
                        MenuProps={MenuProps}
                      >
                        <MenuItem value="yes">Yes</MenuItem>
                        <MenuItem value="no">No</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ marginTop: '16px' }}>
                      <InputLabel id="wesorter-label">Wesorter</InputLabel>
                      <Select
                        labelId="wesorter-label"
                        value={wesorter}
                        onChange={(e) => setWesorter(e.target.value)}
                        input={<OutlinedInput label="Wesorter" />}
                        MenuProps={MenuProps}
                      >
                        <MenuItem value="yes">Yes</MenuItem>
                        <MenuItem value="no">No</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ marginTop: '16px' }}>
                      <InputLabel id="pre-classifier-label">Pre-classifier</InputLabel>
                      <Select
                        labelId="pre-classifier-label"
                        value={preClassifier}
                        onChange={(e) => setPreClassifier(e.target.value)}
                        input={<OutlinedInput label="Pre-classifier" />}
                        MenuProps={MenuProps}
                      >
                        <MenuItem value="yes">Yes</MenuItem>
                        <MenuItem value="no">No</MenuItem>
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Fermentation Section</Typography>

                    <FormControl fullWidth sx={{ marginTop: '16px' }}>
                      <InputLabel id="cherry-type-label">Cherry Type</InputLabel>
                      <Select
                        labelId="cherry-type-label"
                        value={cherryType}
                        onChange={(e) => setCherryType(e.target.value)}
                        input={<OutlinedInput label="Cherry Type" />}
                        MenuProps={MenuProps}
                      >
                        <MenuItem value="whole cherry">Whole Cherry</MenuItem>
                        <MenuItem value="pulped">Pulped</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ marginTop: '16px' }}>
                      <InputLabel id="fermentation-label">Fermentation</InputLabel>
                      <Select
                        labelId="fermentation-label"
                        value={fermentation}
                        onChange={(e) => setFermentation(e.target.value)}
                        input={<OutlinedInput label="Fermentation" />}
                        MenuProps={MenuProps}
                      >
                        <MenuItem value="yes">Yes</MenuItem>
                        <MenuItem value="no">No</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth required sx={{ marginTop: '16px' }}>
                      <InputLabel id="fermentation-tank-label">Fermentation Tank</InputLabel>
                      <Select
                        labelId="fermentation-tank-label"
                        value={fermentationTank}
                        onChange={(e) => setFermentationTank(e.target.value)}
                        input={<OutlinedInput label="Fermentation Tank" />}
                        MenuProps={MenuProps}
                      >
                        {isLoadingTanks ? (
                          <MenuItem disabled>
                            <CircularProgress size={24} />
                          </MenuItem>
                        ) : (
                          availableTanks.map(tank => (
                            <MenuItem key={tank} value={tank}>{tank}</MenuItem>
                          ))
                        )}
                      </Select>
                    </FormControl>

                    <TextField
                      label="Starter"
                      value={fermentationStarter}
                      onChange={(e) => setFermentationStarter(e.target.value)}
                      fullWidth
                      margin="normal"
                    />

                    <FormControl fullWidth sx={{ marginTop: '16px' }}>
                      <InputLabel id="gas-label">Gas</InputLabel>
                      <Select
                        labelId="gas-label"
                        value={gas}
                        onChange={(e) => setGas(e.target.value)}
                        input={<OutlinedInput label="Gas" />}
                        MenuProps={MenuProps}
                      >
                        <MenuItem value="air">Air</MenuItem>
                        <MenuItem value="co2">CO2</MenuItem>
                        <MenuItem value="n2">N2</MenuItem>
                        <MenuItem value="pure o2">Pure O2</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      label="Pressure (psi)"
                      type="number"
                      value={pressure}
                      onChange={(e) => setPressure(e.target.value)}
                      fullWidth
                      margin="normal"
                    />

                    <FormControl fullWidth sx={{ marginTop: '16px' }}>
                      <InputLabel id="is-submerged-label">Is Submerged</InputLabel>
                      <Select
                        labelId="is-submerged-label"
                        value={isSubmerged}
                        onChange={(e) => setIsSubmerged(e.target.value)}
                        input={<OutlinedInput label="Is Submerged" />}
                        MenuProps={MenuProps}
                      >
                        <MenuItem value="yes">Yes</MenuItem>
                        <MenuItem value="no">No</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      label="Total Volume (L)"
                      type="number"
                      value={totalVolume}
                      onChange={(e) => setTotalVolume(e.target.value)}
                      fullWidth
                      margin="normal"
                    />

                    <TextField
                      label="Stirring (Hz)"
                      type="number"
                      value={stirring}
                      onChange={(e) => setStirring(e.target.value)}
                      fullWidth
                      margin="normal"
                    />

                    <TextField
                      label="Fermentation Temperature (°C)"
                      type="number"
                      value={fermentationTemperature}
                      onChange={(e) => setFermentationTemperature(e.target.value)}
                      fullWidth
                      margin="normal"
                    />

                    <TextField
                      label="pH"
                      type="number"
                      value={pH}
                      onChange={(e) => setPH(e.target.value)}
                      fullWidth
                      margin="normal"
                    />

                    <TextField
                      label="Fermentation Time Target (h)"
                      type="number"
                      value={fermentationTimeTarget}
                      onChange={(e) => setFermentationTimeTarget(e.target.value)}
                      fullWidth
                      margin="normal"
                    />

                    <FormControl fullWidth sx={{ marginTop: '16px' }}>
                      <InputLabel id="post-pulped-label">Post-pulped</InputLabel>
                      <Select
                        labelId="post-pulped-label"
                        value={postPulped}
                        onChange={(e) => setPostPulped(e.target.value)}
                        input={<OutlinedInput label="Post-pulped" />}
                        MenuProps={MenuProps}
                      >
                        <MenuItem value="yes">Yes</MenuItem>
                        <MenuItem value="no">No</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      label="Airlock"
                      value={airlock}
                      onChange={(e) => setAirlock(e.target.value)}
                      fullWidth
                      margin="normal"
                      placeholder="e.g., lid open"
                    />

                    <TextField
                      label="Tank Amount"
                      type="number"
                      value={tankAmount}
                      onChange={(e) => setTankAmount(e.target.value)}
                      fullWidth
                      margin="normal"
                    />

                    <TextField
                      label="Leachate Target (L)"
                      type="number"
                      value={leachateTarget}
                      onChange={(e) => setLeachateTarget(e.target.value)}
                      fullWidth
                      margin="normal"
                    />

                    <TextField
                      label="Brew Tank Temperature (°C)"
                      type="number"
                      value={brewTankTemperature}
                      onChange={(e) => setBrewTankTemperature(e.target.value)}
                      fullWidth
                      margin="normal"
                    />

                    <TextField
                      label="Water Temperature (°C)"
                      type="number"
                      value={waterTemperature}
                      onChange={(e) => setWaterTemperature(e.target.value)}
                      fullWidth
                      margin="normal"
                    />

                    <TextField
                      label="Cooler Temperature (°C)"
                      type="number"
                      value={coolerTemperature}
                      onChange={(e) => setCoolerTemperature(e.target.value)}
                      fullWidth
                      margin="normal"
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Second Fermentation Section</Typography>

                    <FormControl fullWidth sx={{ marginTop: '16px' }}>
                      <InputLabel id="second-fermentation-label">Second Fermentation</InputLabel>
                      <Select
                        labelId="second-fermentation-label"
                        value={secondFermentation}
                        onChange={(e) => setSecondFermentation(e.target.value)}
                        input={<OutlinedInput label="Second Fermentation" />}
                        MenuProps={MenuProps}
                      >
                        <MenuItem value="yes">Yes</MenuItem>
                        <MenuItem value="no">No</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ marginTop: '16px' }}>
                      <InputLabel id="second-fermentation-tank-label">Second Fermentation Tank</InputLabel>
                      <Select
                        labelId="second-fermentation-tank-label"
                        value={secondFermentationTank}
                        onChange={(e) => setSecondFermentationTank(e.target.value)}
                        input={<OutlinedInput label="Second Fermentation Tank" />}
                        MenuProps={MenuProps}
                      >
                        {availableTanks.map(tank => (
                          <MenuItem key={tank} value={tank}>{tank}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ marginTop: '16px' }}>
                      <InputLabel id="second-washed-delva-label">Washed with Delva</InputLabel>
                      <Select
                        labelId="second-washed-delva-label"
                        value={secondWashedDelva}
                        onChange={(e) => setSecondWashedDelva(e.target.value)}
                        input={<OutlinedInput label="Washed with Delva" />}
                        MenuProps={MenuProps}
                      >
                        <MenuItem value="yes">Yes</MenuItem>
                        <MenuItem value="no">No</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ marginTop: '16px' }}>
                      <InputLabel id="second-washed-label">Washed</InputLabel>
                      <Select
                        labelId="second-washed-label"
                        value={secondWashed}
                        onChange={(e) => setSecondWashed(e.target.value)}
                        input={<OutlinedInput label="Washed" />}
                        MenuProps={MenuProps}
                      >
                        <MenuItem value="yes">Yes</MenuItem>
                        <MenuItem value="no">No</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      label="Starter"
                      value={secondStarterType}
                      onChange={(e) => setSecondStarterType(e.target.value)}
                      fullWidth
                      margin="normal"
                    />

                    <FormControl fullWidth sx={{ marginTop: '16px' }}>
                      <InputLabel id="second-gas-label">Second Gas</InputLabel>
                      <Select
                        labelId="second-gas-label"
                        value={secondGas}
                        onChange={(e) => setSecondGas(e.target.value)}
                        input={<OutlinedInput label="Second Gas" />}
                        MenuProps={MenuProps}
                      >
                        <MenuItem value="air">Air</MenuItem>
                        <MenuItem value="co2">CO2</MenuItem>
                        <MenuItem value="n2">N2</MenuItem>
                        <MenuItem value="pure o2">Pure O2</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      label="Second Pressure (psi)"
                      type="number"
                      value={secondPressure}
                      onChange={(e) => setSecondPressure(e.target.value)}
                      fullWidth
                      margin="normal"
                    />

                    <FormControl fullWidth sx={{ marginTop: '16px' }}>
                      <InputLabel id="second-is-submerged-label">Second Is Submerged</InputLabel>
                      <Select
                        labelId="second-is-submerged-label"
                        value={secondIsSubmerged}
                        onChange={(e) => setSecondIsSubmerged(e.target.value)}
                        input={<OutlinedInput label="Second Is Submerged" />}
                        MenuProps={MenuProps}
                      >
                        <MenuItem value="yes">Yes</MenuItem>
                        <MenuItem value="no">No</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      label="Second Total Volume (L)"
                      type="number"
                      value={secondTotalVolume}
                      onChange={(e) => setSecondTotalVolume(e.target.value)}
                      fullWidth
                      margin="normal"
                    />

                    <TextField
                      label="Second Temperature (°C)"
                      type="number"
                      value={secondTemperature}
                      onChange={(e) => setSecondTemperature(e.target.value)}
                      fullWidth
                      margin="normal"
                    />

                    <TextField
                      label="Second Fermentation Time Target (h)"
                      type="number"
                      value={secondFermentationTimeTarget}
                      onChange={(e) => setSecondFermentationTimeTarget(e.target.value)}
                      fullWidth
                      margin="normal"
                    />

                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Drying Section</Typography>

                    <FormControl fullWidth sx={{ marginTop: '16px' }}>
                      <InputLabel id="second-drying-label">Second Drying</InputLabel>
                      <Select
                        labelId="second-drying-label"
                        value={secondDrying}
                        onChange={(e) => setSecondDrying(e.target.value)}
                        input={<OutlinedInput label="Second Drying" />}
                        MenuProps={MenuProps}
                      >
                        <MenuItem value="yes">Yes</MenuItem>
                        <MenuItem value="no">No</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ marginTop: '16px' }}>
                      <InputLabel id="rehydration-label">Rehydration</InputLabel>
                      <Select
                        labelId="rehydration-label"
                        value={rehydration}
                        onChange={(e) => setRehydration(e.target.value)}
                        input={<OutlinedInput label="Rehydration" />}
                        MenuProps={MenuProps}
                      >
                        <MenuItem value="yes">Yes</MenuItem>
                        <MenuItem value="no">No</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ marginTop: '16px' }}>
                      <InputLabel id="drying-label">Drying Method</InputLabel>
                      <Select
                        labelId="drying-label"
                        value={drying}
                        onChange={(e) => setDrying(e.target.value)}
                        input={<OutlinedInput label="Drying Method" />}
                        MenuProps={MenuProps}
                      >
                        <MenuItem value="Pulped Natural">Pulped Natural</MenuItem>
                        <MenuItem value="Natural">Natural</MenuItem>
                        <MenuItem value="Washed">Washed</MenuItem>
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
              
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={generateOrderSheet}
                  style={{ marginTop: '16px', marginRight: '16px' }}
                  disabled={
                    !batchNumber ||
                    !experimentNumber ||
                  }
                >
                  Generate Order Sheet
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  style={{ marginTop: '16px' }}
                  disabled={
                    !batchNumber ||
                    !experimentNumber ||
                    isLoadingTanks ||
                    tankError
                  }
                >
                  Start Fermentation
                </Button>

              </Grid>
            </Grid>
          </form>
        </Grid>
      </Grid>

      <Grid item xs={12} md={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Fermentation Batches
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={fetchFermentationData}
              style={{ marginBottom: '16px' }}
            >
              Refresh Data
            </Button>
            <Tabs
              value={tabValue}
              onChange={(e, newValue) => setTabValue(newValue)}
              sx={{ marginBottom: '16px' }}
            >
              <Tab label="Biomaster" value="Biomaster" />
              <Tab label="Carrybrew" value="Carrybrew" />
              <Tab label="Washing Track" value="Washing Track" />
              <Tab label="Blue Barrel" value="Blue Barrel" />
              <Tab label="Fermentation Bucket" value="Fermentation Bucket" />
            </Tabs>
            <div style={{ height: 800, width: '100%' }}>
              <DataGrid
                rows={fermentationData
                  .filter(row => 
                    tabValue === 'Blue Barrel' 
                      ? row.tank.startsWith('BB-HQ-') 
                      : row.tank === tabValue
                  )}
                columns={fermentationColumns}
                pageSize={5}
                slots={{ toolbar: GridToolbar }}
                autosizeOnMount
                autosizeOptions={{
                  includeHeaders: true,
                  includeOutliers: true,
                  expand: true,
                }}
                rowHeight={35}
              />
            </div>
          </CardContent>
        </Card>
      </Grid>

      <Dialog open={openWeightDialog} onClose={() => setOpenWeightDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Track Weight - Batch {selectedBatch?.batchNumber}</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>Add Weight Measurement</Typography>
          <Grid container spacing={2} sx={{ mb: 2, mt: 1 }}>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel id="processing-type-label">Processing Type</InputLabel>
                <Select
                  labelId="processing-type-label"
                  value={newProcessingType}
                  onChange={(e) => setNewProcessingType(e.target.value)}
                  label="Processing Type"
                >
                  {availableProcessingTypes.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Weight (kg)"
                type="number"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                fullWidth
                inputProps={{ min: 0.01, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Measurement Date"
                type="date"
                value={newWeightDate}
                onChange={(e) => setNewWeightDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel id="producer-label">Producer</InputLabel>
                <Select
                  labelId="producer-label"
                  value={newProducer}
                  onChange={(e) => setNewProducer(e.target.value)}
                  label="Producer"
                >
                  {producers.map(prod => (
                    <MenuItem key={prod} value={prod}>{prod}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddWeight}
            fullWidth
            sx={{ mb: 2 }}
            disabled={!newWeight || !newProcessingType || !newWeightDate}
          >
            Add Weight
          </Button>
          <Typography variant="h6" gutterBottom>Weight History</Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Processing Type</TableCell>
                <TableCell>Weight (kg)</TableCell>
                <TableCell>Producer</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {weightMeasurements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">No weight measurements recorded.</TableCell>
                </TableRow>
              ) : (
                weightMeasurements.map(m => (
                  <TableRow key={m.id}>
                    <TableCell>{dayjs(m.measurement_date).format('YYYY-MM-DD')}</TableCell>
                    <TableCell>{m.processingType}</TableCell>
                    <TableCell>{parseFloat(m.weight).toFixed(2)}</TableCell>
                    <TableCell>{m.producer}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenWeightDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openFinishDialog} onClose={() => setOpenFinishDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Finish Fermentation - Batch {selectedRow?.batchNumber}</DialogTitle>
        <DialogContent>
          <TextField
            label="End Date and Time"
            type="datetime-local"
            value={endDateTime}
            onChange={(e) => setEndDateTime(e.target.value)}
            fullWidth
            required
            margin="normal"
            InputLabelProps={{ shrink: true }}
            inputProps={{
              min: selectedRow?.fermentationStart || dayjs().tz('Asia/Makassar').format('YYYY-MM-DDTHH:mm:ss'),
              max: dayjs().tz('Asia/Makassar').format('YYYY-MM-DDTHH:mm:ss'),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFinishDialog(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleFinishFermentation} disabled={!endDateTime}>
            Finish
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDetailsDialog} onClose={() => setOpenDetailsDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Details - Batch {selectedBatch?.batchNumber}</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>Cherry Information</Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={4}>
              <TextField
                label="Batch Number"
                value={detailsData.batchNumber || ''}
                onChange={(e) => setDetailsData({ ...detailsData, batchNumber: e.target.value })}
                fullWidth
                disabled
              />
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel id="reference-number-details-label">Reference Number</InputLabel>
                <Select
                  labelId="reference-number-details-label"
                  value={detailsData.referenceNumber || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    const selectedMapping = referenceMappings.find(mapping => mapping.referenceNumber === value);
                    setDetailsData({
                      ...detailsData,
                      referenceNumber: value,
                      processingType: selectedMapping ? selectedMapping.processingType : detailsData.processingType
                    });
                  }}
                  label="Reference Number"
                >
                  {referenceMappings
                    .filter(mapping => !detailsData.processingType || mapping.processingType === detailsData.processingType)
                    .map(mapping => (
                      <MenuItem key={mapping.id} value={mapping.referenceNumber}>
                        {mapping.referenceNumber}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel id="processing-type-details-label">Processing Type</InputLabel>
                <Select
                  labelId="processing-type-details-label"
                  value={detailsData.processingType || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    const matchingReferences = referenceMappings.filter(mapping => mapping.processingType === value);
                    setDetailsData({
                      ...detailsData,
                      processingType: value,
                      referenceNumber: matchingReferences.length > 0 ? matchingReferences[0].referenceNumber : detailsData.referenceNumber
                    });
                  }}
                  label="Processing Type"
                >
                  {[...new Set(referenceMappings.map(mapping => mapping.processingType))].map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Experiment Number"
                type="number"
                value={detailsData.experimentNumber || ''}
                onChange={(e) => setDetailsData({ ...detailsData, experimentNumber: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Description"
                value={detailsData.description || ''}
                onChange={(e) => setDetailsData({ ...detailsData, description: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Farmer Name"
                value={detailsData.farmerName || ''}
                onChange={(e) => setDetailsData({ ...detailsData, farmerName: e.target.value })}
                fullWidth
                disabled
              />
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel id="type-details-label">Type</InputLabel>
                <Select
                  labelId="type-details-label"
                  value={detailsData.type || ''}
                  onChange={(e) => setDetailsData({ ...detailsData, type: e.target.value })}
                  label="Type"
                  disabled
                >
                  <MenuItem value="arabica">Arabica</MenuItem>
                  <MenuItem value="robusta">Robusta</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel id="variety-details-label">Variety</InputLabel>
                <Select
                  labelId="variety-details-label"
                  value={detailsData.variety || ''}
                  onChange={(e) => setDetailsData({ ...detailsData, variety: e.target.value })}
                  label="Variety"
                >
                  <MenuItem value="cobra">Cobra</MenuItem>
                  <MenuItem value="yellow caturra">Yellow Caturra</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Harvest Date"
                type="date"
                value={detailsData.harvestDate || ''}
                onChange={(e) => setDetailsData({ ...detailsData, harvestDate: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Harvest At"
                type="datetime-local"
                value={detailsData.harvestAt || ''}
                onChange={(e) => setDetailsData({ ...detailsData, harvestAt: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Received At"
                type="datetime-local"
                value={detailsData.receivedAt || ''}
                onChange={(e) => setDetailsData({ ...detailsData, receivedAt: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Received Weight (kg)"
                type="number"
                value={detailsData.receivedWeight || ''}
                onChange={(e) => setDetailsData({ ...detailsData, receivedWeight: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Reject Weight (kg)"
                type="number"
                value={detailsData.rejectWeight || ''}
                onChange={(e) => setDetailsData({ ...detailsData, rejectWeight: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Defect Weight (kg)"
                type="number"
                value={detailsData.defectWeight || ''}
                onChange={(e) => setDetailsData({ ...detailsData, defectWeight: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Damaged Weight (kg)"
                type="number"
                value={detailsData.damagedWeight || ''}
                onChange={(e) => setDetailsData({ ...detailsData, damagedWeight: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Lost Weight (kg)"
                type="number"
                value={detailsData.lostWeight || ''}
                onChange={(e) => setDetailsData({ ...detailsData, lostWeight: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Preprocessing Weight (kg)"
                type="number"
                value={detailsData.preprocessingWeight || ''}
                onChange={(e) => setDetailsData({ ...detailsData, preprocessingWeight: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Quality (%)"
                type="number"
                value={detailsData.quality || ''}
                onChange={(e) => setDetailsData({ ...detailsData, quality: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Brix"
                type="number"
                value={detailsData.brix || ''}
                onChange={(e) => setDetailsData({ ...detailsData, brix: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Product Line"
                value={detailsData.productLine || ''}
                onChange={(e) => setDetailsData({ ...detailsData, productLine: e.target.value })}
                fullWidth
              />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom>Pre-Fermentation Details</Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel id="pre-storage-details-label">Pre-storage</InputLabel>
                <Select
                  labelId="pre-storage-details-label"
                  value={detailsData.preStorage || ''}
                  onChange={(e) => setDetailsData({ ...detailsData, preStorage: e.target.value })}
                  label="Pre-storage"
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Pre-storage Condition"
                value={detailsData.preStorageCondition || ''}
                onChange={(e) => setDetailsData({ ...detailsData, preStorageCondition: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Pre-Fermentation Storage Goal (h)"
                type="number"
                value={detailsData.preFermentationStorageGoal || ''}
                onChange={(e) => setDetailsData({ ...detailsData, preFermentationStorageGoal: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Pre-Fermentation Storage Start"
                type="datetime-local"
                value={detailsData.preFermentationStorageStart || ''}
                onChange={(e) => setDetailsData({ ...detailsData, preFermentationStorageStart: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Pre-Fermentation Storage End"
                type="datetime-local"
                value={detailsData.preFermentationStorageEnd || ''}
                onChange={(e) => setDetailsData({ ...detailsData, preFermentationStorageEnd: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel id="pre-pulped-details-label">Pre-pulped</InputLabel>
                <Select
                  labelId="pre-pulped-details-label"
                  value={detailsData.prePulped || ''}
                  onChange={(e) => setDetailsData({ ...detailsData, prePulped: e.target.value })}
                  label="Pre-pulped"
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel id="pre-pulped-delva-details-label">Pre-pulped Delva</InputLabel>
                <Select
                  labelId="pre-pulped-delva-details-label"
                  value={detailsData.prePulpedDelva || ''}
                  onChange={(e) => setDetailsData({ ...detailsData, prePulpedDelva: e.target.value })}
                  label="Pre-pulped Delva"
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Time After Pulping"
                type="datetime-local"
                value={detailsData.preFermentationTimeAfterPulping || ''}
                onChange={(e) => setDetailsData({ ...detailsData, preFermentationTimeAfterPulping: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Post-pulped Weight (kg)"
                type="number"
                value={detailsData.prePulpedWeight || ''}
                onChange={(e) => setDetailsData({ ...detailsData, prePulpedWeight: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel id="wesorter-details-label">Wesorter</InputLabel>
                <Select
                  labelId="wesorter-details-label"
                  value={detailsData.wesorter || ''}
                  onChange={(e) => setDetailsData({ ...detailsData, wesorter: e.target.value })}
                  label="Wesorter"
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel id="pre-classifier-details-label">Pre-classifier</InputLabel>
                <Select
                  labelId="pre-classifier-details-label"
                  value={detailsData.preClassifier || ''}
                  onChange={(e) => setDetailsData({ ...detailsData, preClassifier: e.target.value })}
                  label="Pre-classifier"
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom>Fermentation Details</Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel id="cherry-type-details-label">Cherry Type</InputLabel>
                <Select
                  labelId="cherry-type-details-label"
                  value={detailsData.cherryType || ''}
                  onChange={(e) => setDetailsData({ ...detailsData, cherryType: e.target.value })}
                  label="Cherry Type"
                >
                  <MenuItem value="whole cherry">Whole Cherry</MenuItem>
                  <MenuItem value="pulped">Pulped</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Fermentation Cherry Weight (kg)"
                type="number"
                value={detailsData.fermentationCherryWeight || ''}
                onChange={(e) => setDetailsData({ ...detailsData, fermentationCherryWeight: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel id="fermentation-details-label">Fermentation</InputLabel>
                <Select
                  labelId="fermentation-details-label"
                  value={detailsData.fermentation || ''}
                  onChange={(e) => setDetailsData({ ...detailsData, fermentation: e.target.value })}
                  label="Fermentation"
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel id="fermentation-tank-details-label">Fermentation Tank</InputLabel>
                <Select
                  labelId="fermentation-tank-details-label"
                  value={detailsData.fermentationTank || ''}
                  onChange={(e) => setDetailsData({ ...detailsData, fermentationTank: e.target.value })}
                  label="Fermentation Tank"
                >
                  {availableTanks.map(tank => (
                    <MenuItem key={tank} value={tank}>{tank}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Starter"
                value={detailsData.fermentationStarter || ''}
                onChange={(e) => setDetailsData({ ...detailsData, fermentationStarter: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Starter Amount (L)"
                type="number"
                value={detailsData.fermentationStarterAmount || ''}
                onChange={(e) => setDetailsData({ ...detailsData, fermentationStarterAmount: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel id="gas-details-label">Gas</InputLabel>
                <Select
                  labelId="gas-details-label"
                  value={detailsData.gas || ''}
                  onChange={(e) => setDetailsData({ ...detailsData, gas: e.target.value })}
                  label="Gas"
                >
                  <MenuItem value="air">Air</MenuItem>
                  <MenuItem value="co2">CO2</MenuItem>
                  <MenuItem value="n2">N2</MenuItem>
                  <MenuItem value="pure o2">Pure O2</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Pressure (psi)"
                type="number"
                value={detailsData.pressure || ''}
                onChange={(e) => setDetailsData({ ...detailsData, pressure: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel id="is-submerged-details-label">Is Submerged</InputLabel>
                <Select
                  labelId="is-submerged-details-label"
                  value={detailsData.isSubmerged || ''}
                  onChange={(e) => setDetailsData({ ...detailsData, isSubmerged: e.target.value })}
                  label="Is Submerged"
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Total Volume (L)"
                type="number"
                value={detailsData.totalVolume || ''}
                onChange={(e) => setDetailsData({ ...detailsData, totalVolume: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Water Used (L)"
                type="number"
                value={detailsData.waterUsed || ''}
                onChange={(e) => setDetailsData({ ...detailsData, waterUsed: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Starter Used (L)"
                type="number"
                value={detailsData.starterUsed || ''}
                onChange={(e) => setDetailsData({ ...detailsData, starterUsed: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Stirring (Hz)"
                type="number"
                value={detailsData.stirring || ''}
                onChange={(e) => setDetailsData({ ...detailsData, stirring: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Fermentation Temperature (°C)"
                type="number"
                value={detailsData.fermentationTemperature || ''}
                onChange={(e) => setDetailsData({ ...detailsData, fermentationTemperature: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="pH"
                type="number"
                value={detailsData.pH || ''}
                onChange={(e) => setDetailsData({ ...detailsData, pH: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Fermentation Time Target (h)"
                type="number"
                value={detailsData.fermentationTimeTarget || ''}
                onChange={(e) => setDetailsData({ ...detailsData, fermentationTimeTarget: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Fermentation Start"
                type="datetime-local"
                value={detailsData.fermentationStart || ''}
                onChange={(e) => setDetailsData({ ...detailsData, fermentationStart: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Fermentation End"
                type="datetime-local"
                value={detailsData.fermentationEnd || ''}
                onChange={(e) => setDetailsData({ ...detailsData, fermentationEnd: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Final pH"
                type="number"
                value={detailsData.finalPH || ''}
                onChange={(e) => setDetailsData({ ...detailsData, finalPH: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Final TDS"
                type="number"
                value={detailsData.finalTDS || ''}
                onChange={(e) => setDetailsData({ ...detailsData, finalTDS: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Final Temperature (°C)"
                type="number"
                value={detailsData.finalTemperature || ''}
                onChange={(e) => setDetailsData({ ...detailsData, finalTemperature: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Post Fermentation Weight (kg)"
                type="number"
                value={detailsData.postFermentationWeight || ''}
                onChange={(e) => setDetailsData({ ...detailsData, postFermentationWeight: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel id="post-pulped-details-label">Post-pulped</InputLabel>
                <Select
                  labelId="post-pulped-details-label"
                  value={detailsData.postPulped || ''}
                  onChange={(e) => setDetailsData({ ...detailsData, postPulped: e.target.value })}
                  label="Post-pulped"
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Airlock"
                value={detailsData.airlock || ''}
                onChange={(e) => setDetailsData({ ...detailsData, airlock: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Tank Amount"
                type="number"
                value={detailsData.tankAmount || ''}
                onChange={(e) => setDetailsData({ ...detailsData, tankAmount: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Leachate Target (L)"
                type="number"
                value={detailsData.leachateTarget || ''}
                onChange={(e) => setDetailsData({ ...detailsData, leachateTarget: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Leachate (L)"
                type="number"
                value={detailsData.leachate || ''}
                onChange={(e) => setDetailsData({ ...detailsData, leachate: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Brew Tank Temperature (°C)"
                type="number"
                value={detailsData.brewTankTemperature || ''}
                onChange={(e) => setDetailsData({ ...detailsData, brewTankTemperature: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Water Temperature (°C)"
                type="number"
                value={detailsData.waterTemperature || ''}
                onChange={(e) => setDetailsData({ ...detailsData, waterTemperature: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Cooler Temperature (°C)"
                type="number"
                value={detailsData.coolerTemperature || ''}
                onChange={(e) => setDetailsData({ ...detailsData, coolerTemperature: e.target.value })}
                fullWidth
              />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom>Second Fermentation Details</Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel id="second-fermentation-details-label">Second Fermentation</InputLabel>
                <Select
                  labelId="second-fermentation-details-label"
                  value={detailsData.secondFermentation || ''}
                  onChange={(e) => setDetailsData({ ...detailsData, secondFermentation: e.target.value })}
                  label="Second Fermentation"
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel id="second-fermentation-tank-details-label">Second Fermentation Tank</InputLabel>
                <Select
                  labelId="second-fermentation-tank-details-label"
                  value={detailsData.secondFermentationTank || ''}
                  onChange={(e) => setDetailsData({ ...detailsData, secondFermentationTank: e.target.value })}
                  label="Second Fermentation Tank"
                >
                  {availableTanks.map(tank => (
                    <MenuItem key={tank} value={tank}>{tank}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel id="second-washed-delva-details-label">Washed with Delva</InputLabel>
                <Select
                  labelId="second-washed-delva-details-label"
                  value={detailsData.secondWashedDelva || ''}
                  onChange={(e) => setDetailsData({ ...detailsData, secondWashedDelva: e.target.value })}
                  label="Washed with Delva"
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel id="second-washed-details-label">Washed</InputLabel>
                <Select
                  labelId="second-washed-details-label"
                  value={detailsData.secondWashed || ''}
                  onChange={(e) => setDetailsData({ ...detailsData, secondWashed: e.target.value })}
                  label="Washed"
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Cherry Weight Before Pulping (kg)"
                type="number"
                value={detailsData.secondFermentationCherryWeight || ''}
                onChange={(e) => setDetailsData({ ...detailsData, secondFermentationCherryWeight: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Pulped Beans Weight (kg)"
                type="number"
                value={detailsData.secondFermentationPulpedWeight || ''}
                onChange={(e) => setDetailsData({ ...detailsData, secondFermentationPulpedWeight: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Starter"
                value={detailsData.secondStarterType || ''}
                onChange={(e) => setDetailsData({ ...detailsData, secondStarterType: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel id="second-gas-details-label">Second Gas</InputLabel>
                <Select
                  labelId="second-gas-details-label"
                  value={detailsData.secondGas || ''}
                  onChange={(e) => setDetailsData({ ...detailsData, secondGas: e.target.value })}
                  label="Second Gas"
                >
                  <MenuItem value="air">Air</MenuItem>
                  <MenuItem value="co2">CO2</MenuItem>
                  <MenuItem value="n2">N2</MenuItem>
                  <MenuItem value="pure o2">Pure O2</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Second Pressure (psi)"
                type="number"
                value={detailsData.secondPressure || ''}
                onChange={(e) => setDetailsData({ ...detailsData, secondPressure: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel id="second-is-submerged-details-label">Second Is Submerged</InputLabel>
                <Select
                  labelId="second-is-submerged-details-label"
                  value={detailsData.secondIsSubmerged || ''}
                  onChange={(e) => setDetailsData({ ...detailsData, secondIsSubmerged: e.target.value })}
                  label="Second Is Submerged"
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Second Total Volume (L)"
                type="number"
                value={detailsData.secondTotalVolume || ''}
                onChange={(e) => setDetailsData({ ...detailsData, secondTotalVolume: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Second Water Used (L)"
                type="number"
                value={detailsData.secondWaterUsed || ''}
                onChange={(e) => setDetailsData({ ...detailsData, secondWaterUsed: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Second Mossto Used"
                type="number"
                value={detailsData.secondMosstoUsed || ''}
                onChange={(e) => setDetailsData({ ...detailsData, secondMosstoUsed: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Second Actual Volume (L)"
                type="number"
                value={detailsData.secondActualVolume || ''}
                onChange={(e) => setDetailsData({ ...detailsData, secondActualVolume: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Second Temperature (°C)"
                type="number"
                value={detailsData.secondTemperature || ''}
                onChange={(e) => setDetailsData({ ...detailsData, secondTemperature: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Second Fermentation Time Target (h)"
                type="number"
                value={detailsData.secondFermentationTimeTarget || ''}
                onChange={(e) => setDetailsData({ ...detailsData, secondFermentationTimeTarget: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Second Fermentation Start"
                type="datetime-local"
                value={detailsData.secondFermentationStart || ''}
                onChange={(e) => setDetailsData({ ...detailsData, secondFermentationStart: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Second Fermentation End"
                type="datetime-local"
                value={detailsData.secondFermentationEnd || ''}
                onChange={(e) => setDetailsData({ ...detailsData, secondFermentationEnd: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom>Drying Details</Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel id="drying-area-details-label">Drying Area</InputLabel>
                <Select
                  labelId="drying-area-details-label"
                  value={detailsData.dryingArea || ''}
                  onChange={(e) => setDetailsData({ ...detailsData, dryingArea: e.target.value })}
                  label="Drying Area"
                >
                  <MenuItem value="greenhouse">Greenhouse</MenuItem>
                  <MenuItem value="outside">Outside</MenuItem>
                  <MenuItem value="drying room">Drying Room</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Average Temperature (°C)"
                type="number"
                value={detailsData.avgTemperature || ''}
                onChange={(e) => setDetailsData({ ...detailsData, avgTemperature: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Pre-drying Weight (kg)"
                type="number"
                value={detailsData.preDryingWeight || ''}
                onChange={(e) => setDetailsData({ ...detailsData, preDryingWeight: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Final Moisture (%)"
                type="number"
                value={detailsData.finalMoisture || ''}
                onChange={(e) => setDetailsData({ ...detailsData, finalMoisture: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Post-drying Weight (kg)"
                type="number"
                value={detailsData.postDryingWeight || ''}
                onChange={(e) => setDetailsData({ ...detailsData, postDryingWeight: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Drying Start"
                type="datetime-local"
                value={detailsData.dryingStart || ''}
                onChange={(e) => setDetailsData({ ...detailsData, dryingStart: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Drying End"
                type="datetime-local"
                value={detailsData.dryingEnd || ''}
                onChange={(e) => setDetailsData({ ...detailsData, dryingEnd: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel id="second-drying-details-label">Second Drying</InputLabel>
                <Select
                  labelId="second-drying-details-label"
                  value={detailsData.secondDrying || ''}
                  onChange={(e) => setDetailsData({ ...detailsData, secondDrying: e.target.value })}
                  label="Second Drying"
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel id="second-drying-area-details-label">Second Drying Area</InputLabel>
                <Select
                  labelId="second-drying-area-details-label"
                  value={detailsData.secondDryingArea || ''}
                  onChange={(e) => setDetailsData({ ...detailsData, secondDryingArea: e.target.value })}
                  label="Second Drying Area"
                >
                  <MenuItem value="greenhouse">Greenhouse</MenuItem>
                  <MenuItem value="outside">Outside</MenuItem>
                  <MenuItem value="drying room">Drying Room</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Second Average Temperature (°C)"
                type="number"
                value={detailsData.secondAverageTemperature || ''}
                onChange={(e) => setDetailsData({ ...detailsData, secondAverageTemperature: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Second Final Moisture (%)"
                type="number"
                value={detailsData.secondFinalMoisture || ''}
                onChange={(e) => setDetailsData({ ...detailsData, secondFinalMoisture: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Second Post-drying Weight (kg)"
                type="number"
                value={detailsData.secondPostDryingWeight || ''}
                onChange={(e) => setDetailsData({ ...detailsData, secondPostDryingWeight: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Second Drying Start"
                type="datetime-local"
                value={detailsData.secondDryingStart || ''}
                onChange={(e) => setDetailsData({ ...detailsData, secondDryingStart: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Second Drying End"
                type="datetime-local"
                value={detailsData.secondDryingEnd || ''}
                onChange={(e) => setDetailsData({ ...detailsData, secondDryingEnd: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel id="rehydration-details-label">Rehydration</InputLabel>
                <Select
                  labelId="rehydration-details-label"
                  value={detailsData.rehydration || ''}
                  onChange={(e) => setDetailsData({ ...detailsData, rehydration: e.target.value })}
                  label="Rehydration"
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel id="drying-details-label">Drying Method</InputLabel>
                <Select
                  labelId="drying-details-label"
                  value={detailsData.drying || ''}
                  onChange={(e) => setDetailsData({ ...detailsData, drying: e.target.value })}
                  label="Drying Method"
                >
                  <MenuItem value="Pulped Natural">Pulped Natural</MenuItem>
                  <MenuItem value="Natural">Natural</MenuItem>
                  <MenuItem value="Washed">Washed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom>Post-Drying Details</Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel id="storage-details-label">Storage</InputLabel>
                <Select
                  labelId="storage-details-label"
                  value={detailsData.storage || ''}
                  onChange={(e) => setDetailsData({ ...detailsData, storage: e.target.value })}
                  label="Storage"
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Storage Temperature (°C)"
                type="number"
                value={detailsData.storageTemperature || ''}
                onChange={(e) => setDetailsData({ ...detailsData, storageTemperature: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Hulling Time"
                type="datetime-local"
                value={detailsData.hullingTime || ''}
                onChange={(e) => setDetailsData({ ...detailsData, hullingTime: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel id="bag-type-details-label">Bag Type</InputLabel>
                <Select
                  labelId="bag-type-details-label"
                  value={detailsData.bagType || ''}
                  onChange={(e) => setDetailsData({ ...detailsData, bagType: e.target.value })}
                  label="Bag Type"
                >
                  <MenuItem value="jute">Jute</MenuItem>
                  <MenuItem value="plastic">Plastic</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Post-hulling Weight (kg)"
                type="number"
                value={detailsData.postHullingWeight || ''}
                onChange={(e) => setDetailsData({ ...detailsData, postHullingWeight: e.target.value })}
                fullWidth
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailsDialog(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleUpdateDetails}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Grid>
  );
}

export default FermentationStation;