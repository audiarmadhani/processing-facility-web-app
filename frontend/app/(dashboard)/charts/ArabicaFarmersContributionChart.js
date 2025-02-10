import React from 'react';
import { BarChart } from '@mui/x-charts';

const minimalData = [
  { farmerName: "Farmer G", totalWeight: 1700, unripeWeight: 500, ripeWeight: 1200 },
  { farmerName: "Farmer B", totalWeight: 1200, unripeWeight: 300, ripeWeight: 900 },
  { farmerName: "Farmer F", totalWeight: 1100, unripeWeight: 200, ripeWeight: 900 },
];

const ArabicaFarmersContributionChart = () => {
  return (
    <BarChart
      dataset={minimalData}
      xAxis={[{ scaleType: "band", dataKey: "farmerName" }]}
      yAxis={[{ label: "Weight (kg)" }]}
      series={[
        { dataKey: "unripeWeight", label: "Unripe", stack: "1", color: "red" },
        { dataKey: "ripeWeight", label: "Ripe", stack: "1", color: "blue" },
      ]}
      height={300}
    />
  );
};

export default ArabicaFarmersContributionChart;