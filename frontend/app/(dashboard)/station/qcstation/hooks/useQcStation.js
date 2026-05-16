'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../constants';
import { useSnackbar } from '../../_shared/hooks/useSnackbar';

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

      const qcBatchNumbers = new Set(qcDataResult.map(qc => qc.batchNumber));
      const filteredReceivingData = receivingDataResult
        .filter(receiving => !qcBatchNumbers.has(receiving.batchNumber))
        .map(receiving => ({
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
      console.error("Error clearing RFID Data:", error);
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

  const analyzeWithRoboflow = async (file) => {
    const apiUrl = `https://detect.roboflow.com/coffee-cherry-ripeness/1?api_key=ynuuAcMjAI6jxTNKshV1`;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(apiUrl, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = response.data;
      if (!data?.predictions?.length) {
        console.warn("No predictions found in API response.");
        return { predictions: [], unripe: 0, semi_ripe: 0, ripe: 0, overripe: 0 };
      }

      const ripenessCounts = { unripe: 0, semi_ripe: 0, ripe: 0, overripe: 0 };
      data.predictions.forEach(({ confidence, class: ripenessClass }) => {
        if (confidence >= 0.1) ripenessCounts[ripenessClass]++;
      });

      const total = Object.values(ripenessCounts).reduce((sum, count) => sum + count, 0);
      const percentages = Object.fromEntries(
        Object.entries(ripenessCounts).map(([key, count]) => [key, total ? ((count / total) * 100).toFixed(2) : 0])
      );

      return { predictions: data.predictions, ...percentages };
    } catch (error) {
      console.error("Error analyzing image:", error);
      return { predictions: [], unripe: 0, semi_ripe: 0, ripe: 0, overripe: 0 };
    }
  };

  const drawOverlayText = (ctx, canvas, batch, farmer, ripenessVal, colorVal, foreignMatterVal, quality) => {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(10, canvas.height - 240, 400, 240);
    ctx.fillStyle = "#fff";
    ctx.font = "20px Arial";

    const labels = [
      `Batch Number: ${batch}`,
      `Farmer Name: ${farmer}`,
      `Ripeness: ${ripenessVal}`,
      `Color: ${colorVal}`,
      `Foreign Matter: ${foreignMatterVal}`,
      `Overall Quality: ${quality}`,
      `Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    ];

    labels.forEach((text, i) => ctx.fillText(text, 20, canvas.height - 210 + i * 30));
  };

  const drawBoundingBoxes = (ctx, canvas, predictions) => {
    const colorMap = { unripe: "#00FF00", semi_ripe: "#FFFF00", ripe: "#FF0000", overripe: "#8B0000" };

    const { width: smallWidth, height: smallHeight } = predictions[0].image || { width: 640, height: 360 };
    const scaleX = canvas.width / smallWidth;
    const scaleY = canvas.height / smallHeight;

    predictions
      .filter(({ confidence }) => confidence > 0.1)
      .forEach(({ x, y, width: w, height: h, class: ripenessClass, confidence }) => {
        const boxColor = colorMap[ripenessClass] || "#FFFFFF";
        const xScaled = x * scaleX, yScaled = y * scaleY;
        const widthScaled = w * scaleX, heightScaled = h * scaleY;

        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 8;
        ctx.strokeRect(xScaled - widthScaled / 2, yScaled - heightScaled / 2, widthScaled, heightScaled);

        ctx.fillStyle = boxColor;
        ctx.font = "bold 36px Arial";
        ctx.fillText(`${ripenessClass} ${(confidence * 100).toFixed(1)}%`, xScaled - widthScaled / 2, yScaled - heightScaled / 2 - 10);
      });
  };

  const drawRipenessCounts = (ctx, canvas, { unripe, semi_ripe, ripe, overripe }) => {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(canvas.width - 400, canvas.height - 180, 400, 240);
    ctx.fillStyle = "#fff";
    ctx.font = "36px Arial";

    const labels = [`Unripe: ${unripe}`, `Semi-Ripe: ${semi_ripe}`, `Ripe: ${ripe}`, `Overripe: ${overripe}`];
    labels.forEach((text, i) => ctx.fillText(text, canvas.width - 380, canvas.height - 140 + i * 40));
  };

  const uploadImage = async (file, batchNum) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("batchNumber", batchNum);
      formData.append("module", "Cherry-QC");

      const response = await axios.post(`${API_BASE_URL}/api/upload-image`, formData);
      console.log("Image uploaded successfully:", response.data);
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const saveAndUploadImage = async (plainCanvas, annotatedCanvas, batchNum) => {
    const cleanBatchNumber = batchNum.trim().replace(/\s+/g, "");

    const plainImageSrc = plainCanvas.toDataURL("image/jpeg", 1);
    const plainByteString = atob(plainImageSrc.split(",")[1]);
    const plainMimeString = plainImageSrc.split(",")[0].split(":")[1].split(";")[0];
    const plainAb = new ArrayBuffer(plainByteString.length);
    const plainIa = new Uint8Array(plainAb);
    for (let i = 0; i < plainByteString.length; i++) plainIa[i] = plainByteString.charCodeAt(i);
    const plainFile = new Blob([plainAb], { type: plainMimeString });
    const plainJpegFile = new File([plainFile], `image_${cleanBatchNumber}_plain.jpeg`, { type: "image/jpeg" });

    const annotatedImageSrc = annotatedCanvas.toDataURL("image/jpeg", 1);
    const annotatedByteString = atob(annotatedImageSrc.split(",")[1]);
    const annotatedMimeString = annotatedImageSrc.split(",")[0].split(":")[1].split(";")[0];
    const annotatedAb = new ArrayBuffer(annotatedByteString.length);
    const annotatedIa = new Uint8Array(annotatedAb);
    for (let i = 0; i < annotatedByteString.length; i++) annotatedIa[i] = annotatedByteString.charCodeAt(i);
    const annotatedFile = new Blob([annotatedAb], { type: annotatedMimeString });
    const annotatedJpegFile = new File([annotatedFile], `image_${cleanBatchNumber}_annotated.jpeg`, { type: "image/jpeg" });

    await Promise.all([
      uploadImage(plainJpegFile, cleanBatchNumber),
      uploadImage(annotatedJpegFile, cleanBatchNumber),
    ]);
  };

  const handleCapture = async () => {
    const video = webcamRef.current.video;

    const plainCanvas = document.createElement("canvas");
    const plainContext = plainCanvas.getContext("2d");
    plainCanvas.width = 3840;
    plainCanvas.height = 2160;
    plainContext.drawImage(video, 0, 0, plainCanvas.width, plainCanvas.height);

    const annotatedCanvas = document.createElement("canvas");
    const annotatedContext = annotatedCanvas.getContext("2d");
    annotatedCanvas.width = 3840;
    annotatedCanvas.height = 2160;
    annotatedContext.drawImage(video, 0, 0, annotatedCanvas.width, annotatedCanvas.height);

    const analysisResults = [];

    for (let i = 0; i < 3; i++) {
      const smallCanvas = document.createElement("canvas");
      smallCanvas.width = 640;
      smallCanvas.height = 360;
      smallCanvas.getContext("2d").drawImage(plainCanvas, 0, 0, smallCanvas.width, smallCanvas.height);

      const blob = await new Promise((resolve) => {
        smallCanvas.toBlob(resolve, "image/jpeg", 0.8);
      });

      const analysisResult = await analyzeWithRoboflow(blob);
      analysisResults.push(analysisResult);

      if (i < 2) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    const averagedResults = {
      unripe: 0,
      semi_ripe: 0,
      ripe: 0,
      overripe: 0,
    };

    analysisResults.forEach((result) => {
      averagedResults.unripe += parseFloat(result.unripe || 0);
      averagedResults.semi_ripe += parseFloat(result.semi_ripe || 0);
      averagedResults.ripe += parseFloat(result.ripe || 0);
      averagedResults.overripe += parseFloat(result.overripe || 0);
    });

    averagedResults.unripe /= analysisResults.length;
    averagedResults.semi_ripe /= analysisResults.length;
    averagedResults.ripe /= analysisResults.length;
    averagedResults.overripe /= analysisResults.length;

    setRoboflowResults({
      unripe: averagedResults.unripe.toFixed(2),
      semi_ripe: averagedResults.semi_ripe.toFixed(2),
      ripe: averagedResults.ripe.toFixed(2),
      overripe: averagedResults.overripe.toFixed(2),
    });

    if (analysisResults[analysisResults.length - 1].predictions.length > 0) {
      drawBoundingBoxes(annotatedContext, annotatedCanvas, analysisResults[analysisResults.length - 1].predictions);
      drawRipenessCounts(annotatedContext, annotatedCanvas, averagedResults);
    }

    drawOverlayText(
      annotatedContext,
      annotatedCanvas,
      batchNumber,
      farmerName,
      ripeness,
      color,
      foreignMatter,
      overallQuality
    );

    saveAndUploadImage(plainCanvas, annotatedCanvas, batchNumber);

    setOpen(false);
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

    const ripenessCSV = ripeness.join(", ");
    const colorCSV = color.join(", ");

    if (!session || !session.user) {
      console.error("No user session found.");
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
    setOpen,
    rfid,
    rfidTag,
    roboflowResults,
    webcamRef,
    fetchData,
    handleRfidScan,
    handleBatchNumberSearch,
    handleSubmit,
    handleCapture,
  };
}
