"use client"

import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Button } from '@mui/material';
import axios from 'axios';

const PaymentPage = () => {
  const [notPaidData, setNotPaidData] = useState([]);
  const [isPaidData, setIsPaidData] = useState([]);

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPaymentData = async () => {
    try {
      const response = await axios.get('https://processing-facility-backend.onrender.com/api/payment');
      setNotPaidData(response.data.notPaid);
      setIsPaidData(response.data.isPaid);
    } catch (error) {
      console.error('Error fetching payment data:', error);
    }
  };

  const handleUpdate = async (id, field, value) => {
    try {
      // Update the payment data in the database
      await axios.put(`https://processing-facility-backend.onrender.com/api/payment/${id}`, { [field]: value });
      fetchPaymentData(); // Refresh the data
    } catch (error) {
      console.error('Error updating payment data:', error);
    }
  };

  const handleIsPaidChange = (id, value) => {
    const updatedData = notPaidData.map((item) => {
      if (item.id === id) {
        const paymentDate = value === 1 ? new Date().toISOString() : null; // Set paymentDate if isPaid is 1
        return { ...item, isPaid: value, paymentDate };
      }
      return item;
    });
    setNotPaidData(updatedData);
    handleUpdate(id, 'isPaid', value); // Call to update the backend
  };

  const columnsNotPaid = [
    { field: 'farmerName', headerName: 'Farmer Name', width: 200 },
    { field: 'farmerID', headerName: 'Farmer ID', width: 150 },
    { field: 'totalAmount', headerName: 'Total Amount', width: 150 },
    { field: 'date', headerName: 'Date', width: 150 },
    { field: 'paymentMethod', headerName: 'Payment Method', width: 150 },
    { field: 'paymentDescription', headerName: 'Payment Description', width: 200 },
    {
      field: 'isPaid',
      headerName: 'Is Paid',
      width: 100,
      editable: true,
      renderEditCell: (params) => (
        <select
          value={params.value}
          onChange={(e) => handleIsPaidChange(params.id, Number(e.target.value))}
        >
          <option value={0}>No</option>
          <option value={1}>Yes</option>
        </select>
      ),
    },
    { field: 'paymentDate', headerName: 'Payment Date', width: 150 },
  ];

  const columnsIsPaid = [
    { field: 'farmerName', headerName: 'Farmer Name', width: 200 },
    { field: 'farmerID', headerName: 'Farmer ID', width: 150 },
    { field: 'totalAmount', headerName: 'Total Amount', width: 150 },
    { field: 'date', headerName: 'Date', width: 150 },
    { field: 'paymentMethod', headerName: 'Payment Method', width: 150 },
    { field: 'paymentDescription', headerName: 'Payment Description', width: 200 },
    { field: 'isPaid', headerName: 'Is Paid', width: 100 },
    { field: 'paymentDate', headerName: 'Payment Date', width: 150 },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h2>Not Paid Payments</h2>
      <div style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={notPaidData}
          columns={columnsNotPaid}
          pageSize={5}
          rowsPerPageOptions={[5]}
          checkboxSelection
          disableSelectionOnClick
        />
      </div>

      <h2>Paid Payments</h2>
      <div style={{ height: 800, width: '100%' }}>
        <DataGrid
          rows={isPaidData}
          columns={columnsIsPaid}
          pageSize={5}
          rowsPerPageOptions={[5]}
          checkboxSelection
          disableSelectionOnClick
        />
      </div>
    </div>
  );
};

export default PaymentPage;