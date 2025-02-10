"use client";

import React, { useEffect, useState } from "react";
import { BarChart } from "@mui/x-charts";
import axios from "axios";
import { Box, CircularProgress, Typography } from "@mui/material";

const colorCategories = {
  Set3: [
    "#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462",
    "#b3de69", "#fccde5", "#d9d9d9", "#bc80bd", "#ccebc5", "#ffed6f",
  ],
};

const ArabicaFarmersContributionChart = ({ timeframe = "this_month" }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      setError(null);

      try {
        const response = await axios.get(
          `https://processing-facility-backend.onrender.com/api/dashboard-metrics?timeframe=${timeframe}`
        );

        console.log("API Response:", response.data);

        if (response.data && Array.isArray(response.data.arabicaFarmersContribution)) {
          const transformedData = processChartData(response.data.arabicaFarmersContribution);
          console.log("Transformed Data:", transformedData);
          setData(transformedData);
        } else {
          console.error("Invalid data format:", response.data);
          setData([]);
          setError("Invalid data format received from the server.");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setData([]);
        setError("Error fetching data from the server.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeframe]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 500 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ color: "red", textAlign: "center", mt: 2 }}>
        <Typography variant="body1">{error}</Typography>
      </Box>
    );
  }

  const chartHeight = data && data.length > 0 ? 500 : "auto";
  const ripenessKeys = ["unripepercentage", "semiripepercentage", "ripepercentage", "overripepercentage", "unknownripeness"];

  return (
    <Box sx={{ height: chartHeight }}>
      {data.length === 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 500 }}>
          <Typography variant="body1">No data available for the selected timeframe.</Typography>
        </Box>
      ) : (
        <BarChart
          dataset={data}
          xAxis={[{ scaleType: "band", dataKey: "farmerName", label: "Farmer", disableTicks: true }]}
          yAxis={[{ label: "Weight (kg)" }]}
          series={ripenessKeys.map((key, index) => ({
            dataKey: key,
            label: key,
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
          slotProps={{ legend: { hidden: true } }}
          tooltip={{
            trigger: "item", // Or 'axis'
            formatter: (value, item) => {
              const ripenessLabel = item.label;
              const totalWeight = data.find(d => d.farmerName === item.farmerName)?.totalWeight;
              return `${ripenessLabel}: ${value.toFixed(2)} kg (Total: ${totalWeight?.toFixed(2)} kg)`;
            },
          }}
        />
      )}
    </Box>
  );
};

export default ArabicaFarmersContributionChart;