import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const CustomerModal = ({ open, onClose, onSave }) => {
  const [customer, setCustomer] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    special_requests: '',
    warehouse_open_time: '',
    preferred_shipping_method: '',
    country: '',
    state: '',
    city: '',
    zip_code: ''
  });
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);

  // GeoNames API configuration
  const GEONAMES_USERNAME = 'audiarmadhani'; // Replace with your GeoNames username
  const BASE_URL = 'http://api.geonames.org';

  // Fetch countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/countryInfoJSON?username=${GEONAMES_USERNAME}`);
        if (!res.ok) throw new Error('Failed to fetch countries');
        const data = await res.json();
        setCountries(data.geonames);
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
        const countryCode = countries.find(c => c.countryName === customer.country)?.countryCode;
        const res = await fetch(`${BASE_URL}/childrenJSON?geonameId=${countryCode}&username=${GEONAMES_USERNAME}`);
        if (!res.ok) throw new Error('Failed to fetch states');
        const data = await res.json();
        setStates(data.geonames || []);
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
    if (!customer.state) {
      setCities([]);
      setCustomer(prev => ({ ...prev, city: '' }));
      return;
    }

    const fetchCities = async () => {
      try {
        const stateGeonameId = states.find(s => s.name === customer.state)?.geonameId;
        const res = await fetch(`${BASE_URL}/childrenJSON?geonameId=${stateGeonameId}&username=${GEONAMES_USERNAME}`);
        if (!res.ok) throw new Error('Failed to fetch cities');
        const data = await res.json();
        setCities(data.geonames || []);
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
      warehouse_open_time: '',
      preferred_shipping_method: '',
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
              label="Name"
              name="name"
              value={customer.name}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address"
              name="address"
              value={customer.address}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Phone"
              name="phone"
              value={customer.phone}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              value={customer.email}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Country</InputLabel>
              <Select
                name="country"
                value={customer.country}
                onChange={handleChange}
                label="Country"
                disabled={loading}
              >
                {countries.map(country => (
                  <MenuItem key={country.countryCode} value={country.countryName}>{country.countryName}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth disabled={!customer.country}>
              <InputLabel>State</InputLabel>
              <Select
                name="state"
                value={customer.state}
                onChange={handleChange}
                label="State"
              >
                {states.map(state => (
                  <MenuItem key={state.geonameId} value={state.name}>{state.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth disabled={!customer.state}>
              <InputLabel>City</InputLabel>
              <Select
                name="city"
                value={customer.city}
                onChange={handleChange}
                label="City"
              >
                {cities.map(city => (
                  <MenuItem key={city.geonameId} value={city.name}>{city.name}</MenuItem>
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
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Special Requests"
              name="special_requests"
              value={customer.special_requests}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Warehouse Open Time"
              name="warehouse_open_time"
              value={customer.warehouse_open_time}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Preferred Shipping Method"
              name="preferred_shipping_method"
              value={customer.preferred_shipping_method}
              onChange={handleChange}
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