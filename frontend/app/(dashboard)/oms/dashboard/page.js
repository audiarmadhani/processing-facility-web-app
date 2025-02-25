"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Snackbar,
  Alert,
  Modal,
  Paper,
  Divider,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation'; // For navigation in App Router
import dayjs from 'dayjs';

const Dashboard = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [openOrderModal, setOpenOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rowModesModel, setRowModesModel] = useState({});

  // Fetch data
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
        setSnackbar({ open: true, message: err.message, severity: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle navigation
  const handleCreateOrder = () => {
    router.push('/orders/create');
  };

  const handleViewCustomers = () => {
    router.push('/customers');
  };

  const handleViewDrivers = () => {
    router.push('/drivers');
  };

  const handleViewDocuments = (orderId) => {
    router.push(`/orders/${orderId}/documents`);
  };

  // Handle opening order details modal
  const handleOpenOrderModal = async (orderId) => {
    setLoading(true);
    try {
      const res = await fetch(`https://processing-facility-backend.onrender.com/api/orders/${orderId}`);
      if (!res.ok) throw new Error('Failed to fetch order details');
      const fullOrder = await res.json();
      setSelectedOrder(fullOrder);
      setOpenOrderModal(true);
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseOrderModal = () => {
    setOpenOrderModal(false);
    setSelectedOrder(null);
  };

  // Handle DataGrid row editing (if needed, though not implemented here for simplicity)
  const handleRowEditStart = (params, event) => {
    event.defaultMuiPrevented = true;
  };

  const handleRowEditStop = (params, event) => {
    event.defaultMuiPrevented = true;
  };

  const handleEditRowsModelChange = (model) => {
    setRowModesModel(model);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const columns = [
    { field: 'order_id', headerName: 'Order ID', width: 100, sortable: true },
    { field: 'customer_name', headerName: 'Customer', width: 150, sortable: true },
    { field: 'shipping_method', headerName: 'Shipping Method', width: 150, sortable: true },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 130, 
      sortable: true,
      renderCell: (params) => (
        <Box sx={{ 
          bgcolor: params.value === 'Delivered' ? 'success.light' : params.value === 'Shipped' ? 'info.light' : 'warning.light', 
          px: 1, 
          color: 'text.primary' 
        }}>
          {params.value}
        </Box>
      ),
    },
    { field: 'created_at', headerName: 'Created At', width: 180, sortable: true, valueFormatter: (params) => params.value ? dayjs(params.value).format('YYYY-MM-DD') : '-' },
    { field: 'driver_name', headerName: 'Driver', width: 150, sortable: true, renderCell: (params) => params.value || 'N/A' },
    { 
      field: 'details', 
      headerName: 'Details', 
      width: 120, 
      sortable: false, 
      renderCell: (params) => (
        <Button 
          variant="outlined" 
          size="small"
          onClick={() => handleOpenOrderModal(params.row.order_id)}
          sx={{ 
            height: '20px', 
            minWidth: '80px', 
            padding: '0 8px', 
            fontSize: '0.75rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
          }}
        >
          View Details
        </Button>
      )
    },
    { 
      field: 'documents', 
      headerName: 'Documents', 
      width: 150, 
      sortable: false, 
      renderCell: (params) => (
        <Button 
          variant="outlined" 
          size="small" 
          onClick={() => handleViewDocuments(params.row.order_id)} 
          sx={{ 
            height: '20px', 
            minWidth: '80px', 
            padding: '0 8px', 
            fontSize: '0.75rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
          }}
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
      <Typography variant="h4" gutterBottom >OMS Dashboard</Typography>
      {error && (
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      )}

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {summaryData.map((item, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" >{item.title}</Typography>
                <Typography variant="h4" >
                  {loading ? <CircularProgress size={24} /> : item.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {['admin', 'manager'].includes(session.user.role) && (
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleCreateOrder} 
            sx={{ mb: 2 }}
          >
            Create New Order
          </Button>
        )}
        <Button 
          variant="outlined" 
          onClick={handleViewCustomers} 
          sx={{ mb: 2 }}
        >
          View Customers
        </Button>
        <Button 
          variant="outlined" 
          onClick={handleViewDrivers} 
          sx={{ mb: 2 }}
        >
          View Drivers
        </Button>
      </Box>

      {/* Orders Table */}
      <Paper elevation={3} sx={{ overflow: 'hidden' }}>
        <Typography variant="h6" sx={{ p: 2 }}>Recent Orders</Typography>
        <Box sx={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={orders}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5, 10, 20]}
            loading={loading}
            getRowId={(row) => row.order_id}
            disableSelectionOnClick
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: { showQuickFilter: true },
            }}
            autosizeOnMount
            autosizeOptions={{
              includeHeaders: true,
              includeOutliers: true,
              expand: true,
            }}
            rowHeight={27}
            sx={{ border: 'none' }}
          />
        </Box>
      </Paper>

      {/* Order Details Modal */}
      <Modal
        open={openOrderModal}
        onClose={handleCloseOrderModal}
        aria-labelledby="order-details-modal-title"
        aria-describedby="order-details-modal-description"
      >
        <Paper sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          p: 3, 
          maxWidth: 600, 
          maxHeight: '80vh', 
          overflowY: 'auto', 
          boxShadow: 24, 
        }}>
          {loading ? (
            <CircularProgress sx={{ display: 'block', mx: 'auto' }} />
          ) : selectedOrder ? (
            <Box>
              <Typography 
                variant="h5" 
                id="order-details-modal-title" 
                gutterBottom 
                sx={{ 
                  textAlign: 'center', 
                  fontWeight: 'bold', 
                  mb: 2,
                }}
              >
                Order Details - Order ID: {selectedOrder.order_id || 'N/A'}
              </Typography>

              {/* Header Information */}
              <Box sx={{ mb: 3 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    textAlign: 'center', 
                    fontStyle: 'italic', 
                    mb: 1 
                  }}
                >
                  PT. Berkas Tuaian Melimpah
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    textAlign: 'center', 
                    mb: 1 
                  }}
                >
                  Date: {dayjs().format('YYYY-MM-DD')}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    textAlign: 'center', 
                    mb: 1 
                  }}
                >
                  Time: {dayjs().format('HH:mm:ss')}
                </Typography>
                <Divider sx={{ my: 1 }} />
              </Box>

              {/* Two-Column Layout for Customer and Shipping Information */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {/* Customer Information (Left Column) */}
                <Grid item xs={6}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontWeight: 'bold', 
                      mb: 1,
                      pb: 1,
                    }}
                  >
                    Customer Information
                  </Typography>
                  <Box sx={{ pl: 1 }}>
                    <Typography variant="body2"><strong>Name:</strong> {selectedOrder.customer_name || 'N/A'}</Typography>
                    <Typography variant="body2"><strong>Address:</strong> {selectedOrder.address || 'N/A'}</Typography>
                    <Typography variant="body2"><strong>Phone:</strong> {selectedOrder.customer_phone || 'N/A'}</Typography>
                    <Typography variant="body2"><strong>Email:</strong> {selectedOrder.customer_email || 'N/A'}</Typography>
                    <Typography variant="body2"><strong>Country:</strong> {selectedOrder.customer_country || 'N/A'}</Typography>
                    <Typography variant="body2"><strong>State:</strong> {selectedOrder.customer_state || 'N/A'}</Typography>
                    <Typography variant="body2"><strong>City:</strong> {selectedOrder.customer_city || 'N/A'}</Typography>
                    <Typography variant="body2"><strong>Zip Code:</strong> {selectedOrder.customer_zip_code || 'N/A'}</Typography>
                  </Box>
                </Grid>

                {/* Shipping Information (Right Column) */}
                <Grid item xs={6}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontWeight: 'bold', 
                      mb: 1,
                      pb: 1,
                    }}
                  >
                    Shipping Information
                  </Typography>
                  <Box sx={{ pl: 1 }}>
                    <Typography variant="body2"><strong>Method:</strong> {selectedOrder.shipping_method || 'N/A'}</Typography>
                    {selectedOrder.driver_id && (
                      <>
                        <Typography variant="body2"><strong>Driver Name:</strong> {selectedOrder.driver_name || 'N/A'}</Typography>
                        <Typography variant="body2"><strong>Vehicle No.:</strong> {selectedOrder.driver_vehicle_number || 'N/A'}</Typography>
                        <Typography variant="body2"><strong>Vehicle Type:</strong> {selectedOrder.driver_vehicle_type || 'N/A'}</Typography>
                        <Typography variant="body2"><strong>Max Capacity:</strong> {selectedOrder.driver_max_capacity ? `${selectedOrder.driver_max_capacity} kg` : 'N/A'}</Typography>
                      </>
                    )}
                    {selectedOrder.driver_details && (
                      <>
                        <Typography variant="body2"><strong>Driver Name:</strong> {JSON.parse(selectedOrder.driver_details).name || 'N/A'}</Typography>
                        <Typography variant="body2"><strong>Vehicle No.:</strong> {JSON.parse(selectedOrder.driver_details).vehicle_number_plate || 'N/A'}</Typography>
                        <Typography variant="body2"><strong>Vehicle Type:</strong> {JSON.parse(selectedOrder.driver_details).vehicle_type || 'N/A'}</Typography>
                        <Typography variant="body2"><strong>Max Capacity:</strong> {JSON.parse(selectedOrder.driver_details).max_capacity ? `${JSON.parse(selectedOrder.driver_details).max_capacity} kg` : 'N/A'}</Typography>
                      </>
                    )}
                  </Box>
                </Grid>
              </Grid>

              {/* Items Ordered Section */}
              <Box sx={{ mb: 3 }}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 'bold', 
                    mb: 1,
                    pb: 1,
                  }}
                >
                  Items Ordered
                </Typography>
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  <Box sx={{ pl: 1 }}>
                    {selectedOrder.items.map((item, index) => (
                      <Box key={index} sx={{ mb: 1, pl: 2, borderBottom: '1px dotted', pb: 1 }}>
                        <Typography variant="body2"><strong>Product:</strong> {item.product || 'N/A'}</Typography>
                        <Typography variant="body2"><strong>Quantity (kg):</strong> {item.quantity || '0'}</Typography>
                        <Typography variant="body2"><strong>Price per Unit (IDR):</strong> {item.price ? item.price.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }) : '0 IDR'}</Typography>
                        <Typography variant="body2"><strong>Subtotal (IDR):</strong> {(item.price * item.quantity).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }) || '0 IDR'}</Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ pl: 1 }}>No items ordered.</Typography>
                )}
              </Box>

              {/* Totals and Signatures */}
              <Box sx={{ mb: 3 }}>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2"><strong>Subtotal (IDR):</strong> {selectedOrder.subtotal ? selectedOrder.subtotal.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }) : '0 IDR'}</Typography>
                    <Typography variant="body2"><strong>Tax ({selectedOrder.tax_percentage ? `${selectedOrder.tax_percentage.toFixed(2)}%` : '0%'}):</strong> {selectedOrder.tax ? selectedOrder.tax.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }) : '0 IDR'}</Typography>
                    <Typography variant="body2"><strong>Grand Total (IDR):</strong> {selectedOrder.grand_total ? selectedOrder.grand_total.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }) : '0 IDR'}</Typography>
                  </Grid>
                  <Grid item xs={6} sx={{ textAlign: 'right' }}>
                    <Typography variant="body2">Printed on: {dayjs().format('YYYY-MM-DD HH:mm:ss')}</Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* Signatures */}
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={4} sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>_ _ _ _ _ _ _ _ _ _</Typography>
                    <Typography variant="body2">Order Staff</Typography>
                    <Typography variant="body2">{session.user.name || '-'}</Typography>
                  </Grid>
                  <Grid item xs={4} sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>_ _ _ _ _ _ _ _ _ _</Typography>
                    <Typography variant="body2">Manager</Typography>
                    <Typography variant="body2">(..................)</Typography>
                  </Grid>
                  {selectedOrder.driver_id && (
                    <Grid item xs={4} sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>_ _ _ _ _ _ _ _ _ _</Typography>
                      <Typography variant="body2">Driver</Typography>
                      <Typography variant="body2">{selectedOrder.driver_name || '-'}</Typography>
                    </Grid>
                  )}
                  {selectedOrder.driver_details && (
                    <Grid item xs={4} sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>_ _ _ _ _ _ _ _ _ _</Typography>
                      <Typography variant="body2">Driver</Typography>
                      <Typography variant="body2">{JSON.parse(selectedOrder.driver_details).name || '-'}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>

              <Button 
                variant="contained" 
                onClick={handleCloseOrderModal} 
                sx={{ 
                  mt: 3, 
                  width: '100%', 
                  backgroundColor: '#1976d2', 
                  '&:hover': { backgroundColor: '#1565c0' } 
                }}
              >
                Close
              </Button>
            </Box>
          ) : (
            <Typography variant="body1" sx={{ textAlign: 'center' }}>No order details available.</Typography>
          )}
        </Paper>
      </Modal>
    </Box>
  );
};

export default Dashboard;