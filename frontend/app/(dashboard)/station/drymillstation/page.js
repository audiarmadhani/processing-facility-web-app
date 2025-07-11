"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import axios from "axios";
import jsPDF from "jspdf";

// Constants for scanned_at values
const SCAN_LOCATIONS = {
  DRY_MILL: "Dry_Mill",
  WAREHOUSE: "Warehouse",
};

// Utility to format label data using backend-provided lotNumber and referenceNumber
const formatLabelData = (
  batch,
  grade,
  bagWeight,
  bagIndex
) => {
  const farmerName = batch?.farmerName || "Unknown Farmer";
  const companyName = batch?.producer === "BTM" ? "PT Berkas Tuaian Melimpah" : "HEQA";
  const productionDate =
    batch?.dryMillExited && batch.status === "Processed"
      ? new Date(batch.dryMillExited).toLocaleDateString()
      : new Date().toLocaleDateString();
  const lotNumber = batch?.lotNumber || "N/A";
  const referenceNumber = batch?.referenceNumber || "N/A";
  const cherryLotNumber = batch?.parentBatchNumber || batch?.batchNumber;

  return [
    { label: "Lot Number", value: lotNumber },
    { label: "Reference Number", value: referenceNumber },
    { label: "Cherry Lot Number", value: cherryLotNumber },
    { label: "Farmer", value: farmerName },
    { label: "Type", value: batch?.type || "N/A" },
    { label: "Processing Type", value: batch?.processingType || "N/A" },
    { label: "Product Line", value: batch?.productLine || "N/A" },
    { label: "Grade", value: grade },
    { label: "Bag Weight", value: `${bagWeight} kg` },
    { label: "Bag Number", value: `${bagIndex + 1}` },
    { label: "Production Date", value: productionDate },
  ];
};

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
  const [batchProcessingTypes, setBatchProcessingTypes] = useState([]);
  const [selectedProcessingType, setSelectedProcessingType] = useState(null);
  const [grades, setGrades] = useState([]);
  const [currentWeights, setCurrentWeights] = useState({});
  const [rfid, setRfid] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [openCompleteDialog, setOpenCompleteDialog] = useState(false);
  const [openStorageDialog, setOpenStorageDialog] = useState(false);
  const [processingTypes, setProcessingTypes] = useState([]);
  const [dataGridError, setDataGridError] = useState(null);
  const [errorLog, setErrorLog] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [completionProgress, setCompletionProgress] = useState(0);
  const [openSampleTrackingDialog, setOpenSampleTrackingDialog] = useState(false);
  const [sampleDateTaken, setSampleDateTaken] = useState(new Date().toISOString().split("T")[0]);
  const [sampleWeightTaken, setSampleWeightTaken] = useState("");
  const [sampleHistory, setSampleHistory] = useState([]);
  const rfidInputRef = useRef(null);

  const logError = (message, error) => {
    setErrorLog((prev) => [
      ...prev,
      { message, error: error?.message || "Unknown error", timestamp: new Date() },
    ]);
    setDataGridError(message);
  };

  const fetchDryMillData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("https://processing-facility-backend.onrender.com/api/dry-mill-data");
      const data = response.data;
  
      // Group data by batchNumber to handle multiple processing types
      const batchesMap = new Map();
      data.forEach((batch) => {
        const key = batch.batchNumber;
        if (!batchesMap.has(key)) {
          batchesMap.set(key, {
            batchNumber: batch.batchNumber,
            status: batch.status,
            dryMillEntered: batch.dryMillEntered,
            dryMillExited: batch.dryMillExited,
            cherry_weight: parseFloat(batch.cherry_weight || 0).toFixed(2),
            drying_weight: parseFloat(batch.drying_weight || 0).toFixed(2),
            producer: batch.producer || "N/A",
            farmerName: batch.farmerName || "N/A",
            productLine: batch.productLine || "N/A",
            processingTypes: [],
            totalBags: batch.totalBags || "N/A",
            notes: batch.notes || "N/A",
            type: batch.type || "N/A",
            farmVarieties: batch.farmVarieties || "N/A",
            isStored: !!batch.storeddate || !!batch.storeddatetrunc,
            batchType: batch.batchType || "Cherry",
            lotNumber: batch.lotNumber || "N/A",
            referenceNumber: batch.referenceNumber || "N/A",
            id: batch.batchNumber, // Use batchNumber as id for parent batches
          });
        }
        const existingBatch = batchesMap.get(key);
        if (!existingBatch.processingTypes.includes(batch.processingtype)) {
          existingBatch.processingTypes.push(batch.processingtype);
        }
        // Update weight and drying_weight based on the latest entry for simplicity
        existingBatch.weight = parseFloat(batch.weight || 0).toFixed(2);
        existingBatch.drying_weight = parseFloat(batch.drying_weight || 0).toFixed(2);
      });
  
      const parentBatchesData = Array.from(batchesMap.values()).filter(
        (batch) => batch.status !== "Processed" && !batch.isStored
      );
  
      const subBatchesData = data
        .filter((batch) => batch.parentbatchnumber && batch.parentbatchnumber !== batch.batchNumber)
        .map((batch) => ({
          id: `${batch.batchNumber}-${batch.processingtype || "unknown"}`,
          batchNumber: batch.batchNumber,
          status: batch.status,
          dryMillEntered: batch.dryMillEntered,
          dryMillExited: batch.dryMillExited,
          storeddatetrunc: batch.storeddatetrunc || "N/A",
          weight: parseFloat(batch.weight || 0).toFixed(2),
          producer: batch.producer || "N/A",
          farmerName: batch.farmerName || "N/A",
          productLine: batch.productLine || "N/A",
          processingType: batch.processingtype || "N/A",
          quality: batch.quality || "N/A",
          totalBags: batch.totalBags || "N/A",
          notes: batch.notes || "N/A",
          type: batch.type || "N/A",
          parentBatchNumber: batch.parentbatchnumber,
          lotNumber: batch.lotNumber || "N/A",
          referenceNumber: batch.referenceNumber || "N/A",
          bagWeights: batch.bagdetails || [],
          isStored: !!batch.storeddate || !!batch.storeddatetrunc,
        }));
  
      setParentBatches(parentBatchesData);
      setSubBatches(subBatchesData);
      setDataGridError(null);
    } catch (error) {
      const message = error.response?.data?.error || "Error fetching data. Please try again.";
      logError(message, error);
      setSnackbarMessage(message);
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  }, []);setBatchProcessingTypes

  const fetchProcessingTypes = useCallback(async () => {
    try {
      const response = await axios.get("https://processing-facility-backend.onrender.com/api/processing-types");
      setProcessingTypes(response.data);
    } catch (error) {
      const message = "Failed to fetch ProcessingTypes.";
      logError(message, error);
      setSnackbarMessage(message);
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  }, []);

  const fetchBatchProcessingTypes = useCallback(
    (batchNumber) => {
      const batch = parentBatches.find((b) => b.batchNumber === batchNumber);
      return batch?.batchType === "Green Beans" ? ["Dry"] : batch?.processingTypes || [];
    },
    [parentBatches]
  );

  const fetchExistingGrades = useCallback(
    async (batchNumber, processingType) => {
      try {
        if (!batchNumber || !processingType) {
          throw new Error("Batch number or processing type is missing.");
        }
        const response = await axios.get(
          `https://processing-facility-backend.onrender.com/api/dry-mill-grades/${batchNumber}`,
          { params: { processingType } }
        );
        const data = response.data;
        if (!Array.isArray(data)) {
          throw new Error("Invalid response format: grades data is not an array");
        }

        if (selectedBatch?.parentBatchNumber) {
          const normalizedQuality = selectedBatch.quality?.trim();
          const gradeData = data.find((grade) => grade.grade?.trim() === normalizedQuality) || {
            grade: normalizedQuality || "Grade 1",
            weight: "0",
            bagWeights: [],
            bagged_at: new Date().toISOString().split("T")[0],
            tempSequence: "0001",
            is_stored: false,
            lotNumber: selectedBatch.lotNumber,
            referenceNumber: selectedBatch.referenceNumber,
          };
          return [
            {
              grade: gradeData.grade,
              weight: parseFloat(gradeData.weight) || 0,
              bagWeights: Array.isArray(gradeData.bagWeights) ? gradeData.bagWeights.map((w) => String(w)) : [],
              bagged_at: gradeData.bagged_at || new Date().toISOString().split("T")[0],
              tempSequence: gradeData.tempSequence || "0001",
              is_stored: gradeData.is_stored || false,
              lotNumber: gradeData.lotNumber || selectedBatch.lotNumber,
              referenceNumber: gradeData.referenceNumber || selectedBatch.referenceNumber,
            },
          ];
        } else {
          const gradeOrder = ["Specialty Grade", "Grade 1", "Grade 2", "Grade 3", "Grade 4"];
          const fetchedGradesMap = {};
          data.forEach((grade) => {
            fetchedGradesMap[grade.grade] = {
              grade: grade.grade,
              weight: parseFloat(grade.weight) || 0,
              bagWeights: Array.isArray(grade.bagWeights) ? grade.bagWeights.map((w) => String(w)) : [],
              bagged_at: grade.bagged_at || new Date().toISOString().split("T")[0],
              tempSequence: grade.tempSequence || "0001",
              is_stored: grade.is_stored || false,
              lotNumber: grade.lotNumber || "N/A",
              referenceNumber: grade.referenceNumber || "N/A",
            };
          });

          return gradeOrder.map((grade) =>
            fetchedGradesMap[grade] || {
              grade,
              weight: 0,
              bagWeights: [],
              bagged_at: new Date().toISOString().split("T")[0],
              tempSequence: "0001",
              is_stored: false,
              lotNumber: selectedBatch?.lotNumber || "N/A",
              referenceNumber: selectedBatch?.referenceNumber || "N/A",
            }
          );
        }
      } catch (error) {
        const message = error.response?.data?.error || "Failed to fetch grades. Please try again.";
        logError(message, error);
        setSnackbarMessage(message);
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        return [
          {
            grade: selectedBatch?.parentBatchNumber ? selectedBatch?.quality?.trim() || "Grade 1" : "Grade 1",
            weight: 0,
            bagWeights: [],
            bagged_at: new Date().toISOString().split("T")[0],
            tempSequence: "0001",
            is_stored: false,
            lotNumber: selectedBatch?.lotNumber || "N/A",
            referenceNumber: selectedBatch?.referenceNumber || "N/A",
          },
        ];
      }
    },
    [selectedBatch]
  );

  const fetchLatestRfid = useCallback(async () => {
    try {
      const response = await axios.get("https://processing-facility-backend.onrender.com/api/get-rfid");
      setRfid(response.data.rfid || "");
    } catch (error) {
      const message = error.response?.data?.error || "Failed to fetch RFID.";
      logError(message, error);
      setSnackbarMessage(message);
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  }, []);

  const fetchSampleHistory = useCallback(async (batchNumber) => {
    try {
      const response = await axios.get(
        `https://processing-facility-backend.onrender.com/api/dry-mill/${batchNumber}/sample-history`
      );
      setSampleHistory(response.data || []);
    } catch (error) {
      const message = error.response?.data?.error || "Failed to fetch sample history.";
      logError(message, error);
      setSnackbarMessage(message);
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      setSampleHistory([]);
    }
  }, []);

  const handleScanRfid = useCallback(
    async () => {
      if (!rfid) {
        setSnackbarMessage("Please enter an RFID value.");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        return;
      }
      setIsScanning(true);
      try {
        const response = await axios.post("https://processing-facility-backend.onrender.com/api/scan-rfid", {
          rfid,
          scanned_at: SCAN_LOCATIONS.DRY_MILL,
        });
        setRfid("");
        setSnackbarMessage(response.data.message);
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
        await fetchDryMillData();
        if (response.data.exited_at) {
          setSelectedBatch({ batchNumber: response.data.batchNumber });
          setOpenStorageDialog(true);
        }
      } catch (error) {
        const message = error.response?.data?.error || "Failed to scan RFID.";
        logError(message, error);
        setSnackbarMessage(message);
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
      } finally {
        setIsScanning(false);
      }
    },
    [rfid, fetchDryMillData]
  );

  const checkCompletionEligibility = useCallback(
    async (batchNumber, processingTypes, batchType) => {
      try {
        if (batchType === "Green Beans") {
          const response = await axios.get(
            `https://processing-facility-backend.onrender.com/api/dry-mill-grades/${batchNumber}`,
            { params: { processingType: "Dry" } }
          );
          const grades = response.data;
          return grades.some(
            (grade) => parseFloat(grade.weight) > 0 && grade.bagged_at && !grade.is_stored
          );
        }

        const subBatchesResponse = await axios.get(
          `https://processing-facility-backend.onrender.com/api/postprocessing-data/${batchNumber}`
        );
        const subBatchTypes = [...new Set(subBatchesResponse.data.map((sb) => sb.processingType))];
        const missingTypes = processingTypes.filter((pt) => !subBatchTypes.includes(pt));
        if (missingTypes.length > 0) {
          throw new Error(`Missing sub-batches for processing types: ${missingTypes.join(", ")}`);
        }

        for (const processingType of processingTypes) {
          const response = await axios.get(
            `https://processing-facility-backend.onrender.com/api/dry-mill-grades/${batchNumber}`,
            { params: { processingType } }
          );
          const grades = response.data;
          const hasValidSplits = grades.some(
            (grade) => parseFloat(grade.weight) > 0 && grade.bagged_at && !grade.is_stored
          );
          if (!hasValidSplits) {
            return false;
          }
        }
        return true;
      } catch (error) {
        const message = error.message || "Failed to validate splits for completion.";
        logError(message, error);
        setSnackbarMessage(message);
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        return false;
      }
    },
    []
  );

  const handleConfirmComplete = useCallback(
    async () => {
      if (!selectedBatch || !session?.user?.email) {
        setSnackbarMessage("Batch or user is missing.");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        return;
      }
      if (!["admin", "manager"].includes(session.user.role)) {
        setSnackbarMessage("Only admins or managers can mark batches as complete.");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        return;
      }
      const isEligible = await checkCompletionEligibility(
        selectedBatch.batchNumber,
        batchProcessingTypes,
        selectedBatch.batchType
      );
      if (!isEligible) {
        setSnackbarMessage(
          "All processing types must have weighed and bagged splits before marking complete."
        );
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        return;
      }
      try {
        const response = await axios.post(
          `https://processing-facility-backend.onrender.com/api/dry-mill/${selectedBatch.batchNumber}/complete`,
          {
            createdBy: session.user.email,
            updatedBy: session.user.email,
          }
        );
        setSnackbarMessage(response.data.message);
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
        setOpenDialog(false);
        setOpenCompleteDialog(false);
        setHasUnsavedChanges(false);
        await fetchDryMillData();
      } catch (error) {
        const message =
          error.response?.data?.error || "Failed to mark batch as processed.";
        logError(message, error);
        setSnackbarMessage(message);
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
      }
    },
    [selectedBatch, session, batchProcessingTypes, fetchDryMillData]
  );

  const handleConfirmStorage = useCallback(
    async () => {
      if (!rfid || !selectedBatch?.batchNumber) {
        setSnackbarMessage("RFID or batch number is missing.");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        return;
      }
      try {
        const response = await axios.post(
          "https://processing-facility-backend.onrender.com/api/warehouse/scan",
          {
            rfid,
            scanned_at: SCAN_LOCATIONS.WAREHOUSE,
            batchNumber: selectedBatch.batchNumber,
          }
        );
        setRfid("");
        setSnackbarMessage(
          `${response.data.message} (Lot: ${response.data.lotNumber}, Ref: ${response.data.referenceNumber})`
        );
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
        setOpenStorageDialog(false);
        await fetchDryMillData();
      } catch (error) {
        const message = error.response?.data?.error || "Failed to confirm storage.";
        logError(message, error);
        setSnackbarMessage(message);
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
      }
    },
    [rfid, selectedBatch, fetchDryMillData]
  );

  const handleSortAndWeigh = useCallback(
    async () => {
      if (!selectedBatch || !selectedProcessingType) {
        setSnackbarMessage("Batch or processing type is missing.");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        return;
      }
      try {
        const today = new Date().toISOString().slice(0, 10);
        const payload = {
          grades: grades.map((g) => ({
            grade: g.grade,
            bagWeights: g.bagWeights,
            weight: g.weight.toString(),
            bagged_at: today,
            tempSequence: g.tempSequence,
          })),
          processingType: selectedProcessingType,
        };
        const response = await axios.post(
          `https://processing-facility-backend.onrender.com/api/dry-mill/${selectedBatch.batchNumber}/split`,
          payload
        );
        setSnackbarMessage(response.data.message);
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
        setHasUnsavedChanges(false);
        setGrades((prevGrades) =>
          prevGrades.map((grade, idx) => ({
            ...grade,
            lotNumber: response.data.grades[idx]?.lotNumber || grade.lotNumber || "N/A",
            referenceNumber: response.data.grades[idx]?.referenceNumber || grade.referenceNumber || "N/A",
          }))
        );
        await fetchDryMillData();
      } catch (error) {
        const message =
          error.response?.data?.details ||
          error.response?.data?.error ||
          "Failed to save green bean splits.";
        logError(message, error);
        setSnackbarMessage(message);
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
      }
    },
    [selectedBatch, selectedProcessingType, grades, fetchDryMillData]
  );

  const handlePrintLabel = useCallback(
    (batchNumber, processingType, grade, bagIndex, bagWeight) => {
      if (!selectedBatch) {
        setSnackbarMessage("No batch selected.");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        return;
      }

      const subBatch =
        subBatches.find(
          (sb) =>
            sb.parentBatchNumber === selectedBatch.batchNumber &&
            sb.processingType === processingType &&
            sb.quality === grade
        ) ||
        grades.find((g) => g.grade === grade) ||
        selectedBatch;

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [100, 150] });
      const labels = formatLabelData(subBatch, grade, bagWeight, bagIndex);
      const maxLabelLength = Math.max(...labels.map((l) => l.label.length));
      const padding = " ".repeat(maxLabelLength);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setFillColor(240, 240, 240);
      doc.rect(5, 5, 90, 20, "F");
      doc.text("Green Coffee Beans", 10, 15);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(subBatch?.producer === "BTM" ? "PT Berkas Tuaian Melimpah" : "HEQA", 10, 20);

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
        setSnackbarMessage("Failed to open print window. Please allow pop-ups.");
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
    },
    [selectedBatch, subBatches, grades]
  );

  const handleAddBag = useCallback(
    async (index, weight) => {
      const parsedWeight = parseFloat(weight);
      if (isNaN(parsedWeight) || parsedWeight <= 0) {
        setSnackbarMessage("Please enter a valid positive weight.");
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
      if (!selectedProcessingType) {
        setSnackbarMessage("Processing type is missing.");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        return;
      }
      const grade = grades[index].grade;
      const newWeight = parsedWeight.toString();
      const updatedBagWeights = [...grades[index].bagWeights, newWeight];
      const totalWeight = parseFloat(grades[index].weight || 0) + parsedWeight;

      setGrades((prevGrades) => {
        const newGrades = [...prevGrades];
        newGrades[index] = {
          ...newGrades[index],
          bagWeights: updatedBagWeights,
          weight: totalWeight,
        };
        return newGrades;
      });
      setCurrentWeights((prev) => ({ ...prev, [index]: "" }));
      setHasUnsavedChanges(true);

      if (selectedBatch.parentBatchNumber) {
        try {
          const response = await axios.post(
            `https://processing-facility-backend.onrender.com/api/dry-mill/${selectedBatch.batchNumber}/update-bags`,
            {
              grade,
              bagWeights: updatedBagWeights,
              weight: totalWeight.toString(),
              bagged_at: new Date().toISOString().slice(0, 10),
              processingType: selectedProcessingType,
            }
          );
          setGrades((prevGrades) => {
            const newGrades = [...prevGrades];
            newGrades[index] = {
              ...newGrades[index],
              lotNumber: response.data.lotNumber || prevGrades[index].lotNumber,
              referenceNumber: response.data.referenceNumber || prevGrades[index].referenceNumber,
            };
            return newGrades;
          });
          setSnackbarMessage("Bag added successfully.");
          setSnackbarSeverity("success");
          setOpenSnackbar(true);
          setHasUnsavedChanges(false);
          await fetchDryMillData();
        } catch (error) {
          const message = error.response?.data?.error || "Failed to update bags.";
          logError(message, error);
          setSnackbarMessage(message);
          setSnackbarSeverity("error");
          setOpenSnackbar(true);
          setGrades((prevGrades) => {
            const newGrades = [...prevGrades];
            newGrades[index] = {
              ...newGrades[index],
              bagWeights: newGrades[index].bagWeights.slice(0, -1),
              weight: parseFloat(newGrades[index].weight || 0) - parsedWeight,
            };
            return newGrades;
          });
        }
      }
    },
    [selectedBatch, selectedProcessingType, grades, fetchDryMillData]
  );

  const handleRemoveBag = useCallback(
    async (gradeIndex, bagIndex) => {
      if (!selectedBatch || !selectedProcessingType) {
        setSnackbarMessage("Batch or processing type is missing.");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        return;
      }
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
      setHasUnsavedChanges(true);

      if (selectedBatch.parentBatchNumber) {
        try {
          const response = await axios.post(
            `https://processing-facility-backend.onrender.com/api/dry-mill/${selectedBatch.batchNumber}/update-bags`,
            {
              grade,
              bagWeights: updatedBagWeights,
              weight: totalWeight >= 0 ? totalWeight.toString() : "0",
              bagged_at: new Date().toISOString().slice(0, 10),
              processingType: selectedProcessingType,
            }
          );
          setGrades((prevGrades) => {
            const newGrades = [...prevGrades];
            newGrades[gradeIndex] = {
              ...newGrades[gradeIndex],
              lotNumber: response.data.lotNumber || prevGrades[gradeIndex].lotNumber,
              referenceNumber: response.data.referenceNumber || prevGrades[gradeIndex].referenceNumber,
            };
            return newGrades;
          });
          setSnackbarMessage("Bag removed successfully.");
          setSnackbarSeverity("success");
          setOpenSnackbar(true);
          setHasUnsavedChanges(false);
          await fetchDryMillData();
        } catch (error) {
          const message = error.response?.data?.error || "Failed to remove bag.";
          logError(message, error);
          setSnackbarMessage(message);
          setSnackbarSeverity("error");
          setOpenSnackbar(true);
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
      }
    },
    [selectedBatch, selectedProcessingType, grades, fetchDryMillData]
  );

  const handleSaveSubBatch = useCallback(
    async () => {
      if (!selectedBatch || !grades[0] || !selectedProcessingType) {
        setSnackbarMessage("Batch, grade, or processing type is missing.");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        return;
      }
      if (selectedBatch.isStored || grades[0].is_stored) {
        setSnackbarMessage("Cannot save changes to a stored batch.");
        setSnackbarSeverity("warning");
        setOpenSnackbar(true);
        return;
      }
      try {
        const response = await axios.post(
          `https://processing-facility-backend.onrender.com/api/dry-mill/${selectedBatch.batchNumber}/update-bags`,
          {
            grade: grades[0].grade,
            bagWeights: grades[0].bagWeights,
            weight: grades[0].weight.toString(),
            bagged_at: new Date().toISOString().slice(0, 10),
            processingType: selectedProcessingType,
          }
        );
        setGrades((prevGrades) => {
          const newGrades = [...prevGrades];
          newGrades[0] = {
            ...newGrades[0],
            lotNumber: response.data.lotNumber || prevGrades[0].lotNumber,
            referenceNumber: response.data.referenceNumber || prevGrades[0].referenceNumber,
          };
          return newGrades;
        });
        setSnackbarMessage("Sub-batch saved successfully.");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
        setHasUnsavedChanges(false);
        await fetchDryMillData();
      } catch (error) {
        const message = error.response?.data?.error || "Failed to save sub-batch.";
        logError(message, error);
        setSnackbarMessage(message);
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
      }
    },
    [selectedBatch, grades, selectedProcessingType, fetchDryMillData]
  );

  const handleAddSample = useCallback(async () => {
    if (!selectedBatch || !sampleWeightTaken || isNaN(parseFloat(sampleWeightTaken)) || parseFloat(sampleWeightTaken) <= 0) {
      setSnackbarMessage("Please enter a valid positive sample weight.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }
    try {
      const response = await axios.post(
        `https://processing-facility-backend.onrender.com/api/dry-mill/${selectedBatch.batchNumber}/add-sample`,
        {
          dateTaken: sampleDateTaken,
          weightTaken: parseFloat(sampleWeightTaken),
        }
      );
      setSampleHistory([...sampleHistory, response.data]);
      setSampleWeightTaken("");
      setSnackbarMessage("Sample added successfully.");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
      await fetchDryMillData();
    } catch (error) {
      const message = error.response?.data?.error || "Failed to add sample.";
      logError(message, error);
      setSnackbarMessage(message);
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  }, [selectedBatch, sampleDateTaken, sampleWeightTaken, sampleHistory, fetchDryMillData]);

  useEffect(() => {
    fetchDryMillData();
    fetchLatestRfid();
    fetchProcessingTypes();
    const intervalId = setInterval(() => {
      fetchDryMillData();
      fetchLatestRfid();
    }, 600000); // 10 minutes
    return () => clearInterval(intervalId);
  }, [fetchDryMillData, fetchLatestRfid, fetchProcessingTypes]);

  useEffect(() => {
    if (selectedBatch) {
      if (!selectedBatch.parentBatchNumber) {
        const types = fetchBatchProcessingTypes(selectedBatch.batchNumber);
        setBatchProcessingTypes(types);
        setSelectedProcessingType(types[0] || null); // Ensure a default processing type is set
      } else {
        setBatchProcessingTypes([selectedBatch.processingType]);
        setSelectedProcessingType(selectedBatch.processingType);
      }
      fetchSampleHistory(selectedBatch.batchNumber);
    }
  }, [selectedBatch, fetchBatchProcessingTypes, fetchSampleHistory]);

  useEffect(() => {
    if (selectedBatch && selectedProcessingType) {
      fetchExistingGrades(selectedBatch.batchNumber, selectedProcessingType).then(
        (existingGrades) => {
          setGrades(existingGrades);
          const initialWeights = {};
          existingGrades.forEach((_, idx) => (initialWeights[idx] = ""));
          setCurrentWeights(initialWeights);
          setHasUnsavedChanges(false);
        }
      );

      if (!selectedBatch.parentBatchNumber) {
        const fetchProgress = async () => {
          try {
            const subBatchesResponse = await axios.get(
              `https://processing-facility-backend.onrender.com/api/postprocessing-data/${selectedBatch.batchNumber}`
            );
            const subBatchTypes = [...new Set(subBatchesResponse.data.map((sb) => sb.processingType))];
            const totalTypes =
              selectedBatch.batchType === "Green Beans" ? 1 : batchProcessingTypes.length;
            const progress = (subBatchTypes.length / totalTypes) * 100;
            setCompletionProgress(progress);
          } catch (error) {
            setCompletionProgress(0);
          }
        };
        fetchProgress();
      }
    }
  }, [selectedBatch, selectedProcessingType, batchProcessingTypes, fetchExistingGrades]);

  useEffect(() => {
    if (openStorageDialog && rfidInputRef.current) {
      rfidInputRef.current.focus();
    }
  }, [openStorageDialog]);

  const handleRefreshData = () => {
    fetchDryMillData();
    fetchLatestRfid();
  };

  const handleDetailsClick = (batch) => {
    setSelectedBatch(batch);
    setOpenDialog(true);
    setHasUnsavedChanges(false);
    setCompletionProgress(0);
  };

  const handleSampleTrackingClick = (batch) => {
    setSelectedBatch(batch);
    setSampleDateTaken(new Date().toISOString().split("T")[0]);
    setSampleWeightTaken("");
    setSampleHistory([]);
    fetchSampleHistory(batch.batchNumber);
    setOpenSampleTrackingDialog(true);
  };

  const handleCloseDialog = () => {
    if (hasUnsavedChanges) {
      if (confirm("You have unsaved changes. Do you want to discard them?")) {
        setOpenDialog(false);
        setSelectedBatch(null);
        setBatchProcessingTypes([]);
        setSelectedProcessingType(null);
        setGrades([]);
        setHasUnsavedChanges(false);
      }
    } else {
      setOpenDialog(false);
      setSelectedBatch(null);
      setBatchProcessingTypes([]);
      setSelectedProcessingType(null);
      setGrades([]);
    }
  };

  const handleCloseCompleteDialog = () => {
    setOpenCompleteDialog(false);
  };

  const handleCloseStorageDialog = () => {
    setOpenStorageDialog(false);
    setRfid("");
    setSelectedBatch(null);
  };

  const handleCloseSampleTrackingDialog = () => {
    setOpenSampleTrackingDialog(false);
    setSelectedBatch(null);
    setSampleDateTaken(new Date().toISOString().split("T")[0]);
    setSampleWeightTaken("");
    setSampleHistory([]);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleTabChange = (event, newValue) => {
    setSelectedProcessingType(batchProcessingTypes[newValue]);
  };

  const handleRfidKeyPress = (e) => {
    if (e.key === "Enter") {
      handleConfirmStorage();
    }
  };

  const parentColumns = useMemo(
    () => [
      { field: "batchNumber", headerName: "Batch Number", width: 160 },
      { field: "lotNumber", headerName: "Lot Number", width: 180 },
      { field: "referenceNumber", headerName: "Ref Number", width: 180 },
      { field: "farmerName", headerName: "Farmer Name", width: 160 },
      { field: "farmVarieties", headerName: "Farm Varieties", width: 160 },
      { field: "type", headerName: "Type", width: 120 },
      {
        field: "status",
        headerName: "Status",
        width: 150,
        renderCell: (params) => (
          <Chip
            label={params.value}
            color={
              params.value === "In Dry Mill"
                ? "primary"
                : params.value === "Processed"
                ? "success"
                : "default"
            }
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
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleDetailsClick(params.row)}
            disabled={isLoading}
          >
            Details
          </Button>
        ),
      },
      {
        field: "sampleTracking",
        headerName: "Sample Tracking",
        width: 150,
        sortable: false,
        renderCell: (params) => (
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleSampleTrackingClick(params.row)}
            disabled={isLoading}
          >
            Sample Tracking
          </Button>
        ),
      },
      { field: "dryMillEntered", headerName: "Dry Mill Entered", width: 150 },
      { field: "dryMillExited", headerName: "Dry Mill Exited", width: 150 },
      { field: "cherry_weight", headerName: "Cherry Weight (kg)", width: 160 },
      { field: "drying_weight", headerName: "Drying Weight (kg)", width: 160 },
      { field: "producer", headerName: "Producer", width: 120 },
      { field: "productLine", headerName: "Product Line", width: 160 },
      {
        field: "processingTypes",
        headerName: "Processing Types",
        width: 200,
        valueGetter: (params) => (params.value || []).join(", "),
      },
      { field: "batchType", headerName: "Batch Type", width: 120 },
      { field: "totalBags", headerName: "Total Bags", width: 120 },
      { field: "notes", headerName: "Notes", width: 180 },
    ],
    [isLoading]
  );

  const subBatchColumns = useMemo(
    () => [
      { field: "batchNumber", headerName: "Batch Number", width: 180 },
      { field: "lotNumber", headerName: "Lot Number", width: 180 },
      { field: "referenceNumber", headerName: "Ref Number", width: 180 },
      { field: "parentBatchNumber", headerName: "Parent Batch", width: 160 },
      {
        field: "status",
        headerName: "Status",
        width: 150,
        renderCell: (params) => (
          <Chip
            label={params.value}
            color={
              params.value === "In Dry Mill"
                ? "primary"
                : params.value === "Processed"
                ? "success"
                : "default"
            }
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
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleDetailsClick(params.row)}
            disabled={isLoading}
          >
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
      { field: "type", headerName: "Type", width: 140 },
      { field: "quality", headerName: "Quality", width: 120 },
      { field: "totalBags", headerName: "Bags Qty", width: 120 },
      { field: "notes", headerName: "Notes", width: 180 },
      {
        field: "isStored",
        headerName: "Storage Status",
        width: 150,
        renderCell: (params) => (
          <Chip
            label={params.value ? "Stored" : "Not Stored"}
            color={params.value ? "success" : "default"}
            size="small"
            sx={{ borderRadius: "16px", fontWeight: "bold" }}
          />
        ),
      },
    ],
    [isLoading]
  );

  const getParentBatches = useCallback(
    () =>
      [...parentBatches].sort((a, b) => {
        const statusOrder = { "In Dry Mill": 0, "Processed": 1, "Not Started": 2 };
        return (
          (statusOrder[a.status] || 2) - (statusOrder[b.status] || 2) ||
          (a.dryMillEntered === "N/A" ? Infinity : new Date(a.dryMillEntered)) -
          (b.dryMillEntered === "N/A" ? Infinity : new Date(b.dryMillEntered))
        );
      }),
    [parentBatches]
  );

  const getSubBatches = useCallback(
    () =>
      [...subBatches].sort((a, b) => {
        const parentA = a.parentBatchNumber || "";
        const parentB = b.parentBatchNumber || "";
        const batchA = a.batchNumber || "";
        const batchB = b.batchNumber || "";
        return parentA.localeCompare(parentB) || batchA.localeCompare(batchB);
      }),
    [subBatches]
  );

  const renderParentDataGrid = useMemo(
    () => (
      <DataGrid
        rows={getParentBatches()}
        columns={parentColumns}
        initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
        pageSizeOptions={[5, 10, 20]}
        disableRowSelectionOnClick
        getRowId={(row) => row.id}
        slots={{ toolbar: GridToolbar }}
        autosizeOnMount
        autosizeOptions={{ includeHeaders: true, includeOutliers: true, expand: true }}
        sx={{ height: 400, width: "100%" }}
      />
    ),
    [getParentBatches, parentColumns]
  );

  const renderSubBatchDataGrid = useMemo(() => {
    if (dataGridError) {
      return (
        <Typography variant="body1" color="error" sx={{ p: 3 }}>
          {dataGridError}
        </Typography>
      );
    }
    const rows = getSubBatches();
    if (rows.length === 0) {
      return (
        <Typography variant="body1" color="text.secondary" sx={{ p: 3 }}>
          No sub-batches available. Please create splits for a batch using the Details button above.
        </Typography>
      );
    }
    return (
      <DataGrid
        rows={rows}
        columns={subBatchColumns}
        initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
        pageSizeOptions={[5, 10, 20]}
        disableRowSelectionOnClick
        getRowId={(row) => row.id}
        slots={{ toolbar: GridToolbar }}
        autosizeOnMount
        autosizeOptions={{ includeHeaders: true, includeOutliers: true, expand: true }}
        sx={{ height: 600, width: "100%" }}
      />
    );
  }, [getSubBatches, subBatchColumns, dataGridError]);

  if (status === "loading") {
    return <Typography>Loading data...</Typography>;
  }

  if (
    !session?.user ||
    !["admin", "manager", "drymill", "postprocessing"].includes(session.user.role)
  ) {
    return (
      <Typography variant="h6">
        Access Denied. You do not have permission to view this page.
      </Typography>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Dry Mill Station - Active Batches
            </Typography>
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
            {renderParentDataGrid}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Green Bean Sub-Batches
            </Typography>
            {renderSubBatchDataGrid}
          </CardContent>
        </Card>
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Batch {selectedBatch?.batchNumber} ({selectedBatch?.batchType})
        </DialogTitle>
        <DialogContent>
          {selectedBatch?.batchType === "Green Beans" && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Processing Green Beans: No Wet Mill/Drying Required
            </Typography>
          )}
          {selectedBatch && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2">
                Lot Number: {selectedBatch.lotNumber}
              </Typography>
              <Typography variant="body2">
                Reference Number: {selectedBatch.referenceNumber}
              </Typography>
            </Box>
          )}
          {batchProcessingTypes.length > 1 &&
            !selectedBatch?.parentBatchNumber &&
            selectedBatch?.batchType !== "Green Beans" && (
              <Tabs
                value={batchProcessingTypes.indexOf(selectedProcessingType) || 0}
                onChange={handleTabChange}
                sx={{ mb: 2 }}
                disabled={selectedBatch?.isStored || selectedBatch?.status === "Processed"}
              >
                {batchProcessingTypes.map((type) => (
                  <Tab key={type} label={type} />
                ))}
              </Tabs>
            )}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2">Completion Progress</Typography>
            <LinearProgress variant="determinate" value={completionProgress} />
            <Typography variant="caption" color="text.secondary">
              {completionProgress.toFixed(0)}% Complete
            </Typography>
          </Box>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {grades.map((grade, index) => {
              const totalWeight = grade.weight || grade.bagWeights.reduce((acc, w) => acc + parseFloat(w || 0), 0);
              const totalBags = grade.bagWeights.length;
              return (
                <Grid item xs={12} key={`${grade.grade}-${index}`}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1">{grade.grade}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2">
                        Total Bags: {totalBags} | Total Weight: {totalWeight.toFixed(2)} kg
                        {grade.is_stored ? " | Stored" : ""}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: "flex", gap: 2, mb: 1, alignItems: "center" }}>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleAddBag(index, 50)}
                          disabled={isLoading || selectedBatch?.isStored || grade.is_stored}
                          sx={{ mr: 1 }}
                        >
                          50 kg
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleAddBag(index, 60)}
                          disabled={isLoading || selectedBatch?.isStored || grade.is_stored}
                          sx={{ mr: 1 }}
                        >
                          60 kg
                        </Button>
                        <TextField
                          label="Custom Weight (kg)"
                          value={currentWeights[index] || ""}
                          onChange={(e) =>
                            setCurrentWeights((prev) => ({
                              ...prev,
                              [index]: e.target.value,
                            }))
                          }
                          type="number"
                          inputProps={{ min: 0, step: 0.1 }}
                          variant="outlined"
                          sx={{ width: 150, mr: 1 }}
                          disabled={isLoading || selectedBatch?.isStored || grade.is_stored}
                        />
                        <Button
                          variant="contained"
                          color="secondary"
                          onClick={() => handleAddBag(index, currentWeights[index])}
                          disabled={
                            isLoading ||
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
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                mb: 1,
                              }}
                            >
                              <Typography variant="body1">
                                Bag {bagIndex + 1}: {parseFloat(weight).toFixed(2)} kg
                              </Typography>
                              <Box sx={{ display: "flex", gap: 1 }}>
                                {selectedBatch?.isStored || grade.is_stored ? null : (
                                  <Button
                                    variant="contained"
                                    color="error"
                                    size="small"
                                    onClick={() => handleRemoveBag(index, bagIndex)}
                                    disabled={isLoading}
                                  >
                                    Remove
                                  </Button>
                                )}
                                <Button
                                  variant="contained"
                                  color="secondary"
                                  size="small"
                                  onClick={() =>
                                    handlePrintLabel(
                                      selectedBatch?.batchNumber,
                                      selectedProcessingType,
                                      grade.grade,
                                      bagIndex,
                                      weight
                                    )
                                  }
                                  disabled={isLoading}
                                >
                                  Print Label
                                </Button>
                              </Box>
                            </Box>
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No bags added yet.
                          </Typography>
                        )}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              );
            })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isLoading}>
            Cancel
          </Button>
          {!selectedBatch?.parentBatchNumber && (
            <>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSortAndWeigh}
                disabled={
                  isLoading ||
                  !selectedBatch ||
                  !selectedProcessingType ||
                  selectedBatch.status === "Processed" // Add status check instead of isStored
                }
              >
                Save Splits
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => setOpenCompleteDialog(true)}
                disabled={
                  isLoading ||
                  !selectedBatch ||
                  batchProcessingTypes.length === 0 ||
                  !["admin", "manager"].includes(session.user.role)
                }
              >
                Mark Complete
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Dialog
        open={openCompleteDialog}
        onClose={handleCloseCompleteDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Mark as Processed</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Confirm marking Batch {selectedBatch?.batchNumber} as processed. All splits
            for all processing types ({batchProcessingTypes.join(", ")}) must be weighed
            and bagged.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCompleteDialog} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmComplete}
            disabled={isLoading}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openStorageDialog}
        onClose={handleCloseStorageDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Storage in Warehouse</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Enter the RFID tag to confirm storage in the warehouse for Batch{" "}
            {selectedBatch?.batchNumber}.
          </Typography>
          <TextField
            label="RFID Tag"
            value={rfid}
            onChange={(e) => setRfid(e.target.value)}
            onKeyPress={handleRfidKeyPress}
            fullWidth
            variant="outlined"
            inputRef={rfidInputRef}
            disabled={isLoading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStorageDialog} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmStorage}
            disabled={isLoading}
          >
            Confirm Storage
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openSampleTrackingDialog}
        onClose={handleCloseSampleTrackingDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Sample Tracking - Batch {selectedBatch?.batchNumber}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <TextField
                label="Date Taken"
                type="date"
                value={sampleDateTaken}
                onChange={(e) => setSampleDateTaken(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                disabled={isLoading}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Weight Taken (kg)"
                type="number"
                value={sampleWeightTaken}
                onChange={(e) => setSampleWeightTaken(e.target.value)}
                fullWidth
                inputProps={{ min: 0, step: 0.1 }}
                disabled={isLoading}
              />
            </Grid>
          </Grid>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddSample}
            disabled={isLoading || !sampleWeightTaken || isNaN(parseFloat(sampleWeightTaken)) || parseFloat(sampleWeightTaken) <= 0}
            sx={{ mb: 2 }}
          >
            Add Sample
          </Button>
          <Typography variant="h6" gutterBottom>Sample History</Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date Taken</TableCell>
                <TableCell>Weight Taken (kg)</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sampleHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">No samples recorded.</TableCell>
                </TableRow>
              ) : (
                sampleHistory.map((sample, index) => (
                  <TableRow key={index}>
                    <TableCell>{new Date(sample.dateTaken).toLocaleDateString()}</TableCell>
                    <TableCell>{parseFloat(sample.weightTaken).toFixed(2)}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={async () => {
                          try {
                            await axios.delete(
                              `https://processing-facility-backend.onrender.com/api/dry-mill/${selectedBatch.batchNumber}/remove-sample/${sample.id}`
                            );
                            setSampleHistory(sampleHistory.filter((s) => s.id !== sample.id));
                            setSnackbarMessage("Sample removed successfully.");
                            setSnackbarSeverity("success");
                            setOpenSnackbar(true);
                            await fetchDryMillData();
                          } catch (error) {
                            const message = error.response?.data?.error || "Failed to remove sample.";
                            logError(message, error);
                            setSnackbarMessage(message);
                            setSnackbarSeverity("error");
                            setOpenSnackbar(true);
                          }
                        }}
                        disabled={isLoading}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Typography variant="h6" sx={{ mt: 2 }}>
            Total Sample Weight Taken: {sampleHistory.reduce((acc, sample) => acc + parseFloat(sample.weightTaken || 0), 0).toFixed(2)} kg
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSampleTrackingDialog} disabled={isLoading}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default DryMillStation;