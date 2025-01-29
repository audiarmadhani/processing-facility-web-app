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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 500 }}>
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
    <Box sx={{ width: '100%', height: 400 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="date" />
          <YAxis />
          <Line type="monotone" dataKey="thisMonth" stroke="#66b2b2" strokeWidth={2} />
          <Line type="monotone" dataKey="lastMonth" stroke="#ffbfd3" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default ArabicaAvgCostMoM;