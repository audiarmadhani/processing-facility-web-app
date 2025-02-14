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
      setLoading(true); // Set loading to true before fetching
      try {
        const response = await axios.get(`https://processing-facility-backend.onrender.com/api/dashboard-metrics?timeframe=${timeframe}`);
        const apiData = response.data?.arabicaAchievement || []; // Use optional chaining and default to empty array

        const formattedData = apiData.map(item => ({
          ...item,
          date: new Date(item.date),
        }));
        setData(formattedData);
        setError(null); // Clear any previous errors

      } catch (err) {
        console.error('Error fetching data:', err);
        setError("Error fetching data from API.");
      } finally {
        setLoading(false); // Set loading to false regardless of success/failure
      }
    };

    fetchData();
  }, [timeframe]);

  const renderLoading = () => (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 500 }}>
      <CircularProgress />
    </Box>
  );

  const renderError = () => (
    <Box sx={{ textAlign: "center", padding: 2, color: "red" }}>
      <Typography variant="body1">{error}</Typography>
    </Box>
  );

  const renderNoData = () => (
    <Box sx={{ textAlign: "center", padding: 2 }}>
      <Typography variant="body1">No data available</Typography>
    </Box>
  );

  const renderChart = () => {
    const groupedData = {};
    data.forEach(item => {
      const refNum = item.referenceNumber;
      if (!refNum) return; // Skip items without referenceNumber
      groupedData[refNum] = groupedData[refNum] ? [...groupedData[refNum], item] : [item];
    });

    if (Object.keys(groupedData).length === 0) {
      return renderNoData(); // Or a different message
    }

    const chartSeries = Object.keys(groupedData).map((referenceNumber, index) => ({
      data: groupedData[referenceNumber].map(item => item.cumulative_achievement_percentage),
      label: referenceNumber,
      showMark: false,
      curve: "monotoneX",
      color: colorPalette[index % colorPalette.length],
      strokeWidth: 2,
    }));

    return (
      <Box sx={{ width: '100%', height: '100%' }}>
        <LineChart
          xAxis={[{
            scaleType: 'time',
            data: data.map(item => item.date),
            format: 'mmm-dd',
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

  if (loading) {
    return renderLoading();
  }

  if (error) {
    return renderError();
  }

  if (data.length === 0) {
    return renderNoData();
  }

  return renderChart();
};

export default ArabicaAchievementChart;