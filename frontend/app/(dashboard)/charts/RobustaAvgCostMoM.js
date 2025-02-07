"use client";

import React, { useEffect, useState } from 'react';import { LineChart } from '@mui/x-charts/LineChart';
import axios from 'axios';
import { Box, CircularProgress, Typography } from '@mui/material'; // Import Typography

const API_URL = "https://processing-facility-backend.onrender.com/api/dashboard-metrics";

const RobustaAvgCostMoM = () => { // Capitalize component name
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Add error state

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(API_URL);

        if (Array.isArray(response.data.robustaAvgCostMoM)) {
          const formattedData = response.data.robustaAvgCostMoM.map(item => ({
            date: item.Date,
            thisMonth: parseFloat(item.RunningAverageCostThisMonth), // Parse to number
            lastMonth: parseFloat(item.RunningAverageCostLastMonth),   // Parse to number
          }));
          setData(formattedData);
        } else if (response.data.robustaAvgCostMoM) { // Handle single object case
          const formattedData = [{
            date: response.data.robustaAvgCostMoM.Date,
            thisMonth: parseFloat(response.data.robustaAvgCostMoM.RunningAverageCostThisMonth),
            lastMonth: parseFloat(response.data.robustaAvgCostMoM.RunningAverageCostLastMonth),
          }];
          setData(formattedData);
        } else {
          console.error("Invalid data format:", response.data.robustaAvgCostMoM);
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

export default RobustaAvgCostMoM; // Correct export name and capitalization