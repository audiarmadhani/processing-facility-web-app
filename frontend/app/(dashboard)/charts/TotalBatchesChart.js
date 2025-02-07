"use client";

import React, { useEffect, useState } from 'react';
import { LineChart, Line, Tooltip, XAxis, ResponsiveContainer } from 'recharts'; // Removed unused YAxis import
import axios from 'axios';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL; // Make sure this is correctly set

const TotalBatchesChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Add error state
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('https://processing-facility-backend.onrender.com/api/dashboard-metrics');

        if (Array.isArray(response.data.totalWeightBagsbyDate)) { // Check if it's an array!
          const formattedData = response.data.totalWeightBagsbyDate.map(item => ({
            date: new Date(item.DATE).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
            totalWeight: parseFloat(item.TOTAL_WEIGHT), // Parse to number
            totalBags: parseFloat(item.TOTAL_BAGS), // Parse to number
          }));
          setData(formattedData);
        } else {
          console.error("Invalid data format:", response.data.totalWeightBagsbyDate);
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
    <Box sx={{ width: '100%', height: 500 }}> {/* Set a fixed height for the container */}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8884d8" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#8884d8" stopOpacity={0} />
            </linearGradient>
          </defs>

          <XAxis dataKey="date" /> {/* Show the X axis */}
          <Line
            type="monotone"
            dataKey="totalBags" // Use totalBags for the line
            stroke="#8884d8"
            strokeWidth={2}
            fill="url(#lineGradient)"
            dot={false}
          />

          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const isDarkMode = theme.palette.mode === 'dark';
                return (
                  <div
                    style={{
                      backgroundColor: isDarkMode ? '#333' : '#fff',
                      color: isDarkMode ? '#fff' : '#000',
                      borderRadius: '4px',
                      padding: '8px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                      fontFamily: 'Roboto, sans-serif',
                    }}
                  >
                    <p style={{ margin: 0, fontSize: '12px' }}>{label}</p>
                    <p style={{ margin: 0, fontSize: '12px' }}>
                      {payload[0].payload.totalBags} Bags {/* Access totalBags */}
                    </p>
                  </div>
                );
              }
              return null;
            }}
            cursor={{ stroke: '#8884d8', strokeDasharray: '3 3' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default TotalBatchesChart;