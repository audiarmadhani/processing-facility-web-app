"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import * as d3 from 'd3'; // Import the core d3 package
import { sankey, sankeyLinkHorizontal } from 'd3-sankey'; // Import d3-sankey functions

const ArabicaSankeyChart = ({ timeframe = "this_month", title = "Weight Progression" }) => {
    const chartRef = useRef(null);
    const [sankeyData, setSankeyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    useEffect(() => {
        if (sankeyData && chartRef.current) {
            drawChart(sankeyData);
        }
    }, [sankeyData]);

    const drawChart = (sankeyData) => {
        if (!chartRef.current || !sankeyData) {
            return;
        }

        const width = 800;
        const height = 600;
        const margin = { top: 20, right: 20, bottom: 30, left: 60 };

        const svg = d3.select(chartRef.current)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const d3Sankey = sankey()
            .nodeWidth(15)
            .nodePadding(10)
            .size([width, height]);

        const path = sankeyLinkHorizontal();

        const { nodes, links } = d3Sankey({
            nodes: Array.from(new Set(sankeyData.flatMap(d => [d.from, d.to]))).map(name => ({ name })),
            links: sankeyData.map(d => ({ source: d.from, target: d.to, value: d.value })),
        });

        svg.append("g")
            .attr("class", "links")
            .selectAll("path")
            .data(links)
            .join("path")
            .attr("d", path)
            .style("stroke-width", d => Math.max(1, d.dy))
            .attr("fill", "none")
            .attr("stroke", "#007bff")
            .attr("opacity", 0.5);

        svg.append("g")
            .attr("class", "nodes")
            .selectAll("rect")
            .data(nodes)
            .join("rect")
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
            .attr("height", d => d.y1 - d.y0)
            .attr("width", d => d.x1 - d.x0)
            .attr("fill", "#007bff")
            .attr("opacity", 0.8)
            .append("title")
            .text(d => d.name);

        svg.append("g")
            .attr("class", "labels")
            .selectAll("text")
            .data(nodes)
            .join("text")
            .attr("x", d => (d.x0 + d.x1) / 2)
            .attr("y", d => (d.y0 + d.y1) / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .text(d => d.name);

    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
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

    return (
        <div ref={chartRef} />
    );
};

export default ArabicaSankeyChart;