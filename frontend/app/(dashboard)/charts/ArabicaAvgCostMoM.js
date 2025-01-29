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
          date: item.Date,
          thisMonthCost: parseFloat(item.RunningAverageCostThisMonth),
          lastMonthCost: parseFloat(item.RunningAverageCostLastMonth),
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
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data.length) {
    return (
      <Box sx={{ textAlign: "center", padding: 2 }}>
        <p>No data available</p>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: 80 }}>
      <LineChart
        xAxis={[{ data: [] }]} // No x-axis data
        yAxis={[{ data: [] }]} // No y-axis data
        series={[
          {
            data: data.map(item => item.thisMonthCost),
            label: "Running Average Cost This Month",
            strokeWidth: 2,
            point: { visible: false }, // Hide dots on the line
          },
          {
            data: data.map(item => item.lastMonthCost),
            label: "Running Average Cost Last Month",
            strokeWidth: 2,
            point: { visible: false }, // Hide dots on the line
          },
        ]}
        width="100%" // Full width
        height="100%" // Full height
        slotProps={{
          tooltip: { hidden: false }, // Hide tooltip
          legend: { hidden: true }, // Hide legend
        }}
      />
    </Box>
  );
};

export default ArabicaAvgCostChart;