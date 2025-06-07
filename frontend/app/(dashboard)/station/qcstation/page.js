"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from "next-auth/react";
import {
  Typography,
  Grid,
  Button,
  TextField,
  Snackbar,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  OutlinedInput,
} from '@mui/material';
import Alert from '@mui/material/Alert';
import Webcam from 'react-webcam';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import axios from "axios";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import dayjs from 'dayjs';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const QCStation = () => {
  const { data: session, status } = useSession();
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
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [open, setOpen] = useState(false);
  const webcamRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [rfid, setRfid] = useState('');
  const [rfidTag, setRfidTag] = useState('');

  // Roboflow results
  const [roboflowResults, setRoboflowResults] = useState({
    unripe: null,
    semi_ripe: null,
    ripe: null,
    overripe: null,
  });

  const ITEM_HEIGHT = 48;
  const ITEM_PADDING_TOP = 8;
  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
        width: 250,
      },
    },
  };

  useEffect(() => {
    fetchQCData();
  }, [qcData]);

  const fetchQCData = async () => {
    try {
      const response = await fetch('https://processing-facility-backend.onrender.com/api/qc');
      if (!response.ok) throw new Error('Failed to fetch QC data');
      const data = await response.json();
      setQcData(data.distinctRows || []);
    } catch (error) {
      console.error('Error fetching QC data:', error);
    }
  };

  const handleCloseSnackbar = () => {
      setOpenSnackbar(false);
  };

  const handleRfidScan = async () => {
    try {
      const response = await fetch(`https://processing-facility-backend.onrender.com/api/get-rfid/QC`);
      if (!response.ok) {
          throw new Error(`Failed to fetch RFID: ${response.status}`);
      }
      const data = await response.json();

      if (data.rfid) {
          setRfid(data.rfid);
          const receivingResponse = await fetch(`https://processing-facility-backend.onrender.com/api/receivingrfid/${data.rfid}`);
          if (!receivingResponse.ok) {
              throw new Error(`Failed to fetch receiving data: ${receivingResponse.status}`);
          }
          const receivingData = await receivingResponse.json();

          if (receivingData && receivingData.length > 0) {
              const batchData = receivingData[0];
              setBatchNumber(batchData.batchNumber);
              setFarmerName(batchData.farmerName);
              setReceivingDate(batchData.receivingDateTrunc || '');
              setWeight(batchData.weight || '');
              setTotalBags(batchData.totalBags || '');
              setContractType(batchData.contractType || '');
              setSnackbarMessage(`Data for batch ${batchData.batchNumber} retrieved successfully!`);
              setSnackbarSeverity('success');
              await clearRfidData("qc");
            } else {
              setSnackbarMessage('No receiving data found for this RFID.');
              setSnackbarSeverity('warning');
            }
      } else {
        setSnackbarMessage('No RFID tag scanned yet.');
        setSnackbarSeverity('warning');
      }
    } catch (error) {
        console.error('Error fetching batch number or receiving data:', error);
        setSnackbarMessage('Error retrieving data. Please try again.');
        setSnackbarSeverity('error');
    } finally {
        setOpenSnackbar(true);
    }
  };

  const clearRfidData = async () => {
      try {
          const response = await fetch(`https://processing-facility-backend.onrender.com/api/clear-rfid/QC`, { method: 'DELETE' });
          if (!response.ok) {
              throw new Error(`Failed to clear RFID Data: ${response.status}`);
          }
      } catch (error) {
          console.error("Error clearing RFID Data:", error);
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
        data.predictions.forEach(({ confidence, class: ripeness }) => {
            if (confidence >= 0.5) ripenessCounts[ripeness]++;
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

  const handleCapture = async () => {
    const video = webcamRef.current.video;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
  
    canvas.width = 3840;
    canvas.height = 2160;
  
    const analysisResults = [];
  
    for (let i = 0; i < 3; i++) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
  
      const smallCanvas = document.createElement("canvas");
      smallCanvas.width = 640;
      smallCanvas.height = 360;
      smallCanvas.getContext("2d").drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);
  
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
      drawBoundingBoxes(context, canvas, analysisResults[analysisResults.length - 1].predictions);
      drawRipenessCounts(context, canvas, averagedResults);
    }
  
    saveAndUploadImage(canvas, batchNumber);
  
    setOpen(false);
  };

  const drawOverlayText = (ctx, canvas, batch, farmer, ripeness, color, foreignMatter, quality) => {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(10, canvas.height - 240, 400, 240);
    ctx.fillStyle = "#fff";
    ctx.font = "20px Arial";

    const labels = [
      `Batch Number: ${batch}`,
      `Farmer Name: ${farmer}`,
      `Ripeness: ${ripeness}`,
      `Color: ${color}`,
      `Foreign Matter: ${foreignMatter}`,
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
        .filter(({ confidence }) => confidence > 0.5)
        .forEach(({ x, y, width, height, class: ripeness, confidence }) => {
            const color = colorMap[ripeness] || "#FFFFFF";
            const xScaled = x * scaleX, yScaled = y * scaleY;
            const widthScaled = width * scaleX, heightScaled = height * scaleY;

            ctx.strokeStyle = color;
            ctx.lineWidth = 8;
            ctx.strokeRect(xScaled - widthScaled / 2, yScaled - heightScaled / 2, widthScaled, heightScaled);

            ctx.fillStyle = color;
            ctx.font = "bold 36px Arial";
            ctx.fillText(`${ripeness} ${(confidence * 100).toFixed(1)}%`, xScaled - widthScaled / 2, yScaled - heightScaled / 2 - 10);
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

  const saveAndUploadImage = async (canvas, batchNumber) => {
    const imageSrc = canvas.toDataURL("image/jpeg", 1);
    const byteString = atob(imageSrc.split(",")[1]);
    const mimeString = imageSrc.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    const file = new Blob([ab], { type: mimeString });

    const cleanBatchNumber = batchNumber.trim().replace(/\s+/g, "");
    const jpegFile = new File([file], `image_${cleanBatchNumber}.jpeg`, { type: "image/jpeg" });

    await uploadImage(jpegFile, cleanBatchNumber);
  };

  const uploadImage = async (file, batchNumber) => {
    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("batchNumber", batchNumber);

        const response = await fetch("https://processing-facility-backend.onrender.com/api/upload-image", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) throw new Error("Failed to upload image");

        const data = await response.json();
        console.log("Image uploaded successfully:", data);
    } catch (error) {
        console.error("Error uploading image:", error);
    }
  };

  useEffect(() => {
    const fetchReceivingData = async () => {
      try {
        const response = await fetch('https://processing-facility-backend.onrender.com/api/receiving');
        if (!response.ok) throw new Error('Failed to fetch receiving data');
  
        const data = await response.json();
        if (data && Array.isArray(data.allRows)) {
          const qcBatchNumbers = new Set(qcData.map(qc => qc.batchNumber));
          
          const filteredReceivingData = data.allRows
            .filter(receiving => !qcBatchNumbers.has(receiving.batchNumber))
            .map(receiving => ({
              ...receiving,
              slaDays: calculateSLA(receiving.receivingDate, receiving.lastProcessingDate),
            }));
  
          setReceivingData(filteredReceivingData);
        } else {
          console.error('Unexpected data format:', data);
          setReceivingData([]);
        }
      } catch (error) {
        console.error('Error fetching receiving data:', error);
        setReceivingData([]);
      }
    };

    fetchReceivingData();
  }, [qcData]);

  const calculateSLA = (receivingDate, lastProcessingDate) => {
    const received = new Date(receivingDate);
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

  const handleBatchNumberSearch = async () => {
    try {
      const response = await fetch(`https://processing-facility-backend.onrender.com/api/receiving/${batchNumber}`);
      if (!response.ok) throw new Error('Failed to fetch receiving data');
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const batchData = data[0];
        setFarmerName(batchData.farmerName || '');
        setReceivingDate(batchData.receivingDateTrunc || '');
        setWeight(batchData.weight || '');
        setTotalBags(batchData.totalBags || '');
        setContractType(batchData.contractType || '');
        setSnackbarMessage(`Data for batch ${batchNumber} retrieved successfully!`);
        setSnackbarSeverity('success');
      } else {
        setSnackbarMessage('No valid data found for this batch number.');
        setSnackbarSeverity('warning');
      }
    } catch (error) {
      console.error('Error fetching receiving data:', error);
      setSnackbarMessage(`Error: ${error.message}`);
      setSnackbarSeverity('error');
    } finally {
      setOpenSnackbar(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const ripenessCSV = ripeness.join(", ");
    const colorCSV = color.join(", ");

    if (!session || !session.user) {
      console.error("No user session found.");
      setSnackbarMessage('No user session found.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    if (contractType === 'Beli Putus' && (!price || parseFloat(price) < 0)) {
      setSnackbarMessage('Price per kg is required for Beli Putus and must be non-negative.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
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
      const response = await fetch('https://processing-facility-backend.onrender.com/api/qc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(qcDataPayload),
      });
      if (!response.ok) throw new Error('Failed to submit QC data');

      setSnackbarMessage(`QC data for batch ${batchNumber} submitted successfully!`);
      setSnackbarSeverity('success');

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

      const refreshQCData = await fetch('https://processing-facility-backend.onrender.com/api/qc');
      const refreshData = await refreshQCData.json();
      setQcData(refreshData.distinctRows || []);

    } catch (error) {
      console.error('Error submitting QC data:', error);
      setSnackbarMessage('Failed to submit QC data. Please try again.');
      setSnackbarSeverity('error');
    } finally {
      setOpenSnackbar(true);
    }
  };

  const handleExportToPDF = (row) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [241.3, 279.4]
    });

    const addText = (text, x, y, options = {}) => {
        doc.setFont('courier');
        doc.setFontSize(10);

        if (options.bold) {
            doc.setFont('courier', 'bold');
        }
        if (options.align) {
            doc.text(text, x, y, { align: options.align });
        } else {
            doc.text(text, x, y);
        }
    };

    addText("PT. Berkas Tuaian Melimpah", doc.internal.pageSize.getWidth() / 2, 10, { align: 'center', bold: true });
    addText("Cherry Receiving & QC Report", doc.internal.pageSize.getWidth() / 2, 16, { align: 'center', bold: true });
    addText(`Date: ${dayjs().format('YYYY-MM-DD')}`, doc.internal.pageSize.getWidth() - 10, 10, { align: 'right' });
    addText(`Time: ${dayjs().format('HH:mm:ss')}`, doc.internal.pageSize.getWidth() - 10, 16, { align: 'right' });
    doc.line(5, 20, doc.internal.pageSize.getWidth() - 5, 20);
    addText(`Batch Number: ${row.batchNumber}`, 10, 28, { bold: true });

    let yOffset = 38;
    const columnWidth = (doc.internal.pageSize.getWidth() - 30) / 2;

    addText("Receiving Information:", 10, yOffset, { bold: true });
    yOffset += 6;
    addText(`Farmer Name    : ${row.farmerName || '-'}`, 10, yOffset);
    yOffset += 6;
    addText(`Receiving Date : ${dayjs(row.receivingDate).format('YYYY-MM-DD')}`, 10, yOffset);
    yOffset += 6;
    addText(`Total Weight   : ${row.weight} kg`, 10, yOffset);
    yOffset += 6;
    addText(`Total Bags     : ${row.totalBags}`, 10, yOffset);
    yOffset += 6;
    addText(`Type           : ${row.type || '-'}`, 10, yOffset);
    yOffset += 6;

    addText("Receiving Notes:", 10, yOffset);
    yOffset += 2;
    const recNotesX = 10;
    const recNotesY = yOffset;
    const recNotesWidth = columnWidth;
    const recNotesHeight = 18;
    doc.rect(recNotesX, recNotesY, recNotesWidth, recNotesHeight);
    const recNotesLines = doc.splitTextToSize(row.receivingNotes || '', recNotesWidth - 5);
    recNotesLines.forEach((line, index) => {
        addText(line, recNotesX + 2, recNotesY + 4 + (index * 6));
    });

    yOffset += recNotesHeight + 6;

    let qcOffset = 38;
    addText("QC Information :", 10 + columnWidth + 10, qcOffset, { bold: true });
    qcOffset += 6;
    addText(`QC Date         : ${dayjs(row.qcDate).format('YYYY-MM-DD')}`, 10 + columnWidth + 10, qcOffset);
    qcOffset += 6;
    addText(`Ripeness        : ${row.ripeness || '-'}`, 10 + columnWidth + 10, qcOffset);
    qcOffset += 6;
    addText(`Color           : ${row.color || '-'}`, 10 + columnWidth + 10, qcOffset);
    qcOffset += 6;
    addText(`Foreign Matter  : ${row.foreignMatter || '-'}`, 10 + columnWidth + 10, qcOffset);
    qcOffset += 6;
    addText(`Unripe (%)      : ${row.unripePercentage || '-'}`, 10 + columnWidth + 10, qcOffset);
    qcOffset += 6;
    addText(`Semi-ripe (%)   : ${row.semiripePercentage || '-'}`, 10 + columnWidth + 10, qcOffset);
    qcOffset += 6;
    addText(`Ripe (%)        : ${row.ripePercentage || '-'}`, 10 + columnWidth + 10, qcOffset);
    qcOffset += 6;
    addText(`Overripe (%)    : ${row.overripePercentage || '-'}`, 10 + columnWidth + 10, qcOffset);
    qcOffset += 6;
    addText(`Overall Quality : ${row.overallQuality || '-'}`, 10 + columnWidth + 10, qcOffset);
    qcOffset += 6;
    addText("QC Notes:", 10 + columnWidth + 10, qcOffset);
    qcOffset += 2;
    const qcNotesX = 10 + columnWidth + 10;
    const qcNotesY = qcOffset;
    const qcNotesWidth = columnWidth;
    const qcNotesHeight = 18;
    doc.rect(qcNotesX, qcNotesY, qcNotesWidth, qcNotesHeight);
    const qcNotesLines = doc.splitTextToSize(row.qcNotes || '', qcNotesWidth - 5);
    qcNotesLines.forEach((line, index) => {
        addText(line, qcNotesX + 2, qcNotesY + 4 + (index * 6));
    });

    qcOffset += qcNotesHeight + 6;

    let paymentDetailsY = Math.max(yOffset, qcOffset) + 5;

    addText("Payment Details:", 10, paymentDetailsY, { bold: true });
    doc.line(10, paymentDetailsY + 2, doc.internal.pageSize.getWidth() - 10, paymentDetailsY + 2);

    addText(`Payment Method    : ${row.paymentMethod || '-'}`, 10, paymentDetailsY + 8);
    addText(`Quality Group     : ${row.priceGroup || '-'}`, 10, paymentDetailsY + 14);

    const formattedMinPrice = row.minPrice ? row.minPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';
    const formattedMaxPrice = row.maxPrice ? row.maxPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';
    const formattedPricePerKg = row.price ? row.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';
    const totalPrice = (row.price && row.weight) ? (row.price * row.weight).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';

    addText(`Min Price (Today) : Rp ${formattedMinPrice}`, 10, paymentDetailsY + 20);
    addText(`Max Price (Today) : Rp ${formattedMaxPrice}`, 10, paymentDetailsY + 26);
    addText(`Price/kg          : Rp ${formattedPricePerKg}`, 10, paymentDetailsY + 32);
    addText(`Total Price       : Rp ${totalPrice}`, 10, paymentDetailsY + 38);
    addText(`Farmer Name       : ${row.farmerName || '-'}`, 10, paymentDetailsY + 44);
    addText(`Bank Name         : ${row.bankName || '-'}`, 10, paymentDetailsY + 50);
    addText(`Bank Account      : ${row.bankAccount || '-'}`, 10, paymentDetailsY + 56);

    let signatureOffset = paymentDetailsY + 70;
    doc.line(5, signatureOffset, doc.internal.pageSize.getWidth() - 5, signatureOffset);

    const signatureY = signatureOffset + 40;
    const labelY = signatureY + 6;

    const signatureLength = 20;

    addText("_".repeat(signatureLength), 10, signatureY);
    addText("Receiving Staff", 10, labelY);
    addText(`${row.receivingUpdatedBy || '-'}`, 10, labelY + 6);

    addText("_".repeat(signatureLength), 70, signatureY);
    addText("QC Staff" , 70, labelY);
    addText(`${row.qcCreatedBy || '-'}` , 70, labelY + 6);

    addText("_".repeat(signatureLength), 130, signatureY);
    addText("Manager", 130, labelY);
    addText('Haris Ariansyah', 130, labelY + 6);

    addText("_".repeat(signatureLength), 190, signatureY);
    addText("Farmer", 190, labelY);
    addText(`${row.farmerName || '-'}`, 190, labelY + 6);

    doc.line(5, doc.internal.pageSize.getHeight() - 10, doc.internal.pageSize.getWidth() - 5, doc.internal.pageSize.getHeight() - 10);
    addText(`Printed on: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`, 10, doc.internal.pageSize.getHeight() - 5);

    const filename = `QC_Report_${row.batchNumber}.pdf`;
    doc.save(filename);

    doc.autoPrint();
    const pdfData = doc.output('bloburl');

    const printWindow = window.open('', '_blank');

    if (printWindow) {
        printWindow.document.write(`<iframe src="${pdfData}" width="100%" height="100%" style="border: none;"></iframe>`);
        printWindow.document.close();
        printWindow.onload = () => {
            setTimeout(() => { printWindow.focus(); }, 100);
        }
    } else {
        alert('Please allow popups for this site to enable automatic printing.');
        doc.output('dataurlnewwindow');
    }
};

  const qcColumns = [
    {
			field: "export",
			headerName: "Export Data",
			width: 130,
			renderCell: (params) => (
					<button
					onClick={() => handleExportToPDF(params.row)}
					style={{
							padding: "6px 12px",
							backgroundColor: "#1976d2",
							color: "#fff",
							border: "none",
							borderRadius: "4px",
							cursor: "pointer",
					}}
					>
					Export PDF
					</button>
			),
			},
    { field: 'batchNumber', headerName: 'Batch Number', width: 150 },
    { field: 'receivingDate', headerName: 'Receiving Date', width: 110 },
    { field: 'qcDate', headerName: 'QC Date', width: 110 },
    { field: 'type', headerName: 'Type', width: 110 },
    { field: 'ripeness', headerName: 'Ripeness', width: 140 },
    { field: 'color', headerName: 'Color', width: 140 },
    {
      field: "foreignMatter",
      headerName: "Foreign Matter",
      width: 150,
      renderCell: (params) => {
        const color =
          params.value === "None"
            ? "rgb(123, 216, 123)"
            : params.value === "Some"
            ? "rgb(228, 228, 149)"
            : params.value === "Yes"
            ? "rgb(241, 145, 145)"
            : "transparent";

        return (
          <div
            style={{
              backgroundColor: color,
              color: color === "rgba(255, 0, 0, 0.5)" || color === "rgba(0, 255, 0, 0.5)" ? "black" : "black",
              padding: "8px",
              borderRadius: "4px",
            }}
          >
            {params.value}
          </div>
        );
      },
    },
    { field: 'unripePercentage', headerName: 'Unripe (%)', width: 180 },
    { field: 'semiripePercentage', headerName: 'Semi Ripe (%)', width: 180 },
    { field: 'ripePercentage', headerName: 'Ripe (%)', width: 180 },
    { field: 'overripePercentage', headerName: 'Overripe (%)', width: 180 },
    { field: 'overallQuality', headerName: 'Overall Quality', width: 140 },
    { field: 'qcNotes', headerName: 'QC Notes', width: 180 },
    { field: 'receivingNotes', headerName: 'Receiving Notes', width: 180 },
    { field: 'receivingUpdatedBy', headerName: 'Receiving Staff', width: 140 },
    { field: 'qcCreatedBy', headerName: 'QC Staff', width: 140 },
    { field: 'farmerName', headerName: 'Farmer Name', width: 140 },
    { field: 'paymentMethod', headerName: 'Payment Method', width: 140 },
    { field: 'bankAccount', headerName: 'Bank Account', width: 140 },
    { field: 'bankName', headerName: 'Bank Name', width: 140 },
    { field: 'cherryGroup', headerName: 'Cherry Quality Group', width: 140 },
    { field: 'priceGroup', headerName: 'Cherry Price Group', width: 140 },
    { field: 'minPrice', headerName: 'Minimum Price', width: 140 },
    { field: 'maxPrice', headerName: 'Maximum Price', width: 140 },
    { field: 'validAt', headerName: 'Price Valid At', width: 140 },
    { field: 'validUntil', headerName: 'Price Valid Until', width: 140 },
    { field: 'price', headerName: 'Final Cherry Price', width: 140 },
  ];

  const pendingQcColumns = [
    { field: 'batchNumber', headerName: 'Batch Number', width: 150 },
    { field: 'farmerName', headerName: 'Farmer Name', width: 150 },
    { field: 'receivingDateTrunc', headerName: 'Receiving Date', width: 120 },
    { field: 'weight', headerName: 'Weight (kg)', width: 150 },
    { field: 'totalBags', headerName: 'Total Bags', width: 150 },
    { field: 'slaDays', headerName: 'SLA (Days)', width: 150 },
  ];

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'manager' && session.user.role !== 'staff')) {
    return (
      <Typography variant="h6">
        Access Denied. You do not have permission to view this page.
      </Typography>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
              QC Station Form
            </Typography>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleRfidScan}
                    style={{ marginTop: '24px' }}
                  >
                    Get RFID Tag
                  </Button>
                </Grid>
                
                <Grid item xs>
                  <TextField
                    label="Batch Number Lookup"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder="Enter batch number to search"
                    fullWidth
                    required
                    margin="normal"
                  />
                </Grid>

                <Grid item>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleBatchNumberSearch}
                    style={{ marginTop: '24px' }}
                  >
                    Search
                  </Button>
                </Grid>
              </Grid>
              {farmerName && (
                <div>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        label="Farmer Name"
                        value={farmerName}
                        InputProps={{ readOnly: true }}
                        fullWidth
                        margin="normal"
                        sx={{marginTop: "16px"}}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Date Received"
                        value={receivingDate}
                        InputProps={{ readOnly: true }}
                        fullWidth
                        margin="normal"
                        sx={{marginTop: "16px"}}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Total Weight"
                        value={weight}
                        InputProps={{ readOnly: true }}
                        fullWidth
                        margin="normal"
                        sx={{marginTop: "16px"}}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Total Bags"
                        value={totalBags}
                        InputProps={{ readOnly: true }}
                        fullWidth
                        margin="normal"
                        sx={{marginTop: "16px"}}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Contract Type"
                        value={contractType}
                        InputProps={{ readOnly: true }}
                        fullWidth
                        margin="normal"
                        sx={{marginTop: "16px"}}
                      />
                    </Grid>
                  </Grid>
                  <Divider style={{ margin: '16px 0' }} />
                </div>
              )}

              <FormControl fullWidth required sx={{marginTop: "16px"}}>
                <InputLabel id="ripeness-label">Ripeness</InputLabel>
                <Select
                  labelId="ripeness-label"
                  id="ripeness"
                  multiple
                  value={ripeness}
                  onChange={(e) => setRipeness(e.target.value)}
                  input={<OutlinedInput label="Ripeness" />}
                  MenuProps={MenuProps}
                >
                  <MenuItem value="Unripe">Unripe</MenuItem>
                  <MenuItem value="Semiripe">Semi-ripe</MenuItem>
                  <MenuItem value="Ripe">Ripe</MenuItem>
                  <MenuItem value="Overripe">Overripe</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth required sx={{marginTop: "16px"}}>
                <InputLabel id="color-label">Color</InputLabel>
                <Select
                  labelId="color-label"
                  id="color"
                  multiple
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  input={<OutlinedInput label="Color" />}
                  MenuProps={MenuProps}
                >
                  <MenuItem value="Green">Green</MenuItem>
                  <MenuItem value="Yellowish Green">Yellowish Green</MenuItem>
                  <MenuItem value="Yellow">Yellow</MenuItem>
                  <MenuItem value="Red">Red</MenuItem>
                  <MenuItem value="Dark Red">Dark Red</MenuItem>
                  <MenuItem value="Black">Black</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth required sx={{marginTop: "16px"}}>
                <InputLabel id="fm-label">Foreign Matter</InputLabel>
                <Select
                  labelId="fm-label"
                  id="fm"
                  value={foreignMatter}
                  onChange={(e) => setForeignMatter(e.target.value)}
                  input={<OutlinedInput label="Foreign Matter" />}
                  MenuProps={MenuProps}
                >
                  <MenuItem value="None">None</MenuItem>
                  <MenuItem value="Some">Some</MenuItem>
                  <MenuItem value="Yes">Yes</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth required sx={{marginTop: "16px"}}>
                <InputLabel id="oq-label">Overall Quality</InputLabel>
                <Select
                  labelId="oq-label"
                  id="oq"
                  value={overallQuality}
                  onChange={(e) => setOverallQuality(e.target.value)}
                  input={<OutlinedInput label="Overall Quality" />}
                  MenuProps={MenuProps}
                >
                  <MenuItem value="Poor">Poor</MenuItem>
                  <MenuItem value="Fair">Fair</MenuItem>
                  <MenuItem value="Good">Good</MenuItem>
                  <MenuItem value="Excellent">Excellent</MenuItem>
                </Select>
              </FormControl>

              {contractType === 'Beli Putus' && (
                <TextField
                  label="Price per kg (Rp)"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  type="number"
                  fullWidth
                  required
                  margin="normal"
                  inputProps={{ min: 0, step: 0.01 }}
                />
              )}

              <FormControl fullWidth required sx={{marginTop: "16px"}}>
                <InputLabel id="pm-label">Payment Method</InputLabel>
                <Select
                  labelId="pm-label"
                  id="pm"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  input={<OutlinedInput label="Payment Method" />}
                  MenuProps={MenuProps}
                >
                  <MenuItem value="Cash to Farmer">Cash to Farmer</MenuItem>
                  <MenuItem value="Cash to Broker">Cash to Broker</MenuItem>
                  <MenuItem value="Bank Transfer">Bank Transfer to Farmer</MenuItem>
                  <MenuItem value="Bank Transfer">Bank Transfer to Broker</MenuItem>
                  <MenuItem value="Check">Contract</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                label="QC Notes"
                multiline
                rows={4}
                value={qcNotes}
                onChange={(e) => setQcNotes(e.target.value)}
                placeholder="Add QC notes"
                fullWidth
                margin="normal"
              />

              {roboflowResults.unripe !== null && (
                <TextField
                  label="Unripe"
                  value={roboflowResults.unripe}
                  fullWidth
                  margin="normal"
                  InputProps={{
                    readOnly: true,
                  }}
                />
              )}

              {roboflowResults.semi_ripe !== null && (
                <TextField
                  label="Semi-Ripe"
                  value={roboflowResults.semi_ripe}
                  fullWidth
                  margin="normal"
                  InputProps={{
                    readOnly: true,
                  }}
                />
              )}

              {roboflowResults.ripe !== null && (
                <TextField
                  label="Ripe"
                  value={roboflowResults.ripe}
                  fullWidth
                  margin="normal"
                  InputProps={{
                    readOnly: true,
                  }}
                />
              )}

              {roboflowResults.overripe !== null && (
                <TextField
                  label="Overripe"
                  value={roboflowResults.overripe}
                  fullWidth
                  margin="normal"
                  InputProps={{
                    readOnly: true,
                  }}
                />
              )}

              <Button 
                variant="contained" 
                color="secondary" 
                onClick={() => setOpen(true)} 
                style={{ marginTop: '16px', marginRight: '16px' }}
                disabled={!batchNumber}
                >
                Capture Sample Image
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                style={{ marginTop: '16px' }}
                disabled={!batchNumber}
                >
                Submit QC Data
              </Button>

              <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xl" fullWidth>
                <DialogTitle>Capture Sample Image</DialogTitle>
                <DialogContent>
                  <Card variant="outlined" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
                    <CardContent>
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        videoConstraints={{
                          width: 1920,
                          height: 1080,
                          facingMode: "user",
                        }}
                        screenshotFormat="image/jpeg"
                        onUserMediaError={error => console.error('Webcam error:', error)}
                      />
                    </CardContent>
                  </Card>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center' }}>
                  <Button onClick={handleCapture} color="primary" variant="contained">
                    Capture
                  </Button>
                  <Button onClick={() => setOpen(false)} color="secondary" variant="contained">
                    Cancel
                  </Button>
                </DialogActions>
              </Dialog>
            </form>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Pending QC
            </Typography>
            <div style={{ height: 800, width: '100%' }}>
              <DataGrid
                rows={receivingData.map((row, index) => ({
                  id: index + 1,
                  ...row,
                }))}
                columns={pendingQcColumns}
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

        <Divider style={{ margin: '16px 0' }} />
      </Grid>

      <Grid item xs={12} md={12}>
        <Card style={{ marginTop: '16px' }} variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Completed QC
            </Typography>
            <div style={{ height: 1000, width: '100%' }}>
              <DataGrid
                rows={qcData.map((row, index) => ({
                  id: index + 1,
                  ...row,
                }))}
                columns={qcColumns}
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
};

export default QCStation;