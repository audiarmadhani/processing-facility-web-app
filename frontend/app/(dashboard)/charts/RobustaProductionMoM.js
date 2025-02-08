"use client";

import React, { useEffect, useState } from 'react';import { LineChart } from '@mui/x-charts/LineChart';
import axios from 'axios';
import { Box, CircularProgress, Typography } from '@mui/material'; // Import Typography

const RobustaProductionMoM = ({ timeframe = "this_month" }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Add error state

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`https://processing-facility-backend.onrender.com/api/dashboard-metrics?timeframe=${timeframe}`);

        if (Array.isArray(response.data.robustaProductionMoM)) {
          const formattedData = response.data.robustaProductionMoM.map(item => ({
            date: item.Date,
            thisMonth: parseFloat(item.TotalWeightThisMonth), // Parse to number
            lastMonth: parseFloat(item.TotalWeightLastMonth),   // Parse to number
          }));
          setData(formattedData);
        } else if (response.data.robustaProductionMoM) { // Handle single object case
          const formattedData = [{
            date: response.data.robustaProductionMoM.Date,
            thisMonth: parseFloat(response.data.robustaProductionMoM.TotalWeightThisMonth),
            lastMonth: parseFloat(response.data.robustaProductionMoM.TotalWeightLastMonth),
          }];
          setData(formattedData);
        } else {
          console.error("Invalid data format:", response.data.robustaProductionMoM);
          setError("Invalid data format received from API.");
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        setError("Error fetching data from API."); // Set error message
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 80 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) { // Display error message
    return (
      <Box sx={{ textAlign: "center", padding: 2, color: "red" }}>
        <Typography variant="body1">{error}</Typography>
      </Box>
    );
  }

  if (data.length === 0) {
    return (
      <Box sx={{ textAlign: "center", padding: 2 }}>
        <Typography variant="body1">No data available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <LineChart
        xAxis={[{ scaleType: 'point', data: data.map(item => item.date) }]}
        series={[
          {
            data: data.map(item => item.thisMonth),
            label: 'This Month',
            showMark: false,
            curve: "monotoneX",
            color: '#00ABC9', // Keep your colors
            strokeWidth: 2,
          },
          {
            data: data.map(item => item.lastMonth),
            label: 'Last Month',
            showMark: false,
            curve: "monotoneX",
            color: '#F56600', // Keep your colors
          },
        ]}
        height={70}
        slotProps={{
          legend: { hidden: true },
        }}
        leftAxis={null}
        bottomAxis={null}
        margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
      />
    </Box>
  );
};

export default RobustaProductionMoM;