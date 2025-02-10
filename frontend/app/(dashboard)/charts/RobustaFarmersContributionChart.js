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

const RobustaFarmersContributionChart = ({ timeframe = "this_month" }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const processChartData = (data) => {
    if (!Array.isArray(data)) {
      console.error("Expected an array but received:", data);
      return [];
    }

    return data.map((farmer) => {
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
        const unripe = isNaN(unripePercentage) || unripePercentage === null ? 0 : unripePercentage;
        const semiripe = isNaN(semiripePercentage) || semiripePercentage === null ? 0 : semiripePercentage;
        const ripe = isNaN(ripePercentage) || ripePercentage === null ? 0 : ripePercentage;
        const overripe = isNaN(overripePercentage) || overripePercentage === null ? 0 : overripePercentage;
        const unknown = isNaN(unknownRipeness) || unknownRipeness === null ? 0 : unknownRipeness;

        const totalPercentage = unripe + semiripe + ripe + overripe + unknown;

        normalizedUnripe = totalPercentage === 0 ? 0 : (unripe / totalPercentage) * 100;
        normalizedSemiripe = totalPercentage === 0 ? 0 : (semiripe / totalPercentage) * 100;
        normalizedRipe = totalPercentage === 0 ? 0 : (ripe / totalPercentage) * 100;
        normalizedOverripe = totalPercentage === 0 ? 0 : (overripe / totalPercentage) * 100;
        normalizedUnknown = totalPercentage === 0 ? 0 : (unknown / totalPercentage) * 100;
      }

      const totalWeightNum = Number(totalWeight);

      return {
        farmerName: farmer.farmerName,
        totalWeight: totalWeightNum,

        unripeWeight: (normalizedUnripe / 100) * totalWeightNum,
        semiripeWeight: (normalizedSemiripe / 100) * totalWeightNum,
        ripeWeight: (normalizedRipe / 100) * totalWeightNum,
        overripeWeight: (normalizedOverripe / 100) * totalWeightNum,
        unknownWeight: (normalizedUnknown / 100) * totalWeightNum,
        hasRipenessData: !allNaN,
      };
    }).sort((a, b) => b.totalWeight - a.totalWeight);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(
          `https://processing-facility-backend.onrender.com/api/dashboard-metrics?timeframe=${timeframe}`
        );

        console.log("API Response:", response.data);

        if (response.data && Array.isArray(response.data.robustaFarmersContribution)) {
          const transformedData = processChartData(response.data.robustaFarmersContribution);
          console.log("Transformed Data:", transformedData);
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

  return (
    <Box sx={{ height: chartHeight }}>
      {data.length === 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 500 }}>
          <Typography variant="body1">No data available for the selected timeframe.</Typography>
        </Box>
      ) : (
        <BarChart
          dataset={data}
          xAxis={[{ scaleType: "band", dataKey: "farmerName", label: "Farmer", disableTicks: true }]}
          yAxis={[{ label: "Weight (kg)" }]}
          series={data.flatMap((farmer) => {
            if (farmer.hasRipenessData) {
              return [
                { dataKey: "unripeWeight", label: "Unripe", stackId: "1", color: colorCategories.Set3[0] },
                { dataKey: "semiripeWeight", label: "Semi-ripe", stackId: "1", color: colorCategories.Set3[1] },
                { dataKey: "ripeWeight", label: "Ripe", stackId: "1", color: colorCategories.Set3[2] },
                { dataKey: "overripeWeight", label: "Overripe", stackId: "1", color: colorCategories.Set3[3] },
                { dataKey: "unknownWeight", label: "Unknown", stackId: "1", color: colorCategories.Set3[4] },
              ];
            } else {
              return [{ dataKey: "unknownWeight", label: "Unknown", color: colorCategories.Set3[4] }];
            }
          })}
          height={500}
          sx={{
            ".MuiChart-axisLeft .MuiChart-axisLabel": {
              transform: "translate(-50px, 0)",
            },
          }}
          borderRadius={10}
          slotProps={{ legend: { hidden: true } }}
          tooltip={{
            trigger: "item",
            formatter: (value, item) => {
              const ripenessLabel = item.label;
              const totalWeight = data.find(d => d.farmerName === item.farmerName)?.totalWeight;
              return `${ripenessLabel}: ${value.toFixed(2)} kg (Total: ${totalWeight?.toFixed(2)} kg)`;
            },
          }}
        />
      )}
    </Box>
  );
};

export default RobustaFarmersContributionChart;