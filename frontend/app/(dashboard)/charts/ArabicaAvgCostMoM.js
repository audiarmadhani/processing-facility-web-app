"use client";

import React from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { Box, CircularProgress, Typography } from '@mui/material';

const ArabicaAvgCostChart = ({ arabicaAvgCostData, loading }) => {
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 80 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!arabicaAvgCostData || arabicaAvgCostData.length === 0) {
    return (
      <Box sx={{ textAlign: "center", padding: 2 }}>
        <Typography variant="body2" color="textSecondary">No data available</Typography>
      </Box>
    );
  }

  const transformedData = Array.isArray(arabicaAvgCostData)
    ? arabicaAvgCostData.map(item => ({
        date: item.Date,
        thisMonthCost: parseFloat(item.RunningAverageCostThisMonth),
        lastMonthCost: parseFloat(item.RunningAverageCostLastMonth),
      }))
    : [{
        date: arabicaAvgCostData.Date,
        thisMonthCost: parseFloat(arabicaAvgCostData.RunningAverageCostThisMonth),
        lastMonthCost: parseFloat(arabicaAvgCostData.RunningAverageCostLastMonth),
      }];

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <LineChart
        xAxis={[{ scaleType: 'point', data: transformedData.map(item => item.date) }]}
        series={[
          { 
            data: transformedData.map(item => item.thisMonthCost), 
            label: 'This Month', 
            showMark: false,
            curve: "monotoneX",
            color: '#66b2b2', 
            strokeWidth: 2,
          },
          { 
            data: transformedData.map(item => item.lastMonthCost), 
            label: 'Last Month', 
            showMark: false,
            curve: "monotoneX",
            color: '#ffbfd3',
          },
        ]}
        height={70}
        slotProps={{
          legend: { hidden: true }, // Hide legend
        }}
        leftAxis={null}
        bottomAxis={null}
        margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
      />
    </Box>
  );
};

export default ArabicaAvgCostChart;
