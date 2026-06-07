"use client";

import React, { useEffect, useState } from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import axios from "axios";
import { Box, CircularProgress, Typography } from "@mui/material";

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

const RobustaCherryQualityChart = ({ timeframe = "this_month", height = 500 }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`https://processing-facility-backend.onrender.com/api/dashboard-metrics?timeframe=${timeframe}`);
  
        const processedData = processData(response.data.robustaCherryQualitybyDate);
        setData(processedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeframe]);

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
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height }}>
        <CircularProgress />
      </Box>
    );
  }

  if (data.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height }}>
        <Typography variant="body1" color="text.secondary">
          No cherry quality data for the selected timeframe.
        </Typography>
      </Box>
    );
  }

  const colorScheme = 'Set3';

  return (
    <Box sx={{ height }}>
      <BarChart
        dataset={data}
        xAxis={[{ scaleType: "band", dataKey: "qcDate", label: "QC Date", disableTicks : true }]}
        series={[
            { dataKey: "unripe", label: "Unripe", stack: "stack1" },
            { dataKey: "semiripe", label: "Semi-Ripe", stack: "stack1" },
            { dataKey: "ripe", label: "Ripe", stack: "stack1" },
            { dataKey: "overripe", label: "Overripe", stack: "stack1" },
          ]}
        yAxis={[{ label: "Percentage (%)" }]}
        height={height}
        sx={{
          ".MuiChart-axisLeft .MuiChart-axisLabel": {
            transform: "translate(-100px, 0)",
          },
        }}
        colors={colorCategories[colorScheme]}
        borderRadius={10}
        slotProps={{ legend: { hidden : true } }}
      />
    </Box>
  );
};

export default RobustaCherryQualityChart;