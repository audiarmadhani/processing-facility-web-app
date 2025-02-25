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

		// Set fonts and sizes
		doc.setFont('Helvetica', 'bold');
		doc.setFontSize(12);

		// Header: Company Name and Document Title
		doc.text('PT. BERKAS TUAIAN MELIMPAH', 105, 20, { align: 'center' });
		doc.text('SURAT JALAN', 105, 30, { align: 'center' });
		doc.setFontSize(10);
		doc.text(`No. Surat Jalan: SJ/${order.order_id}/${dayjs().format('YYYY')}`, 20, 40); // Match invoice number style from example
		doc.text(`Expedisi: ${order.shippingMethod || 'Self'}`, 150, 40, { align: 'right' }); // Right-aligned, like "Tanggal" in example
		doc.text(`Tanggal: ${dayjs().locale('id').format('DD MMMM YYYY')}`, 150, 45, { align: 'right' }); // Indonesian date format

		// Sender and Receiver Information
		doc.text('Kepada Yth.', 20, 55);
		doc.text(`${order.customerName || 'Unknown Customer'}`, 45, 55);
		doc.text('Alamat:', 20, 60);
		doc.text(`${order.customer_address || 'N/A'}`, 45, 60);
		doc.text('Telp:', 20, 65);
		doc.text('N/A', 45, 65); // Placeholder, fetch or add customer phone if available

		// Items Table
		doc.autoTable({
			startY: 75,
			head: [['Nama Barang', 'Qty', 'Berat Jml (kg)', 'Keterangan']],
			body: order.items.map((item, index) => [
				item.product || 'N/A',
				item.quantity || 0,
				item.quantity || 0, // Assuming weight equals quantity in kg for simplicity, adjust if needed
				'Barang Pesanan Pelanggan', // Description, match example
			]),
			styles: { font: 'Helvetica', fontSize: 8, cellPadding: 1.5 },
			headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
			margin: { left: 20, right: 20 },
		});

		// Totals and Notes
		const tableEndY = doc.lastAutoTable.finalY;
		doc.text(`Total Berat: ${order.items.reduce((sum, item) => sum + (item.quantity || 0), 0)} kg`, 20, tableEndY + 10);
		doc.text('Catatan:', 20, tableEndY + 15);
		doc.text('1. Surat Jalan ini merupakan bukti resmi pengiriman barang.', 20, tableEndY + 20);
		doc.text('2. Surat Jalan harus dibawa dan ditunjukkan pada saat pengiriman barang.', 20, tableEndY + 25);
		doc.text('3. Surat Jalan ini akan digunakan sebagai bukti pengiriman barang sesuai invoice.', 20, tableEndY + 30);

		// Signatures
		doc.line(20, tableEndY + 50, 95, tableEndY + 50); // Line for Bagian Pengiriman
		doc.text('Bagian Pengiriman', 60, tableEndY + 60, { align: 'center' });
		doc.text(`${session.user.name || 'Staff PT. Berkas Tuaian Melimpah'}`, 60, tableEndY + 70, { align: 'center' });

		doc.line(115, tableEndY + 50, 190, tableEndY + 50); // Line for Penerima Barang
		doc.text('Penerima Barang', 155, tableEndY + 60, { align: 'center' });
		doc.text(`${order.customerName || 'Unknown Customer'}`, 155, tableEndY + 70, { align: 'center' });

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

		// Signatures (Centered and with more space)
		doc.setFont('Helvetica', 'bold');
		doc.text('PIHAK PERTAMA', 105, tableEndY + 40, { align: 'center' }); // Centered
		doc.text('PIHAK KEDUA', 105, tableEndY + 80, { align: 'center' }); // Centered, more space below

		doc.setFont('Helvetica', 'normal');
		doc.text('Audi Armadhani', 105, tableEndY + 50, { align: 'center' }); // Centered, more vertical space for signature
		doc.text('PT. Berkas Tuaian Melimpah', 105, tableEndY + 90, { align: 'center' }); // Centered, more vertical space for signature

		// Optional Notes (e.g., inventory note)
		doc.text('NB. Barang tersebut merupakan barang pesanan PT. Berkas Tuaian Melimpah yang telah disetujui oleh pelanggan.', 20, tableEndY + 100);

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