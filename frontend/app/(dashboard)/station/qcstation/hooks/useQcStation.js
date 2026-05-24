'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../constants';
import { useSnackbar } from '../../_shared/hooks/useSnackbar';
import {
  captureFromWebcam,
  captureFromFile,
  runCherryQcAnalysis,
} from '../utils/cherryQcImagePipeline';

export function useQcStation(session) {
  const snackbar = useSnackbar();
  const webcamRef = useRef(null);

  const [batchNumber, setBatchNumber] = useState('');
  const [farmerName, setFarmerName] = useState('');
  const [receivingDate, setReceivingDate] = useState('');
  const [weight, setWeight] = useState('');
  const [totalBags, setTotalBags] = useState('');
  const [contractType, setContractType] = useState('');
  const [price, setPrice] = useState('');
  const [ripeness, setRipeness] = useState([]);
  const [color, setColor] = useState([]);
  const [foreignMatter, setForeignMatter] = useState('');
  const [overallQuality, setOverallQuality] = useState('');
  const [qcNotes, setQcNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [qcData, setQcData] = useState([]);
  const [receivingData, setReceivingData] = useState([]);
  const [open, setOpen] = useState(false);
  const [captureBusy, setCaptureBusy] = useState(false);
  const [captureContext, setCaptureContext] = useState(null);
  const [rfid, setRfid] = useState('');
  const [rfidTag, setRfidTag] = useState('');

  const [roboflowResults, setRoboflowResults] = useState({
    unripe: null,
    semi_ripe: null,
    ripe: null,
    overripe: null,
  });

  const showSnackbar = useCallback((message, severity) => {
    snackbar.setMessage(message);
    snackbar.setSeverity(severity);
    snackbar.setOpen(true);
  }, [snackbar]);

  const calculateSLA = (receivingDateVal, lastProcessingDate) => {
    const received = new Date(receivingDateVal);
    let endDate;

    if (lastProcessingDate && lastProcessingDate !== 'N/A') {
      endDate = new Date(lastProcessingDate);
    } else {
      endDate = new Date();
    }

    const diffTime = Math.abs(endDate - received);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const fetchData = async () => {
    try {
      const qcResponse = await axios.get(`${API_BASE_URL}/api/qc`);
      const qcDataResult = qcResponse.data.distinctRows || [];
      setQcData(qcDataResult);

      const receivingResponse = await axios.get(`${API_BASE_URL}/api/receiving`);
      const receivingDataResult = receivingResponse.data.noQCRows || [];

      const qcBatchNumbers = new Set(qcDataResult.map((qc) => qc.batchNumber));
      const filteredReceivingData = receivingDataResult
        .filter((receiving) => !qcBatchNumbers.has(receiving.batchNumber))
        .map((receiving) => ({
          ...receiving,
          slaDays: calculateSLA(receiving.receivingDate, receiving.lastProcessingDate),
        }));

      setReceivingData(filteredReceivingData);
    } catch (error) {
      console.error('Error fetching data:', error);
      showSnackbar('Failed to fetch data. Please try again.', 'error');
      setQcData([]);
      setReceivingData([]);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearRfidData = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/clear-rfid/QC`);
    } catch (error) {
      console.error('Error clearing RFID Data:', error);
    }
  };

  const handleRfidScan = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/get-rfid/QC`);
      const data = response.data;

      if (data.rfid) {
        setRfid(data.rfid);
        const receivingResponse = await axios.get(`${API_BASE_URL}/api/receivingrfid/${data.rfid}`);
        const receivingDataResult = receivingResponse.data;

        if (receivingDataResult && receivingDataResult.length > 0) {
          const batchData = receivingDataResult[0];
          setBatchNumber(batchData.batchNumber);
          setFarmerName(batchData.farmerName);
          setReceivingDate(batchData.receivingDateTrunc || '');
          setWeight(batchData.weight || '');
          setTotalBags(batchData.totalBags || '');
          setContractType(batchData.contractType || '');
          snackbar.setMessage(`Data for batch ${batchData.batchNumber} retrieved successfully!`);
          snackbar.setSeverity('success');
          await clearRfidData();
          await fetchData();
        } else {
          showSnackbar('No receiving data found for this RFID.', 'warning');
        }
      } else {
        showSnackbar('No RFID tag scanned yet.', 'warning');
      }
    } catch (error) {
      console.error('Error fetching batch number or receiving data:', error);
      showSnackbar('Error retrieving data. Please try again.', 'error');
    }
  };

  const buildOverlayMeta = useCallback(
    (ctx) => {
      if (ctx?.mode === 'grid' && ctx.qcRow) {
        const row = ctx.qcRow;
        return {
          batchNumber: row.batchNumber,
          farmerName: row.farmerName || '',
          ripeness: row.ripeness || '',
          color: row.color || '',
          foreignMatter: row.foreignMatter || '',
          overallQuality: row.overallQuality || '',
        };
      }
      return {
        batchNumber,
        farmerName,
        ripeness,
        color,
        foreignMatter,
        overallQuality,
      };
    },
    [batchNumber, farmerName, ripeness, color, foreignMatter, overallQuality]
  );

  const getActiveBatchNumber = () => {
    if (captureContext?.mode === 'grid' && captureContext.qcRow) {
      return captureContext.qcRow.batchNumber;
    }
    return batchNumber;
  };

  const persistGridMlResults = async (averages, qcRow) => {
    if (!session?.user?.name) {
      showSnackbar('No user session found.', 'error');
      return false;
    }
    if (!qcRow?.id) {
      showSnackbar('QC record id missing; cannot save ML results.', 'error');
      return false;
    }

    await axios.patch(`${API_BASE_URL}/api/qc/${qcRow.id}/ml-results`, {
      unripePercentage: parseFloat(averages.unripe),
      semiripePercentage: parseFloat(averages.semi_ripe),
      ripePercentage: parseFloat(averages.ripe),
      overripePercentage: parseFloat(averages.overripe),
      updatedBy: session.user.name,
    });
    return true;
  };

  const processCapture = async (plainCanvas) => {
    const ctx = captureContext;
    if (!ctx) {
      showSnackbar('Capture session expired. Please try again.', 'error');
      return;
    }

    const overlayMeta = buildOverlayMeta(ctx);
    if (!overlayMeta.batchNumber) {
      showSnackbar('Batch number is required before capturing.', 'error');
      return;
    }

    setCaptureBusy(true);
    try {
      const averages = await runCherryQcAnalysis(plainCanvas, overlayMeta);

      if (ctx.mode === 'form') {
        setRoboflowResults({
          unripe: averages.unripe,
          semi_ripe: averages.semi_ripe,
          ripe: averages.ripe,
          overripe: averages.overripe,
        });
        showSnackbar('Sample analyzed. Percentages will be included when you submit.', 'success');
      } else if (ctx.mode === 'grid') {
        const saved = await persistGridMlResults(averages, ctx.qcRow);
        if (saved) {
          showSnackbar(`Photo and ML results saved for batch ${ctx.qcRow.batchNumber}.`, 'success');
          await fetchData();
        }
      }

      setOpen(false);
      setCaptureContext(null);
    } catch (error) {
      console.error('Capture/analysis failed:', error);
      showSnackbar('Failed to analyze or upload image. Please try again.', 'error');
    } finally {
      setCaptureBusy(false);
    }
  };

  const handleCaptureFromCamera = async () => {
    const video = webcamRef.current?.video;
    if (!video) {
      showSnackbar('Camera not ready. Please wait and try again.', 'error');
      return;
    }
    const plainCanvas = captureFromWebcam(video);
    await processCapture(plainCanvas);
  };

  const handleCaptureFromFile = async (file) => {
    try {
      const plainCanvas = await captureFromFile(file);
      await processCapture(plainCanvas);
    } catch (error) {
      console.error('File capture failed:', error);
      showSnackbar(error.message || 'Failed to load image file.', 'error');
    }
  };

  const openCaptureDialog = (context) => {
    setCaptureContext(context);
    setOpen(true);
  };

  const openFormCapture = () => {
    if (!batchNumber) {
      showSnackbar('Enter or load a batch number before capturing.', 'warning');
      return;
    }
    openCaptureDialog({ mode: 'form' });
  };

  const openGridCapture = (qcRow) => {
    if (!qcRow?.batchNumber) return;
    openCaptureDialog({ mode: 'grid', qcRow });
  };

  const handleCloseCapture = () => {
    if (captureBusy) return;
    setOpen(false);
    setCaptureContext(null);
  };

  const handleBatchNumberSearch = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/receiving/${batchNumber}`);
      const data = response.data;

      if (Array.isArray(data) && data.length > 0) {
        const batchData = data[0];
        setFarmerName(batchData.farmerName || '');
        setReceivingDate(batchData.receivingDateTrunc || '');
        setWeight(batchData.weight || '');
        setTotalBags(batchData.totalBags || '');
        setContractType(batchData.contractType || '');
        showSnackbar(`Data for batch ${batchNumber} retrieved successfully!`, 'success');
      } else {
        showSnackbar('No valid data found for this batch number.', 'warning');
      }
    } catch (error) {
      console.error('Error fetching receiving data:', error);
      showSnackbar(`Error: ${error.message}`, 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const ripenessCSV = ripeness.join(', ');
    const colorCSV = color.join(', ');

    if (!session || !session.user) {
      console.error('No user session found.');
      showSnackbar('No user session found.', 'error');
      return;
    }

    if (contractType === 'Beli Putus' && (!price || parseFloat(price) < 0)) {
      showSnackbar('Price per kg is required for Beli Putus and must be non-negative.', 'error');
      return;
    }

    const qcDataPayload = {
      batchNumber: batchNumber.trim(),
      ripeness: ripenessCSV,
      color: colorCSV,
      foreignMatter: foreignMatter.trim(),
      overallQuality: overallQuality.trim(),
      qcNotes: qcNotes.trim(),
      unripePercentage: parseFloat(roboflowResults.unripe) || 0.0,
      semiripePercentage: parseFloat(roboflowResults.semi_ripe) || 0.0,
      ripePercentage: parseFloat(roboflowResults.ripe) || 0.0,
      overripePercentage: parseFloat(roboflowResults.overripe) || 0.0,
      paymentMethod: paymentMethod.trim(),
      price: contractType === 'Beli Putus' ? parseFloat(price) : null,
      createdBy: session.user.name,
      updatedBy: session.user.name,
    };

    try {
      await axios.post(`${API_BASE_URL}/api/qc`, qcDataPayload);
      showSnackbar(`QC data for batch ${batchNumber} submitted successfully!`, 'success');

      setRfidTag('');
      setRfid('');
      setBatchNumber('');
      setFarmerName('');
      setReceivingDate('');
      setWeight('');
      setTotalBags('');
      setContractType('');
      setPrice('');
      setRipeness([]);
      setColor([]);
      setForeignMatter('');
      setOverallQuality('');
      setQcNotes('');
      setPaymentMethod('');
      setRoboflowResults({ unripe: null, semi_ripe: null, ripe: null, overripe: null });

      await fetchData();
    } catch (error) {
      console.error('Error submitting QC data:', error);
      showSnackbar('Failed to submit QC data. Please try again.', 'error');
    }
  };

  return {
    snackbar,
    batchNumber,
    setBatchNumber,
    farmerName,
    receivingDate,
    weight,
    totalBags,
    contractType,
    price,
    setPrice,
    ripeness,
    setRipeness,
    color,
    setColor,
    foreignMatter,
    setForeignMatter,
    overallQuality,
    setOverallQuality,
    qcNotes,
    setQcNotes,
    paymentMethod,
    setPaymentMethod,
    qcData,
    receivingData,
    open,
    captureBusy,
    captureBatchNumber: getActiveBatchNumber(),
    webcamRef,
    fetchData,
    handleRfidScan,
    handleBatchNumberSearch,
    handleSubmit,
    openFormCapture,
    openGridCapture,
    handleCaptureFromCamera,
    handleCaptureFromFile,
    handleCloseCapture,
    roboflowResults,
  };
}
