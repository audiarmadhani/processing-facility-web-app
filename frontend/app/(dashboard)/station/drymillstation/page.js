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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  ListItemText,
  OutlinedInput,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import axios from "axios";
import jsPDF from "jspdf";
import SaveIcon from '@mui/icons-material/Save';

// Constants for scanned_at values
const SCAN_LOCATIONS = {
  DRY_MILL: "Dry_Mill",
  WAREHOUSE: "Warehouse",
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
  const [rfid, setRfid] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [openCompleteDialog, setOpenCompleteDialog] = useState(false);
  const [openStorageDialog, setOpenStorageDialog] = useState(false);
  const [dataGridError, setDataGridError] = useState(null);
  const [errorLog, setErrorLog] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [openSampleTrackingDialog, setOpenSampleTrackingDialog] = useState(false);
  const [sampleDateTaken, setSampleDateTaken] = useState(new Date().toISOString().split("T")[0]);
  const [sampleWeightTaken, setSampleWeightTaken] = useState("");
  const [sampleHistory, setSampleHistory] = useState([]);
  const [openSampleHistoryDialog, setOpenSampleHistoryDialog] = useState(false);
  const [sampleData, setSampleData] = useState([]);
  const [openMergeDialog, setOpenMergeDialog] = useState(false);

  // ---------- Process-sheet state (4 steps, grade totals only) ----------
const PROCESS_STEPS = ['Huller', 'Suton', 'Sizer', 'Handpicking'];
const GRADE_ORDER = ['Specialty Grade', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Asalan'];

// structure:
// { Huller: { outputWeight: '12.34' },
//   Suton: { grades: { 'Specialty Grade': { weight: '12.34' }, ... } }, ... }
const [processTables, setProcessTables] = useState({
  Huller: { outputWeight: '' },
  Suton: { grades: {} },
  Sizer: { grades: {} },
  Handpicking: { grades: {} },
});

const createEmptyProcessTables = () => {
  const base = {
    Huller: { outputWeight: '' },
    Suton: { grades: {} },
    Sizer: { grades: {} },
    Handpicking: { grades: {} },
  };

  GRADE_ORDER.forEach((g) => {
    base.Suton.grades[g] = { weight: '' };
    base.Sizer.grades[g] = { weight: '' };
    base.Handpicking.grades[g] = { weight: '' };
  });

  return base;
};

const capitalize = (s) =>
  typeof s === 'string' ? s.charAt(0).toUpperCase() + s.slice(1) : s;

const normalizeProcessStep = (label) => {
  switch (label) {
    case 'Huller': return 'huller';
    case 'Suton': return 'suton';
    case 'Sizer': return 'sizer';
    case 'Handpicking': return 'handpicking';
    default: return label?.toLowerCase();
  }
};

// ---------- Yield helpers ----------
const toNumber = (v) => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};

const sumGrades = (grades = {}) =>
  Object.values(grades).reduce((sum, g) => sum + toNumber(g.weight), 0);

const calcYield = (num, denom) => {
  if (!denom || denom <= 0) return null;
  return (num / denom) * 100;
};

const initProcessTablesFromEvents = useCallback(async () => {
  if (!selectedBatch) return;
  const res = await axios.get(
    `https://processing-facility-backend.onrender.com/api/drymill/track-weight/${selectedBatch.batchNumber}`,
    { params: { processingType: selectedBatch.processingType } }
  );

  const base = createEmptyProcessTables();

  res.data.forEach((row) => {
    const step = row.processStep;
    const grade = row.grade;

    if (step === 'huller') {
      base.Huller.outputWeight = String(row.totalWeight);
    } else if (base[capitalize(step)]?.grades?.[grade]) {
      base[capitalize(step)].grades[grade].weight = String(row.totalWeight);
    }
  });

  setProcessTables(base);
}, [selectedBatch]);

// Re-init table whenever dialog opens
useEffect(() => {
  if (openDialog) {
    initProcessTablesFromEvents();
  }
}, [openDialog, initProcessTablesFromEvents]);

  // add process pick for track weight / grade edits
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [mergeNotes, setMergeNotes] = useState("");
  const [newBatchNumber, setNewBatchNumber] = useState("");
  const [totalSelectedWeight, setTotalSelectedWeight] = useState(0);
  const rfidInputRef = useRef(null);

  const logError = (message, error) => {
    setErrorLog((prev) => [
      ...prev,
      { message, error: error?.message || "Unknown error", timestamp: new Date() },
    ]);
    setDataGridError(message);
  };

  const handleSaveProcessGrade = async (procLabel, gradeName) => {
    if (!selectedBatch) return;

    const step = normalizeProcessStep(procLabel);
    const valueStr = processTables?.[procLabel]?.grades?.[gradeName]?.weight ?? '';
    const parsed = parseFloat(valueStr);

    if (isNaN(parsed) || parsed <= 0) {
      setSnackbarMessage('Enter a valid positive weight.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://processing-facility-backend.onrender.com'}/api/drymill/process-event`,
        {
          batchNumber: selectedBatch.batchNumber,
          processingType: selectedBatch.processingType,
          processStep: step,
          producer: selectedBatch.producer,
          grade: gradeName,
          inputWeight: 0,
          outputWeight: parsed,
          operator: session?.user?.name || 'unknown',
          notes: `${procLabel} ${gradeName} recorded via UI: ${parsed.toFixed(2)} kg`,
        }
      );

      setSnackbarMessage(`Saved ${procLabel} - ${gradeName}`);
      setSnackbarSeverity('success');
      setOpenSnackbar(true);

      await initProcessTablesFromEvents();
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to save process grade';
      logError(message, err);
      setSnackbarMessage(message);
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDryMillData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("https://processing-facility-backend.onrender.com/api/dry-mill-data");
      const data = response.data;

      // Include all batches without dryMillExited or not Processed in parentBatches
      const parentBatchesData = data
        .map((batch) => ({
          batchNumber: batch.batchNumber,
          status: batch.status,
          dryMillEntered: batch.dryMillEntered,
          dryMillExited: batch.dryMillExited,
          cherry_weight: parseFloat(batch.cherry_weight || 0).toFixed(2),
          drying_weight: parseFloat(batch.drying_weight || 0).toFixed(2),
          producer: batch.producer === "HQ" ? "HEQA" : batch.producer || "N/A",
          farmerName: batch.farmerName || "N/A",
          productLine: batch.productLine || "N/A",
          processingType: batch.processingType,
          totalBags: batch.totalBags || "0",
          notes: batch.notes || "N/A",
          type: batch.type || "N/A",
          farmVarieties: batch.farmVarieties || "N/A",
          storedDate: batch.storeddatetrunc || null,
          batchType: batch.batchType || "Cherry",
          lotNumber: batch.lotNumber === "ID-BTM-A-N-AS" && !batch.dryMillExited ? "ID-BTM-A-N" : batch.lotNumber,
          referenceNumber: batch.referenceNumber || "N/A",
          dryMillMerged: batch.dryMillMerged ? "Merged" : "Not Merged",
          id: `${batch.batchNumber}__${batch.producer}__${batch.processingType}`,
        }));

      // Include all sub-batches, including those with quality and totalBags > 0
      const subBatchesData = data
        .filter((batch) =>
          (batch.quality && batch.quality !== "N/A" && parseInt(batch.totalBags, 10) > 0) ||
          (batch.parentBatchNumber && batch.parentBatchNumber !== batch.batchNumber)
        )
        .map((batch) => ({
          id: `${batch.batchNumber}__${batch.producer}__${batch.processingType}`,
          batchNumber: batch.batchNumber,
          status: batch.status,
          dryMillEntered: batch.dryMillEntered,
          dryMillExited: batch.dryMillExited,
          storedDate: batch.storeddatetrunc || "N/A",
          weight: parseFloat(batch.weight || 0).toFixed(2),
          producer: batch.producer === "HQ" ? "HEQA" : batch.producer || "N/A",
          farmerName: batch.farmerName || "N/A",
          productLine: batch.productLine || "N/A",
          processingType: batch.processingType,
          quality: batch.quality || "N/A",
          totalBags: batch.totalBags || "0",
          notes: batch.notes || "N/A",
          type: batch.type || "N/A",
          parentBatchNumber: batch.parentBatchNumber || batch.batchNumber,
          lotNumber: batch.lotNumber,
          referenceNumber: batch.referenceNumber || "N/A",
          bagWeights: batch.bagDetails || [],
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
  }, []);

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

  const fetchSampleData = useCallback(async () => {
    try {
      const response = await axios.get("https://processing-facility-backend.onrender.com/api/sample-data");
      const data = response.data.map((row) => ({
        id: `${row.batchNumber}-${row.date_taken}-${Math.random().toString(36).substr(2, 9)}`,
        batchNumber: row.batchNumber,
        lotNumber: row.lotNumber,
        referenceNumber: row.referenceNumber,
        processingType: row.processingType,
        dateTaken: row.date_taken,
        weightTaken: parseFloat(row.weight_taken).toFixed(2),
        totalCurrentWeight: parseFloat(row.total_current_weight).toFixed(2),
      }));
      setSampleData(data);
    } catch (error) {
      const message = error.response?.data?.error || "Failed to fetch sample data.";
      logError(message, error);
      setSnackbarMessage(message);
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      setSampleData([]);
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
          setSelectedBatch({ batchNumber: response.data.batchNumber, processingType: response.data.processingType });
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

  const handleOpenMergeDialog = async () => {
    if (!["admin", "manager"].includes(session.user.role)) {
      setSnackbarMessage("Only admins or managers can merge batches.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }
    try {
      const response = await axios.get("https://processing-facility-backend.onrender.com/api/new-batch-number");
      setNewBatchNumber(response.data.newBatchNumber);
      setOpenMergeDialog(true);
    } catch (error) {
      logError("Failed to fetch new batch number for merging.", error);
      setSnackbarMessage("Failed to fetch new batch number for merging.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const handleCloseMergeDialog = () => {
    setOpenMergeDialog(false);
    setSelectedBatches([]);
    setMergeNotes("");
    setNewBatchNumber("");
    setTotalSelectedWeight(0);
  };

  const handleMergeBatches = async () => {
    if (selectedBatches.length < 2) {
      setSnackbarMessage("Please select at least two batches to merge.");
      setSnackbarSeverity("warning");
      setOpenSnackbar(true);
      return;
    }
    const selectedBatchDetails = parentBatches.filter((b) =>
      selectedBatches.includes(`${b.batchNumber},${b.producer},${b.processingType}`)
    );
    const [, producer, processingType] = selectedBatches[0].split(',');
    // if (
    //   !selectedBatchDetails.every(
    //     (b) => b.producer === producer && b.processingType === processingType
    //   )
    // ) {
    //   setSnackbarMessage("All selected batches must have the same producer and processing type.");
    //   setSnackbarSeverity("error");
    //   setOpenSnackbar(true);
    //   return;
    // }
    try {
      const response = await axios.post("https://processing-facility-backend.onrender.com/api/dry-mill/merge", {
        batchNumbers: selectedBatches, // Send full identifiers with commas
        notes: mergeNotes.trim() || null,
        createdBy: session?.user?.name || "Unknown",
      });
      setSnackbarMessage(
        `Batches merged successfully into ${response.data.newBatchNumber} with total weight ${response.data.totalWeight} kg.`
      );
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
      await fetchDryMillData();
      handleCloseMergeDialog();
    } catch (error) {
      const message = error.response?.data?.error || "Failed to merge batches.";
      logError(message, error);
      setSnackbarMessage(message);
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

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
      try {
        const response = await axios.post(
          `https://processing-facility-backend.onrender.com/api/dry-mill/${selectedBatch.batchNumber}/complete`,
          {
            createdBy: session.user.name,
            updatedBy: session.user.name,
            dryMillExited: new Date().toISOString(),
            processingType: selectedBatch.processingType,
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
    [selectedBatch, session, fetchDryMillData]
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
            processingType: selectedBatch.processingType,
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
          processingType: selectedBatch.processingType,
        }
      );
      setSampleHistory([...sampleHistory, response.data]);
      setSampleWeightTaken("");
      setSnackbarMessage("Sample added successfully.");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
      await fetchDryMillData();
      await fetchSampleData();
    } catch (error) {
      const message = error.response?.data?.error || "Failed to add sample.";
      logError(message, error);
      setSnackbarMessage(message);
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  }, [selectedBatch, sampleDateTaken, sampleWeightTaken, sampleHistory, fetchDryMillData, fetchSampleData]);

  const handleShowSampleHistory = useCallback(async (batchNumber, processingType) => {
    const batch = parentBatches.find((b) => b.batchNumber === batchNumber && b.processingType === processingType);
    setSelectedBatch(batch);
    await fetchSampleHistory(batchNumber);
    setOpenSampleHistoryDialog(true);
  }, [parentBatches, fetchSampleHistory]);

  useEffect(() => {
    fetchDryMillData();
    fetchLatestRfid();
    fetchSampleData();
    const intervalId = setInterval(() => {
      fetchDryMillData();
      fetchLatestRfid();
      fetchSampleData();
    }, 600000); // 10 minutes
    return () => clearInterval(intervalId);
  }, [fetchDryMillData, fetchLatestRfid, fetchSampleData]);

  useEffect(() => {
    if (openStorageDialog && rfidInputRef.current) {
      rfidInputRef.current.focus();
    }
  }, [openStorageDialog]);

  const handleRefreshData = () => {
    fetchDryMillData();
    fetchLatestRfid();
    fetchSampleData();
  };

  const handleDetailsClick = useCallback((batch) => {
    setSelectedBatch(batch);
    setOpenDialog(true);
  }, []);

  const handleSampleTrackingClick = useCallback((batch) => {
    setSelectedBatch(batch);
    setSampleDateTaken(new Date().toISOString().split("T")[0]);
    setSampleWeightTaken("");
    setSampleHistory([]);
    fetchSampleHistory(batch.batchNumber);
    setOpenSampleTrackingDialog(true);
  }, [fetchSampleHistory]);

  const handleCloseDialog = () => {
    if (hasUnsavedChanges) {
      if (confirm("You have unsaved changes. Do you want to discard them?")) {
        setOpenDialog(false);
        setSelectedBatch(null);
        setHasUnsavedChanges(false);
      }
    } else {
      setOpenDialog(false);
      setSelectedBatch(null);
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

  const handleCloseSampleHistoryDialog = () => {
    setOpenSampleHistoryDialog(false);
    setSelectedBatch(null);
    setSampleHistory([]);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleRfidKeyPress = (e) => {
    if (e.key === "Enter") {
      handleConfirmStorage();
    }
  };

// Save huller output (single total) — records a process-event
const handleSaveHullerOutput = async () => {
  if (!selectedBatch) {
    setSnackbarMessage('Batch missing.');
    setSnackbarSeverity('error');
    setOpenSnackbar(true);
    return;
  }
  const outStr = processTables?.Huller?.outputWeight || '';
  const parsed = parseFloat(outStr);
  if (isNaN(parsed) || parsed <= 0) {
    setSnackbarMessage('Enter a valid positive huller output weight.');
    setSnackbarSeverity('error');
    setOpenSnackbar(true);
    return;
  }

  setIsLoading(true);
  try {
    await axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://processing-facility-backend.onrender.com'}/api/drymill/process-event`,
      {
        batchNumber: selectedBatch.batchNumber,
        processingType: selectedBatch.processingType,
        processStep: 'huller',
        producer: selectedBatch.producer,
        inputWeight: 0,
        outputWeight: parsed,
        operator: session?.user?.name || 'unknown',
        notes: `Huller output recorded via UI: ${parsed.toFixed(2)} kg`
      }
    );

    setSnackbarMessage('Recorded Huller output.');
    setSnackbarSeverity('success');
    setOpenSnackbar(true);
    await fetchDryMillData();
    await initProcessTablesFromEvents();
  } catch (err) {
    const message = err.response?.data?.error || 'Failed to record huller output';
    logError(message, err);
    setSnackbarMessage(message);
    setSnackbarSeverity('error');
    setOpenSnackbar(true);
  } finally {
    setIsLoading(false);
  }
};

  const parentColumns = useMemo(
    () => [
      {
        field: "select",
        headerName: "Select",
        width: 100,
        sortable: false,
        renderCell: ({ row }) => (
          <Checkbox
            checked={selectedBatches.includes(`${row.batchNumber},${row.producer},${row.processingType}`)}
            onChange={(e) => {
              const uniqueId = `${row.batchNumber},${row.producer},${row.processingType}`;
              const newSelected = e.target.checked
                ? [...selectedBatches, uniqueId]
                : selectedBatches.filter((b) => b !== uniqueId);
              setSelectedBatches(newSelected);
              const selectedBatchDetails = parentBatches.filter((b) =>
                newSelected.includes(`${b.batchNumber},${b.producer},${b.processingType}`)
              );
              const totalWeight = selectedBatchDetails.reduce(
                (sum, b) => sum + parseFloat(b.drying_weight || 0),
                0
              );
              setTotalSelectedWeight(totalWeight);
            }}
            disabled={row.status !== "In Dry Mill" || row.dryMillExited}
          />
        ),
      },
      { field: "batchNumber", headerName: "Batch Number", width: 160 },
      { field: "lotNumber", headerName: "Lot Number", width: 180 },
      { field: "referenceNumber", headerName: "Ref Number", width: 180 },
      { field: "processingType", headerName: "Processing Type", width: 180 },
      { field: "producer", headerName: "Producer", width: 120 },
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
        field: "dryMillMerged",
        headerName: "Merge Status",
        width: 150,
        renderCell: ({ value }) => (
          <Chip
            label={value}
            color={value === "Merged" ? "warning" : "default"}
            size="small"
            sx={{ borderRadius: "16px", fontWeight: "bold" }}
          />
        ),
      },
      {
        field: "sampleTracking",
        headerName: "Sample Tracking",
        width: 170,
        sortable: false,
        renderCell: (params) => (
          <Button
            variant="contained"
            color="secondary"
            size="small"
            onClick={() => handleSampleTrackingClick(params.row)}
            disabled={isLoading}
          >
            Sample Tracking
          </Button>
        ),
      },
      {
        field: "details",
        headerName: "Track Weight",
        width: 170,
        sortable: false,
        renderCell: (params) => (
          <Button
            variant="contained"
            size="small"
            onClick={() => handleDetailsClick(params.row)}
            disabled={isLoading}
          >
            Track Weight
          </Button>
        ),
      },
      { field: "farmerName", headerName: "Farmer Name", width: 160 },
      { field: "farmVarieties", headerName: "Farm Varieties", width: 160 },
      { field: "type", headerName: "Type", width: 120 },
      { field: "dryMillEntered", headerName: "Dry Mill Entered", width: 150 },
      { field: "dryMillExited", headerName: "Dry Mill Exited", width: 150 },
      { field: "cherry_weight", headerName: "Cherry Weight (kg)", width: 160 },
      { field: "drying_weight", headerName: "Drying Weight (kg)", width: 160 },
      { field: "productLine", headerName: "Product Line", width: 160 },
      { field: "batchType", headerName: "Batch Type", width: 120 },
      { field: "totalBags", headerName: "Total Bags", width: 120 },
      { field: "notes", headerName: "Notes", width: 180 },
    ],
    [isLoading, selectedBatches, parentBatches]
  );

  const subBatchColumns = useMemo(
    () => [
      { field: "batchNumber", headerName: "Batch Number", width: 180 },
      { field: "lotNumber", headerName: "Lot Number", width: 180 },
      { field: "referenceNumber", headerName: "Ref Number", width: 180 },
      { field: "parentBatchNumber", headerName: "Parent Batch", width: 160 },
      { field: "producer", headerName: "Producer", width: 120 },
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
            variant="contained"
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
      { field: "storedDate", headerName: "Stored Date", width: 150 },
      { field: "weight", headerName: "Weight (kg)", width: 140 },
      { field: "productLine", headerName: "Product Line", width: 160 },
      { field: "processingType", headerName: "Processing Type", width: 180 },
      { field: "type", headerName: "Type", width: 140 },
      { field: "quality", headerName: "Quality", width: 120 },
      { field: "totalBags", headerName: "Bags Qty", width: 120 },
      { field: "notes", headerName: "Notes", width: 180 },
    ],
    [isLoading]
  );

  const sampleOverviewColumns = useMemo(
    () => [
      { field: "batchNumber", headerName: "Batch Number", width: 160 },
      { field: "lotNumber", headerName: "Lot Number", width: 180 },
      { field: "referenceNumber", headerName: "Ref Number", width: 180 },
      { field: "processingType", headerName: "Processing Type", width: 180 },
      { field: "dateTaken", headerName: "Date Taken", width: 150 },
      { field: "weightTaken", headerName: "Weight Taken (kg)", width: 150 },
      { field: "totalCurrentWeight", headerName: "Total Current Weight (kg)", width: 180 },
      {
        field: "history",
        headerName: "History",
        width: 120,
        sortable: false,
        renderCell: (params) => (
          <Button
            variant="contained"
            size="small"
            onClick={() => handleShowSampleHistory(params.row.batchNumber, params.row.processingType)}
            disabled={isLoading}
          >
            History
          </Button>
        ),
      },
    ],
    [isLoading, handleShowSampleHistory]
  );

  const getParentBatches = useCallback(
    () =>
      [...parentBatches].sort((a, b) => {
        const statusOrder = { "In Dry Mill": 0, "Processed": 1, "Not Started": 2 };
        return (
          (statusOrder[a.status] || 2) - (statusOrder[b.status] || 2) ||
          new Date(a.dryMillEntered || 0) - new Date(b.dryMillEntered || 0) ||
          a.producer.localeCompare(b.producer) ||
          a.processingType.localeCompare(b.processingType)
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
        initialState={{ pagination: { paginationModel: { pageSize: 100 } } }}
        pageSizeOptions={[10, 50, 100]}
        disableRowSelectionOnClick
        getRowId={(row) => row.id}
        slots={{ toolbar: GridToolbar }}
        autosizeOnMount
        autosizeOptions={{
          includeHeaders: true,
          includeOutliers: true,
          expand: true,
        }}
        rowHeight={35}
        sx={{ height: 600, width: "100%" }}
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
        initialState={{ pagination: { paginationModel: { pageSize: 100 } } }}
        pageSizeOptions={[10, 50, 100]}
        disableRowSelectionOnClick
        getRowId={(row) => row.id}
        slots={{ toolbar: GridToolbar }}
        autosizeOnMount
        autosizeOptions={{
          includeHeaders: true,
          includeOutliers: true,
          expand: true,
        }}
        rowHeight={35}
        sx={{ height: 600, width: "100%" }}
      />
    );
  }, [getSubBatches, subBatchColumns, dataGridError]);

  const renderSampleOverviewDataGrid = useMemo(
    () => (
      <DataGrid
        rows={sampleData}
        columns={sampleOverviewColumns}
        initialState={{ pagination: { paginationModel: { pageSize: 100 } } }}
        pageSizeOptions={[10, 50, 100]}
        disableRowSelectionOnClick
        getRowId={(row) => row.id}
        slots={{ toolbar: GridToolbar }}
        autosizeOnMount
        autosizeOptions={{
          includeHeaders: true,
          includeOutliers: true,
          expand: true,
        }}
        rowHeight={35}
        sx={{ height: 400, width: "100%" }}
      />
    ),
    [sampleData, sampleOverviewColumns]
  );

  // ---------- Step totals for yield ----------
  const hullerTotal = toNumber(processTables.Huller.outputWeight);
  const sutonTotal = sumGrades(processTables.Suton.grades);
  const sizerTotal = sumGrades(processTables.Sizer.grades);
  const handpickTotal = sumGrades(processTables.Handpicking.grades);

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
            {/* --- Wet-mill style toolbar (replaces previous simple Box) --- */}
              <Box
                sx={{
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <Button
                    variant="contained"
                    onClick={handleRefreshData}
                    disabled={isLoading}
                    startIcon={isLoading ? <CircularProgress size={18} /> : undefined}
                  >
                    {isLoading ? "Refreshing..." : "Refresh"}
                  </Button>

                  <Button
                    variant="contained"
                    onClick={() => {
                      // Open a small quick-search or batch filter if desired in future
                      // keeps parity with wetmill which has small utility actions
                    }}
                    disabled
                  >
                    Filter
                  </Button>
                </Box>

                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      // quick-add common action that wet mill has: create new batch flow
                      // keep disabled now to avoid changing behavior
                    }}
                    disabled
                    size="small"
                  >
                    New Batch
                  </Button>

                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleOpenMergeDialog}
                    disabled={selectedBatches.length < 2 || isLoading}
                    size="small"
                  >
                    Merge
                  </Button>

                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleRefreshData}
                    startIcon={isLoading ? <CircularProgress size={18} /> : undefined}
                    disabled={isLoading}
                    size="small"
                  >
                    Refresh
                  </Button>
                </Box>
              </Box>
              {/* --- end toolbar --- */}
            {renderParentDataGrid}
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Sample Overview
            </Typography>
            {renderSampleOverviewDataGrid}
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
          Batch {selectedBatch?.batchNumber} - {selectedBatch?.processingType} ({selectedBatch?.batchType})
        </DialogTitle>
        <DialogContent>
          {selectedBatch && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2">Lot: {selectedBatch.lotNumber} • Ref: {selectedBatch.referenceNumber}</Typography>
            </Box>
          )}

          <Typography variant="h6" gutterBottom>Track Weight — Sheet View</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Edit the total weight for each step. Huller only needs a single output total. Other steps take per-grade totals.
          </Typography>

          {/* HULLER: single total row */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1">Huller (output)</Typography>
            <Table size="small" sx={{ mb: 1 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Step</TableCell>
                  <TableCell>Output Weight (kg)</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Huller</TableCell>
                  <TableCell>
                    <TextField
                      value={processTables.Huller.outputWeight || ''}
                      onChange={(e) => setProcessTables((p) => ({ ...p, Huller: { ...(p.Huller || {}), outputWeight: e.target.value } }))}
                      type="number"
                      inputProps={{ min: 0, step: 0.01 }}
                      size="small"
                      fullWidth
                      disabled={isLoading || !selectedBatch}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="contained" size="small" onClick={handleSaveHullerOutput} disabled={isLoading || !selectedBatch}>Save</Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>

          {/* Suton / Sizer / Handpicking - each a small sheet of grades */}
          {['Suton', 'Sizer', 'Handpicking'].map((proc) => {
            // ---- STEP TOTALS ----
            let stepTotal = 0;
            let stepYield = null;

            if (proc === 'Suton') {
              stepTotal = sutonTotal;
              stepYield = calcYield(sutonTotal, hullerTotal);
            }

            if (proc === 'Sizer') {
              stepTotal = sizerTotal;
              stepYield = calcYield(sizerTotal, sutonTotal);
            }

            if (proc === 'Handpicking') {
              stepTotal = handpickTotal;
              stepYield = calcYield(handpickTotal, sizerTotal);
            }

            return (
              <Box key={proc} sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>{proc}</Typography>
                <Table size="small" sx={{ mb: 1 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Grade</TableCell>
                      <TableCell>Yield (%)</TableCell>
                      <TableCell>Total Weight (kg)</TableCell>
                      <TableCell width={150}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {GRADE_ORDER.map((gradeName) => {
                      const value = processTables?.[proc]?.grades?.[gradeName]?.weight ?? '';
                    
                      let yieldPct = null;
                      if (proc === 'Suton') {
                        yieldPct = calcYield(
                          toNumber(processTables.Suton.grades[gradeName]?.weight),
                          hullerTotal
                        );
                      }

                      if (proc === 'Sizer') {
                        yieldPct = calcYield(
                          toNumber(processTables.Sizer.grades[gradeName]?.weight),
                          sutonTotal
                        );
                      }

                      if (proc === 'Handpicking') {
                        yieldPct = calcYield(
                          toNumber(processTables.Handpicking.grades[gradeName]?.weight),
                          sizerTotal
                        );
                      }
                      
                      return (
                        <TableRow key={`${proc}-${gradeName}`}>
                          <TableCell>{gradeName}</TableCell>

                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary">
                              {yieldPct !== null ? `${yieldPct.toFixed(1)} %` : '–'}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <TextField
                              value={value}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                setProcessTables((prev) => ({
                                  ...prev,
                                  [proc]: {
                                    ...prev[proc],
                                    grades: {
                                      ...prev[proc].grades,
                                      [gradeName]: {
                                        ...prev[proc].grades[gradeName],
                                        weight: newValue,
                                      },
                                    },
                                  },
                                }));
                              }}
                              size="small"
                              type="number"
                              inputProps={{ min: 0, step: 0.01 }}
                              fullWidth
                              disabled={isLoading || !selectedBatch}
                            />
                          </TableCell>

                          <TableCell>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleSaveProcessGrade(proc, gradeName)}
                              disabled={isLoading || !selectedBatch}
                            >
                              Save
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {/* SUBTOTAL ROW */}
                    <TableRow sx={{ backgroundColor: 'action.hover' }}>
                      <TableCell>
                        <Typography fontWeight={700}>Subtotal</Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Typography fontWeight={700}>
                          {stepYield !== null ? `${stepYield.toFixed(1)} %` : '–'}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography fontWeight={700}>
                          {stepTotal.toFixed(2)} kg
                        </Typography>
                      </TableCell>

                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            );
          })}

          <Box sx={{ mt: 1 }}>
            <Typography variant="body2">Notes:</Typography>
            <Typography variant="caption" color="text.secondary">
              - Each save records a process event (audit log).
              - This screen tracks totals only, not bags or inventory.
              - Final grading & storage are handled after processing is complete.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          {/* left-side: contextual secondary actions */}
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", mr: "auto" }}>
            <Button onClick={handleCloseDialog} disabled={isLoading}>
              Close
            </Button>

            {/* sample history quick-open (wetmill has similar quick utilities) */}
            <Button
              variant="contained"
              size="small"
              onClick={() => setOpenSampleHistoryDialog(true)}
              disabled={!selectedBatch}
            >
              Sample History
            </Button>
          </Box>

          <Button
            variant="contained"
            color="secondary"
            onClick={() => setOpenCompleteDialog(true)}
            disabled={
              isLoading ||
              !selectedBatch ||
              !["admin", "manager"].includes(session.user.role)
            }
          >
            Mark Complete
          </Button>
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
            Confirm marking Batch {selectedBatch?.batchNumber} as processed.
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
            variant="contained"
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
      <Dialog
        open={openSampleHistoryDialog}
        onClose={handleCloseSampleHistoryDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Sample History - Batch {selectedBatch?.batchNumber}</DialogTitle>
        <DialogContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date Taken</TableCell>
                <TableCell>Weight Taken (kg)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sampleHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} align="center">No samples recorded.</TableCell>
                </TableRow>
              ) : (
                sampleHistory.map((sample, index) => (
                  <TableRow key={index}>
                    <TableCell>{new Date(sample.dateTaken).toLocaleDateString()}</TableCell>
                    <TableCell>{parseFloat(sample.weightTaken).toFixed(2)}</TableCell>
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
          <Button onClick={handleCloseSampleHistoryDialog} disabled={isLoading}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      
      <Dialog open={openMergeDialog} onClose={handleCloseMergeDialog} maxWidth="md" fullWidth>
        <DialogTitle>Merge Batches</DialogTitle>
        <DialogContent>
          <Typography>New Batch Number: {newBatchNumber}</Typography>
          <Typography>Total Weight: {totalSelectedWeight.toFixed(2)} kg</Typography>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="merge-batches-label">Selected Batches</InputLabel>
            <Select
              labelId="merge-batches-label"
              multiple
              value={selectedBatches}
              onChange={(e) => {
                const newSelected = e.target.value;
                setSelectedBatches(newSelected);
                const selectedBatchDetails = parentBatches.filter((b) => newSelected.includes(`${b.batchNumber},${b.producer},${b.processingType}`));
                const totalWeight = selectedBatchDetails.reduce(
                  (sum, b) => sum + parseFloat(b.drying_weight || 0),
                  0
                );
                setTotalSelectedWeight(totalWeight);
              }}
              input={<OutlinedInput label="Selected Batches" />}
              renderValue={(selected) => selected.map(s => s.split(',')[0]).join(", ")}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 48 * 4.5 + 8,
                    width: 250,
                  },
                },
              }}
            >
              {parentBatches.map((batch) => (
                <MenuItem
                  key={`${batch.batchNumber},${batch.producer},${batch.processingType}`}
                  value={`${batch.batchNumber},${batch.producer},${batch.processingType}`}
                  disabled={batch.status !== "In Dry Mill" || batch.dryMillExited || batch.storedDate}
                >
                  <Checkbox
                    checked={selectedBatches.includes(`${batch.batchNumber},${batch.producer},${batch.processingType}`)}
                  />
                  <ListItemText
                    primary={`${batch.batchNumber} (${batch.processingType}, ${batch.producer}, ${batch.drying_weight} kg, ${batch.dryMillMerged})`}
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Merge Notes"
            multiline
            rows={4}
            value={mergeNotes}
            onChange={(e) => setMergeNotes(e.target.value)}
            fullWidth
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMergeDialog} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleMergeBatches}
            color="primary"
            variant="contained"
            disabled={selectedBatches.length < 2}
          >
            Merge
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