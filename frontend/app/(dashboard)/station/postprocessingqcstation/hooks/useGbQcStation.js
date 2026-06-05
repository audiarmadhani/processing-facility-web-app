'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { gbQcApi, emptyFormData } from '../constants';
import { generateGbQcPdf } from '../utils/generateGbQcPdf';
import { withPipelineIds } from '../utils/pipelineRowId';

function toDatetimeLocalValue(date = new Date()) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
  const [roastedAt, setRoastedAt] = useState(toDatetimeLocalValue());
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

  const handleStartQC = async (batch) => {
    setSelectedBatch(batch);
    try {
      const res = await axios.get(gbQcApi(`/postproqc/${batch.batchNumber}`));
      if (res.data) {
        setFormData({
          ...emptyFormData(),
          ...res.data,
          tastingNotes: res.data.tastingNotes || '',
          okForFurtherProcess: res.data.okForFurtherProcess ?? null,
        });
      } else {
        setFormData(emptyFormData());
      }
      setOpenDialog(true);
    } catch (error) {
      console.error('Error fetching QC data for batch:', error);
      setSnackbar({ open: true, message: 'Failed to load QC data!', severity: 'error' });
    }
  };

  const handleOpenRecordRoast = (batch) => {
    setRoastTarget(batch);
    setRoastedAt(toDatetimeLocalValue());
    setRoastNotes('');
    setStartQcAfterRoast(true);
    setOpenRoastDialog(true);
  };

  const handleCloseRoastDialog = () => {
    setOpenRoastDialog(false);
    setRoastTarget(null);
  };

  const handleConfirmRecordRoast = async () => {
    if (!roastTarget) return;
    setIsLoading(true);
    try {
      await axios.post(gbQcApi('/gb-qc/roast'), {
        batchNumber: roastTarget.batchNumber,
        processingType: roastTarget.processingType,
        roastedAt: roastedAt ? new Date(roastedAt).toISOString() : new Date().toISOString(),
        notes: roastNotes.trim() || null,
        roastedBy: session?.user?.name || session?.user?.email || 'unknown',
      });
      setSnackbar({ open: true, message: 'Roast recorded.', severity: 'success' });
      handleCloseRoastDialog();
      await fetchData();
      if (startQcAfterRoast) {
        await handleStartQC(roastTarget);
      }
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
    if (name === 'seranggaHidup' || name === 'bijiBauBusuk' || name === 'okForFurtherProcess') {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value === '' ? null : value === 'true',
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const isFormComplete = () => {
    return (
      formData.tastingNotes.trim() !== '' &&
      formData.okForFurtherProcess !== null &&
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
        ...formData,
        tastingNotes: formData.tastingNotes.trim(),
        okForFurtherProcess: formData.okForFurtherProcess,
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
    handleConfirmRecordRoast,
    openRoastDialog,
    roastTarget,
    roastedAt,
    setRoastedAt,
    roastNotes,
    setRoastNotes,
    startQcAfterRoast,
    setStartQcAfterRoast,
    handleCloseDialog,
    handleFormChange,
    isFormComplete,
    handleSaveQC,
    handleCapture,
    handleExportToPDF,
  };
}
