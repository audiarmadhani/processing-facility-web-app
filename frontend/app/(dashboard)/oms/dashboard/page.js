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
import { useDropzone } from 'react-dropzone'; // Add this import at the top of Dashboard.js

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
  const [openPaymentModal, setOpenPaymentModal] = useState(false); // State for payment modal
  const [paymentData, setPaymentData] = useState({
    amount: '', // Amount paid by customer
    paymentDate: new Date().toISOString().split('T')[0], // Default to today’s date
    notes: '', // Optional notes for the payment
  });
  const [paymentProof, setPaymentProof] = useState(null);

  const onDrop = (acceptedFiles) => {
    setPaymentProof(acceptedFiles[0]); // Store the first file dropped
  };
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

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
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to fetch order details: ' + (await res.text()));
      let order = await res.json();
      console.log('Order Fetch Response:', order);

      if (!order.order_id || typeof order.order_id !== 'number') {
        throw new Error('Invalid order_id fetched: ' + order.order_id);
      }

      // Fetch customer details to ensure address is included
      const customerRes = await fetch(`https://processing-facility-backend.onrender.com/api/customers/${order.customer_id}`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!customerRes.ok) throw new Error('Failed to fetch customer details');
      const customer = await customerRes.json();
      order.customer_address = customer.address || order.shipping_address || 'N/A'; // Use customer address or fallback
      order.customer_city = customer.city || order.customer_city || 'N/A'; // Use customer address or fallback
      order.customer_zip_code = customer.zip_code || order.customer_zip_code || 'N/A'; // Use customer address or fallback
      order.customer_state = customer.state || order.customer_state || 'N/A'; // Use customer address or fallback

      // Fetch driver details if shipping method is 'Self'
      if (order.shipping_method === 'Self' && order.driver_id) {
        const driverRes = await fetch(`https://processing-facility-backend.onrender.com/api/drivers/${order.driver_id}`, {
          headers: { 'Accept': 'application/json' },
        });
        if (!driverRes.ok) throw new Error('Failed to fetch driver details');
        const driver = await driverRes.json();
        order.driver_name = driver.name || 'N/A';
        order.driver_vehicle_number = driver.vehicle_number || 'N/A';
        order.driver_vehicle_type = driver.vehicle_type || 'N/A';
      } else if (order.shipping_method === 'Customer' && order.driver_details) {
        const driverDetails = JSON.parse(order.driver_details);
        order.driver_name = driverDetails.name || 'N/A';
        order.driver_vehicle_number = driverDetails.vehicle_number_plate || 'N/A';
        order.driver_vehicle_type = driverDetails.vehicle_type || 'N/A';
      } else {
        order.driver_name = 'N/A';
        order.driver_vehicle_number = 'N/A';
        order.driver_vehicle_type = 'N/A';
      }

      // Update status to "Processing" with all relevant fields
      const processingUpdateRes = await fetch(`https://processing-facility-backend.onrender.com/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          customer_id: order.customer_id,
          status: 'Processing',
          driver_id: order.driver_id || null,
          shipping_method: order.shipping_method || 'Self',
          driver_name: order.driver_name,
          driver_vehicle_number: order.driver_vehicle_number,
          driver_vehicle_type: order.driver_vehicle_type,
          price: order.price?.toString() || '0',
          tax_percentage: order.tax_percentage?.toString() || '0',
          items: order.items,
          shipping_address: order.customer_address, // Ensure shipping address is set
          billing_address: order.billing_address,
        }),
      });

      if (!processingUpdateRes.ok) throw new Error('Failed to update order status to Processing: ' + (await processingUpdateRes.text()));
      const updatedProcessingOrder = await processingUpdateRes.json();
      console.log('Updated Order (Processing):', updatedProcessingOrder);

      // Ensure all fields are preserved or defaulted
      order = {
        ...updatedProcessingOrder,
        order_id: updatedProcessingOrder.order_id || order.order_id,
        customer_id: updatedProcessingOrder.customer_id || order.customer_id,
        customer_name: updatedProcessingOrder.customer_name || order.customer_name || 'Unknown Customer',
        status: updatedProcessingOrder.status || 'Processing',
        shipping_method: updatedProcessingOrder.shipping_method || order.shipping_method || 'Self',
        items: updatedProcessingOrder.items || order.items,
        customer_address: updatedProcessingOrder.shipping_address || order.customer_address || 'N/A',
        customer_city: updatedProcessingOrder.customer_city || order.customer_city || 'N/A',
        customer_state: updatedProcessingOrder.customer_state || order.customer_state || 'N/A',
        customer_zip_code: updatedProcessingOrder.customer_zip_code || order.customer_zip_code || 'N/A',
        customer_phone: updatedProcessingOrder.customer_phone || order.customer_phone || 'N/A',
        driver_name: updatedProcessingOrder.driver_name || order.driver_name || 'N/A',
        driver_vehicle_number: updatedProcessingOrder.driver_vehicle_number || order.driver_vehicle_number || 'N/A',
        driver_vehicle_type: updatedProcessingOrder.driver_vehicle_type || order.driver_vehicle_type || 'N/A',
        created_at: updatedProcessingOrder.created_at || order.created_at || null,
      };

      // Generate SPK, SPM, and DO PDFs
      const spkDoc = generateSPKPDF({ ...order, customerName: order.customer_name, status: order.status, shippingMethod: order.shipping_method, items: order.items });
      const spmDoc = generateSPMPDF({ ...order, customerName: order.customer_name, status: order.status, shippingMethod: order.shipping_method, items: order.items });
      const doDoc = generateDOPDF({ ...order, customerName: order.customer_name, status: order.status, shippingMethod: order.shipping_method, items: order.items });

      // Save PDFs locally
      spkDoc.save(`SPK_${String(order.order_id).padStart(4, '0')}_${new Date().toISOString().split('T')[0]}.pdf`);
      spmDoc.save(`SPM_${String(order.order_id).padStart(4, '0')}_${new Date().toISOString().split('T')[0]}.pdf`);
      doDoc.save(`DO_${String(order.order_id).padStart(4, '0')}_${new Date().toISOString().split('T')[0]}.pdf`);

      // Upload PDFs to Google Drive
      const uploadDocument = async (doc, type, filename) => {
        const blob = doc.output('blob');
        const formData = new FormData();
        formData.append('order_id', orderId.toString());
        formData.append('type', type);
        formData.append('file', blob, filename);

        const res = await fetch('https://processing-facility-backend.onrender.com/api/documents/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error(`Failed to upload ${type} document: ${await res.text()}`);
        return await res.json();
      };

      await Promise.all([
        uploadDocument(spkDoc, 'SPK', `SPK_${String(order.order_id).padStart(4, '0')}.pdf`),
        uploadDocument(spmDoc, 'SPM', `SPM_${String(order.order_id).padStart(4, '0')}.pdf`),
        uploadDocument(doDoc, 'DO', `DO_${String(order.order_id).padStart(4, '0')}.pdf`),
      ]);

      // Update the orders state
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

      // Fetch customer details to ensure address is included
      const customerRes = await fetch(`https://processing-facility-backend.onrender.com/api/customers/${order.customer_id}`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!customerRes.ok) throw new Error('Failed to fetch customer details');
      const customer = await customerRes.json();
      order.customer_address = customer.address || order.shipping_address || 'N/A'; // Use customer address or fallback
      order.customer_city = customer.city || order.customer_city || 'N/A'; // Use customer address or fallback
      order.customer_zip_code = customer.zip_code || order.customer_zip_code || 'N/A'; // Use customer address or fallback
      order.customer_state = customer.state || order.customer_state || 'N/A'; // Use customer address or fallback
      order.customer_phone = customer.phone || order.customer_phone || 'N/A'; // Use customer address or fallback

      // Fetch driver details if shipping method is 'Self'
      if (order.shipping_method === 'Self' && order.driver_id) {
        const driverRes = await fetch(`https://processing-facility-backend.onrender.com/api/drivers/${order.driver_id}`, {
          headers: { 'Accept': 'application/json' },
        });
        if (!driverRes.ok) throw new Error('Failed to fetch driver details');
        const driver = await driverRes.json();
        order.driver_name = driver.name || 'N/A';
        order.driver_vehicle_number = driver.vehicle_number || 'N/A';
        order.driver_vehicle_type = driver.vehicle_type || 'N/A';
      } else if (order.shipping_method === 'Customer' && order.driver_details) {
        const driverDetails = JSON.parse(order.driver_details);
        order.driver_name = driverDetails.name || 'N/A';
        order.driver_vehicle_number = driverDetails.vehicle_number_plate || 'N/A';
        order.driver_vehicle_type = driverDetails.vehicle_type || 'N/A';
      } else {
        order.driver_name = 'N/A';
        order.driver_vehicle_number = 'N/A';
        order.driver_vehicle_type = 'N/A';
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
          driver_name: order.driver_name,
          driver_vehicle_number: order.driver_vehicle_number,
          driver_vehicle_type: order.driver_vehicle_type,
          driver_max_capacity: order.driver_max_capacity,
          price: order.price?.toString() || '0', // Reuse existing price, converted to string
          tax_percentage: order.tax_percentage?.toString() || '0', // Reuse existing tax_percentage, converted to string
          items: order.items,
          shipping_address: order.customer_address, // Ensure shipping address is set
          billing_address: order.billing_address,
        }),
      });

      if (!readyUpdateRes.ok) throw new Error('Failed to update order status to Ready for Shipment: ' + (await readyUpdateRes.text()));
      const updatedReadyOrder = await readyUpdateRes.json();
      console.log('Updated Order (Ready for Shipment):', updatedReadyOrder); // Log the updated order for debugging

      // Ensure order_id, customer_name, status, shipping_method, and items are preserved or defaulted after "Ready for Shipment" update
      order = {
        ...updatedReadyOrder,
        order_id: updatedReadyOrder.order_id || order.order_id,
        customer_id: updatedReadyOrder.customer_id || order.customer_id,
        customer_name: updatedReadyOrder.customer_name || order.customer_name || 'Unknown Customer',
        status: updatedReadyOrder.status || 'Processing',
        shipping_method: updatedReadyOrder.shipping_method || order.shipping_method || 'Self',
        items: updatedReadyOrder.items || order.items,
        customer_address: updatedReadyOrder.shipping_address || order.customer_address || 'N/A',
        customer_city: updatedReadyOrder.customer_city || order.customer_city || 'N/A',
        customer_state: updatedReadyOrder.customer_state || order.customer_state || 'N/A',
        customer_zip_code: updatedReadyOrder.customer_zip_code || order.customer_zip_code || 'N/A',
        customer_phone: updatedReadyOrder.customer_phone || order.customer_phone || 'N/A',
        driver_name: updatedReadyOrder.driver_name || order.driver_name || 'N/A',
        driver_vehicle_number: updatedReadyOrder.driver_vehicle_number || order.driver_vehicle_number || 'N/A',
        driver_vehicle_type: updatedReadyOrder.driver_vehicle_type || order.driver_vehicle_type || 'N/A',
        created_at: updatedReadyOrder.created_at || order.created_at || null,
      };

      if (!order.order_id || typeof order.order_id !== 'number') {
        throw new Error('Invalid order_id after Ready for Shipment update: ' + order.order_id);
      }

      // Generate Surat Jalan and BAST PDFs
      const suratJalanDoc = generateSuratJalanPDF({ ...order, customerName: order.customer_name, status: order.status, shippingMethod: order.shipping_method, items: order.items, driver: order.driver_name, vehicle_number: order.vehicle_number_plate });
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
          driver_name: order.driver_name,
          driver_vehicle_number: order.driver_vehicle_number,
          driver_vehicle_type: order.driver_vehicle_type,
          driver_max_capacity: order.driver_max_capacity,
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

  // Replace the handleOpenOrderModal function in Dashboard.js
  const handleOpenOrderModal = async (order, isEdit = false) => {
    setLoading(true); // Show loading state while fetching
    try {
      const orderRes = await fetch(`https://processing-facility-backend.onrender.com/api/orders/${order.order_id}`);
      if (!orderRes.ok) throw new Error('Failed to fetch order details');
      const fullOrder = await orderRes.json(); // Fetch the full order with items

      // Fetch payment history for the order
      const paymentsRes = await fetch(`https://processing-facility-backend.onrender.com/api/payments/${fullOrder.order_id}`);
      const payments = paymentsRes.ok ? await paymentsRes.json() : [];

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
        setSelectedOrder({ ...fullOrder, payments }); // Include payments in selectedOrder
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
        customer_address: order.customer_address || 'N/A',
        customer_city: order.customer_city || 'N/A',
        customer_state: order.customer_state || 'N/A',
        customer_zip_code: order.customer_zip_code || 'N/A',
        driver_name: order.driver_name || 'N/A',
        driver_vehicle_number: order.driver_vehicle_number || 'N/A',
        driver_vehicle_type: order.driver_vehicle_type || 'N/A',
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

  // Handle actions dropdown (Process, Reject, View Details, Ready for Shipment, In Transit, Record Payment)
  const handleActionsClick = (event, orderId) => {
    // Set anchorEl immediately to open the dropdown
    setAnchorEl(event.currentTarget);

    // Fetch order and payment data asynchronously in the background
    const fetchOrderData = async () => {
      setLoading(true); // Show loading while fetching
      try {
        // Fetch the order to ensure we have all details
        const orderRes = await fetch(`https://processing-facility-backend.onrender.com/api/orders/${orderId}`);
        if (!orderRes.ok) throw new Error('Failed to fetch order details');
        const fullOrder = await orderRes.json();

        // Fetch payment history for the order
        const paymentsRes = await fetch(`https://processing-facility-backend.onrender.com/api/payments/${orderId}`);
        const payments = paymentsRes.ok ? await paymentsRes.json() : [];

        // Update selectedOrder with the fetched data
        setSelectedOrder({ ...fullOrder, payments });
      } catch (error) {
        setSnackbar({ open: true, message: `Error fetching order details: ${error.message}`, severity: 'error' });
      } finally {
        setLoading(false); // Hide loading state
      }
    };

    // Call the fetch function immediately but don’t wait for it to complete (non-blocking)
    fetchOrderData();
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
          driver_name: order.driver_name,
          driver_vehicle_number: order.driver_vehicle_number,
          driver_vehicle_type: order.driver_vehicle_type,
          driver_max_capacity: order.driver_max_capacity,
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

  // Handle Order Arrived (update status to 'Delivered' and record arrive_at timestamp)
  const handleOrderArrived = async (orderId) => {
    setLoading(true);
    try {
      const res = await fetch(`https://processing-facility-backend.onrender.com/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedOrder.customer_id,
          status: 'Delivered',
          driver_id: selectedOrder.driver_id, // Reuse existing driver_id
          shipping_method: selectedOrder.shipping_method || 'Self', // Default to 'Self' if missing
          driver_name: order.driver_name,
          driver_vehicle_number: order.driver_vehicle_number,
          driver_vehicle_type: order.driver_vehicle_type,
          driver_max_capacity: order.driver_max_capacity,
          price: selectedOrder.price?.toString() || '0', // Reuse existing price, converted to string
          tax_percentage: selectedOrder.tax_percentage?.toString() || '0', // Reuse existing tax_percentage, converted to string
          items: selectedOrder.items
        }),
      });

      if (!res.ok) throw new Error('Failed to mark order as arrived: ' + (await res.text()));
      const updatedOrder = await res.json();
      console.log('Updated Order (Arrived):', updatedOrder);

      // Update the orders state safely with the "Delivered" status
      setOrders(prevOrders => prevOrders.map(o => o.order_id === orderId ? updatedOrder : o));

      setSnackbar({ open: true, message: 'Order marked as arrived successfully', severity: 'success' });
    } catch (error) {
      console.error('Error marking order as arrived:', error);
      setSnackbar({ open: true, message: `Error marking order as arrived: ${error.message}`, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Update handleRecordPayment to include uploading the proof of payment
  const handleRecordPayment = async (orderId) => {
    setLoading(true);
    try {
      const paymentDataToSend = {
        order_id: orderId,
        amount: paymentData.amount,
        payment_date: paymentData.paymentDate,
        notes: paymentData.notes || null,
      };

      // POST to create the payment record
      const paymentRes = await fetch('https://processing-facility-backend.onrender.com/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(paymentDataToSend),
      });

      if (!paymentRes.ok) throw new Error('Failed to record payment: ' + (await paymentRes.text()));
      const paymentResponse = await paymentRes.json();

      // Upload proof of payment to Google Drive if provided
      if (paymentProof) {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // 01-12
        const folderName = `${month}-${year}`;
        const parentFolderId = '1fham6qIb7htz8wEtSzQAc901BSbpV1Gt'; // Provided Google Drive folder ID

        // Check if the subfolder exists or create it
        let subfolderId = await checkOrCreateSubfolder(parentFolderId, folderName);
        
        // Upload the file to the subfolder
        const formData = new FormData();
        formData.append('order_id', orderId.toString());
        formData.append('type', 'Payment Proof');
        formData.append('file', paymentProof, `Proof_${orderId}_${dayjs().format('YYYYMMDD_HHmmss')}.${paymentProof.name.split('.').pop()}`);
        
        const uploadRes = await fetch('https://processing-facility-backend.onrender.com/api/documents/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) throw new Error('Failed to upload payment proof: ' + (await uploadRes.text()));
        await uploadRes.json();
        setPaymentProof(null); // Reset after upload
      }

      // Update order payment_status to 'Paid' and paid_at timestamp, without changing shipment status
      const orderUpdateRes = await fetch(`https://processing-facility-backend.onrender.com/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedOrder.customer_id,
          status: selectedOrder.status, // Preserve the current shipment status
          payment_status: 'Paid', // Update only payment_status
          driver_id: selectedOrder.driver_id, // Reuse existing driver_id
          shipping_method: selectedOrder.shipping_method || 'Self', // Default to 'Self' if missing
          driver_name: order.driver_name,
          driver_vehicle_number: order.driver_vehicle_number,
          driver_vehicle_type: order.driver_vehicle_type,
          driver_max_capacity: order.driver_max_capacity,
          price: selectedOrder.price?.toString() || '0', // Reuse existing price, converted to string
          tax_percentage: selectedOrder.tax_percentage?.toString() || '0', // Reuse existing tax_percentage, converted to string
          items: selectedOrder.items
        }),
      });

      if (!orderUpdateRes.ok) throw new Error('Failed to update order payment status to Paid: ' + (await orderUpdateRes.text()));
      const updatedOrder = await orderUpdateRes.json();
      console.log('Updated Order (Payment Recorded):', updatedOrder);

      // Update the orders state safely with the updated payment_status and paid_at
      setOrders(prevOrders => prevOrders.map(o => o.order_id === orderId ? updatedOrder : o));

      setSnackbar({ open: true, message: 'Payment recorded, proof uploaded, and order marked as paid successfully', severity: 'success' });
      setOpenPaymentModal(false); // Close the modal after successful submission
      setPaymentData({ amount: '', paymentDate: new Date().toISOString().split('T')[0], notes: '' }); // Reset payment data
    } catch (error) {
      console.error('Error recording payment:', error);
      setSnackbar({ open: true, message: `Error recording payment: ${error.message}`, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Add these helper functions at the top of Dashboard.js with other functions
  const checkOrCreateSubfolder = async (parentFolderId, folderName) => {
    const drive = google.drive({ version: 'v3', auth: oauth2Client }); // Ensure oauth2Client is defined as in your backend routes

    try {
      // Check if the subfolder exists
      const response = await drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents`,
        fields: 'files(id, name)',
      });

      if (response.data.files.length > 0) {
        return response.data.files[0].id; // Return existing folder ID
      }

      // Create the subfolder if it doesn’t exist
      const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId],
      };

      const folder = await drive.files.create({
        resource: folderMetadata,
        fields: 'id',
      });

      return folder.data.id; // Return new folder ID
    } catch (error) {
      throw new Error('Failed to check/create subfolder: ' + error.message);
    }
  };

  // Handle payment modal input changes
  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle closing the payment modal
  const handleClosePaymentModal = () => {
    setOpenPaymentModal(false);
    setPaymentData({ amount: '', paymentDate: new Date().toISOString().split('T')[0], notes: '' }); // Reset payment data
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

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Surat Perintah Kerja (SPK)', 105, 20, { align: 'center' });
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(11);

    doc.text(`Order ID`, 20, 40);
    doc.text(`: ${String(order.order_id).padStart(4, '0')}`, 50, 40);
    doc.text(`Customer`, 20, 45);
    doc.text(`: ${order.customerName || 'Unknown Customer'}`, 50, 45);
    doc.text(`Date`, 20, 50);
    doc.text(`: ${dayjs().format('YYYY-MM-DD')}`, 50, 50);
    doc.text(`Shipping Method`, 20, 55);
    doc.text(`: ${order.shippingMethod || 'Self'}`, 50, 55);
    doc.text(`Status`, 20, 60); // Show current status in SPM
    doc.text(`: ${order.status || 'Pending'}`, 50, 60); // Show current status in SPM

    if (!order.items || !Array.isArray(order.items)) {
      doc.text('No items available', 20, 70);
    } else {
      doc.autoTable({
        startY: 70,
        head: [['Product', 'Reference', 'Quantity (kg)', 'No of Bags', 'Price (IDR)']],
        body: order.items.map(item => [
          item.product || 'N/A',
          item.batch_number || 'N/A',
          item.quantity || 0,
          item.quantity/50 || 0,
          (item.price || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }),
        ]),
        styles: { font: 'Helvetica', fontSize: 11, cellPadding: 2 },
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

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Surat Permintaan Material (SPM)', 105, 20, { align: 'center' });
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(11);

    doc.text(`Order ID`, 20, 40);
    doc.text(`: ${String(order.order_id).padStart(4, '0')}`, 50, 40);
    doc.text(`Customer`, 20, 45);
    doc.text(`: ${order.customerName || 'Unknown Customer'}`, 50, 45);
    doc.text(`Date`, 20, 50);
    doc.text(`: ${dayjs().format('YYYY-MM-DD')}`, 50, 50);
    doc.text(`Status`, 20, 55); // Show current status in SPM
    doc.text(`: ${order.status || 'Pending'}`, 50, 55); // Show current status in SPM

    if (!order.items || !Array.isArray(order.items)) {
      doc.text('No items available', 20, 65);
    } else {
      doc.autoTable({
        startY: 65,
        head: [['Product', 'Reference', 'Quantity (kg)', 'No of Bags', 'Required By']],
        body: order.items.map(item => [
          item.product || 'N/A',
          item.batch_number || 'N/A',
          item.quantity || 0,
          item.quantity/50 || 0,
          dayjs().add(7, 'days').format('YYYY-MM-DD'), // Example: 7 days from now
        ]),
        styles: { font: 'Helvetica', fontSize: 11, cellPadding: 2 },
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

    // Header: Left-aligned company details, Right-aligned title on the same line
    doc.setFont('Helvetica', 'bold');
    doc.text('PT. BERKAS TUAIAN MELIMPAH', 20, 20);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Bengkala, Kubutambahan, Buleleng, Bali', 20, 25);
    doc.text('Telp. 085175027797', 20, 30);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(20); // Larger font for "SURAT JALAN"
    doc.text('Delivery Order (DO)', 190, 20, { align: 'right' });
    doc.setFontSize(11); // Reset font size
    doc.setFont('Helvetica', 'normal');

    // Divider
    doc.line(20, 35, 190, 35); // Horizontal line

    doc.text(`Order ID`, 20, 40);
    doc.text(`: ${String(order.order_id).padStart(4, '0')}`, 50, 40);
    doc.text(`Customer`, 20, 50);
    doc.text(`: ${order.customerName || 'Unknown Customer'}`, 50, 50);
    doc.text(`Address`, 20, 55);
    doc.text(`: ${order.customer_address || 'N/A'}`, 50, 55);
    doc.text(`City`, 20, 60);
    doc.text(`: ${order.customer_city || 'N/A'}`, 50, 60);
    doc.text(`State`, 20, 65);
    doc.text(`: ${order.customer_state || 'N/A'}`, 50, 65);
    doc.text(`Zip Code`, 20, 70);
    doc.text(`: ${order.customer_zip_code || 'N/A'}`, 50, 70);
    doc.text(`Shipping Method`, 20, 80);
    doc.text(`: ${order.shippingMethod || 'Self'}`, 50, 80);
    doc.text(`Driver Name`, 20, 85);
    doc.text(`: ${order.driver_name || 'N/A'}`, 50, 85);
    doc.text(`Number Plate`, 20, 90);
    doc.text(`: ${order.driver_vehicle_number || 'N/A'}`, 50, 90);
    doc.text(`Vehicle Type`, 20, 95);
    doc.text(`: ${order.driver_vehicle_type || 'N/A'}`, 50, 95);
    doc.text(`Status`, 20, 100); // Show current status in DO
    doc.text(`: ${order.status || 'Pending'}`, 50, 100); // Show current status in DO

    if (!order.items || !Array.isArray(order.items)) {
      doc.text('No items available', 20, 110);
    } else {
      doc.autoTable({
        startY: 110,
        head: [['Product', 'Reference', 'Quantity (kg)', 'No of Bags', 'Delivery Date']],
        body: order.items.map(item => [
          item.product || 'N/A',
          item.batch_number || 'N/A',
          item.quantity || 0,
          item.quantity/50 || 0,
          dayjs().add(14, 'days').format('YYYY-MM-DD'), // Example: 14 days from now
        ]),
        styles: { font: 'Helvetica', fontSize: 11, cellPadding: 2 },
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
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Bengkala, Kubutambahan, Buleleng, Bali', 20, 25);
    doc.text('Telp. 085175027797', 20, 30);
    doc.setFont('Helvetica', 'bold');
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
    const address = `${order.customer_address}` || 'N/A';
    const maxWidth = 200; // Available width for address (from x: 45 to x: 190)
    const fontSize = 10; // Current font size
    const lines = doc.splitTextToSize(address, maxWidth / (fontSize / 2)); // Split text to fit width, approximate scaling
    lines.forEach((line, index) => {
      doc.text(line, 45, 50 + (index * 5)); // 5mm line height, starting at y: 50
    });

    doc.text(`${order.customer_city || 'N/A'}, ${order.customer_state || 'N/A'}, ${order.customer_zip_code || 'N/A'}`, 45, 50 + (lines.length * 5));
    doc.text('Telp:', 20, 55 + (lines.length * 5));
    doc.text(`${order.customer_phone || 'N/A'}`, 45, 55 + (lines.length * 5));

    // Right-aligned document details on the same line as "Kepada Yth."
    const expedition = order.shippingMethod === 'Self' ? 'Warehouse arranged' : 'Customer arranged';
    doc.text(`No. Surat Jalan : SJ/${String(order.order_id).padStart(4, '0')}/${dayjs().format('YYYY')}`, 190, 45, { align: 'right' });
    doc.text(`Tanggal : ${dayjs().locale('id').format('DD MMMM YYYY')}`, 190, 50, { align: 'right' });
    doc.text(`Ekspedisi : ${expedition}`, 190, 55, { align: 'right' });
    doc.text(`Nama Driver : ${order.driver_name}`, 190, 60, { align: 'right' });
    doc.text(`TNKB : ${order.vehicle_number_plate}`, 190, 65, { align: 'right' });

    // Items Table
    let tableStartY = 65 + (lines.length * 5); // Adjust table start based on address lines
    if (tableStartY < 65) tableStartY = 65; // Ensure table doesn’t start too early

    doc.autoTable({
      startY: tableStartY,
      head: [['Nama Barang', 'Reference', 'Berat Total (kg)', 'Jumlah Karung', 'Keterangan']],
      body: order.items.map((item, index) => [
        item.product || 'N/A',
        item.batch_number || 'N/A',
        item.quantity || 0,
        item.quantity/50 || 0,
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
    doc.text(`Haris Ariansyah`, positions[2], signatureY + 10, { align: 'center' }); // Placeholder for warehouse staff, adjust if available
  
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
    doc.text(`${order.customer_address}` || 'N/A', 45, 85);
    doc.text(`${order.customer_city}, ${order.customer_state}, ${order.customer_zip_code}` || 'N/A', 45, 90);

    doc.text('Selanjutnya disebut PIHAK KEDUA', 20, 95);

    // Statement
    doc.text('Dengan ini menyatakan bahwa PIHAK PERTAMA telah menyerahkan kepada PIHAK KEDUA berupa:', 20, 100);

    // Items Table (Updated to match OCR, removing Merk Barang column)
    doc.autoTable({
      startY: 110,
      head: [['No.', 'Jenis Barang', 'Product Reference', 'Berat Total (kg)', 'Jumlah Karung', 'Keterangan']],
      body: order.items.map((item, index) => [
        (index + 1).toString(),
        item.product || 'N/A',
        item.batch_number || 'N/A',
        item.quantity || 0, // Match OCR format ($10000.00(kg) → simplified to numeric with kg)
        item.quantity/50 || 0, // Match OCR format ($10000.00(kg) → simplified to numeric with kg)
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
    doc.text(`Haris Ariansyah`, 50, tableEndY + 60, { align: 'center' });
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
      field: 'payment_status', 
      headerName: 'Payment Status', 
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
            backgroundColor: params.value === 'Pending' ? '#d32f2f' : params.value === 'Partial Payment' ? '#f57c00' : params.value === 'Full Payment' ? '#4caf50' : '#757575', // Red for Pending, Yellow for Partial, Green for Full
            color: '#fff', // White text for contrast
            fontSize: '0.875rem',
            textTransform: 'none',
            alignItems: 'center',
            '&:hover': {
              backgroundColor: params.value === 'Pending' ? '#d32f2f' : params.value === 'Partial Payment' ? '#f57c00' : params.value === 'Full Payment' ? '#4caf50' : '#757575', // Maintain background color on hover
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
        const hasPayment = order.payment_status !== 'Pending'; // True if any payment has been received (not Pending)
        const fullPayment = order.payment_status == 'Full Payment'
    
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
                disabled={isProcessed || isRejected || isReady || isShipped || isDelivered }
              >
                Process Order
              </MenuItem>
              <MenuItem 
                onClick={handleReject} 
                disabled={isRejected || isShipped || isDelivered || hasPayment}
              >
                Reject Order
              </MenuItem>
              <Divider sx={{ my: 0.5 }} /> {/* Divider after status-changing actions */}
              <MenuItem 
                onClick={openReadyForShipmentConfirm} 
                disabled={!isProcessed || isRejected || isReady || isShipped || isDelivered }
              >
                Ready for Shipment
              </MenuItem>
              <MenuItem 
                onClick={openInTransitConfirm} 
                disabled={!isReady || isRejected || isShipped || isDelivered }
              >
                In Transit
              </MenuItem>
              <MenuItem 
                onClick={() => handleOrderArrived(params.row.order_id)} 
                disabled={!isShipped || isDelivered || isRejected}
              >
                Order Arrived
              </MenuItem>
              <MenuItem 
                onClick={() => setOpenPaymentModal(true)} 
                disabled={ isRejected || fullPayment } // Allow payment recording unless any payment is received or Rejected
              >
                Record Payment
              </MenuItem>
              <Divider sx={{ my: 0.5 }} /> {/* Divider before non-status-changing actions */}
              <MenuItem onClick={() => handleOpenOrderModal(params.row, false)}>View Details</MenuItem>
              <MenuItem 
                onClick={() => handleOpenOrderModal(params.row, true)} 
                disabled={ isShipped || isDelivered || hasPayment}
              >
                Edit Order
              </MenuItem>
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
      payment_status: order?.payment_status || 'Pending', // Default to 'Pending' if not set
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
                  {item.value}
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
          maxWidth: 800, 
          maxHeight: '80vh', 
          overflowY: 'auto', 
          mx: 'auto', 
          mt: '10vh', 
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
                  <Typography variant="body2"><strong>Created At:</strong> {dayjs(selectedOrder?.created_at).format('YYYY-MM-DD HH:mm:ss') || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Processed At:</strong> {dayjs(selectedOrder?.process_at).format('YYYY-MM-DD HH:mm:ss') || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Rejected At:</strong> {dayjs(selectedOrder?.reject_at).format('YYYY-MM-DD HH:mm:ss') || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Ready for Shipment At:</strong> {dayjs(selectedOrder?.ready_at).format('YYYY-MM-DD HH:mm:ss') || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Shipped At:</strong> {dayjs(selectedOrder?.ship_at).format('YYYY-MM-DD HH:mm:ss') || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Delivered At:</strong> {dayjs(selectedOrder?.arrive_at).format('YYYY-MM-DD HH:mm:ss') || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Paid At:</strong> {dayjs(selectedOrder?.paid_at).format('YYYY-MM-DD HH:mm:ss') || 'N/A'}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
              </Box>

              {/* Payment History (Added at the Bottom for View Mode) */}
              <Box sx={{ mt: 3, mb: 2, maxHeight: '800px', overflowY: 'auto', border: '2px' }}>
                <Typography variant="subtitle1" gutterBottom>Payment History</Typography>
                {(selectedOrder?.payments || []).length > 0 ? (
                  [...(selectedOrder?.payments || [])] // Create a copy to avoid mutating the original array
                    .sort((a, b) => new Date(a.payment_date) - new Date(b.payment_date)) // Sort by payment_date (oldest to newest)
                    .map((payment, index) => (
                      <Box key={index} sx={{ mb: 2, p: 2, border: '2px solid', borderRadius: 1 }}>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                          Payment #{index + 1}: {Number(payment.amount).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Date: {dayjs(payment.payment_date).format('YYYY-MM-DD HH:mm:ss')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Status: {payment.payment_status || 'Completed'}
                        </Typography>
                        {payment.notes && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Notes: {payment.notes}
                          </Typography>
                        )}
                        {payment.drive_url && (
                          <Typography variant="body2" color="text.secondary">
                            Proof: <a href={payment.drive_url} target="_blank" rel="noopener noreferrer" style={{ color: '#90caf9' }}>View Proof</a>
                          </Typography>
                        )}
                      </Box>
                    ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                    No payment history available.
                  </Typography>
                )}
              </Box>
              <Divider sx={{ my: 1 }} />
  
              {/* Order View/Edit Form */}
              <Box>
                {/* Customer Details (Always Shown in View Mode) */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" gutterBottom>Customer Details</Typography>
                  <TextField
                    label="Name"
                    value={selectedOrder.customer_name || '-'}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Address"
                    value={selectedOrder.customer_address || '-'}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Phone"
                    value={selectedOrder.customer_phone || '-'}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Email"
                    value={selectedOrder.customer_email || '-'}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Country"
                    value={selectedOrder.customer_country || '-'}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="State"
                    value={selectedOrder.customer_state || '-'}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="City"
                    value={selectedOrder.customer_city || '-'}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Zip Code"
                    value={selectedOrder.customer_zip_code || '-'}
                    InputProps={{ readOnly: true }}
                    fullWidth
                  />
                </Box>

                {/* Shipping Method and Driver Details */}
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Shipping Method</InputLabel>
                  <Select
                    name="shipping_method"
                    value={editOrder ? editOrder.shipping_method : selectedOrder.shipping_method || 'Customer'}
                    onChange={editOrder ? handleEditInputChange : undefined}
                    label="Shipping Method"
                    disabled={true} // Disabled for view mode
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

                {/* Order Items (Visible but Disabled in View Mode) */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>Order Items</Typography>
                  {(selectedOrder.items || []).map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <TextField
                        label="Product"
                        value={item.product}
                        InputProps={{ readOnly: true }}
                        sx={{ mr: 2, flex: 1 }}
                      />
                      <TextField
                        label="Quantity (kg)"
                        type="number"
                        value={item.quantity}
                        InputProps={{ readOnly: true }}
                        sx={{ mr: 1, width: '120px' }}
                      />
                      <TextField
                        label="Price per Unit (IDR)"
                        type="number"
                        value={item.price}
                        InputProps={{ readOnly: true }}
                        sx={{ mr: 1, width: '120px' }}
                      />
                    </Box>
                  ))}
                </Box>

                <Divider sx={{ mb: 2 }} /> {/* Divider between Items and Totals */}

                {/* Subtotal, Tax, and Grand Total (Visible but Disabled in View Mode) */}
                <Box sx={{ maxWidth: '70%', ml: 'auto', mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Subtotal Price (IDR)"
                    value={Number(selectedOrder.price || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                    InputProps={{ readOnly: true }}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Tax Percentage (%)"
                    value={selectedOrder.tax_percentage || '0'}
                    InputProps={{ readOnly: true }}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Grand Total (IDR)"
                    value={Number(selectedOrder.grand_total || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                    InputProps={{ readOnly: true }}
                    sx={{ mb: 2 }}
                  />
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

      {/* Payment Recording Modal */}
      <Modal
        open={openPaymentModal}
        onClose={handleClosePaymentModal}
        aria-labelledby="payment-modal-title"
        aria-describedby="payment-modal-description"
      >
        <Paper sx={{ 
          p: 3, 
          maxWidth: 800, 
          maxHeight: '80vh', 
          overflowY: 'auto', 
          mx: 'auto', 
          mt: '10vh', 
          borderRadius: 2, 
        }}>
          <Typography 
            variant="h6" 
            id="payment-modal-title" 
            gutterBottom 
            sx={{ 
              textAlign: 'center', 
              fontWeight: 'bold', 
            }}
          >
            Record Payment for Order ID {selectedOrder?.order_id || 'N/A'}
          </Typography>

          {/* Display Grand Total and Due Amount */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography 
              variant="subtitle1" 
              sx={{ fontWeight: 'medium', color: 'text.secondary' }}
            >
              Grand Total: {Number(selectedOrder?.grand_total || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
            </Typography>
            <Typography 
              variant="subtitle1" 
              sx={{ fontWeight: 'medium', color: 'text.secondary' }}
            >
              Due Amount: {Number((selectedOrder?.grand_total || 0) - (selectedOrder?.payments?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0)).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
            </Typography>
          </Box>

          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Amount Paid (IDR)"
              name="amount"
              type="number"
              value={paymentData.amount}
              onChange={handlePaymentInputChange}
              sx={{ mb: 2 }}
              required
              InputProps={{ inputProps: { min: 0 } }} // Ensure non-negative
            />
            <TextField
              fullWidth
              label="Payment Date"
              name="paymentDate"
              type="date"
              value={paymentData.paymentDate}
              onChange={handlePaymentInputChange}
              sx={{ mb: 2 }}
              required
            />

            {/* Drag-and-Drop File Uploader for Proof of Payment */}
            <Box sx={{ mb: 2, p: 2, height: 200, border: '2px dashed #ccc', borderRadius: 2, textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center' }} {...getRootProps()}>              <input {...getInputProps()} />
              {isDragActive ? (
                <Typography>Drop the files here ...</Typography>
              ) : (
                <Typography>Drag 'n' drop proof of payment here, or click to select file</Typography>
              )}
              {paymentProof && <Typography sx={{ mt: 1, color: 'text.secondary' }}>{paymentProof.name}</Typography>}
            </Box>

            <TextField
              fullWidth
              label="Notes (Optional)"
              name="notes"
              value={paymentData.notes}
              onChange={handlePaymentInputChange}
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />

            {/* Payment History List */}
            <Box sx={{ mt: 3, mb: 2, maxHeight: '800px', overflowY: 'auto' }}>
              <Typography variant="subtitle1" gutterBottom>Payment History</Typography>
              {(selectedOrder?.payments || []).length > 0 ? (
                [...(selectedOrder?.payments || [])] // Create a copy to avoid mutating the original array
                  .sort((a, b) => new Date(a.payment_date) - new Date(b.payment_date)) // Sort by payment_date (oldest to newest)
                  .map((payment, index) => (
                    <Box key={index} sx={{ mb: 2, p: 2, border: '2px solid', borderRadius: 1 }}>
                      <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                        Payment #{index + 1}: {Number(payment.amount).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Date: {dayjs(payment.payment_date).format('YYYY-MM-DD HH:mm:ss')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Status: {payment.payment_status || 'Completed'}
                      </Typography>
                      {payment.notes && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Notes: {payment.notes}
                        </Typography>
                      )}
                      {payment.drive_url && (
                        <Typography variant="body2" color="text.secondary">
                          Proof: <a href={payment.drive_url} target="_blank" rel="noopener noreferrer" style={{ color: '#90caf9' }}>View Proof</a>
                        </Typography>
                      )}
                    </Box>
                  ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                  No payment history available.
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => handleRecordPayment(selectedOrder?.order_id)}
                disabled={loading || !selectedOrder}
              >
                Record Payment
              </Button>
              <Button 
                variant="outlined" 
                color="secondary" 
                onClick={handleClosePaymentModal}
              >
                Cancel
              </Button>
            </Box>
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