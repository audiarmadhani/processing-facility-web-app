"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Chart } from 'chart.js';
import 'chartjs-chart-sankey';
import { Box, CircularProgress, Typography } from '@mui/material';
import axios from 'axios';

const RobustaSankeyChart = ({ timeframe = "this_month", title = "Weight Progression" }) => {
    const [sankeyData, setSankeyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const chartRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(`https://processing-facility-backend.onrender.com/api/dashboard-metrics?timeframe=${timeframe}`);

                if (!response.data || !response.data.robustaSankey || !Array.isArray(response.data.robustaSankey)) {
                    throw new Error("Invalid data format received from API.");
                }

                setSankeyData(response.data.robustaSankey);

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

            const sankeyChart = new Chart(ctx, {
                type: 'sankey',
                data: {
                    datasets: [{
                        data: sankeyData,
                        colorFrom: (context) => {
                            return '#4c84ff'; // Example color (customize)
                        },
                        colorTo: (context) => {
                            return '#4c84ff'; // Example color (customize)
                        },
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
                            font: {
                                size: 16,
                            },
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return `${context.from} → ${context.to}: ${context.formattedValue}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            display: false,
                        },
                        y: {
                            display: false,
                        }
                    }
                }
            });

            return () => {
                sankeyChart.destroy();
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

export default RobustaSankeyChart;