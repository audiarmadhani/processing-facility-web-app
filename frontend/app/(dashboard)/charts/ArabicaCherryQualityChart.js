"use client";

import React, { useEffect, useState } from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import axios from "axios";
import { Box, CircularProgress } from "@mui/material";

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

const ArabicaCherryQualityChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("https://processing-facility-backend.onrender.com/api/dashboard-metrics");
  
        const processedData = processData(response.data.arabicaCherryQualitybyDate);
        setData(processedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Transform API response into chart data
  const processData = (apiData) => {
    if (!Array.isArray(apiData)) {
      console.error("Invalid data format:", apiData);
      return [];
    }

    return apiData.map((item) => ({
      qcDate: item.qcDate,
      unripe: parseFloat(item.unripePercentage),
      semiripe: parseFloat(item.semiripePercentage),
      ripe: parseFloat(item.ripePercentage),
      overripe: parseFloat(item.overripePercentage),
    }));
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
        xAxis={[{ scaleType: "band", dataKey: "qcDate", label: "QC Date", disableTicks : true }]}
        series={[
            { dataKey: "unripe", label: "Unripe" },
            { dataKey: "semiripe", label: "Semi-Ripe" },
            { dataKey: "ripe", label: "Ripe" },
            { dataKey: "overripe", label: "Overripe" },
          ]}
        yAxis={[{ label: "Percentage (%)" }]}
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

export default ArabicaCherryQualityChart;