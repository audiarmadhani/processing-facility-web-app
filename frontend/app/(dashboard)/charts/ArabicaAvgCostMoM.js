"use client";

import React, { useEffect, useState } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import axios from 'axios';
import { Box, CircularProgress } from '@mui/material';

const ArabicaAvgCostChart = ({ timeframe = "this_month" }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
        try {
          const response = await axios.get(`https://processing-facility-backend.onrender.com/api/dashboard-metrics?timeframe=${timeframe}`);
            let transformedData = []; // Initialize as an empty array

            if (Array.isArray(response.data.arabicaAvgCostMoM)) { // Check if it's an array
                transformedData = response.data.arabicaAvgCostMoM.map(item => ({
                    date: item.Date,
                    thisMonthCost: parseFloat(item.RunningAverageCostThisMonth),
                    lastMonthCost: parseFloat(item.RunningAverageCostLastMonth),
                }));
            } else if (response.data.arabicaAvgCostMoM) { // Handle the case where the data is a single object
              transformedData = [{
                date: response.data.arabicaAvgCostMoM.Date,
                thisMonthCost: parseFloat(response.data.arabicaAvgCostMoM.RunningAverageCostThisMonth),
                lastMonthCost: parseFloat(response.data.arabicaAvgCostMoM.RunningAverageCostLastMonth),
              }];
            }
            setData(transformedData);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    fetchData();
  }, [timeframe]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 80 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) { // Display error message
    return (
      <Box sx={{ textAlign: "center", padding: 2, color: "red" }}>
        <Typography variant="body1">{error}</Typography>
      </Box>
    );
  }

  if (data.length === 0) {
    return (
      <Box sx={{ textAlign: "center", padding: 2 }}>
        <Typography variant="body1">No data available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <LineChart
        xAxis={[{scaleType: 'point', data: data.map(item => item.date) }]}
        series={[
          { 
            data: data.map(item => item.thisMonthCost), 
            label: 'This Month', 
            showMark: false,
            curve: "monotoneX",
            color: '#66b2b2', 
            strokeWidth: 2,
          },
          { 
            data: data.map(item => item.lastMonthCost), 
            label: 'Last Month', 
            showMark: false,
            curve: "monotoneX",
            color: '#ffbfd3',
          },
        ]}
        // width={300}
        height={70}
        slotProps={{
          legend: { hidden: true }, // Hide legend
        }}
        leftAxis={null}
        bottomAxis={null}
        margin={{ left: 0, right: 0, top: 10, bottom: 0 }} // Adjust left margin to shift left
      />
    </Box>
  );
};

export default ArabicaAvgCostChart;