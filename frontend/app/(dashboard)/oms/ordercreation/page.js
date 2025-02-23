"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Divider,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid'; // Free version for CRUD, sorting, filtering, export
import { useSession } from 'next-auth/react';
import CustomerModal from '../../components/CustomerModal';
import DriverModal from '../../components/DriverModal';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import dayjs from 'dayjs';
import CloseIcon from '@mui/icons-material/Close';

const OrderCreation = () => {
  const { data: session, status } = useSession();
  const [customers, setCustomers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [orders, setOrders] = useState([]); // For DataGrid
  const [formData, setFormData] = useState({
    customer_id: '',
    driver_id: '', // Optional for Self-Arranged
    items: [{ product: '', quantity: '', price: '' }], // Items with product, quantity, and price
    shipping_method: 'Customer',
    driver_details: { // Driver details for both methods
      name: '',
      vehicle_number_plate: '',
      vehicle_type: '',
      max_capacity: '' // In kg or units
    },
    price: '', // Total price in IDR (subtotal, calculated from items)
    tax_percentage: '' // Tax percentage for the order
  });
  const [loading, setLoading] = useState(false);
  const [openCustomerModal, setOpenCustomerModal] = useState(false);
  const [openDriverModal, setOpenDriverModal] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [rowModesModel, setRowModesModel] = useState({}); // For DataGrid row editing

  // Fetch initial data (customers, drivers, and orders)
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [customersRes, driversRes, ordersRes] = await Promise.all([
          fetch('https://processing-facility-backend.onrender.com/api/customers'),
          fetch('https://processing-facility-backend.onrender.com/api/drivers'),
          fetch('https://processing-facility-backend.onrender.com/api/orders'), // Fetch all orders
        ]);

        if (!customersRes.ok || !driversRes.ok || !ordersRes.ok) throw new Error('Failed to fetch initial data');
        const customersData = await customersRes.json();
        const driversData = await driversRes.json();
        const ordersData = await ordersRes.json();

        console.log('Orders Data:', ordersData); // Log to debug API response

        setCustomers(customersData || []);
        setDrivers(driversData || []);
        setOrders(ordersData || []);
      } catch (error) {
        setSnackbar({ open: true, message: error.message, severity: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [refreshCounter]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'shipping_method') {
      setFormData(prev => ({
        ...prev,
        shipping_method: value,
        driver_id: value === 'Self' ? '' : prev.driver_id, // Reset for Self-Arranged
        driver_details: value === 'Self' 
          ? { name: '', vehicle_number_plate: '', vehicle_type: '', max_capacity: '' } 
          : prev.driver_details // Retain for Customer-Arranged
      }));
    } else if (name.startsWith('driver_details.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        driver_details: { ...prev.driver_details, [field]: value }
      }));
    } else if (name === 'tax_percentage') {
      setFormData(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
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

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData(prev => ({ ...prev, items: newItems }));
    // Recalculate subtotal (price) when item price or quantity changes
    const subtotal = newItems.reduce((sum, item) => sum + (parseFloat(item.price || 0) * parseFloat(item.quantity || 0)), 0);
    setFormData(prev => ({ ...prev, price: subtotal.toString() })); // Update subtotal in IDR as string
  };

  const addItem = () => {
    setFormData(prev => ({ ...prev, items: [...prev.items, { product: '', quantity: '', price: '' }] }));
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) {
      setSnackbar({ open: true, message: 'At least one item is required', severity: 'warning' });
      return;
    }
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: newItems }));
    // Recalculate subtotal (price) after removal
    const subtotal = newItems.reduce((sum, item) => sum + (parseFloat(item.price || 0) * parseFloat(item.quantity || 0)), 0);
    setFormData(prev => ({ ...prev, price: subtotal.toString() })); // Update subtotal in IDR as string
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
      setFormData(prev => ({ ...prev, customer_id: customer.customer_id }));
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
      setFormData(prev => ({ ...prev, driver_id: driver.driver_id }));
      setRefreshCounter(prev => prev + 1);
      setSnackbar({ open: true, message: 'Driver added successfully', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    }
    setOpenDriverModal(false);
  };

  const handleSubmit = async () => {
    if (!formData.customer_id || !formData.items.every(item => item.product && item.quantity && item.price) || !formData.shipping_method) {
      setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'warning' });
      return;
    }

    // Validate numeric fields
    const subtotal = parseFloat(formData.price) || 0;
    const taxPercentage = parseFloat(formData.tax_percentage) || 0;

    if (isNaN(subtotal) || subtotal < 0) {
      setSnackbar({ open: true, message: 'Invalid subtotal: must be a non-negative number', severity: 'error' });
      return;
    }
    if (isNaN(taxPercentage) || taxPercentage < 0 || taxPercentage > 100) {
      setSnackbar({ open: true, message: 'Invalid tax percentage: must be a number between 0 and 100', severity: 'error' });
      return;
    }

    // Validate items
    for (const item of formData.items) {
      const itemPrice = parseFloat(item.price) || 0;
      const itemQuantity = parseFloat(item.quantity) || 0;

      if (isNaN(itemPrice) || itemPrice < 0 || isNaN(itemQuantity) || itemQuantity < 0) {
        setSnackbar({ open: true, message: 'Invalid item price or quantity: must be non-negative numbers', severity: 'error' });
        return;
      }
    }

    setLoading(true);
    try {
      // Create the order first
      const orderData = new FormData();
      orderData.append('customer_id', formData.customer_id);
      orderData.append('driver_id', formData.shipping_method === 'Self' ? formData.driver_id : ''); // Only for Self-Arranged
      orderData.append('shipping_method', formData.shipping_method);
      orderData.append('driver_details', JSON.stringify(formData.driver_details)); // For both methods
      orderData.append('price', formData.price || '0'); // Subtotal in IDR as string
      orderData.append('tax_percentage', formData.tax_percentage || '0'); // Tax percentage as string

      const orderRes = await fetch('https://processing-facility-backend.onrender.com/api/orders', {
        method: 'POST',
        body: orderData,
      });

      if (!orderRes.ok) throw new Error('Failed to create order');
      const orderResult = await orderRes.json();
      const orderId = orderResult.order_id; // Assuming the backend returns the created order_id

      if (!orderId) throw new Error('Order ID not found in response');

      // Create order items
      for (const item of formData.items) {
        const itemData = new FormData();
        itemData.append('order_id', orderId);
        itemData.append('product', item.product);
        itemData.append('quantity', item.quantity.toString()); // Ensure as string
        itemData.append('price', item.price.toString()); // Ensure as string

        const itemRes = await fetch('https://processing-facility-backend.onrender.com/api/order-items', {
          method: 'POST',
          body: itemData,
        });

        if (!itemRes.ok) throw new Error('Failed to create order item');
      }

      // Generate PDF
      const orderListDoc = generateOrderListPDF(orderId);
      const orderListBlob = orderListDoc.output('blob');

      const orderListFormData = new FormData();
      orderListFormData.append('order_id', orderId);
      orderListFormData.append('type', 'Order List');
      orderListFormData.append('details', JSON.stringify({
        customer_id: formData.customer_id,
        items: formData.items,
        shipping_method: formData.shipping_method,
        driver_id: formData.driver_id || null,
        driver_details: formData.driver_details || null,
        price: formData.price || null, // Subtotal
        tax_percentage: formData.tax_percentage || null,
      }));
      orderListFormData.append('file', orderListBlob, `OrderList-${orderId}.pdf`);

      const docRes = await fetch('https://processing-facility-backend.onrender.com/api/documents/upload', {
        method: 'POST',
        body: orderListFormData,
      });

      if (!docRes.ok) throw new Error('Failed to upload Order List');

      orderListDoc.save(`OrderList-${orderId}.pdf`);

      setSnackbar({ open: true, message: 'Order and Order List created successfully', severity: 'success' });
      setFormData({ 
        customer_id: '', 
        driver_id: '', 
        items: [{ product: '', quantity: '', price: '' }], 
        shipping_method: 'Customer', 
        driver_details: { name: '', vehicle_number_plate: '', vehicle_type: '', max_capacity: '' }, 
        price: '', 
        tax_percentage: '' 
      });
      setShowCustomerDetails(false);
      setSelectedCustomer(null);
      setRefreshCounter(prev => prev + 1); // Refresh data after submission
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false }); // Single instance of handleCloseSnackbar

  const generateOrderListPDF = (orderId) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [241.3, 279.4],
    });

    const customer = customers.find(c => c.customer_id === formData.customer_id);
    const driver = formData.shipping_method === 'Self' 
      ? drivers.find(d => d.driver_id === formData.driver_id) 
      : formData.driver_details;

    const addText = (text, x, y, options = {}) => {
      doc.setFont('Arial', options.bold ? 'bold' : 'normal');
      doc.setFontSize(options.size || 12);
      if (options.align) doc.text(text, x, y, { align: options.align });
      else doc.text(text, x, y);
    };

    addText("PT. Berkas Tuaian Melimpah", doc.internal.pageSize.getWidth() / 2, 15, { align: 'center', bold: true, size: 16 });
    addText("Order List", doc.internal.pageSize.getWidth() / 2, 23, { align: 'center', bold: true, size: 14 });
    addText(`Date: ${dayjs().format('YYYY-MM-DD')}`, doc.internal.pageSize.getWidth() - 14, 15, { align: 'right' });
    addText(`Time: ${dayjs().format('HH:mm:ss')}`, doc.internal.pageSize.getWidth() - 14, 23, { align: 'right' });
    doc.line(14, 28, doc.internal.pageSize.getWidth() - 14, 28);
    addText(`Order ID: ${orderId}`, 14, 35, { bold: true });

    let yOffset = 45;
    const columnWidth = (doc.internal.pageSize.getWidth() - 40) / 2;

    addText("Customer Information:", 14, yOffset, { bold: true });
    yOffset += 8;
    addText(`Name: ${customer ? customer.name : '-'}`, 14, yOffset);
    yOffset += 6;
    addText(`Address: ${customer ? customer.address : '-'}`, 14, yOffset);
    yOffset += 6;
    addText(`Phone: ${customer ? customer.phone : '-'}`, 14, yOffset);
    yOffset += 6;
    addText(`Email: ${customer ? customer.email || '-' : '-'}`, 14, yOffset);
    yOffset += 6;
    addText(`Country: ${customer ? customer.country || '-' : '-'}`, 14, yOffset);
    yOffset += 6;
    addText(`State: ${customer ? customer.state || '-' : '-'}`, 14, yOffset);
    yOffset += 6;
    addText(`City: ${customer ? customer.city || '-' : '-'}`, 14, yOffset);
    yOffset += 6;
    addText(`Zip Code: ${customer ? customer.zip_code || '-' : '-'}`, 14, yOffset);

    let shippingOffset = 45;
    addText("Shipping Information:", 14 + columnWidth + 10, shippingOffset, { bold: true });
    shippingOffset += 8;
    addText(`Method: ${formData.shipping_method}`, 14 + columnWidth + 10, shippingOffset);
    shippingOffset += 6;
    if (driver) {
      addText(`Driver Name: ${driver.name || '-'}`, 14 + columnWidth + 10, shippingOffset);
      shippingOffset += 6;
      addText(`Vehicle No.: ${driver.vehicle_number_plate || driver.vehicle_number || '-'}`, 14 + columnWidth + 10, shippingOffset);
      shippingOffset += 6;
      addText(`Vehicle Type: ${driver.vehicle_type || '-'}`, 14 + columnWidth + 10, shippingOffset);
      shippingOffset += 6;
      addText(`Max Capacity: ${driver.max_capacity ? driver.max_capacity + ' kg' : '-'}`, 14 + columnWidth + 10, shippingOffset);
    }

    // Fetch order items for the PDF (using form data since backend sync isn't implemented here for simplicity)
    let items = formData.items; 
    let tableOffset = Math.max(yOffset, driver ? shippingOffset + 6 : shippingOffset) + 10;
    addText("Items:", 14, tableOffset, { bold: true });
    doc.autoTable({
      startY: tableOffset + 8,
      head: [['Product', 'Quantity (kg)', 'Price (IDR)', 'Subtotal (IDR)']],
      body: items.map(item => [
        item.product,
        item.quantity,
        item.price || '0',
        (parseFloat(item.price || 0) * parseFloat(item.quantity || 0)).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })
      ]),
      styles: { font: 'Arial', fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
      margin: { left: 14, right: 14 },
    });

    let signatureOffset = doc.lastAutoTable.finalY + 10;
    doc.line(14, signatureOffset, doc.internal.pageSize.getWidth() - 14, signatureOffset);
    const signatureY = signatureOffset + 20;
    const labelY = signatureY + 6;
    const signatureLength = 30;

    addText("_".repeat(signatureLength), 14, signatureY);
    addText("Order Staff", 14, labelY);
    addText(session.user.name || '-', 14, labelY + 6);

    addText("_".repeat(signatureLength), 80, signatureY);
    addText("Manager", 80, labelY);
    addText('(..................)', 80, labelY + 12);

    if (driver) {
      addText("_".repeat(signatureLength), 146, signatureY);
      addText("Driver", 146, labelY);
      addText(driver.name || '-', 146, labelY + 6);
    }

    // Calculate totals for PDF (frontend calculation)
    const subtotal = parseFloat(formData.price || '0') || items.reduce((sum, item) => sum + (parseFloat(item.price || '0') * parseFloat(item.quantity || '0')), 0);
    const taxRate = parseFloat(formData.tax_percentage || '0') / 100 || 0;
    const tax = subtotal * taxRate;
    const grandTotal = subtotal + tax;

    doc.line(14, doc.internal.pageSize.getHeight() - 40, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 40);
    addText(`Subtotal: ${subtotal.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}`, 14, doc.internal.pageSize.getHeight() - 30, { size: 10 });
    addText(`Tax (${(taxRate * 100).toFixed(2)}%): ${tax.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}`, 14, doc.internal.pageSize.getHeight() - 20, { size: 10 });
    addText(`Grand Total: ${grandTotal.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}`, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 10, { align: 'right', size: 10 });

    doc.line(14, doc.internal.pageSize.getHeight() - 14, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 14);
    addText(`Printed on: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`, 14, doc.internal.pageSize.getHeight() - 8, { size: 10 });

    return doc;
  };

  // Handle DataGrid row editing
  const handleRowEditStart = (params, event) => {
    event.defaultMuiPrevented = true;
  };

  const handleRowEditStop = (params, event) => {
    event.defaultMuiPrevented = true;
  };

  const handleEditRowsModelChange = (model) => {
    setRowModesModel(model);
  };

  const processRowUpdate = async (newRow) => {
    try {
      const response = await fetch(`https://processing-facility-backend.onrender.com/api/orders/${newRow.order_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newRow.status,
          driver_id: newRow.driver_id,
          shipping_method: newRow.shipping_method,
          driver_details: newRow.driver_details ? JSON.parse(newRow.driver_details) : null,
          price: newRow.price.toString(), // Send as string to match backend expectations
          tax_percentage: newRow.tax_percentage.toString(), // Send as string to match backend expectations
        }),
      });

      if (!response.ok) throw new Error('Failed to update order');
      const updatedOrder = await response.json();
      setOrders(orders.map(order => order.order_id === newRow.order_id ? updatedOrder : order));
      setSnackbar({ open: true, message: 'Order updated successfully', severity: 'success' });
      return updatedOrder;
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
      throw error;
    }
  };

  // DataGrid columns and rows
  const ordersColumns = [
    { field: 'order_id', headerName: 'Order ID', width: 50, sortable: true, editable: true },
    // { field: 'customer_id', headerName: 'Customer ID', flex: 1, editable: true },
    { field: 'customer_name', headerName: 'Customer Name', width: 180, sortable: true, editable: false },
    { field: 'shipping_method', headerName: 'Shipping Method', width: 120, sortable: true, editable: true },
    { field: 'subtotal', headerName: 'Subtotal (IDR)', width: 180, sortable: true, editable: true, valueFormatter: (params) => params.value ? params.value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }) : '0 IDR' },
    { field: 'tax_percentage', headerName: 'Tax (%)', width: 80, sortable: true, editable: true, valueFormatter: (params) => params.value ? `${params.value.toFixed(2)}%` : '0%' },
    { field: 'tax', headerName: 'Tax (IDR)', width: 80, sortable: true, editable: false, valueFormatter: (params) => params.value ? params.value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }) : '0 IDR' },
    { field: 'grand_total', headerName: 'Grand Total (IDR)', width: 180, sortable: true, editable: false, valueFormatter: (params) => params.value ? params.value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }) : '0 IDR' },
    { field: 'created_at', headerName: 'Date', width: 120, sortable: true, editable: false, valueFormatter: (params) => params.value ? dayjs(params.value).format('YYYY-MM-DD HH:mm:ss') : '-' },
    { field: 'status', headerName: 'Status', width: 120, sortable: true, editable: true },
    { 
      field: 'address', 
      headerName: 'Customer Address', 
      flex: 1, 
      editable: false, // Allow truncation for long addresses
    },
    { 
      field: 'document', 
      headerName: 'Order List', 
      flex: 1, 
      editable: false, 
      renderCell: (params) => (
        <Button 
          variant="text" 
          onClick={() => window.open(params.row.document_url || '#', '_blank')}
          disabled={!params.row.document_url}
        >
          View PDF
        </Button>
      )
    },
  ];

  const ordersRows = (orders || []).map(order => ({
    id: order?.order_id || '-',
    order_id: order?.order_id || '-',
    // customer_id: order?.customer_id || '-',
    customer_name: order?.customer_name || '-',
    shipping_method: order?.shipping_method || '-',
    subtotal: order?.price || 0, // Use numeric price directly
    tax_percentage: order?.tax_percentage || 0, // Use numeric tax_percentage directly
    tax: order?.price && order?.tax_percentage ? (order.price * (order.tax_percentage / 100)) : 0, // Calculate tax on frontend
    grand_total: order?.price && order?.tax_percentage ? (order.price * (1 + order.tax_percentage / 100)) : 0, // Calculate grand total on frontend
    created_at: order?.created_at || new Date().toISOString(),
    status: order?.status || 'Pending',
    address: order?.customer_address || '-', // Customer address from backend
    document_url: order?.documents?.find(doc => doc.type === 'Order List')?.drive_url || null, // Order List document URL
  })) || [];

  const customerListColumns = [
    { field: 'name', headerName: 'Name', width: 150, sortable: true },
    { field: 'email', headerName: 'Email', width: 150, sortable: true },
    { field: 'phone', headerName: 'Phone', width: 150, sortable: true },
    { field: 'country', headerName: 'Country', width: 120, sortable: true },
    { field: 'state', headerName: 'State', width: 120, sortable: true },
    { field: 'city', headerName: 'City', width: 120, sortable: true },
    { field: 'zip_code', headerName: 'Zip Code', width: 80, sortable: true },
  ];

  const customerListRows = (customers || []).map(customer => ({
    id: customer?.customer_id || '-',
    name: customer?.name || '-',
    email: customer?.email || '-',
    phone: customer?.phone || '-',
    country: customer?.country || '-',
    state: customer?.state || '-',
    city: customer?.city || '-',
    zip_code: customer?.zip_code || '-',
  })) || [];

  const driversColumns = [
    { field: 'name', headerName: 'Name', width: 120, sortable: true },
    { field: 'vehicle_number', headerName: 'Vehicle No.', width: 120, sortable: true },
    { field: 'vehicle_type', headerName: 'Vehicle Type', width: 120, sortable: true },
    { field: 'max_capacity', headerName: 'Max Capacity (kg)', width: 80, sortable: true },
    { field: 'availability_status', headerName: 'Availability', width: 100, sortable: true },
  ];

  const driversRows = (drivers || []).map(driver => ({
    id: driver?.driver_id || '-',
    name: driver?.name || '-',
    vehicle_number: driver?.vehicle_number || '-',
    vehicle_type: driver?.vehicle_type || '-',
    max_capacity: driver?.max_capacity || '-',
    availability_status: driver?.availability_status || 'Available',
  })) || [];

  if (status === 'loading') return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;

  if (!session?.user || !['admin', 'manager', 'preprocessing'].includes(session.user.role)) {
    return <Typography variant="h6" sx={{ textAlign: 'center', mt: 4 }}>Access Denied</Typography>;
  }

  return (
    <Grid container spacing={3}>
      {/* Order Creation Form */}
      <Grid item xs={12} md={4}>
        <Card variant="outlined">
          <CardContent>
            {/* <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
              Order Creation Form
            </Typography> */}
            {/* Order Details (Customer to Driver Details) */}
            <Box>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Customer</InputLabel>
                <Select
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleInputChange}
                  label="Customer"
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

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Shipping Method</InputLabel>
                <Select
                  name="shipping_method"
                  value={formData.shipping_method}
                  onChange={handleInputChange}
                  label="Shipping Method"
                >
                  <MenuItem value="Customer">Customer-Arranged</MenuItem>
                  <MenuItem value="Self">Self-Arranged</MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" gutterBottom>Driver Details</Typography>
                {formData.shipping_method === 'Self' && (
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Driver</InputLabel>
                    <Select
                      name="driver_id"
                      value={formData.driver_id}
                      onChange={handleInputChange}
                      label="Driver"
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
                        >
                          + Add New Driver
                        </Button>
                      </MenuItem>
                    </Select>
                  </FormControl>
                )}
                {formData.shipping_method === 'Self' && formData.driver_id && drivers.find(d => d.driver_id === formData.driver_id) && (
                  <>
                    <TextField
                      fullWidth
                      label="Driver Name"
                      value={drivers.find(d => d.driver_id === formData.driver_id)?.name || ''}
                      InputProps={{ readOnly: true }}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Vehicle Number Plate"
                      value={drivers.find(d => d.driver_id === formData.driver_id)?.vehicle_number || ''}
                      InputProps={{ readOnly: true }}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Vehicle Type"
                      value={drivers.find(d => d.driver_id === formData.driver_id)?.vehicle_type || ''}
                      InputProps={{ readOnly: true }}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Max Capacity (kg)"
                      value={drivers.find(d => d.driver_id === formData.driver_id)?.max_capacity || ''}
                      InputProps={{ readOnly: true }}
                      sx={{ mb: 2 }}
                    />
                  </>
                )}
                {formData.shipping_method === 'Customer' && (
                  <>
                    <TextField
                      fullWidth
                      label="Driver Name"
                      name="driver_details.name"
                      value={formData.driver_details.name}
                      onChange={handleInputChange}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Vehicle Number Plate"
                      name="driver_details.vehicle_number_plate"
                      value={formData.driver_details.vehicle_number_plate}
                      onChange={handleInputChange}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Vehicle Type"
                      name="driver_details.vehicle_type"
                      value={formData.driver_details.vehicle_type}
                      onChange={handleInputChange}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Max Capacity (kg)"
                      name="driver_details.max_capacity"
                      value={formData.driver_details.max_capacity}
                      onChange={handleInputChange}
                      sx={{ mb: 2 }}
                    />
                  </>
                )}
              </Box>
              <Divider sx={{ my: 4 }} /> {/* Divider between Order Details and Order Items */}
            </Box>

            {/* Order Items (Product to Grand Total) */}
            <Box>
              <Box sx={{ mb: 3 }}>
                {formData.items.map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TextField
                      label="Product"
                      value={item.product}
                      onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                      sx={{ mr: 2, flex: 1 }}
                    />
                    <TextField
                      label="Quantity (kg)"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      sx={{ mr: 1, width: '120px' }}
                    />
                    <TextField
                      label="Price per Unit (IDR)"
                      type="number"
                      value={item.price}
                      onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                      sx={{ mr: 1, width: '120px' }}
                    />
                    <IconButton
                      onClick={() => removeItem(index)}
                      size="small"
                      color="error"
                      disabled={formData.items.length === 1}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Box>
                ))}
                <Button variant="outlined" onClick={addItem} sx={{ mb: 2 }}>Add Another Item</Button>
              </Box>

              <Divider sx={{ mb: 2 }} /> {/* Divider between Subtotal and Tax */}

              {/* Subtotal, Tax, and Grand Total (Narrow, Right-Aligned) */}
              <Box sx={{ maxWidth: '40%', ml: 'auto', mb: 2 }}>
                <TextField
                  fullWidth
                  label="Subtotal Price (IDR)"
                  name="price"
                  value={formData.price ? Number(formData.price).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }) : '0 IDR'}
                  InputProps={{ readOnly: true }} // Calculated automatically
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Tax Percentage (%)"
                  name="tax_percentage"
                  value={formData.tax_percentage}
                  onChange={handleInputChange}
                  type="number"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Grand Total (IDR)"
                  value={
                    formData.price && formData.tax_percentage
                      ? (Number(formData.price || 0) * (1 + Number(formData.tax_percentage || 0) / 100)).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })
                      : '0 IDR'
                  }
                  InputProps={{ readOnly: true }} // Calculated on frontend
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                  fullWidth
                  sx={{ maxWidth: '100%' }} // Match width of totals
                >
                  Create Order
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Data Grids for Orders, Customers, and Drivers */}
      {['admin', 'manager', 'preprocessing'].includes(session?.user?.role) && (
        <Grid item xs={12} md={8}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Order Data
              </Typography>
              <Box sx={{ mb: 4 }}>
                <DataGrid
                  rows={ordersRows}
                  columns={ordersColumns}
                  editMode="row" // Enable row editing for CRUD
                  rowModesModel={rowModesModel}
                  onRowEditStart={handleRowEditStart}
                  onRowEditStop={handleRowEditStop}
                  onEditRowsModelChange={handleEditRowsModelChange}
                  processRowUpdate={processRowUpdate}
                  onProcessRowUpdateError={(error) => setSnackbar({ open: true, message: error.message, severity: 'error' })}
                  pageSize={5}
                  rowsPerPageOptions={[5, 10, 20]}
                  autoHeight
                  slots={{ toolbar: GridToolbar }} // Add toolbar for sorting, filtering, export
                  slotProps={{
                    toolbar: { showQuickFilter: true }, // Enable search in toolbar
                  }}
                  autosizeOnMount
                  autosizeOptions={{
                    includeHeaders: true,
                    includeOutliers: true,
                    expand: true,
                  }}
                  rowHeight={27}
                />
              </Box>
              <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                Customer Data
              </Typography>
              <Box sx={{ mb: 4 }}>
                <DataGrid
                  rows={customerListRows}
                  columns={customerListColumns}
                  pageSize={5}
                  rowsPerPageOptions={[5, 10, 20]}
                  autoHeight
                  slots={{ toolbar: GridToolbar }} // Add toolbar
                  slotProps={{
                    toolbar: { showQuickFilter: true }, // Enable search
                  }}
                  autosizeOnMount
                  autosizeOptions={{
                    includeHeaders: true,
                    includeOutliers: true,
                    expand: true,
                  }}
                  rowHeight={27}
                />
              </Box>
              <Typography variant="h5" gutterBottom>
                Driver Data
              </Typography>
              <Box>
                <DataGrid
                  rows={driversRows}
                  columns={driversColumns}
                  pageSize={5}
                  rowsPerPageOptions={[5, 10, 20]}
                  autoHeight
                  slots={{ toolbar: GridToolbar }} // Add toolbar
                  slotProps={{
                    toolbar: { showQuickFilter: true }, // Enable search
                  }}
                  autosizeOnMount
                  autosizeOptions={{
                    includeHeaders: true,
                    includeOutliers: true,
                    expand: true,
                  }}
                  rowHeight={27}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Modals */}
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
    </Grid>
  );
};

export default OrderCreation;