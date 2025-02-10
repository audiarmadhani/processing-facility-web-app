"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import axios from 'axios';

const ArabicaSankeyChart = ({ timeframe = "this_month", title = "Weight Progression" }) => {
    const [sankeyData, setSankeyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const chartRef = useRef(null);
    const [googleChartsLoaded, setGoogleChartsLoaded] = useState(false);

    useEffect(() => {
        // Check if already loaded
        if (window.google && window.google.visualization && window.google.visualization.Sankey) {
            setGoogleChartsLoaded(true);
            return;
        }

        // Load if not already loaded
        if (!googleChartsLoaded) {
            window.google.charts.load('current', { 'packages': ['sankey'] });
            window.google.charts.setOnLoadCallback(() => setGoogleChartsLoaded(true));
        }
    }, []);

    useEffect(() => {
        if (googleChartsLoaded && sankeyData && chartRef.current) {
            drawChart();
        }
    }, [sankeyData, title, googleChartsLoaded]);

    const drawChart = () => {
        const data = new window.google.visualization.DataTable();
        data.addColumn('string', 'From');
        data.addColumn('string', 'To');
        data.addColumn('number', 'Weight');
        data.addRows(sankeyData.map(flow => [flow.from, flow.to, flow.value]));

        const options = {
            title: title,
        };

        const chart = new window.google.visualization.Sankey(chartRef.current);
        chart.draw(data, options);
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(`https://processing-facility-backend.onrender.com/api/dashboard-metrics?timeframe=${timeframe}`);

                if (!response.data || !response.data.arabicaSankey || !Array.isArray(response.data.arabicaSankey)) {
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
        <div ref={chartRef} style={{ height: '600px', width: '800px' }} />
    );
};

export default ArabicaSankeyChart;