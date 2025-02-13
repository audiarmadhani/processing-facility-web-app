"use client";

import React from "react";
import { BarChart } from "@mui/x-charts/BarChart";
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

const ArabicaAchievementChart = ({ arabicaAchievement, loading }) => {

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 500,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!arabicaAchievement || arabicaAchievement.length === 0) {
    return (
      <Box sx={{ textAlign: "center", padding: 2 }}>
        <Typography variant="body2" color="textSecondary">
          No data available
        </Typography>
      </Box>
    );
  }

  // Transform the data for the chart
  const chartData = Array.isArray(arabicaAchievement)
    ? arabicaAchievement.map(item => ({
      id: item.referenceNumber,
      referenceNumber: item.referenceNumber,
      targetPercentage: item.targetPercentage,
      color: colorPalette[index % colorPalette.length], // Assign a color from the palette
      }))
    : [{
        id: arabicaAchievement.referenceNumber,
        referenceNumber: arabicaAchievement.referenceNumber,
        targetPercentage: arabicaAchievement.targetPercentage,
        color: colorPalette[index % colorPalette.length], // Assign a color from the palette
      }];

  // Debug: Log the transformed data
  console.log("Transformed chart data:", chartData);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Arabica Production Target Achievement
      </Typography>
      <Box sx={{ height: 500 }}>
        <BarChart
          dataset={chartData}
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
