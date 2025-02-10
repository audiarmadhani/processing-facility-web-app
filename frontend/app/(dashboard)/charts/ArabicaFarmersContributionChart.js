"use client";

import React, { useEffect, useState } from "react";
import { BarChart } from "@mui/x-charts";
import axios from "axios";
import { Box, CircularProgress, Typography } from "@mui/material";

const colorCategories = {
  Set3: [
    "#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462",
    "#b3de69", "#fccde5", "#d9d9d9", "#bc80bd", "#ccebc5", "#ffed6f",
  ],
};

const ArabicaFarmersContributionChart = ({ timeframe = "last_month" }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedFarmer, setSelectedFarmer] = useState(null);
  
    const processChartData = (data) => {
      if (!Array.isArray(data)) {
        console.error("Expected an array but received:", data);
        return [];
      }
  
      const processedData = data.map((farmer) => {
        const { weight, unripeWeight, semiripeWeight, ripeWeight, overripeWeight, unknownWeight } = farmer;
  
        return {
          farmerName: farmer.farmerName,
          weight: Number(weight),
          unripeWeight: Number(unripeWeight) || 0,
          semiripeWeight: Number(semiripeWeight) || 0,
          ripeWeight: Number(ripeWeight) || 0,
          overripeWeight: Number(overripeWeight) || 0,
          unknownWeight: Number(unknownWeight) || 0,
        };
      }).sort((a, b) => b.weight - a.weight);
  
      console.log("Processed Data:", processedData); // Log processed data
      return processedData;
    };
  
    useEffect(() => {
      const fetchData = async () => {
        setLoading(true);
        setError(null);
  
        try {
          const response = await axios.get(
            `https://processing-facility-backend.onrender.com/api/dashboard-metrics?timeframe=${timeframe}`
          );
  
          console.log("API Response:", response.data); // Log API response
  
          if (response.data && Array.isArray(response.data.arabicaFarmersContribution)) {
            const transformedData = processChartData(response.data.arabicaFarmersContribution);
            setData(transformedData);
          } else {
            console.error("Invalid data format:", response.data);
            setData([]);
            setError("Invalid data format received from the server.");
          }
        } catch (error) {
          console.error("Error fetching data:", error);
          setData([]);
          setError("Error fetching data from the server.");
        } finally {
          setLoading(false);
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
      <Box sx={{ color: "red", textAlign: "center", mt: 2 }}>
        <Typography variant="body1">{error}</Typography>
      </Box>
    );
  }

  const chartHeight = data && data.length > 0 ? 500 : "auto";

  const handleItemClick = (item) => {  // Correct handler name
    console.log("Item Clicked:", item); // Correctly logged bar data
    if (item) {
      setSelectedFarmer(item.farmerName);
    } else {
      setSelectedFarmer(null);
    }
  };

  const filteredData = selectedFarmer ? data.filter(farmer => farmer.farmerName === selectedFarmer) : data;

  console.log("Filtered Data:", filteredData); // Log filtered data

  return (
    <Box sx={{ height: chartHeight }}>
      {data.length === 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 500 }}>
          <Typography variant="body1">No data available for the selected timeframe.</Typography>
        </Box>
      ) : (
        <BarChart
          dataset={filteredData}
          xAxis={[{ scaleType: 'band', dataKey: "farmerName", label: "Farmer", disableTicks: true }]}
          yAxis={[{ label: "Weight (kg)" }]}
          series={[
            { dataKey: "weight", label: "Total Weight", stack: 'weight', color: colorCategories.Set3[5] },
            { dataKey: "unripeWeight", label: "Unripe", stack: 'ripenessWeight', color: colorCategories.Set3[0] },
            { dataKey: "semiripeWeight", label: "Semi-ripe", stack: 'ripenessWeight', color: colorCategories.Set3[1] },
            { dataKey: "ripeWeight", label: "Ripe", stack: 'ripenessWeight', color: colorCategories.Set3[2] },
            { dataKey: "overripeWeight", label: "Overripe", stack: 'ripenessWeight', color: colorCategories.Set3[3] },
            { dataKey: "unknownWeight", label: "Unknown", stack: 'ripenessWeight', color: colorCategories.Set3[4] },
          ]}
          height={500}
          sx={{
            ".MuiChart-axisLeft .MuiChart-axisLabel": {
              transform: "translate(-50px, 0)",
            },
          }}
          borderRadius={10}
          slotProps={{ legend: { hidden: true } }}
          onItemClick={handleItemClick} // Use onItemClick handler
        />
      )}
    </Box>
  );
};

export default ArabicaFarmersContributionChart;