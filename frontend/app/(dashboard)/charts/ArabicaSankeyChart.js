"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import axios from 'axios';

const ArabicaSankeyChart = ({ timeframe = "this_month", title = "Weight Progression" }) => {
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

    useEffect(() => {
        if (sankeyData && chartRef.current) {
            // Load the Google Charts package.
            window.google.charts.load('current', { 'packages': ['sankey'] });

            // Set a callback to run when the Google Charts package is loaded.
            window.google.charts.setOnLoadCallback(drawChart);

            function drawChart() {
                const data = new window.google.visualization.DataTable();
                data.addColumn('string', 'From');
                data.addColumn('string', 'To');
                data.addColumn('number', 'Weight');

                data.addRows(sankeyData.map(flow => [flow.from, flow.to, flow.value]));

                const options = {
                    title: title,
                    // ... other options if needed
                };

                const chart = new window.google.visualization.Sankey(chartRef.current);

                chart.draw(data, options);
            }
        }
    }, [sankeyData, title]);


    // ... (Rest of your rendering logic)
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
        <div ref={chartRef} style={{ height: '600px', width: '800px' }} /> // Use a div for Google Charts
    );
};

export default ArabicaSankeyChart;