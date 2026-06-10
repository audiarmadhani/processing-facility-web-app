'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { gbQcApi, emptyFormData, emptyCuppingDraft } from '../constants';
import { isValidCuppingOutcome, legacyOkToCuppingOutcome } from '../utils/cuppingOutcome';
import { generateGbQcPdf } from '../utils/generateGbQcPdf';
import { withPipelineIds } from '../utils/pipelineRowId';

function toDatetimeLocalValue(date = new Date()) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function emptyRoastForm() {
  return {
    roastedAt: toDatetimeLocalValue(),
    roastProfile: '',
    endTemp: '',
    firstCrackMinutes: '',
    firstCrackTemp: '',
    notes: '',
  };
}

function mapCuppingEntry(entry) {
  const cuppedAt = entry.cuppedAt ? String(entry.cuppedAt).slice(0, 10) : '';
  return {
    id: entry.id,
    cuppedAt,
    notes: entry.notes || '',
    cuppingOutcome: isValidCuppingOutcome(entry.cuppingOutcome)
      ? entry.cuppingOutcome
      : legacyOkToCuppingOutcome(entry.okForFurtherProcess),
    cuppedBy: entry.cuppedBy || null,
  };
}

function isCuppingEntryComplete(entry) {
  return (
    !!entry.cuppedAt &&
    typeof entry.notes === 'string' &&
    entry.notes.trim() !== '' &&
    isValidCuppingOutcome(entry.cuppingOutcome)
  );
}

