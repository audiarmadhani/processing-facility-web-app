import React, { useEffect, useState } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import axios from 'axios';
import { Box, CircularProgress } from '@mui/material';

const API_URL = "https://processing-facility-backend.onrender.com/api/dashboard-metrics";


const RobustaProcessedMoM = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('https://processing-facility-backend.onrender.com/api/dashboard-metrics');
        const formattedData = response.data.robustaProcessedMoM.map(item => ({
          date: item.Date,
          thisMonth: item.TotalWeightThisMonth,
          lastMonth: item.TotalWeightLastMonth,
        }));
        setData(formattedData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false); // Stop loading indicator
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
            data: data.map(item => item.thisMonth), 
            label: 'This Month', 
            showMark: false,
            color: '#66b2b2', 
            strokeWidth: 2,
          },
          { 
            data: data.map(item => item.lastMonth), 
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

export default RobustaProcessedMoM;