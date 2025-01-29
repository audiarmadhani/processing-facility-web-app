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
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 80 }}>
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
    <Box sx={{ width: '100%', height: '100%' }}>
      <svg width="0" height="0">
        <defs>
          <linearGradient id="thisMonthGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#66b2b2" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#66b2b2" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lastMonthGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ffbfd3" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffbfd3" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <LineChart
        xAxis={[{scaleType: 'point', data: data.map(item => item.date) }]}
        series={[
          {
            data: data.map((item) => item.thisMonthCost),
            color: "#66b2b2",
            showMark: false,
            curve: "monotoneX",
            area: true, // Enables the gradient fill
            fill: "url(#thisMonthGradient)", // Apply the gradient
          },
          {
            data: data.map((item) => item.lastMonthCost),
            color: "#ffbfd3",
            showMark: false,
            curve: "monotoneX",
            area: true,
            fill: "url(#lastMonthGradient)",
          },
        ]}
        // width={300}
        height={70}
        slotProps={{
          legend: { hidden: true }, // Hide legend
        }}
        leftAxis={null}
        bottomAxis={null}
        margin={{ left: 0, right: 0, top: 10, bottom: 0 }} // Adjust left margin to shift left
      />
    </Box>
  );
};

export default ArabicaAvgCostChart;