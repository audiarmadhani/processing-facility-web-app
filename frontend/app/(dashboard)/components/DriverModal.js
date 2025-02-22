import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Button } from '@mui/material';

const DriverModal = ({ open, onClose, onSave }) => {
  const [driver, setDriver] = useState({ name: '', phone: '', vehicle_number: '', vehicle_type: '', max_capacity: '' });

  const handleSave = () => {
    onSave(driver);
    setDriver({ name: '', phone: '', vehicle_number: '', vehicle_type: '', max_capacity: '' });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add New Driver</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}><TextField fullWidth label="Name" value={driver.name} onChange={(e) => setDriver({ ...driver, name: e.target.value })} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Phone" value={driver.phone} onChange={(e) => setDriver({ ...driver, phone: e.target.value })} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Vehicle Number" value={driver.vehicle_number} onChange={(e) => setDriver({ ...driver, vehicle_number: e.target.value })} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Vehicle Type" value={driver.vehicle_type} onChange={(e) => setDriver({ ...driver, vehicle_type: e.target.value })} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Max Capacity (kg)" type="number" value={driver.max_capacity} onChange={(e) => setDriver({ ...driver, max_capacity: e.target.value })} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DriverModal;