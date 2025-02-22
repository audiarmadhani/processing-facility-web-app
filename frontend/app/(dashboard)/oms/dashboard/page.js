"use client";

import React, { useState, useEffect } from 'react';
import {
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  Box,
  Paper,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useSession } from 'next-auth/react';

const Dashboard = () => {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ordersRes, customersRes, driversRes] = await Promise.all([
          fetch('https://processing-facility-backend.onrender.com/api/orders'),
          fetch('https://processing-facility-backend.onrender.com/api/customers'),
          fetch('https://processing-facility-backend.onrender.com/api/drivers'),
        ]);

        if (!ordersRes.ok || !customersRes.ok || !driversRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const ordersData = await ordersRes.json();
        const customersData = await customersRes.json();
        const driversData = await driversRes.json();

        setOrders(ordersData);
        setCustomers(customersData);
        setDrivers(driversData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateOrder = () => {
    console.log('Navigate to /orders/create'); // Placeholder for Navbar navigation
  };

  const handleViewCustomers = () => {
    console.log('Navigate to /customers'); // Placeholder for Navbar navigation
  };

  const handleViewDrivers = () => {
    console.log('Navigate to /drivers'); // Placeholder for Navbar navigation
  };

  const handelViewDocuments = (orderId) => {
    console.log(`Navigate to /orders/${orderId}/documents`); // Placeholder for Navbar navigation
  };

  const columns = [
    { field: 'order_id', headerName: 'Order ID', width: 100 },
    { field: 'customer_name', headerName: 'Customer', width: 150 },
    { field: 'shipping_method', headerName: 'Shipping Method', width: 150 },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 130,
      renderCell: (params) => (
        <Box sx={{ 
          bgcolor: params.value === 'Delivered' ? 'success.light' : params.value === 'Shipped' ? 'info.light' : 'warning.light', 
          borderRadius: 1, 
          px: 1, 
          color: 'text.primary' 
        }}>
          {params.value}
        </Box>
      ),
    },
    { field: 'created_at', headerName: 'Created At', width: 180, valueFormatter: (params) => new Date(params.value).toLocaleDateString() },
    { field: 'driver_name', headerName: 'Driver', width: 150, renderCell: (params) => params.value || 'N/A' },
    { 
      field: 'documents', 
      headerName: 'Documents', 
      width: 150,
      renderCell: (params) => (
        <Button 
          variant="outlined" 
          size="small" 
          onClick={() => handelViewDocuments(params.row.order_id)} 
        >
          View
        </Button>
      ),
    },
  ];

  const summaryData = [
    { title: 'Total Orders', value: orders.length },
    { title: 'Pending Orders', value: orders.filter(o => o.status === 'Pending').length },
    { title: 'Shipped Orders', value: orders.filter(o => o.status === 'Shipped').length },
    { title: 'Delivered Orders', value: orders.filter(o => o.status === 'Delivered').length },
    { title: 'Customers', value: customers.length },
    { title: 'Available Drivers', value: drivers.filter(d => d.availability_status === 'Available').length },
  ];

  if (status === 'loading') return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;

  if (!session?.user || !['admin', 'manager', 'preprocessing'].includes(session.user.role)) {
    return <Typography variant="h6" sx={{ textAlign: 'center', mt: 4 }}>Access Denied</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>OMS Dashboard</Typography>
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {summaryData.map((item, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card>
              <CardContent>
                <Typography variant="h6">{item.title}</Typography>
                <Typography variant="h4">{loading ? <CircularProgress size={24} /> : item.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mb: 4 }}>
        <Button variant="contained" color="primary" onClick={handleCreateOrder} sx={{ mr: 2 }}>
          Create New Order
        </Button>
        <Button variant="outlined" onClick={handleViewCustomers} sx={{ mr: 2 }}>
          View Customers
        </Button>
        <Button variant="outlined" onClick={handleViewDrivers}>
          View Drivers
        </Button>
      </Box>

      {/* Orders Table */}
      <Paper elevation={3}>
        <Typography variant="h6" sx={{ p: 2 }}>Recent Orders</Typography>
        <div style={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={orders}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5, 10, 20]}
            loading={loading}
            getRowId={(row) => row.order_id}
            disableSelectionOnClick
            autoHeight
          />
        </div>
      </Paper>
    </Box>
  );
};

export default Dashboard;