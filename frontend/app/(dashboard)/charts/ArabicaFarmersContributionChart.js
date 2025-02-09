"use client";

import React, { useEffect, useState } from "react";
import { BarChart, BarChartTooltip } from "@mui/x-charts";
import axios from "axios";
import { Box, CircularProgress } from "@mui/material";

const colorCategories = {
  Set3: [
    "#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462",
    "#b3de69", "#fccde5", "#d9d9d9", "#bc80bd", "#ccebc5", "#ffed6f",
  ],
};

const ArabicaFarmersContributionChart = ({ timeframe = "this_month" }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const processChartData = (data) => {
    if (!Array.isArray(data)) {
      console.error("Expected an array but received:", data);
      return [];
    }

    return data.map(farmer => {
      const { totalWeight, unripePercentage, semiripePercentage, ripePercentage, overripePercentage, unknownRipeness } = farmer;

      const allNaN = isNaN(unripePercentage) && isNaN(semiripePercentage) && isNaN(ripePercentage) && isNaN(overripePercentage);

      let normalizedUnripe = 0;
      let normalizedSemiripe = 0;
      let normalizedRipe = 0;
      let normalizedOverripe = 0;
      let normalizedUnknown = 0;

      if (allNaN) {
        normalizedUnknown = 100;
      } else {
        const unripe = isNaN(unripePercentage) ? 0 : unripePercentage;
        const semiripe = isNaN(semiripePercentage) ? 0 : semiripePercentage;
        const ripe = isNaN(ripePercentage) ? 0 : ripePercentage;
        const overripe = isNaN(overripePercentage) ? 0 : overripePercentage;
        const unknown = isNaN(unknownRipeness) ? 0 : unknownRipeness;

        const totalPercentage = unripe + semiripe + ripe + overripe + unknown;

        normalizedUnripe = (unripe / totalPercentage) * 100;
        normalizedSemiripe = (semiripe / totalPercentage) * 100;
        normalizedRipe = (ripe / totalPercentage) * 100;
        normalizedOverripe = (overripe / totalPercentage) * 100;
        normalizedUnknown = (unknown / totalPercentage) * 100;
      }

      return {
        farmerName: farmer.farmerName,
        totalWeight,

        unripeWeight: (normalizedUnripe / 100) * totalWeight,
        semiripeWeight: (normalizedSemiripe / 100) * totalWeight,
        ripeWeight: (normalizedRipe / 100) * totalWeight,
        overripeWeight: (normalizedOverripe / 100) * totalWeight,
        unknownWeight: (normalizedUnknown / 100) * totalWeight,
      };
    }).sort((a, b) => b.totalWeight - a.totalWeight);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `https://processing-facility-backend.onrender.com/api/dashboard-metrics?timeframe=${timeframe}`
        );

        if (response.data && Array.isArray(response.data.arabicaFarmersContribution)) {
          const transformedData = processChartData(response.data.arabicaFarmersContribution);
          setData(transformedData);
        } else {
          console.error("Invalid data format:", response.data);
          setData([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setData([]);
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

  const chartHeight = data && data.length > 0 ? 500 : "auto";
  const ripenessKeys = ["unripeWeight", "semiripeWeight", "ripeWeight", "overripeWeight", "unknownWeight"];

  return (
    <Box sx={{ height: chartHeight }}>
      <BarChart
        dataset={data}
        xAxis={[{ scaleType: "band", dataKey: "farmerName", label: "Farmer", disableTicks: true }]}
        yAxis={[{ label: "Weight (kg)" }]}
        series={ripenessKeys.map((key, index) => ({
          dataKey: key,
          label: key.replace("Weight", ""),
          stackId: "1",
          color: colorCategories.Set3[index % colorCategories.Set3.length],
        }))}
        height={500}
        sx={{
          ".MuiChart-axisLeft .MuiChart-axisLabel": {
            transform: "translate(-50px, 0)",
          },
        }}
        borderRadius={10}
        slotProps={{ legend: { hidden: true } }}
      >
        <BarChartTooltip
          formatter={(value, item) => {
            const ripenessLabel = item.label;
            const totalWeight = data.find(d => d.farmerName === item.farmerName)?.totalWeight;
            return `${ripenessLabel}: ${value.toFixed(2)} kg (Total: ${totalWeight?.toFixed(2)} kg)`;
          }}
        />
      </BarChart>
    </Box>
  );
};

export default ArabicaFarmersContributionChart;