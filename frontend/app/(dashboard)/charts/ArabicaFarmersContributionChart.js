"use client";

import React, { useEffect, useState } from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import axios from "axios";
import { Box, CircularProgress } from "@mui/material";

const colorCategories = {
  Set3: [
    "#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462",
    "#b3de69", "#fccde5", "#d9d9d9", "#bc80bd", "#ccebc5", "#ffed6f",
  ],
};

const ArabicaFarmersContributionChart = ({ timeframe = "this_month" }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const processChartData = (data) => {
    if (!Array.isArray(data)) {
      console.error("Expected an array but received:", data);
      return [];
    }
    return data.sort((a, b) => b.totalWeight - a.totalWeight);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `https://processing-facility-backend.onrender.com/api/dashboard-metrics?timeframe=${timeframe}`
        );

        if (Array.isArray(response.data.arabicaFarmersContribution)) { // Use the correct data key
          const transformedData = processChartData(response.data.arabicaFarmersContribution);
          setData(transformedData);
        } else {
          console.error("Invalid data format:", response.data.arabicaFarmersContribution); // Correct data key
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

  const chartHeight = data && data.length > 0 ? 500 : "auto";
  const colorScheme = "Set3";

  const ripenessKeys = ["unripePercentage", "semiripePercentage", "ripePercentage", "overripePercentage", "unknownRipeness"];

  return (
    <Box sx={{ height: chartHeight }}>
      <BarChart
        dataset={data}
        xAxis={[{ scaleType: "band", dataKey: "farmerName", label: "Farmer", disableTicks: true }]}
        yAxis={[{ label: "Weight (kg)" }]} // Removed dataKey from yAxis
        series={ripenessKeys.map((key, index) => ({
          dataKey: key,
          label: key.replace("Percentage", ""), // Clean up label
          stackId: "1", // Important for stacking
          colors: colorCategories[colorScheme][index % colorCategories[colorScheme].length], // Use color from the array
        }))}
        height={500}
        sx={{
          ".MuiChart-axisLeft .MuiChart-axisLabel": {
            transform: "translate(-50px, 0)",
          },
        }}
        //colors={colorCategories[colorScheme]}  // Color is now handled within the series
        borderRadius={10}
        slotProps={{ legend: { hidden: false } }} // Show the legend
      />
    </Box>
  );
};

export default ArabicaFarmersContributionChart;