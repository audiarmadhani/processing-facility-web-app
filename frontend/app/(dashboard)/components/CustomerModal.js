import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

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
        setCountries(data.data); // Array of { name, iso2, ... }
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
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add New Customer</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              variant="outlined"
              label="Name"
              name="name"
              value={customer.name}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              variant="outlined"
              label="Address"
              name="address"
              value={customer.address}
              onChange={handleChange}
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
            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }} disabled={!customer.country}>
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
            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }} disabled={!customer.state}>
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
              variant="outlined"
              label="Zip Code"
              name="zip_code"
              value={customer.zip_code}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              variant="outlined"
              label="Phone"
              name="phone"
              value={customer.phone}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              variant="outlined"
              label="Email"
              name="email"
              value={customer.email}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              variant="outlined"
              label="Special Requests"
              name="special_requests"
              value={customer.special_requests}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerModal;