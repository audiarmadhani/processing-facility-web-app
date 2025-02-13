"use client";

import React, { useEffect, useState } from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import axios from "axios";
import { Box, CircularProgress, Typography } from "@mui/material";

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

const RobustaAchievementChart = ({ timeframe = "this_month" }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Add error state

  // Fetch data from the API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null); // Reset error state
      try {
        const response = await axios.get(
          `https://processing-facility-backend.onrender.com/api/dashboard-metrics?timeframe=${timeframe}`
        );
        console.log("API Response:", response.data); // Log the full response for debugging

        // Check if robustaAchievement exists and is an array
        if (Array.isArray(response.data.robustaAchievement)) {
          // Transform the data for the chart
          const chartData = response.data.robustaAchievement.map((item, index) => ({
            id: item.referenceNumber,
            referenceNumber: item.referenceNumber,
            targetPercentage: item.targetPercentage,
            color: colorPalette[index % colorPalette.length], // Assign a color from the palette
          }));

          setData(chartData);
          console.log("Transformed chart data:", chartData);
        } else {
          console.error("Invalid data format:", response.data.robustaAchievement);
          setError("Invalid data format received from the API.");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeframe]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    // Display error message
    return (
      <Box sx={{ textAlign: "center", padding: 2 }}>
        <Typography variant="body1" color="error">
          {error}
        </Typography>
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

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Robusta Production Target Achievement
      </Typography>
      <Box sx={{ height: 500 }}>
        <BarChart
          dataset={data}
          layout="horizontal" // Set the chart to horizontal
          xAxis={[
            {
              scaleType: "band",
              dataKey: "referenceNumber",
              label: "Reference Number",
            },
          ]}
          yAxis={[
            {
              min: 0,
              max: 100, // Scale the y-axis to 100%
              label: "Target Percentage (%)",
              scaleType: "band",
            },
          ]}
          series={[
            {
              dataKey: "targetPercentage",
              label: "Target Achievement",
              valueFormatter: (value) => `${value}%`,
            },
          ]}
          colors={colorPalette} // Apply the color palette
          height={500}
          borderRadius={10}
          slotProps={{
            bar: {
              rx: 4, // Rounded corners for bars
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default RobustaAchievementChart;
