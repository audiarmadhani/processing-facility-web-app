'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { API_GB_QC, emptyFormData } from '../constants';
import { generateGbQcPdf } from '../utils/generateGbQcPdf';

export function useGbQcStation(session) {
  const webcamRef = useRef(null);
  const [notQcedBatches, setNotQcedBatches] = useState([]);
  const [completedQCBatches, setCompletedQCBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [openCamera, setOpenCamera] = useState(false);
  const [formData, setFormData] = useState(emptyFormData());
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [notQcedRes, completedQCRes] = await Promise.all([
        axios.get(`${API_GB_QC}/postprocessing/not-qced`),
        axios.get(`${API_GB_QC}/postproqcfin`),
      ]);
      setNotQcedBatches(notQcedRes.data);
      setCompletedQCBatches(completedQCRes.data);
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
      const res = await axios.get(`${API_GB_QC}/postproqc/${batch.batchNumber}`);
      if (res.data) {
        setFormData(res.data);
      } else {
        setFormData(emptyFormData());
      }
      setOpenDialog(true);
    } catch (error) {
      console.error('Error fetching QC data for batch:', error);
      setSnackbar({ open: true, message: 'Failed to load QC data!', severity: 'error' });
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
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const isFormComplete = () => {
    return (
      formData.kelembapan !== '' &&
      formData.waterActivity !== '' &&
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
        kelembapan: formData.kelembapan === '' ? 0 : parseFloat(formData.kelembapan),
        waterActivity: formData.waterActivity === '' ? 0 : parseFloat(formData.waterActivity),
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

      await axios.post(`${API_GB_QC}/postproqc`, {
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

      const uploadRes = await axios.post(`${API_GB_QC}/upload-image`, formDataUpload);
      const imageUrl = uploadRes.data.url;

      await axios.post(`${API_GB_QC}/postproqc/image`, {
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
    notQcedBatches,
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
    handleCloseDialog,
    handleFormChange,
    isFormComplete,
    handleSaveQC,
    handleCapture,
    handleExportToPDF,
  };
}
