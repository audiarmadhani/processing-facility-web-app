"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Snackbar,
  Alert,
  Modal,
  Paper,
  Menu,
  MenuItem,
  Divider,
  Grid,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { useSession } from 'next-auth/react';
import { darken, lighten, styled } from '@mui/material/styles';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import dayjs from 'dayjs';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const getBackgroundColor = (color, theme, coefficient) => ({
  backgroundColor: darken(color, coefficient),
  ...theme.applyStyles('light', {
    backgroundColor: lighten(color, coefficient),
  }),
});

const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
  '& .super-app-theme--Pending': {
    ...getBackgroundColor(theme.palette.warning.main, theme, 0.7), // Yellow for Pending
    '&:hover': {
      ...getBackgroundColor(theme.palette.warning.main, theme, 0.6),
    },
    '&.Mui-selected': {
      ...getBackgroundColor(theme.palette.warning.main, theme, 0.5),
      '&:hover': {
        ...getBackgroundColor(theme.palette.warning.main, theme, 0.4),
      },
    },
  },
  '& .super-app-theme--Processing': {
    ...getBackgroundColor(theme.palette.success.main, theme, 0.7), // Green for Processing
    '&:hover': {
      ...getBackgroundColor(theme.palette.success.main, theme, 0.6),
    },
    '&.Mui-selected': {
      ...getBackgroundColor(theme.palette.success.main, theme, 0.5),
      '&:hover': {
        ...getBackgroundColor(theme.palette.success.main, theme, 0.4),
      },
    },
  },
  '& .super-app-theme--Rejected': {
    ...getBackgroundColor(theme.palette.error.main, theme, 0.7), // Red for Rejected
    '&:hover': {
      ...getBackgroundColor(theme.palette.error.main, theme, 0.6),
    },
    '&.Mui-selected': {
      ...getBackgroundColor(theme.palette.error.main, theme, 0.5),
      '&:hover': {
        ...getBackgroundColor(theme.palette.error.main, theme, 0.4),
      },
    },
  },
}));

