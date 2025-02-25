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
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { useSession } from 'next-auth/react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import dayjs from 'dayjs';

const OrderProcessing = () => {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState([]); // Ensure orders starts as an empty array
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [openSuccessModal, setOpenSuccessModal] = useState(false);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await fetch('https://processing-facility-backend.onrender.com/api/orders');
        if (!res.ok) {
          throw new Error('Failed to fetch orders: ' + (await res.text()));
        }
        const data = await res.json();
        // Ensure data is an array, default to empty array if not
        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrders([]); // Set to empty array on error to prevent undefined
        setSnackbar({ open: true, message: error.message, severity: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Handle order processing (update status, generate/upload PDFs, merge, and print)
  const handleProcessOrder = async (orderId) => {
    setLoading(true);
    setProcessing(true);
    try {
      // Fetch the current order details
      const res = await fetch(`https://processing-facility-backend.onrender.com/api/orders/${orderId}`);
      if (!res.ok) throw new Error('Failed to fetch order details: ' + (await res.text()));
      const order = await res.json();
      
      if (!order || typeof order !== 'object') {
        throw new Error('Invalid order data received');
      }

      // Update the order status to "Processing", reusing existing values for other fields
      const updateRes = await fetch(`https://processing-facility-backend.onrender.com/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Processing',
          driver_id: order.driver_id, // Reuse existing driver_id
          shipping_method: order.shipping_method, // Reuse existing shipping_method
          driver_details: order.driver_details, // Reuse existing driver_details (JSON string)
          price: order.price?.toString() || '0', // Reuse existing price, converted to string
          tax_percentage: order.tax_percentage?.toString() || '0', // Reuse existing tax_percentage, converted to string
        }),
      });

      if (!updateRes.ok) throw new Error('Failed to update order status: ' + (await updateRes.text()));
      const updatedOrder = await updateRes.json();

      // Ensure created_at is included or default to the original order's created_at if missing
      const orderWithCreatedAt = {
        ...updatedOrder,
        created_at: updatedOrder.created_at || order.created_at || null,
      };

      // Update the orders state to reflect the new status
      setOrders(orders.map(o => o.order_id === orderId ? orderWithCreatedAt : o));
      
      setSelectedOrder(orderWithCreatedAt);

      // Generate, upload, merge, and print documents
      await generateAndProcessDocuments(orderWithCreatedAt);
    } catch (error) {
      console.error('Error processing order:', error);
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    } finally {
      setLoading(false);
      setProcessing(false);
    }
  };

  // Generate, upload, merge, and print documents
  const generateAndProcessDocuments = async (order) => {
    if (!order) return;

    try {
      // Generate SPK, SPM, and DO PDFs
      const spkDoc = generateSPKPDF(order);
      const spmDoc = generateSPMPDF(order);
      const doDoc = generateDOPDF(order);

      // Convert PDFs to blobs for upload
      const spkBlob = spkDoc.output('blob');
      const spmBlob = spmDoc.output('blob');
      const doBlob = doDoc.output('blob');

      // Upload each document to Google Drive
      const uploadDocument = async (blob, type, filename) => {
        const formData = new FormData();
        formData.append('order_id', order.order_id);
        formData.append('type', type);
        formData.append('file', blob, filename);

        const res = await fetch('https://processing-facility-backend.onrender.com/api/documents/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error(`Failed to upload ${type} document: ` + (await res.text()));
        return await res.json();
      };

      // Upload individual PDFs
      await uploadDocument(spkBlob, 'SPK', `SPK_${order.order_id}.pdf`);
      await uploadDocument(spmBlob, 'SPM', `SPM_${order.order_id}.pdf`);
      await uploadDocument(doBlob, 'DO', `DO_${order.order_id}.pdf`);

      // Merge PDFs into a single document
      const mergedDoc = mergePDFs([spkDoc, spmDoc, doDoc]);

      // Convert merged PDF to blob for printing
      const mergedBlob = mergedDoc.output('blob');

      // Create a URL for the merged PDF and trigger print dialog
      const mergedUrl = URL.createObjectURL(mergedBlob);
      const printWindow = window.open(mergedUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      } else {
        throw new Error('Failed to open print window. Please allow popups for this site.');
      }

      // Clean up URL object
      setTimeout(() => {
        URL.revokeObjectURL(mergedUrl);
      }, 1000);

      // Update status to "Processed" after successful processing, reusing existing values for other fields
      const finalUpdateRes = await fetch(`https://processing-facility-backend.onrender.com/api/orders/${order.order_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Processed', // Adjust status as needed
          driver_id: order.driver_id, // Reuse existing driver_id
          shipping_method: order.shipping_method, // Reuse existing shipping_method
          driver_details: order.driver_details, // Reuse existing driver_details (JSON string)
          price: order.price?.toString() || '0', // Reuse existing price, converted to string
          tax_percentage: order.tax_percentage?.toString() || '0', // Reuse existing tax_percentage, converted to string
        }),
      });

      if (!finalUpdateRes.ok) throw new Error('Failed to update order status after processing: ' + (await finalUpdateRes.text()));
      const finalUpdatedOrder = await finalUpdateRes.json();

      // Ensure created_at is included or default to the original order's created_at if missing
      const finalOrderWithCreatedAt = {
        ...finalUpdatedOrder,
        created_at: finalUpdatedOrder.created_at || order.created_at || null,
      };

      // Update the orders state to reflect the new status
      setOrders(orders.map(o => o.order_id === order.order_id ? finalOrderWithCreatedAt : o));

      setSnackbar({ open: true, message: 'Documents generated, uploaded, merged, and print dialog shown successfully', severity: 'success' });
      setOpenSuccessModal(true);
    } catch (error) {
      console.error('Error processing documents:', error);
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    }
  };

  // Merge PDFs into a single document using jsPDF (simulating concatenation by adding pages)
  const mergePDFs = (pdfDocs) => {
    const mergedDoc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [210, 297], // A4 size
    });

    pdfDocs.forEach((doc, index) => {
      const pages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        if (index > 0 || i > 1) {
          mergedDoc.addPage(); // Add a new page for each subsequent page or document
        }
        doc.setPage(i);
        const pageContent = doc.internal.getPageContent(i);
        mergedDoc.internal.write(pageContent);
      }
    });

    return mergedDoc;
  };

  // Generate SPK PDF
  const generateSPKPDF = (order) => {
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
    doc.text(`Customer: ${order.customer_name}`, 20, 50);
    doc.text(`Date: ${dayjs().format('YYYY-MM-DD')}`, 20, 60);
    doc.text(`Shipping Method: ${order.shipping_method}`, 20, 70);
    doc.text(`Status: ${order.status}`, 20, 80); // Show current status in SPK

    doc.autoTable({
      startY: 90,
      head: [['Product', 'Quantity (kg)', 'Price (IDR)']],
      body: order.items.map(item => [
        item.product,
        item.quantity,
        item.price.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }),
      ]),
      styles: { font: 'Arial', fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
      margin: { left: 20, right: 20 },
    });

    doc.line(20, doc.lastAutoTable.finalY + 10, 190, doc.lastAutoTable.finalY + 10);
    doc.text('Prepared by:', 20, doc.lastAutoTable.finalY + 20);
    doc.text(session.user.name || '-', 20, doc.lastAutoTable.finalY + 30);

    return doc;
  };

  // Generate SPM PDF
  const generateSPMPDF = (order) => {
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
    doc.text(`Customer: ${order.customer_name}`, 20, 50);
    doc.text(`Date: ${dayjs().format('YYYY-MM-DD')}`, 20, 60);
    doc.text(`Status: ${order.status}`, 20, 70); // Show current status in SPM

    doc.autoTable({
      startY: 80,
      head: [['Product', 'Quantity (kg)', 'Required By']],
      body: order.items.map(item => [
        item.product,
        item.quantity,
        dayjs().add(7, 'days').format('YYYY-MM-DD'), // Example: 7 days from now
      ]),
      styles: { font: 'Arial', fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
      margin: { left: 20, right: 20 },
    });

    doc.line(20, doc.lastAutoTable.finalY + 10, 190, doc.lastAutoTable.finalY + 10);
    doc.text('Requested by:', 20, doc.lastAutoTable.finalY + 20);
    doc.text(session.user.name || '-', 20, doc.lastAutoTable.finalY + 30);

    return doc;
  };

  // Generate DO PDF
  const generateDOPDF = (order) => {
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
    doc.text(`Customer: ${order.customer_name}`, 20, 50);
    doc.text(`Address: ${order.address}`, 20, 60);
    doc.text(`Shipping Method: ${order.shipping_method}`, 20, 70);
    doc.text(`Driver: ${order.driver_name || JSON.parse(order.driver_details || '{}').name || 'N/A'}`, 20, 80);
    doc.text(`Status: ${order.status}`, 20, 90); // Show current status in DO

    doc.autoTable({
      startY: 100,
      head: [['Product', 'Quantity (kg)', 'Delivery Date']],
      body: order.items.map(item => [
        item.product,
        item.quantity,
        dayjs().add(14, 'days').format('YYYY-MM-DD'), // Example: 14 days from now
      ]),
      styles: { font: 'Arial', fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
      margin: { left: 20, right: 20 },
    });

    doc.line(20, doc.lastAutoTable.finalY + 10, 190, doc.lastAutoTable.finalY + 10);
    doc.text('Authorized by:', 20, doc.lastAutoTable.finalY + 20);
    doc.text(session.user.name || '-', 20, doc.lastAutoTable.finalY + 30);

    return doc;
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleCloseSuccessModal = () => {
    setOpenSuccessModal(false);
  };

  const columns = [
    { field: 'order_id', headerName: 'Order ID', width: 100, sortable: true },
    { field: 'customer_name', headerName: 'Customer Name', width: 240, sortable: true },
    { field: 'shipping_method', headerName: 'Shipping Method', width: 150, sortable: true },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 130, 
      sortable: true,
      renderCell: (params) => (
        <Box>
          {params.value}
        </Box>
      ),
    },
    { field: 'created_at', headerName: 'Created At', width: 180, sortable: true, valueFormatter: (params) => params.value ? dayjs(params.value).format('YYYY-MM-DD') : 'N/A' },
    { 
      field: 'actions', 
      headerName: 'Actions', 
      width: 150, 
      sortable: false, 
      renderCell: (params) => (
        <Button 
          variant="contained"
          size="small"
          color="primary"
          onClick={() => handleProcessOrder(params.row.order_id)}
        >
          Process Order
        </Button>
      )
    },
  ];

  const ordersRows = (orders || []).map(order => ({
    id: order?.order_id || '-',
    order_id: order?.order_id || '-',
    customer_name: order?.customer_name || '-',
    shipping_method: order?.shipping_method || '-',
    status: order?.status || 'Pending',
    created_at: order?.created_at || null, // Ensure created_at is properly handled
  }));

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
            rowHeight={30}
          />
        </CardContent>
      </Card>

      {/* Success Modal */}
      <Modal
        open={openSuccessModal}
        onClose={handleCloseSuccessModal}
        aria-labelledby="success-modal-title"
        aria-describedby="success-modal-description"
      >
        <Paper>
          <Typography 
            id="success-modal-title" 
            variant="h5" 
            gutterBottom
          >
            Success
          </Typography>
          <Typography 
            id="success-modal-description" 
            gutterBottom
          >
            SPK, SPM, and DO documents for Order ID {selectedOrder?.order_id || 'N/A'} have been generated, uploaded, merged, and the print dialog is ready.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button 
              variant="contained" 
              onClick={handleCloseSuccessModal} 
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