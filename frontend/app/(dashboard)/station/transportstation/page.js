"use client"

import React, { useEffect, useState } from 'react';
import { TextField, Select, MenuItem, Button, InputLabel, FormControl, Chip } from '@mui/material';
import axios from 'axios';

const TransportStation = () => {
  const [batchNumbers, setBatchNumbers] = useState([]);
  const [selectedBatchNumbers, setSelectedBatchNumbers] = useState([]);
  const [desa, setDesa] = useState('');
  const [kecamatan, setKecamatan] = useState('');
  const [kabupaten, setKabupaten] = useState('');
  const [cost, setCost] = useState('');
  const [paidTo, setPaidTo] = useState('');
  const [farmerID, setFarmerID] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [farmers, setFarmers] = useState([]);
  const [bankAccount, setBankAccount] = useState('');
  const [bankName, setBankName] = useState('');

  useEffect(() => {
    const fetchBatchNumbers = async () => {
      try {
        const response = await axios.get('/api/receiving');
        console.log('Batch Numbers Response:', response.data);
        const todayData = response.data.todayData;

        if (Array.isArray(todayData)) {
          const batchNumbers = todayData.map(item => item.batchNumber);
          setBatchNumbers(batchNumbers);
        } else {
          console.error('todayData is not an array:', todayData);
        }
      } catch (error) {
        console.error('Error fetching batch numbers:', error);
      }
    };

    const fetchFarmers = async () => {
      try {
        const response = await axios.get('/api/farmers');
        console.log('Farmers Response:', response.data);
        const allFarmers = response.data.allRows; // Use allRows to get all farmers

        if (Array.isArray(allFarmers)) {
          setFarmers(allFarmers); // Adjust based on your response structure
        } else {
          console.error('Farmers data is not an array:', allFarmers);
        }
      } catch (error) {
        console.error('Error fetching farmers:', error);
      }
    };

    fetchBatchNumbers();
    fetchFarmers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('/api/transport', {
        batchNumber: selectedBatchNumbers.join(','),
        desa,
        kecamatan,
        kabupaten,
        cost,
        paidTo,
        paymentMethod,
        farmerID,
        bankAccount,
        bankName,
      });

      console.log('Transport data submitted:', response.data);
      // Reset form or handle success
    } catch (error) {
      console.error('Error submitting transport data:', error);
    }
  };

  const handleBatchSelect = (event) => {
    setSelectedBatchNumbers(event.target.value);
  };

  const handlePaidToChange = (event) => {
    const selectedFarmer = farmers.find(farmer => farmer.farmerName === event.target.value);
    setPaidTo(event.target.value);
    if (selectedFarmer) {
      setFarmerID(selectedFarmer.farmerID); // Set farmerID when a farmer is selected
      setBankAccount(selectedFarmer.bankAccount);
      setBankName(selectedFarmer.bankName);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormControl fullWidth>
        <InputLabel>Batch Number</InputLabel>
        <Select
          multiple
          value={selectedBatchNumbers}
          onChange={handleBatchSelect}
          renderValue={(selected) => (
            <div>
              {selected.map((value) => (
                <Chip key={value} label={value} />
              ))}
            </div>
          )}
        >
          {batchNumbers.map((batchNumber) => (
            <MenuItem key={batchNumber} value={batchNumber}>
              {batchNumber}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        label="Desa"
        value={desa}
        onChange={(e) => setDesa(e.target.value)}
        fullWidth
      />
      <TextField
        label="Kecamatan"
        value={kecamatan}
        onChange={(e) => setKecamatan(e.target.value)}
        fullWidth
      />
      <TextField
        label="Kabupaten"
        value={kabupaten}
        onChange={(e) => setKabupaten(e.target.value)}
        fullWidth
      />
      <TextField
        label="Cost"
        value={cost}
        onChange={(e) => setCost(e.target.value)}
        fullWidth
        type="number"
      />
      <FormControl fullWidth>
        <InputLabel>Paid To</InputLabel>
        <Select
          value={paidTo}
          onChange={handlePaidToChange}
        >
          {farmers.map((farmer) => (
            <MenuItem key={farmer.farmerID} value={farmer.farmerName}>
              {farmer.farmerName}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth>
        <InputLabel>Payment Method</InputLabel>
        <Select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        >
          <MenuItem value="cash">Cash</MenuItem>
          <MenuItem value="bank transfer">Bank Transfer</MenuItem>
          <MenuItem value="check">Check</MenuItem>
        </Select>
      </FormControl>

      <TextField
        label="Bank Account"
        value={bankAccount}
        onChange={(e) => setBankAccount(e.target.value)}
        fullWidth
      />
      <TextField
        label="Bank Name"
        value={bankName}
        onChange={(e) => setBankName(e.target.value)}
        fullWidth
      />

      <Button type="submit" variant="contained" color="primary">Submit</Button>
    </form>
  );
};

export default TransportStation;