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

    return data.map(farmer => {
      const { totalWeight, unripePercentage, semiripePercentage, ripePercentage, overripePercentage, unknownRipeness } = farmer;

      return {
        farmerName: farmer.farmerName,
        totalWeight,

        unripeWeight: (unripePercentage / 100) * totalWeight || 0, // Handle potential NaN values
        semiripeWeight: (semiripePercentage / 100) * totalWeight || 0,
        ripeWeight: (ripePercentage / 100) * totalWeight || 0,
        overripeWeight: (overripePercentage / 100) * totalWeight || 0,
        unknownWeight: (unknownRipeness / 100) * totalWeight || 0,
      };
    }).sort((a, b) => b.totalWeight - a.totalWeight);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `https://processing-facility-backend.onrender.com/api/dashboard-metrics?timeframe=${timeframe}`
        );

        if (response.data && Array.isArray(response.data.arabicaRipenessByFarmer)) {
          const transformedData = processChartData(response.data.arabicaRipenessByFarmer);
          setData(transformedData);
        } else {
          console.error("Invalid data format:", response.data); // Log the whole response for debugging
          setData([]); // Set data to empty array to avoid rendering issues
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setData([]); // Set data to empty array in case of error
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

  const ripenessKeys = ["unripeWeight", "semiripeWeight", "ripeWeight", "overripeWeight", "unknownWeight"];

  return (
    <Box sx={{ height: chartHeight }}>
      <BarChart
        dataset={data}
        xAxis={[{ scaleType: "band", dataKey: "farmerName", label: "Farmer", disableTicks: true }]}
        yAxis={[{ label: "Weight (kg)" }]}
        series={ripenessKeys.map((key, index) => ({
          dataKey: key,
          label: key.replace("Weight", ""),
          stackId: "1",
          color: colorCategories.Set3[index % colorCategories.Set3.length],
        }))}
        height={500}
        sx={{
          ".MuiChart-axisLeft .MuiChart-axisLabel": {
            transform: "translate(-50px, 0)",
          },
        }}
        borderRadius={10}
        slotProps={{ legend: { hidden: true } }} // Hide the legend
      >
        <BarChartTooltip // Add the tooltip
          formatter={(value, item) => {
            const ripenessLabel = item.label; // Get the ripeness label
            const totalWeight = data.find(d => d.farmerName === item.farmerName)?.totalWeight; // Get the total weight for the farmer
            return `${ripenessLabel}: ${value.toFixed(2)} kg (Total: ${totalWeight?.toFixed(2)} kg)`; // Show ripeness weight and total weight
          }}
        />
      </BarChart>
    </Box>
  );
};

export default ArabicaFarmersContributionChart;
