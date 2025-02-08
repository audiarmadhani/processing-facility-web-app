"use client";

import React, { useEffect, useState } from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import axios from "axios";
import { Box, CircularProgress } from "@mui/material";

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

const RobustaFarmersContributionChart = ({ timeframe = "this_month" }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Process the API response into chart-friendly format.
  // In this case, we sort the array by totalWeight in descending order.
  const processChartData = (data) => {
    if (!Array.isArray(data)) {
      console.error("Expected an array but received:", data);
      return [];
    }
    return data.sort((a, b) => b.totalWeight - a.totalWeight);
  };

  // Fetch data from the API whenever the timeframe changes.
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `https://processing-facility-backend.onrender.com/api/dashboard-metrics?timeframe=${timeframe}`
        );
        console.log(response.data); // Log the full response for debugging

        if (Array.isArray(response.data.robustaFarmersContribution)) {
          const transformedData = processChartData(response.data.robustaFarmersContribution);
          setData(transformedData);
        } else {
          console.error("Invalid data format:", response.data.robustaFarmersContribution);
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

  // Set the chart height based on available data.
  const chartHeight = data && data.length > 0 ? 500 : "auto";
  const colorScheme = "Set3";

  return (
    <Box sx={{ height: chartHeight }}>
      <BarChart
        dataset={data}
        // For a horizontal bar chart, the x-axis represents the numeric weight.
        xAxis={[
          {
            scaleType: "linear",
            dataKey: "totalWeight",
            label: "Weight (kg)",
          },
        ]}
        // The y-axis displays the farmer names (categorical).
        yAxis={[
          {
            scaleType: "band",
            dataKey: "farmerName",
            label: "Farmer",
            disableTicks: true,
          },
        ]}
        // Define a single series for totalWeight.
        series={[
          {
            dataKey: "totalWeight",
            label: "Total Weight",
            colors: "cheerfulFiesta", // You can adjust or remove this as needed.
          },
        ]}
        height={500}
        sx={{
          ".MuiChart-axisLeft .MuiChart-axisLabel": {
            transform: "translate(-50px, 0)",
          },
        }}
        colors={colorCategories[colorScheme]}
        borderRadius={10}
        slotProps={{ legend: { hidden: true } }}
      />
    </Box>
  );
};

export default RobustaFarmersContributionChart;
