"use client";

import React, { useEffect, useState } from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import axios from "axios";
import { Box, CircularProgress, Typography } from "@mui/material";

const colorPalette = [
  "#8dd3c7",
  "#ffffb3",
  "#bebada",
  "#fb8072",
  "#80b1d3",
  "#fdb462",
  "#b3de69",
  "#fccde5",
  "#d9d9d9",
  "#bc80bd",
  "#ccebc5",
  "#ffed6f",
];

const ArabicaAchievementChart = ({ timeframe = "this_month" }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `https://processing-facility-backend.onrender.com/api/dashboard-metrics?timeframe=${timeframe}`
        );

        // Access 'arabicaAchievement' directly
        const arabicaAchievementData = response.data.arabicaAchievement;

        if (Array.isArray(arabicaAchievementData)) {
          const chartData = arabicaAchievementData.map((item, index) => ({
            id: item.referenceNumber, // Use referenceNumber as a unique ID
            referenceNumber: item.referenceNumber,
            targetPercentage: item.targetPercentage,
            color: colorPalette[index % colorPalette.length],
          }));
          setData(chartData);
        } else {
          console.error("Invalid data format:", arabicaAchievementData);
          setError("Invalid data format received from the API.");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeframe]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: "center", padding: 2 }}>
        <Typography variant="body1" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box sx={{ textAlign: "center", padding: 2 }}>
        <Typography variant="body1">No data available.</Typography>
      </Box>
    );
  }


  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Arabica Production Target Achievement
      </Typography>
      <Box sx={{ height: 500 }}>
		<BarChart
          dataset={data}
          xAxis={[
            {
              scaleType: 'band',
              dataKey: 'referenceNumber',
              label: 'Reference Number',
            },
          ]}
          yAxis={[
            {
              min: 0,
              max: 100,
              label: 'Target Percentage (%)',
            },
          ]}
          series={[
            {
              dataKey: 'targetPercentage',
              label: 'Target Achievement',
              valueFormatter: (value) => `${value}%`,
			  colorBy: 'dataKey', //add color
            },
          ]}
		  
		  //colors={colorPalette} remove this line

          height={500} // Consider removing explicit height for responsiveness
          
          slotProps={{
            bar: {
              rx: 4, // Rounded corners for bars
			},
		  legend: {  //add Legend
			  hidden: false,
              vertical: "middle",
			right: 0,
			},
          }}
        />
      </Box>
    </Box>
  );
};

export default ArabicaAchievementChart;
