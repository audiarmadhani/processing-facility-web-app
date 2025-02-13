"use client";

import React, { useEffect, useState } from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import axios from "axios";
import { Box, CircularProgress } from "@mui/material";

const colorCategories = {
  Set3: [
    "#003f5c",
    "#444e86",
    "#955196",
    "#dd5182",
    "#ff6e54",
    "#ffa600",
  ],
};

const RobustaCategoryChart = ({ timeframe = "this_month" }) => {
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Transform API response into chart data
  const processChartData = (data) => {
    if (!Array.isArray(data)) {
      console.error("Expected an array but received:", data);
      return { dataset: [], categories: [] };
    }

    const groupedData = {};
    const categoriesSet = new Set();

    data.forEach(({ storedDate, category, weight }) => {
      // Validate each item before processing
      if (!storedDate || !category || typeof weight !== "number") {
        console.error("Invalid data item:", { storedDate, category, weight });
        return; // Skip invalid items
      }

      if (!groupedData[storedDate]) {
        groupedData[storedDate] = {};
      }
      groupedData[storedDate][category] = (groupedData[storedDate][category] || 0) + weight;
      categoriesSet.add(category);
    });

    const dataset = Object.keys(groupedData).map((storedDate) => ({
      storedDate,
      ...groupedData[storedDate],
    }));

    return { dataset, categories: Array.from(categoriesSet) };
  };

  // Fetch data from the API whenever the timeframe changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `https://processing-facility-backend.onrender.com/api/dashboard-metrics?timeframe=${timeframe}`
        );
        console.log(response.data); // Log the full response for debugging

        // Check that the expected data exists before processing
        if (Array.isArray(response.data.robustaTotalWeightbyDate)) {
          const transformedData = processChartData(response.data.robustaTotalWeightbyDate);
          setData(transformedData.dataset);
          setCategories(transformedData.categories);
        } else {
          console.error("Invalid data format:", response.data.robustaTotalWeightbyDate);
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

  // Set the chart height based on the available data
  const chartHeight = data && data.length > 0 ? 500 : "auto";
  const colorScheme = "Set3";

  return (
    <Box sx={{ height: chartHeight }}>
      <BarChart
        dataset={data}
        xAxis={[
          {
            scaleType: "band",
            dataKey: "storedDate",
            label: "Stored Date",
            disableTicks: true,
          },
        ]}
        series={categories.map((category) => ({
          dataKey: category,
          label: category,
          stack: "stack1", // Enables stacking for the series
          colors: "cheerfulFiesta", // You can change this or remove if not needed
        }))}
        yAxis={[{ label: "Weight (kg)" }]}
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
  );
};

export default RobustaCategoryChart;
