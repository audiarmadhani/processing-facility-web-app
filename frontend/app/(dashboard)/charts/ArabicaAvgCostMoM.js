import React, { useEffect, useState } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import axios from 'axios';
import { Box, CircularProgress } from '@mui/material';

const API_URL = "https://processing-facility-backend.onrender.com/api/dashboard-metrics";

const ArabicaAvgCostChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(API_URL);
        const transformedData = response.data.arabicaAvgCostMoM.map(item => ({
          date: item.Date,
          thisMonthCost: parseFloat(item.RunningAverageCostThisMonth),
          lastMonthCost: parseFloat(item.RunningAverageCostLastMonth),
        }));
        setData(transformedData);
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
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 80 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data.length) {
    return (
      <Box sx={{ textAlign: "center", padding: 2 }}>
        <p>No data available</p>
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
            color: '#66b2b2', 
          },
          { 
            data: data.map(item => item.lastMonthCost), 
            label: 'Last Month', 
            showMark: false,
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