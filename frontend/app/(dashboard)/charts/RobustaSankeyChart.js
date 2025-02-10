"use client";
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3"; // Import D3 for Sankey diagram functionality
import {
  Box,
  CircularProgress,
  Typography,
  Tooltip,
  useTheme,
} from "@mui/material";

const RobustaSankeyChart = ({ timeframe = "this_month" }) => {
  const chartRef = useRef(null);
  const [sankeyData, setSankeyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme(); // Access MUI theme for dark mode compatibility

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
        if (!data || !data.robustaSankey || !Array.isArray(data.robustaSankey)) {
          throw new Error("Invalid data format received from API.");
        }
        setSankeyData(data.robustaSankey);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Error fetching data from API.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeframe]);

  useEffect(() => {
    if (sankeyData && chartRef.current) {
      drawChart(sankeyData);
    }
  }, [sankeyData]);

  const drawChart = (sankeyData) => {
    if (!chartRef.current || !sankeyData) return;

    // Clear previous SVG content
    d3.select(chartRef.current).selectAll("*").remove();

    const width = 1400;
    const height = 700;
    const margin = { top: 20, right: 20, bottom: 30, left: 100 };

    // Create SVG container
    const svg = d3
      .select(chartRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Configure Sankey layout
    const sankeyLayout = d3
      .sankey()
      .nodeWidth(15)
      .nodePadding(10)
      .extent([
        [0, 0],
        [width, height],
      ]);

    // Prepare nodes and links
    const graph = sankeyLayout({
      nodes: Array.from(
        new Set(sankeyData.flatMap((d) => [d.from_node, d.to_node]))
      ).map((name) => ({ name })),
      links: sankeyData.map((d) => ({
        source: d.from_node,
        target: d.to_node,
        value: d.value,
      })),
    });

    // Draw links with hover effects and tooltips
    const link = svg
      .append("g")
      .attr("class", "links")
      .selectAll("path")
      .data(graph.links)
      .join("path")
      .attr("d", d3.sankeyLinkHorizontal())
      .style("stroke-width", (d) => Math.max(1, d.width))
      .attr("fill", "none")
      .attr("stroke", theme.palette.mode === "dark" ? "#ffffff" : "#007bff") // Dark mode compatibility
      .attr("opacity", 0.5)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("opacity", 1); // Highlight link on hover
        tooltip.html(
          `Source: ${d.source.name}<br>Target: ${d.target.name}<br>Value: ${d.value}`
        );
        tooltip.style("visibility", "visible");
      })
      .on("mousemove", function (event) {
        tooltip
          .style("top", `${event.pageY - 10}px`)
          .style("left", `${event.pageX + 10}px`);
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 0.5); // Reset opacity
        tooltip.style("visibility", "hidden");
      });

    // Add tooltip for links
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", theme.palette.background.paper)
      .style("color", theme.palette.text.primary)
      .style("padding", "5px")
      .style("border-radius", "4px")
      .style("visibility", "hidden");

    // Draw nodes
    const node = svg
      .append("g")
      .attr("class", "nodes")
      .selectAll("rect")
      .data(graph.nodes)
      .join("rect")
      .attr("x", (d) => d.x0)
      .attr("y", (d) => d.y0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("width", (d) => d.x1 - d.x0)
      .attr("fill", theme.palette.mode === "dark" ? "#ffffff" : "#007bff") // Dark mode compatibility
      .attr("opacity", 0.8)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("opacity", 1); // Highlight node on hover
        tooltip.html(`Node: ${d.name}<br>Value: ${d.value}`);
        tooltip.style("visibility", "visible");
      })
      .on("mousemove", function (event) {
        tooltip
          .style("top", `${event.pageY - 10}px`)
          .style("left", `${event.pageX + 10}px`);
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 0.8); // Reset opacity
        tooltip.style("visibility", "hidden");
      });

    // Add node labels
    svg
      .append("g")
      .attr("class", "labels")
      .selectAll("text")
      .data(graph.nodes)
      .join("text")
      .attr("x", (d) => (d.x0 + d.x1) / 2)
      .attr("y", (d) => (d.y0 + d.y1) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .style("fill", theme.palette.text.primary) // Dark mode compatibility
      .text((d) => d.name);

    // Ensure text alignment with dark mode
    svg.selectAll(".labels text").style("font-family", "Roboto, sans-serif");
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

  return <div ref={chartRef} />;
};

export default RobustaSankeyChart;