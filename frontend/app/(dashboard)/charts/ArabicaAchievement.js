"use client";

import React, { useEffect, useState } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import axios from 'axios';
import { Box, CircularProgress, Typography } from '@mui/material';

const ArabicaAchievementChart = ({ timeframe = "this_month" }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const colorPalette = [
    "#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462",
    "#b3de69", "#fccde5", "#d9d9d9", "#bc80bd", "#ccebc5", "#ffed6f",
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`https://processing-facility-backend.onrender.com/api/dashboard-metrics?timeframe=${timeframe}`);

        if (Array.isArray(response.data.arabicaAchievement)) {
          setData(response.data.arabicaAchievement);
        } else {
          console.error("Invalid data format:", response.data.arabicaAchievement);
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
  }, [timeframe]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 80 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
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

  // Group data by referenceNumber
  const groupedData = {};
  data.forEach(item => {
    if (!groupedData[item.referenceNumber]) {
      groupedData[item.referenceNumber] = [];
    }
    groupedData[item.referenceNumber].push(item);
  });

  const chartSeries = Object.keys(groupedData).map((referenceNumber, index) => ({
    data: groupedData[referenceNumber].map(item => item.cumulative_achievement_percentage),
    label: referenceNumber,
    showMark: false,
    curve: "monotoneX",
    color: colorPalette[index % colorPalette.length], // Cycle through colors
    strokeWidth: 2,
  }));

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <LineChart
        xAxis={[{ scaleType: 'point', data: data.map(item => item.date) }]}
        series={chartSeries}
        height={300} // Adjust height as needed
        leftAxis={{
          min: 0,
          max: 100, // Set y-axis range to 0-100%
          label: "Achievement (%)",
        }}
        margin={{ left: 60, right: 20, top: 20, bottom: 40 }} // Adjust margins
        slotProps={{
          legend: {
            // Customize the legend
            position: { vertical: 'bottom', horizontal: 'center' }, // Place at the bottom
            itemMarkWidth: 10,
            itemMarkHeight: 10,
          },
        }}
      />
    </Box>
  );
};

export default ArabicaAchievementChart;