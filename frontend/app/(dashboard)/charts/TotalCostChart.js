"use cilent";

import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { Box, Typography, CircularProgress } from '@mui/material';

const TotalCostChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true); // Added loading state

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/dashboard-metrics');
        
        // Access totalWeightBagsbyDate directly from the response
        const formattedData = response.data.totalCostbyDate.map(item => ({
          date: item.DATE, // Ensure this matches the API response
          totalCost: item.PRICE,
        }));
         
        setData(formattedData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false); // Set loading to false after fetch
      }
    };

    fetchData();
  }, []);

  // Show loading spinner while data is being fetched
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 500 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Ensure data is defined and has items before rendering the chart
  if (!data || data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', padding: 2 }}>
        <Typography variant="h6">No data available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: 500 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} grid={{ vertical: true, horizontal: true }}>
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