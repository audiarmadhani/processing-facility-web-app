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
  Menu,
  MenuItem,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { useSession } from 'next-auth/react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import dayjs from 'dayjs';

const OrderProcessing = () => {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState([]); // Explicitly initialize as empty array
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
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
          status: 'Processing',
          driver_id: order.driver_id, // Reuse existing driver_id
          shipping_method: order.shipping_method || 'Self', // Default to 'Self' if missing
          driver_details: order.driver_details, // Reuse existing driver_details (JSON string)
          price: order.price?.toString() || '0', // Reuse existing price, converted to string
          tax_percentage: order.tax_percentage?.toString() || '0', // Reuse existing tax_percentage, converted to string
        }),
      });

      if (!processingUpdateRes.ok) throw new Error('Failed to update order status to Processing: ' + (await processingUpdateRes.text()));
      const updatedProcessingOrder = await processingUpdateRes.json();
      console.log('Updated Order (Processing):', updatedProcessingOrder); // Log the updated order for debugging

      // Ensure order_id, customer_name, status, shipping_method, and items are preserved or defaulted after "Processing" update
      order = {
        ...updatedProcessingOrder,
        order_id: updatedProcessingOrder.order_id || order.order_id, // Ensure order_id is always present
        customer_name: updatedProcessingOrder.customer_name || order.customer_name || 'Unknown Customer', // Default if missing
        status: updatedProcessingOrder.status || 'Processing', // Should be "Processing" now
        shipping_method: updatedProcessingOrder.shipping_method || order.shipping_method || 'Self', // Default to 'Self' if missing
        items: updatedProcessingOrder.items || order.items || [], // Default to empty array if missing
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
      spkDoc.save(`SPK_${order.order_id}_${new Date().toISOString().split('T')[0]}.pdf`);
      spmDoc.save(`SPM_${order.order_id}_${new Date().toISOString().split('T')[0]}.pdf`);
      doDoc.save(`DO_${order.order_id}_${new Date().toISOString().split('T')[0]}.pdf`);

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

        if (!res.ok) throw new Error(`Failed to upload ${type} document: ` + (await res.text()));
        return await res.json(); // No need to return drive_url since we’re saving locally
      };

      // Upload PDFs to Google Drive (without storing URLs for download)
      await Promise.all([
        uploadDocument(spkDoc, 'SPK', `SPK_${order.order_id}.pdf`),
        uploadDocument(spmDoc, 'SPM', `SPM_${order.order_id}.pdf`),
        uploadDocument(doDoc, 'DO', `DO_${order.order_id}.pdf`),
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
  const handleOpenDetailsModal = (order) => {
    setSelectedOrder(order);
    setOpenDetailsModal(true);
  };

  // Handle closing order details modal
  const handleCloseDetailsModal = () => {
    setOpenDetailsModal(false);
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
      spkDoc.save(`SPK_${selectedOrder.order_id}_${new Date().toISOString().split('T')[0]}.pdf`);
      spmDoc.save(`SPM_${selectedOrder.order_id}_${new Date().toISOString().split('T')[0]}.pdf`);
      doDoc.save(`DO_${selectedOrder.order_id}_${new Date().toISOString().split('T')[0]}.pdf`);

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

    doc.text(`Order ID: ${order.order_id}`, 20, 40);
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

    doc.text(`Order ID: ${order.order_id}`, 20, 40);
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

    doc.text(`Order ID: ${order.order_id}`, 20, 40);
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
    { field: 'order_id', headerName: 'Order ID', width: 100, sortable: true },
    { field: 'customer_name', headerName: 'Customer Name', width: 200, sortable: true },
    { field: 'shipping_method', headerName: 'Shipping Method', width: 150, sortable: true },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 130, 
      sortable: true,
      renderCell: (params) => (
        <Box
          sx={{
            padding: '4px 8px',
            borderRadius: '4px',
            backgroundColor: params.value === 'Pending' ? '#ffeb3b' : params.value === 'Processing' ? '#4caf50' : 'inherit', // Yellow for Pending, Green for Processing
            color: '#000',
          }}
        >
          {params.value}
        </Box>
      ),
    },
    { field: 'driver_name', headerName: 'Driver Name', width: 150, sortable: true },
    { field: 'driver_id', headerName: 'Driver ID', width: 100, sortable: true },
    { field: 'price', headerName: 'Price (IDR)', width: 120, sortable: true, valueFormatter: (params) => params.value ? Number(params.value).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }) : '0' },
    { field: 'tax_percentage', headerName: 'Tax %', width: 100, sortable: true },
    { field: 'tax', headerName: 'Tax (IDR)', width: 120, sortable: true, valueFormatter: (params) => params.value ? Number(params.value).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }) : '0' },
    { field: 'grand_total', headerName: 'Grand Total (IDR)', width: 150, sortable: true, valueFormatter: (params) => params.value ? Number(params.value).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }) : '0' },
    { field: 'driver_details', headerName: 'Driver Details', width: 200, sortable: true },
    { field: 'created_at', headerName: 'Created At', width: 180, sortable: true }, // Removed valueFormatter
    { 
      field: 'actions', 
      headerName: 'Actions', 
      width: 150, 
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
            sx={{ minWidth: 100 }} // Ensure button fits within row
          >
            Actions
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
      width: 120, 
      sortable: false, 
      renderCell: (params) => (
        <Button
          variant="contained"
          size="small"
          color="secondary"
          onClick={() => handleOpenDetailsModal(params.row)}
          sx={{ minWidth: 80 }} // Ensure button fits within row
        >
          View Details
        </Button>
      ),
    },
  ];

  // Ensure ordersRows handles undefined or null orders safely with additional logging
  const ordersRows = Array.isArray(orders) ? orders.map(order => {
    console.log('Mapping order:', order); // Log each order being mapped for debugging
    return {
      id: order?.order_id || '-',
      order_id: order?.order_id || '-',
      customer_name: order?.customer_name || '-',
      shipping_method: order?.shipping_method || 'Self', // Default to 'Self' if missing
      status: order?.status || 'Pending',
      driver_name: order?.driver_name || 'N/A',
      driver_id: order?.driver_id || 'N/A',
      price: order?.price || '0',
      tax_percentage: order?.tax_percentage || '0',
      tax: order?.tax || '0',
      grand_total: order?.grand_total || '0',
      driver_details: order?.driver_details || '{}',
      created_at: order?.created_at || null, // Removed valueFormatter
    };
  }) : [];

  if (status === 'loading') return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;

  if (!session?.user || !['admin', 'manager', 'preprocessing'].includes(session.user.role)) {
    return <Typography variant="h6">Access Denied</Typography>;
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>Order Processing</Typography>
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      <Card variant="outlined">
        <CardContent>
          <DataGrid
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
            rowHeight={50} // Increased row height to accommodate buttons
          />
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      <Modal
        open={openDetailsModal}
        onClose={handleCloseDetailsModal}
        aria-labelledby="details-modal-title"
        aria-describedby="details-modal-description"
      >
        <Paper sx={{ p: 3, maxWidth: 500, margin: 'auto', mt: 5 }}>
          <Typography id="details-modal-title" variant="h5" gutterBottom>
            Order Details - ID: {selectedOrder?.order_id || 'N/A'}
          </Typography>
          <Typography id="details-modal-description" gutterBottom>
            <strong>Customer Name:</strong> {selectedOrder?.customer_name || 'Unknown Customer'}<br />
            <strong>Status:</strong> {selectedOrder?.status || 'Pending'}<br />
            <strong>Shipping Method:</strong> {selectedOrder?.shipping_method || 'Self'}<br />
            <strong>Driver Name:</strong> {selectedOrder?.driver_name || 'N/A'}<br />
            <strong>Driver ID:</strong> {selectedOrder?.driver_id || 'N/A'}<br />
            <strong>Price:</strong> {selectedOrder?.price ? Number(selectedOrder.price).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }) : '0'}<br />
            <strong>Tax Percentage:</strong> {selectedOrder?.tax_percentage || '0'}%<br />
            <strong>Tax:</strong> {selectedOrder?.tax ? Number(selectedOrder.tax).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }) : '0'}<br />
            <strong>Grand Total:</strong> {selectedOrder?.grand_total ? Number(selectedOrder.grand_total).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }) : '0'}<br />
            <strong>Created At:</strong> {selectedOrder?.created_at || 'N/A'}<br />
            <strong>Driver Details:</strong> {selectedOrder?.driver_details ? JSON.stringify(selectedOrder.driver_details) : '{}'}<br />
            <strong>Items:</strong>
            <ul>
              {Array.isArray(selectedOrder?.items) ? selectedOrder.items.map((item, index) => (
                <li key={index}>
                  {item.product || 'N/A'} - {item.quantity || 0} kg - {item.price ? Number(item.price).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }) : '0'}
                </li>
              )) : 'No items available'}
            </ul>
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button 
              variant="contained" 
              onClick={handleDownloadDocuments}
            >
              Download Documents
            </Button>
            <Button 
              variant="contained" 
              onClick={handleCloseDetailsModal}
            >
              Close
            </Button>
          </Box>
        </Paper>
      </Modal>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OrderProcessing;