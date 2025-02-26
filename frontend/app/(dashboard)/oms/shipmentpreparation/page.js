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
import { darken, lighten, styled } from '@mui/material/styles';
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

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Surat Jalan', 105, 20, { align: 'center' });
    doc.setFont('Helvetica', 'normal');
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
        styles: { font: 'Helvetica', fontSize: 10, cellPadding: 2 },
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

		// Set fonts and sizes
		doc.setFont('Helvetica', 'bold');
		doc.setFontSize(12);

		// Header: Company Name and Document Title
		doc.text('PT. BERKAS TUAIAN MELIMPAH', 105, 22, { align: 'center' });
		doc.text('BERITA ACARA SERAH TERIMA (BAST)', 105, 30, { align: 'center' });
		doc.setFontSize(10);
		doc.text(`Nomor: BAST/${order.order_id}/${dayjs().format('YYYY')}`, 105, 40, { align: 'center' });

		// Document Information
		doc.setFont('Helvetica', 'normal');
		doc.text(`Pada hari ini, ${dayjs().locale('id').format('dddd')}, tanggal ${dayjs().locale('id').format('DD MMMM YYYY')}, kami yang bertanda tangan di bawah ini:`, 20, 50);

		// Party 1 (Sender/Company)
		doc.text('Nama', 20, 60);
		doc.text(':', 40, 60);
		doc.text(`PT. Berkas Tuaian Melimpah`, 45, 60); // Match OCR content

		doc.text('Alamat', 20, 65);
		doc.text(':', 40, 65);
		doc.text('Jl. Lintas Gunungtua, Padangsidimpuan, Sumatera Utara', 45, 65); // Example address, adjust as needed

		doc.text('Selanjutnya disebut PIHAK PERTAMA', 20, 70);

		// Party 2 (Receiver/Customer)
		doc.text('Nama', 20, 80);
		doc.text(':', 40, 80);
		doc.text(`PT. Berkas Tuaian Melimpah`, 45, 80); // Match OCR content

		doc.text('Alamat', 20, 85);
		doc.text(':', 40, 85);
		doc.text(`Ruko Mitra Sunter Blok B25 Lt.3. Jalan Yos Soedarso Kav. 89`, 45, 85); // Match OCR content

		doc.text('Selanjutnya disebut PIHAK KEDUA', 20, 90);

		// Statement
		doc.text('Dengan ini menyatakan bahwa PIHAK PERTAMA telah menyerahkan kepada PIHAK KEDUA berupa:', 20, 100);

		// Items Table (Updated to match OCR, removing Merk Barang column)
		doc.autoTable({
			startY: 110,
			head: [['No.', 'Jenis Barang', 'Jumlah', 'Keterangan']],
			body: order.items.map((item, index) => [
				(index + 1).toString(),
				item.product || 'N/A',
				`${item.quantity || 0} (kg)`, // Match OCR format ($10000.00(kg) → simplified to numeric with kg)
				'Barang Pesanan Pelanggan', // Description, match OCR
			]),
			styles: { font: 'Helvetica', fontSize: 8, cellPadding: 1.5 },
			headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
			margin: { left: 20, right: 20 },
		});

		// Purpose/Usage Statement
		const tableEndY = doc.lastAutoTable.finalY;
		doc.text('Untuk diserahkan kepada pelanggan PT. Berkas Tuaian Melimpah sebagai barang pesanan.', 20, tableEndY + 10);
		doc.text('Demikian Berita Acara Serah Terima Barang ini dibuat untuk dapat dipergunakan sebagaimana mestinya.', 20, tableEndY + 15);

		// Signatures
		doc.setFont('Helvetica', 'bold');
		doc.text('PIHAK PERTAMA', 30, tableEndY + 30);
		doc.text('PIHAK KEDUA', 100, tableEndY + 30);
	
		doc.setFont('Helvetica', 'normal');
		doc.text(`${session.user.name || 'Staff PT. Berkas Tuaian Melimpah'}`, 30, tableEndY + 60);
		doc.text(`${order.customerName || 'Unknown Customer'}`, 100, tableEndY + 60);

		// Optional Notes (e.g., inventory note)
		doc.text('NB. Barang tersebut merupakan barang pesanan PT. Berkas Tuaian Melimpah yang telah disetujui oleh pelanggan.', 20, tableEndY + 140);

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
      width: 200, 
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
              borderRadius: '16px', // Pill shape
							padding: '4px 16px',
              fontSize: '0.875rem',
              textTransform: 'none',
              alignItems: 'center',
							height: '32px', // Adjusted for pill shape
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