import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Button } from '@mui/material';

const CustomerModal = ({ open, onClose, onSave }) => {
  const [customer, setCustomer] = useState({ name: '', address: '', phone: '', special_requests: '', warehouse_open_time: '' });

  const handleSave = () => {
    onSave(customer);
    setCustomer({ name: '', address: '', phone: '', special_requests: '', warehouse_open_time: '' });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add New Customer</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}><TextField fullWidth label="Name" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Address" value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Phone" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Special Requests" value={customer.special_requests} onChange={(e) => setCustomer({ ...customer, special_requests: e.target.value })} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Warehouse Open Time" value={customer.warehouse_open_time} onChange={(e) => setCustomer({ ...customer, warehouse_open_time: e.target.value })} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerModal;