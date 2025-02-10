"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3'; // Import D3.js

const ArabicaSankeyChart = ({ timeframe = "this_month", title = "Weight Progression" }) => {
    const chartRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`https://processing-facility-backend.onrender.com/api/dashboard-metrics?timeframe=${timeframe}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                if (!data || !data.arabicaSankey || !Array.isArray(data.arabicaSankey)) {
                    throw new Error("Invalid data format received from API.");
                }

                const sankeyData = data.arabicaSankey;
                drawChart(sankeyData);

            } catch (error) {
                console.error("Error fetching data:", error);
                // Handle error (e.g., display an error message)
            }
        };

        fetchData();
    }, [timeframe]);

    const drawChart = (sankeyData) => {
        if (!chartRef.current || !sankeyData) {
            return; // Don't draw if ref or data is missing
        }

        // Set up chart dimensions and margins
        const width = 800;
        const height = 600;
        const margin = { top: 20, right: 20, bottom: 30, left: 60 };

        // Create SVG element
        const svg = d3.select(chartRef.current)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Create Sankey generator
        const sankey = d3.sankey()
            .nodeWidth(15)
            .nodePadding(10)
            .size([width, height]);

        // Create path generator
        const path = d3.sankeyLinkHorizontal();

        // Prepare data for Sankey layout
        const { nodes, links } = sankey({
            nodes: Array.from(new Set(sankeyData.flatMap(d => [d.from, d.to]))).map(name => ({ name })),
            links: sankeyData.map(d => ({ source: d.from, target: d.to, value: d.value })),
        });

        // Add links
        svg.append("g")
            .attr("class", "links")
            .selectAll("path")
            .data(links)
            .join("path")
            .attr("d", path)
            .style("stroke-width", d => Math.max(1, d.dy))
            .attr("fill", "none")
            .attr("stroke", "#007bff") // Example color
            .attr("opacity", 0.5);

        // Add nodes
        svg.append("g")
            .attr("class", "nodes")
            .selectAll("rect")
            .data(nodes)
            .join("rect")
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
            .attr("height", d => d.y1 - d.y0)
            .attr("width", d => d.x1 - d.x0)
            .attr("fill", "#007bff") // Example color
            .attr("opacity", 0.8)
            .append("title")
            .text(d => d.name);

        // Add node labels (optional)
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

    return (
        <div ref={chartRef} />
    );
};


export default ArabicaSankeyChart;