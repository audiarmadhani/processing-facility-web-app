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
  Divider,
  FormControl,
  TextField,
  Select,
  InputLabel,
  IconButton,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation'; // For navigation in App Router
import { darken, lighten, styled } from '@mui/material/styles';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CloseIcon from '@mui/icons-material/Close';
import CustomerModal from '../../components/CustomerModal';
import DriverModal from '../../components/DriverModal';

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
  '& .super-app-theme--Ready for Shipment': {
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
  '& .super-app-theme--In Transit': {
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

const Dashboard = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState([]); // Explicitly initialize as empty array
  const [customers, setCustomers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [openOrderModal, setOpenOrderModal] = useState(false); // State for order details modal
  const [anchorEl, setAnchorEl] = useState(null); // For dropdown menu in Actions column
  const [openConfirmProcess, setOpenConfirmProcess] = useState(false); // State for Process Order confirmation modal
  const [openConfirmReject, setOpenConfirmReject] = useState(false); // State for Reject Order confirmation modal
  const [openConfirmReadyForShipment, setOpenConfirmReadyForShipment] = useState(false); // State for Ready for Shipment confirmation modal
  const [openConfirmInTransit, setOpenConfirmInTransit] = useState(false); // State for In Transit confirmation modal
  const [editOrder, setEditOrder] = useState(null); // State for the order being edited
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [refreshCounter, setRefreshCounter] = useState(0); // For refreshing data after edits
  const [openCustomerModal, setOpenCustomerModal] = useState(false);
  const [openDriverModal, setOpenDriverModal] = useState(false);

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

        console.log('Fetch Response Data:', ordersData); // Log the response for debugging
        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setCustomers(customersData);
        setDrivers(driversData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        setOrders([]); // Set to empty array on error
        setSnackbar({ open: true, message: `Error fetching data: ${err.message}`, severity: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle navigation
  const handleCreateOrder = () => {
    router.push('/oms/ordercreation');
  };

  const handleViewCustomers = () => {
    router.push('/oms/ordercreation');
  };

  const handleViewDrivers = () => {
    router.push('/oms/ordercreation');
  };

  const handleViewDocuments = (orderId) => {
    router.push(`/orders/${orderId}/documents`);
  };

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

  // Handle edit order modal input changes
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'shipping_method') {
      setEditOrder(prev => ({
        ...prev,
        shipping_method: value,
        driver_id: value === 'Self' ? '' : prev.driver_id, // Reset for Self-Arranged
        driver_details: value === 'Self' 
          ? { name: '', vehicle_number_plate: '', vehicle_type: '', max_capacity: '' } 
          : prev.driver_details // Retain for Customer-Arranged
      }));
    } else if (name.startsWith('driver_details.')) {
      const field = name.split('.')[1];
      setEditOrder(prev => ({
        ...prev,
        driver_details: { ...prev.driver_details, [field]: value }
      }));
    } else if (name === 'tax_percentage') {
      setEditOrder(prev => ({ ...prev, [name]: value }));
    } else {
      setEditOrder(prev => ({ ...prev, [name]: value }));
    }

    if (name === 'customer_id' && value) {
      const customer = customers.find(c => c.customer_id === value);
      setSelectedCustomer(customer);
      setShowCustomerDetails(true);
    } else if (name === 'customer_id' && !value) {
      setShowCustomerDetails(false);
      setSelectedCustomer(null);
    }
  };

  const handleEditItemChange = (index, field, value) => {
    const newItems = [...editOrder.items];
    newItems[index][field] = value;
    setEditOrder(prev => ({ ...prev, items: newItems }));
    // Recalculate subtotal (price) when item price or quantity changes
    const subtotal = newItems.reduce((sum, item) => sum + (parseFloat(item.price || 0) * parseFloat(item.quantity || 0)), 0);
    setEditOrder(prev => ({ ...prev, price: subtotal.toString() })); // Update subtotal in IDR as string
  };

  const addEditItem = () => {
    setEditOrder(prev => ({ ...prev, items: [...prev.items, { product: '', quantity: '', price: '' }] }));
  };

  const removeEditItem = (index) => {
    if (editOrder.items.length === 1) {
      setSnackbar({ open: true, message: 'At least one item is required', severity: 'warning' });
      return;
    }
    const newItems = editOrder.items.filter((_, i) => i !== index);
    setEditOrder(prev => ({ ...prev, items: newItems }));
    // Recalculate subtotal (price) after removal
    const subtotal = newItems.reduce((sum, item) => sum + (parseFloat(item.price || 0) * parseFloat(item.quantity || 0)), 0);
    setEditOrder(prev => ({ ...prev, price: subtotal.toString() })); // Update subtotal in IDR as string
  };

  const handleSaveEdit = async () => {
    if (!editOrder.customer_id || !editOrder.items.every(item => item.product && item.quantity && item.price) || !editOrder.shipping_method) {
      setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'warning' });
      return;
    }

    // Validate numeric fields
    const subtotal = parseFloat(editOrder.price) || 0;
    const taxPercentage = parseFloat(editOrder.tax_percentage) || 0;

    if (isNaN(subtotal) || subtotal < 0) {
      setSnackbar({ open: true, message: 'Invalid subtotal: must be a non-negative number', severity: 'error' });
      return;
    }
    if (isNaN(taxPercentage) || taxPercentage < 0 || taxPercentage > 100) {
      setSnackbar({ open: true, message: 'Invalid tax percentage: must be a number between 0 and 100', severity: 'error' });
      return;
    }

    // Validate items
    for (const item of editOrder.items) {
      const itemPrice = parseFloat(item.price) || 0;
      const itemQuantity = parseFloat(item.quantity) || 0;

      if (isNaN(itemPrice) || itemPrice < 0 || isNaN(itemQuantity) || itemQuantity < 0) {
        setSnackbar({ open: true, message: 'Invalid item price or quantity: must be non-negative numbers', severity: 'error' });
        return;
      }
    }

    setLoading(true);
    try {
      const orderData = new FormData();
      orderData.append('customer_id', editOrder.customer_id);
      orderData.append('driver_id', editOrder.shipping_method === 'Self' ? editOrder.driver_id : ''); // Only for Self-Arranged
      orderData.append('shipping_method', editOrder.shipping_method);
      orderData.append('driver_details', JSON.stringify(editOrder.driver_details)); // For both methods
      orderData.append('price', editOrder.price || '0'); // Subtotal in IDR as string
      orderData.append('tax_percentage', editOrder.tax_percentage || '0'); // Tax percentage as string
      orderData.append('items', JSON.stringify(editOrder.items)); // Add items to the FormData as JSON string

      const orderRes = await fetch(`https://processing-facility-backend.onrender.com/api/orders/${editOrder.order_id}`, {
        method: 'PUT',
        body: orderData,
      });

      if (!orderRes.ok) throw new Error('Failed to update order');
      const updatedOrder = await orderRes.json();

      setOrders(orders.map(order => order.order_id === editOrder.order_id ? updatedOrder : order));
      setSnackbar({ open: true, message: 'Order updated successfully', severity: 'success' });
      handleCloseOrderModal();
      setRefreshCounter(prev => prev + 1); // Refresh data after update
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Handle showing order details/edit modal
  const handleOpenOrderModal = async (order, isEdit = false) => {
    setLoading(true); // Show loading state while fetching
    try {
      const orderRes = await fetch(`https://processing-facility-backend.onrender.com/api/orders/${order.order_id}`);
      if (!orderRes.ok) throw new Error('Failed to fetch order details');
      const fullOrder = await orderRes.json(); // Fetch the full order with items

      if (isEdit) {
        setEditOrder({
          order_id: fullOrder.order_id,
          customer_id: fullOrder.customer_id,
          driver_id: fullOrder.driver_id || '', // Default to empty if null
          items: fullOrder.items || [{ product: '', quantity: '', price: '' }],
          shipping_method: fullOrder.shipping_method || 'Customer',
          driver_details: fullOrder.driver_details ? JSON.parse(fullOrder.driver_details) : { name: '', vehicle_number_plate: '', vehicle_type: '', max_capacity: '' },
          price: fullOrder.price || '0', // Subtotal in IDR as string
          tax_percentage: fullOrder.tax_percentage || '0', // Tax percentage as string
        });
      } else {
        setSelectedOrder(fullOrder); // For view mode
      }
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
    setEditOrder(null);
  };

  const handleSaveCustomer = async (newCustomer) => {
    try {
      const res = await fetch('https://processing-facility-backend.onrender.com/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer),
      });
      if (!res.ok) throw new Error('Failed to add customer');
      const customer = await res.json();
      setCustomers(prev => [...prev, customer]);
      setEditOrder(prev => ({ ...prev, customer_id: customer.customer_id }));
      setRefreshCounter(prev => prev + 1);
      setSnackbar({ open: true, message: 'Customer added successfully', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    }
    setOpenCustomerModal(false);
  };
  
  const handleSaveDriver = async (newDriver) => {
    try {
      const res = await fetch('https://processing-facility-backend.onrender.com/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDriver),
      });
      if (!res.ok) throw new Error('Failed to add driver');
      const driver = await res.json();
      setDrivers(prev => [...prev, driver]);
      setEditOrder(prev => ({ ...prev, driver_id: driver.driver_id }));
      setRefreshCounter(prev => prev + 1);
      setSnackbar({ open: true, message: 'Driver added successfully', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    }
    setOpenDriverModal(false);
  };

  // Regenerate and download PDFs from modal
  const handleDownloadDocuments = () => {
    if (!selectedOrder && !editOrder) return;

    try {
      const order = selectedOrder || editOrder;
      const spkDoc = generateSPKPDF({
        ...order,
        customerName: order.customer_name || 'Unknown Customer',
        status: order.status || 'Processing',
        shippingMethod: order.shipping_method || 'Self',
        items: order.items || [],
      });
      const spmDoc = generateSPMPDF({
        ...order,
        customerName: order.customer_name || 'Unknown Customer',
        status: order.status || 'Processing',
        shippingMethod: order.shipping_method || 'Self',
        items: order.items || [],
      });
      const doDoc = generateDOPDF({
        ...order,
        customerName: order.customer_name || 'Unknown Customer',
        status: order.status || 'Processing',
        shippingMethod: order.shipping_method || 'Self',
        items: order.items || [],
      });

      // Save PDFs locally using jsPDF.save()
      spkDoc.save(`SPK_${String(order.order_id).padStart(4, '0')}_${new Date().toISOString().split('T')[0]}.pdf`);
      spmDoc.save(`SPM_${String(order.order_id).padStart(4, '0')}_${new Date().toISOString().split('T')[0]}.pdf`);
      doDoc.save(`DO_${String(order.order_id).padStart(4, '0')}_${new Date().toISOString().split('T')[0]}.pdf`);

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
      renderCell: (params) => {
        const order = orders.find(o => o.order_id === params.row.order_id) || {};
        const isProcessed = !!order.process_at;
        const isRejected = !!order.reject_at;
        const isReady = !!order.ready_at;
        const isShipped = !!order.ship_at;
        const isDelivered = !!order.arrive_at;
        const isPaid = !!order.paid_at;
        console.log('isProcessed: ', order.process_at);
        console.log('isRejected: ', order.reject_at);
        console.log('isReady: ', order.ready_at);
        console.log('isShipped: ', order.ship_at);
        console.log('isDelivered: ', order.arrive_at);
        console.log('isPaid: ', order.paid_at);
    
        return (
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
              <MenuItem 
                onClick={handleProcess} 
                disabled={isProcessed || isRejected || isReady || isShipped || isDelivered || isPaid}
              >
                Process Order
              </MenuItem>
              <MenuItem 
                onClick={handleReject} 
                disabled={isRejected || isDelivered || isPaid}
              >
                Reject Order
              </MenuItem>
              <Divider sx={{ my: 0.5 }} /> {/* Divider after status-changing actions */}
              <MenuItem 
                onClick={openReadyForShipmentConfirm} 
                disabled={ isRejected || isReady || isShipped || isDelivered || isPaid}
              >
                Ready for Shipment
              </MenuItem>
              <MenuItem 
                onClick={openInTransitConfirm} 
                disabled={ isRejected || isShipped || isDelivered || isPaid}
              >
                In Transit
              </MenuItem>
              <Divider sx={{ my: 0.5 }} /> {/* Divider before non-status-changing actions */}
              <MenuItem onClick={() => handleOpenOrderModal(params.row, false)}>View Details</MenuItem>
              <MenuItem onClick={() => handleOpenOrderModal(params.row, true)}>Edit Order</MenuItem>
            </Menu>
          </div>
        );
      },
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
      process_at: order?.process_at || null,
      reject_at: order?.reject_at || null,
      ready_at: order?.ready_at || null,
      ship_at: order?.ship_at || null,
      arrive_at: order?.arrive_at || null,
      paid_at: order?.paid_at || null,
    };
  }) : [];

  const summaryData = [
    { title: 'Total Orders', value: orders.length },
    { title: 'Pending Orders', value: orders.filter(o => o.status === 'Pending').length },
    { title: 'Processing Orders', value: orders.filter(o => o.status === 'Processing').length },
    { title: 'Ready for Shipment', value: orders.filter(o => o.status === 'Ready for Shipment').length },
    { title: 'In Transit Orders', value: orders.filter(o => o.status === 'In Transit').length },
    { title: 'Rejected Orders', value: orders.filter(o => o.status === 'Rejected').length },
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
                <Typography variant="h6">{item.title}</Typography>
                <Typography variant="h4">
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
      <Card variant="outlined">
        <CardContent>
          <div style={{ height: 800, width: "100%" }}>
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
              rowHeight={45} // Increased row height to accommodate buttons
              getRowClassName={(params) => `super-app-theme--${params.row.status}`}
            />
          </div>
        </CardContent>
      </Card>
  
      {/* Order Details/Edit Modal */}
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
          ) : selectedOrder || editOrder ? (
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
                {editOrder ? `Edit Order - Order ID: ${editOrder.order_id || 'N/A'}` : `Order Details - Order ID: ${selectedOrder.order_id || 'N/A'}`}
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

              {/* Inside the Order View/Edit Form, after the Header Information but before Customer Selection */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>Order Timestamps</Typography>
                <Box sx={{ pl: 1 }}>
                  <Typography variant="body2"><strong>Created At:</strong> {dayjs(selectedOrder?.created_at ).format('YYYY-MM-DD HH:mm:ss') || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Processed At:</strong> {dayjs(selectedOrder?.process_at ).format('YYYY-MM-DD HH:mm:ss') || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Rejected At:</strong> {dayjs(selectedOrder?.reject_at ).format('YYYY-MM-DD HH:mm:ss') || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Ready for Shipment At:</strong> {dayjs(selectedOrder?.ready_at ).format('YYYY-MM-DD HH:mm:ss') || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Shipped At:</strong> {dayjs(selectedOrder?.ship_at ).format('YYYY-MM-DD HH:mm:ss') || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Delivered At:</strong> {dayjs(selectedOrder?.arrive_at ).format('YYYY-MM-DD HH:mm:ss') || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Paid At:</strong> {dayjs(selectedOrder?.paid_at ).format('YYYY-MM-DD HH:mm:ss') || 'N/A'}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
              </Box>
  
              {/* Order View/Edit Form */}
              <Box>
                {/* Customer Selection */}
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Customer</InputLabel>
                  <Select
                    name="customer_id"
                    value={editOrder ? editOrder.customer_id : selectedOrder.customer_id}
                    onChange={editOrder ? handleEditInputChange : undefined}
                    label="Customer"
                    disabled={!editOrder}
                  >
                    {customers.map(customer => (
                      <MenuItem key={customer.customer_id} value={customer.customer_id}>
                        {customer.name}
                      </MenuItem>
                    ))}
                    <MenuItem>
                      <Button
                        fullWidth
                        variant="text"
                        onClick={() => setOpenCustomerModal(true)}
                        sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                        disabled={!editOrder}
                      >
                        + Add New Customer
                      </Button>
                    </MenuItem>
                  </Select>
                </FormControl>
  
                {showCustomerDetails && selectedCustomer && (
                  <Box sx={{ mb: 4, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <Typography variant="subtitle1" gutterBottom>Customer Details</Typography>
                    <TextField
                      label="Name"
                      value={selectedCustomer.name || '-'}
                      InputProps={{ readOnly: true }}
                      fullWidth
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      label="Address"
                      value={selectedCustomer.address || '-'}
                      InputProps={{ readOnly: true }}
                      fullWidth
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      label="Phone"
                      value={selectedCustomer.phone || '-'}
                      InputProps={{ readOnly: true }}
                      fullWidth
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      label="Email"
                      value={selectedCustomer.email || '-'}
                      InputProps={{ readOnly: true }}
                      fullWidth
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      label="Country"
                      value={selectedCustomer.country || '-'}
                      InputProps={{ readOnly: true }}
                      fullWidth
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      label="State"
                      value={selectedCustomer.state || '-'}
                      InputProps={{ readOnly: true }}
                      fullWidth
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      label="City"
                      value={selectedCustomer.city || '-'}
                      InputProps={{ readOnly: true }}
                      fullWidth
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      label="Zip Code"
                      value={selectedCustomer.zip_code || '-'}
                      InputProps={{ readOnly: true }}
                      fullWidth
                    />
                  </Box>
                )}
  
                {/* Shipping Method and Driver Details */}
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Shipping Method</InputLabel>
                  <Select
                    name="shipping_method"
                    value={editOrder ? editOrder.shipping_method : selectedOrder.shipping_method || 'Customer'}
                    onChange={editOrder ? handleEditInputChange : undefined}
                    label="Shipping Method"
                    disabled={!editOrder}
                  >
                    <MenuItem value="Customer">Customer-Arranged</MenuItem>
                    <MenuItem value="Self">Self-Arranged</MenuItem>
                  </Select>
                </FormControl>
  
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" gutterBottom>Driver Details</Typography>
                  {editOrder ? (
                    <>
                      {editOrder.shipping_method === 'Self' && (
                        <FormControl fullWidth sx={{ mb: 2 }}>
                          <InputLabel>Driver</InputLabel>
                          <Select
                            name="driver_id"
                            value={editOrder.driver_id}
                            onChange={handleEditInputChange}
                            label="Driver"
                            endIcon={<KeyboardArrowDownIcon />}
                            disabled={!editOrder}
                          >
                            <MenuItem value="">None</MenuItem>
                            {drivers.filter(d => d.availability_status === 'Available').map(driver => (
                              <MenuItem key={driver.driver_id} value={driver.driver_id}>
                                {driver.name} ({driver.vehicle_number})
                              </MenuItem>
                            ))}
                            <MenuItem>
                              <Button
                                fullWidth
                                variant="text"
                                onClick={() => setOpenDriverModal(true)}
                                sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                                disabled={!editOrder}
                              >
                                + Add New Driver
                              </Button>
                            </MenuItem>
                          </Select>
                        </FormControl>
                      )}
                      {editOrder.shipping_method === 'Self' && editOrder.driver_id && drivers.find(d => d.driver_id === editOrder.driver_id) && (
                        <>
                          <TextField
                            fullWidth
                            label="Driver Name"
                            value={drivers.find(d => d.driver_id === editOrder.driver_id)?.name || ''}
                            InputProps={{ readOnly: true }}
                            sx={{ mb: 2 }}
                          />
                          <TextField
                            fullWidth
                            label="Vehicle Number Plate"
                            value={drivers.find(d => d.driver_id === editOrder.driver_id)?.vehicle_number || ''}
                            InputProps={{ readOnly: true }}
                            sx={{ mb: 2 }}
                          />
                          <TextField
                            fullWidth
                            label="Vehicle Type"
                            value={drivers.find(d => d.driver_id === editOrder.driver_id)?.vehicle_type || ''}
                            InputProps={{ readOnly: true }}
                            sx={{ mb: 2 }}
                          />
                          <TextField
                            fullWidth
                            label="Max Capacity (kg)"
                            value={drivers.find(d => d.driver_id === editOrder.driver_id)?.max_capacity || ''}
                            InputProps={{ readOnly: true }}
                            sx={{ mb: 2 }}
                          />
                        </>
                      )}
                      {editOrder.shipping_method === 'Customer' && (
                        <>
                          <TextField
                            fullWidth
                            label="Driver Name"
                            name="driver_details.name"
                            value={editOrder.driver_details.name}
                            onChange={handleEditInputChange}
                            sx={{ mb: 2 }}
                            disabled={!editOrder}
                          />
                          <TextField
                            fullWidth
                            label="Vehicle Number Plate"
                            name="driver_details.vehicle_number_plate"
                            value={editOrder.driver_details.vehicle_number_plate}
                            onChange={handleEditInputChange}
                            sx={{ mb: 2 }}
                            disabled={!editOrder}
                          />
                          <TextField
                            fullWidth
                            label="Vehicle Type"
                            name="driver_details.vehicle_type"
                            value={editOrder.driver_details.vehicle_type}
                            onChange={handleEditInputChange}
                            sx={{ mb: 2 }}
                            disabled={!editOrder}
                          />
                          <TextField
                            fullWidth
                            label="Max Capacity (kg)"
                            name="driver_details.max_capacity"
                            value={editOrder.driver_details.max_capacity}
                            onChange={handleEditInputChange}
                            sx={{ mb: 2 }}
                            disabled={!editOrder}
                          />
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      {selectedOrder.shipping_method === 'Self' && selectedOrder.driver_id && (
                        <>
                          <TextField
                            fullWidth
                            label="Driver Name"
                            value={drivers.find(d => d.driver_id === selectedOrder.driver_id)?.name || '-'}
                            InputProps={{ readOnly: true }}
                            sx={{ mb: 2 }}
                          />
                          <TextField
                            fullWidth
                            label="Vehicle Number Plate"
                            value={drivers.find(d => d.driver_id === selectedOrder.driver_id)?.vehicle_number || '-'}
                            InputProps={{ readOnly: true }}
                            sx={{ mb: 2 }}
                          />
                          <TextField
                            fullWidth
                            label="Vehicle Type"
                            value={drivers.find(d => d.driver_id === selectedOrder.driver_id)?.vehicle_type || '-'}
                            InputProps={{ readOnly: true }}
                            sx={{ mb: 2 }}
                          />
                          <TextField
                            fullWidth
                            label="Max Capacity (kg)"
                            value={drivers.find(d => d.driver_id === selectedOrder.driver_id)?.max_capacity || '-'}
                            InputProps={{ readOnly: true }}
                            sx={{ mb: 2 }}
                          />
                        </>
                      )}
                      {selectedOrder.shipping_method === 'Customer' && selectedOrder.driver_details && (
                        <>
                          <TextField
                            fullWidth
                            label="Driver Name"
                            value={JSON.parse(selectedOrder.driver_details).name || '-'}
                            InputProps={{ readOnly: true }}
                            sx={{ mb: 2 }}
                          />
                          <TextField
                            fullWidth
                            label="Vehicle Number Plate"
                            value={JSON.parse(selectedOrder.driver_details).vehicle_number_plate || '-'}
                            InputProps={{ readOnly: true }}
                            sx={{ mb: 2 }}
                          />
                          <TextField
                            fullWidth
                            label="Vehicle Type"
                            value={JSON.parse(selectedOrder.driver_details).vehicle_type || '-'}
                            InputProps={{ readOnly: true }}
                            sx={{ mb: 2 }}
                          />
                          <TextField
                            fullWidth
                            label="Max Capacity (kg)"
                            value={JSON.parse(selectedOrder.driver_details).max_capacity || '-'}
                            InputProps={{ readOnly: true }}
                            sx={{ mb: 2 }}
                          />
                        </>
                      )}
                    </>
                  )}
                </Box>
                <Divider sx={{ my: 4 }} /> {/* Divider between Order Details and Order Items */}
  
                {/* Order Items */}
                <Box sx={{ mb: 3 }}>
                  {(editOrder ? editOrder.items : selectedOrder.items || []).map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <TextField
                        label="Product"
                        value={item.product}
                        onChange={(e) => (editOrder ? handleEditItemChange(index, 'product', e.target.value) : undefined)}
                        sx={{ mr: 2, flex: 1 }}
                        disabled={!editOrder}
                      />
                      <TextField
                        label="Quantity (kg)"
                        type="number"
                        value={item.quantity}
                        onChange={(e) => (editOrder ? handleEditItemChange(index, 'quantity', e.target.value) : undefined)}
                        sx={{ mr: 1, width: '120px' }}
                        disabled={!editOrder}
                      />
                      <TextField
                        label="Price per Unit (IDR)"
                        type="number"
                        value={item.price}
                        onChange={(e) => (editOrder ? handleEditItemChange(index, 'price', e.target.value) : undefined)}
                        sx={{ mr: 1, width: '120px' }}
                        disabled={!editOrder}
                      />
                      {editOrder && (
                        <IconButton
                          onClick={() => removeEditItem(index)}
                          size="small"
                          color="error"
                          disabled={editOrder.items.length === 1}
                        >
                          <CloseIcon />
                        </IconButton>
                      )}
                    </Box>
                  ))}
                  {editOrder && (
                    <Button variant="outlined" onClick={addEditItem} sx={{ mb: 2 }}>Add Another Item</Button>
                  )}
                </Box>
  
                <Divider sx={{ mb: 2 }} /> {/* Divider between Subtotal and Tax */}
  
                {/* Subtotal, Tax, and Grand Total (Narrow, Right-Aligned) */}
                <Box sx={{ maxWidth: '70%', ml: 'auto', mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Subtotal Price (IDR)"
                    name="price"
                    value={(editOrder ? editOrder.price : selectedOrder.price || '0') ? Number(editOrder ? editOrder.price : selectedOrder.price).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }) : '0 IDR'}
                    InputProps={{ readOnly: true }} // Calculated automatically
                    sx={{ mb: 2 }}
                    disabled={!editOrder}
                  />
                  <TextField
                    fullWidth
                    label="Tax Percentage (%)"
                    name="tax_percentage"
                    value={editOrder ? editOrder.tax_percentage : selectedOrder.tax_percentage || '0'}
                    onChange={editOrder ? handleEditInputChange : undefined}
                    type="number"
                    sx={{ mb: 2 }}
                    disabled={!editOrder}
                  />
                  <TextField
                    fullWidth
                    label="Grand Total (IDR)"
                    value={
                      (editOrder ? editOrder.price : selectedOrder.price) && (editOrder ? editOrder.tax_percentage : selectedOrder.tax_percentage)
                        ? (Number(editOrder ? editOrder.price : selectedOrder.price || 0) * (1 + Number(editOrder ? editOrder.tax_percentage : selectedOrder.tax_percentage || 0) / 100)).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })
                        : '0 IDR'
                    }
                    InputProps={{ readOnly: true }} // Calculated on frontend
                    sx={{ mb: 2 }}
                    disabled={!editOrder}
                  />
                  {editOrder ? (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSaveEdit}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                        sx={{ flex: 1 }}
                      >
                        Save Changes
                      </Button>
                      <Button
                        variant="outlined"
                        color="secondary"
                        onClick={handleCloseOrderModal}
                        sx={{ flex: 1 }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  ) : (
                    <>
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
                    </>
                  )}
                </Box>
              </Box>
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
  
      {/* Customer and Driver Modals */}
      <CustomerModal open={openCustomerModal} onClose={() => setOpenCustomerModal(false)} onSave={handleSaveCustomer} />
      <DriverModal open={openDriverModal} onClose={() => setOpenDriverModal(false)} onSave={handleSaveDriver} />
  
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

export default Dashboard;