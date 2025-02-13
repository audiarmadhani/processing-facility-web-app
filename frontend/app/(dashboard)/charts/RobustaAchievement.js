"use client";

import React, { useEffect, useState } from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import axios from "axios";
import { Box, CircularProgress, Typography } from "@mui/material";
import dayjs from 'dayjs';

const colorPalette = [  // Define a single array of colors
  "#8dd3c7",
  "#ffffb3",
  "#bebada",
  "#fb8072",
  "#80b1d3",
  "#fdb462",
  "#b3de69",
  "#fccde5",
  "#d9d9d9",
  "#bc80bd",
  "#ccebc5",
  "#ffed6f",
];

const RobustaAchievementChart = ({ timeframe }) => {
  const [chartData, setChartData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dates, setDates] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(
          `https://processing-facility-backend.onrender.com/api/dashboard-metrics?timeframe=${timeframe}`
        );

        const apiData = response.data.robustaAchievement;

        if (Array.isArray(apiData)) {
          const transformedData = {};
          const allDates = new Set();
          let colorIndex = 0; // Track the current color index

          apiData.forEach(item => {
            allDates.add(item.Date);
            if (!transformedData[item.referenceNumber]) {
              transformedData[item.referenceNumber] = {
                data: [],
                color: colorPalette[colorIndex % colorPalette.length] // Apply color
              };
              colorIndex++; // Increment on each new referenceNumber
            }
            transformedData[item.referenceNumber].data.push(item.targetPercentage === null ? 0 : item.targetPercentage);
          });
          setDates(Array.from(allDates).sort());
          setChartData(transformedData);

        } else {
          console.error("Invalid data format:", apiData);
          setError("Invalid data format received from the API.");
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.response?.data?.message || error.message || "Failed to fetch data. Please check network.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeframe]);


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 500 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', padding: 2 }}>
        <Typography variant="body1" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  if (!chartData || Object.keys(chartData).length === 0) {
    return (
      <Box sx={{ textAlign: "center", padding: 2 }}>
        <Typography variant="body1">No data available.</Typography>
      </Box>
    );
  }

    const series = Object.keys(chartData).map((refNumber) => ({
    dataKey: refNumber,
    label: refNumber,
    data: chartData[refNumber].data,
    color: chartData[refNumber].color, // Use the assigned color
  }));

  return (
    <Box>
      <Box sx={{ height: 500 }}>
        <LineChart
          xAxis={[{
            scaleType: 'point',
            data: dates,
            valueFormatter: (date) => dayjs(date).format('YYYY-MM-DD'),
            label: "Date",
          }]}
          series={series}
          yAxis={[
            {
              min: 0,
              max: 100,
              label: 'Target Percentage (%)',
            },
          ]}
          height={500}
          slotProps={{
            legend: { hidden: false },
              tooltip: { valueFormatter: (value) => `${value}%` }
          }}
          tooltip={{ trigger: 'axis' }}
        />
      </Box>
    </Box>
  );
};

export default RobustaAchievementChart;

