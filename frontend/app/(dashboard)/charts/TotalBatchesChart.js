"use cilent";

import React, { useEffect, useState } from 'react';
import { LineChart, Line, Tooltip, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const TotalBatchesChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme(); // Access theme for dark/light mode

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/dashboard-metrics');
        const formattedData = response.data.totalWeightBagsbyDate.map(item => ({
          date: new Date(item.DATE).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }), // Format date
          totalWeight: item.TOTAL_WEIGHT,
          totalBags: item.TOTAL_BAGS,
        }));
        setData(formattedData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false); // Stop loading indicator
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

  if (!data || data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', padding: 2 }}>
        <Typography variant="h6">No data available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: 50 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          {/* Gradient definition */}
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8884d8" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#8884d8" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* X-Axis for Dates */}
          <XAxis
            dataKey="date"
            hide // Hide axis but allow data mapping
          />

          {/* Line with gradient */}
          <Line
            type="monotone"
            dataKey="totalWeight"
            stroke="#8884d8"
            strokeWidth={2}
            fill="url(#lineGradient)"
            dot={false}
          />

          {/* Tooltip for hover interactions */}
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
                      {payload[0].value} Bags
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