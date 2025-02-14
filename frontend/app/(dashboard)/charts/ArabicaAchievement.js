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
        const apiData = response.data.arabicaAchievement || [];

        // Format date and group data
        const formattedData = apiData.map(item => ({
          ...item,
          date: new Date(item.date), // Convert date string to Date object
        }));
        setData(formattedData);

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
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 500 }}>
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


  const groupedData = {};
  data.forEach(item => {
    groupedData[item.referenceNumber] = [...(groupedData[item.referenceNumber] || []), item];
  });

  const chartSeries = Object.keys(groupedData).map((refNum, index) => ({
    data: groupedData[refNum].map(item => item.cumulative_achievement_percentage),
    label: refNum,
    showMark: false,
    curve: "monotoneX",
    color: colorPalette[index % colorPalette.length],
    strokeWidth: 2,
  }));

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <LineChart
        xAxis={[{ 
          scaleType: 'time', // Use time scale for Date objects
          data: data.map(item => item.date),
          format: 'mmm-dd', // Format the date on the x-axis
        }]}
        series={chartSeries}
        height={500}
        yAxis={{ min: 0, max: 100, label: "Achievement (%)" }}
        margin={{ left: 60 }}
        slotProps={{ legend: { hidden: true } }}
      />
    </Box>
  );
};


export default ArabicaAchievementChart;