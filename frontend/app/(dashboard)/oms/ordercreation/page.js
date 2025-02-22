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
} from '@mui/material';
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
  const [formData, setFormData] = useState({
    customer_id: '',
    driver_id: '',
    items: [{ product: '', quantity: '' }],
    shipping_method: 'Customer',
  });
  const [loading, setLoading] = useState(false);
  const [openCustomerModal, setOpenCustomerModal] = useState(false);
  const [openDriverModal, setOpenDriverModal] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [refreshCounter, setRefreshCounter] = useState(0); // New state for refreshing

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [customersRes, driversRes] = await Promise.all([
          fetch('https://processing-facility-backend.onrender.com/api/customers'),
          fetch('https://processing-facility-backend.onrender.com/api/drivers'),
        ]);
        if (!customersRes.ok || !driversRes.ok) throw new Error('Failed to fetch data');
        const customersData = await customersRes.json();
        const driversData = await driversRes.json();
        setCustomers(customersData);
        setDrivers(driversData);
      } catch (error) {
        setSnackbar({ open: true, message: error.message, severity: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refreshCounter]); // Depend on refreshCounter

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({ ...prev, items: [...prev.items, { product: '', quantity: '' }] }));
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) {
      setSnackbar({ open: true, message: 'At least one item is required', severity: 'warning' });
      return;
    }
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: newItems }));
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
      setCustomers(prev => [...prev, customer]); // Immediate update for UX
      setFormData(prev => ({ ...prev, customer_id: customer.customer_id }));
      setRefreshCounter(prev => prev + 1); // Trigger refetch
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
      setDrivers(prev => [...prev, driver]); // Immediate update for UX
      setFormData(prev => ({ ...prev, driver_id: driver.driver_id }));
      setRefreshCounter(prev => prev + 1); // Trigger refetch
      setSnackbar({ open: true, message: 'Driver added successfully', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    }
    setOpenDriverModal(false);
  };

  const generateOrderListPDF = (orderId) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [241.3, 279.4],
    });

    const customer = customers.find(c => c.customer_id === formData.customer_id);
    const driver = drivers.find(d => d.driver_id === formData.driver_id);

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

    let shippingOffset = 45;
    addText("Shipping Information:", 14 + columnWidth + 10, shippingOffset, { bold: true });
    shippingOffset += 8;
    addText(`Method: ${formData.shipping_method}`, 14 + columnWidth + 10, shippingOffset);
    shippingOffset += 6;
    if (driver) {
      addText(`Driver Name: ${driver.name || '-'}`, 14 + columnWidth + 10, shippingOffset);
      shippingOffset += 6;
      addText(`Vehicle No.: ${driver.vehicle_number || '-'}`, 14 + columnWidth + 10, shippingOffset);
      shippingOffset += 6;
      addText(`Vehicle Type: ${driver.vehicle_type || '-'}`, 14 + columnWidth + 10, shippingOffset);
      shippingOffset += 6;
      addText(`Max Capacity: ${driver.max_capacity ? driver.max_capacity + ' kg' : '-'}`, 14 + columnWidth + 10, shippingOffset);
    }

    let tableOffset = Math.max(yOffset, driver ? shippingOffset + 6 : shippingOffset) + 10;
    addText("Items:", 14, tableOffset, { bold: true });
    doc.autoTable({
      startY: tableOffset + 8,
      head: [['Product', 'Quantity (kg)']],
      body: formData.items.map(item => [item.product, item.quantity]),
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

    doc.line(14, doc.internal.pageSize.getHeight() - 14, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 14);
    addText(`Printed on: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`, 14, doc.internal.pageSize.getHeight() - 8, { size: 10 });

    return doc;
  };

  const handleSubmit = async () => {
    if (!formData.customer_id || !formData.items.every(item => item.product && item.quantity) || !formData.shipping_method) {
      setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const orderData = new FormData();
      orderData.append('customer_id', formData.customer_id);
      orderData.append('driver_id', formData.driver_id || '');
      orderData.append('items', JSON.stringify(formData.items));
      orderData.append('shipping_method', formData.shipping_method);

      const orderRes = await fetch('https://processing-facility-backend.onrender.com/api/orders', {
        method: 'POST',
        body: orderData,
      });

      if (!orderRes.ok) throw new Error('Failed to create order');
      const orderResult = await orderRes.json();
      console.log('Order Response:', orderResult);
      const orderId = orderResult.order && orderResult.order.length > 0 ? orderResult.order[0].order_id : null;
      if (!orderId) throw new Error('Order ID not found in response');

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
      }));
      orderListFormData.append('file', orderListBlob, `OrderList-${orderId}.pdf`);

      const docRes = await fetch('https://processing-facility-backend.onrender.com/api/documents/upload', {
        method: 'POST',
        body: orderListFormData,
      });

      if (!docRes.ok) throw new Error('Failed to upload Order List');

      orderListDoc.save(`OrderList-${orderId}.pdf`);

      setSnackbar({ open: true, message: 'Order and Order List created successfully', severity: 'success' });
      setFormData({ customer_id: '', driver_id: '', items: [{ product: '', quantity: '' }], shipping_method: 'Customer' });
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  if (status === 'loading') return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;

  if (!session?.user || !['admin', 'manager', 'preprocessing'].includes(session.user.role)) {
    return <Typography variant="h6" sx={{ textAlign: 'center', mt: 4 }}>Access Denied</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
      <Box sx={{ width: '500px' }}>
        <Typography variant="h4" gutterBottom align="center">Create New Order</Typography>

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
          </Select>
        </FormControl>
        <Button sx={{ mb: 3 }} onClick={() => setOpenCustomerModal(true)}>Add New Customer</Button>

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

        {formData.shipping_method === 'Self' && (
          <>
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
              </Select>
            </FormControl>
            <Button sx={{ mb: 3 }} onClick={() => setOpenDriverModal(true)}>Add New Driver</Button>
          </>
        )}

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
        <Button variant="outlined" onClick={addItem} sx={{ mb: 3 }}>Add Another Item</Button>

        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
          fullWidth
        >
          Create Order
        </Button>

        <CustomerModal open={openCustomerModal} onClose={() => setOpenCustomerModal(false)} onSave={handleSaveCustomer} />
        <DriverModal open={openDriverModal} onClose={() => setOpenDriverModal(false)} onSave={handleSaveDriver} />

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
    </Box>
  );
};

export default OrderCreation;