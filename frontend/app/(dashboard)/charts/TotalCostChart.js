"use client";

import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { Box, Typography, CircularProgress } from '@mui/material';

const TotalCostChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Add error state

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('https://processing-facility-backend.onrender.com/api/dashboard-metrics');

        if (Array.isArray(response.data.totalCostbyDate)) { // Check if it's an array!
          const formattedData = response.data.totalCostbyDate.map(item => ({
            date: item.DATE, // Ensure this matches the API response
            totalCost: parseFloat(item.PRICE), // Parse to number!
          }));
          setData(formattedData);
        } else {
          console.error("Invalid data format:", response.data.totalCostbyDate);
          setError("Invalid data format received from API.");
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError("Error fetching data from API.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 500 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) { // Display error message
    return (
      <Box sx={{ textAlign: 'center', padding: 2, color: 'red' }}>
        <Typography variant="h6">{error}</Typography>
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', padding: 2 }}>
        <Typography variant="h6">No data available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: 500 }}> {/* Fixed height for the container */}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" style={{ fontFamily: 'Roboto, sans-serif' }} />
          <YAxis style={{ fontFamily: 'Roboto, sans-serif' }} />
          <Tooltip contentStyle={{ fontFamily: 'Roboto, sans-serif' }} />
          <Line type="monotone" dataKey="totalCost" stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default TotalCostChart;