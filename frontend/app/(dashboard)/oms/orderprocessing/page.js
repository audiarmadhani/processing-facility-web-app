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
import 'dayjs/locale/id';
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
  '& .super-app-theme--ReadyForShipment': {
    ...getBackgroundColor(theme.palette.info.main, theme, 0.7), // Blue for Ready for Shipment
    '&:hover': {
      ...getBackgroundColor(theme.palette.info.main, theme, 0.6),
    },
    '&.Mui-selected': {
      ...getBackgroundColor(theme.palette.info.main, theme, 0.5),
      '&:hover': {
        ...getBackgroundColor(theme.palette.info.main, theme, 0.4),
      },
    },
  },
  '& .super-app-theme--InTransit': {
    ...getBackgroundColor(theme.palette.secondary.main, theme, 0.7), // Purple for In Transit
    '&:hover': {
      ...getBackgroundColor(theme.palette.secondary.main, theme, 0.6),
    },
    '&.Mui-selected': {
      ...getBackgroundColor(theme.palette.secondary.main, theme, 0.5),
      '&:hover': {
        ...getBackgroundColor(theme.palette.secondary.main, theme, 0.4),
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
  const [openConfirmProcess, setOpenConfirmProcess] = useState(false); // State for Process Order confirmation modal
  const [openConfirmReject, setOpenConfirmReject] = useState(false); // State for Reject Order confirmation modal
  const [openConfirmReadyForShipment, setOpenConfirmReadyForShipment] = useState(false); // State for Ready for Shipment confirmation modal
  const [openConfirmInTransit, setOpenConfirmInTransit] = useState(false); // State for In Transit confirmation modal

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

  // Handle generating shipment documents (Surat Jalan and BAST) with status update to "Ready for Shipment"
	const handleReadyForShipment = async (orderId) => {
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

			// Update status to "Ready for Shipment" before generating documents
			const readyUpdateRes = await fetch(`https://processing-facility-backend.onrender.com/api/orders/${orderId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
				body: JSON.stringify({
					customer_id: order.customer_id,
					status: 'Ready for Shipment',
					driver_id: order.driver_id, // Reuse existing driver_id
					shipping_method: order.shipping_method || 'Self', // Default to 'Self' if missing
					driver_details: order.driver_details, // Reuse existing driver_details (JSON string)
					price: order.price?.toString() || '0', // Reuse existing price, converted to string
					tax_percentage: order.tax_percentage?.toString() || '0', // Reuse existing tax_percentage, converted to string
					items: order.items
				}),
			});

			if (!readyUpdateRes.ok) throw new Error('Failed to update order status to Ready for Shipment: ' + (await readyUpdateRes.text()));
			const updatedReadyOrder = await readyUpdateRes.json();
			console.log('Updated Order (Ready for Shipment):', updatedReadyOrder); // Log the updated order for debugging

			// Ensure order_id, customer_name, status, shipping_method, and items are preserved or defaulted after "Ready for Shipment" update
			order = {
				...updatedReadyOrder,
				order_id: updatedReadyOrder.order_id || order.order_id, // Ensure order_id is always present
				customer_id: updatedReadyOrder.customer_id || order.customer_id,
				customer_name: updatedReadyOrder.customer_name || order.customer_name || 'Unknown Customer', // Default if missing
				status: updatedReadyOrder.status || 'Ready for Shipment', // Should be "Ready for Shipment" now
				shipping_method: updatedReadyOrder.shipping_method || order.shipping_method || 'Self', // Default to 'Self' if missing
				items: updatedReadyOrder.items || order.items, // Default to empty array if missing
				created_at: updatedReadyOrder.created_at || order.created_at || null,
			};

			if (!order.order_id || typeof order.order_id !== 'number') {
				throw new Error('Invalid order_id after Ready for Shipment update: ' + order.order_id);
			}

			// Generate Surat Jalan and BAST PDFs
			const suratJalanDoc = generateSuratJalanPDF({ ...order, customerName: order.customer_name, status: order.status, shippingMethod: order.shipping_method, items: order.items, driver: order.driver_name });
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
				uploadDocument(suratJalanDoc, 'Surat Jalan', `SuratJalan_${order.order_id}.pdf`),
				uploadDocument(bastDoc, 'BAST', `BAST_${order.order_id}.pdf`),
			]);

			// Update the orders state safely with the current "Ready for Shipment" status
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

	// Handle updating status to "In Transit"
	const handleInTransit = async (orderId) => {
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

			// Update status to "In Transit"
			const transitUpdateRes = await fetch(`https://processing-facility-backend.onrender.com/api/orders/${orderId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
				body: JSON.stringify({
					customer_id: order.customer_id,
					status: 'In Transit',
					driver_id: order.driver_id, // Reuse existing driver_id
					shipping_method: order.shipping_method || 'Self', // Default to 'Self' if missing
					driver_details: order.driver_details, // Reuse existing driver_details (JSON string)
					price: order.price?.toString() || '0', // Reuse existing price, converted to string
					tax_percentage: order.tax_percentage?.toString() || '0', // Reuse existing tax_percentage, converted to string
					items: order.items
				}),
			});

			if (!transitUpdateRes.ok) throw new Error('Failed to update order status to In Transit: ' + (await transitUpdateRes.text()));
			const updatedTransitOrder = await transitUpdateRes.json();
			console.log('Updated Order (In Transit):', updatedTransitOrder); // Log the updated order for debugging

			// Ensure order_id, customer_name, status, shipping_method, and items are preserved or defaulted after "In Transit" update
			order = {
				...updatedTransitOrder,
				order_id: updatedTransitOrder.order_id || order.order_id, // Ensure order_id is always present
				customer_id: updatedTransitOrder.customer_id || order.customer_id,
				customer_name: updatedTransitOrder.customer_name || order.customer_name || 'Unknown Customer', // Default if missing
				status: updatedTransitOrder.status || 'In Transit', // Should be "In Transit" now
				shipping_method: updatedTransitOrder.shipping_method || order.shipping_method || 'Self', // Default to 'Self' if missing
				items: updatedTransitOrder.items || order.items, // Default to empty array if missing
				created_at: updatedTransitOrder.created_at || order.created_at || null,
			};

			if (!order.order_id || typeof order.order_id !== 'number') {
				throw new Error('Invalid order_id after In Transit update: ' + order.order_id);
			}

			// Update the orders state safely with the current "In Transit" status
			setOrders(prevOrders => prevOrders.map(o => o.order_id === orderId ? order : o));

			setSelectedOrder(order);

			setSnackbar({ open: true, message: 'Order status updated to In Transit successfully', severity: 'success' });
		} catch (error) {
			console.error('Error updating to In Transit:', error);
			setSnackbar({ open: true, message: `Error updating to In Transit: ${error.message}`, severity: 'error' });
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

  // Handle actions dropdown (Process, Reject, View Details, Ready for Shipment, In Transit)
  const handleActionsClick = (event, orderId) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrder(orders.find(order => order.order_id === orderId) || null);
  };

  const handleActionsClose = () => {
    setAnchorEl(null);
    setSelectedOrder(null);
  };

  const handleProcessConfirm = () => {
    setOpenConfirmProcess(false);
    if (selectedOrder) handleProcessOrder(selectedOrder.order_id);
  };

  const handleRejectConfirm = () => {
    setOpenConfirmReject(false);
    if (selectedOrder) handleReject(selectedOrder.order_id);
  };

  const handleReadyForShipmentConfirm = () => {
    setOpenConfirmReadyForShipment(false);
    if (selectedOrder) handleReadyForShipment(selectedOrder.order_id);
  };

  const handleInTransitConfirm = () => {
    setOpenConfirmInTransit(false);
    if (selectedOrder) handleInTransit(selectedOrder.order_id);
  };

  const handleProcess = () => {
    if (!selectedOrder) return;
    setOpenConfirmProcess(true);
  };

  const handleReject = async (orderId) => {
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
          items: selectedOrder.items
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
  };

  // Trigger functions to open confirmation modals (renamed to avoid naming conflict)
	const openReadyForShipmentConfirm = () => {
		if (!selectedOrder) return;
		setOpenConfirmReadyForShipment(true);
	};

	const openInTransitConfirm = () => {
		if (!selectedOrder) return;
		setOpenConfirmInTransit(true);
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
    doc.text(`${order.driver || 'Pengantar/Supir'}`, positions[1], signatureY + 10, { align: 'center' });
  
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

  const handleCloseConfirmProcess = () => {
    setOpenConfirmProcess(false);
  };

  const handleCloseConfirmReject = () => {
    setOpenConfirmReject(false);
  };

  const handleCloseConfirmReadyForShipment = () => {
    setOpenConfirmReadyForShipment(false);
  };

  const handleCloseConfirmInTransit = () => {
    setOpenConfirmInTransit(false);
  };

  // Update the Actions dropdown in the columns array to use the renamed trigger functions
	const columns = [
		{ field: 'order_id', headerName: 'Order ID', width: 80, sortable: true },
		{ field: 'customer_name', headerName: 'Customer Name', width: 240, sortable: true },
		{ 
			field: 'status', 
			headerName: 'Status', 
			width: 200, 
			sortable: true,
			renderCell: (params) => (
				<Button
					variant="contained" // Use contained variant for a filled button
					size="small"
					sx={{
						minWidth: 100,
						padding: '4px 16px',
						borderRadius: '16px', // Pill shape
						backgroundColor: params.value === 'Pending' ? '#f57c00' : params.value === 'Processing' ? '#4caf50' : params.value === 'Rejected' ? '#d32f2f' : params.value === 'Ready for Shipment' ? '#2196f3' : params.value === 'In Transit' ? '#9c27b0' : '#757575', // Darker colors for background (orange for Pending, green for Processing, red for Rejected, blue for Ready for Shipment, purple for In Transit, gray for default)
						color: '#fff', // White text for contrast against darker backgrounds
						fontSize: '0.875rem',
						textTransform: 'none',
						alignItems: 'center',
						'&:hover': {
							backgroundColor: params.value === 'Pending' ? '#f57c00' : params.value === 'Processing' ? '#4caf50' : params.value === 'Rejected' ? '#d32f2f' : params.value === 'Ready for Shipment' ? '#2196f3' : params.value === 'In Transit' ? '#9c27b0' : '#757575', // Maintain background color on hover
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
			width: 130, 
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
							height: '32px', // Adjusted for pill shape
							'&:hover': {
								backgroundColor: theme => theme.palette.primary.dark, // Darker blue on hover
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
						sx={{
							'& .MuiMenu-paper': {
								borderRadius: '16px', // Match the pill shape of the button
							},
						}}
					>
						<MenuItem onClick={handleProcess}>Process Order</MenuItem>
						<MenuItem onClick={handleReject}>Reject Order</MenuItem>
						<Divider sx={{ my: 0.5 }} /> {/* Divider after status-changing actions */}
						<MenuItem onClick={openReadyForShipmentConfirm}>Ready for Shipment</MenuItem>
						<MenuItem onClick={openInTransitConfirm}>In Transit</MenuItem>
						<Divider sx={{ my: 0.5 }} /> {/* Divider before View Details */}
						<MenuItem onClick={() => handleOpenOrderModal(params.row)}>View Details</MenuItem>
					</Menu>
				</div>
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

      {/* Process Order Confirmation Modal */}
      <Modal
        open={openConfirmProcess}
        onClose={handleCloseConfirmProcess}
        aria-labelledby="confirm-process-modal-title"
        aria-describedby="confirm-process-modal-description"
      >
        <Paper sx={{ 
          p: 3, 
          maxWidth: 400, 
          mx: 'auto', 
          mt: '20vh', 
          borderRadius: 2, 
        }}>
          <Typography 
            variant="h6" 
            id="confirm-process-modal-title" 
            gutterBottom 
            sx={{ 
              textAlign: 'center', 
              fontWeight: 'bold', 
            }}
          >
            Confirm Process Order
          </Typography>
          <Typography 
            variant="body1" 
            id="confirm-process-modal-description" 
            sx={{ 
              textAlign: 'center', 
              mb: 3, 
            }}
          >
            Are you sure you want to process Order ID {selectedOrder?.order_id || 'N/A'}? This will generate and upload documents.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleProcessConfirm} 
              disabled={loading}
            >
              Proceed
            </Button>
            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={handleCloseConfirmProcess}
            >
              Cancel
            </Button>
          </Box>
        </Paper>
      </Modal>

      {/* Reject Order Confirmation Modal */}
      <Modal
        open={openConfirmReject}
        onClose={handleCloseConfirmReject}
        aria-labelledby="confirm-reject-modal-title"
        aria-describedby="confirm-reject-modal-description"
      >
        <Paper sx={{ 
          p: 3, 
          maxWidth: 400, 
          mx: 'auto', 
          mt: '20vh', 
          borderRadius: 2, 
        }}>
          <Typography 
            variant="h6" 
            id="confirm-reject-modal-title" 
            gutterBottom 
            sx={{ 
              textAlign: 'center', 
              fontWeight: 'bold', 
            }}
          >
            Confirm Reject Order
          </Typography>
          <Typography 
            variant="body1" 
            id="confirm-reject-modal-description" 
            sx={{ 
              textAlign: 'center', 
              mb: 3, 
            }}
          >
            Are you sure you want to reject Order ID {selectedOrder?.order_id || 'N/A'}?
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button 
              variant="contained" 
              color="error" 
              onClick={handleRejectConfirm} 
              disabled={loading}
            >
              Proceed
            </Button>
            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={handleCloseConfirmReject}
            >
              Cancel
            </Button>
          </Box>
        </Paper>
      </Modal>

      {/* Ready for Shipment Confirmation Modal */}
      <Modal
        open={openConfirmReadyForShipment}
        onClose={handleCloseConfirmReadyForShipment}
        aria-labelledby="confirm-ready-for-shipment-modal-title"
        aria-describedby="confirm-ready-for-shipment-modal-description"
      >
        <Paper sx={{ 
          p: 3, 
          maxWidth: 400, 
          mx: 'auto', 
          mt: '20vh', 
          borderRadius: 2, 
        }}>
          <Typography 
            variant="h6" 
            id="confirm-ready-for-shipment-modal-title" 
            gutterBottom 
            sx={{ 
              textAlign: 'center', 
              fontWeight: 'bold', 
            }}
          >
            Confirm Ready for Shipment
          </Typography>
          <Typography 
            variant="body1" 
            id="confirm-ready-for-shipment-modal-description" 
            sx={{ 
              textAlign: 'center', 
              mb: 3, 
            }}
          >
            Are you sure you want to mark Order ID {selectedOrder?.order_id || 'N/A'} as Ready for Shipment? This will generate and upload BAST and Surat Jalan documents.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleReadyForShipmentConfirm} 
              disabled={loading}
            >
              Proceed
            </Button>
            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={handleCloseConfirmReadyForShipment}
            >
              Cancel
            </Button>
          </Box>
        </Paper>
      </Modal>

      {/* In Transit Confirmation Modal */}
      <Modal
        open={openConfirmInTransit}
        onClose={handleCloseConfirmInTransit}
        aria-labelledby="confirm-in-transit-modal-title"
        aria-describedby="confirm-in-transit-modal-description"
      >
        <Paper sx={{ 
          p: 3, 
          maxWidth: 400, 
          mx: 'auto', 
          mt: '20vh', 
          borderRadius: 2, 
        }}>
          <Typography 
            variant="h6" 
            id="confirm-in-transit-modal-title" 
            gutterBottom 
            sx={{ 
              textAlign: 'center', 
              fontWeight: 'bold', 
            }}
          >
            Confirm In Transit
          </Typography>
          <Typography 
            variant="body1" 
            id="confirm-in-transit-modal-description" 
            sx={{ 
              textAlign: 'center', 
              mb: 3, 
            }}
          >
            Are you sure you want to mark Order ID {selectedOrder?.order_id || 'N/A'} as In Transit?
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleInTransitConfirm} 
              disabled={loading}
            >
              Proceed
            </Button>
            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={handleCloseConfirmInTransit}
            >
              Cancel
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
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OrderProcessing;