const OrderProcessing = () => {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState([]); // Explicitly initialize as empty array
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [openOrderModal, setOpenOrderModal] = useState(false); // State for order details modal
  const [anchorEl, setAnchorEl] = useState(null); // For dropdown menu in Actions column

  // Fetch orders with enhanced error handling and logging
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await fetch('https://processing-facility-backend.onrender.com/api/orders', {
          headers: { 'Accept': 'application/json' }, // Ensure JSON response
        });
        if (!res.ok) {
          throw new Error('Failed to fetch orders: ' + (await res.text()));
        }
        const data = await res.json();
        console.log('Fetch Response Data:', data); // Log the response for debugging
        // Ensure data is an array, default to empty array if not
        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrders([]); // Set to empty array on error
        setSnackbar({ open: true, message: `Error fetching orders: ${error.message}`, severity: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Handle order processing with a single update to "Processing" before upload, save PDFs locally after
  const handleProcessOrder = async (orderId) => {
    setLoading(true);
    setProcessing(true);
    try {
      // Fetch the current order details with enhanced error handling
      const res = await fetch(`https://processing-facility-backend.onrender.com/api/orders/${orderId}`, {
        headers: { 'Accept': 'application/json' }, // Ensure JSON response
      });
      if (!res.ok) throw new Error('Failed to fetch order details: ' + (await res.text()));
      const data = await res.json();
      console.log('Order Fetch Response:', data); // Log the response for debugging
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid order data received');
      }
      let order = data;

      if (!order.order_id || typeof order.order_id !== 'number') {
        throw new Error('Invalid order_id fetched: ' + order.order_id);
      }

      // Update status to "Processing" before uploading documents
      const processingUpdateRes = await fetch(`https://processing-facility-backend.onrender.com/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
					customer_id: order.customer_id,
          status: 'Processing',
          driver_id: order.driver_id, // Reuse existing driver_id
          shipping_method: order.shipping_method || 'Self', // Default to 'Self' if missing
          driver_details: order.driver_details, // Reuse existing driver_details (JSON string)
          price: order.price?.toString() || '0', // Reuse existing price, converted to string
          tax_percentage: order.tax_percentage?.toString() || '0', // Reuse existing tax_percentage, converted to string
					items: order.items
        }),
      });

      if (!processingUpdateRes.ok) throw new Error('Failed to update order status to Processing: ' + (await processingUpdateRes.text()));
      const updatedProcessingOrder = await processingUpdateRes.json();
      console.log('Updated Order (Processing):', updatedProcessingOrder); // Log the updated order for debugging

      // Ensure order_id, customer_name, status, shipping_method, and items are preserved or defaulted after "Processing" update
      order = {
        ...updatedProcessingOrder,
        order_id: updatedProcessingOrder.order_id || order.order_id, // Ensure order_id is always present
				customer_id: updatedProcessingOrder.customer_id || order.customer_id,
        customer_name: updatedProcessingOrder.customer_name || order.customer_name || 'Unknown Customer', // Default if missing
        status: updatedProcessingOrder.status || 'Processing', // Should be "Processing" now
        shipping_method: updatedProcessingOrder.shipping_method || order.shipping_method || 'Self', // Default to 'Self' if missing
        items: updatedProcessingOrder.items || order.items, // Default to empty array if missing
        created_at: updatedProcessingOrder.created_at || order.created_at || null,
      };

      if (!order.order_id || typeof order.order_id !== 'number') {
        throw new Error('Invalid order_id after Processing update: ' + order.order_id);
      }

      // Generate SPK, SPM, and DO PDFs
      const spkDoc = generateSPKPDF({ ...order, customerName: order.customer_name, status: order.status, shippingMethod: order.shipping_method, items: order.items });
      const spmDoc = generateSPMPDF({ ...order, customerName: order.customer_name, status: order.status, shippingMethod: order.shipping_method, items: order.items });
      const doDoc = generateDOPDF({ ...order, customerName: order.customer_name, status: order.status, shippingMethod: order.shipping_method, items: order.items });

      // Save PDFs locally using jsPDF.save()
      spkDoc.save(`SPK_${String(order.order_id).padStart(4, '0')}_${new Date().toISOString().split('T')[0]}.pdf`);
      spmDoc.save(`SPM_${String(order.order_id).padStart(4, '0')}_${new Date().toISOString().split('T')[0]}.pdf`);
      doDoc.save(`DO_${String(order.order_id).padStart(4, '0')}_${new Date().toISOString().split('T')[0]}.pdf`);

      // Upload each document to Google Drive
      const uploadDocument = async (doc, type, filename) => {
        const blob = doc.output('blob');
        const formData = new FormData();
        formData.append('order_id', orderId.toString()); // Use validated orderId as string
        formData.append('type', type);
        formData.append('file', blob, filename);

        const res = await fetch('https://processing-facility-backend.onrender.com/api/documents/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error(`Failed to upload ${type} document: ' + (await res.text())`);
        return await res.json(); // No need to return drive_url since we’re saving locally
      };

      // Upload PDFs to Google Drive (without storing URLs for download)
      await Promise.all([
        uploadDocument(spkDoc, 'SPK', `SPK_${String(order.order_id).padStart(4, '0')}.pdf`),
        uploadDocument(spmDoc, 'SPM', `SPM_${String(order.order_id).padStart(4, '0')}.pdf`),
        uploadDocument(doDoc, 'DO', `DO_${String(order.order_id).padStart(4, '0')}.pdf`),
      ]);

      // Update the orders state safely with the current "Processing" status
      setOrders(prevOrders => prevOrders.map(o => o.order_id === orderId ? order : o));

      setSelectedOrder(order);

      setSnackbar({ open: true, message: 'Documents generated, uploaded to Google Drive, and saved locally successfully', severity: 'success' });
    } catch (error) {
      console.error('Error processing order:', error);
      setSnackbar({ open: true, message: `Error processing order: ${error.message}`, severity: 'error' });
    } finally {
      setLoading(false);
      setProcessing(false);
    }
  };

  // Handle showing order details in modal
  const handleOpenOrderModal = async (order) => {
    setLoading(true); // Show loading state while fetching
    try {
      const orderRes = await fetch(`https://processing-facility-backend.onrender.com/api/orders/${order.order_id}`);
      if (!orderRes.ok) throw new Error('Failed to fetch order details');
      const fullOrder = await orderRes.json(); // Fetch the full order with items
      setSelectedOrder(fullOrder); // Set the full order data, including items
      setOpenOrderModal(true);
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    } finally {
      setLoading(false); // Hide loading state
    }
  };

  const handleCloseOrderModal = () => {
    setOpenOrderModal(false);
    setSelectedOrder(null);
  };

  // Regenerate and download PDFs from modal
  const handleDownloadDocuments = () => {
    if (!selectedOrder) return;

    try {
      const spkDoc = generateSPKPDF({
        ...selectedOrder,
        customerName: selectedOrder.customer_name || 'Unknown Customer',
        status: selectedOrder.status || 'Processing',
        shippingMethod: selectedOrder.shipping_method || 'Self',
        items: selectedOrder.items || [],
      });
      const spmDoc = generateSPMPDF({
        ...selectedOrder,
        customerName: selectedOrder.customer_name || 'Unknown Customer',
        status: selectedOrder.status || 'Processing',
        shippingMethod: selectedOrder.shipping_method || 'Self',
        items: selectedOrder.items || [],
      });
      const doDoc = generateDOPDF({
        ...selectedOrder,
        customerName: selectedOrder.customer_name || 'Unknown Customer',
        status: selectedOrder.status || 'Processing',
        shippingMethod: selectedOrder.shipping_method || 'Self',
        items: selectedOrder.items || [],
      });

      // Save PDFs locally using jsPDF.save()
      spkDoc.save(`SPK_${String(selectedOrder.order_id).padStart(4, '0')}_${new Date().toISOString().split('T')[0]}.pdf`);
      spmDoc.save(`SPM_${String(selectedOrder.order_id).padStart(4, '0')}_${new Date().toISOString().split('T')[0]}.pdf`);
      doDoc.save(`DO_${String(selectedOrder.order_id).padStart(4, '0')}_${new Date().toISOString().split('T')[0]}.pdf`);

      setSnackbar({ open: true, message: 'Documents regenerated and saved locally successfully', severity: 'success' });
    } catch (error) {
      console.error('Error regenerating documents:', error);
      setSnackbar({ open: true, message: `Error regenerating documents: ${error.message}`, severity: 'error' });
    }
  };

  // Handle actions dropdown (Process or Reject)
  const handleActionsClick = (event, orderId) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrder(orders.find(order => order.order_id === orderId) || null);
  };

  const handleActionsClose = () => {
    setAnchorEl(null);
    setSelectedOrder(null);
  };

  const handleProcess = async () => {
    if (!selectedOrder) return;
    await handleProcessOrder(selectedOrder.order_id);
    handleActionsClose();
  };

  const handleReject = async () => {
    if (!selectedOrder) return;
    try {
      const rejectUpdateRes = await fetch(`https://processing-facility-backend.onrender.com/api/orders/${selectedOrder.order_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
					customer_id: selectedOrder.customer_id,
          status: 'Rejected',
          driver_id: selectedOrder.driver_id, // Reuse existing driver_id
          shipping_method: selectedOrder.shipping_method || 'Self', // Default to 'Self' if missing
          driver_details: selectedOrder.driver_details, // Reuse existing driver_details (JSON string)
          price: selectedOrder.price?.toString() || '0', // Reuse existing price, converted to string
          tax_percentage: selectedOrder.tax_percentage?.toString() || '0', // Reuse existing tax_percentage, converted to string
        }),
      });

      if (!rejectUpdateRes.ok) throw new Error('Failed to reject order: ' + (await rejectUpdateRes.text()));
      const updatedOrder = await rejectUpdateRes.json();
      console.log('Rejected Order:', updatedOrder);

      // Update the orders state safely with the "Rejected" status
      setOrders(prevOrders => prevOrders.map(o => o.order_id === selectedOrder.order_id ? updatedOrder : o));

      setSnackbar({ open: true, message: 'Order rejected successfully', severity: 'success' });
    } catch (error) {
      console.error('Error rejecting order:', error);
      setSnackbar({ open: true, message: `Error rejecting order: ${error.message}`, severity: 'error' });
    }
    handleActionsClose();
  };

  // Generate SPK PDF
  const generateSPKPDF = (order) => {
    if (!order || typeof order !== 'object') {
      throw new Error('Invalid order object for SPK PDF generation');
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [210, 297], // A4 size
    });

    doc.setFont('Arial', 'bold');
    doc.setFontSize(16);
    doc.text('Surat Perintah Kerja (SPK)', 105, 20, { align: 'center' });
    doc.setFont('Arial', 'normal');
    doc.setFontSize(12);

    doc.text(`Order ID: ${String(order.order_id).padStart(4, '0')}`, 20, 40);
    doc.text(`Customer: ${order.customerName || 'Unknown Customer'}`, 20, 50);
    doc.text(`Date: ${dayjs().format('YYYY-MM-DD')}`, 20, 60);
    doc.text(`Shipping Method: ${order.shippingMethod || 'Self'}`, 20, 70);
    doc.text(`Status: ${order.status || 'Pending'}`, 20, 80); // Show current status in SPK

    if (!order.items || !Array.isArray(order.items)) {
      doc.text('No items available', 20, 90);
    } else {
      doc.autoTable({
        startY: 90,
        head: [['Product', 'Quantity (kg)', 'Price (IDR)']],
        body: order.items.map(item => [
          item.product || 'N/A',
          item.quantity || 0,
          (item.price || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }),
        ]),
        styles: { font: 'Arial', fontSize: 10, cellPadding: 2 },
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
        margin: { left: 20, right: 20 },
      });
    }

    doc.line(20, doc.lastAutoTable?.finalY + 10 || 100, 190, doc.lastAutoTable?.finalY + 10 || 100);
    doc.text('Prepared by:', 20, doc.lastAutoTable?.finalY + 20 || 110);
    doc.text(session.user.name || '-', 20, doc.lastAutoTable?.finalY + 30 || 120);

    return doc;
  };

  // Generate SPM PDF
  const generateSPMPDF = (order) => {
    if (!order || typeof order !== 'object') {
      throw new Error('Invalid order object for SPM PDF generation');
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [210, 297], // A4 size
    });

    doc.setFont('Arial', 'bold');
    doc.setFontSize(16);
    doc.text('Surat Permintaan Material (SPM)', 105, 20, { align: 'center' });
    doc.setFont('Arial', 'normal');
    doc.setFontSize(12);

    doc.text(`Order ID: ${String(order.order_id).padStart(4, '0')}`, 20, 40);
    doc.text(`Customer: ${order.customerName || 'Unknown Customer'}`, 20, 50);
    doc.text(`Date: ${dayjs().format('YYYY-MM-DD')}`, 20, 60);
    doc.text(`Status: ${order.status || 'Pending'}`, 20, 70); // Show current status in SPM

    if (!order.items || !Array.isArray(order.items)) {
      doc.text('No items available', 20, 80);
    } else {
      doc.autoTable({
        startY: 80,
        head: [['Product', 'Quantity (kg)', 'Required By']],
        body: order.items.map(item => [
          item.product || 'N/A',
          item.quantity || 0,
          dayjs().add(7, 'days').format('YYYY-MM-DD'), // Example: 7 days from now
        ]),
        styles: { font: 'Arial', fontSize: 10, cellPadding: 2 },
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
        margin: { left: 20, right: 20 },
      });
    }

    doc.line(20, doc.lastAutoTable?.finalY + 10 || 90, 190, doc.lastAutoTable?.finalY + 10 || 90);
    doc.text('Requested by:', 20, doc.lastAutoTable?.finalY + 20 || 100);
    doc.text(session.user.name || '-', 20, doc.lastAutoTable?.finalY + 30 || 110);

    return doc;
  };

  // Generate DO PDF
  const generateDOPDF = (order) => {
    if (!order || typeof order !== 'object') {
      throw new Error('Invalid order object for DO PDF generation');
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [210, 297], // A4 size
    });

    doc.setFont('Arial', 'bold');
    doc.setFontSize(16);
    doc.text('Delivery Order (DO)', 105, 20, { align: 'center' });
    doc.setFont('Arial', 'normal');
    doc.setFontSize(12);

    doc.text(`Order ID: ${String(order.order_id).padStart(4, '0')}`, 20, 40);
    doc.text(`Customer: ${order.customerName || 'Unknown Customer'}`, 20, 50);
    doc.text(`Address: ${order.customer_address || 'N/A'}`, 20, 60);
    doc.text(`Shipping Method: ${order.shippingMethod || 'Self'}`, 20, 70);
    doc.text(`Driver: ${order.driver_name || JSON.parse(order.driver_details || '{}').name || 'N/A'}`, 20, 80);
    doc.text(`Status: ${order.status || 'Pending'}`, 20, 90); // Show current status in DO

    if (!order.items || !Array.isArray(order.items)) {
      doc.text('No items available', 20, 100);
    } else {
      doc.autoTable({
        startY: 100,
        head: [['Product', 'Quantity (kg)', 'Delivery Date']],
        body: order.items.map(item => [
          item.product || 'N/A',
          item.quantity || 0,
          dayjs().add(14, 'days').format('YYYY-MM-DD'), // Example: 14 days from now
        ]),
        styles: { font: 'Arial', fontSize: 10, cellPadding: 2 },
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
        margin: { left: 20, right: 20 },
      });
    }

    doc.line(20, doc.lastAutoTable?.finalY + 10 || 110, 190, doc.lastAutoTable?.finalY + 10 || 110);
    doc.text('Authorized by:', 20, doc.lastAutoTable?.finalY + 20 || 120);
    doc.text(session.user.name || '-', 20, doc.lastAutoTable?.finalY + 30 || 130);

    return doc;
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const columns = [
    { field: 'order_id', headerName: 'Order ID', width: 80, sortable: true },
    { field: 'customer_name', headerName: 'Customer Name', width: 240, sortable: true },
    { 
			field: 'status', 
			headerName: 'Status', 
			width: 130, 
			sortable: true,
			renderCell: (params) => (
				<Button
					variant="contained" // Use contained variant for a filled button
					size="small"
					sx={{
						minWidth: 100,
						padding: '4px 16px',
						borderRadius: '16px', // Pill shape
						backgroundColor: params.value === 'Pending' ? '#f57c00' : params.value === 'Processing' ? '#4caf50' : params.value === 'Rejected' ? '#d32f2f' : '#757575', // Darker colors for background (orange for Pending, green for Processing, red for Rejected, gray for default)
						color: '#fff', // White text for contrast against darker backgrounds
						fontSize: '0.875rem',
						textTransform: 'none',
						alignItems: 'center',
						'&:hover': {
							backgroundColor: params.value === 'Pending' ? '#f57c00' : params.value === 'Processing' ? '#4caf50' : params.value === 'Rejected' ? '#d32f2f' : '#757575', // Maintain background color on hover
						},
					}}
				>
					{params.value}
				</Button>
			),
		},
    { 
        field: 'actions', 
        headerName: 'Actions', 
        width: 120, 
        sortable: false, 
        renderCell: (params) => (
          <div>
            <Button
              variant="contained"
              size="small"
              color="primary"
              aria-controls={`actions-menu-${params.row.order_id}`}
              aria-haspopup="true"
              onClick={(event) => handleActionsClick(event, params.row.order_id)}
              sx={{
                minWidth: 90,
                borderRadius: '16px', // Pill shape
                padding: '4px 16px',
                fontSize: '0.875rem',
								textTransform: 'none',
								alignItems: 'center',
                '&:hover': {
                  borderColor: theme => theme.palette.primary.main,
                  backgroundColor: 'rgb(47, 107, 210)', // Light blue background on hover
                },
                gap: 0, // Space between text and icon
              }}
            >
              Actions
              <KeyboardArrowDownIcon fontSize="small" />
            </Button>
            <Menu
              id={`actions-menu-${params.row.order_id}`}
              anchorEl={anchorEl}
              open={Boolean(anchorEl) && selectedOrder?.order_id === params.row.order_id}
              onClose={handleActionsClose}
            >
              <MenuItem onClick={handleProcess}>Process Order</MenuItem>
              <MenuItem onClick={handleReject}>Reject Order</MenuItem>
            </Menu>
          </div>
        ),
    },
    { 
      field: 'details', 
      headerName: 'Details', 
      width: 140, 
      sortable: false, 
      renderCell: (params) => (
        <Button
          variant="contained"
          size="small"
          color="secondary"
          onClick={() => handleOpenOrderModal(params.row)}
          sx={{
            height: '32px', // Adjusted for pill shape
            minWidth: '90px',
            padding: '4px 16px',
            borderRadius: '16px', // Pill shape
            fontSize: '0.875rem',
            textTransform: 'none',
						alignItems: 'center',
            '&:hover': {
              borderColor: theme => theme.palette.secondary.main,
              backgroundColor: 'rgb(163, 124, 175)', // Light gray background on hover
            },
          }}
        >
          View Details
        </Button>
      ),
    },
    { field: 'created_at', headerName: 'Created At', width: 180, sortable: true }, // Removed valueFormatter
  ];

  // Ensure ordersRows handles undefined or null orders safely with additional logging
  const ordersRows = Array.isArray(orders) ? orders.map(order => {
    console.log('Mapping order:', order); // Log each order being mapped for debugging
    return {
      id: order?.order_id || '-',
      order_id: order?.order_id || '-',
      customer_name: order?.customer_name || '-',
      status: order?.status || 'Pending',
      created_at: order?.created_at || null, // Removed valueFormatter
    };
  }) : [];

  if (status === 'loading') return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;

  if (!session?.user || !['admin', 'manager', 'preprocessing'].includes(session.user.role)) {
    return <Typography variant="h6" sx={{ textAlign: 'center', mt: 4 }}>Access Denied</Typography>;
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>Order Processing</Typography>
      {/* {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )} */}
      <Card variant="outlined">
        <CardContent>
          <StyledDataGrid
            rows={ordersRows}
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
            rowHeight={45} // Increased row height to accommodate buttons
            getRowClassName={(params) => `super-app-theme--${params.row.status}`}
          />
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      <Modal
        open={openOrderModal}
        onClose={handleCloseOrderModal}
        aria-labelledby="order-details-modal-title"
        aria-describedby="order-details-modal-description"
      >
        <Paper sx={{ 
          p: 3, 
          maxWidth: 600, 
          maxHeight: '80vh', 
          overflowY: 'auto', 
          mx: 'auto', 
          mt: '5vh', 
          borderRadius: 2, 
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
                      borderBottom: '1px solid #e0e0e0',
                      pb: 1,
                    }}
                  >
                    Customer Information
                  </Typography>
                  <Box sx={{ pl: 1 }}>
                    <Typography variant="body2"><strong>Name:</strong> {selectedOrder.customer_name || 'N/A'}</Typography>
                    <Typography variant="body2"><strong>Address:</strong> {selectedOrder.customer_address || 'N/A'}</Typography>
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
                      borderBottom: '1px solid #e0e0e0',
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
                    borderBottom: '1px solid #e0e0e0',
                    pb: 1,
                  }}
                >
                  Items Ordered
                </Typography>
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  <Box sx={{ pl: 1 }}>
                    {selectedOrder.items.map((item, index) => (
                      <Box key={index} sx={{ mb: 1, pl: 2, borderBottom: '1px dashed #e0e0e0', pb: 1 }}>
                        <Typography variant="body2"><strong>Product:</strong> {item.product || 'N/A'}</Typography>
                        <Typography variant="body2"><strong>Quantity (kg):</strong> {item.quantity || '0'}</Typography>
                        <Typography variant="body2"><strong>Price per Unit (IDR):</strong> {item.price ? Number(item.price).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }) : '0 IDR'}</Typography>
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
                    <Typography variant="body2"><strong>Subtotal (IDR):</strong> {selectedOrder.price ? Number(selectedOrder.price).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }) : '0 IDR'}</Typography>
                    <Typography variant="body2"><strong>Tax ({selectedOrder.tax_percentage ? `${selectedOrder.tax_percentage}%` : '0%'}):</strong> {selectedOrder.tax ? Number(selectedOrder.tax).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }) : '0 IDR'}</Typography>
                    <Typography variant="body2"><strong>Grand Total (IDR):</strong> {selectedOrder.grand_total ? Number(selectedOrder.grand_total).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }) : '0 IDR'}</Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* Download Documents Button */}
                <Button 
                  variant="contained" 
                  onClick={handleDownloadDocuments} 
                  sx={{ 
                    mt: 2, 
                    width: '100%', 
                  }}
                >
                  Download Documents
                </Button>
              </Box>

              <Button 
                variant="contained" 
                onClick={handleCloseOrderModal} 
                sx={{ 
                  mt: 2, 
                  width: '100%', 
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

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OrderProcessing;