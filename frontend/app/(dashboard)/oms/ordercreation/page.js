"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Grid,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { useSession } from 'next-auth/react';
import CustomerModal from '../components/CustomerModal'; // From previous code
import DriverModal from '../components/DriverModal';   // From previous code
import jsPDF from 'jspdf';
import 'jspdf-autotable'; // For table formatting
import dayjs from 'dayjs'; // For date formatting

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
  }, []);

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
      format: [241.3, 279.4], // 9.5 x 11 inches in mm (same as QC report)
    });

    const customer = customers.find(c => c.customer_id === formData.customer_id);
    const driver = drivers.find(d => d.driver_id === formData.driver_id);

    // Helper function for consistent text styling (from QC report)
    const addText = (text, x, y, options = {}) => {
      doc.setFont('courier');
      doc.setFontSize(10);
      if (options.bold) doc.setFont('courier', 'bold');
      if (options.align) doc.text(text, x, y, { align: options.align });
      else doc.text(text, x, y);
    };

    // --- Header ---
    addText("PT. Berkas Tuaian Melimpah", doc.internal.pageSize.getWidth() / 2, 10, { align: 'center', bold: true });
    addText("Order List", doc.internal.pageSize.getWidth() / 2, 16, { align: 'center', bold: true });
    addText(`Date: ${dayjs().format('YYYY-MM-DD')}`, doc.internal.pageSize.getWidth() - 10, 10, { align: 'right' });
    addText(`Time: ${dayjs().format('HH:mm:ss')}`, doc.internal.pageSize.getWidth() - 10, 16, { align: 'right' });
    doc.line(5, 20, doc.internal.pageSize.getWidth() - 5, 20); // Horizontal line
    addText(`Order ID: ${orderId}`, 10, 28, { bold: true });

    // --- Two-Column Layout (Customer and Shipping) ---
    let yOffset = 38; // Start below header and order ID
    const columnWidth = (doc.internal.pageSize.getWidth() - 30) / 2;

    // --- Customer Information (Left Column) ---
    addText("Customer Information:", 10, yOffset, { bold: true });
    yOffset += 6;
    addText(`Name    : ${customer ? customer.name : '-'}`, 10, yOffset);
    yOffset += 6;
    addText(`Address : ${customer ? customer.address : '-'}`, 10, yOffset);
    yOffset += 6;
    addText(`Phone   : ${customer ? customer.phone : '-'}`, 10, yOffset);
    yOffset += 6;
    addText(`Email   : ${customer ? customer.email || '-' : '-'}`, 10, yOffset);

    // --- Shipping Information (Right Column) ---
    let shippingOffset = 38;
    addText("Shipping Information:", 10 + columnWidth + 10, shippingOffset, { bold: true });
    shippingOffset += 6;
    addText(`Method : ${formData.shipping_method}`, 10 + columnWidth + 10, shippingOffset);
    shippingOffset += 6;
    if (driver) {
      addText(`Driver Name   : ${driver.name || '-'}`, 10 + columnWidth + 10, shippingOffset);
      shippingOffset += 6;
      addText(`Vehicle No.   : ${driver.vehicle_number || '-'}`, 10 + columnWidth + 10, shippingOffset);
      shippingOffset += 6;
      addText(`Vehicle Type  : ${driver.vehicle_type || '-'}`, 10 + columnWidth + 10, shippingOffset);
      shippingOffset += 6;
      addText(`Max Capacity  : ${driver.max_capacity ? driver.max_capacity + ' kg' : '-'}`, 10 + columnWidth + 10, shippingOffset);
    }

    // --- Items Table (Full Width) ---
    let tableOffset = Math.max(yOffset, driver ? shippingOffset + 6 : shippingOffset) + 10;
    addText("Items:", 10, tableOffset, { bold: true });
    doc.autoTable({
      startY: tableOffset + 6,
      head: [['Product', 'Quantity (kg)']],
      body: formData.items.map(item => [item.product, item.quantity]),
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [200, 200, 200] },
    });

    // --- Signatures ---
    let signatureOffset = doc.lastAutoTable.finalY + 10;
    doc.line(5, signatureOffset, doc.internal.pageSize.getWidth() - 5, signatureOffset);
    const signatureY = signatureOffset + 40;
    const labelY = signatureY + 6;
    const signatureLength = 20;

    addText("_".repeat(signatureLength), 10, signatureY);
    addText("Order Staff", 10, labelY);
    addText(session.user.name || '-', 10, labelY + 6); // Assuming user name from session

    addText("_".repeat(signatureLength), 70, signatureY);
    addText("Manager", 70, labelY);
    addText('(..................)', 70, labelY + 12);

    if (driver) {
      addText("_".repeat(signatureLength), 130, signatureY);
      addText("Driver", 130, labelY);
      addText(driver.name || '-', 130, labelY + 6);
    }

    // --- Footer ---
    doc.line(5, doc.internal.pageSize.getHeight() - 10, doc.internal.pageSize.getWidth() - 5, doc.internal.pageSize.getHeight() - 10);
    addText(`Printed on: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`, 10, doc.internal.pageSize.getHeight() - 5);

    return doc;
  };

  const handleSubmit = async () => {
    if (!formData.customer_id || !formData.items.every(item => item.product && item.quantity) || !formData.shipping_method) {
      setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'warning' });
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create the order
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
      const orderId = orderResult.order.order_id;

      // Step 2: Generate Order List PDF
      const orderListDoc = generateOrderListPDF(orderId);
      const orderListBlob = orderListDoc.output('blob');

      // Step 3: Upload to Google Drive
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

      // Step 4: Download PDF for printing
      orderListDoc.save(`OrderList-${orderId}.pdf`);

      orderListDoc.autoPrint();
			window.open(orderListDoc.output('bloburl'), '_blank');

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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Create New Order</Typography>

      <Grid container spacing={3}>
        {/* Customer Selection */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
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
          <Button sx={{ mt: 1 }} onClick={() => setOpenCustomerModal(true)}>Add New Customer</Button>
        </Grid>

        {/* Shipping Method */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
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
        </Grid>

        {/* Driver Selection (Self-Arranged Only) */}
        {formData.shipping_method === 'Self' && (
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
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
            <Button sx={{ mt: 1 }} onClick={() => setOpenDriverModal(true)}>Add New Driver</Button>
          </Grid>
        )}

        {/* Items */}
        {formData.items.map((item, index) => (
          <Grid item xs={12} key={index}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Product"
                  value={item.product}
                  onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Quantity (kg)"
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                />
              </Grid>
            </Grid>
          </Grid>
        ))}
        <Grid item xs={12}>
          <Button variant="outlined" onClick={addItem}>Add Another Item</Button>
        </Grid>

        {/* Submit */}
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Create Order
          </Button>
        </Grid>
      </Grid>

      {/* Modals */}
      <CustomerModal open={openCustomerModal} onClose={() => setOpenCustomerModal(false)} onSave={handleSaveCustomer} />
      <DriverModal open={openDriverModal} onClose={() => setOpenDriverModal(false)} onSave={handleSaveDriver} />

      {/* Snackbar */}
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

export default OrderCreation;