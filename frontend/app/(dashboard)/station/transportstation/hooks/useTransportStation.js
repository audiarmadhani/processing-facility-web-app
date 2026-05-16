'use client';

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useSnackbar } from '../../_shared/hooks/useSnackbar';
import { generateAndUploadInvoices } from '../utils/generateTransportPdf';

export function useTransportStation(status) {
  const snackbar = useSnackbar();

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
  const [contacts, setContacts] = useState([]);
  const [transportData, setTransportData] = useState([]);
  const [locationData, setLocationData] = useState([]);
  const [selectedFarmerDetails, setSelectedFarmerDetails] = useState(null);
  const [contractType, setContractType] = useState('');
  const [farmerContractCache, setFarmerContractCache] = useState({});
  const [batchWeights, setBatchWeights] = useState({});

  const showSnackbarError = useCallback((msg) => {
    snackbar.setMessage(msg);
    snackbar.setSeverity('error');
    snackbar.setOpen(true);
  }, [snackbar]);

  const showSnackbarWarning = useCallback((msg) => {
    snackbar.setMessage(msg);
    snackbar.setSeverity('warning');
    snackbar.setOpen(true);
  }, [snackbar]);

  const showSnackbarSuccess = useCallback((msg) => {
    snackbar.setMessage(msg);
    snackbar.setSeverity('success');
    snackbar.setOpen(true);
  }, [snackbar]);

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
        showSnackbarWarning('No batch numbers available.');
      }
    } catch (error) {
      console.error('Error fetching batch numbers:', error);
      showSnackbarError('Failed to fetch batch numbers. Please try again.');
    }
  };

  const fetchFarmers = async () => {
    try {
      const response = await axios.get('https://processing-facility-backend.onrender.com/api/farmer');
      setFarmers(response.data.farmershipperRows || []);
    } catch (error) {
      console.error('Error fetching farmers:', error);
      showSnackbarError('Failed to fetch farmers.');
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await axios.get('https://processing-facility-backend.onrender.com/api/contact');
      setContacts(response.data.allRows || []);
    } catch (error) {
      console.error('Error fetching farmers:', error);
      showSnackbarError('Failed to fetch farmers.');
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
      showSnackbarError('Failed to fetch transport data.');
    }
  };

  const fetchLocationData = async () => {
    try {
      const response = await axios.get('https://processing-facility-backend.onrender.com/api/location');
      setLocationData(response.data || []);
    } catch (error) {
      console.error('Error fetching location data:', error);
      showSnackbarError('Failed to fetch location data.');
    }
  };

  const fetchContractType = async (farmerId) => {
    if (farmerContractCache[farmerId]) {
      return farmerContractCache[farmerId];
    }
    try {
      const response = await axios.get(`https://processing-facility-backend.onrender.com/api/farmerid/${farmerId}`);
      const ct = response.data?.contractType || null;
      setFarmerContractCache(prev => ({ ...prev, [farmerId]: ct }));
      return ct;
    } catch (error) {
      console.error(`Error fetching contract type for farmer ${farmerId}:`, error);
      return null;
    }
  };

  const fetchBatchDetails = async (batchNumber) => {
    try {
      const response = await axios.get(`https://processing-facility-backend.onrender.com/api/receiving/${batchNumber}`);
      if (response.status === 404 || !response.data || response.data.length === 0) {
        throw new Error(`Batch ${batchNumber} not found in receiving data.`);
      }
      const batch = response.data[0]; // Route returns an array
      return {
        batchNumber: batch.batchNumber,
        farmerId: batch.farmerID,
        weight: batch.weight || 'N/A',
        contractType: batch.contractType || null
      };
    } catch (error) {
      console.error(`Error fetching batch details for ${batchNumber}:`, error);
      throw error;
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchBatchNumbers();
      fetchFarmers();
      fetchContacts();
      fetchTransportData();
      fetchLocationData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            showSnackbarError('No valid contract types found for selected batches.');
            setSelectedBatchNumbers([]);
            setContractType('');
          } else if (uniqueContractTypes.length > 1) {
            showSnackbarError('Please select batch numbers with the same contract type.');
            setSelectedBatchNumbers([]);
            setContractType('');
          } else {
            setContractType(uniqueContractTypes[0]);
          }
        })
        .catch(error => {
          console.error('Error validating contract types:', error);
          showSnackbarError('Failed to validate contract types.');
          setSelectedBatchNumbers([]);
          setContractType('');
        });
    } else {
      setContractType('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleDownloadInvoices = async (row) => {
    const batchNumber = row.batchNumber;
    try {
      const batch = await fetchBatchDetails(batchNumber);
      if (!batch.farmerId) {
        throw new Error(`Farmer ID not found for batch ${batchNumber}.`);
      }
      if (!batch.contractType) {
        throw new Error(`Contract type not found for batch ${batchNumber}.`);
      }

      setBatchWeights(prev => ({
        ...prev,
        [batchNumber]: batch.weight
      }));

      const invoiceData = {
        ...row,
        paidTo: row.paidTo || 'Unknown'
      };

      console.log('Invoice Data for Download:', invoiceData);

      await generateAndUploadInvoices(
        invoiceData,
        batchNumber,
        batch.contractType,
        batch.weight,
        showSnackbarError
      );

      showSnackbarSuccess(`Invoices for batch ${batchNumber} generated and uploaded successfully!`);
    } catch (error) {
      console.error(`Error processing invoices for batch ${batchNumber}:`, error);
      showSnackbarError(error.message || `Failed to generate invoices for batch ${batchNumber}.`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedBatchNumbers.length) {
      showSnackbarError('Please select at least one batch number.');
      return;
    }

    if (!contractType) {
      showSnackbarError('Contract type not resolved. Please reselect batch numbers.');
      return;
    }

    if (!desa || !kecamatan || !kabupaten) {
      showSnackbarError('Please complete all location fields.');
      return;
    }

    if (!paidTo || (isOtherFarmer && !customPaidTo)) {
      showSnackbarError('Please select or enter a name for Paid To.');
      return;
    }

    if (!paymentMethod) {
      showSnackbarError('Please select a payment method.');
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
        for (const batchNumber of selectedBatchNumbers) {
          const batch = await fetchBatchDetails(batchNumber);
          if (!batch.weight) {
            console.warn(`Weight not found for batch ${batchNumber}, using 'N/A'`);
          }
          setBatchWeights(prev => ({
            ...prev,
            [batchNumber]: batch.weight || 'N/A'
          }));
          console.log('Payload for Invoice:', payload);
          await generateAndUploadInvoices(
            payload,
            batchNumber,
            contractType,
            batch.weight,
            showSnackbarError
          );
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
        showSnackbarSuccess('Transport data and invoices created successfully!');
        fetchTransportData();
      } else {
        throw new Error('Failed to create transport data');
      }
    } catch (error) {
      console.error('Error submitting transport data:', error);
      showSnackbarError(error.message || 'Failed to create transport data.');
    }
  };

  const kabupatenList = [...new Set(locationData.map(item => item.kabupaten))];
  const kecamatanList = kabupaten ? [...new Set(locationData.filter(item => item.kabupaten === kabupaten).map(item => item.kecamatan))] : [];
  const desaList = kecamatan ? locationData.filter(item => item.kecamatan === kecamatan).map(item => item.desa) : [];

  return {
    snackbar,
    batchNumbers,
    selectedBatchNumbers,
    setSelectedBatchNumbers,
    desa,
    kecamatan,
    kabupaten,
    cost,
    setCost,
    loadingWorkerCount,
    setLoadingWorkerCount,
    loadingWorkerCostPerPerson,
    setLoadingWorkerCostPerPerson,
    unloadingWorkerCount,
    setUnloadingWorkerCount,
    unloadingWorkerCostPerPerson,
    setUnloadingWorkerCostPerPerson,
    harvestWorkerCount,
    setHarvestWorkerCount,
    harvestWorkerCostPerPerson,
    setHarvestWorkerCostPerPerson,
    transportCostFarmToCollection,
    setTransportCostFarmToCollection,
    transportCostCollectionToFacility,
    setTransportCostCollectionToFacility,
    paidTo,
    isOtherFarmer,
    customPaidTo,
    setCustomPaidTo,
    customFarmerAddress,
    setCustomFarmerAddress,
    customBankAccount,
    setCustomBankAccount,
    customBankName,
    setCustomBankName,
    paymentMethod,
    setPaymentMethod,
    contacts,
    transportData,
    selectedFarmerDetails,
    contractType,
    handleKabupatenChange,
    handleKecamatanChange,
    handleDesaChange,
    handlePaidToChange,
    handleSubmit,
    handleDownloadInvoices,
    kabupatenList,
    kecamatanList,
    desaList,
  };
}
