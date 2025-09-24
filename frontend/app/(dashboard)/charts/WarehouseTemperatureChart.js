import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, TimeScale, Title, Tooltip, Legend } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Box } from '@mui/material';

ChartJS.register(LineElement, PointElement, LinearScale, TimeScale, Title, Tooltip, Legend);

const WarehouseTemperatureChart = ({ data, timeframe }) => {
  const [chartData, setChartData] = useState({
    datasets: [],
  });

  useEffect(() => {
    if (data && data.length > 0) {
      const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
      setChartData({
        datasets: [
          {
            label: 'Temperature (°C)',
            data: sortedData.map(row => ({
              x: new Date(row.date),
              y: row.temperature,
            })),
            borderColor: '#1976d2',
            backgroundColor: 'rgba(25, 118, 210, 0.2)',
            fill: false,
            tension: 0.1,
            pointRadius: 3,
          },
        ],
      });
    } else {
      setChartData({
        datasets: [],
      });
    }
  }, [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: timeframe === 'this_week' || timeframe === 'last_week' ? 'day' : 'day',
          displayFormats: {
            day: 'MMM dd',
          },
        },
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Temperature (°C)',
        },
        beginAtZero: false,
        suggestedMin: 0,
        suggestedMax: 50,
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)} °C`,
        },
      },
    },
  };

  return (
    <Box sx={{ height: '90%' }}>
      {data.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Typography variant="body1" color="error">
            No temperature data available for the selected timeframe.
          </Typography>
        </Box>
      ) : (
        <Line data={chartData} options={options} />
      )}
    </Box>
  );
};

export default WarehouseTemperatureChart;