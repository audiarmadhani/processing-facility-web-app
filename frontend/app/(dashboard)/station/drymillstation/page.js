"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Button,
  Typography,
  Snackbar,
  Alert,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Divider,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import axios from "axios";
import jsPDF from "jspdf";

const DryMillStation = () => {
  const { data: session, status } = useSession();
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [parentBatches, setParentBatches] = useState([]);
  const [subBatches, setSubBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [grades, setGrades] = useState([]);
  const [currentWeights, setCurrentWeights] = useState({});
  const [rfid, setRfid] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [openCompleteDialog, setOpenCompleteDialog] = useState(false);
  const [openStorageDialog, setOpenStorageDialog] = useState(false);
  const [processingTypes, setProcessingTypes] = useState([]);
  const [productLines, setProductLines] = useState([]);
  const [referenceMappings, setReferenceMappings] = useState([]);
  const [sequenceAdjustments, setSequenceAdjustments] = useState([]);
  const [sequenceMap, setSequenceMap] = useState({});
  const [batchNumberToFetch, setBatchNumberToFetch] = useState(null);

  const fetchDryMillData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("https://processing-facility-backend.onrender.com/api/dry-mill-data");
      const data = response.data;
      console.log("Fetched Dry Mill Data:", data);

      const formattedData = data.map((batch) => ({
        batchNumber: batch.batchNumber,
        status: batch.status,
        dryMillEntered: batch.dryMillEntered,
        dryMillExited: batch.dryMillExited,
        cherry_weight: batch.cherry_weight || "N/A",
        producer: batch.producer || "N/A",
        farmerName: batch.farmerName || "N/A",
        productLine: batch.productLine || "N/A",
        processingType: batch.processingType || "N/A",
        quality: batch.quality || "N/A",
        totalBags: batch.totalBags || "N/A",
        notes: batch.notes || "N/A",
        type: batch.type || "N/A",
        storeddatetrunc: batch.storeddatetrunc || "N/A",
        isStored: batch.isStored,
        parentBatchNumber: batch.parentBatchNumber || null,
        weight: batch.weight || "N/A",
        referenceNumber: batch.referenceNumber || "N/A",
        bagWeights: batch.bagWeights || [],
      }));

      const parentBatchesData = formattedData.filter(
        (batch) => !batch.parentBatchNumber && !batch.isStored && batch.status !== "Processed"
      );
      const subBatchesData = formattedData.filter(
        (batch) => batch.parentBatchNumber
      );

      console.log("Parent Batches:", parentBatchesData);
      console.log("Sub-Batches:", subBatchesData);

      setParentBatches(parentBatchesData);
      setSubBatches(subBatchesData);
    } catch (error) {
      console.error("Error fetching dry mill data:", error);
      setSnackbarMessage(error.response?.data?.error || "Error fetching data. Please try again.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProcessingTypes = async () => {
    try {
      const response = await axios.get("https://processing-facility-backend.onrender.com/api/processing-types");
      setProcessingTypes(response.data);
    } catch (error) {
      console.error("Error fetching ProcessingTypes:", error);
      setSnackbarMessage("Failed to fetch ProcessingTypes.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const fetchProductLines = async () => {
    try {
      const response = await axios.get("https://processing-facility-backend.onrender.com/api/product-lines");
      setProductLines(response.data);
    } catch (error) {
      console.error("Error fetching ProductLines:", error);
      setSnackbarMessage("Failed to fetch ProductLines.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const fetchReferenceMappings = async () => {
    try {
      const response = await axios.get("https://processing-facility-backend.onrender.com/api/reference-mappings");
      setReferenceMappings(response.data);
    } catch (error) {
      console.error("Error fetching ReferenceMappings:", error);
      setSnackbarMessage("Failed to fetch ReferenceMappings.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const fetchExistingGrades = async (batchNumber) => {
    try {
      if (!selectedBatch) {
        throw new Error("Selected batch is not set.");
      }

      console.log("Fetching grades for batchNumber:", batchNumber, "with selectedBatch:", selectedBatch);

      const response = await axios.get(
        `https://processing-facility-backend.onrender.com/api/dry-mill-grades/${batchNumber}`
      );
      const data = response.data;
      if (!Array.isArray(data)) {
        throw new Error("Invalid response format: grades data is not an array");
      }

      if (selectedBatch.parentBatchNumber) {
        // Sub-batch: fetch only the specific grade matching selectedBatch.quality
        const normalizedQuality = selectedBatch.quality?.trim();
        const gradeData = data.find((grade) => grade.grade?.trim() === normalizedQuality) || {
          grade: normalizedQuality || "Grade 1",
          weight: "0",
          bagWeights: [],
          bagged_at: new Date().toISOString().split("T")[0],
          tempSequence: "0001",
          is_stored: false,
        };
        return [{
          grade: gradeData.grade,
          weight: parseFloat(gradeData.weight) || 0,
          bagWeights: Array.isArray(gradeData.bagWeights) ? gradeData.bagWeights.map(w => String(w)) : [],
          bagged_at: gradeData.bagged_at || new Date().toISOString().split("T")[0],
          tempSequence: gradeData.tempSequence || "0001",
          is_stored: gradeData.is_stored || false,
        }];
      } else {
        // Parent batch: fetch all grades
        const gradeOrder = ["Specialty Grade", "Grade 1", "Grade 2", "Grade 3", "Grade 4"];
        const fetchedGradesMap = {};
        data.forEach((grade) => {
          fetchedGradesMap[grade.grade] = {
            grade: grade.grade,
            weight: parseFloat(grade.weight) || 0,
            bagWeights: Array.isArray(grade.bagWeights) ? grade.bagWeights.map(w => String(w)) : [],
            bagged_at: grade.bagged_at || new Date().toISOString().split("T")[0],
            tempSequence: grade.tempSequence || "0001",
            is_stored: grade.is_stored || false,
          };
        });

        const gradesData = gradeOrder.map((grade) =>
          fetchedGradesMap[grade] || {
            grade,
            weight: 0,
            bagWeights: [],
            bagged_at: new Date().toISOString().split("T")[0],
            tempSequence: "0001",
            is_stored: false,
          }
        );

        gradesData.forEach((grade) => {
          if (grade.bagWeights.length > 0 && grade.tempSequence) {
            const key = `${selectedBatch?.parentBatchNumber || selectedBatch?.batchNumber}-${selectedBatch?.producer}-${selectedBatch?.productLine}-${selectedBatch?.processingType}-${selectedBatch?.type}-${grade.grade}`;
            setSequenceMap((prev) => ({
              ...prev,
              [key]: grade.tempSequence,
            }));
          }
        });

        return gradesData;
      }
    } catch (error) {
      console.error("Error fetching existing grades:", error);
      setSnackbarMessage(error.response?.data?.error || "Failed to fetch existing grades. Please try again.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return [
        {
          grade: selectedBatch?.quality?.trim() || "Grade 1",
          weight: 0,
          bagWeights: [],
          bagged_at: new Date().toISOString().split("T")[0],
          tempSequence: "0001",
          is_stored: false,
        }
      ];
    }
  };

  const fetchLatestRfid = async () => {
    try {
      const response = await axios.get("https://processing-facility-backend.onrender.com/api/get-rfid");
      const data = response.data;
      setRfid(data.rfid || "");
    } catch (error) {
      console.error("Error fetching latest RFID:", error);
      setSnackbarMessage(error.response?.data?.error || "Failed to fetch latest RFID.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const handleScanRfid = async () => {
    if (!rfid) {
      setSnackbarMessage("Please enter or fetch an RFID value.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }
    setIsScanning(true);
    try {
      const response = await axios.post("https://processing-facility-backend.onrender.com/api/scan-rfid", {
        rfid,
        scanned_at: "Dry_Mill",
      });
      const data = response.data;
      setRfid("");
      setSnackbarMessage(data.message);
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
      fetchDryMillData();
      if (data.exited_at) setOpenStorageDialog(true);
    } catch (error) {
      console.error("Error scanning RFID:", error);
      setSnackbarMessage(error.response?.data?.error || "Failed to scan RFID");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirmComplete = async () => {
    if (!selectedBatch || !session?.user?.email) return;
    try {
      const response = await axios.post(`https://processing-facility-backend.onrender.com/api/dry-mill/${selectedBatch.batchNumber}/complete`, {
        createdBy: session.user.email,
        updatedBy: session.user.email,
      });
      const data = response.data;
      setSnackbarMessage(data.message);
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
      setOpenDialog(false);
      setOpenCompleteDialog(false);
      fetchDryMillData();
    } catch (error) {
      console.error("Error marking batch as processed:", error);
      setSnackbarMessage(error.response?.data?.error || "Failed to mark batch as processed");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const handleConfirmStorage = async () => {
    if (!rfid) {
      setSnackbarMessage("Please enter an RFID value.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }
    try {
      const response = await axios.post("https://processing-facility-backend.onrender.com/api/warehouse/scan", {
        rfid,
        scanned_at: "Warehouse",
      });
      const data = response.data;
      setRfid("");
      setSnackbarMessage(data.message);
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
      setOpenStorageDialog(false);
      fetchDryMillData();
    } catch (error) {
      console.error("Error confirming storage:", error);
      setSnackbarMessage(error.response?.data?.error || "Failed to confirm storage");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const handleSortAndWeigh = async () => {
    if (!selectedBatch) return;
    try {
      const today = new Date().toISOString().slice(0, 10);
      const response = await axios.post(`https://processing-facility-backend.onrender.com/api/dry-mill/${selectedBatch.batchNumber}/split`, {
        grades: grades.map((g) => ({
          grade: g.grade,
          bagWeights: g.bagWeights,
          weight: g.weight.toString(),
          bagged_at: today,
          tempSequence: g.tempSequence,
        })),
      });
      const data = response.data;
      setSnackbarMessage(data.message);
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
      setOpenDialog(false);
      fetchDryMillData();
      setSequenceAdjustments([]);
    } catch (error) {
      console.error("Error saving green bean splits:", error);
      setSnackbarMessage(error.response?.data?.error || "Failed to save green bean splits");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      await revertSequenceNumber();
    }
  };

  const fetchSequenceNumber = async (grade) => {
    if (!selectedBatch) return "0001";

    const currentGrade = grades.find((g) => g.grade === grade);
    if (currentGrade && currentGrade.bagWeights.length > 0 && currentGrade.tempSequence) {
      return currentGrade.tempSequence;
    }

    const key = `${selectedBatch?.parentBatchNumber || selectedBatch?.batchNumber}-${selectedBatch?.producer}-${selectedBatch?.productLine}-${selectedBatch?.processingType}-${selectedBatch?.type}-${grade}`;
    
    if (sequenceMap[key]) {
      return sequenceMap[key];
    }

    try {
      const response = await axios.post("https://processing-facility-backend.onrender.com/api/lot-number-sequence", {
        producer: selectedBatch.producer,
        productLine: selectedBatch.productLine,
        processingType: selectedBatch.processingType,
        year: new Date().getFullYear().toString().slice(-2),
        grade,
        action: "increment",
      });
      const sequence = response.data.sequence;
      setSequenceAdjustments((prev) => [...prev, { grade, sequence, action: "increment" }]);
      setSequenceMap((prev) => ({ ...prev, [key]: sequence }));
      return sequence;
    } catch (error) {
      console.error("Error fetching sequence number:", error);
      setSnackbarMessage("Failed to fetch sequence number.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return "0001";
    }
  };

  const revertSequenceNumber = async () => {
    if (!selectedBatch || sequenceAdjustments.length === 0) return;
    try {
      for (const adjustment of sequenceAdjustments) {
        if (adjustment.action === "increment") {
          await axios.post("https://processing-facility-backend.onrender.com/api/lot-number-sequence", {
            producer: selectedBatch.producer,
            productLine: selectedBatch.productLine,
            processingType: selectedBatch.processingType,
            year: new Date().getFullYear().toString().slice(-2),
            grade: adjustment.grade,
            action: "decrement",
          });
        }
      }
      setSequenceAdjustments([]);
    } catch (error) {
      console.error("Error reverting sequence number:", error);
      setSnackbarMessage("Failed to revert sequence number.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const handlePrintLabel = (batchNumber, grade, bagIndex, bagWeight) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [100, 150] });
    const farmerName = selectedBatch?.farmerName || "Unknown Farmer";
    const companyName = selectedBatch?.producer === "BTM" ? "PT Berkas Tuaian Melimpah" : "HEQA";
    const productionDate = selectedBatch?.dryMillExited && selectedBatch.status === "Processed"
      ? new Date(selectedBatch.dryMillExited).toLocaleDateString()
      : new Date().toLocaleDateString();
    const producerAbbreviation = selectedBatch.producer === "BTM" ? "BTM" : "HQ";
    const producerReferenceAbbreviation = selectedBatch.producer === "BTM" ? "BTM" : "HEQA";
    const currentYear = new Date().getFullYear().toString().slice(-2);
    const productLineEntry = productLines.find((pl) => pl.productLine === selectedBatch.productLine) || {};
    const productLineAbbreviation = productLineEntry.abbreviation || "Unknown";
    const productLineReferenceAbbreviation = productLineAbbreviation === "R" ? "RE" : productLineAbbreviation === "M" ? "MI" : productLineAbbreviation === "C" ? "CO" : productLineAbbreviation;
    const processingTypeEntry = processingTypes.find((pt) => pt.processingType === selectedBatch.processingType) || {};
    const processingTypeAbbreviation = processingTypeEntry.abbreviation || "Unknown";
    const qualityAbbreviation = grade === "Specialty Grade" ? "S" : grade === "Grade 1" ? "G1" : grade === "Grade 2" ? "G2" : grade === "Grade 3" ? "G3" : "G4";
    const tempSequence = grades.find((g) => g.grade === grade)?.tempSequence || "0001";
    const lotNumber = `${producerAbbreviation}${currentYear}${productLineAbbreviation}-${processingTypeAbbreviation}-${tempSequence}-${qualityAbbreviation}`;
    const referenceMatch = referenceMappings.find((rm) => rm.producer === selectedBatch.producer && rm.productLine === selectedBatch.productLine && rm.processingType === selectedBatch.processingType && rm.type === selectedBatch.type) || {};
    const referenceSequence = referenceMatch.referenceNumber ? referenceMatch.referenceNumber.split("-")[3] : "000";
    const referenceNumber = `ID-${producerReferenceAbbreviation}-${productLineReferenceAbbreviation}-${referenceSequence}-${qualityAbbreviation}`;
    const cherryLotNumber = selectedBatch.batchNumber;
    const labels = [
      { label: "Lot Number", value: lotNumber },
      { label: "Reference Number", value: referenceNumber },
      { label: "Cherry Lot Number", value: cherryLotNumber },
      { label: "Farmer", value: farmerName },
      { label: "Type", value: selectedBatch?.type || "N/A" },
      { label: "Processing Type", value: selectedBatch?.processingType || "N/A" },
      { label: "Product Line", value: selectedBatch?.productLine || "N/A" },
      { label: "Grade", value: grade },
      { label: "Bag Weight", value: `${bagWeight} kg` },
      { label: "Bag Number", value: `${bagIndex + 1}` },
      { label: "Production Date", value: productionDate },
    ];
    const maxLabelLength = Math.max(...labels.map((l) => l.label.length));
    const padding = " ".repeat(maxLabelLength);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setFillColor(240, 240, 240);
    doc.rect(5, 5, 90, 20, "F");
    doc.text("Green Coffee Beans", 10, 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(companyName, 10, 20);

    doc.setFont("courier", "normal");
    doc.setFontSize(10);
    doc.rect(5, 30, 90, 115, "S");
    let y = 35;
    labels.forEach(({ label, value }) => {
      const paddedLabel = label + padding.slice(label.length);
      doc.text(`${paddedLabel} : ${value}`, 10, y);
      y += 7;
    });

    const pdfDataUri = doc.output("datauristring");
    const printWindow = window.open("", "_blank", "width=600,height=400");
    if (!printWindow) {
      setSnackbarMessage("Failed to open print window. Please allow popups for this site.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Label</title>
          <style>
            body { margin: 0; padding: 10px; font-family: Arial, sans-serif; }
            .container { display: flex; flex-direction: column; align-items: center; height: 100vh; }
            embed { width: 100%; height: 80%; }
            .button-container { margin-top: 10px; }
            button { padding: 10px 20px; font-size: 16px; cursor: pointer; }
          </style>
        </head>
        <body>
          <div class="container">
            <embed type="application/pdf" src="${pdfDataUri}" width="100%" height="100%">
            <div class="button-container">
              <button onclick="window.print()">Print</button>
              <button onclick="window.close()">Close</button>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(() => window.print(), 2000);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleAddBag = async (index, weight) => {
    if (!weight || isNaN(weight) || parseFloat(weight) <= 0) {
      setSnackbarMessage("Please enter a valid weight.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }
    if (selectedBatch?.isStored || grades[index]?.is_stored) {
      setSnackbarMessage("Cannot add bags to a stored batch.");
      setSnackbarSeverity("warning");
      setOpenSnackbar(true);
      return;
    }
    const grade = grades[index].grade;
    const sequence = selectedBatch.parentBatchNumber ? grades[index].tempSequence : await fetchSequenceNumber(grade);
    const newWeight = parseFloat(weight).toString();
    const updatedBagWeights = [...grades[index].bagWeights, newWeight];
    const totalWeight = parseFloat(grades[index].weight || 0) + parseFloat(weight);

    setGrades((prevGrades) => {
      const newGrades = [...prevGrades];
      newGrades[index] = {
        ...newGrades[index],
        bagWeights: updatedBagWeights,
        weight: totalWeight,
        tempSequence: sequence,
      };
      return newGrades;
    });
    setCurrentWeights((prev) => ({ ...prev, [index]: "" }));

    if (selectedBatch.parentBatchNumber) {
      try {
        await axios.post(`https://processing-facility-backend.onrender.com/api/dry-mill/${selectedBatch.batchNumber}/update-bags`, {
          grade,
          bagWeights: updatedBagWeights,
          weight: totalWeight.toString(),
          bagged_at: new Date().toISOString().slice(0, 10),
        });
        setSnackbarMessage("Bag added successfully.");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
        fetchDryMillData();
      } catch (error) {
        console.error("Error updating bags:", error);
        setSnackbarMessage(error.response?.data?.error || "Failed to update bags.");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        // Revert local state change
        setGrades((prevGrades) => {
          const newGrades = [...prevGrades];
          newGrades[index] = {
            ...newGrades[index],
            bagWeights: newGrades[index].bagWeights.filter((_, i) => i !== newGrades[index].bagWeights.length - 1),
            weight: parseFloat(newGrades[index].weight || 0) - parseFloat(weight),
          };
          return newGrades;
        });
      }
    }
  };

  const handleRemoveBag = async (gradeIndex, bagIndex) => {
    if (!selectedBatch) return;
    if (selectedBatch.isStored || grades[gradeIndex]?.is_stored) {
      setSnackbarMessage("Cannot remove bags from a stored batch.");
      setSnackbarSeverity("warning");
      setOpenSnackbar(true);
      return;
    }
    const grade = grades[gradeIndex].grade;
    const removedWeight = parseFloat(grades[gradeIndex].bagWeights[bagIndex]);
    const updatedBagWeights = grades[gradeIndex].bagWeights.filter((_, i) => i !== bagIndex);
    const totalWeight = parseFloat(grades[gradeIndex].weight || 0) - removedWeight;

    setGrades((prevGrades) => {
      const newGrades = [...prevGrades];
      newGrades[gradeIndex] = {
        ...newGrades[gradeIndex],
        bagWeights: updatedBagWeights,
        weight: totalWeight >= 0 ? totalWeight : 0,
      };
      return newGrades;
    });

    if (selectedBatch.parentBatchNumber) {
      try {
        await axios.post(`https://processing-facility-backend.onrender.com/api/dry-mill/${selectedBatch.batchNumber}/update-bags`, {
          grade,
          bagWeights: updatedBagWeights,
          weight: totalWeight >= 0 ? totalWeight.toString() : "0",
          bagged_at: new Date().toISOString().slice(0, 10),
        });
        setSnackbarMessage("Bag removed successfully.");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
        fetchDryMillData();
      } catch (error) {
        console.error("Error removing bag:", error);
        setSnackbarMessage(error.response?.data?.error || "Failed to remove bag.");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        // Revert local state change
        setGrades((prevGrades) => {
          const newGrades = [...prevGrades];
          newGrades[gradeIndex] = {
            ...newGrades[gradeIndex],
            bagWeights: grades[gradeIndex].bagWeights,
            weight: parseFloat(grades[gradeIndex].weight || 0) + removedWeight,
          };
          return newGrades;
        });
      }
    } else {
      setSequenceAdjustments((prev) => prev.filter((adj) => adj.grade !== grade));
    }
  };

  const handleSaveSubBatch = async () => {
    if (!selectedBatch || !grades[0]) return;
    if (selectedBatch.isStored || grades[0].is_stored) {
      setSnackbarMessage("Cannot save changes to a stored batch.");
      setSnackbarSeverity("warning");
      setOpenSnackbar(true);
      return;
    }
    try {
      await axios.post(`https://processing-facility-backend.onrender.com/api/dry-mill/${selectedBatch.batchNumber}/update-bags`, {
        grade: grades[0].grade,
        bagWeights: grades[0].bagWeights,
        weight: grades[0].weight.toString(),
        bagged_at: new Date().toISOString().slice(0, 10),
      });
      setSnackbarMessage("Sub-batch saved successfully.");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
      fetchDryMillData();
      setOpenDialog(false);
    } catch (error) {
      console.error("Error saving sub-batch:", error);
      setSnackbarMessage(error.response?.data?.error || "Failed to save sub-batch.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  useEffect(() => {
    fetchDryMillData();
    fetchLatestRfid();
    fetchProcessingTypes();
    fetchProductLines();
    fetchReferenceMappings();
    const intervalId = setInterval(() => {
      fetchDryMillData();
      fetchLatestRfid();
    }, 300000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (selectedBatch && batchNumberToFetch) {
      console.log("Fetching grades for batchNumber:", batchNumberToFetch);
      fetchExistingGrades(batchNumberToFetch).then((existingGrades) => {
        console.log("Fetched grades:", existingGrades);
        setGrades(existingGrades);
        const initialWeights = {};
        existingGrades.forEach((_, idx) => (initialWeights[idx] = ""));
        setCurrentWeights(initialWeights);
        setOpenDialog(true);
      });
    }
  }, [selectedBatch, batchNumberToFetch]);

  const handleRefreshData = () => {
    fetchDryMillData();
    fetchLatestRfid();
  };

  const handleCloseSnackbar = () => setOpenSnackbar(false);

  const handleDetailsClick = (batch) => {
    console.log("Selected batch:", batch);
    setSelectedBatch(batch);
    setBatchNumberToFetch(batch.batchNumber);
  };

  const handleCloseDialog = async () => {
    await revertSequenceNumber();
    setOpenDialog(false);
    setSelectedBatch(null);
    setBatchNumberToFetch(null);
    setGrades([]);
    setSequenceAdjustments([]);
  };

  const handleCloseCompleteDialog = () => {
    setOpenCompleteDialog(false);
    setSelectedBatch(null);
    setBatchNumberToFetch(null);
  };

  const handleCloseStorageDialog = () => {
    setOpenStorageDialog(false);
    setRfid("");
  };

  const parentColumns = [
    { field: "batchNumber", headerName: "Batch Number", width: 160 },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === "In Dry Mill" ? "primary" : params.value === "Processed" ? "success" : "default"}
          size="small"
          sx={{ borderRadius: "16px", fontWeight: "bold" }}
        />
      ),
    },
    {
      field: "details",
      headerName: "Details",
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Button variant="outlined" size="small" onClick={() => handleDetailsClick(params.row)}>
          Details
        </Button>
      ),
    },
    { field: "dryMillEntered", headerName: "Dry Mill Entered", width: 150 },
    { field: "dryMillExited", headerName: "Dry Mill Exited", width: 150 },
    { field: "cherry_weight", headerName: "Cherry Weight (kg)", width: 160 },
    { field: "producer", headerName: "Producer", width: 120 },
    { field: "productLine", headerName: "Product Line", width: 160 },
    { field: "processingType", headerName: "Processing Type", width: 180 },
    { field: "type", headerName: "Type", width: 120 },
    { field: "totalBags", headerName: "Total Bags", width: 120 },
    { field: "notes", headerName: "Notes", width: 180 },
  ];

  const subBatchColumns = [
    { field: "batchNumber", headerName: "Batch Number", width: 180 },
    { field: "referenceNumber", headerName: "Ref Number", width: 180 },
    { field: "parentBatchNumber", headerName: "Parent Batch", width: 160 },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === "In Dry Mill" ? "primary" : params.value === "Processed" ? "success" : "default"}
          size="small"
          sx={{ borderRadius: "16px", fontWeight: "bold" }}
        />
      ),
    },
    {
      field: "details",
      headerName: "Details",
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Button variant="outlined" size="small" onClick={() => handleDetailsClick(params.row)}>
          Details
        </Button>
      ),
    },
    { field: "dryMillEntered", headerName: "Dry Mill Entered", width: 150 },
    { field: "dryMillExited", headerName: "Dry Mill Exited", width: 150 },
    { field: "storeddatetrunc", headerName: "Stored Date", width: 150 },
    { field: "weight", headerName: "Weight (kg)", width: 140 },
    { field: "producer", headerName: "Producer", width: 120 },
    { field: "productLine", headerName: "Product Line", width: 160 },
    { field: "processingType", headerName: "Processing Type", width: 180 },
    { field: "type", headerName: "Type", width: 120 },
    { field: "quality", headerName: "Quality", width: 120 },
    { field: "totalBags", headerName: "Bags Qty", width: 120 },
    { field: "notes", headerName: "Notes", width: 180 },
    {
      field: "isStored",
      headerName: "Storage Status",
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value ? "Stored" : "Not Stored"}
          color={params.value ? "success" : "default"}
          size="small"
          sx={{ borderRadius: "16px", fontWeight: "bold" }}
        />
      ),
    },
  ];

  const getParentBatches = () =>
    [...parentBatches].sort((a, b) => {
      const statusOrder = { "In Dry Mill": 0, "Processed": 1, "Not Started": 2 };
      return (
        (statusOrder[a.status] || 2) - (statusOrder[b.status] || 2) ||
        (a.dryMillEntered === "N/A" ? Infinity : new Date(a.dryMillEntered)) -
        (b.dryMillEntered === "N/A" ? Infinity : new Date(b.dryMillEntered))
      );
    });

  const getSubBatches = () =>
    [...subBatches].sort((a, b) =>
      a.parentBatchNumber?.localeCompare(b.parentBatchNumber) || a.batchNumber.localeCompare(b.batchNumber)
    );

  const renderParentDataGrid = () => {
    const sortedData = getParentBatches();
    return (
      <DataGrid
        rows={sortedData}
        columns={parentColumns}
        initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
        pageSizeOptions={[5, 10, 20]}
        disableRowSelectionOnClick
        getRowId={(row) => row.batchNumber}
        slots={{ toolbar: GridToolbar }}
        autosizeOnMount
        autosizeOptions={{ includeHeaders: true, includeOutliers: true, expand: true }}
        rowHeight={35}
        sx={{ height: 400, width: "100%" }}
      />
    );
  };

  const renderSubBatchDataGrid = () => {
    const sortedData = getSubBatches();
    return (
      <DataGrid
        rows={sortedData}
        columns={subBatchColumns}
        initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
        pageSizeOptions={[5, 10, 20]}
        disableRowSelectionOnClick
        getRowId={(row) => row.batchNumber}
        slots={{ toolbar: GridToolbar }}
        autosizeOnMount
        autosizeOptions={{ includeHeaders: true, includeOutliers: true, expand: true }}
        rowHeight={35}
        sx={{ height: 600, width: "100%" }}
      />
    );
  };

  if (status === "loading") return <Typography>Loading...</Typography>;

  if (!session?.user || !["admin", "manager", "drymill", "postprocessing"].includes(session.user.role))
    return <Typography variant="h6">Access Denied. You do not have permission to view this page.</Typography>;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>Dry Mill Station - Active Batches</Typography>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleRefreshData}
              disabled={isLoading}
              sx={{ mb: 2, ml: 0 }}
              startIcon={isLoading ? <CircularProgress size={20} /> : undefined}
            >
              {isLoading ? "Refreshing..." : "Refresh Data"}
            </Button>
            {renderParentDataGrid()}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>Green Bean Sub-Batches</Typography>
            {renderSubBatchDataGrid()}
          </CardContent>
        </Card>
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Batch {selectedBatch?.batchNumber}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {grades.map((grade, index) => {
              const totalWeight = grade.weight || grade.bagWeights.reduce((sum, w) => sum + parseFloat(w || 0), 0);
              const totalBags = grade.bagWeights.length;
              return (
                <Grid item xs={12} key={`${grade.grade}-${index}`}>
                  <Box sx={{ mb: 2, p: 2, border: "1px solid #e0e0e0", borderRadius: 1 }}>
                    <Typography variant="subtitle1">{grade.grade}</Typography>
                    <Typography variant="body2">
                      Total Bags: {totalBags} | Total Weight: {totalWeight.toFixed(2)} kg
                      {grade.is_stored && " | Stored"}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: "flex", gap: 2, mb: 1, alignItems: "center" }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleAddBag(index, 50)}
                        disabled={selectedBatch?.isStored || grade.is_stored}
                        sx={{ mr: 1 }}
                      >
                        50 kg
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleAddBag(index, 60)}
                        disabled={selectedBatch?.isStored || grade.is_stored}
                        sx={{ mr: 1 }}
                      >
                        60 kg
                      </Button>
                      <TextField
                        label="Custom Weight (kg)"
                        value={currentWeights[index] || ""}
                        onChange={(e) => setCurrentWeights((prev) => ({ ...prev, [index]: e.target.value }))}
                        type="number"
                        inputProps={{ min: 0, step: 0.1 }}
                        variant="outlined"
                        sx={{ width: 150, mr: 1 }}
                        disabled={selectedBatch?.isStored || grade.is_stored}
                      />
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => handleAddBag(index, currentWeights[index])}
                        disabled={
                          selectedBatch?.isStored ||
                          grade.is_stored ||
                          !currentWeights[index] ||
                          isNaN(parseFloat(currentWeights[index])) ||
                          parseFloat(currentWeights[index]) <= 0
                        }
                      >
                        Add Bag
                      </Button>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box>
                      {grade.bagWeights.length > 0 ? (
                        grade.bagWeights.map((weight, bagIndex) => (
                          <Box
                            key={`${grade.grade}-bag-${bagIndex}`}
                            sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}
                          >
                            <Typography variant="body1">Bag {bagIndex + 1}: {parseFloat(weight).toFixed(2)} kg</Typography>
                            <Box sx={{ display: "flex", gap: 1 }}>
                              {selectedBatch?.isStored || grade.is_stored ? null : (
                                <Button
                                  variant="contained"
                                  color="error"
                                  size="small"
                                  onClick={() => handleRemoveBag(index, bagIndex)}
                                >
                                  Remove
                                </Button>
                              )}
                              <Button
                                variant="contained"
                                color="secondary"
                                size="small"
                                onClick={() => handlePrintLabel(selectedBatch?.batchNumber, grade.grade, bagIndex, weight)}
                              >
                                Print Label
                              </Button>
                            </Box>
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">No bags added yet.</Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          {selectedBatch?.parentBatchNumber ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveSubBatch}
              disabled={!selectedBatch || selectedBatch?.isStored || grades[0]?.is_stored}
            >
              Save
            </Button>
          ) : (
            <>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSortAndWeigh}
                disabled={!selectedBatch || selectedBatch?.isStored}
              >
                Save Splits
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => setOpenCompleteDialog(true)}
                disabled={!selectedBatch || selectedBatch?.isStored || !grades.some((g) => g.bagWeights.length > 0)}
              >
                Mark Complete
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={openCompleteDialog} onClose={handleCloseCompleteDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Mark as Processed</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Confirm marking Batch {selectedBatch?.batchNumber} as processed. All splits must be weighed and bagged.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCompleteDialog}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleConfirmComplete}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openStorageDialog} onClose={handleCloseStorageDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Storage in Warehouse</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Enter the RFID tag to confirm storage in the warehouse.
          </Typography>
          <TextField
            label="RFID Tag"
            value={rfid}
            onChange={(e) => setRfid(e.target.value)}
            fullWidth
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStorageDialog}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleConfirmStorage}>
            Confirm Storage
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default DryMillStation;