"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Chart, CategoryScale, LinearScale } from 'chart.js';
import 'chartjs-chart-sankey';
import { Box, CircularProgress, Typography } from '@mui/material';
import axios from 'axios';

Chart.register(CategoryScale, LinearScale); // Register necessary scales

const ArabicaSankeyChart = ({ timeframe = "this_month", title = "Weight Progression" }) => {
    const [sankeyData, setSankeyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const chartRef = useRef(null);
    const [chartInstance, setChartInstance] = useState(null); // Store chart instance

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(`https://processing-facility-backend.onrender.com/api/dashboard-metrics?timeframe=${timeframe}`);

                if (!response.data ||!response.data.arabicaSankey ||!Array.isArray(response.data.arabicaSankey)) {
                    throw new Error("Invalid data format received from API.");
                }

                setSankeyData(response.data.arabicaSankey);

            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Error fetching data from API.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [timeframe]);

    useEffect(() => {
        if (sankeyData && chartRef.current) {
            const ctx = chartRef.current.getContext('2d');

            // Destroy previous chart instance if it exists
            if (chartInstance) {
                chartInstance.destroy();
            }

            const newChartInstance = new Chart(ctx, {
                type: 'sankey', // Or 'bar', 'line', etc. if you want a different chart
                data: {
                    datasets: [{
                        data: sankeyData,
                        colorFrom: (context) => '#4c84ff',
                        colorTo: (context) => '#4c84ff',
                        nodeWidth: 15,
                        nodePadding: 10,
                        linkOpacity: 0.5,
                        hoverOffset: 20,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: title,
                            font: { size: 16 },
                        },
                        tooltip: {
                            callbacks: {
                                label: (context) => `${context.from} → ${context.to}: ${context.formattedValue}`,
                            },
                        },
                    },
                    scales: {
                        x: { display: false },
                        y: { display: false },
                    },
                },
            });

            setChartInstance(newChartInstance); // Store the new chart instance

            return () => {
                if (newChartInstance) { // Destroy the chart instance on unmount or data change
                    newChartInstance.destroy();
                }
            };
        }
    }, [sankeyData, title]);

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
        <canvas ref={chartRef} style={{ height: '600px', width: '800px' }} />
    );
};

export default ArabicaSankeyChart;