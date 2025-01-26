'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, TextField, Typography, Box, Avatar } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person'; // Import user icon

export default function SignUpPage() {
  const [formData, setFormData] = React.useState({
    email: '',
    name: '',
    password: '',
  });
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('https://processing-facility-backend.onrender.com/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/auth/signin'); // Redirect to sign-in page
        }, 2000);
      } else {
        const { message } = await response.json();
        setError(message || 'Failed to register.');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh', // Full height of the viewport
        backgroundColor: '#000000', // Optional: Light background color
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 4,
          borderRadius: 2,
          boxShadow: 3,
          border: '1px solid lightgrey',
          backgroundColor: 'rgba(8, 9, 21, 0.5)',
        }}
      >
        <Avatar sx={{ bgcolor: 'primary.main', mb: 2 }}>
          <PersonIcon />
        </Avatar>
        <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
          Processing Facility Sign Up
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">Account created successfully!</Alert>}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%', maxWidth: 400 }}>
          <TextField
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
            Sign Up
          </Button>
        </Box>
      </Box>
    </Box>
  );
}