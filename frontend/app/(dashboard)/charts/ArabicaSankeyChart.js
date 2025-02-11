"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Typography, useTheme } from '@mui/material';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import * as d3 from 'd3';

const ArabicaSankeyChart = ({ timeframe = "this_month", title = "Weight Progression" }) => {
    const chartRef = useRef(null);
    const [sankeyData, setSankeyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });
    const theme = useTheme();

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
            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [timeframe]);

    useEffect(() => {
        const handleResize = () => {
            if (chartRef.current) {
                setChartDimensions({
                    width: chartRef.current.offsetWidth,
                    height: chartRef.current.offsetHeight,
                });
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!sankeyData || !chartRef.current || !chartDimensions.width || !chartDimensions.height) return;

        d3.select(chartRef.current).selectAll("*").remove();

        const margin = { top: 30, right: 60, bottom: 30, left: 100 };
        const width = chartDimensions.width - margin.left - margin.right;
        const height = chartDimensions.height - margin.top - margin.bottom;

        const svg = d3.select(chartRef.current)
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const sankeyGenerator = sankey()
            .nodeWidth(15)
            .nodePadding(10)
            .size([width, height]);

        const nodes = Array.from(new Set([
            ...sankeyData.map(d => d.from_node),
            ...sankeyData.map(d => d.to_node)
        ])).map(name => ({ name }));

        const links = sankeyData.map(d => ({
            source: nodes.findIndex(n => n.name === d.from_node),
            target: nodes.findIndex(n => n.name === d.to_node),
            value: d.value
        }));

        const { nodes: layoutNodes, links: layoutLinks } = sankeyGenerator({ nodes, links });

        const linkStroke = theme.palette.mode === 'dark' ? "#007bff80" : "#007bff80";
        const nodeFill = theme.palette.mode === 'dark' ? theme.palette.primary.dark : theme.palette.primary.main;
        const textFill = theme.palette.mode === 'dark' ? "#fff" : "#000";

        svg.append("g")
            .selectAll("path")
            .data(layoutLinks)
            .join("path")
            .attr("d", sankeyLinkHorizontal())
            .attr("stroke", linkStroke)
            .attr("fill", "none")
            .on("mouseover", (event, d) => {
                d3.selectAll(".link").filter(l => l !== d).attr("opacity", 0.3);
                d3.select(event.currentTarget).attr("stroke", "lightblue").attr("opacity", 1);
                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip.html(`Weight: ${d.value.toFixed(2)}`);
                const x = event.pageX;
                const y = event.pageY;
                tooltip.style("left", (x + 10) + "px").style("top", (y - 20) + "px");
            })
            .on("mouseout", (event) => {
                d3.selectAll(".link").attr("opacity", 1);
                d3.select(event.currentTarget).attr("stroke", linkStroke);
                tooltip.transition().duration(500).style("opacity", 0);
            })
            .attr("class", "link");
            
        svg.append("g")
            .selectAll("rect")
            .data(layoutNodes)
            .join("rect")
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
            .attr("height", d => d.y1 - d.y0)
            .attr("width", d => d.x1 - d.x0)
            .attr("fill", nodeFill)
            .append("title")
            .text(d => d.name);

        svg.append("g")
            .selectAll("text")
            .data(layoutNodes)
            .join("text")
            .attr("x", d => d.x0 - 6)
            .attr("y", (d => d.y1 + d.y0) / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "end")
            .text(d => d.name)
            .attr("fill", textFill)
            .filter(d => d.x0 > width / 2)
            .attr("x", d => d.x1 + 6)
            .attr("text-anchor", "start");

        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("pointer-events", "none")
            .style("text-align", "center")
            .style("background", "rgba(0,0,0,0.8)")
            .style("color", "#fff")
            .style("padding", "4px")
            .style("border-radius", "4px")
            .style("font-size", "12px");

    }, [sankeyData, theme.palette.mode, chartDimensions.width, chartDimensions.height]);

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 800 }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Box sx={{ textAlign: "center", padding: 2, color: "red" }}><Typography variant="body1">{error}</Typography></Box>;
    }

    return (
        <Box sx={{ p: 2, height: '100%' }}>
            {/* <Typography variant="h6" gutterBottom>{title}</Typography> */}
            <div ref={chartRef} style={{ width: '100%', height: '100%' }} />
        </Box>
    );
};

export default ArabicaSankeyChart;