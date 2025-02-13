"use client";

import React, { useEffect, useState } from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import axios from "axios";
import { Box, CircularProgress, Typography } from "@mui/material";

const colorCategories = {
  Set3: [
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
  ],
};

const ArabicaAchievementChart = ({ timeframe = "this_month" }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `https://processing-facility-backend.onrender.com/api/dashboard-metrics?timeframe=${timeframe}`
        );

        // Access 'arabicaAchievement' directly
        const arabicaAchievementData = response.data.arabicaAchievement;

        if (Array.isArray(arabicaAchievementData)) {
          const chartData = arabicaAchievementData.map((item, index) => ({
            id: item.referenceNumber, // Use referenceNumber as a unique ID
            referenceNumber: item.referenceNumber,
            targetPercentage: item.targetPercentage,
          }));
          setData(chartData);
        } else {
          console.error("Invalid data format:", arabicaAchievementData);
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

  if (error) {
    return (
      <Box sx={{ textAlign: "center", padding: 2 }}>
        <Typography variant="body1" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box sx={{ textAlign: "center", padding: 2 }}>
        <Typography variant="body1">No data available.</Typography>
      </Box>
    );
  }

  const colorScheme = 'Set3';

  return (
    <Box>
      <Box sx={{ height: 500 }}>
        <BarChart
          dataset={data}
          xAxis={[
            {
              scaleType: "band",
              dataKey: "referenceNumber",
              label: "Reference Number",
              disableTicks: true,
            },
          ]}
          series={[
            {
              dataKey: 'targetPercentage',
              label: 'Target Achievement',
              valueFormatter: (value) => `${value}%`,
              colors: "cheerfulFiesta", // You can change this or remove if not needed
            },
          ]}
          yAxis={[
            { 
              min: 0, max: 100, 
              label: "Target Percentage (%)", 
              disableTicks: true 
            }
          ]}
          height={500}
          sx={{
            ".MuiChart-axisLeft .MuiChart-axisLabel": {
              transform: "translate(-100px, 0)",
            },
          }}
          colors={colorCategories[colorScheme]}
          borderRadius={10}
          slotProps={{ legend: { hidden: true } }}
        />
      </Box>
    </Box>
  );
};

export default ArabicaAchievementChart;
