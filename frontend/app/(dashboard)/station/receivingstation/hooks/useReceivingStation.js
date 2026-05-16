'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '../../_shared/config';
import { useSnackbar } from '../../_shared/hooks/useSnackbar';

export const RECEIVING_ALLOWED_ROLES = ['admin', 'manager', 'staff', 'receiving'];

export function useReceivingStation(session) {
  const snackbar = useSnackbar();

  const [farmerList, setFarmerList] = useState([]);
  const [selectedFarmerDetails, setSelectedFarmerDetails] = useState(null);
  const [notes, setNotes] = useState('');
  const [bagCountInput, setBagCountInput] = useState('1');
  const [bagWeights, setBagWeights] = useState(['']);
  const [totalWeight, setTotalWeight] = useState(0);
  const [brix, setBrix] = useState('');
  const [type, setType] = useState('');
  const [producer, setProducer] = useState('');
  const [processingType, setProcessingType] = useState('');
  const [grade, setGrade] = useState('');
  const [assigningRFID, setAssigningRFID] = useState(false);
  const [price, setPrice] = useState('');
  const [moisture, setMoisture] = useState('');

  const [tabValue, setTabValue] = useState(0);
  const [cherryData, setCherryData] = useState([]);
  const [greenBeanData, setGreenBeanData] = useState([]);

  const fetchFarmerList = async () => {
    try {
      const response = await fetch(apiUrl('/farmer'));
      if (!response.ok) throw new Error('Failed to fetch farmers');
      const data = await response.json();
      if (data && Array.isArray(data.allRows)) {
        setFarmerList(data.allRows);
      } else {
        console.error('Unexpected data format:', data);
      }
    } catch (error) {
      console.error('Error fetching farmers:', error);
    }
  };

  const fetchReceivingData = useCallback(async () => {
    if (!session || !session.user) return;

    try {
      const cherryResponse = await fetch(apiUrl('/receiving?commodityType=Cherry'));
      if (!cherryResponse.ok) throw new Error(`Failed to fetch cherry data: ${cherryResponse.status}`);
      const cherryResult = await cherryResponse.json();
      let filteredCherryData = [];
      if (['admin', 'manager'].includes(session.user.role)) {
        filteredCherryData = cherryResult.allRows.map((row, index) => ({ ...row, id: index }));
      } else if (['staff', 'receiving'].includes(session.user.role)) {
        filteredCherryData = cherryResult.todayData.map((row, index) => ({ ...row, id: index }));
      }
      setCherryData(filteredCherryData);

      const greenBeanResponse = await fetch(apiUrl('/receiving?commodityType=Green%20Bean'));
      if (!greenBeanResponse.ok) throw new Error(`Failed to fetch green bean data: ${greenBeanResponse.status}`);
      const greenBeanResult = await greenBeanResponse.json();
      let filteredGreenBeanData = [];
      if (['admin', 'manager'].includes(session.user.role)) {
        filteredGreenBeanData = greenBeanResult.allRows.map((row, index) => ({ ...row, id: index }));
      } else if (['staff', 'receiving'].includes(session.user.role)) {
        filteredGreenBeanData = greenBeanResult.todayData.map((row, index) => ({ ...row, id: index }));
      }
      setGreenBeanData(filteredGreenBeanData);
    } catch (error) {
      console.error('Error fetching receiving data:', error);
      setCherryData([]);
      setGreenBeanData([]);
    }
  }, [session]);

  useEffect(() => {
    fetchFarmerList();
    fetchReceivingData();
    const calculatedTotalWeight = bagWeights.reduce(
      (total, weight) => total + parseFloat(weight || 0),
      0
    );
    setTotalWeight(calculatedTotalWeight);
  }, [bagWeights, session, fetchReceivingData]);

  const resetForm = () => {
    setSelectedFarmerDetails(null);
    setBagWeights(['']);
    setNotes('');
    setBagCountInput('1');
    setTotalWeight(0);
    setType('');
    setProducer('');
    setBrix('');
    setProcessingType('');
    setGrade('');
    setPrice('');
    setMoisture('');
  };

  const handleBagWeightChange = (index, value) => {
    const updatedBagWeights = [...bagWeights];
    updatedBagWeights[index] = value;
    setBagWeights(updatedBagWeights);
  };

  const handleBagCountInputChange = (e) => {
    setBagCountInput(e.target.value);
  };

  const handleBagCountBlur = () => {
    const parsedValue = parseInt(bagCountInput, 10);
    const newValue = isNaN(parsedValue) || parsedValue < 1 ? 1 : parsedValue;
    setBagCountInput(newValue.toString());

    if (newValue > bagWeights.length) {
      setBagWeights([...bagWeights, ...Array(newValue - bagWeights.length).fill('')]);
    } else {
      setBagWeights(bagWeights.slice(0, newValue));
    }
  };

  const handleFarmerChange = (event, newValue) => {
    setSelectedFarmerDetails(newValue);
  };

  const getRfidData = async () => {
    try {
      const response = await fetch(apiUrl('/get-rfid/Receiving'));
      if (!response.ok) throw new Error(`Failed to fetch RFID data: ${response.status}`);
      const data = await response.json();
      if (data && typeof data.rfid === 'string' && data.rfid.trim().length > 0) {
        return data.rfid;
      }
      return '';
    } catch (error) {
      console.error('Error getting RFID data:', error);
      return '';
    }
  };

  const clearRfidData = async () => {
    try {
      const response = await fetch(apiUrl('/clear-rfid/Receiving'), { method: 'DELETE' });
      if (!response.ok) throw new Error(`Failed to clear RFID Data: ${response.status}`);
    } catch (error) {
      console.error('Error clearing RFID Data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!session || !session.user) {
      snackbar.showError('No user session found.');
      return;
    }

    if (!selectedFarmerDetails) {
      snackbar.showError('Please select a farmer.');
      return;
    }
    if (!type) {
      snackbar.showError('Please select a type.');
      return;
    }
    if (!producer) {
      snackbar.showError('Please select a producer.');
      return;
    }
    if (bagWeights.some((weight) => !weight || parseFloat(weight) <= 0)) {
      snackbar.showError('Please enter valid weights for all bags.');
      return;
    }
    if (tabValue === 1) {
      if (!processingType) {
        snackbar.showError('Please select a processing type.');
        return;
      }
      if (!grade) {
        snackbar.showError('Please select a grade.');
        return;
      }
    }

    const scannedRFID = await getRfidData();
    if (!scannedRFID) {
      snackbar.showError('Please scan an RFID tag before submitting.');
      return;
    }

    try {
      const rfidCheckResponse = await fetch(apiUrl(`/check-rfid/${scannedRFID}`));
      if (!rfidCheckResponse.ok) throw new Error(`RFID check failed: ${rfidCheckResponse.status}`);
      const rfidCheckData = await rfidCheckResponse.json();
      if (rfidCheckData.isAssigned) {
        snackbar.showError('RFID tag is already assigned to another batch. Please scan a different tag.');
        return;
      }
    } catch (error) {
      console.error('Error during RFID check:', error);
      snackbar.showError('Error checking RFID tag. Please try again.');
      return;
    }

    const commodityType = tabValue === 0 ? 'Cherry' : 'Green Bean';
    const payload = {
      farmerID: selectedFarmerDetails.farmerID,
      farmerName: selectedFarmerDetails.farmerName,
      notes,
      weight: totalWeight,
      totalBags: bagWeights.length,
      type,
      producer,
      brix: commodityType === 'Cherry' ? (brix ? parseFloat(brix) : null) : null,
      processingType: commodityType === 'Green Bean' ? processingType : null,
      grade: commodityType === 'Green Bean' ? grade : null,
      commodityType,
      bagPayload: bagWeights.map((weight, index) => ({
        bagNumber: index + 1,
        weight: parseFloat(weight) || 0,
      })),
      createdBy: session.user.name,
      updatedBy: session.user.name,
      rfid: scannedRFID,
      price: commodityType === 'Green Bean' ? (price !== '' ? Number(price) : null) : null,
      moisture: commodityType === 'Green Bean' ? (moisture !== '' ? Number(moisture) : null) : null,
    };

    try {
      setAssigningRFID(true);
      const endpoint =
        commodityType === 'Cherry' ? apiUrl('/receiving') : apiUrl('/receiving-green-beans');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const responseData = await response.json();
        const batchNumber = responseData.receivingData.batchNumber;
        snackbar.showSuccess(`Batch ${batchNumber} created and RFID tag assigned!`);
        await clearRfidData();
        resetForm();
        fetchReceivingData();
      } else {
        const errorData = await response.json();
        snackbar.showError(errorData.error || 'Error creating batch.');
      }
    } catch (error) {
      console.error('Failed to communicate with the backend:', error);
      snackbar.showError('Failed to communicate with the backend.');
    } finally {
      setAssigningRFID(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    resetForm();
  };

  return {
    snackbar,
    tabValue,
    handleTabChange,
    cherryData,
    greenBeanData,
    farmerList,
    selectedFarmerDetails,
    handleFarmerChange,
    notes,
    setNotes,
    bagCountInput,
    handleBagCountInputChange,
    handleBagCountBlur,
    bagWeights,
    handleBagWeightChange,
    totalWeight,
    brix,
    setBrix,
    type,
    setType,
    producer,
    setProducer,
    processingType,
    setProcessingType,
    grade,
    setGrade,
    price,
    setPrice,
    moisture,
    setMoisture,
    assigningRFID,
    handleSubmit,
  };
}
