"use client";

import React, { useEffect, useState, useRef } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import axios from 'axios';
import { Box, CircularProgress, Typography } from '@mui/material';

const ArabicaAchievementChart = ({ timeframe = "this_month" }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const chartRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  const colorPalette = [
    "#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462",
    "#b3de69", "#fccde5", "#d9d9d9", "#bc80bd", "#ccebc5", "#ffed6f",
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`https://processing-facility-backend.onrender.com/api/dashboard-metrics?timeframe=${timeframe}`);
        setData(response.data.arabicaAchievement || []); // Handle potential null or undefined
      } catch (err) {
        console.error('Error fetching data:', err);
        setError("Error fetching data from API.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeframe]);

  if (loading) {
    return <LoadingIndicator height={500} />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (data.length === 0) {
    return <NoDataMessage />;
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

  const handleMouseMove = (event) => {
    if (chartRef.current) {
      const chartRect = chartRef.current.getBoundingClientRect();
      const mouseX = event.clientX - chartRect.left;
      const mouseY = event.clientY - chartRect.top;

      let closestPoint = null;
      let minDistance = Infinity;

      Object.keys(groupedData).forEach(refNum => {
        groupedData[refNum].forEach((item, index) => {
          const x = (chartRect.width / data.length) * index; // Approximate x position
          const y = chartRect.top + (chartRect.height - (item.cumulative_achievement_percentage / 100) * chartRect.height);

          const distance = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);
          if (distance < minDistance) {
            minDistance = distance;
            closestPoint = { ...item, x: chartRect.left + x, y: y };
          }
        });
      });

      setTooltip(closestPoint);
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }} onMouseMove={handleMouseMove}>
      <LineChart
        ref={chartRef}
        xAxis={[{ scaleType: 'point', data: data.map(item => item.date) }]}
        series={chartSeries}
        height={500}
        yAxis={{ min: 0, max: 100, label: "Achievement (%)" }}
        margin={{ left: 60, right: 20, top: 20, bottom: 40 }}
        slotProps={{ legend: { hidden: true } }}
      />
      {tooltip && (
        <Tooltip
          x={tooltip.x}
          y={tooltip.y}
          date={tooltip.date}
          refNum={tooltip.referenceNumber}
          percentage={tooltip.cumulative_achievement_percentage}
        />
      )}
    </Box>
  );
};

const LoadingIndicator = ({ height }) => (
  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height }}>
    <CircularProgress />
  </Box>
);

const ErrorMessage = ({ message }) => (
  <Box sx={{ textAlign: "center", padding: 2, color: "red" }}>
    <Typography variant="body1">{message}</Typography>
  </Box>
);

const NoDataMessage = () => (
  <Box sx={{ textAlign: "center", padding: 2 }}>
    <Typography variant="body1">No data available</Typography>
  </Box>
);

const Tooltip = ({ x, y, date, refNum, percentage }) => (
  <div
    style={{
      position: 'absolute',
      left: x + 10,
      top: y - 30, // Position above the point
      backgroundColor: 'rgba(255, 255, 255, 0.9)', // Semi-transparent white
      border: '1px solid #ccc',
      padding: '5px',
      borderRadius: '5px',
      pointerEvents: 'none' // Prevent tooltip from blocking mouse events
    }}
  >
    <Typography variant="body2">{date}</Typography>
    <Typography variant="body2">Ref: {refNum}</Typography>
    <Typography variant="body2">Ach: {percentage.toFixed(2)}%</Typography>
  </div>
);


export default ArabicaAchievementChart;