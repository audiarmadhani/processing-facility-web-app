"use cilent";

import React, { useEffect, useState } from 'react';
import { AreaChart, Area, Tooltip, XAxis, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;



const RobustaProcessedMoM = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme(); // Access theme for dark/light mode

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const isDarkMode = theme.palette.mode === 'dark';
      const labelMapping = {
        thisMonth: 'This Month',
        lastMonth: 'Last Month',
      };
  
      return (
        <div
          style={{
            backgroundColor: isDarkMode ? '#333' : '#fff',
            color: isDarkMode ? '#fff' : '#000',
            borderRadius: '4px',
            padding: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            fontFamily: 'Roboto, sans-serif',
            fontSize: '12px', // Smaller text
            pointerEvents: 'none', // Prevent interfering with mouse events
            zIndex: 1000, // Ensure it appears above other elements
            transform: 'translate(-20px, -20px)', // Move tooltip further from cursor
          }}
          className="custom-tooltip"
        >
          <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
          <hr style={{ border: 0, borderTop: '1px solid #ccc', margin: '5px 0' }} />
          {payload.map((item, index) => (
            <p key={index} style={{ margin: '5px 0', display: 'flex', alignItems: 'center' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: item.color, // Use the stroke color
                  borderRadius: '50%',
                  display: 'inline-block',
                  marginRight: '8px',
                }}
              ></span>
              {labelMapping[item.dataKey]}: {item.value}
            </p>
          ))}
        </div>
      );
    }
  
    return null;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('https://processing-facility-backend.onrender.com/api/dashboard-metrics');
        const formattedData = response.data.robustaProcessedMoM.map(item => ({
          date: item.Date,
          thisMonth: item.TotalWeightThisMonth,
          lastMonth: item.TotalWeightLastMonth,
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
    <Box sx={{ width: '100%', height: 80}}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorthisMonth" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00B6EC" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#00B6EC" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorlastMonth" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EA6400" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#EA6400" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="date" hide/>
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="thisMonth" stroke="#00B6EC" fill="url(#colorthisMonth)" strokeWidth={2} connectNulls/>
          <Area type="monotone" dataKey="lastMonth" stroke="#EA6400" fill="url(#colorlastMonth)" strokeWidth={2} connectNulls/>
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default RobustaProcessedMoM;