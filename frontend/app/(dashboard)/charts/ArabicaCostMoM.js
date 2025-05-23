"use client";

import React, { useEffect, useState } from 'react';import { LineChart } from '@mui/x-charts/LineChart';
import axios from 'axios';
import { Box, CircularProgress, Typography } from '@mui/material'; // Import Typography

const ArabicaCostMoM = ({ timeframe = "this_month" }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Add error state

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`https://processing-facility-backend.onrender.com/api/dashboard-metrics?timeframe=${timeframe}`);

        if (Array.isArray(response.data.arabicaCostMoM)) {
          const formattedData = response.data.arabicaCostMoM.map(item => ({
            date: item.Date,
            thisMonth: parseFloat(item.TotalCostThisMonth), // Parse to number
            lastMonth: parseFloat(item.TotalCostLastMonth),   // Parse to number
          }));
          setData(formattedData);
        } else if (response.data.arabicaCostMoM) { // Handle single object case
          const formattedData = [{
            date: response.data.arabicaCostMoM.Date,
            thisMonth: parseFloat(response.data.arabicaCostMoM.TotalCostThisMonth),
            lastMonth: parseFloat(response.data.arabicaCostMoM.TotalCostLastMonth),
          }];
          setData(formattedData);
        } else {
          console.error("Invalid data format:", response.data.arabicaCostMoM);
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
  }, [timeframe]);

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
            color: '#66b2b2',
            strokeWidth: 2,
          },
          {
            data: data.map(item => item.lastMonth),
            label: 'Last Month',
            showMark: false,
            curve: "monotoneX",
            color: '#ffbfd3',
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

export default ArabicaCostMoM; // Correct export name