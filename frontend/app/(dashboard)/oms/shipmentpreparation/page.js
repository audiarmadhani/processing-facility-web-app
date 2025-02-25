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
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { useSession } from 'next-auth/react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import dayjs from 'dayjs';

const ShipmentPreparation = () => {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState([]); // Explicitly initialize as empty array
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [openSuccessModal, setOpenSuccessModal] = useState(false); // Optional modal for confirmation

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
        setOrders(Array.isArray(data) ? data.filter(order => order.status === 'Processing') : []); // Filter for "Processing" status
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

  // Handle generating shipment documents (Surat Jalan and BAST)
  const handleGenerateDocuments = async (orderId) => {
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

      // Generate Surat Jalan PDF
      const suratJalanDoc = generateSuratJalanPDF({ ...order, customerName: order.customer_name, status: order.status, shippingMethod: order.shipping_method, items: order.items });
      // Generate BAST PDF
      const bastDoc = generateBASTPDF({ ...order, customerName: order.customer_name, status: order.status, shippingMethod: order.shipping_method, items: order.items });

      // Save PDFs locally using jsPDF.save()
      suratJalanDoc.save(`SuratJalan_${order.order_id}_${new Date().toISOString().split('T')[0]}.pdf`);
      bastDoc.save(`BAST_${order.order_id}_${new Date().toISOString().split('T')[0]}.pdf`);

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
        uploadDocument(suratJalanDoc, 'SuratJalan', `SuratJalan_${order.order_id}.pdf`),
        uploadDocument(bastDoc, 'BAST', `BAST_${order.order_id}.pdf`),
      ]);

      // Update the orders state safely (optional, as status may remain "Processing")
      setOrders(prevOrders => prevOrders.map(o => o.order_id === orderId ? order : o));

      setSelectedOrder(order);

      setSnackbar({ open: true, message: 'Shipment documents generated, uploaded to Google Drive, and saved locally successfully', severity: 'success' });
      setOpenSuccessModal(true); // Optionally show a modal for confirmation
    } catch (error) {
      console.error('Error generating shipment documents:', error);
      setSnackbar({ open: true, message: `Error generating shipment documents: ${error.message}`, severity: 'error' });
    } finally {
      setLoading(false);
      setProcessing(false);
    }
  };

  // Generate Surat Jalan PDF
  const generateSuratJalanPDF = (order) => {
    if (!order || typeof order !== 'object') {
      throw new Error('Invalid order object for Surat Jalan PDF generation');
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [210, 297], // A4 size
    });

    doc.setFont('Arial', 'bold');
    doc.setFontSize(16);
    doc.text('Surat Jalan', 105, 20, { align: 'center' });
    doc.setFont('Arial', 'normal');
    doc.setFontSize(12);

    doc.text(`Order ID: ${order.order_id}`, 20, 40);
    doc.text(`Customer: ${order.customerName || 'Unknown Customer'}`, 20, 50);
    doc.text(`Date: ${dayjs().format('YYYY-MM-DD')}`, 20, 60);
    doc.text(`Shipping Method: ${order.shippingMethod || 'Self'}`, 20, 70);
    doc.text(`Status: ${order.status || 'Processing'}`, 20, 80); // Show current status

    if (!order.items || !Array.isArray(order.items)) {
      doc.text('No items available', 20, 90);
    } else {
      doc.autoTable({
        startY: 90,
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
    doc.text('Prepared by:', 20, doc.lastAutoTable?.finalY + 20 || 120);
    doc.text(session.user.name || '-', 20, doc.lastAutoTable?.finalY + 30 || 130);

    return doc;
  };

  // Generate BAST PDF
  const generateBASTPDF = (order) => {
    if (!order || typeof order !== 'object') {
      throw new Error('Invalid order object for BAST PDF generation');
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [210, 297], // A4 size
    });

    doc.setFont('Arial', 'bold');
    doc.setFontSize(16);
    doc.text('Berita Acara Serah Terima (BAST)', 105, 20, { align: 'center' });
    doc.setFont('Arial', 'normal');
    doc.setFontSize(12);

    doc.text(`Order ID: ${order.order_id}`, 20, 40);
    doc.text(`Customer: ${order.customerName || 'Unknown Customer'}`, 20, 50);
    doc.text(`Date: ${dayjs().format('YYYY-MM-DD')}`, 20, 60);
    doc.text(`Shipping Method: ${order.shippingMethod || 'Self'}`, 20, 70);
    doc.text(`Status: ${order.status || 'Processing'}`, 20, 80); // Show current status

    if (!order.items || !Array.isArray(order.items)) {
      doc.text('No items available', 20, 90);
    } else {
      doc.autoTable({
        startY: 90,
        head: [['Product', 'Quantity (kg)', 'Received By']],
        body: order.items.map(item => [
          item.product || 'N/A',
          item.quantity || 0,
          'Customer Signature', // Placeholder for received by
        ]),
        styles: { font: 'Arial', fontSize: 10, cellPadding: 2 },
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
        margin: { left: 20, right: 20 },
      });
    }

    doc.line(20, doc.lastAutoTable?.finalY + 10 || 110, 190, doc.lastAutoTable?.finalY + 10 || 110);
    doc.text('Prepared by:', 20, doc.lastAutoTable?.finalY + 20 || 120);
    doc.text(session.user.name || '-', 20, doc.lastAutoTable?.finalY + 30 || 130);
    doc.text('Received by:', 120, doc.lastAutoTable?.finalY + 20 || 120);
    doc.text('____________________', 120, doc.lastAutoTable?.finalY + 30 || 130); // Placeholder for signature

    return doc;
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleCloseSuccessModal = () => {
    setOpenSuccessModal(false);
    setSelectedOrder(null);
  };

  const columns = [
    { field: 'order_id', headerName: 'Order ID', width: 100, sortable: true },
    { field: 'customer_name', headerName: 'Customer Name', width: 200, sortable: true },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 150, 
      sortable: true,
      renderCell: (params) => (
        <Button
          variant="contained"
          size="small"
          disabled // Ensures the button is unclickable
          sx={{
            minWidth: 100,
            padding: '8px 16px',
            borderRadius: '16px', // Pill shape
            backgroundColor: params.value === 'Pending' ? '#f57c00' : params.value === 'Processing' ? '#4caf50' : params.value === 'Rejected' ? '#d32f2f' : '#757575', // Darker colors for background
            color: '#fff', // White text for contrast
            fontSize: '0.875rem',
            textTransform: 'none',
            display: 'flex',
            flexDirection: 'column', // Stack content vertically
            justifyContent: 'center', // Center vertically within the button
            alignItems: 'center',
            height: '100%', // Ensure the button takes full cell height
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
            onClick={(event) => handleGenerateDocuments(params.row.order_id)}
            sx={{
              minWidth: 90,
              borderRadius: '16px', // Pill shape
              padding: '8px 16px', // Increased padding for consistency
              fontSize: '0.875rem',
              textTransform: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center', // Center horizontally
              height: '100%', // Ensure the button takes full cell height
              '&:hover': {
                backgroundColor: theme => theme.palette.primary.dark, // Darker blue on hover
              },
            }}
          >
            Generate Documents
          </Button>
        </div>
      ),
    },
    { field: 'created_at', headerName: 'Created At', width: 180, sortable: true },
  ];

  // Ensure ordersRows handles undefined or null orders safely with additional logging
  const ordersRows = Array.isArray(orders) ? orders.map(order => {
    console.log('Mapping order:', order); // Log each order being mapped for debugging
    return {
      id: order?.order_id || '-',
      order_id: order?.order_id || '-',
      customer_name: order?.customer_name || '-',
      status: order?.status || 'Processing', // Default to "Processing" for this page
      created_at: order?.created_at || null, // Removed valueFormatter
    };
  }) : [];

  if (status === 'loading') return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;

  if (!session?.user || !['admin', 'manager', 'preprocessing'].includes(session.user.role)) {
    return <Typography variant="h6" sx={{ textAlign: 'center', mt: 4 }}>Access Denied</Typography>;
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>Shipment Preparation</Typography>
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

      {/* Success Modal (optional) */}
      <Modal
        open={openSuccessModal}
        onClose={handleCloseSuccessModal}
        aria-labelledby="success-modal-title"
        aria-describedby="success-modal-description"
      >
        <Paper sx={{ p: 3, maxWidth: 400, margin: 'auto', mt: 5 }}>
          <Typography id="success-modal-title" variant="h5" gutterBottom>
            Success
          </Typography>
          <Typography id="success-modal-description" gutterBottom>
            Shipment documents for Order ID {selectedOrder?.order_id || 'N/A'} have been generated, uploaded to Google Drive, and saved locally.
          </Typography>
          <Button variant="contained" onClick={handleCloseSuccessModal} sx={{ mt: 2 }}>
            Close
          </Button>
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

export default ShipmentPreparation;