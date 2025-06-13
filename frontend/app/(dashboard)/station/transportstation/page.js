"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import {
  TextField, Button, Typography, Snackbar, Alert, Grid, Card, CardContent,
  FormControl, InputLabel, Select, MenuItem, Chip, Autocomplete, OutlinedInput, Divider,
  Collapse, Tooltip, IconButton
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import angkaTerbilang from '@develoka/angka-terbilang-js';

const TransportStation = () => {
  const { data: session, status } = useSession();
  const [batchNumbers, setBatchNumbers] = useState([]);
  const [selectedBatchNumbers, setSelectedBatchNumbers] = useState([]);
  const [desa, setDesa] = useState(null);
  const [kecamatan, setKecamatan] = useState(null);
  const [kabupaten, setKabupaten] = useState(null);
  const [cost, setCost] = useState('');
  const [loadingWorkerCount, setLoadingWorkerCount] = useState('');
  const [loadingWorkerCostPerPerson, setLoadingWorkerCostPerPerson] = useState('');
  const [unloadingWorkerCount, setUnloadingWorkerCount] = useState('');
  const [unloadingWorkerCostPerPerson, setUnloadingWorkerCostPerPerson] = useState('');
  const [harvestWorkerCount, setHarvestWorkerCount] = useState('');
  const [harvestWorkerCostPerPerson, setHarvestWorkerCostPerPerson] = useState('');
  const [transportCostFarmToCollection, setTransportCostFarmToCollection] = useState('');
  const [transportCostCollectionToFacility, setTransportCostCollectionToFacility] = useState('');
  const [paidTo, setPaidTo] = useState('');
  const [isOtherFarmer, setIsOtherFarmer] = useState(false);
  const [customPaidTo, setCustomPaidTo] = useState('');
  const [customFarmerAddress, setCustomFarmerAddress] = useState('');
  const [customBankAccount, setCustomBankAccount] = useState('');
  const [customBankName, setCustomBankName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [farmers, setFarmers] = useState([]);
  const [transportData, setTransportData] = useState([]);
  const [locationData, setLocationData] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [selectedFarmerDetails, setSelectedFarmerDetails] = useState(null);
  const [contractType, setContractType] = useState('');
  const [farmerContractCache, setFarmerContractCache] = useState({});
  const [batchWeights, setBatchWeights] = useState({});

  const fetchBatchNumbers = async () => {
    try {
      const response = await axios.get('https://processing-facility-backend.onrender.com/api/receiving');
      const batches = response.data.noTransportData?.map(item => ({
        batchNumber: item.batchNumber,
        farmerId: item.farmerID,
        weight: item.weight || 'N/A'
      })) || [];
      setBatchNumbers(batches);
      const weights = batches.reduce((acc, batch) => ({
        ...acc,
        [batch.batchNumber]: batch.weight
      }), {});
      setBatchWeights(weights);
      if (batches.length === 0) {
        setSnackbarMessage('No batch numbers available.');
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error fetching batch numbers:', error);
      setSnackbarMessage('Failed to fetch batch numbers. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const fetchFarmers = async () => {
    try {
      const response = await axios.get('https://processing-facility-backend.onrender.com/api/farmer');
      setFarmers(response.data.allRows || []);
    } catch (error) {
      console.error('Error fetching farmers:', error);
      setSnackbarMessage('Failed to fetch farmers.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const fetchTransportData = async () => {
    try {
      const response = await fetch('https://processing-facility-backend.onrender.com/api/transport');
      if (!response.ok) throw new Error('Failed to fetch transport data');
      const data = await response.json();
      setTransportData(data.map(row => ({
        ...row,
        cost: Number(row.cost) || 0,
        loadingWorkerCount: Number(row.loadingWorkerCount) || 0,
        loadingWorkerCostPerPerson: Number(row.loadingWorkerCostPerPerson) || 0,
        unloadingWorkerCount: Number(row.unloadingWorkerCount) || 0,
        unloadingWorkerCostPerPerson: Number(row.unloadingWorkerCostPerPerson) || 0,
        harvestWorkerCount: Number(row.harvestWorkerCount) || 0,
        harvestWorkerCostPerPerson: Number(row.harvestWorkerCostPerPerson) || 0,
        transportCostFarmToCollection: Number(row.transportCostFarmToCollection) || 0,
        transportCostCollectionToFacility: Number(row.transportCostCollectionToFacility) || 0,
        totalCost: Number(row.totalCost) || 0,
        createdAt: new Date(row.createdAt).toLocaleString()
      })) || []);
    } catch (error) {
      console.error('Error fetching transport data:', error);
      setTransportData([]);
      setSnackbarMessage('Failed to fetch transport data.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const fetchLocationData = async () => {
    try {
      const response = await axios.get('https://processing-facility-backend.onrender.com/api/location');
      setLocationData(response.data || []);
    } catch (error) {
      console.error('Error fetching location data:', error);
      setSnackbarMessage('Failed to fetch location data.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const fetchContractType = async (farmerId) => {
    if (farmerContractCache[farmerId]) {
      return farmerContractCache[farmerId];
    }
    try {
      const response = await axios.get(`https://processing-facility-backend.onrender.com/api/farmerid/${farmerId}`);
      const contractType = response.data?.contractType || null;
      setFarmerContractCache(prev => ({ ...prev, [farmerId]: contractType }));
      return contractType;
    } catch (error) {
      console.error(`Error fetching contract type for farmer ${farmerId}:`, error);
      return null;
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchBatchNumbers();
      fetchFarmers();
      fetchTransportData();
      fetchLocationData();
    }
  }, [status]);

  useEffect(() => {
    if (selectedBatchNumbers.length > 0) {
      const selectedBatches = batchNumbers.filter(batch => 
        selectedBatchNumbers.includes(batch.batchNumber));
      const uniqueFarmerIds = [...new Set(selectedBatches.map(batch => batch.farmerId))];
      
      Promise.all(uniqueFarmerIds.map(farmerId => fetchContractType(farmerId)))
        .then(contractTypes => {
          const validContractTypes = contractTypes.filter(ct => ct !== null);
          const uniqueContractTypes = [...new Set(validContractTypes)];
          
          if (validContractTypes.length === 0) {
            setSnackbarMessage('No valid contract types found for selected batches.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            setSelectedBatchNumbers([]);
            setContractType('');
          } else if (uniqueContractTypes.length > 1) {
            setSnackbarMessage('Please select batch numbers with the same contract type.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            setSelectedBatchNumbers([]);
            setContractType('');
          } else {
            setContractType(uniqueContractTypes[0]);
          }
        })
        .catch(error => {
          console.error('Error validating contract types:', error);
          setSnackbarMessage('Failed to validate contract types.');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
          setSelectedBatchNumbers([]);
          setContractType('');
        });
    } else {
      setContractType('');
    }
  }, [selectedBatchNumbers, batchNumbers]);

  const handleKabupatenChange = (event, newValue) => {
    setKabupaten(newValue);
    setKecamatan(null);
    setDesa(null);
  };

  const handleKecamatanChange = (event, newValue) => {
    setKecamatan(newValue);
    setDesa(null);
  };

  const handleDesaChange = (event, newValue) => {
    setDesa(newValue);
  };

  const handlePaidToChange = (event) => {
    const value = event.target.value;
    setPaidTo(value);
    if (value === 'Others') {
      setIsOtherFarmer(true);
      setSelectedFarmerDetails(null);
      setCustomPaidTo('');
      setCustomFarmerAddress('');
      setCustomBankAccount('');
      setCustomBankName('');
    } else {
      setIsOtherFarmer(false);
      const selectedFarmer = farmers.find(farmer => farmer.farmerName === value);
      setSelectedFarmerDetails(selectedFarmer ? {
        farmerID: selectedFarmer.farmerID,
        farmerAddress: selectedFarmer.farmerAddress || 'N/A',
        bankAccount: selectedFarmer.bankAccount || '',
        bankName: selectedFarmer.bankName || ''
      } : null);
    }
  };

  const calculateTotalCost = () => {
    const loadingCost = Number(loadingWorkerCount) * Number(loadingWorkerCostPerPerson);
    const unloadingCost = Number(unloadingWorkerCount) * Number(unloadingWorkerCostPerPerson);
    const harvestCost = Number(harvestWorkerCount) * Number(harvestWorkerCostPerPerson);
    const transportCost = contractType === 'Kontrak Lahan' ? 
      (Number(transportCostFarmToCollection) + Number(transportCostCollectionToFacility)) :
      Number(cost);

    return loadingCost + unloadingCost + harvestCost + transportCost;
  };

  const generateSingleInvoice = (data, type, batchNumber) => {
    const doc = new jsPDF();
    const invoiceNo = `${batchNumber}-${type === 'shipping' ? 'S' : type === 'loading' ? 'L' : type === 'unloading' ? 'U' : 'H'}`;
    const date = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    let amount = 0;
    let description = '';
    const weight = batchWeights[batchNumber] || 'N/A';
    const paidToName = data.paidTo || 'Unknown';

    switch (type) {
      case 'shipping':
        amount = data.contractType === 'Kontrak Lahan' ? 
          (Number(data.transportCostFarmToCollection) + Number(data.transportCostCollectionToFacility)) : 
          Number(data.cost);
        description = data.contractType === 'Kontrak Lahan' ? 
          `Biaya Transportasi Kopi ${paidToName} ${weight}kg (Ladang ke Titik Pengumpulan dan Titik Pengumpulan ke Fasilitas)` : 
          `Biaya Transportasi Kopi ${paidToName} ${weight}kg (Ladang ke Fasilitas)`;
        break;
      case 'loading':
        amount = Number(data.loadingWorkerCount) * Number(data.loadingWorkerCostPerPerson);
        description = `Upah Kuli Pemuatan Kopi ${paidToName} ${weight}kg`;
        break;
      case 'unloading':
        amount = Number(data.unloadingWorkerCount) * Number(data.unloadingWorkerCostPerPerson);
        description = `Upah Kuli Pembongkaran Kopi ${paidToName} ${weight}kg`;
        break;
      case 'harvesting':
        amount = Number(data.harvestWorkerCount) * Number(data.harvestWorkerCostPerPerson);
        description = `Upah Kuli Panen Kopi ${paidToName} ${weight}kg`;
        break;
    }

    if (amount <= 0) return null; // Skip if no valid amount

    const amountInWords = angkaTerbilang(amount) + ' Rupiah';

    doc.setFontSize(12);
    doc.text('KWITANSI PEMBAYARAN', 105, 20, { align: 'center' });
    doc.text('PT.BERKAS TUAIAN MELIMPAH', 105, 27, { align: 'center' });

    doc.setFontSize(11);
    doc.text(`No                            : ${invoiceNo}`, 20, 40);
    doc.text(`Tanggal                    : ${date}`, 20, 46);
    doc.text('Terima Dari              : PT Berkas Tuaian Melimpah', 20, 52);
    doc.text(`Terbilang                  : ${amountInWords}`, 20, 58);
    doc.text(`Untuk Pembayaran  : ${description}`, 20, 64);

    doc.text(`Rp ${amount.toLocaleString('id-ID')}`, 40, 80);
    doc.text('Penerima', 140, 73);

    doc.rect(30, 71, 45, 15);
    doc.rect(5, 5, 200, 95);

    return { doc, invoiceNo, type, amount };
  };

  const uploadInvoiceToGoogleDrive = async (pdfBlob, invoiceNo, type, batchNumber) => {
    try {
      const formData = new FormData();
      formData.append('file', pdfBlob, `${invoiceNo}.pdf`);
      formData.append('batchNumber', batchNumber);
      formData.append('invoiceType', type);

      const response = await fetch('https://processing-facility-backend.onrender.com/api/upload-invoice', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload invoice');

      const data = await response.json();
      console.log(`Invoice ${invoiceNo} uploaded successfully:`, data);
      return data.fileId;
    } catch (error) {
      console.error(`Error uploading invoice ${invoiceNo}:`, error);
      setSnackbarMessage(`Failed to upload ${type} invoice.`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return null;
    }
  };

  const generateAndUploadInvoices = async (data, batchNumber, contractType) => {
    const invoiceTypes = ['shipping', 'loading', 'unloading', 'harvesting'];
    const invoices = [];
    const mergedDoc = new jsPDF();

    let isFirstPage = true;

    // Add contractType to data for invoice generation
    const invoiceData = { ...data, contractType };

    for (const type of invoiceTypes) {
      const invoice = generateSingleInvoice(invoiceData, type, batchNumber);
      if (invoice) {
        const { doc, invoiceNo, type, amount } = invoice;

        // Add to merged PDF
        if (!isFirstPage) mergedDoc.addPage();
        const pdfBytes = doc.output('arraybuffer');
        const pages = await new jsPDF({ format: 'a4' }).loadDocument(pdfBytes);
        pages.getPages().forEach((page, index) => {
          if (index === 0 || !isFirstPage) {
            mergedDoc.addPage();
          }
          mergedDoc.addImage(page.getImageData(), 'PDF', 0, 0, 210, 297);
        });
        isFirstPage = false;

        // Upload to Google Drive
        const pdfBlob = new Blob([doc.output('arraybuffer')], { type: 'application/pdf' });
        const fileId = await uploadInvoiceToGoogleDrive(pdfBlob, invoiceNo, type, batchNumber);
        if (fileId) {
          invoices.push({ invoiceNo, type, fileId, amount });
        }
      }
    }

    if (invoices.length > 0) {
      // Save merged PDF locally for download
      mergedDoc.save(`Merged_Invoices_${batchNumber}.pdf`);
      return invoices;
    }
    return [];
  };

  const handleDownloadInvoices = async (row) => {
    const batchNumber = row.batchNumber;
    // Fetch contract type for the batch to ensure correct invoice generation
    const batch = batchNumbers.find(b => b.batchNumber === batchNumber);
    if (!batch) {
      setSnackbarMessage('Batch number not found.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    const farmerContractType = await fetchContractType(batch.farmerId);
    if (!farmerContractType) {
      setSnackbarMessage('Failed to fetch contract type for batch.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    // Generate and upload invoices for existing data
    await generateAndUploadInvoices(row, batchNumber, farmerContractType);

    setSnackbarMessage(`Invoices for batch ${batchNumber} generated and uploaded successfully!`);
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedBatchNumbers.length) {
      setSnackbarMessage('Please select at least one batch number.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    if (!contractType) {
      setSnackbarMessage('Contract type not resolved. Please reselect batch numbers.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    if (!desa || !kecamatan || !kabupaten) {
      setSnackbarMessage('Please complete all location fields.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    if (!paidTo || (isOtherFarmer && !customPaidTo)) {
      setSnackbarMessage('Please select or enter a name for Paid To.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    if (!paymentMethod) {
      setSnackbarMessage('Please select a payment method.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      const payload = {
        batchNumber: selectedBatchNumbers.join(','),
        desa,
        kecamatan,
        kabupaten,
        cost: contractType === 'Kontrak Lahan' ? null : Number(cost) || 0,
        loadingWorkerCount: Number(loadingWorkerCount) || null,
        loadingWorkerCostPerPerson: Number(loadingWorkerCostPerPerson) || null,
        unloadingWorkerCount: Number(unloadingWorkerCount) || null,
        unloadingWorkerCostPerPerson: Number(unloadingWorkerCostPerPerson) || null,
        harvestWorkerCount: contractType === 'Kontrak Lahan' ? Number(harvestWorkerCount) || null : null,
        harvestWorkerCostPerPerson: contractType === 'Kontrak Lahan' ? Number(harvestWorkerCostPerPerson) || null : null,
        transportCostFarmToCollection: contractType === 'Kontrak Lahan' ? Number(transportCostFarmToCollection) || null : null,
        transportCostCollectionToFacility: contractType === 'Kontrak Lahan' ? Number(transportCostCollectionToFacility) || null : null,
        paidTo: isOtherFarmer ? customPaidTo : paidTo,
        farmerID: isOtherFarmer ? null : selectedFarmerDetails?.farmerID,
        paymentMethod,
        bankAccount: isOtherFarmer ? customBankAccount || null : selectedFarmerDetails?.bankAccount || null,
        bankName: isOtherFarmer ? customBankName || null : selectedFarmerDetails?.bankName || null
      };

      const response = await axios.post('https://processing-facility-backend.onrender.com/api/transport', payload);
      if (response.status === 201) {
        // Generate and upload invoices for each selected batch number
        for (const batchNumber of selectedBatchNumbers) {
          await generateAndUploadInvoices(payload, batchNumber, contractType);
        }

        setSelectedBatchNumbers([]);
        setDesa(null);
        setKecamatan(null);
        setKabupaten(null);
        setCost('');
        setLoadingWorkerCount('');
        setLoadingWorkerCostPerPerson('');
        setUnloadingWorkerCount('');
        setUnloadingWorkerCostPerPerson('');
        setHarvestWorkerCount('');
        setHarvestWorkerCostPerPerson('');
        setTransportCostFarmToCollection('');
        setTransportCostCollectionToFacility('');
        setPaidTo('');
        setCustomPaidTo('');
        setCustomFarmerAddress('');
        setCustomBankAccount('');
        setCustomBankName('');
        setIsOtherFarmer(false);
        setPaymentMethod('');
        setSelectedFarmerDetails(null);
        setContractType('');
        setSnackbarMessage('Transport data and invoices created successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        fetchTransportData();
      } else {
        throw new Error('Failed to create transport data');
      }
    } catch (error) {
      setSnackbarMessage(error.message || 'Failed to create transport data.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const columns = [
    { field: 'batchNumber', headerName: 'Batch Number', width: 150 },
    { field: 'createdAtTrunc', headerName: 'Receiving Date', width: 150 },
    { field: 'kabupaten', headerName: 'Kabupaten', width: 150 },
    { field: 'kecamatan', headerName: 'Kecamatan', width: 150 },
    { field: 'desa', headerName: 'Desa', width: 150 },
    {
      field: 'cost',
      headerName: 'TC Farm to Facility',
      width: 180,
      sortable: true,
      renderCell: ({ value }) => {
        if (value == null || isNaN(value)) return 'N/A';
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0
        }).format(value);
      }
    },
    {
      field: 'transportCostFarmToCollection',
      headerName: 'TC Farm to Collection',
      width: 180,
      sortable: true,
      renderCell: ({ value }) => {
        if (value == null || isNaN(value)) return 'N/A';
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0
        }).format(value);
      }
    },
    {
      field: 'transportCostCollectionToFacility',
      headerName: 'TC Collection to Facility',
      width: 180,
      sortable: true,
      renderCell: ({ value }) => {
        if (value == null || isNaN(value)) return 'N/A';
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0
        }).format(value);
      }
    },
    {
      field: 'loadingWorkerCost',
      headerName: 'Loading Worker Cost',
      width: 180,
      sortable: true,
      renderCell: ({ row }) => {
        const value = (Number(row.loadingWorkerCount) || 0) * (Number(row.loadingWorkerCostPerPerson) || 0);
        if (value == null || isNaN(value)) return 'N/A';
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0
        }).format(value);
      }
    },
    {
      field: 'unloadingWorkerCost',
      headerName: 'Unloading Worker Cost',
      width: 180,
      sortable: true,
      renderCell: ({ row }) => {
        const value = (Number(row.unloadingWorkerCount) || 0) * (Number(row.unloadingWorkerCostPerPerson) || 0);
        if (value == null || isNaN(value)) return 'N/A';
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0
        }).format(value);
      }
    },
    {
      field: 'harvestWorkerCost',
      headerName: 'Harvest Worker Cost',
      width: 180,
      sortable: true,
      renderCell: ({ row }) => {
        const value = (Number(row.harvestWorkerCount) || 0) * (Number(row.harvestWorkerCostPerPerson) || 0);
        if (value == null || isNaN(value)) return 'N/A';
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0
        }).format(value);
      }
    },
    {
      field: 'totalCost',
      headerName: 'Total Cost',
      width: 180,
      sortable: true,
      renderCell: ({ value }) => {
        if (value == null || isNaN(value)) return 'N/A';
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0
        }).format(value);
      }
    },
    { field: 'paidTo', headerName: 'Paid To', width: 150 },
    { field: 'bankAccount', headerName: 'Bank Account Number', width: 200 },
    { field: 'bankName', headerName: 'Bank Name', width: 150 },
    {
      field: 'downloadInvoices',
      headerName: 'Download Invoices',
      width: 180,
      renderCell: ({ row }) => (
        <IconButton
          color="primary"
          onClick={() => handleDownloadInvoices(row)}
        >
          <PictureAsPdfIcon />
        </IconButton>
      )
    }
  ];

  const kabupatenList = [...new Set(locationData.map(item => item.kabupaten))];
  const kecamatanList = kabupaten ? [...new Set(locationData.filter(item => item.kabupaten === kabupaten).map(item => item.kecamatan))] : [];
  const desaList = kecamatan ? locationData.filter(item => item.kecamatan === kecamatan).map(item => item.desa) : [];

  if (status === 'loading') return <p>Loading...</p>;
  if (!session?.user || !['admin', 'manager', 'receiving'].includes(session.user.role)) {
    return <Typography variant="h6">Access Denied</Typography>;
  }

  return (
    <Grid container spacing={3} sx={{ p: 2 }}>
      <Grid item xs={12} md={4}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>Transport Station Form</Typography>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Batch Number</InputLabel>
                    <Select
                      multiple
                      value={selectedBatchNumbers}
                      onChange={e => setSelectedBatchNumbers(e.target.value)}
                      input={<OutlinedInput label="Batch Number" />}
                      renderValue={selected => (
                        <div>
                          {selected.map(value => <Chip key={value} label={value} />)}
                        </div>
                      )}
                    >
                      {batchNumbers.map(batch => (
                        <MenuItem key={batch.batchNumber} value={batch.batchNumber}>{batch.batchNumber}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Contract Type"
                    value={contractType}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Autocomplete
                    options={kabupatenList}
                    value={kabupaten}
                    onChange={handleKabupatenChange}
                    renderInput={params => <TextField {...params} label="Kabupaten" />}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Autocomplete
                    options={kecamatanList}
                    value={kecamatan}
                    onChange={handleKecamatanChange}
                    disabled={!kabupaten}
                    renderInput={params => <TextField {...params} label="Kecamatan" />}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Autocomplete
                    options={desaList}
                    value={desa}
                    onChange={handleDesaChange}
                    disabled={!kecamatan}
                    renderInput={params => <TextField {...params} label="Desa" />}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mt: 2 }}>Cost Details</Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label={contractType === 'Kontrak Lahan' ? 'Transport Cost (Collection Point to Facility)' : 'Transport Cost (Farm to Facility)'}
                    type="number"
                    value={contractType === 'Kontrak Lahan' ? transportCostCollectionToFacility : cost}
                    onChange={e => contractType === 'Kontrak Lahan' ? setTransportCostCollectionToFacility(e.target.value) : setCost(e.target.value)}
                    fullWidth
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Divider style={{ margin: '16px 0' }} />
                <Grid item xs={6}>
                  <Tooltip title="Number of workers loading cherries onto the truck">
                    <TextField
                      label="Loading Workers Count"
                      type="number"
                      value={loadingWorkerCount}
                      onChange={e => setLoadingWorkerCount(e.target.value)}
                      fullWidth
                      inputProps={{ min: 0 }}
                    />
                  </Tooltip>
                </Grid>
                <Grid item xs={6}>
                  <Tooltip title="Cost per loading worker (IDR)">
                    <TextField
                      label="Cost per Loading Worker"
                      type="number"
                      value={loadingWorkerCostPerPerson}
                      onChange={e => setLoadingWorkerCostPerPerson(e.target.value)}
                      fullWidth
                      inputProps={{ min: 0 }}
                    />
                  </Tooltip>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Total Loading Cost"
                    value={(Number(loadingWorkerCount) * Number(loadingWorkerCostPerPerson)).toFixed(0)}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Divider style={{ margin: '16px 0' }} />
                <Grid item xs={6}>
                  <Tooltip title="Number of workers unloading cherries from the truck">
                    <TextField
                      label="Unloading Workers Count"
                      type="number"
                      value={unloadingWorkerCount}
                      onChange={e => setUnloadingWorkerCount(e.target.value)}
                      fullWidth
                      inputProps={{ min: 0 }}
                    />
                  </Tooltip>
                </Grid>
                <Grid item xs={6}>
                  <Tooltip title="Cost per unloading worker (IDR)">
                    <TextField
                      label="Cost per Unloading Worker"
                      type="number"
                      value={unloadingWorkerCostPerPerson}
                      onChange={e => setUnloadingWorkerCostPerPerson(e.target.value)}
                      fullWidth
                      inputProps={{ min: 0 }}
                    />
                  </Tooltip>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Total Unloading Cost"
                    value={(Number(unloadingWorkerCount) * Number(unloadingWorkerCostPerPerson)).toFixed(0)}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Divider style={{ margin: '16px 0' }} />
                <Collapse in={contractType === 'Kontrak Lahan'}>
                  <Grid item xs={12}>
                    <TextField
                      label="Transport Cost (Farm to Collection Point)"
                      type="number"
                      value={transportCostFarmToCollection}
                      onChange={e => setTransportCostFarmToCollection(e.target.value)}
                      fullWidth
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                  <Divider style={{ margin: '16px 0' }} />
                  <Grid item xs={6}>
                    <Tooltip title="Number of workers harvesting cherries at the farm">
                      <TextField
                        label="Harvest Workers Count (Buruh Petik)"
                        type="number"
                        value={harvestWorkerCount}
                        onChange={e => setHarvestWorkerCount(e.target.value)}
                        fullWidth
                        inputProps={{ min: 0 }}
                      />
                    </Tooltip>
                  </Grid>
                  <Grid item xs={6}>
                    <Tooltip title="Cost per worker for harvesting (IDR)">
                      <TextField
                        label="Cost per Harvest Worker"
                        type="number"
                        value={harvestWorkerCostPerPerson}
                        onChange={e => setHarvestWorkerCostPerPerson(e.target.value)}
                        fullWidth
                        inputProps={{ min: 0 }}
                      />
                    </Tooltip>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Total Harvest Cost"
                      value={(Number(harvestWorkerCount) * Number(harvestWorkerCostPerPerson)).toFixed(0)}
                      fullWidth
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Divider style={{ margin: '16px 0' }} />
                </Collapse>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Paid To</InputLabel>
                    <Select
                      value={paidTo}
                      onChange={handlePaidToChange}
                      input={<OutlinedInput label="Paid To" />}
                    >
                      {farmers.map(farmer => (
                        <MenuItem key={farmer.farmerID} value={farmer.farmerName}>
                          {farmer.farmerName}
                        </MenuItem>
                      ))}
                      <MenuItem value="Others">Others</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {isOtherFarmer && (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        label="Paid To Name"
                        value={customPaidTo}
                        onChange={e => setCustomPaidTo(e.target.value)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Address"
                        value={customFarmerAddress}
                        onChange={e => setCustomFarmerAddress(e.target.value)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Bank Account"
                        value={customBankAccount}
                        onChange={e => setCustomBankAccount(e.target.value)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Bank Name"
                        value={customBankName}
                        onChange={e => setCustomBankName(e.target.value)}
                        fullWidth
                      />
                    </Grid>
                  </>
                )}
                {!isOtherFarmer && selectedFarmerDetails && (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        label="Farmer ID"
                        value={selectedFarmerDetails.farmerID || ''}
                        fullWidth
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Farmer Address"
                        value={selectedFarmerDetails.farmerAddress || 'N/A'}
                        fullWidth
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Bank Account"
                        value={selectedFarmerDetails.bankAccount || ''}
                        fullWidth
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Bank Name"
                        value={selectedFarmerDetails.bankName || ''}
                        fullWidth
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                  </>
                )}
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value)}
                      input={<OutlinedInput label="Payment Method" />}
                    >
                      <MenuItem value="cash">Cash</MenuItem>
                      <MenuItem value="bank transfer">Bank Transfer</MenuItem>
                      <MenuItem value="check">Check</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Button type="submit" variant="contained" color="primary">
                    Submit
                  </Button>
                </Grid>
              </Grid>
            </form>
            <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)}>
              <Alert severity={snackbarSeverity} sx={{ width: '100%' }}>{snackbarMessage}</Alert>
            </Snackbar>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={8}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>Transport Data</Typography>
            <div style={{ height: 700, width: '100%' }}>
              <DataGrid
                rows={transportData}
                columns={columns}
                pageSize={5}
                slots={{ toolbar: GridToolbar }}
                autosizeOnMount
                autosizeOptions={{
                  includeHeaders: true,
                  includeOutliers: true,
                  expand: true,
                }}
                rowHeight={35}
              />
            </div>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default TransportStation;