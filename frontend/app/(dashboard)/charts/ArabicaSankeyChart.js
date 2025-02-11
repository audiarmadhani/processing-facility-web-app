"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, CircularProgress, Typography, useTheme } from '@mui/material';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import * as d3 from 'd3';

const ArabicaSankeyChart = ({ timeframe = "this_month", height = "500px" }) => {
  const chartRef = useRef(null);
  const [sankeyData, setSankeyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();

  // Fetch data from the API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`https://processing-facility-backend.onrender.com/api/dashboard-metrics?timeframe=${timeframe}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!data?.arabicaSankey?.length) {
          throw new Error("No valid Sankey data available");
        }
        setSankeyData(data.arabicaSankey);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeframe]);

  // Define the drawChart function using useCallback so that we can call it on container resize.
  const drawChart = useCallback((data) => {
    if (!chartRef.current) return;

    // Clear any existing chart content
    d3.select(chartRef.current).selectAll("*").remove();

    // Get container dimensions
    const containerWidth = chartRef.current.clientWidth;
    const containerHeight = chartRef.current.clientHeight;

    // Define margins and calculate inner dimensions
    const margin = { top: 20, right: 200, bottom: 20, left: 130 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    // Create SVG element with the container's dimensions
    const svg = d3.select(chartRef.current)
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', containerHeight)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Initialize the sankey generator with the computed width and height
    const sankeyGenerator = sankey()
      .nodeWidth(15)
      .nodePadding(10)
      .size([width, height]);

    // Prepare nodes and links using the API keys "from_node" and "to_node"
    const nodes = Array.from(new Set([
      ...data.map(d => d.from_node),
      ...data.map(d => d.to_node)
    ])).map(name => ({ name }));

    const links = data.map(d => ({
      source: nodes.findIndex(n => n.name === d.from_node),
      target: nodes.findIndex(n => n.name === d.to_node),
      value: d.value
    }));

    // Compute the sankey layout
    const { nodes: layoutNodes, links: layoutLinks } = sankeyGenerator({
      nodes: nodes.map(d => ({ ...d })),
      links: links.map(d => ({ ...d }))
    });

    // Define styles based on the theme
    const linkStroke = theme.palette.mode === 'dark' ? "#007bff80" : "#007bff80";
    const nodeFill = theme.palette.mode === 'dark' ? theme.palette.primary.dark : theme.palette.primary.main;
    const textFill = theme.palette.mode === 'dark' ? "#fff" : "#000";

    // Create tooltip (ensure only one exists)
    let tooltip = d3.select("body").select(".tooltip");
    if (tooltip.empty()) {
      tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("text-align", "center")
        .style("background", "rgba(0,0,0,0.8)")
        .style("color", "#fff")
        .style("padding", "4px")
        .style("border-radius", "4px")
        .style("font-size", "12px");
    }

    // Draw links
    svg.append("g")
      .selectAll("path")
      .data(layoutLinks)
      .join("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("stroke-width", d => Math.max(1, d.width || 1))
      .attr("stroke", linkStroke)
      .attr("fill", "none")
      .attr("opacity", 0.5)
      .attr("class", "link")
      .on("mouseover", (event, d) => {
        d3.selectAll(".link").filter(l => l !== d).attr("opacity", 0.3);
        d3.select(event.currentTarget)
          .attr("stroke", "lightblue")
          .attr("opacity", 1);
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip.html(`
          From: ${d.source.name}<br>
          To: ${d.target.name}<br>
          Weight: ${d.value.toFixed(2)}
        `)
          .style("left", (event.pageX) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function (event, d) {
        d3.selectAll(".link").attr("opacity", 1);
        d3.select(this).attr("stroke", linkStroke);
        tooltip.transition().duration(500).style("opacity", 0);
      });

    // Draw nodes
    const nodeGroup = svg.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(layoutNodes)
      .join("g");

    nodeGroup.append("rect")
      .attr("x", d => d.x0)
      .attr("y", d => d.y0)
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0)
      .attr("fill", nodeFill)
      .attr("opacity", 0.8)
      .append("title")
      .text(d => `${d.name}\n${d.value}`);

    // Add node labels rotated vertically.
    nodeGroup.append("text")
      .attr("transform", d => {
        // For nodes on the left side, rotate -90; for nodes on the right, rotate 90.
        if (d.x0 < width / 2) {
          return `rotate(-90, ${d.x0 - 6}, ${(d.y0 + d.y1) / 2})`;
        } else {
          return `rotate(90, ${d.x1 + 6}, ${(d.y0 + d.y1) / 2})`;
        }
      })
      .attr("x", d => d.x0 < width / 2 ? d.x0 - 6 : d.x1 + 6)
      .attr("y", d => (d.y0 + d.y1) / 2)
      .attr("text-anchor", "middle")
      .text(d => d.name)
      .attr("fill", textFill);

  }, [theme]);

  // Resize observer for dynamic resizing
  useEffect(() => {
    if (!chartRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      if (sankeyData) {
        drawChart(sankeyData);
      }
    });
    resizeObserver.observe(chartRef.current);
    return () => {
      resizeObserver.disconnect();
    };
  }, [sankeyData, drawChart]);

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height }}>
        <CircularProgress />
      </Box>
    );
  if (error)
    return (
      <Box sx={{ textAlign: "center", p: 2, color: "red" }}>
        <Typography variant="body1">{error}</Typography>
      </Box>
    );

  return (
    <Box sx={{ p: 2, height, width: '100%' }}>
      <div ref={chartRef} style={{ height: '100%', width: '100%' }} />
    </Box>
  );
};

export default ArabicaSankeyChart;
