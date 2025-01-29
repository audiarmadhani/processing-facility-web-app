"use client";

import React, { useEffect, useState } from 'react';
import { LineChart, Line, Tooltip, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const ArabicaAvgCostMoM = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `https://processing-facility-backend.onrender.com/api/dashboard-metrics`
        );
        console.log(response.data);

        if (Array.isArray(response.data.arabicaAvgCostMoM)) {
          const formattedData = response.data.arabicaAvgCostMoM.map((item) => ({
            date: item.Date,
            thisMonth: parseFloat(item.RunningAverageCostThisMonth),
            lastMonth: parseFloat(item.RunningAverageCostLastMonth),
          }));
          setData(formattedData);
        } else {
          throw new Error("Invalid data structure");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 80 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', padding: 2 }}>
        <Typography variant="h6">No data available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", height: 80 }}>
    <ResponsiveChartContainer>
      <LineChart
        xAxis={[{ scaleType: "point", data: data.map((d) => d.date) }]}
        series={[
          { id: "thisMonth", data: data.map((d) => d.thisMonth), label: "This Month", color: "#66b2b2", showMark: false },
          { id: "lastMonth", data: data.map((d) => d.lastMonth), label: "Last Month", color: "#ffbfd3", showMark: false },
        ]}
        height={80}
        slotProps={{
          legend: { hidden: true }, // Hide legend
        }}
        leftAxis={null}
        bottomAxis={null}
      />
    </ResponsiveChartContainer>
    </Box>
  );
};

export default ArabicaAvgCostMoM;