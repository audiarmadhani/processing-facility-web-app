"use client";

import React, { useState } from 'react';
import { 
  Modal, 
  Box, 
  Typography, 
  TextField, 
  Grid, 
  Button 
} from '@mui/material';

const DriverModal = ({ open, onClose, onSave }) => {
  const [driver, setDriver] = useState({ 
    name: '', 
    phone: '', 
    vehicle_number: '', 
    vehicle_type: '', 
    max_capacity: '' 
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDriver(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(driver);
    setDriver({ name: '', phone: '', vehicle_number: '', vehicle_type: '', max_capacity: '' });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="driver-modal-title"
      aria-describedby="driver-modal-description"
    >
      <Box 
        sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          width: 400, // Slightly narrower than Dialog's default for a custom look
          bgcolor: 'background.paper', 
          borderRadius: 2, 
          boxShadow: 24, 
          p: 4, 
          maxHeight: '80vh', 
          overflowY: 'auto', 
        }}
      >
        <Typography 
          id="driver-modal-title" 
          variant="h5" 
          sx={{ 
            mb: 2, 
            textAlign: 'center', 
            fontWeight: 'bold', 
          }}
        >
          Add New Driver
        </Typography>
        <Box id="driver-modal-description">
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Name" 
                name="name"
                value={driver.name} 
                onChange={handleChange} 
                variant="outlined" 
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Phone" 
                name="phone"
                value={driver.phone} 
                onChange={handleChange} 
                variant="outlined" 
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Vehicle Number" 
                name="vehicle_number"
                value={driver.vehicle_number} 
                onChange={handleChange} 
                variant="outlined" 
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Vehicle Type" 
                name="vehicle_type"
                value={driver.vehicle_type} 
                onChange={handleChange} 
                variant="outlined" 
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Max Capacity (kg)" 
                type="number" 
                name="max_capacity"
                value={driver.max_capacity} 
                onChange={handleChange} 
                variant="outlined" 
                sx={{ mb: 2 }}
              />
            </Grid>
          </Grid>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSave} 
            sx={{ backgroundColor: '#1976d2', '&:hover': { backgroundColor: '#1565c0' } }}
          >
            Save
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default DriverModal;