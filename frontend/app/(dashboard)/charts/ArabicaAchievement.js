"use client";

import React, { useEffect, useState } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import axios from 'axios';
import { Box, CircularProgress, Typography } from '@mui/material';
import dayjs from 'dayjs'; // Import dayjs

const ArabicaAchievementChart = ({ timeframe = "this_month" }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const colorPalette = [
        "#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462",
        "#b3de69", "#fccde5", "#d9d9d9", "#bc80bd", "#ccebc5", "#ffed6f",
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`https://processing-facility-backend.onrender.com/api/dashboard-metrics?timeframe=${timeframe}`);
                const apiData = response.data.arabicaAchievement; // No || [] needed, checked below

                // Check if apiData is an array
                if (Array.isArray(apiData)) {
                    // Format date and group data
                    const formattedData = apiData.map(item => ({
                        ...item,
                        date: dayjs(item.date), // Use dayjs for date conversion and handling
                    }));
                    setData(formattedData);
                } else {
                    // Handle the case where apiData is not an array (e.g., null or undefined)
                    setError("Invalid data format received from API.");
                    setLoading(false); // Set loading to false in case of error
                    return;  //Exit early
                }

            } catch (error) {
                console.error('Error fetching data:', error);
                setError("Error fetching data from API.");
                setLoading(false); // Set loading to false in case of error
            } finally {
                if (loading) { // Check loading condition before setting it
                  setLoading(false);
                }
            }
        };

        fetchData();
    }, [timeframe]);

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 500 }}>
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

    if (!data || data.length === 0) {  // Check for null or undefined data, too
        return (
            <Box sx={{ textAlign: "center", padding: 2 }}>
                <Typography variant="body1">No data available</Typography>
            </Box>
        );
    }


    const groupedData = {};
    data.forEach(item => {
      if(!groupedData[item.referenceNumber]){
        groupedData[item.referenceNumber] = [];
      }
        groupedData[item.referenceNumber].push(item);
    });

    const chartSeries = Object.keys(groupedData).map((referenceNumber, index) => ({
        data: groupedData[referenceNumber].map(item => item.cumulative_achievement_percentage),
        label: referenceNumber,
        showMark: false,
        curve: "monotoneX",
        color: colorPalette[index % colorPalette.length],
        strokeWidth: 2,
    }));



    // Get unique, sorted dates for the x-axis
        const uniqueDates = data.reduce((dates, item) => {
        const dateStr = item.date.format('YYYY-MM-DD'); // Format for comparison
        if (!dates.some(d => d.format('YYYY-MM-DD') === dateStr)) {
            dates.push(item.date);
        }
        return dates;
        }, []).sort((a, b) => a.valueOf() - b.valueOf()); // Sort by time value

    return (
        <Box sx={{ width: '100%', height: '100%' }}>
            <LineChart
                xAxis={[{
                    scaleType: 'time', // Use time scale for Date objects
                  data: uniqueDates, // Use the unique, sorted dates
                    valueFormatter: (value) => dayjs(value).format('MMM DD'), //format x-axis
                }]}
                series={chartSeries}
                height={500}
                yAxis={[{ min: 0, max: 100, label: "Achievement (%)" }]}
                margin={{ left: 60 }}
                slotProps={{ legend: { hidden: true } }}
            />
        </Box>
    );
};

export default ArabicaAchievementChart;

