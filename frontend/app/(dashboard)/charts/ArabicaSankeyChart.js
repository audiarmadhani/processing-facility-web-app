"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  CircularProgress,
  Typography,
  Tooltip,
  useTheme,
} from "@mui/material";
import { Chart, registerables } from "chart.js";
import { SankeyController, Flow } from "chartjs-chart-sankey";

// Register Chart.js and Sankey plugin
Chart.register(...registerables, SankeyController, Flow);

const ArabicaSankeyChart = ({ timeframe = "this_month" }) => {
  const chartRef = useRef(null);
  const [sankeyData, setSankeyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme(); // Access MUI theme for dark mode compatibility

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `https://processing-facility-backend.onrender.com/api/dashboard-metrics?timeframe=${timeframe}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!data || !data.arabicaSankey || !Array.isArray(data.arabicaSankey)) {
          throw new Error("Invalid data format received from API.");
        }
        setSankeyData(data.arabicaSankey);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Error fetching data from API.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeframe]);

  // Draw Sankey diagram when data is available
  useEffect(() => {
    if (sankeyData && chartRef.current) {
      drawChart(sankeyData);
    }
  }, [sankeyData]);

  // Helper function to draw the Sankey diagram using Chart.js
  const drawChart = (data) => {
    if (!chartRef.current || !data) return;

    // Destroy previous chart instance if it exists
    if (chartRef.current.chartInstance) {
      chartRef.current.chartInstance.destroy();
    }

    // Prepare data for Chart.js Sankey
    const nodes = Array.from(
      new Set(data.flatMap((d) => [d.from_node, d.to_node]))
    ).map((name, index) => ({ id: name, label: name }));

    const links = data.map((d) => ({
      source: d.from_node,
      target: d.to_node,
      flow: d.value,
    }));

    // Create the Sankey chart
    const ctx = chartRef.current.getContext("2d");
    const chartInstance = new Chart(ctx, {
      type: "sankey",
      data: {
        datasets: [
          {
            label: "Arabica Coffee Processing Flow",
            data: links,
            colorFrom: theme.palette.mode === "dark" ? "#ffffff" : "#007bff",
            colorTo: theme.palette.mode === "dark" ? "#ffffff" : "#007bff",
            colorMode: "gradient",
            size: "dynamic", // Adjust link thickness dynamically
          },
        ],
      },
      options: {
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const { source, target, flow } = context.raw;
                return `Source: ${source}\nTarget: ${target}\nValue: ${flow}`;
              },
            },
          },
        },
        sankey: {
          node: {
            borderWidth: 1,
            borderColor: theme.palette.mode === "dark" ? "#ffffff" : "#007bff",
            color: theme.palette.mode === "dark" ? "#ffffff" : "#007bff",
            hoverColor: theme.palette.mode === "dark" ? "#ffffff" : "#007bff",
          },
          link: {
            colorMode: "gradient",
            colorFrom: theme.palette.mode === "dark" ? "#ffffff" : "#007bff",
            colorTo: theme.palette.mode === "dark" ? "#ffffff" : "#007bff",
          },
        },
      },
    });

    // Store the chart instance for cleanup
    chartRef.current.chartInstance = chartInstance;
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: "center", padding: 2, color: "red" }}>
        <Typography variant="body1">{error}</Typography>
      </Box>
    );
  }

  if (!sankeyData || sankeyData.length === 0) {
    return (
      <Box sx={{ textAlign: "center", padding: 2 }}>
        <Typography variant="body1">No data available</Typography>
      </Box>
    );
  }

  return <canvas ref={chartRef} />;
};

export default ArabicaSankeyChart;