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

const ArabicaAchievementChart = ({ timeframe = "this_month" }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from the API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `https://processing-facility-backend.onrender.com/api/dashboard-metrics?timeframe=${timeframe}`
        );
        console.log("API Response:", response.data); // Log the full response for debugging

        if (Array.isArray(response.data.arabicaAchievement)) {
          // Transform the data for the chart
          const chartData = response.data.arabicaAchievement.map((item, index) => ({
            id: item.referenceNumber,
            referenceNumber: item.referenceNumber,
            targetPercentage: item.targetPercentage,
            color: colorPalette[index % colorPalette.length], // Assign a color from the palette
          }));

          setData(chartData);
          console.log("Received arabicaAchievement data:", chartData);

        } else {
          console.error("Invalid data format:", response.data.arabicaAchievement);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
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
  
    if (error) { // Display error message
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

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Arabica Production Target Achievement
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

export default ArabicaAchievementChart;
