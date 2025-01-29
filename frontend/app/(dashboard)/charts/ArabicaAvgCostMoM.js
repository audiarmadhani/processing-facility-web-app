"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Box, Typography, CircularProgress } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  LineChart,
  LineSeries,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveChartContainer,
} from "@mui/x-charts";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const ArabicaAvgCostMoM = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  const CustomTooltip = ({ tooltipData }) => {
    if (!tooltipData || !tooltipData.data) return null;

    const { series, axisValues } = tooltipData;
    const isDarkMode = theme.palette.mode === "dark";
    const labelMapping = {
      thisMonth: "This Month",
      lastMonth: "Last Month",
    };

    return (
      <div
        style={{
          backgroundColor: isDarkMode ? "#333" : "#fff",
          color: isDarkMode ? "#fff" : "#000",
          borderRadius: "4px",
          padding: "8px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
          fontFamily: "Roboto, sans-serif",
          fontSize: "12px",
        }}
      >
        <p style={{ margin: 0, fontWeight: "bold" }}>{axisValues[0]}</p>
        <hr style={{ border: 0, borderTop: "1px solid #ccc", margin: "5px 0" }} />
        {series.map((item, index) => (
          <p key={index} style={{ margin: "5px 0", display: "flex", alignItems: "center" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                backgroundColor: item.color,
                borderRadius: "50%",
                display: "inline-block",
                marginRight: "8px",
              }}
            ></span>
            {labelMapping[item.id]}: {item.data}
          </p>
        ))}
      </div>
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `https://processing-facility-backend.onrender.com/api/dashboard-metrics`
        );
        const formattedData = response.data.arabicaAvgCostMoM.map((item) => ({
          date: item.Date,
          thisMonth: item.RunningAverageCostThisMonth,
          lastMonth: item.RunningAverageCostLastMonth,
        }));
        setData(formattedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 500 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box sx={{ textAlign: "center", padding: 2 }}>
        <Typography variant="h6">No data available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", height: 200 }}>
      <ResponsiveChartContainer>
        <LineChart
          xAxis={[{ scaleType: "point", data: data.map((d) => d.date), hideTicks: true }]}
          yAxis={[{ label: "Cost" }]}
          series={[
            { id: "thisMonth", data: data.map((d) => d.thisMonth), label: "This Month", color: "#66b2b2" },
            { id: "lastMonth", data: data.map((d) => d.lastMonth), label: "Last Month", color: "#ffbfd3" },
          ]}
          height={200}
          slotProps={{
            tooltip: { content: CustomTooltip },
          }}
        />
      </ResponsiveChartContainer>
    </Box>
  );
};

export default ArabicaAvgCostMoM;