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
import 'dayjs/locale/id'
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
      const suratJalanDoc = generateSuratJalanPDF({ ...order, customerName: order.customer_name, status: order.status, shippingMethod: order.shipping_method, items: order.items, driver: order.driver_name });
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

		// Header: Left-aligned company details, Right-aligned title on the same line
		doc.text('PT. BERKAS TUAIAN MELIMPAH', 20, 20);
		doc.text('Bengkala, Kubutambahan, Buleleng, Bali', 20, 25);
		doc.text('Telp. 085175027797', 20, 30);
		doc.setFontSize(20); // Larger font for "SURAT JALAN"
		doc.text('SURAT JALAN', 190, 20, { align: 'right' });
		doc.setFontSize(10); // Reset font size

		// Divider
		doc.line(20, 35, 190, 35); // Horizontal line

		// Customer and Document Details: Left-aligned customer, Right-aligned details on the same line
		doc.setFont('Helvetica', 'normal');
		doc.text('Kepada Yth.', 20, 45);
		doc.text(`${order.customerName || 'Unknown Customer'}`, 45, 45);
		doc.text('Alamat:', 20, 50);

		// Truncate and split address into multiple lines if too long
		const address = order.customer_address || 'N/A';
		const maxWidth = 200; // Available width for address (from x: 45 to x: 190)
		const fontSize = 10; // Current font size
		const lines = doc.splitTextToSize(address, maxWidth / (fontSize / 2)); // Split text to fit width, approximate scaling
		lines.forEach((line, index) => {
			doc.text(line, 45, 50 + (index * 5)); // 5mm line height, starting at y: 50
		});

		doc.text('Telp:', 20, 50 + (lines.length * 5));
		doc.text('N/A', 45, 50 + (lines.length * 5)); // Placeholder, replace with order.customer_phone if available

		// Right-aligned document details on the same line as "Kepada Yth."
		const expedition = order.shippingMethod === 'Self' ? 'Warehouse arranged' : 'Customer arranged';
		doc.text(`No. Surat Jalan: SJ/${String(order.order_id).padStart(4, '0')}/${dayjs().format('YYYY')}`, 190, 45, { align: 'right' });
		doc.text(`Tanggal: ${dayjs().locale('id').format('DD MMMM YYYY')}`, 190, 50, { align: 'right' });
		doc.text(`Ekspedisi: ${expedition}`, 190, 55, { align: 'right' });

		// Items Table
		let tableStartY = 65 + (lines.length * 5); // Adjust table start based on address lines
		if (tableStartY < 65) tableStartY = 65; // Ensure table doesn’t start too early

		doc.autoTable({
			startY: tableStartY,
			head: [['Nama Barang', 'Qty', 'Berat Jml (kg)', 'Keterangan']],
			body: order.items.map((item, index) => [
				item.product || 'N/A',
				item.quantity || 0,
				item.quantity || 0, // Assuming weight equals quantity in kg for simplicity, adjust if needed
				'Barang Pesanan Pelanggan', // Description
			]),
			styles: { font: 'Helvetica', fontSize: 10, cellPadding: 1.5 },
			headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
			margin: { left: 20, right: 20 },
		});

		// Totals and Notes
		doc.setFontSize(10);
		const tableEndY = doc.lastAutoTable.finalY;
		doc.text(`Total Berat: ${Math.floor(order.items.reduce((sum, item) => sum + (parseFloat(item.quantity || 0) || 0), 0)).toLocaleString('id-ID')} kg`, 20, tableEndY + 10); // Format total as integer with dots for thousands (e.g., 10.000)
		doc.text('Catatan:', 20, tableEndY + 20);
		doc.setFontSize(8);
		doc.text('1. Surat Jalan ini merupakan bukti resmi pengiriman barang.', 20, tableEndY + 25);
		doc.text('2. Surat Jalan harus dibawa dan ditunjukkan pada saat pengiriman barang.', 20, tableEndY + 30);
		doc.text('3. Surat Jalan ini akan digunakan sebagai bukti pengiriman barang sesuai invoice.', 20, tableEndY + 35);
		doc.text('4. Barang sudah diterima dalam keadaan baik dan cukup oleh:', 20, tableEndY + 40);
	
		// Signatures (Three lines, distributed horizontally on one line)
		doc.setFontSize(10);
		const signatureY = tableEndY + 80;
		const signatureWidth = 170 / 3; // Divide 170mm (page width minus margins) by 3 for equal spacing
		const positions = [
			20 + (signatureWidth / 2), // Center of first third for Penerima/Pembeli
			20 + signatureWidth + (signatureWidth / 2), // Center of second third for Bagian Pengiriman
			20 + (2 * signatureWidth) + (signatureWidth / 2), // Center of third third for Petugas Gudang
		];
	
		doc.line(positions[0] - 20, signatureY, positions[0] + 20, signatureY); // Line for Penerima/Pembeli (75mm wide)
		doc.text('Penerima/Pembeli', positions[0], signatureY + 5, { align: 'center' });
		doc.text(`${order.customerName || 'Unknown Customer'}`, positions[0], signatureY + 10, { align: 'center' });
	
		doc.line(positions[1] - 20, signatureY, positions[1] + 20, signatureY); // Line for Bagian Pengiriman (75mm wide)
		doc.text('Pengantar/Supir', positions[1], signatureY + 5, { align: 'center' });
		doc.text(`${order.driver_name || 'Pengantar/Supir'}`, positions[1], signatureY + 10, { align: 'center' });
	
		doc.line(positions[2] - 20, signatureY, positions[2] + 20, signatureY); // Line for Petugas Gudang (75mm wide)
		doc.text('Manager', positions[2], signatureY + 5, { align: 'center' });
		doc.text(`(....................................)`, positions[2], signatureY + 10, { align: 'center' }); // Placeholder for warehouse staff, adjust if available
	
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
		doc.text('PT. BERKAS TUAIAN MELIMPAH', 105, 24, { align: 'center' });
		doc.text('BERITA ACARA SERAH TERIMA (BAST)', 105, 30, { align: 'center' });
		doc.setFontSize(10);
		doc.text(`Nomor: BAST/${String(order.order_id).padStart(4, '0')}/${dayjs().format('YYYY')}`, 105, 37, { align: 'center' });

		// Document Information
		doc.setFont('Helvetica', 'normal');
		doc.text(`Pada hari ini, ${dayjs().locale('id').format('dddd')}, tanggal ${dayjs().locale('id').format('DD MMMM YYYY')}, kami yang bertanda tangan di bawah ini:`, 20, 50);

		// Party 1 (Sender/Company)
		doc.text('Nama', 20, 60);
		doc.text(':', 40, 60);
		doc.text(`PT. Berkas Tuaian Melimpah`, 45, 60); // Match OCR content

		doc.text('Alamat', 20, 65);
		doc.text(':', 40, 65);
		doc.text('Bengkala, Kubutambahan, Buleleng, Bali', 45, 65); // Example address, adjust as needed

		doc.text('Selanjutnya disebut PIHAK PERTAMA', 20, 70);

		// Party 2 (Receiver/Customer)
		doc.text('Nama', 20, 80);
		doc.text(':', 40, 80);
		doc.text(`${order.customerName || 'Unknown Customer'}`, 45, 80);

		doc.text('Alamat', 20, 85);
		doc.text(':', 40, 85);
		doc.text(`${order.customer_address || 'Unknown Customer'}`, 45, 85);

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
			styles: { font: 'Helvetica', fontSize: 10, cellPadding: 1.5 },
			headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
			margin: { left: 20, right: 20 },
		});

		// Purpose/Usage Statement
		const tableEndY = doc.lastAutoTable.finalY;
		doc.text('Untuk diserahkan kepada pelanggan PT. Berkas Tuaian Melimpah sebagai barang pesanan.', 20, tableEndY + 10);
		doc.text('Demikian Berita Acara Serah Terima Barang ini dibuat untuk dapat dipergunakan sebagaimana mestinya.', 20, tableEndY + 15);

		// Signatures
		doc.setFont('Helvetica', 'bold');
		doc.text('PIHAK PERTAMA', 50, tableEndY + 30, { align: 'center' });
		doc.text('PIHAK KEDUA', 140, tableEndY + 30, { align: 'center' });
	
		doc.setFont('Helvetica', 'normal');
		doc.text(`(....................................)`, 50, tableEndY + 60, { align: 'center' });
		doc.text(`Manager`, 50, tableEndY + 65, { align: 'center' });
		doc.text(`${order.customerName || 'Unknown Customer'}`, 140, tableEndY + 60, { align: 'center' });

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