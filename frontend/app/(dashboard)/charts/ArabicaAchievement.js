"use client";

import React, { useEffect, useState } from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import axios from "axios";
import { Box, CircularProgress, Typography } from "@mui/material";
import dayjs from 'dayjs';

const colorPalette = [
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

const ArabicaAchievementChart = ({ timeframe }) => {
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

        // Access the correct part of the response
        const apiData = response.data.arabicaAchievement;

        if (Array.isArray(apiData)) {
          const transformedData = {};
          const allDates = new Set();
          let colorIndex = 0;

          apiData.forEach(item => {
            // Store dates in a consistent format (ISO string)
            const formattedDate = dayjs(item.Date).toISOString();
            allDates.add(formattedDate);

            if (!transformedData[item.referenceNumber]) {
              transformedData[item.referenceNumber] = {
                data: [],
                color: colorPalette[colorIndex % colorPalette.length]
              };
              colorIndex++;
            }
            // Push data to the correct reference number, handling nulls safely
            transformedData[item.referenceNumber].data.push({
              date: formattedDate,  //  Store the formatted date *with* the data point
              value: item.targetPercentage === null ? 0 : item.targetPercentage
            });

          });

          // Sort dates *after* processing, and store them as Day.js objects initially,
          // then format them *only* in the valueFormatter.
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

    // This is correct *now* that `data` is an array of objects.
  const series = Object.keys(chartData).map((refNumber) => ({
      label: refNumber,
      data: chartData[refNumber].data.map(item => item.value), // Extract 'value' for the chart data
      color: chartData[refNumber].color,
      // No `dataKey` when you have a `data` array.
  }));
    
  return (
    <Box>
      <Box sx={{ height: 500 }}>
        <LineChart
          xAxis={[{
            scaleType: 'point',
            data: dates,
            valueFormatter: (dateStr) => dayjs(dateStr).format('YYYY-MM-DD'), // Format *here*
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
            tooltip: {
                trigger: 'axis', // Show tooltip for all series on hover
                valueFormatter: (value) => `${value}%`
            }
          }}
          
        />
      </Box>
    </Box>
  );
};

export default ArabicaAchievementChart;

