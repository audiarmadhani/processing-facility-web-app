"use client";

import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Box, 
  Typography, 
  TextField, 
  Grid, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  CircularProgress 
} from '@mui/material';

const CustomerModal = ({ open, onClose, onSave }) => {
  const [customer, setCustomer] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    special_requests: '',
    country: '',
    state: '',
    city: '',
    zip_code: ''
  });
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);

  // CountriesNow API configuration
  const BASE_URL = 'https://countriesnow.space/api/v0.1/countries';

  // Fetch countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/flag/images`);
        if (!res.ok) throw new Error('Failed to fetch countries');
        const data = await res.json();
        setCountries(data.data || []); // Array of { name, iso2, ... }
      } catch (error) {
        console.error('Error fetching countries:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCountries();
  }, []);

  // Fetch states when country changes
  useEffect(() => {
    if (!customer.country) {
      setStates([]);
      setCities([]);
      setCustomer(prev => ({ ...prev, state: '', city: '' }));
      return;
    }

    const fetchStates = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/states`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ country: customer.country }),
        });
        if (!res.ok) throw new Error('Failed to fetch states');
        const data = await res.json();
        setStates(data.data.states || []); // Array of { name, iso2, ... }
        setCities([]);
        setCustomer(prev => ({ ...prev, state: '', city: '' }));
      } catch (error) {
        console.error('Error fetching states:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStates();
  }, [customer.country]);

  // Fetch cities when state changes
  useEffect(() => {
    if (!customer.country || !customer.state) {
      setCities([]);
      setCustomer(prev => ({ ...prev, city: '' }));
      return;
    }

    const fetchCities = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/state/cities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ country: customer.country, state: customer.state }),
        });
        if (!res.ok) throw new Error('Failed to fetch cities');
        const data = await res.json();
        setCities(data.data || []); // Array of city names (strings)
        setCustomer(prev => ({ ...prev, city: '' }));
      } catch (error) {
        console.error('Error fetching cities:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCities();
  }, [customer.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(customer);
    setCustomer({
      name: '',
      address: '',
      phone: '',
      email: '',
      special_requests: '',
      country: '',
      state: '',
      city: '',
      zip_code: ''
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="customer-modal-title"
      aria-describedby="customer-modal-description"
    >
      <Box 
        sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          width: 400, // Slightly narrower for a custom look
          bgcolor: 'background.paper', 
          borderRadius: 2, 
          boxShadow: 24, 
          p: 4, 
          maxHeight: '80vh', 
          overflowY: 'auto', 
        }}
      >
        <Typography 
          id="customer-modal-title" 
          variant="h5" 
          sx={{ 
            mb: 2, 
            textAlign: 'center', 
            fontWeight: 'bold', 
          }}
        >
          Add New Customer
        </Typography>
        {loading ? (
          <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />
        ) : (
          <Box id="customer-modal-description">
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField 
                  fullWidth 
                  label="Name" 
                  name="name"
                  value={customer.name} 
                  onChange={handleChange} 
                  variant="outlined" 
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  fullWidth 
                  label="Address" 
                  name="address"
                  value={customer.address} 
                  onChange={handleChange} 
                  variant="outlined" 
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                  <InputLabel>Country</InputLabel>
                  <Select
                    name="country"
                    value={customer.country}
                    onChange={handleChange}
                    label="Country"
                    disabled={loading}
                  >
                    {countries.map(country => (
                      <MenuItem key={country.iso2} value={country.name}>{country.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined" sx={{ mb: 2 }} disabled={!customer.country || loading}>
                  <InputLabel>State</InputLabel>
                  <Select
                    name="state"
                    value={customer.state}
                    onChange={handleChange}
                    label="State"
                  >
                    {states.map(state => (
                      <MenuItem key={state.iso2} value={state.name}>{state.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined" sx={{ mb: 2 }} disabled={!customer.state || loading}>
                  <InputLabel>City</InputLabel>
                  <Select
                    name="city"
                    value={customer.city}
                    onChange={handleChange}
                    label="City"
                  >
                    {cities.map(city => (
                      <MenuItem key={city} value={city}>{city}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  fullWidth 
                  label="Zip Code" 
                  name="zip_code"
                  value={customer.zip_code} 
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
                  value={customer.phone} 
                  onChange={handleChange} 
                  variant="outlined" 
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  fullWidth 
                  label="Email" 
                  name="email"
                  value={customer.email} 
                  onChange={handleChange} 
                  variant="outlined" 
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  fullWidth 
                  label="Special Requests" 
                  name="special_requests"
                  value={customer.special_requests} 
                  onChange={handleChange} 
                  variant="outlined" 
                  sx={{ mb: 2 }}
                />
              </Grid>
            </Grid>
          </Box>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSave} 
            disabled={loading}
            sx={{ backgroundColor: '#1976d2', '&:hover': { backgroundColor: '#1565c0' } }}
          >
            Save
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default CustomerModal;