function parseNumericField(source, key, fallback = 0) {
  const value = source?.[key];
  if (value === '' || value === null || value === undefined) return fallback;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildSubmissionPayload({
  formData,
  cuppingEntries,
  loadedQcData,
  isCompleted,
  session,
}) {
  const defectSource = formData?.triage !== undefined && formData?.triage !== ''
    ? formData
    : loadedQcData || formData;

  return {
    kelembapan: 0,
    waterActivity: 0,
    triage: parseNumericField(defectSource, 'triage', 0),
    bijiHitam: parseNumericField(defectSource, 'bijiHitam', 0),
    bijiHitamSebagian: parseNumericField(defectSource, 'bijiHitamSebagian', 0),
    bijiHitamPecah: parseNumericField(defectSource, 'bijiHitamPecah', 0),
    kopiGelondong: parseNumericField(defectSource, 'kopiGelondong', 0),
    bijiCoklat: parseNumericField(defectSource, 'bijiCoklat', 0),
    kulitKopiBesar: parseNumericField(defectSource, 'kulitKopiBesar', 0),
    kulitKopiSedang: parseNumericField(defectSource, 'kulitKopiSedang', 0),
    kulitKopiKecil: parseNumericField(defectSource, 'kulitKopiKecil', 0),
    bijiBerKulitTanduk: parseNumericField(defectSource, 'bijiBerKulitTanduk', 0),
    kulitTandukBesar: parseNumericField(defectSource, 'kulitTandukBesar', 0),
    kulitTandukSedang: parseNumericField(defectSource, 'kulitTandukSedang', 0),
    kulitTandukKecil: parseNumericField(defectSource, 'kulitTandukKecil', 0),
    bijiPecah: parseNumericField(defectSource, 'bijiPecah', 0),
    bijiMuda: parseNumericField(defectSource, 'bijiMuda', 0),
    bijiBerlubangSatu: parseNumericField(defectSource, 'bijiBerlubangSatu', 0),
    bijiBerlubangLebihSatu: parseNumericField(defectSource, 'bijiBerlubangLebihSatu', 0),
    bijiBertutul: parseNumericField(defectSource, 'bijiBertutul', 0),
    rantingBesar: parseNumericField(defectSource, 'rantingBesar', 0),
    rantingSedang: parseNumericField(defectSource, 'rantingSedang', 0),
    rantingKecil: parseNumericField(defectSource, 'rantingKecil', 0),
    totalBobotKotoran: parseNumericField(defectSource, 'totalBobotKotoran', 0),
    seranggaHidup:
      defectSource?.seranggaHidup !== undefined && defectSource?.seranggaHidup !== null
        ? defectSource.seranggaHidup
        : null,
    bijiBauBusuk:
      defectSource?.bijiBauBusuk !== undefined && defectSource?.bijiBauBusuk !== null
        ? defectSource.bijiBauBusuk
        : null,
    cuppingEntries: (cuppingEntries || []).map((entry) => ({
      id: entry.id,
      cuppedAt: entry.cuppedAt,
      notes: entry.notes.trim(),
      cuppingOutcome: entry.cuppingOutcome,
    })),
    cuppedBy: session?.user?.name || session?.user?.email || 'unknown',
    isCompleted,
  };
}

function mapQcDataToForm(legacyQcData) {
  if (!legacyQcData) return emptyFormData();
  return {
    ...emptyFormData(),
    ...legacyQcData,
    cuppingEntries: [],
    cuppingDraft: emptyCuppingDraft(),
  };
}

export function useGbQcStation(session) {
  const webcamRef = useRef(null);
  const [dryingBatches, setDryingBatches] = useState([]);
  const [driedBatches, setDriedBatches] = useState([]);
  const [roastBatches, setRoastBatches] = useState([]);
  const [readyForQcBatches, setReadyForQcBatches] = useState([]);
  const [completedQCBatches, setCompletedQCBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openQcDialog, setOpenQcDialog] = useState(false);
  const [openCuppingDialog, setOpenCuppingDialog] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [openCamera, setOpenCamera] = useState(false);
  const [formData, setFormData] = useState(emptyFormData());
  const [loadedQcData, setLoadedQcData] = useState(null);
  const [cuppingEntriesForValidation, setCuppingEntriesForValidation] = useState([]);
  const [cuppingSaving, setCuppingSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [openRoastDialog, setOpenRoastDialog] = useState(false);
  const [roastTarget, setRoastTarget] = useState(null);
  const [roastHistory, setRoastHistory] = useState([]);
  const [roastedAt, setRoastedAt] = useState(toDatetimeLocalValue());
  const [roastProfile, setRoastProfile] = useState('');
  const [endTemp, setEndTemp] = useState('');
  const [firstCrackMinutes, setFirstCrackMinutes] = useState('');
  const [firstCrackTemp, setFirstCrackTemp] = useState('');
  const [roastNotes, setRoastNotes] = useState('');
  const [readyQcActionAnchorEl, setReadyQcActionAnchorEl] = useState(null);
  const [readyQcActionRow, setReadyQcActionRow] = useState(null);

  const handleReadyQcActionMenuOpen = (event, row) => {
    setReadyQcActionAnchorEl(event.currentTarget);
    setReadyQcActionRow(row);
  };

  const handleReadyQcActionMenuClose = () => {
    setReadyQcActionAnchorEl(null);
    setReadyQcActionRow(null);
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pipelineRes, completedQCRes] = await Promise.all([
        axios.get(gbQcApi('/gb-qc/pipeline-lists')),
        axios.get(gbQcApi('/postproqcfin')),
      ]);
      const { drying = [], dried = [], roast = [], readyForQc = [] } = pipelineRes.data || {};
      setDryingBatches(withPipelineIds(drying));
      setDriedBatches(withPipelineIds(dried));
      setRoastBatches(withPipelineIds(roast));
      setReadyForQcBatches(withPipelineIds(readyForQc));
      setCompletedQCBatches(
        (completedQCRes.data || []).map((row, index) => ({
          ...row,
          id: row.batchNumber || `completed-${index}`,
        }))
      );
    } catch (error) {
      console.error('Error fetching data:', error);
      setSnackbar({ open: true, message: 'Failed to fetch data!', severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const loadCuppingEntries = async (batchNumber, legacyQcData = null) => {
    try {
      const res = await axios.get(gbQcApi(`/gb-qc/cupping/${encodeURIComponent(batchNumber)}`));
      const entries = (res.data || []).map(mapCuppingEntry);
      if (entries.length > 0) {
        return entries;
      }

      if (legacyQcData?.tastingNotes?.trim()) {
        return [
          {
            id: null,
            cuppedAt: legacyQcData.updatedAt
              ? String(legacyQcData.updatedAt).slice(0, 10)
              : new Date().toISOString().slice(0, 10),
            notes: legacyQcData.tastingNotes.trim(),
            cuppingOutcome: legacyOkToCuppingOutcome(legacyQcData.okForFurtherProcess),
            cuppedBy: null,
          },
        ];
      }
      return [];
    } catch (error) {
      console.error('Error fetching cupping entries:', error);
      return [];
    }
  };

  const loadQcRecord = async (batchNumber) => {
    try {
      const res = await axios.get(gbQcApi(`/postproqc/${batchNumber}`));
      return res.data || null;
    } catch (error) {
      console.error('Error fetching QC data for batch:', error);
      return null;
    }
  };

  const handleOpenCupping = async (batch) => {
    setSelectedBatch(batch);
    try {
      const legacyQcData = await loadQcRecord(batch.batchNumber);
      const cuppingEntries = await loadCuppingEntries(batch.batchNumber, legacyQcData);
      setLoadedQcData(legacyQcData);
      setFormData({
        ...emptyFormData(),
        cuppingEntries,
        cuppingDraft: emptyCuppingDraft(),
      });
      setOpenCuppingDialog(true);
    } catch (error) {
      console.error('Error opening cupping dialog:', error);
      setSnackbar({ open: true, message: 'Failed to load cupping data!', severity: 'error' });
    }
  };

  const handleOpenGbQc = async (batch) => {
    setSelectedBatch(batch);
    try {
      const legacyQcData = await loadQcRecord(batch.batchNumber);
      const cuppingEntries = await loadCuppingEntries(batch.batchNumber, legacyQcData);
      setLoadedQcData(legacyQcData);
      setCuppingEntriesForValidation(cuppingEntries);
      setFormData(mapQcDataToForm(legacyQcData));
      setOpenQcDialog(true);
    } catch (error) {
      console.error('Error fetching QC data for batch:', error);
      setSnackbar({ open: true, message: 'Failed to load QC data!', severity: 'error' });
    }
  };

  const fetchRoastHistory = async (batch) => {
    if (!batch?.batchNumber || !batch?.processingType) {
      setRoastHistory([]);
      return;
    }
    try {
      const res = await axios.get(gbQcApi('/gb-qc/roasts'), {
        params: {
          batchNumber: batch.batchNumber,
          processingType: batch.processingType,
        },
      });
      setRoastHistory(res.data || []);
    } catch (error) {
      console.error('Error fetching roast history:', error);
      setRoastHistory([]);
    }
  };

  const resetRoastForm = () => {
    const defaults = emptyRoastForm();
    setRoastedAt(defaults.roastedAt);
    setRoastProfile(defaults.roastProfile);
    setEndTemp(defaults.endTemp);
    setFirstCrackMinutes(defaults.firstCrackMinutes);
    setFirstCrackTemp(defaults.firstCrackTemp);
    setRoastNotes(defaults.notes);
  };

  const handleOpenRecordRoast = async (batch) => {
    setRoastTarget(batch);
    resetRoastForm();
    setOpenRoastDialog(true);
    await fetchRoastHistory(batch);
  };

  const handleCloseRoastDialog = async () => {
    setOpenRoastDialog(false);
    setRoastTarget(null);
    setRoastHistory([]);
    resetRoastForm();
    await fetchData();
  };

  const handleAddRoast = async () => {
    if (!roastTarget) return;
    setIsLoading(true);
    try {
      await axios.post(gbQcApi('/gb-qc/roast'), {
        batchNumber: roastTarget.batchNumber,
        processingType: roastTarget.processingType,
        roastedAt: roastedAt ? new Date(roastedAt).toISOString() : new Date().toISOString(),
        roastProfile: roastProfile.trim(),
        endTemp: parseFloat(endTemp),
        firstCrackMinutes: parseFloat(firstCrackMinutes),
        firstCrackTemp:
          firstCrackTemp !== '' && !Number.isNaN(parseFloat(firstCrackTemp))
            ? parseFloat(firstCrackTemp)
            : null,
        notes: roastNotes.trim() || null,
        roastedBy: session?.user?.name || session?.user?.email || 'unknown',
      });
      setSnackbar({ open: true, message: 'Roast recorded.', severity: 'success' });
      resetRoastForm();
      await fetchRoastHistory(roastTarget);
      await fetchData();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to record roast';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseCuppingDialog = () => {
    setOpenCuppingDialog(false);
    setSelectedBatch(null);
    setLoadedQcData(null);
    setFormData(emptyFormData());
  };

  const handleCloseQcDialog = () => {
    setOpenQcDialog(false);
    setSelectedBatch(null);
    setLoadedQcData(null);
    setCuppingEntriesForValidation([]);
    setFormData(emptyFormData());
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'seranggaHidup' || name === 'bijiBauBusuk') {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value === '' ? null : value === 'true',
      }));
      return;
    }

    if (name.startsWith('cuppingDraft.')) {
      const field = name.replace('cuppingDraft.', '');
      if (field === 'cuppingOutcome') {
        setFormData((prevData) => ({
          ...prevData,
          cuppingDraft: {
            ...prevData.cuppingDraft,
            cuppingOutcome: value === '' ? null : value,
          },
        }));
      } else {
        setFormData((prevData) => ({
          ...prevData,
          cuppingDraft: {
            ...prevData.cuppingDraft,
            [field]: value,
          },
        }));
      }
      return;
    }

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleEditCuppingEntry = (index) => {
    const entry = formData.cuppingEntries[index];
    if (!entry) return;

    setFormData((prevData) => ({
      ...prevData,
      cuppingDraft: {
        cuppedAt: entry.cuppedAt,
        notes: entry.notes,
        cuppingOutcome: entry.cuppingOutcome,
        editingIndex: index,
      },
    }));
  };

  const handleCancelCuppingEdit = () => {
    setFormData((prevData) => ({
      ...prevData,
      cuppingDraft: emptyCuppingDraft(),
    }));
  };

  const handleAddCuppingEntry = () => {
    const draft = formData.cuppingDraft;
    if (!isCuppingEntryComplete(draft)) {
      setSnackbar({
        open: true,
        message: 'Fill date cupped, notes, and outcome before saving the entry.',
        severity: 'error',
      });
      return;
    }

    const editingIndex = draft.editingIndex;
    const updatedEntry = {
      cuppedAt: draft.cuppedAt,
      notes: draft.notes.trim(),
      cuppingOutcome: draft.cuppingOutcome,
      cuppedBy: session?.user?.name || session?.user?.email || 'unknown',
    };

    setFormData((prevData) => {
      if (editingIndex !== null && editingIndex !== undefined) {
        const existing = prevData.cuppingEntries[editingIndex];
        if (!existing) {
          return { ...prevData, cuppingDraft: emptyCuppingDraft() };
        }

        return {
          ...prevData,
          cuppingEntries: prevData.cuppingEntries.map((entry, index) =>
            index === editingIndex
              ? {
                  ...existing,
                  ...updatedEntry,
                  id: existing.id,
                  cuppedBy: existing.cuppedBy || updatedEntry.cuppedBy,
                }
              : entry
          ),
          cuppingDraft: emptyCuppingDraft(),
        };
      }

      return {
        ...prevData,
        cuppingEntries: [
          ...prevData.cuppingEntries,
          {
            id: null,
            ...updatedEntry,
          },
        ],
        cuppingDraft: emptyCuppingDraft(),
      };
    });
  };

  const handleRemoveCuppingEntry = (index) => {
    setFormData((prevData) => {
      const wasEditing = prevData.cuppingDraft?.editingIndex === index;
      return {
        ...prevData,
        cuppingEntries: prevData.cuppingEntries.filter((_, i) => i !== index),
        cuppingDraft: wasEditing ? emptyCuppingDraft() : prevData.cuppingDraft,
      };
    });
  };

  const isCuppingComplete = (entries) =>
    entries.length >= 1 && entries.every(isCuppingEntryComplete);

  const isFormComplete = () => {
    const cuppingComplete = isCuppingComplete(cuppingEntriesForValidation);

    return (
      cuppingComplete &&
      formData.triage !== '' &&
      formData.bijiHitam !== '' &&
      formData.bijiHitamSebagian !== '' &&
      formData.bijiHitamPecah !== '' &&
      formData.kopiGelondong !== '' &&
      formData.bijiCoklat !== '' &&
      formData.kulitKopiBesar !== '' &&
      formData.kulitKopiSedang !== '' &&
      formData.kulitKopiKecil !== '' &&
      formData.bijiBerKulitTanduk !== '' &&
      formData.kulitTandukBesar !== '' &&
      formData.kulitTandukSedang !== '' &&
      formData.kulitTandukKecil !== '' &&
      formData.bijiPecah !== '' &&
      formData.bijiMuda !== '' &&
      formData.bijiBerlubangSatu !== '' &&
      formData.bijiBerlubangLebihSatu !== '' &&
      formData.bijiBertutul !== '' &&
      formData.rantingBesar !== '' &&
      formData.rantingSedang !== '' &&
      formData.rantingKecil !== '' &&
      formData.totalBobotKotoran !== '' &&
      formData.seranggaHidup !== null &&
      formData.bijiBauBusuk !== null
    );
  };

  const postQcData = async ({ cuppingEntries, isCompleted, formOverride = null }) => {
    const submissionData = buildSubmissionPayload({
      formData: formOverride || formData,
      cuppingEntries,
      loadedQcData,
      isCompleted,
      session,
    });

    await axios.post(gbQcApi('/postproqc'), {
      batchNumber: selectedBatch.batchNumber,
      ...submissionData,
    });
  };

  const handleSaveCupping = async () => {
    if (!selectedBatch) return;
    if (!isCuppingComplete(formData.cuppingEntries)) {
      setSnackbar({
        open: true,
        message: 'Add at least one complete cupping entry before saving.',
        severity: 'error',
      });
      return;
    }

    setCuppingSaving(true);
    try {
      await postQcData({
        cuppingEntries: formData.cuppingEntries,
        isCompleted: false,
        formOverride: emptyFormData(),
      });
      setSnackbar({ open: true, message: 'Cupping saved successfully!', severity: 'success' });
      await fetchData();
      handleCloseCuppingDialog();
    } catch (error) {
      console.error('Error saving cupping data:', error);
      setSnackbar({ open: true, message: 'Failed to save cupping data!', severity: 'error' });
    } finally {
      setCuppingSaving(false);
    }
  };

  const handleSaveQC = async (isCompleted) => {
    if (!selectedBatch) return;

    try {
      const latestCupping = await loadCuppingEntries(selectedBatch.batchNumber, loadedQcData);
      if (isCompleted) {
        setCuppingEntriesForValidation(latestCupping);
        if (!isCuppingComplete(latestCupping)) {
          setSnackbar({
            open: true,
            message: 'Complete at least one cupping session before completing GB QC.',
            severity: 'error',
          });
          return;
        }
      }

      await postQcData({
        cuppingEntries: latestCupping,
        isCompleted,
      });

      setSnackbar({
        open: true,
        message: isCompleted ? 'QC completed successfully!' : 'QC data saved successfully!',
        severity: 'success',
      });
      await fetchData();

      if (isCompleted) {
        handleCloseQcDialog();
      } else {
        const refreshedQc = await loadQcRecord(selectedBatch.batchNumber);
        setLoadedQcData(refreshedQc);
        setCuppingEntriesForValidation(latestCupping);
      }
    } catch (error) {
      console.error('Error saving QC data:', error);
      setSnackbar({ open: true, message: 'Failed to save QC data!', severity: 'error' });
    }
  };

  const handleCapture = async () => {
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      const blob = await fetch(imageSrc).then((res) => res.blob());
      const file = new File([blob], `qc_${Date.now()}.jpg`, { type: 'image/jpeg' });

      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('batchNumber', selectedBatch.batchNumber);
      formDataUpload.append('module', 'GB-QC');

      const uploadRes = await axios.post(gbQcApi('/upload-image'), formDataUpload);
      const imageUrl = uploadRes.data.url;

      await axios.post(gbQcApi('/postproqc/image'), {
        batchNumber: selectedBatch.batchNumber,
        imageUrl,
      });

      const link = document.createElement('a');
      link.href = imageSrc;
      link.download = `QC_${selectedBatch.batchNumber}_${Date.now()}.jpg`;
      link.click();

      setSnackbar({
        open: true,
        message: 'Image captured & uploaded successfully',
        severity: 'success',
      });
      setOpenCamera(false);
    } catch (err) {
      console.error('Capture error:', err);
      setSnackbar({
        open: true,
        message: 'Failed to capture/upload image',
        severity: 'error',
      });
    }
  };

  const handleExportToPDF = (row) => {
    generateGbQcPdf(row, session?.user?.name || 'User');
  };

  return {
    webcamRef,
    dryingBatches,
    driedBatches,
    roastBatches,
    readyForQcBatches,
    completedQCBatches,
    isLoading,
    openQcDialog,
    openCuppingDialog,
    selectedBatch,
    openCamera,
    setOpenCamera,
    formData,
    cuppingSaving,
    snackbar,
    setSnackbar,
    fetchData,
    handleOpenCupping,
    handleOpenGbQc,
    handleOpenRecordRoast,
    handleCloseRoastDialog,
    handleAddRoast,
    openRoastDialog,
    roastTarget,
    roastHistory,
    roastedAt,
    setRoastedAt,
    roastProfile,
    setRoastProfile,
    endTemp,
    setEndTemp,
    firstCrackMinutes,
    setFirstCrackMinutes,
    firstCrackTemp,
    setFirstCrackTemp,
    roastNotes,
    setRoastNotes,
    handleCloseCuppingDialog,
    handleCloseQcDialog,
    handleFormChange,
    handleEditCuppingEntry,
    handleCancelCuppingEdit,
    handleAddCuppingEntry,
    handleRemoveCuppingEntry,
    isFormComplete,
    handleSaveCupping,
    handleSaveQC,
    handleCapture,
    handleExportToPDF,
    readyQcActionAnchorEl,
    readyQcActionRow,
    handleReadyQcActionMenuOpen,
    handleReadyQcActionMenuClose,
  };
}
