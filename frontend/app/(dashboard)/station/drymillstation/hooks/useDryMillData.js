'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { Box, Button, Checkbox, Chip, Menu, MenuItem } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import {
  API_BASE_URL,
  batchUniqueId,
  canSelectForMerge,
  isActiveDryMillBatch,
  indexDryingMeasurementsByBatch,
  mapParentBatch,
  mapSubBatch,
  pickLatestMoistureAcrossBatches,
  statusFromTrackWeightRows,
} from '../utils/drymillUtils';
import { generateDryMillOrderSheetFromRow } from '../utils/exportDryMillOrderSheet';

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
  const [actionAnchorEl, setActionAnchorEl] = useState(null);
  const [selectedActionRow, setSelectedActionRow] = useState(null);

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
  const [processStepStatus, setProcessStepStatus] = useState({});
  const rfidInputRef = useRef(null);

  const fetchProcessStatuses = useCallback(async (batches) => {
    const eligible = batches.filter((b) => b.dryMillEntered && !b.dryMillExited);
    if (eligible.length === 0) {
      setProcessStepStatus({});
      return;
    }

    const entries = await Promise.all(
      eligible.map(async (b) => {
        try {
          const res = await axios.get(
            `${API_BASE_URL}/api/drymill/track-weight/${b.batchNumber}/${b.producer}`,
            { params: { processingType: b.processingType } }
          );
          return [b.id, statusFromTrackWeightRows(res.data)];
        } catch {
          return [
            b.id,
            { huller: false, suton: false, sizer: false, handpicking: false },
          ];
        }
      })
    );
    setProcessStepStatus(Object.fromEntries(entries));
  }, []);

  const logError = (message, error) => {
    setErrorLog((prev) => [
      ...prev,
      { message, error: error?.message || "Unknown error", timestamp: new Date() },
    ]);
    setDataGridError(message);
  };

  const enrichParentBatchesWithLatestMoisture = useCallback(async (batches) => {
    if (!batches.length) return batches;

    const mergeKeysByBatch = {};
    const mergeCandidates = batches.filter((b) => b.batchNumber?.endsWith('-MB'));

    await Promise.all(
      mergeCandidates.map(async (b) => {
        try {
          const res = await axios.get(
            `${API_BASE_URL}/api/dry-mill/batch-merges/${encodeURIComponent(b.batchNumber)}`,
            { timeout: 15000 }
          );
          if (res.data?.original_batch_numbers?.length) {
            mergeKeysByBatch[b.batchNumber] = res.data.original_batch_numbers;
          }
        } catch (err) {
          if (err.response?.status !== 404) {
            console.warn('Failed to fetch dry mill merge for moisture', b.batchNumber, err);
          }
        }
      })
    );

    const batchNumberSet = new Set();
    batches.forEach((b) => {
      const keys = mergeKeysByBatch[b.batchNumber] || [b.batchNumber];
      keys.forEach((k) => batchNumberSet.add(k));
    });

    let measurements = [];
    try {
      const res = await axios.get(`${API_BASE_URL}/api/drying-measurements/latest`, {
        params: { batchNumbers: [...batchNumberSet].join(',') },
        timeout: 15000,
      });
      measurements = res.data || [];
    } catch (err) {
      console.warn('Failed to fetch latest moisture for dry mill', err);
      return batches.map((b) => ({ ...b, latestMoisture: null }));
    }

    const byBatch = indexDryingMeasurementsByBatch(measurements);
    return batches.map((b) => {
      const keys = mergeKeysByBatch[b.batchNumber] || [b.batchNumber];
      return {
        ...b,
        latestMoisture: pickLatestMoistureAcrossBatches(keys, byBatch),
      };
    });
  }, []);

  const fetchDryMillData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/dry-mill-data`);
      const data = response.data;

      let parentBatchesData = data.map((batch) => mapParentBatch(batch));
      parentBatchesData = await enrichParentBatchesWithLatestMoisture(parentBatchesData);

      const subBatchesData = data
        .filter(
          (batch) =>
            (batch.quality &&
              batch.quality !== 'N/A' &&
              parseInt(batch.totalBags, 10) > 0) ||
            (batch.parentBatchNumber &&
              batch.parentBatchNumber !== batch.batchNumber)
        )
        .map((batch) => mapSubBatch(batch));

      setParentBatches(parentBatchesData);
      setSubBatches(subBatchesData);
      await fetchProcessStatuses(parentBatchesData);
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
  }, [fetchProcessStatuses, enrichParentBatchesWithLatestMoisture]);

  const fetchLatestRfid = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/get-rfid`);
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
        `${API_BASE_URL}/api/dry-mill/${batchNumber}/sample-history`
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
      const response = await axios.get(`${API_BASE_URL}/api/sample-data`);
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
        const response = await axios.post(`${API_BASE_URL}/api/scan-rfid`, {
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

  const updateSelectionWeight = useCallback(
    (batchIds) => {
      const selectedBatchDetails = parentBatches.filter((b) =>
        batchIds.includes(batchUniqueId(b))
      );
      setTotalSelectedWeight(
        selectedBatchDetails.reduce(
          (sum, b) => sum + parseFloat(b.drying_weight || 0),
          0
        )
      );
    },
    [parentBatches]
  );

  const handleToggleBatchSelection = useCallback(
    (row, checked) => {
      if (checked && !canSelectForMerge(row)) {
        setSnackbarMessage(
          'Only batches in dry mill (entered, not exited, not stored, not merged) can be selected for merge.'
        );
        setSnackbarSeverity('warning');
        setOpenSnackbar(true);
        return;
      }
      const uniqueId = batchUniqueId(row);
      setSelectedBatches((prev) => {
        const newSelected = checked
          ? [...prev, uniqueId]
          : prev.filter((id) => id !== uniqueId);
        updateSelectionWeight(newSelected);
        return newSelected;
      });
    },
    [updateSelectionWeight]
  );

  const handleOpenMergeDialog = async () => {
    if (!['admin', 'manager'].includes(session.user.role)) {
      setSnackbarMessage('Only admins or managers can merge batches.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }
    if (selectedBatches.length < 2) {
      setSnackbarMessage('Select at least two batches to merge.');
      setSnackbarSeverity('warning');
      setOpenSnackbar(true);
      return;
    }
    const details = parentBatches.filter((b) => selectedBatches.includes(batchUniqueId(b)));
    if (
      !details.every(
        (b) =>
          b.producer === details[0].producer &&
          b.processingType === details[0].processingType
      )
    ) {
      setSnackbarMessage(
        'All selected batches must have the same producer and processing type.'
      );
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/api/new-batch-number`);
      setNewBatchNumber(response.data.newBatchNumber);
      setOpenMergeDialog(true);
    } catch (error) {
      logError("Failed to fetch new batch number for merging.", error);
      setSnackbarMessage("Failed to fetch new batch number for merging.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const clearMergeSelection = () => {
    setSelectedBatches([]);
    setTotalSelectedWeight(0);
    setMergeNotes('');
    setNewBatchNumber('');
  };

  const handleCloseMergeDialog = () => {
    setOpenMergeDialog(false);
    setMergeNotes('');
    setNewBatchNumber('');
  };

  const handleMergeBatches = async () => {
    if (selectedBatches.length < 2) {
      setSnackbarMessage("Please select at least two batches to merge.");
      setSnackbarSeverity("warning");
      setOpenSnackbar(true);
      return;
    }
    const selectedBatchDetails = parentBatches.filter((b) =>
      selectedBatches.includes(batchUniqueId(b))
    );
    if (
      !selectedBatchDetails.every(
        (b) =>
          b.producer === selectedBatchDetails[0].producer &&
          b.processingType === selectedBatchDetails[0].processingType
      )
    ) {
      setSnackbarMessage(
        'All selected batches must have the same producer and processing type.'
      );
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }
    if (!selectedBatchDetails.every((b) => canSelectForMerge(b))) {
      setSnackbarMessage(
        'Selected batches must be entered in dry mill, not exited, and not already merged away.'
      );
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }
    try {
      const response = await axios.post(`${API_BASE_URL}/api/dry-mill/merge`, {
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
      clearMergeSelection();
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
          `${API_BASE_URL}/api/dry-mill/${selectedBatch.batchNumber}/complete`,
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
          `${API_BASE_URL}/api/warehouse/scan`,
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
        `${API_BASE_URL}/api/dry-mill/${selectedBatch.batchNumber}/add-sample`,
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

  const handleProcessClick = useCallback((batch) => {
    setSelectedBatch(batch);
    setHasUnsavedChanges(false);
    setOpenDialog(true);
  }, []);

  const handleDetailsClick = handleProcessClick;

  const handleProcessSaved = useCallback((batchId, rows) => {
    setProcessStepStatus((prev) => ({
      ...prev,
      [batchId]: statusFromTrackWeightRows(rows),
    }));
  }, []);

  const handleSampleTrackingClick = useCallback((batch) => {
    setSelectedBatch(batch);
    setSampleDateTaken(new Date().toISOString().split("T")[0]);
    setSampleWeightTaken("");
    setSampleHistory([]);
    fetchSampleHistory(batch.batchNumber);
    setOpenSampleTrackingDialog(true);
  }, [fetchSampleHistory]);

  const handleActionMenuOpen = useCallback((event, row) => {
    setActionAnchorEl(event.currentTarget);
    setSelectedActionRow(row);
  }, []);

  const handleActionMenuClose = useCallback(() => {
    setActionAnchorEl(null);
    setSelectedActionRow(null);
  }, []);

  const handleOpenEnterFromMenu = useCallback(
    (row) => {
      const targetRow = row || selectedActionRow;
      handleActionMenuClose();
      if (!targetRow) return;
      setSelectedBatch(targetRow);
      setEnteredAt('');
      setOpenEnterDialog(true);
    },
    [selectedActionRow, handleActionMenuClose]
  );

  const handleOpenExitFromMenu = useCallback(
    (row) => {
      const targetRow = row || selectedActionRow;
      handleActionMenuClose();
      if (!targetRow) return;
      setSelectedBatch(targetRow);
      setExitedAt('');
      setOpenExitDialog(true);
    },
    [selectedActionRow, handleActionMenuClose]
  );

  const handleProcessFromMenu = useCallback(
    (row) => {
      const targetRow = row || selectedActionRow;
      handleActionMenuClose();
      if (!targetRow) return;
      handleProcessClick(targetRow);
    },
    [selectedActionRow, handleActionMenuClose, handleProcessClick]
  );

  const handleSampleFromMenu = useCallback(
    (row) => {
      const targetRow = row || selectedActionRow;
      handleActionMenuClose();
      if (!targetRow) return;
      handleSampleTrackingClick(targetRow);
    },
    [selectedActionRow, handleActionMenuClose, handleSampleTrackingClick]
  );

  const handleGenerateDryMillOrderSheet = useCallback(
    async (row) => {
      const targetRow = row || selectedActionRow;
      handleActionMenuClose();
      if (!targetRow?.batchNumber) return;

      let batchNumbers = [targetRow.batchNumber];
      let dryingWeight = targetRow.drying_weight;
      let latestMoisture = targetRow.latestMoisture;

      try {
        const mergeRes = await axios.get(
          `${API_BASE_URL}/api/dry-mill/batch-merges/${encodeURIComponent(targetRow.batchNumber)}`,
          { timeout: 15000 }
        );
        if (mergeRes.data?.original_batch_numbers?.length) {
          batchNumbers = mergeRes.data.original_batch_numbers;
        }
        if (mergeRes.data?.total_weight != null && mergeRes.data.total_weight !== '') {
          dryingWeight = mergeRes.data.total_weight;
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error('Failed to fetch dry mill merge data:', err);
          setSnackbarMessage(
            err.response?.data?.error || 'Failed to load merge data for order sheet.'
          );
          setSnackbarSeverity('error');
          setOpenSnackbar(true);
          return;
        }
      }

      try {
        const moistRes = await axios.get(`${API_BASE_URL}/api/drying-measurements/latest`, {
          params: { batchNumbers: batchNumbers.join(',') },
          timeout: 15000,
        });
        const byBatch = indexDryingMeasurementsByBatch(moistRes.data || []);
        latestMoisture = pickLatestMoistureAcrossBatches(batchNumbers, byBatch);
      } catch (err) {
        console.warn('Failed to fetch latest moisture for order sheet', err);
      }

      try {
        generateDryMillOrderSheetFromRow(targetRow, {
          batchNumbers,
          dryingWeight,
          latestMoisture,
        });
        setSnackbarMessage(`Order sheet downloaded for batch ${targetRow.batchNumber}.`);
        setSnackbarSeverity('success');
      } catch (error) {
        console.error('Generate dry mill order sheet failed:', error);
        setSnackbarMessage(error.message || 'Failed to generate order sheet PDF.');
        setSnackbarSeverity('error');
      } finally {
        setOpenSnackbar(true);
      }
    },
    [selectedActionRow, handleActionMenuClose]
  );

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
      `${API_BASE_URL}/api/dry-mill/${selectedBatch.batchNumber}/enter`,
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
      `${API_BASE_URL}/api/dry-mill/${selectedBatch.batchNumber}/exit`,
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

  const mergeSelectedDetails = useMemo(
    () => parentBatches.filter((b) => selectedBatches.includes(batchUniqueId(b))),
    [parentBatches, selectedBatches]
  );

  const renderProcessChips = (row) => {
    const st = processStepStatus[row.id];
    if (!st || !row.dryMillEntered) return null;
    const chips = [];
    if (st.huller) chips.push({ label: 'Huller ✓', color: 'success' });
    if (st.suton) chips.push({ label: 'Suton ✓', color: 'success' });
    if (st.sizer) chips.push({ label: 'Sizer ✓', color: 'success' });
    if (st.handpicking) chips.push({ label: 'Handpick ✓', color: 'success' });
    if (chips.length === 0) {
      return (
        <Chip label="Not started" size="small" variant="outlined" />
      );
    }
    return (
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
        {chips.map((c) => (
          <Chip key={c.label} label={c.label} size="small" color={c.color} />
        ))}
      </Box>
    );
  };

  const parentColumns = useMemo(
    () => [
      {
        field: 'select',
        headerName: 'Select',
        width: 90,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: ({ row }) => (
          <Checkbox
            size="small"
            checked={selectedBatches.includes(batchUniqueId(row))}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation();
              handleToggleBatchSelection(row, e.target.checked);
            }}
          />
        ),
      },
      { field: "batchNumber", headerName: "Batch Number", width: 160 },
      { field: "lotNumber", headerName: "Lot Number", width: 180 },
      { field: "referenceNumber", headerName: "Ref Number", width: 180 },
      { field: "processingType", headerName: "Processing Type", width: 180 },
      { field: "producerLabel", headerName: "Producer", width: 120 },
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
        field: 'processProgress',
        headerName: 'Process',
        width: 220,
        sortable: false,
        renderCell: ({ row }) => renderProcessChips(row),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 150,
        sortable: false,
        renderCell: ({ row }) => (
          <Box
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Button
              variant="contained"
              size="small"
              endIcon={<ArrowDropDownIcon />}
              onClick={(event) => handleActionMenuOpen(event, row)}
              disabled={isLoading}
            >
              Action
            </Button>
            <Menu
              anchorEl={actionAnchorEl}
              open={Boolean(actionAnchorEl) && selectedActionRow?.id === row.id}
              onClose={handleActionMenuClose}
            >
              <MenuItem onClick={() => handleProcessFromMenu(row)} disabled={isLoading}>
                Process
              </MenuItem>
              <MenuItem
                onClick={() => handleOpenEnterFromMenu(row)}
                disabled={row.dryMillEntered || isLoading}
              >
                Enter
              </MenuItem>
              <MenuItem
                onClick={() => handleOpenExitFromMenu(row)}
                disabled={!row.dryMillEntered || row.dryMillExited || isLoading}
              >
                Exit
              </MenuItem>
              <MenuItem onClick={() => handleSampleFromMenu(row)} disabled={isLoading}>
                Sample
              </MenuItem>
              <MenuItem onClick={() => handleGenerateDryMillOrderSheet(row)}>
                Generate order sheet
              </MenuItem>
            </Menu>
          </Box>
        ),
      },
      { field: "farmerName", headerName: "Farmer Name", width: 160 },
      { field: "farmVarieties", headerName: "Farm Varieties", width: 160 },
      { field: "type", headerName: "Type", width: 120 },
      { field: "dryMillEntered", headerName: "Dry Mill Entered", width: 150 },
      { field: "dryMillExited", headerName: "Dry Mill Exited", width: 150 },
      { field: "cherry_weight", headerName: "Cherry Weight (kg)", width: 160 },
      { field: "drying_weight", headerName: "Drying Weight (kg)", width: 160 },
      {
        field: 'latestMoisture',
        headerName: 'Latest Moisture (%)',
        width: 160,
        renderCell: ({ value }) =>
          value != null && value !== '' ? `${parseFloat(value).toFixed(1)}%` : '—',
      },
      { field: "productLine", headerName: "Product Line", width: 160 },
      { field: "batchType", headerName: "Batch Type", width: 120 },
      { field: "totalBags", headerName: "Total Bags", width: 120 },
      { field: "notes", headerName: "Notes", width: 180 },
    ],
    [
      isLoading,
      selectedBatches,
      processStepStatus,
      actionAnchorEl,
      selectedActionRow,
      handleActionMenuOpen,
      handleActionMenuClose,
      handleProcessFromMenu,
      handleOpenEnterFromMenu,
      handleOpenExitFromMenu,
      handleSampleFromMenu,
      handleGenerateDryMillOrderSheet,
      handleToggleBatchSelection,
    ]
  );

  const subBatchColumns = useMemo(
    () => [
      { field: "batchNumber", headerName: "Batch Number", width: 180 },
      { field: "lotNumber", headerName: "Lot Number", width: 180 },
      { field: "referenceNumber", headerName: "Ref Number", width: 180 },
      { field: "parentBatchNumber", headerName: "Parent Batch", width: 160 },
      { field: "producerLabel", headerName: "Producer", width: 120 },
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

  const sortedParentBatches = useMemo(
    () =>
      [...parentBatches]
        .filter(isActiveDryMillBatch)
        .sort(
          (a, b) =>
            new Date(a.dryMillEntered || 0) - new Date(b.dryMillEntered || 0) ||
            a.producer.localeCompare(b.producer) ||
            a.processingType.localeCompare(b.processingType)
        ),
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
    selectedBatches,
    sortedParentBatches,
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
    handleProcessClick,
    handleDetailsClick,
    handleProcessSaved,
    handleSampleTrackingClick,
    mergeSelectedDetails,
    processStepStatus,
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
    getSubBatches,
  };
}
