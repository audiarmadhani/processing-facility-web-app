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
  Modal,
  Paper,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
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
  const [orders, setOrders] = useState([]);
  const [formData, setFormData] = useState({
    customer_id: '',
    driver_id: '',
    items: [{ batch_number: '', quantity: '', price: '', product: '' }],
    shipping_method: 'Customer',
    driver_details: {
      name: '',
      vehicle_number_plate: '',
      vehicle_type: '',
      max_capacity: '',
    },
    price: '',
    tax_percentage: '',
    shipping_address: '',
    billing_address: '',
  });
  const [loading, setLoading] = useState(false);
  const [openCustomerModal, setOpenCustomerModal] = useState(false);
  const [openDriverModal, setOpenDriverModal] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [rowModesModel, setRowModesModel] = useState({});
  const [openOrderModal, setOpenOrderModal] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const [sameBillingAddress, setSameBillingAddress] = useState(true);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [customersRes, driversRes, ordersRes] = await Promise.all([
          fetch('https://processing-facility-backend.onrender.com/api/customers'),
          fetch('https://processing-facility-backend.onrender.com/api/drivers'),
          fetch('https://processing-facility-backend.onrender.com/api/orders'),
        ]);

        if (!customersRes.ok || !driversRes.ok || !ordersRes.ok) {
          throw new Error('Failed to fetch initial data');
        }

        const customersData = await customersRes.json();
        const driversData = await driversRes.json();
        const ordersData = await ordersRes.json();

        setCustomers(Array.isArray(customersData) ? customersData : []);
        setDrivers(Array.isArray(driversData) ? driversData : []);
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      } catch (error) {
        console.error('Fetch Error:', error);
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
      setFormData((prev) => ({
        ...prev,
        shipping_method: value,
        driver_id: value === 'Self' ? '' : prev.driver_id,
        driver_details:
          value === 'Self'
            ? { name: '', vehicle_number_plate: '', vehicle_type: '', max_capacity: '' }
            : prev.driver_details,
      }));
    } else if (name.startsWith('driver_details.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        driver_details: { ...prev.driver_details, [field]: value },
      }));
    } else if (name === 'shipping_address' && sameBillingAddress) {
      setFormData((prev) => ({
        ...prev,
        shipping_address: value,
        billing_address: value,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (name === 'customer_id' && value) {
      const customer = customers.find((c) => c.customer_id === value);
      setSelectedCustomer(customer);
      setShowCustomerDetails(true);
      setFormData((prev) => ({
        ...prev,
        shipping_address: customer?.address || '',
        billing_address: sameBillingAddress ? customer?.address || '' : prev.billing_address,
      }));
    } else if (name === 'customer_id' && !value) {
      setShowCustomerDetails(false);
      setSelectedCustomer(null);
      setFormData((prev) => ({
        ...prev,
        shipping_address: '',
        billing_address: sameBillingAddress ? '' : prev.billing_address,
      }));
    }
  };

  const handleSameBillingChange = (e) => {
    const checked = e.target.checked;
    setSameBillingAddress(checked);
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        billing_address: prev.shipping_address,
      }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    setFormData((prev) => ({ ...prev, items: newItems }));
    const subtotal = newItems.reduce(
      (sum, item) => sum + (parseFloat(item.price || 0) * parseFloat(item.quantity || 0)),
      0
    );
    setFormData((prev) => ({ ...prev, price: subtotal.toFixed(2) }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { batch_number: '', quantity: '', price: '', product: '' }],
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) {
      setSnackbar({ open: true, message: 'At least one item is required', severity: 'warning' });
      return;
    }
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, items: newItems }));
    const subtotal = newItems.reduce(
      (sum, item) => sum + (parseFloat(item.price || 0) * parseFloat(item.quantity || 0)),
      0
    );
    setFormData((prev) => ({ ...prev, price: subtotal.toFixed(2) }));
  };

  const handleEditItemChange = (index, field, value) => {
    const newItems = [...editOrder.items];
    newItems[index][field] = value;

    setEditOrder((prev) => ({ ...prev, items: newItems }));
    const subtotal = newItems.reduce(
      (sum, item) => sum + (parseFloat(item.price || 0) * parseFloat(item.quantity || 0)),
      0
    );
    setEditOrder((prev) => ({ ...prev, price: subtotal.toFixed(2) }));
  };

  const addEditItem = () => {
    setEditOrder((prev) => ({
      ...prev,
      items: [...prev.items, { batch_number: '', quantity: '', price: '', product: '' }],
    }));
  };

  const removeEditItem = (index) => {
    if (editOrder.items.length === 1) {
      setSnackbar({ open: true, message: 'At least one item is required', severity: 'warning' });
      return;
    }
    const newItems = editOrder.items.filter((_, i) => i !== index);
    setEditOrder((prev) => ({ ...prev, items: newItems }));
    const subtotal = newItems.reduce(
      (sum, item) => sum + (parseFloat(item.price || 0) * parseFloat(item.quantity || 0)),
      0
    );
    setEditOrder((prev) => ({ ...prev, price: subtotal.toFixed(2) }));
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
      setCustomers((prev) => [...prev, customer]);
      setFormData((prev) => ({
        ...prev,
        customer_id: customer.customer_id,
        shipping_address: customer.address || '',
        billing_address: sameBillingAddress ? customer.address || '' : prev.billing_address,
      }));
      setSelectedCustomer(customer);
      setShowCustomerDetails(true);
      setRefreshCounter((prev) => prev + 1);
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
      setDrivers((prev) => [...prev, driver]);
      setFormData((prev) => ({ ...prev, driver_id: driver.driver_id }));
      setRefreshCounter((prev) => prev + 1);
      setSnackbar({ open: true, message: 'Driver added successfully', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    }
    setOpenDriverModal(false);
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.customer_id) {
      setSnackbar({ open: true, message: 'Customer is required', severity: 'warning' });
      return;
    }
    if (!formData.shipping_method) {
      setSnackbar({ open: true, message: 'Shipping method is required', severity: 'warning' });
      return;
    }
    if (formData.shipping_method === 'Self' && !formData.driver_id) {
      setSnackbar({ open: true, message: 'Driver is required for Self shipping', severity: 'warning' });
      return;
    }
    if (!formData.items.every((item) => item.batch_number && item.quantity && item.price && item.product)) {
      setSnackbar({ open: true, message: 'All items must have batch number, quantity, price, and product', severity: 'warning' });
      return;
    }
    if (!formData.shipping_address) {
      setSnackbar({ open: true, message: 'Shipping address is required', severity: 'warning' });
      return;
    }
    if (!formData.billing_address) {
      setSnackbar({ open: true, message: 'Billing address is required', severity: 'warning' });
      return;
    }

    const subtotal = parseFloat(formData.price) || 0;
    const taxPercentage = parseFloat(formData.tax_percentage) || 0;

    if (isNaN(subtotal) || subtotal <= 0) {
      setSnackbar({ open: true, message: 'Invalid subtotal', severity: 'error' });
      return;
    }
    if (isNaN(taxPercentage) || taxPercentage < 0 || taxPercentage > 100) {
      setSnackbar({ open: true, message: 'Invalid tax percentage', severity: 'error' });
      return;
    }

    for (const item of formData.items) {
      const itemPrice = parseFloat(item.price) || 0;
      const itemQuantity = parseFloat(item.quantity) || 0;
      if (isNaN(itemPrice) || itemPrice < 0 || isNaN(itemQuantity) || itemQuantity <= 0) {
        setSnackbar({ open: true, message: 'Invalid item price or quantity', severity: 'error' });
        return;
      }
    }

    setLoading(true);
    try {
      const orderData = {
        customer_id: formData.customer_id,
        driver_id: formData.shipping_method === 'Self' ? formData.driver_id : null,
        shipping_method: formData.shipping_method,
        driver_details: formData.shipping_method === 'Customer' ? formData.driver_details : null,
        price: formData.price || '0',
        tax_percentage: formData.tax_percentage || '0',
        shipping_address: formData.shipping_address,
        billing_address: formData.billing_address,
        items: formData.items.map((item) => ({
          batch_number: item.batch_number,
          quantity: parseFloat(item.quantity),
          price: parseFloat(item.price),
          product: item.product,
        })),
      };

      const orderRes = await fetch('https://processing-facility-backend.onrender.com/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const orderResult = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderResult.error || 'Failed to create order');
      }

      const orderId = orderResult.order_id;
      if (!orderId) throw new Error('Order ID not found in response');

      const orderListDoc = generateOrderListPDF(orderId);
      const orderListBlob = orderListDoc.output('blob');

      const orderListFormData = new FormData();
      orderListFormData.append('order_id', orderId);
      orderListFormData.append('type', 'Order List');
      orderListFormData.append(
        'details',
        JSON.stringify({
          customer_id: formData.customer_id,
          items: formData.items,
          shipping_method: formData.shipping_method,
          driver_id: formData.driver_id || null,
          driver_details: formData.driver_details || null,
          price: formData.price || null,
          tax_percentage: formData.tax_percentage || null,
          shipping_address: formData.shipping_address,
          billing_address: formData.billing_address,
        })
      );
      orderListFormData.append('file', orderListBlob, `OrderList-${String(orderId).padStart(4, '0')}.pdf`);

      const docRes = await fetch('https://processing-facility-backend.onrender.com/api/documents/upload', {
        method: 'POST',
        body: orderListFormData,
      });

      if (!docRes.ok) {
        const docError = await docRes.json();
        throw new Error(docError.error || 'Failed to upload Order List');
      }

      orderListDoc.save(`OrderList-${String(orderId).padStart(4, '0')}.pdf`);

      setSnackbar({ open: true, message: 'Order and Order List created successfully', severity: 'success' });
      setFormData({
        customer_id: '',
        driver_id: '',
        items: [{ batch_number: '', quantity: '', price: '', product: '' }],
        shipping_method: 'Customer',
        driver_details: { name: '', vehicle_number_plate: '', vehicle_type: '', max_capacity: '' },
        price: '',
        tax_percentage: '',
        shipping_address: '',
        billing_address: '',
      });
      setShowCustomerDetails(false);
      setSelectedCustomer(null);
      setSameBillingAddress(true);
      setRefreshCounter((prev) => prev + 1);
    } catch (error) {
      console.error('Submit Error:', error);
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const generateOrderListPDF = (orderId) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [241.3, 279.4],
    });

    const customer = customers.find((c) => c.customer_id === formData.customer_id);
    const driver =
      formData.shipping_method === 'Self'
        ? drivers.find((d) => d.driver_id === formData.driver_id)
        : formData.driver_details;

    const addText = (text, x, y, options = {}) => {
      doc.setFont('Arial', options.bold ? 'bold' : 'normal');
      doc.setFontSize(options.size || 12);
      if (options.align) doc.text(text, x, y, { align: options.align });
      else doc.text(text, x, y);
    };

    addText('PT. Berkas Tuaian Melimpah', doc.internal.pageSize.getWidth() / 2, 15, {
      align: 'center',
      bold: true,
      size: 16,
    });
    addText('Order List', doc.internal.pageSize.getWidth() / 2, 23, { align: 'center', bold: true, size: 14 });
    addText(`Date: ${dayjs().format('YYYY-MM-DD')}`, doc.internal.pageSize.getWidth() - 14, 15, { align: 'right' });
    addText(`Time: ${dayjs().format('HH:mm:ss')}`, doc.internal.pageSize.getWidth() - 14, 23, { align: 'right' });
    doc.line(14, 28, doc.internal.pageSize.getWidth() - 14, 28);
    addText(`Order ID: ${String(orderId).padStart(4, '0')}`, 14, 35, { bold: true });

    let yOffset = 43;
    const columnWidth = (doc.internal.pageSize.getWidth() - 40) / 2;

    addText('Customer Information:', 14, yOffset, { bold: true });
    yOffset += 8;
    addText(`Name: ${customer ? customer.name : '-'}` , 14, yOffset);
    yOffset += 6;
    addText(`Default Address: ${customer ? customer.address : '-'}` , 14, yOffset);
    yOffset += 6;
    addText(`Shipping Address: ${formData.shipping_address || '-'}` , 14, yOffset);
    yOffset += 6;
    addText(`Billing Address: ${formData.billing_address || '-'}` , 14, yOffset);
    yOffset += 6;
    addText(`Phone: ${customer ? customer.phone : '-'}` , 14, yOffset);
    yOffset += 6;
    addText(`Email: ${customer ? customer.email || '-' : '-'}` , 14, yOffset);
    yOffset += 6;
    addText(`Country: ${customer ? customer.country || '-' : '-'}` , 14, yOffset);
    yOffset += 6;
    addText(`State: ${customer ? customer.state || '-' : '-'}` , 14, yOffset);
    yOffset += 6;
    addText(`City: ${customer ? customer.city || '-' : '-'}` , 14, yOffset);
    yOffset += 6;
    addText(`Zip Code: ${customer ? customer.zip_code || '-' : '-'}` , 14, yOffset);

    let shippingOffset = 43;
    addText('Shipping Information:', 14 + columnWidth + 10, shippingOffset, { bold: true });
    shippingOffset += 8;
    addText(`Method: ${formData.shipping_method}` , 14 + columnWidth + 10, shippingOffset);
    shippingOffset += 6;
    if (driver) {
      addText(`Driver Name: ${driver.name || '-'}` , 14 + columnWidth + 10, shippingOffset);
      shippingOffset += 6;
      addText(`Vehicle No.: ${driver.vehicle_number_plate || driver.vehicle_number || '-'}` , 14 + columnWidth + 10, shippingOffset);
      shippingOffset += 6;
      addText(`Vehicle Type: ${driver.vehicle_type || '-'}` , 14 + columnWidth + 10, shippingOffset);
      shippingOffset += 6;
      addText(`Max Capacity: ${driver.max_capacity ? driver.max_capacity + ' kg' : '-'}` , 14 + columnWidth + 10, shippingOffset);
    }

    let tableOffset = Math.max(yOffset, driver ? shippingOffset + 6 : shippingOffset) + 10;
    addText('Items:', 14, tableOffset, { bold: true });
    doc.autoTable({
      startY: tableOffset + 8,
      head: [['Batch Number', 'Product', 'Quantity (kg)', 'Price (IDR)', 'Subtotal (IDR)']],
      body: formData.items.map((item) => [
        item.batch_number,
        item.product,
        item.quantity,
        item.price || '0',
        (parseFloat(item.price || 0) * parseFloat(item.quantity || 0)).toLocaleString('id-ID', {
          style: 'currency',
          currency: 'IDR',
        }),
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

    addText('_'.repeat(signatureLength), 14, signatureY);
    addText('Order Staff', 14, labelY);
    addText(session.user.name || '-', 14, labelY + 6);

    addText('_'.repeat(signatureLength), 80, signatureY);
    addText('Manager', 80, labelY);
    addText('(..................)', 80, labelY + 12);

    if (driver) {
      addText('_'.repeat(signatureLength), 146, signatureY);
      addText('Driver', 146, labelY);
      addText(driver.name || '-', 146, labelY + 6);
    }

    const subtotal = parseFloat(formData.price || '0');
    const taxRate = parseFloat(formData.tax_percentage || '0') / 100;
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
          price: newRow.price.toString(),
          tax_percentage: newRow.tax_percentage.toString(),
          shipping_address: newRow.shipping_address,
          billing_address: newRow.billing_address,
        }),
      });

      if (!response.ok) throw new Error('Failed to update order');
      const updatedOrder = await response.json();
      setOrders((orders) => orders.map((order) => (order.order_id === newRow.order_id ? updatedOrder : order)));
      setSnackbar({ open: true, message: 'Order updated successfully', severity: 'success' });
      return updatedOrder;
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
      throw error;
    }
  };

  const handleOpenOrderModal = async (order) => {
    setLoading(true);
    try {
      const orderRes = await fetch(`https://processing-facility-backend.onrender.com/api/orders/${order.order_id}`);
      if (!orderRes.ok) throw new Error('Failed to fetch order details');
      const fullOrder = await orderRes.json();
      setEditOrder({
        order_id: fullOrder.order_id,
        customer_id: fullOrder.customer_id,
        driver_id: fullOrder.driver_id || '',
        items: fullOrder.items || [{ batch_number: '', quantity: '', price: '', product: '' }],
        shipping_method: fullOrder.shipping_method || 'Customer',
        driver_details: fullOrder.driver_details ? JSON.parse(fullOrder.driver_details) : { name: '', vehicle_number_plate: '', vehicle_type: '', max_capacity: '' },
        price: fullOrder.price || '0',
        tax_percentage: fullOrder.tax_percentage || '0',
        shipping_address: fullOrder.shipping_address || '',
        billing_address: fullOrder.billing_address || '',
      });
      setSameBillingAddress(fullOrder.shipping_address === fullOrder.billing_address);
      setOpenOrderModal(true);
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseOrderModal = () => {
    setOpenOrderModal(false);
    setEditOrder(null);
    setSameBillingAddress(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'shipping_method') {
      setEditOrder((prev) => ({
        ...prev,
        shipping_method: value,
        driver_id: value === 'Self' ? '' : prev.driver_id,
        driver_details:
          value === 'Self'
            ? { name: '', vehicle_number_plate: '', vehicle_type: '', max_capacity: '' }
            : prev.driver_details,
      }));
    } else if (name.startsWith('driver_details.')) {
      const field = name.split('.')[1];
      setEditOrder((prev) => ({
        ...prev,
        driver_details: { ...prev.driver_details, [field]: value },
      }));
    } else if (name === 'shipping_address' && sameBillingAddress) {
      setEditOrder((prev) => ({
        ...prev,
        shipping_address: value,
        billing_address: value,
      }));
    } else {
      setEditOrder((prev) => ({ ...prev, [name]: value }));
    }

    if (name === 'customer_id' && value) {
      const customer = customers.find((c) => c.customer_id === value);
      setSelectedCustomer(customer);
      setShowCustomerDetails(true);
      setEditOrder((prev) => ({
        ...prev,
        shipping_address: customer?.address || '',
        billing_address: sameBillingAddress ? customer?.address || '' : prev.billing_address,
      }));
    } else if (name === 'customer_id' && !value) {
      setShowCustomerDetails(false);
      setSelectedCustomer(null);
      setEditOrder((prev) => ({
        ...prev,
        shipping_address: '',
        billing_address: sameBillingAddress ? '' : prev.billing_address,
      }));
    }
  };

  const handleEditSameBillingChange = (e) => {
    const checked = e.target.checked;
    setSameBillingAddress(checked);
    if (checked) {
      setEditOrder((prev) => ({
        ...prev,
        billing_address: prev.shipping_address,
      }));
    }
  };

  const handleSaveEdit = async () => {
    if (!editOrder.customer_id) {
      setSnackbar({ open: true, message: 'Customer is required', severity: 'warning' });
      return;
    }
    if (!editOrder.shipping_method) {
      setSnackbar({ open: true, message: 'Shipping method is required', severity: 'warning' });
      return;
    }
    if (editOrder.shipping_method === 'Self' && !editOrder.driver_id) {
      setSnackbar({ open: true, message: 'Driver is required for Self shipping', severity: 'warning' });
      return;
    }
    if (!editOrder.items.every((item) => item.batch_number && item.quantity && item.price && item.product)) {
      setSnackbar({ open: true, message: 'All items must have batch number, quantity, price, and product', severity: 'warning' });
      return;
    }
    if (!editOrder.shipping_address) {
      setSnackbar({ open: true, message: 'Shipping address is required', severity: 'warning' });
      return;
    }
    if (!editOrder.billing_address) {
      setSnackbar({ open: true, message: 'Billing address is required', severity: 'warning' });
      return;
    }

    const subtotal = parseFloat(editOrder.price) || 0;
    const taxPercentage = parseFloat(editOrder.tax_percentage) || 0;

    if (isNaN(subtotal) || subtotal <= 0) {
      setSnackbar({ open: true, message: 'Invalid subtotal', severity: 'error' });
      return;
    }
    if (isNaN(taxPercentage) || taxPercentage < 0 || taxPercentage > 100) {
      setSnackbar({ open: true, message: 'Invalid tax percentage', severity: 'error' });
      return;
    }

    for (const item of editOrder.items) {
      const itemPrice = parseFloat(item.price) || 0;
      const itemQuantity = parseFloat(item.quantity) || 0;
      if (isNaN(itemPrice) || itemPrice < 0 || isNaN(itemQuantity) || itemQuantity <= 0) {
        setSnackbar({ open: true, message: 'Invalid item price or quantity', severity: 'error' });
        return;
      }
    }

    setLoading(true);
    try {
      const orderData = {
        customer_id: editOrder.customer_id,
        driver_id: editOrder.shipping_method === 'Self' ? editOrder.driver_id : null,
        shipping_method: editOrder.shipping_method,
        driver_details: editOrder.shipping_method === 'Customer' ? editOrder.driver_details : null,
        price: editOrder.price || '0',
        tax_percentage: editOrder.tax_percentage || '0',
        shipping_address: editOrder.shipping_address,
        billing_address: editOrder.billing_address,
        items: editOrder.items.map((item) => ({
          batch_number: item.batch_number,
          quantity: parseFloat(item.quantity),
          price: parseFloat(item.price),
          product: item.product,
        })),
      };

      const orderRes = await fetch(`https://processing-facility-backend.onrender.com/api/orders/${editOrder.order_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const updatedOrder = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(updatedOrder.error || 'Failed to update order');
      }

      setOrders((orders) => orders.map((order) => (order.order_id === updatedOrder.order_id ? updatedOrder : order)));
      setSnackbar({ open: true, message: 'Order updated successfully', severity: 'success' });
      handleCloseOrderModal();
      setRefreshCounter((prev) => prev + 1);
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const ordersColumns = [
    { field: 'order_id', headerName: 'Order ID', width: 100, sortable: true, editable: true },
    {
      field: 'details',
      headerName: 'Details',
      width: 130,
      sortable: false,
      renderCell: (params) => (
        <Button
          variant="outlined"
          size="small"
          onClick={() => handleOpenOrderModal(params.row)}
          sx={{ height: '24px', minWidth: '80px', padding: '0 8px', fontSize: '0.75rem' }}
        >
          View Details
        </Button>
      ),
    },
    { field: 'customer_name', headerName: 'Customer Name', width: 220, sortable: true, editable: false },
    { field: 'shipping_method', headerName: 'Shipping Method', width: 150, sortable: true, editable: true },
    { field: 'price', headerName: 'Subtotal (IDR)', width: 180, sortable: true, editable: true },
    { field: 'tax_percentage', headerName: 'Tax (%)', width: 100, sortable: true, editable: true },
    { field: 'tax', headerName: 'Tax (IDR)', width: 120, sortable: true, editable: false },
    { field: 'grand_total', headerName: 'Grand Total (IDR)', width: 180, sortable: true, editable: false },
    { field: 'created_at', headerName: 'Date', width: 150, sortable: true, editable: false },
    { field: 'status', headerName: 'Status', width: 120, sortable: true, editable: true },
    { field: 'shipping_address', headerName: 'Shipping Address', width: 200, sortable: true, editable: true },
    { field: 'billing_address', headerName: 'Billing Address', width: 200, sortable: true, editable: true },
    { field: 'document_url', headerName: 'Document', width: 120, sortable: true, editable: false },
  ];

  const ordersRows = (Array.isArray(orders) ? orders : []).map((order) => ({
    id: order?.order_id || '-',
    order_id: order?.order_id || '-',
    customer_name: customers.find((c) => c.customer_id === order.customer_id)?.name || '-',
    shipping_method: order?.shipping_method || '-',
    price: order?.price || '0',
    tax_percentage: order?.tax_percentage || '0',
    tax: order?.tax || '0',
    grand_total: order?.grand_total || '0',
    created_at: order?.created_at || new Date().toISOString().split('T')[0],
    status: order?.status || 'Pending',
    shipping_address: order?.shipping_address || '-',
    billing_address: order?.billing_address || '-',
    document_url: order?.documents?.find((doc) => doc.type === 'Order List')?.drive_url || '-',
  }));

  const customerListColumns = [
    { field: 'name', headerName: 'Name', width: 220, sortable: true },
    { field: 'email', headerName: 'Email', width: 200, sortable: true },
    { field: 'phone', headerName: 'Phone', width: 150, sortable: true },
    { field: 'country', headerName: 'Country', width: 120, sortable: true },
    { field: 'state', headerName: 'State', width: 120, sortable: true },
    { field: 'city', headerName: 'City', width: 150, sortable: true },
    { field: 'zip_code', headerName: 'Zip Code', width: 80, sortable: true },
  ];

  const customerListRows = (Array.isArray(customers) ? customers : []).map((customer) => ({
    id: customer?.customer_id || '-',
    name: customer?.name || '-',
    email: customer?.email || '-',
    phone: customer?.phone || '-',
    country: customer?.country || '-',
    state: customer?.state || '-',
    city: customer?.city || '-',
    zip_code: customer?.zip_code || '-',
  }));

  const driversListColumns = [
    { field: 'name', headerName: 'Name', width: 120, sortable: true },
    { field: 'vehicle_number', headerName: 'Vehicle No.', width: 120, sortable: true },
    { field: 'vehicle_type', headerName: 'Vehicle Type', width: 120, sortable: true },
    { field: 'max_capacity', headerName: 'Max Capacity (kg)', width: 150, sortable: true },
    { field: 'availability_status', headerName: 'Availability', width: 100, sortable: true },
  ];

  const driversListRows = (Array.isArray(drivers) ? drivers : []).map((driver) => ({
    id: driver?.driver_id || '-',
    name: driver?.name || '-',
    vehicle_number: driver?.vehicle_number || '-',
    vehicle_type: driver?.vehicle_type || '-',
    max_capacity: driver?.max_capacity || '-',
    availability_status: driver?.availability_status || 'Available',
  }));

  if (status === 'loading') return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 5 }} />;

  if (!session?.user || !['admin', 'manager', 'preprocessing'].includes(session.user.role)) {
    return <Typography variant="h6" sx={{ textAlign: 'center', mt: 5 }}>Access Denied</Typography>;
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={5}>
        <Card variant="outlined">
          <CardContent>
            <Box>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Customer</InputLabel>
                <Select
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleInputChange}
                  label="Customer"
                >
                  {(Array.isArray(customers) ? customers : []).map((customer) => (
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
                    label="Default Address"
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

              <TextField
                fullWidth
                label="Shipping Address"
                name="shipping_address"
                value={formData.shipping_address}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={sameBillingAddress}
                    onChange={handleSameBillingChange}
                  />
                }
                label="Billing address same as shipping address"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Billing Address"
                name="billing_address"
                value={formData.billing_address}
                onChange={handleInputChange}
                disabled={sameBillingAddress}
                sx={{ mb: 2 }}
              />

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
                      {(Array.isArray(drivers) ? drivers : [])
                        .filter((d) => d.availability_status === 'Available')
                        .map((driver) => (
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
                {formData.shipping_method === 'Self' && formData.driver_id && drivers.find((d) => d.driver_id === formData.driver_id) && (
                  <>
                    <TextField
                      fullWidth
                      label="Driver Name"
                      value={drivers.find((d) => d.driver_id === formData.driver_id)?.name || ''}
                      InputProps={{ readOnly: true }}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Vehicle Number Plate"
                      value={drivers.find((d) => d.driver_id === formData.driver_id)?.vehicle_number || ''}
                      InputProps={{ readOnly: true }}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Vehicle Type"
                      value={drivers.find((d) => d.driver_id === formData.driver_id)?.vehicle_type || ''}
                      InputProps={{ readOnly: true }}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Max Capacity (kg)"
                      value={drivers.find((d) => d.driver_id === formData.driver_id)?.max_capacity || ''}
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
              <Divider sx={{ my: 4 }} />
            </Box>

            <Box>
              <Box sx={{ mb: 3 }}>
                {formData.items.map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TextField
                      label="Batch Number"
                      value={item.batch_number}
                      onChange={(e) => handleItemChange(index, 'batch_number', e.target.value)}
                      sx={{ mr: 2, flex: 1 }}
                    />
                    <TextField
                      label="Quantity (kg)"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      sx={{ mr: 2, width: 100 }}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                    <TextField
                      label="Price (IDR)"
                      type="number"
                      value={item.price}
                      onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                      sx={{ mr: 2, width: 150 }}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                    <TextField
                      label="Product"
                      value={item.product}
                      onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                      sx={{ mr: 2, flex: 1 }}
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
                <Button variant="outlined" onClick={addItem} fullWidth sx={{ mb: 2 }}>
                  Add Another Item
                </Button>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Box sx={{ maxWidth: 300, ml: 'auto', mb: 2 }}>
                <TextField
                  fullWidth
                  label="Subtotal (IDR)"
                  name="price"
                  value={
                    formData.price
                      ? Number(formData.price).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })
                      : ''
                  }
                  InputProps={{ readOnly: true }}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Tax (%)"
                  name="tax_percentage"
                  value={formData.tax_percentage}
                  onChange={handleInputChange}
                  type="number"
                  sx={{ mb: 2 }}
                  inputProps={{ min: 0, max: 100, step: 0.1 }}
                />
                <TextField
                  fullWidth
                  label="Grand Total (IDR)"
                  value={
                    formData.price && formData.tax_percentage
                      ? (
                          Number(formData.price || 0) * (1 + Number(formData.tax_percentage || 0) / 100)
                        ).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })
                      : ''
                  }
                  InputProps={{ readOnly: true }}
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Create Order'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {['admin', 'manager', 'preprocessing'].includes(session?.user?.role) && (
        <Grid item xs={12} md={7}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Orders
              </Typography>
              <Box sx={{ mb: 4, height: 400 }}>
                <DataGrid
                  rows={ordersRows}
                  columns={ordersColumns}
                  editMode="row"
                  rowModesModel={rowModesModel}
                  onRowEditStart={handleRowEditStart}
                  onRowEditStop={handleRowEditStop}
                  onEditRowsModelChange={handleEditRowsModelChange}
                  processRowUpdate={processRowUpdate}
                  onProcessRowUpdateError={(error) => setSnackbar({ open: true, message: error.message, severity: 'error' })}
                  pageSizeOptions={[5, 10, 25]}
                  initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
                  sx={{ height: '100%' }}
                  slots={{ toolbar: GridToolbar }}
                  slotProps={{ toolbar: { showQuickFilter: true } }}
                />
              </Box>

              <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                Customers
              </Typography>
              <Box sx={{ mb: 4, height: 400 }}>
                <DataGrid
                  rows={customerListRows}
                  columns={customerListColumns}
                  pageSizeOptions={[5, 10, 25]}
                  initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
                  sx={{ height: '100%' }}
                  slots={{ toolbar: GridToolbar }}
                  slotProps={{ toolbar: { showQuickFilter: true } }}
                />
              </Box>

              <Typography variant="h6" gutterBottom>
                Drivers
              </Typography>
              <Box sx={{ height: 400 }}>
                <DataGrid
                  rows={driversListRows}
                  columns={driversListColumns}
                  pageSizeOptions={[5, 10, 25]}
                  initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
                  sx={{ height: '100%' }}
                  slots={{ toolbar: GridToolbar }}
                  slotProps={{ toolbar: { showQuickFilter: true } }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}

      <CustomerModal open={openCustomerModal} onClose={() => setOpenCustomerModal(false)} onSave={handleSaveCustomer} />
      <DriverModal open={openDriverModal} onClose={() => setOpenDriverModal(false)} onSave={handleSaveDriver} />

      <Modal
        open={openOrderModal}
        onClose={handleCloseOrderModal}
        aria-labelledby="order-details-modal-title"
        aria-describedby="order-details-modal-description"
      >
        <Paper
          sx={{
            p: 3,
            maxWidth: 600,
            maxHeight: '80vh',
            overflowY: 'auto',
            mx: 'auto',
            mt: '5vh',
            borderRadius: 2,
          }}
        >
          {loading ? (
            <CircularProgress sx={{ display: 'block', mx: 'auto' }} />
          ) : editOrder ? (
            <Box>
              <Typography
                variant="h5"
                id="order-details-modal-title"
                gutterBottom
                sx={{ textAlign: 'center', fontWeight: 'bold', mb: 2 }}
              >
                Edit Order - Order ID: {editOrder.order_id || 'N/A'}
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ textAlign: 'center', fontStyle: 'italic', mb: 1 }}>
                  PT. Berkas Tuaian Melimpah
                </Typography>
                <Divider sx={{ my: 1 }} />
              </Box>

              <Box>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Customer</InputLabel>
                  <Select
                    name="customer_id"
                    value={editOrder.customer_id}
                    onChange={handleEditInputChange}
                    label="Customer"
                  >
                    {(Array.isArray(customers) ? customers : []).map((customer) => (
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
                      label="Default Address"
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

                <TextField
                  fullWidth
                  label="Shipping Address"
                  name="shipping_address"
                  value={editOrder.shipping_address}
                  onChange={handleEditInputChange}
                  sx={{ mb: 2 }}
                />
                <FormControlLabel
                  control={<Checkbox checked={sameBillingAddress} onChange={handleEditSameBillingChange} />}
                  label="Billing address same as shipping address"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Billing Address"
                  name="billing_address"
                  value={editOrder.billing_address}
                  onChange={handleEditInputChange}
                  disabled={sameBillingAddress}
                  sx={{ mb: 2 }}
                />

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Shipping Method</InputLabel>
                  <Select
                    name="shipping_method"
                    value={editOrder.shipping_method}
                    onChange={handleEditInputChange}
                    label="Shipping Method"
                  >
                    <MenuItem value="Customer">Customer-Arranged</MenuItem>
                    <MenuItem value="Self">Self-Arranged</MenuItem>
                  </Select>
                </FormControl>

                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" gutterBottom>Driver Details</Typography>
                  {editOrder.shipping_method === 'Self' && (
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Driver</InputLabel>
                      <Select
                        name="driver_id"
                        value={editOrder.driver_id}
                        onChange={handleEditInputChange}
                        label="Driver"
                      >
                        <MenuItem value="">None</MenuItem>
                        {(Array.isArray(drivers) ? drivers : [])
                          .filter((d) => d.availability_status === 'Available')
                          .map((driver) => (
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
                  {editOrder.shipping_method === 'Self' &&
                    editOrder.driver_id &&
                    drivers.find((d) => d.driver_id === editOrder.driver_id) && (
                      <>
                        <TextField
                          fullWidth
                          label="Driver Name"
                          value={drivers.find((d) => d.driver_id === editOrder.driver_id)?.name || ''}
                          InputProps={{ readOnly: true }}
                          sx={{ mb: 2 }}
                        />
                        <TextField
                          fullWidth
                          label="Vehicle Number Plate"
                          value={drivers.find((d) => d.driver_id === editOrder.driver_id)?.vehicle_number || ''}
                          InputProps={{ readOnly: true }}
                          sx={{ mb: 2 }}
                        />
                        <TextField
                          fullWidth
                          label="Vehicle Type"
                          value={drivers.find((d) => d.driver_id === editOrder.driver_id)?.vehicle_type || ''}
                          InputProps={{ readOnly: true }}
                          sx={{ mb: 2 }}
                        />
                        <TextField
                          fullWidth
                          label="Max Capacity (kg)"
                          value={drivers.find((d) => d.driver_id === editOrder.driver_id)?.max_capacity || ''}
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
                      />
                      <TextField
                        fullWidth
                        label="Vehicle Number Plate"
                        name="driver_details.vehicle_number_plate"
                        value={editOrder.driver_details.vehicle_number_plate}
                        onChange={handleEditInputChange}
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        label="Vehicle Type"
                        name="driver_details.vehicle_type"
                        value={editOrder.driver_details.vehicle_type}
                        onChange={handleEditInputChange}
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        label="Max Capacity (kg)"
                        name="driver_details.max_capacity"
                        value={editOrder.driver_details.max_capacity}
                        onChange={handleEditInputChange}
                        sx={{ mb: 2 }}
                      />
                    </>
                  )}
                </Box>
                <Divider sx={{ my: 4 }} />

                <Box sx={{ mb: 3 }}>
                  {editOrder.items.map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <TextField
                        label="Batch Number"
                        value={item.batch_number}
                        onChange={(e) => handleEditItemChange(index, 'batch_number', e.target.value)}
                        sx={{ mr: 2, flex: 1 }}
                      />
                      <TextField
                        label="Quantity (kg)"
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleEditItemChange(index, 'quantity', e.target.value)}
                        sx={{ mr: 2, width: 120 }}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                      <TextField
                        label="Price (IDR)"
                        type="number"
                        value={item.price}
                        onChange={(e) => handleEditItemChange(index, 'price', e.target.value)}
                        sx={{ mr: 2, width: 150 }}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                      <TextField
                        label="Product"
                        value={item.product}
                        onChange={(e) => handleEditItemChange(index, 'product', e.target.value)}
                        sx={{ mr: 2, flex: 1 }}
                      />
                      <IconButton
                        onClick={() => removeEditItem(index)}
                        size="small"
                        color="error"
                        disabled={editOrder.items.length === 1}
                      >
                        <CloseIcon />
                      </IconButton>
                    </Box>
                  ))}
                  <Button variant="outlined" onClick={addEditItem} sx={{ mb: 2 }}>
                    Add Another Item
                  </Button>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ maxWidth: '40%', ml: 'auto', mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Subtotal Price (IDR)"
                    name="price"
                    value={
                      editOrder.price
                        ? Number(editOrder.price).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })
                        : '0 IDR'
                    }
                    InputProps={{ readOnly: true }}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Tax Percentage (%)"
                    name="tax_percentage"
                    value={editOrder.tax_percentage}
                    onChange={handleEditInputChange}
                    type="number"
                    sx={{ mb: 2 }}
                    inputProps={{ min: 0, max: 100, step: 0.1 }}
                  />
                  <TextField
                    fullWidth
                    label="Grand Total (IDR)"
                    value={
                      editOrder.price && editOrder.tax_percentage
                        ? (
                            Number(editOrder.price || 0) * (1 + Number(editOrder.tax_percentage || 0) / 100)
                          ).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })
                        : '0 IDR'
                    }
                    InputProps={{ readOnly: true }}
                    sx={{ mb: 2 }}
                  />
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
                </Box>
              </Box>
            </Box>
          ) : (
            <Typography variant="body1" sx={{ textAlign: 'center' }}>No order details available.</Typography>
          )}
        </Paper>
      </Modal>

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