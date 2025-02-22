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
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          backgroundColor: 'hsl(220, 30%, 7%)', // Modal background color
          color: '#ffffff', // White text for contrast
          width: '500px', // Consistent with OrderCreation form width
          borderRadius: '8px', // Rounded corners
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // Subtle shadow
        }
      }}
    >
      <DialogTitle sx={{ color: '#ffffff', p: 2, fontSize: '1.25rem' }}>Add New Customer</DialogTitle>
      <DialogContent sx={{ p: 2 }}>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              variant="outlined"
              label="Name"
              name="name"
              value={customer.name}
              onChange={handleChange}
              sx={{ 
                mb: 2, 
                '& .MuiOutlinedInput-root': { 
                  color: '#ffffff', 
                  backgroundColor: 'hsl(220, 30%, 10%)', // Slightly lighter than modal for contrast
                  borderRadius: '8px' 
                }, 
                '& .MuiInputLabel-root': { color: '#b0b0b0' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#b0b0b0' }
              }}
              InputProps={{ sx: { '& .MuiOutlinedInput-notchedOutline': { borderColor: '#b0b0b0' } } }}
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
              sx={{ 
                mb: 2, 
                '& .MuiOutlinedInput-root': { 
                  color: '#ffffff', 
                  backgroundColor: 'hsl(220, 30%, 10%)', 
                  borderRadius: '8px' 
                }, 
                '& .MuiInputLabel-root': { color: '#b0b0b0' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#b0b0b0' }
              }}
              InputProps={{ sx: { '& .MuiOutlinedInput-notchedOutline': { borderColor: '#b0b0b0' } } }}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
              <InputLabel sx={{ color: '#b0b0b0' }}>Country</InputLabel>
              <Select
                name="country"
                value={customer.country}
                onChange={handleChange}
                label="Country"
                disabled={loading}
                sx={{ 
                  color: '#ffffff', 
                  backgroundColor: 'hsl(220, 30%, 10%)', 
                  borderRadius: '8px', 
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#b0b0b0' },
                  '& .MuiMenuItem-root': { color: '#ffffff', backgroundColor: 'hsl(220, 30%, 7%)' } // Dropdown menu items
                }}
              >
                {countries.map(country => (
                  <MenuItem key={country.iso2} value={country.name}>{country.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }} disabled={!customer.country}>
              <InputLabel sx={{ color: '#b0b0b0' }}>State</InputLabel>
              <Select
                name="state"
                value={customer.state}
                onChange={handleChange}
                label="State"
                sx={{ 
                  color: '#ffffff', 
                  backgroundColor: 'hsl(220, 30%, 10%)', 
                  borderRadius: '8px', 
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#b0b0b0' },
                  '& .MuiMenuItem-root': { color: '#ffffff', backgroundColor: 'hsl(220, 30%, 7%)' } // Dropdown menu items
                }}
              >
                {states.map(state => (
                  <MenuItem key={state.iso2} value={state.name}>{state.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }} disabled={!customer.state}>
              <InputLabel sx={{ color: '#b0b0b0' }}>City</InputLabel>
              <Select
                name="city"
                value={customer.city}
                onChange={handleChange}
                label="City"
                sx={{ 
                  color: '#ffffff', 
                  backgroundColor: 'hsl(220, 30%, 10%)', 
                  borderRadius: '8px', 
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#b0b0b0' },
                  '& .MuiMenuItem-root': { color: '#ffffff', backgroundColor: 'hsl(220, 30%, 7%)' } // Dropdown menu items
                }}
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
              sx={{ 
                mb: 2, 
                '& .MuiOutlinedInput-root': { 
                  color: '#ffffff', 
                  backgroundColor: 'hsl(220, 30%, 10%)', 
                  borderRadius: '8px' 
                }, 
                '& .MuiInputLabel-root': { color: '#b0b0b0' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#b0b0b0' }
              }}
              InputProps={{ sx: { '& .MuiOutlinedInput-notchedOutline': { borderColor: '#b0b0b0' } } }}
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
              sx={{ 
                mb: 2, 
                '& .MuiOutlinedInput-root': { 
                  color: '#ffffff', 
                  backgroundColor: 'hsl(220, 30%, 10%)', 
                  borderRadius: '8px' 
                }, 
                '& .MuiInputLabel-root': { color: '#b0b0b0' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#b0b0b0' }
              }}
              InputProps={{ sx: { '& .MuiOutlinedInput-notchedOutline': { borderColor: '#b0b0b0' } } }}
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
              sx={{ 
                mb: 2, 
                '& .MuiOutlinedInput-root': { 
                  color: '#ffffff', 
                  backgroundColor: 'hsl(220, 30%, 10%)', 
                  borderRadius: '8px' 
                }, 
                '& .MuiInputLabel-root': { color: '#b0b0b0' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#b0b0b0' }
              }}
              InputProps={{ sx: { '& .MuiOutlinedInput-notchedOutline': { borderColor: '#b0b0b0' } } }}
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
              sx={{ 
                mb: 2, 
                '& .MuiOutlinedInput-root': { 
                  color: '#ffffff', 
                  backgroundColor: 'hsl(220, 30%, 10%)', 
                  borderRadius: '8px' 
                }, 
                '& .MuiInputLabel-root': { color: '#b0b0b0' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#b0b0b0' }
              }}
              InputProps={{ sx: { '& .MuiOutlinedInput-notchedOutline': { borderColor: '#b0b0b0' } } }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={onClose} 
          sx={{ 
            color: '#ffffff', 
            backgroundColor: 'hsl(220, 30%, 15%)', 
            '&:hover': { backgroundColor: 'hsl(220, 30%, 20%)' }, 
            borderRadius: '8px', 
            px: 3, 
            py: 1 
          }}
        >
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSave} 
          disabled={loading} 
          sx={{ 
            backgroundColor: '#007bff', 
            '&:hover': { backgroundColor: '#0056b3' }, 
            borderRadius: '8px', 
            px: 3, 
            py: 1 
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerModal;