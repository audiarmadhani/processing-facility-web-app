import React, { useEffect, useState } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import axios from 'axios';
import { Box, CircularProgress } from '@mui/material';

const API_URL = "https://processing-facility-backend.onrender.com/api/dashboard-metrics";

const ArabicaAvgCostChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(API_URL);
        const transformedData = response.data.arabicaAvgCostMoM.map(item => ({
          date: item.Date, // Keep the date for the x-axis
          thisMonthCost: parseFloat(item.RunningAverageCostThisMonth), // Current month cost
          lastMonthCost: parseFloat(item.RunningAverageCostLastMonth), // Last month cost
        }));
        setData(transformedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data.length) {
    return (
      <Box sx={{ textAlign: "center", padding: 2 }}>
        <Typography variant="h6">No data available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <LineChart
        xAxis={[]} // Hide x-axis
        yAxis={[]} // Hide y-axis
        series={[
          {
            data: data.map(item => item.thisMonthCost), // Current month average cost for y-axis
            label: "Running Average Cost This Month", // Series label for current month
            line: { style: { strokeWidth: 2 } }, // Customize line style
            point: { visible: false }, // Hide dots on the line
          },
          {
            data: data.map(item => item.lastMonthCost), // Last month average cost for y-axis
            label: "Running Average Cost Last Month", // Series label for last month
            line: { style: { strokeWidth: 2 } }, // Customize line style
            point: { visible: false }, // Hide dots on the line
          },
        ]}
        width="100%" // Set width to 100%
        height="100%" // Set height to 100%
        sx={{ 
          ".MuiChart-axis": { display: 'none' } // Additional style to ensure axes are hidden
        }}
      />
    </Box>
  );
};

export default ArabicaAvgCostChart;