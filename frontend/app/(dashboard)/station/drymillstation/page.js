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
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import axios from "axios";
import jsPDF from "jspdf";

// Constants for scanned_at values
const SCAN_LOCATIONS = {
  DRY_MILL: "Dry_Mill",
  WAREHOUSE: "Warehouse",
};

// Utility to generate lot and reference numbers
const generateLabelData = (
  batch,
  processingType,
  grade,
  processingTypes,
  productLines,
  referenceMappings,
  bagWeight,
  bagIndex
) => {
  const farmerName = batch?.farmerName || "Unknown Farmer";
  const companyName = batch?.producer === "BTM" ? "PT Berkas Tuaian Melimpah" : "HEQA";
  const productionDate =
    batch?.dryMillExited && batch.status === "Processed"
      ? new Date(batch.dryMillExited).toLocaleDateString()
      : new Date().toLocaleDateString();
  const producerAbbreviation = batch?.producer === "BTM" ? "BTM" : "HQ";
  const producerReferenceAbbreviation = batch?.producer === "BTM" ? "BTM" : "HEQA";
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const productLineEntry = productLines.find((pl) => pl.productLine === batch?.productLine) || {};
  const productLineAbbreviation = productLineEntry.abbreviation || "Unknown";
  const productLineReferenceAbbreviation =
    productLineAbbreviation === "R"
      ? "RE"
      : productLineAbbreviation === "M"
      ? "MI"
      : productLineAbbreviation === "C"
      ? "CO"
      : productLineAbbreviation;
  const processingTypeEntry = processingTypes.find((pt) => pt.processingType === processingType) || {};
  const processingTypeAbbreviation = processingTypeEntry.abbreviation || "Unknown";
  const qualityAbbreviation =
    grade === "Specialty Grade" ? "S" : grade === "Grade 1" ? "G1" : grade === "Grade 2" ? "G2" : grade === "Grade 3" ? "G3" : "G4";
  const tempSequence = "0001"; // Simplified for demo; fetch from grades if needed
  const lotNumber = `${producerAbbreviation}${currentYear}${productLineAbbreviation}-${processingTypeAbbreviation}-${tempSequence}-${qualityAbbreviation}`;
  const referenceMatch =
    referenceMappings.find(
      (rm) =>
        rm.producer === batch?.producer &&
        rm.productLine === batch?.productLine &&
        rm.processingType === processingType &&
        rm.type === batch?.type
    ) || {};
  const referenceSequence = referenceMatch.referenceNumber ? referenceMatch.referenceNumber.split("-")[3] : "000";
  const referenceNumber = `ID-${producerReferenceAbbreviation}-${productLineReferenceAbbreviation}-${referenceSequence}-${qualityAbbreviation}`;
  const cherryLotNumber = batch?.batchNumber;

  return [
    { label: "Lot Number", value: lotNumber },
    { label: "Reference Number", value: referenceNumber },
    { label: "Cherry Lot Number", value: cherryLotNumber },
    { label: "Farmer", value: farmerName },
    { label: "Type", value: batch?.type || "N/A" },
    { label: "Processing Type", value: processingType || "N/A" },
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
  const [productLines, setProductLines] = useState([]);
  const [referenceMappings, setReferenceMappings] = useState([]);
  const rfidInputRef = useRef(null);

  /**
   * Fetches dry mill data from the backend.
   */
  const fetchDryMillData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("https://processing-facility-backend.onrender.com/api/dry-mill-data");
      const data = response.data;

      const parentBatchesData = data
        .filter((batch) => !batch.parentBatchNumber && !batch.isStored && batch.status !== "Processed")
        .map((batch) => ({
          id: batch.batchNumber,
          batchNumber: batch.batchNumber,
          status: batch.status,
          dryMillEntered: batch.dryMillEntered,
          dryMillExited: batch.dryMillExited,
          cherry_weight: parseFloat(batch.cherry_weight || 0).toFixed(2),
          producer: batch.producer || "N/A",
          farmerName: batch.farmerName || "N/A",
          productLine: batch.productLine || "N/A",
          processingTypes: Array.isArray(batch.processingTypes) ? batch.processingTypes : [],
          totalBags: batch.totalBags || "N/A",
          notes: batch.notes || "N/A",
          type: batch.type || "N/A",
          isStored: batch.isStored,
        }));

      const subBatchesData = data
        .filter((batch) => batch.parentBatchNumber)
        .map((batch) => {
          const subBatch = {
            id: `${batch.batchNumber}-${batch.processingType || 'unknown'}`,
            batchNumber: batch.batchNumber,
            status: batch.status,
            dryMillEntered: batch.dryMillEntered,
            dryMillExited: batch.dryMillExited,
            storeddatetrunc: batch.storeddatetrunc || "N/A",
            weight: batch.weight || "N/A",
            producer: batch.producer || "N/A",
            farmerName: batch.farmerName || "N/A",
            productLine: batch.productLine || "N/A",
            processingType: batch.processingType || "N/A",
            quality: batch.quality || "N/A",
            totalBags: batch.totalBags || "N/A",
            notes: batch.notes || "N/A",
            type: batch.type || "N/A",
            parentBatchNumber: batch.parentBatchNumber,
            referenceNumber: batch.referenceNumber || "N/A",
            bagWeights: batch.bagWeights || [],
            isStored: batch.isStored,
          };
          console.log("Sub-batch mapped:", subBatch); // Debug log
          return subBatch;
        });

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
  }, []);

  /**
   * Fetches processing types from the backend.
   */
  const fetchProcessingTypes = useCallback(async () => {
    try {
      const response = await axios.get("https://processing-facility-backend.onrender.com/api/processing-types");
      setProcessingTypes(response.data);
    } catch (error) {
      console.error("Error fetching ProcessingTypes:", error);
      setSnackbarMessage("Failed to fetch ProcessingTypes.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  }, []);

  /**
   * Fetches product lines from the backend.
   */
  const fetchProductLines = useCallback(async () => {
    try {
      const response = await axios.get("https://processing-facility-backend.onrender.com/api/product-lines");
      setProductLines(response.data);
    } catch (error) {
      console.error("Error fetching ProductLines:", error);
      setSnackbarMessage("Failed to fetch ProductLines.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  }, []);

  /**
   * Fetches reference mappings from the backend.
   */
  const fetchReferenceMappings = useCallback(async () => {
    try {
      const response = await axios.get("https://processing-facility-backend.onrender.com/api/reference-mappings");
      setReferenceMappings(response.data);
    } catch (error) {
      console.error("Error fetching ReferenceMappings:", error);
      setSnackbarMessage("Failed to fetch ReferenceMappings.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  }, []);

  /**
   * Fetches processing types for a given batch from parentBatches state.
   */
  const fetchBatchProcessingTypes = useCallback(
    (batchNumber) => {
      const batch = parentBatches.find((b) => b.batchNumber === batchNumber);
      return batch?.processingTypes || [];
    },
    [parentBatches]
  );

  /**
   * Fetches existing grades for a batch and processing type.
   */
  const fetchExistingGrades = useCallback(async (batchNumber, processingType) => {
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
        };
        return [
          {
            grade: gradeData.grade,
            weight: parseFloat(gradeData.weight) || 0,
            bagWeights: Array.isArray(gradeData.bagWeights) ? gradeData.bagWeights.map((w) => String(w)) : [],
            bagged_at: gradeData.bagged_at || new Date().toISOString().split("T")[0],
            tempSequence: gradeData.tempSequence || "0001",
            is_stored: gradeData.is_stored || false,
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
          }
        );
      }
    } catch (error) {
      console.error("Error fetching existing grades:", error);
      setSnackbarMessage(error.response?.data?.error || "Failed to fetch grades.");
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
        },
      ];
    }
  }, [selectedBatch]);

  /**
   * Fetches the latest RFID tag.
   */
  const fetchLatestRfid = useCallback(async () => {
    try {
      const response = await axios.get("https://processing-facility-backend.onrender.com/api/get-rfid");
      setRfid(response.data.rfid || "");
    } catch (error) {
      console.error("Error fetching latest RFID:", error);
      setSnackbarMessage(error.response?.data?.error || "Failed to fetch RFID.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  }, []);

  /**
   * Handles RFID scanning for dry mill entry.
   */
  const handleScanRfid = useCallback(async () => {
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
      console.error("Error scanning RFID:", error);
      setSnackbarMessage(error.response?.data?.error || "Failed to scan RFID.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setIsScanning(false);
    }
  }, [rfid, fetchDryMillData]);

  /**
   * Checks if a batch is eligible for completion.
   */
  const checkCompletionEligibility = useCallback(async (batchNumber, processingTypes) => {
    try {
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
      console.error("Error checking completion eligibility:", error);
      setSnackbarMessage("Failed to validate splits for completion.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return false;
    }
  }, []);

  /**
   * Confirms batch completion.
   */
  const handleConfirmComplete = useCallback(async () => {
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
    const isEligible = await checkCompletionEligibility(selectedBatch.batchNumber, batchProcessingTypes);
    if (!isEligible) {
      setSnackbarMessage("All processing types must have weighed and bagged splits before marking complete.");
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
      await fetchDryMillData();
    } catch (error) {
      console.error("Error marking batch as processed:", error);
      setSnackbarMessage(error.response?.data?.error || "Failed to mark batch as processed.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  }, [selectedBatch, session, batchProcessingTypes, checkCompletionEligibility, fetchDryMillData]);

  /**
   * Confirms storage in warehouse.
   */
  const handleConfirmStorage = useCallback(async () => {
    if (!rfid || !selectedBatch?.batchNumber) {
      setSnackbarMessage("RFID or batch number is missing.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }
    try {
      const response = await axios.post("https://processing-facility-backend.onrender.com/api/warehouse/scan", {
        rfid,
        scanned_at: SCAN_LOCATIONS.WAREHOUSE,
        batchNumber: selectedBatch.batchNumber,
      });
      setRfid("");
      setSnackbarMessage(response.data.message);
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
      setOpenStorageDialog(false);
      await fetchDryMillData();
    } catch (error) {
      console.error("Error confirming storage:", error);
      setSnackbarMessage(error.response?.data?.error || "Failed to confirm storage.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  }, [rfid, selectedBatch, fetchDryMillData]);

  /**
   * Saves green bean splits for a parent batch.
   */
  const handleSortAndWeigh = useCallback(async () => {
    if (!selectedBatch || !selectedProcessingType) {
      setSnackbarMessage("Batch or processing type is missing.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }
    try {
      const today = new Date().toISOString().slice(0, 10);
      const response = await axios.post(
        `https://processing-facility-backend.onrender.com/api/dry-mill/${selectedBatch.batchNumber}/split`,
        {
          grades: grades.map((g) => ({
            grade: g.grade,
            bagWeights: g.bagWeights,
            weight: g.weight.toString(),
            bagged_at: today,
            tempSequence: g.tempSequence,
          })),
          processingType: selectedProcessingType,
        }
      );
      setSnackbarMessage(response.data.message);
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
      await fetchDryMillData();
    } catch (error) {
      console.error("Error saving green bean splits:", error);
      setSnackbarMessage(error.response?.data?.error || "Failed to save green bean splits.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  }, [selectedBatch, selectedProcessingType, grades, fetchDryMillData]);

  /**
   * Prints a label for a bag.
   */
  const handlePrintLabel = useCallback(
    (batchNumber, processingType, grade, bagIndex, bagWeight) => {
      if (!selectedBatch) {
        setSnackbarMessage("No batch selected.");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        return;
      }
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [100, 150] });
      const labels = generateLabelData(
        selectedBatch,
        processingType,
        grade,
        processingTypes,
        productLines,
        referenceMappings,
        bagWeight,
        bagIndex
      );
      const maxLabelLength = Math.max(...labels.map((l) => l.label.length));
      const padding = " ".repeat(maxLabelLength);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setFillColor(240, 240, 240);
      doc.rect(5, 5, 90, 20, "F");
      doc.text("Green Coffee Beans", 10, 15);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(selectedBatch?.producer === "BTM" ? "PT Berkas Tuaian Melimpah" : "HEQA", 10, 20);

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
        setOpenSnackbar("error");
        setOpen(true);
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
    [selectedBatch, processingTypes, productLines, referenceMappings]
  );

  /**
   * Adds a bag to a grade.
   */
  const handleAddBag = useCallback(
    async (index, weight) => {
      const parsedWeight = parseFloat(weight);
      if (isNaN(parsedWeight) || parsedWeight <= 0) {
        setSnackbarMessage("Please enter a valid positive weight.");
        setSnackbarSeverity("error");
        setOpenSnackBar(true);
        return;
      }
      if (selectedBatch?.isStored || grades[index]?.is_stored) {
        setSnackBarMessage("Cannot add bags to a stored batch.");
        setSnackBarSeverity("warning");
        setOpenSnackBar(true);
        return;
      }

      if (!selectedProcessingType) {
        setSnackBarMessage("Processing type is missing.");
        setSnackBarSeverity("error");
        setOpenSnackBar(true);
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

      if (selectedBatch.parentBatchNumber) {
        try {
          await axios.post(
            `https://processing-facility-backend.onrender.com/api/dry-mill/${selectedBatch.batchNumber}/update-bags`,
            {
              grade,
              bagWeights: updatedBagWeights,
              weight: totalWeight.toString(),
              bagged_at: new Date().toISOString().slice(0, 10),
              processingType: selectedProcessingType,
            }
          );
          setSnackBarMessage("Bag added successfully.");
          setSnackBarSeverity("success");
          setOpenSnackBar(true);
          await fetchDryMillData();
        } catch (error) {
          console.error("Error updating bags:", error);
          setSnackBarMessage(error.response?.data?.data?.error || "Failed to update bags");
          setSnackBarSeverity("error");
          setOpenSnackBar(true);
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

  /**
   * Removes a bag from a grade.
   */
  const handleRemoveBag = useCallback(
    async (gradeIndex, bagIndex) => {
      if (!selectedBatch || !selectedProcessingType) {
        setSnackBarMessage("Batch or processing type is missing.");
        setSnackBarSeverity("error");
        setOpenSnackBar(true);
        return;
      }
      if (selectedBatch.isStored || grades[gradeIndex]?.is_stored) {
        setSnackBarMessage("Cannot remove bags from a stored batch.");
        setSnackBarSeverity("warning");
        setOpenSnackBar(true);
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
          await axios.post(
            `https://processing-facility-backend.onrender.com/api/dry-mill/${selectedBatch.batchNumber}/update-bags`,
            {
              grade,
              bagWeights: updatedBagWeights,
              weight: totalWeight >= 0 ? totalWeight.toString() : "0",
              bagged_at: new Date().toISOString().slice(0, 10),
              processingType: selectedProcessingType,
            }
          );
          setSnackBarMessage("Bag removed successfully.");
          setSnackBarSeverity("success");
          setOpenSnackBar(true);
          await fetchDryMillData();
        } catch (error) {
          console.error("Error removing bag:", error);
          setSnackBarMessage(error.response?.data?.data?.error || "Failed to remove bag");
          setSnackBarSeverity("error");
          setOpenSnackBar(true);
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

  /**
   * Saves a sub-batch.
   */
  const handleSaveSubBatch = useCallback(async () => {
    if (!selectedBatch || !grades[0] || !selectedProcessingType) {
      setSnackBarMessage("Batch, grade, or processing type is missing.");
      setSnackBarSeverity("error");
      setOpenSnackBar(true);
      return;
    }
    if (selectedBatch.isStored || grades[0].is_stored) {
      setSnackBarMessage("Cannot save changes to a stored batch.");
      setSnackBarSeverity("warning");
      setOpenSnackBar(true);
      return;
    }
    try {
      await axios.post(
        `https://processing-facility-backend.onrender.com/api/dry-mill/${selectedBatch.batchNumber}/update-bags`,
        {
          grade: grades[0].grade,
          bagWeights: grades[0].bagWeights,
          weight: grades[0].weight.toString(),
          bagged_at: new Date().toISOString().slice(0, 10),
          processingType: selectedProcessingType,
        }
      );
      setSnackBarMessage("Sub-batch saved successfully.");
      setSnackBarSeverity("success");
      setOpenSnackBar(true);
      await fetchDryMillData();
    } catch (error) {
      console.error("Error saving sub-batch:", error);
      setSnackBarMessage(error.response?.data?.data?.error || "Failed to save sub-batch");
      setSnackBarSeverity("error");
      setOpenSnackBar(true);
    }
  }, [selectedBatch, grades, selectedProcessingType, fetchDryMillData]);

  // Initial data fetch
  useEffect(() => {
    fetchDryMillData();
    fetchLatestRfid();
    fetchProcessingTypes();
    fetchProductLines();
    fetchReferenceMappings();
    const intervalId = setInterval(() => {
      fetchDryMillData();
      fetchLatestRfid();
    }, 600000); // 10 minutes
    return () => clearInterval(intervalId);
  }, [fetchDryMillData, fetchLatestRfid, fetchProcessingTypes, fetchProductLines, fetchReferenceMappings]);

  // Update processing types when batch changes
  useEffect(() => {
    if (selectedBatch) {
      if (!selectedBatch.parentBatchNumber) {
        const types = fetchBatchProcessingTypes(selectedBatch.batchNumber);
        setBatchProcessingTypes(types);
        setSelectedProcessingType(types[0] || null);
      } else {
        setBatchProcessingTypes([selectedBatch.processingType]);
        setSelectedProcessingType(selectedBatch.processingType);
      }
    }
  }, [selectedBatch, fetchBatchProcessingTypes]);

  // Fetch grades when batch or processing type changes
  useEffect(() => {
    if (selectedBatch && selectedProcessingType) {
      fetchExistingGrades(selectedBatch.batchNumber, selectedProcessingType).then((existingGrades) => {
        setGrades(existingGrades);
        const initialWeights = {};
        existingGrades.forEach((_, idx) => (initialWeights[idx] = ""));
        setCurrentWeights(initialWeights);
      });
    }
  }, [selectedBatch, selectedProcessingType, fetchExistingGrades]);

  // Auto-focus RFID input in storage dialog
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
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBatch(null);
    setBatchProcessingTypes([]);
    setSelectedProcessingType(null);
    setGrades([]);
  };

  const handleCloseCompleteDialog = () => {
    setOpenCompleteDialog(false);
  };

  const handleCloseStorageDialog = () => {
    setOpenStorageDialog(false);
    setRfid("");
    setSelectedBatch(null);
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
      {
        field: "status",
        headerName: "Status",
        width: 150,
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
      { field: "cherry_weight", headerName: "Cherry Weight (kg)", width: 160 },
      { field: "producer", headerName: "Producer", width: 120 },
      { field: "productLine", headerName: "Product Line", width: 160 },
      {
        field: "processingTypes",
        headerName: "Processing Types",
        width: 200,
        valueGetter: (params) => (params.value || []).join(", "),
      },
      { field: "type", headerName: "Type", width: 120 },
      { field: "totalBags", headerName: "Total Bags", width: 120 },
      { field: "notes", headerName: "Notes", width: 180 },
    ],
    [isLoading]
  );

  const subBatchColumns = useMemo(
    () => [
      { field: "batchNumber", headerName: "Batch Number", width: 180 },
      { field: "referenceNumber", headerName: "Ref Number", width: 180 },
      { field: "parentBatchNumber", headerName: "Parent Batch", width: 160 },
      {
        field: "status",
        headerName: "Status",
        width: 150,
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
          (a.dryMillEntered === "N/A" ? Infinity : new Date(a.dryMillEntered)).batchNumber -
            (b.dryMillEntered === "N/A" ? Infinity : new Date(b.dryMillEntered)).batchNumber
        );
      }),
    [parentBatches]
  );

  const getSubBatches = useCallback(
    () =>
      [...subBatches].sort((a, b) =>
        a.parentBatchNumber?.batchNumber.localeCompare(b?.parentBatchNumber) || a.batchNumber.localeCompare(b.batchNumber)
      ),
    [subBatches]
  );

  const renderParentDataGrid = useMemo(
    () => (
      <DataGrid
        rows={getParentBatches()}
        columns={parentColumns}
        initialState={{ pagination: { paginationModel: { pageSize: 5 } }}}
        pageSizeOptions={[5, 10, 20]}
        disableRowSelectionOnClick
        getRowId={(row) => row.id}
        slots={{ toolbar: GridToolbar }}
        autosizeOnMount
        autosizeOptions={{ includeHeaders: true, includeOutliers: true, expand: true }}
        rowHeight={auto}
        sx={{ height: 400, width: "100%" }}
      />
    ),
    [getParentBatches, parentColumns]
  );

  const renderSubBatchDataGrid = useMemo(() => {
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
        initialState={{ pagination: { paginationModel: { pageSize: 5 } }}}
        pageSizeOptions={[5, 10, 20]}
        disableRowSelectionOnClick
        getRowId={(row) => row.id}
        slots={{ toolbar: GridToolbar }}
        autosizeOnMount
        autosizeOptions={{ includeHeaders: true, includeOutliers: true, expand: true }}
        rowHeight={auto}
        sx={{ height: 600, width: "100%" }}
      />
    );
  }, [getSubBatches, subBatchColumns]);

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
        <DialogTitle>Batch {selectedBatch?.batchNumber}</DialogTitle>
        <DialogContent>
          {batchProcessingTypes.length > 1 && !selectedBatch?.parentBatchNumber && (
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
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {grades.map((grade, index) => {
              const totalWeight =
                grade.weight || grade.bagWeights.reduce((acc, w) => acc + parseFloat(w || 0), 0);
              const totalBags = grade.bagWeights.length;
              return (
                <Grid item xs={12} key={`${grade.grade}-${index}`}>
                  <Box
                    sx={{ mb: 2, p: 2, border: "1px solid #e0e0e0", borderRadius: 1 }}
                  >
                    <Typography variant="subtitle1">{grade.grade}</Typography>
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
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isLoading}>
            Cancel
          </Button>
          {selectedBatch?.parentBatchNumber ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveSubBatch}
              disabled={
                isLoading ||
                !selectedBatch ||
                selectedBatch?.isStored ||
                grades[0]?.is_stored
              }
            >
              Save
            </Button>
          ) : (
            <>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSortAndWeigh}
                disabled={
                  isLoading ||
                  !selectedBatch ||
                  !selectedProcessingType ||
                  selectedBatch?.isStored
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
                  selectedBatch?.isStored ||
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