"use client";

import React, { useEffect, useState } from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import axios from "axios";
import { Box, Typography, CircularProgress } from "@mui/material";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const colorCategories = {
  Set3: [
    '#8dd3c7',
    '#ffffb3',
    '#bebada',
    '#fb8072',
    '#80b1d3',
    '#fdb462',
    '#b3de69',
    '#fccde5',
    '#d9d9d9',
    '#bc80bd',
    '#ccebc5',
    '#ffed6f',
  ],
};

const ArabicaCategoryChart = () => {
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("https://processing-facility-backend.onrender.com/api/dashboard-metrics");
        console.log(response.data); // Log the entire response
  
        // Validate that the required data is available
        if (Array.isArray(response.data.arabicaTotalWeightbyDate)) {
          const transformedData = processChartData(response.data.arabicaTotalWeightbyDate);
          setData(transformedData.dataset);
          setCategories(transformedData.categories);
        } else {
          console.error("Invalid data format:", response.data.arabicaTotalWeightbyDate);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);

  // Transform API response into chart data
  const processChartData = (data) => {
    if (!Array.isArray(data)) {
      console.error("Expected an array but received:", data);
      return { dataset: [], categories: [] };
    }
  
    const groupedData = {};
    const categoriesSet = new Set();
  
    data.forEach(({ storedDate, category, weight }) => {
      // Check if storedDate, category, and weight exist
      if (!storedDate || !category || typeof weight !== 'number') {
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

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 500 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Conditionally set height based on whether data is available
  const chartHeight = data && data.length > 0 ? 500 : 'auto';

  const colorScheme = 'Set3';

  return (
    <Box sx={{ height: chartHeight }}>
      <BarChart
        dataset={data}
        xAxis={[{ scaleType: "band", dataKey: "storedDate", label: "Stored Date", disableTicks : true }]}
        series={categories.map((category) => ({
          dataKey: category,
          label: category,
          stack: "stack1", // Adding stack property to enable stacking
          colors:"cheerfulFiesta",
        }))}
        yAxis={[{ label: "Weight (kg)" }]}
        height={500}
        sx={{
          ".MuiChart-axisLeft .MuiChart-axisLabel": {
            transform: "translate(-50px, 0)",
          },
        }}
        colors={colorCategories[colorScheme]}
        borderRadius={10}
        slotProps={{ legend: { hidden : true } }}
      />
    </Box>
  );
};

export default ArabicaCategoryChart;