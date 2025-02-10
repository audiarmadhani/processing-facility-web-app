"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import * as d3 from 'd3';

const ArabicaSankeyChart = ({ timeframe = "this_month" }) => {
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
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                
                if (!data?.arabicaSankey?.length) throw new Error("No valid Sankey data available");
                
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

    useEffect(() => {
        if (!sankeyData || !chartRef.current) return;

        // Clear previous chart
        d3.select(chartRef.current).selectAll("*").remove();

        // Set up dimensions
        const width = 1400;
        const height = 500;
        const margin = { top: 20, right: 20, bottom: 30, left: 60 };

        // Create SVG container
        const svg = d3.select(chartRef.current)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Set up Sankey generator
        const sankeyGenerator = sankey()
            .nodeWidth(15)
            .nodePadding(10)
            .size([width, height]);

        // Process data
        const nodes = Array.from(new Set([
            ...sankeyData.map(d => d.from_node),
            ...sankeyData.map(d => d.to_node)
        ])).map(name => ({ name }));

        const links = sankeyData.map(d => ({
            source: nodes.findIndex(n => n.name === d.from_node),
            target: nodes.findIndex(n => n.name === d.to_node),
            value: d.value
        }));

        // Generate Sankey layout
        const { nodes: layoutNodes, links: layoutLinks } = sankeyGenerator({
            nodes: nodes,
            links: links
        });

        // Create links
        svg.append("g")
            .selectAll("path")
            .data(layoutLinks)
            .join("path")
            .attr("d", sankeyLinkHorizontal())
            .attr("stroke-width", d => Math.max(1, d.width))
            .attr("stroke", "#007bff80")
            .attr("fill", "none");

        // Create nodes
        const node = svg.append("g")
            .selectAll("rect")
            .data(layoutNodes)
            .join("rect")
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
            .attr("height", d => d.y1 - d.y0)
            .attr("width", d => d.x1 - d.x0)
            .attr("fill", "#007bff");

        // Add labels
        svg.append("g")
            .selectAll("text")
            .data(layoutNodes)
            .join("text")
            .attr("x", d => d.x0 - 6)
            .attr("y", d => (d.y1 + d.y0) / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "end")
            .text(d => d.name)
            .filter(d => d.x0 > width / 2)
            .attr("x", d => d.x1 + 6)
            .attr("text-anchor", "start");

    }, [sankeyData]);

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

    return (
        <Box sx={{ p: 2 }}>
            <div ref={chartRef} />
        </Box>
    );
};

export default ArabicaSankeyChart;