"use cilent";

import React, { useEffect, useState } from 'react';
import {
  LineChart,
  LineSeries,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveChartContainer,
} from "@mui/x-charts";import axios from 'axios';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;


const arabicaAvgCostMoM = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme(); // Access theme for dark/light mode

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`https://processing-facility-backend.onrender.com/api/dashboard-metrics`);
        const formattedData = response.data.arabicaAvgCostMoM.map(item => ({
          date: item.Date,
          thisMonth: parseFloat(item.RunningAverageCostThisMonth), // Convert to number
          lastMonth: parseFloat(item.RunningAverageCostLastMonth), // Convert to number
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
    <Box sx={{ width: "100%", height: 200 }}>
      <ResponsiveChartContainer>
        <LineChart
          xAxis={[{ scaleType: "point", data: data.map((d) => d.date), hideTicks: true }]}
          // yAxis={[{ label: "Cost (USD)" }]}
          series={[
            { id: "thisMonth", data: data.map((d) => d.thisMonth), label: "This Month", color: "#66b2b2" },
            { id: "lastMonth", data: data.map((d) => d.lastMonth), label: "Last Month", color: "#ffbfd3" },
          ]}
          height={200}
        />
      </ResponsiveChartContainer>
    </Box>
  );
};

export default arabicaAvgCostMoM;