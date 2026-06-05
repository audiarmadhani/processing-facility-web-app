'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { gbQcApi, emptyFormData, emptyCuppingDraft } from '../constants';
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
    notes: '',
  };
}

function mapCuppingEntry(entry) {
  const cuppedAt = entry.cuppedAt
    ? String(entry.cuppedAt).slice(0, 10)
    : '';
  return {
    id: entry.id,
    cuppedAt,
    notes: entry.notes || '',
    okForFurtherProcess: entry.okForFurtherProcess ?? null,
    cuppedBy: entry.cuppedBy || null,
  };
}

function isCuppingEntryComplete(entry) {
  return (
    !!entry.cuppedAt &&
    typeof entry.notes === 'string' &&
    entry.notes.trim() !== '' &&
    entry.okForFurtherProcess !== null
  );
}

export function useGbQcStation(session) {
  const webcamRef = useRef(null);
  const [dryingBatches, setDryingBatches] = useState([]);
  const [driedBatches, setDriedBatches] = useState([]);
  const [roastBatches, setRoastBatches] = useState([]);
  const [readyForQcBatches, setReadyForQcBatches] = useState([]);
  const [completedQCBatches, setCompletedQCBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [openCamera, setOpenCamera] = useState(false);
  const [formData, setFormData] = useState(emptyFormData());
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [openRoastDialog, setOpenRoastDialog] = useState(false);
  const [roastTarget, setRoastTarget] = useState(null);
  const [roastHistory, setRoastHistory] = useState([]);
  const [roastedAt, setRoastedAt] = useState(toDatetimeLocalValue());
  const [roastProfile, setRoastProfile] = useState('');
  const [endTemp, setEndTemp] = useState('');
  const [firstCrackMinutes, setFirstCrackMinutes] = useState('');
  const [roastNotes, setRoastNotes] = useState('');
  const [startQcAfterRoast, setStartQcAfterRoast] = useState(true);

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
            okForFurtherProcess: legacyQcData.okForFurtherProcess ?? null,
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

  const handleStartQC = async (batch) => {
    setSelectedBatch(batch);
    try {
      const res = await axios.get(gbQcApi(`/postproqc/${batch.batchNumber}`));
      const legacyQcData = res.data || null;
      const cuppingEntries = await loadCuppingEntries(batch.batchNumber, legacyQcData);

      if (legacyQcData) {
        setFormData({
          ...emptyFormData(),
          ...legacyQcData,
          cuppingEntries,
          cuppingDraft: emptyCuppingDraft(),
        });
      } else {
        setFormData({
          ...emptyFormData(),
          cuppingEntries,
        });
      }
      setOpenDialog(true);
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
    setRoastNotes(defaults.notes);
  };

  const handleOpenRecordRoast = async (batch) => {
    setRoastTarget(batch);
    resetRoastForm();
    setStartQcAfterRoast(true);
    setOpenRoastDialog(true);
    await fetchRoastHistory(batch);
  };

  const handleCloseRoastDialog = async () => {
    const shouldOpenQc = startQcAfterRoast;
    const target = roastTarget;
    setOpenRoastDialog(false);
    setRoastTarget(null);
    setRoastHistory([]);
    resetRoastForm();
    await fetchData();
    if (shouldOpenQc && target) {
      await handleStartQC(target);
    }
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

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBatch(null);
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
      if (field === 'okForFurtherProcess') {
        setFormData((prevData) => ({
          ...prevData,
          cuppingDraft: {
            ...prevData.cuppingDraft,
            okForFurtherProcess: value === '' ? null : value === 'true',
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

  const handleAddCuppingEntry = () => {
    const draft = formData.cuppingDraft;
    if (!isCuppingEntryComplete(draft)) {
      setSnackbar({
        open: true,
        message: 'Fill date cupped, notes, and OK / Not OK before adding.',
        severity: 'error',
      });
      return;
    }

    setFormData((prevData) => ({
      ...prevData,
      cuppingEntries: [
        ...prevData.cuppingEntries,
        {
          id: null,
          cuppedAt: draft.cuppedAt,
          notes: draft.notes.trim(),
          okForFurtherProcess: draft.okForFurtherProcess,
          cuppedBy: session?.user?.name || session?.user?.email || 'unknown',
        },
      ],
      cuppingDraft: emptyCuppingDraft(),
    }));
  };

  const handleRemoveCuppingEntry = (index) => {
    setFormData((prevData) => ({
      ...prevData,
      cuppingEntries: prevData.cuppingEntries.filter((_, i) => i !== index),
    }));
  };

  const isFormComplete = () => {
    const cuppingComplete =
      formData.cuppingEntries.length >= 1 &&
      formData.cuppingEntries.every(isCuppingEntryComplete);

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

  const handleSaveQC = async (isCompleted) => {
    try {
      const submissionData = {
        kelembapan: 0,
        waterActivity: 0,
        triage: formData.triage === '' ? 0 : parseFloat(formData.triage),
        bijiHitam: formData.bijiHitam === '' ? 0 : parseFloat(formData.bijiHitam),
        bijiHitamSebagian: formData.bijiHitamSebagian === '' ? 0 : parseFloat(formData.bijiHitamSebagian),
        bijiHitamPecah: formData.bijiHitamPecah === '' ? 0 : parseFloat(formData.bijiHitamPecah),
        kopiGelondong: formData.kopiGelondong === '' ? 0 : parseFloat(formData.kopiGelondong),
        bijiCoklat: formData.bijiCoklat === '' ? 0 : parseFloat(formData.bijiCoklat),
        kulitKopiBesar: formData.kulitKopiBesar === '' ? 0 : parseFloat(formData.kulitKopiBesar),
        kulitKopiSedang: formData.kulitKopiSedang === '' ? 0 : parseFloat(formData.kulitKopiSedang),
        kulitKopiKecil: formData.kulitKopiKecil === '' ? 0 : parseFloat(formData.kulitKopiKecil),
        bijiBerKulitTanduk: formData.bijiBerKulitTanduk === '' ? 0 : parseFloat(formData.bijiBerKulitTanduk),
        kulitTandukBesar: formData.kulitTandukBesar === '' ? 0 : parseFloat(formData.kulitTandukBesar),
        kulitTandukSedang: formData.kulitTandukSedang === '' ? 0 : parseFloat(formData.kulitTandukSedang),
        kulitTandukKecil: formData.kulitTandukKecil === '' ? 0 : parseFloat(formData.kulitTandukKecil),
        bijiPecah: formData.bijiPecah === '' ? 0 : parseFloat(formData.bijiPecah),
        bijiMuda: formData.bijiMuda === '' ? 0 : parseFloat(formData.bijiMuda),
        bijiBerlubangSatu: formData.bijiBerlubangSatu === '' ? 0 : parseFloat(formData.bijiBerlubangSatu),
        bijiBerlubangLebihSatu:
          formData.bijiBerlubangLebihSatu === '' ? 0 : parseFloat(formData.bijiBerlubangLebihSatu),
        bijiBertutul: formData.bijiBertutul === '' ? 0 : parseFloat(formData.bijiBertutul),
        rantingBesar: formData.rantingBesar === '' ? 0 : parseFloat(formData.rantingBesar),
        rantingSedang: formData.rantingSedang === '' ? 0 : parseFloat(formData.rantingSedang),
        rantingKecil: formData.rantingKecil === '' ? 0 : parseFloat(formData.rantingKecil),
        totalBobotKotoran: formData.totalBobotKotoran === '' ? 0 : parseFloat(formData.totalBobotKotoran),
        seranggaHidup: formData.seranggaHidup,
        bijiBauBusuk: formData.bijiBauBusuk,
        cuppingEntries: formData.cuppingEntries.map((entry) => ({
          id: entry.id,
          cuppedAt: entry.cuppedAt,
          notes: entry.notes.trim(),
          okForFurtherProcess: entry.okForFurtherProcess,
        })),
        cuppedBy: session?.user?.name || session?.user?.email || 'unknown',
      };

      await axios.post(gbQcApi('/postproqc'), {
        batchNumber: selectedBatch.batchNumber,
        ...submissionData,
        isCompleted,
      });
      setSnackbar({
        open: true,
        message: isCompleted ? 'QC completed successfully!' : 'QC data saved successfully!',
        severity: 'success',
      });
      fetchData();
      if (isCompleted) {
        handleCloseDialog();
      } else {
        const cuppingEntries = await loadCuppingEntries(selectedBatch.batchNumber);
        setFormData((prev) => ({
          ...prev,
          cuppingEntries,
          cuppingDraft: emptyCuppingDraft(),
        }));
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
    openDialog,
    selectedBatch,
    openCamera,
    setOpenCamera,
    formData,
    snackbar,
    setSnackbar,
    fetchData,
    handleStartQC,
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
    roastNotes,
    setRoastNotes,
    startQcAfterRoast,
    setStartQcAfterRoast,
    handleCloseDialog,
    handleFormChange,
    handleAddCuppingEntry,
    handleRemoveCuppingEntry,
    isFormComplete,
    handleSaveQC,
    handleCapture,
    handleExportToPDF,
  };
}
