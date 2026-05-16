'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { Button, Checkbox, Chip, FormControl, MenuItem, Select } from '@mui/material';

export const SCAN_LOCATIONS = {
  DRY_MILL: 'Dry_Mill',
  WAREHOUSE: 'Warehouse',
};

export const DRY_MILL_ALLOWED_ROLES = ['admin', 'manager', 'drymill', 'postprocessing'];

export function useDryMillData(session) {
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

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  const [openEnterDialog, setOpenEnterDialog] = useState(false);
  const [openExitDialog, setOpenExitDialog] = useState(false);

  const [enteredAt, setEnteredAt] = useState('');
  const [exitedAt, setExitedAt] = useState('');

  // ---------- Process-sheet state (4 steps, grade totals only) ----------

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

  const fetchDryMillData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("https://processing-facility-backend.onrender.com/api/dry-mill-data");
      const data = response.data;

      // Include all batches without dryMillExited or not Processed in parentBatches
      const parentBatchesData = data
        // .filter((batch) => !batch.dryMillExited || batch.status !== "Processed")
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

  const handleWeightClick = handleDetailsClick;

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

const handleOpenMenu = (event, row) => {
  setAnchorEl(event.currentTarget);
  setSelectedRow(row);
};

const handleCloseMenu = () => {
  setAnchorEl(null);
  setSelectedRow(null);
};

const handleCloseActionMenu = () => {
  setAnchorEl(null);
};

// ---- ENTER DRY MILL ----
const handleOpenEnter = () => {
  setEnteredAt('');
  setOpenEnterDialog(true);
  handleCloseActionMenu();
};

const handleSubmitEnter = async () => {
  if (!selectedBatch?.batchNumber || !selectedBatch?.processingType) {
    setSnackbarMessage('No batch selected for dry mill entry');
    setSnackbarSeverity('error');
    setOpenSnackbar(true);
    return;
  }

  if (!enteredAt) {
    setSnackbarMessage('Enter date is required');
    setSnackbarSeverity('error');
    setOpenSnackbar(true);
    return;
  }

  try {
    await axios.post(
      `https://processing-facility-backend.onrender.com/api/dry-mill/${selectedBatch.batchNumber}/enter`,
      {
        entered_at: enteredAt,
        processingType: selectedBatch.processingType,
      }
    );

    setSnackbarMessage('Batch entered dry mill');
    setSnackbarSeverity('success');

    setOpenEnterDialog(false);
    setSelectedBatch(null);
    await fetchDryMillData();

  } catch (err) {
    setSnackbarMessage(err.response?.data?.error || 'Failed to enter dry mill');
    setSnackbarSeverity('error');
  } finally {
    setOpenSnackbar(true);
  }
};

// ---- EXIT DRY MILL ----
const handleOpenExit = () => {
  setExitedAt('');
  setOpenExitDialog(true);
  handleCloseActionMenu();
};

const handleSubmitExit = async () => {
  if (!selectedBatch?.batchNumber || !selectedBatch?.processingType) {
    setSnackbarMessage('No batch selected for dry mill exit');
    setSnackbarSeverity('error');
    setOpenSnackbar(true);
    return;
  }

  if (!exitedAt) {
    setSnackbarMessage('Exit date is required');
    setSnackbarSeverity('error');
    setOpenSnackbar(true);
    return;
  }

  try {
    await axios.post(
      `https://processing-facility-backend.onrender.com/api/dry-mill/${selectedBatch.batchNumber}/exit`,
      {
        exited_at: exitedAt,
        processingType: selectedBatch.processingType,
        updatedBy: session?.user?.name,
      }
    );

    setSnackbarMessage('Batch exited dry mill');
    setSnackbarSeverity('success');

    setOpenExitDialog(false);
    setSelectedBatch(null);
    await fetchDryMillData();

  } catch (err) {
    setSnackbarMessage(err.response?.data?.error || 'Failed to exit dry mill');
    setSnackbarSeverity('error');
  } finally {
    setOpenSnackbar(true);
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
        field: 'actions',
        headerName: 'Actions',
        width: 180,
        sortable: false,
        renderCell: ({ row }) => (
          <FormControl size="small" fullWidth>
            <Select
              displayEmpty
              defaultValue=""
              onChange={(e) => {
                const action = e.target.value;

                if (action === 'enter') {
                  setSelectedBatch(row);
                  setOpenEnterDialog(true);
                }

                if (action === 'exit') {
                  setSelectedBatch(row);
                  setOpenExitDialog(true);
                }

                if (action === 'weight') {
                  handleWeightClick(row);
                }

                if (action === 'sample') {
                  handleSampleTrackingClick(row);
                }

                e.target.value = ""; // 🔥 important (same as drying page)
              }}
            >
              <MenuItem value="">Actions</MenuItem>

              <MenuItem
                value="enter"
                disabled={row.dryMillEntered}
              >
                Enter Dry Mill
              </MenuItem>

              <MenuItem
                value="exit"
                disabled={!row.dryMillEntered || row.dryMillExited}
              >
                Exit Dry Mill
              </MenuItem>

              <MenuItem value="weight">
                Track Weight
              </MenuItem>

              <MenuItem value="sample">
                Sample Tracking
              </MenuItem>
            </Select>
          </FormControl>
        )
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

  return {
    session,
    openSnackbar, setOpenSnackbar,
    snackbarMessage, setSnackbarMessage,
    snackbarSeverity, setSnackbarSeverity,
    parentBatches, subBatches,
    isLoading, setIsLoading,
    openDialog, setOpenDialog,
    selectedBatch, setSelectedBatch,
    rfid, setRfid,
    isScanning,
    openCompleteDialog, setOpenCompleteDialog,
    openStorageDialog, setOpenStorageDialog,
    dataGridError,
    hasUnsavedChanges, setHasUnsavedChanges,
    openSampleTrackingDialog, setOpenSampleTrackingDialog,
    sampleDateTaken, setSampleDateTaken,
    sampleWeightTaken, setSampleWeightTaken,
    sampleHistory, setSampleHistory,
    openSampleHistoryDialog, setOpenSampleHistoryDialog,
    sampleData,
    openMergeDialog, setOpenMergeDialog,
    selectedBatches, setSelectedBatches,
    mergeNotes, setMergeNotes,
    newBatchNumber,
    totalSelectedWeight, setTotalSelectedWeight,
    openEnterDialog, setOpenEnterDialog,
    openExitDialog, setOpenExitDialog,
    enteredAt, setEnteredAt,
    exitedAt, setExitedAt,
    rfidInputRef,
    logError,
    fetchDryMillData,
    fetchLatestRfid,
    fetchSampleHistory,
    fetchSampleData,
    handleScanRfid,
    handleOpenMergeDialog,
    handleCloseMergeDialog,
    handleMergeBatches,
    handleConfirmComplete,
    handleConfirmStorage,
    handleAddSample,
    handleShowSampleHistory,
    handleRefreshData,
    handleDetailsClick,
    handleSampleTrackingClick,
    handleCloseDialog,
    handleCloseCompleteDialog,
    handleCloseStorageDialog,
    handleCloseSampleTrackingDialog,
    handleCloseSampleHistoryDialog,
    handleCloseSnackbar,
    handleRfidKeyPress,
    handleSubmitEnter,
    handleSubmitExit,
    parentColumns,
    subBatchColumns,
    sampleOverviewColumns,
    getParentBatches,
    getSubBatches,
  };
}
