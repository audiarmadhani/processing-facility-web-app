"use client";

import { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { 
  Grid, Card, CardContent, Typography, CircularProgress, 
  FormControl, InputLabel, Select, MenuItem, OutlinedInput 
} from '@mui/material';

// Chart imports
import TotalWeightBags from './charts/TotalBarChart';
import TotalCost from './charts/TotalCostChart';
import { 
  ArabicaWeightMoM, RobustaWeightMoM, 
  ArabicaCostMoM, RobustaCostMoM,
  ArabicaAvgCostMoM, RobustaAvgCostMoM, 
  ArabicaProcessedMoM,RobustaProcessedMoM,
  ArabicaProductionMoM, RobustaProductionMoM, 
  ArabicaCategoryChart, RobustaCategoryChart, 
  ArabicaCherryQualitybyDate, RobustaCherryQualitybyDate,
  ArabicaFarmersContribution, RobustaFarmersContribution, 
  ArabicaSankeyChart, RobustaSankeyChart, 
  ArabicaAchievement, RobustaAchievement 
} from './charts';
const ArabicaMap = dynamic(() => import("./charts/ArabicaMap"), { ssr: false });
const RobustaMap = dynamic(() => import("./charts/RobustaMap"), { ssr: false });

const timeframes = [
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_year', label: 'This Year' },
  { value: 'last_year', label: 'Last Year' },
];

const MetricCard = ({ title, value, unit, timeframeLabel, change, chart, sx }) => {
  const formatValue = (val, unit) => {
    if (!val && val !== 0) return `0 ${unit || ''}`;
    if (unit === 'Rp/kg') return `Rp ${new Intl.NumberFormat('de-DE').format(val)} /kg`;
    if (val >= 1e9) return `${(val / 1e9).toFixed(2)} B ${unit || ''}`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(2)} M ${unit || ''}`;
    if (val >= 1e3) return `${(val / 1e3).toFixed(2)} K ${unit || ''}`;
    return `${new Intl.NumberFormat('de-DE').format(val)} ${unit || ''}`;
  };

  return (
    <Card variant="outlined" sx={{ height: '100%', ...sx }}>
      <CardContent>
        <Typography variant="body1">{title}</Typography>
        <Typography variant="h4" sx={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: 1 }}>
          {formatValue(value, unit)}
          {change?.lastValue !== undefined && change.lastValue !== 0 && (
            <Typography
              variant="subtitle2"
              color={change.isPositive ? (change.isGood ? 'green' : 'red') : (change.isGood ? 'red' : 'green')}
              sx={{
                fontWeight: 'bold',
                backgroundColor: change.isPositive ? (change.isGood ? '#e0f4e0' : '#f4e0e0') : (change.isGood ? '#e0f4e0' : '#f4e0e0'),
                borderRadius: '12px',
                padding: '4px 8px',
                marginLeft: 'auto',
              }}
            >
              {change.isPositive ? '+' : '-'}{Math.abs(((value - change.lastValue) / change.lastValue * 100).toFixed(2))}%
            </Typography>
          )}
        </Typography>
        <Typography variant="caption">{timeframeLabel}</Typography>
        {chart}
      </CardContent>
    </Card>
  );
};

function Dashboard() {
  const { data: session } = useSession();
  const userRole = session?.user?.role || "user";
  const [metrics, setMetrics] = useState({
    totalBatches: 0, totalArabicaWeight: 0, totalRobustaWeight: 0, totalArabicaCost: 0, totalRobustaCost: 0,
    avgArabicaCost: 0, avgRobustaCost: 0, totalArabicaProcessed: 0, totalRobustaProcessed: 0,
    totalArabicaProduction: 0, totalRobustaProduction: 0, activeArabicaFarmers: 0, activeRobustaFarmers: 0,
    pendingArabicaQC: 0, pendingRobustaQC: 0, pendingArabicaProcessing: 0, pendingRobustaProcessing: 0,
    pendingArabicaWeightProcessing: 0, pendingRobustaWeightProcessing: 0, landCoveredArabica: 0,
    landCoveredRobusta: 0, arabicaYield: 0, robustaYield: 0,
    lastmonthArabicaWeight: 0, lastmonthRobustaWeight: 0, lastmonthArabicaCost: 0, lastmonthRobustaCost: 0,
    lastmonthAvgArabicaCost: 0, lastmonthAvgRobustaCost: 0, lastmonthArabicaProcessed: 0,
    lastmonthRobustaProcessed: 0, lastmonthArabicaProduction: 0, lastmonthRobustaProduction: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('this_month');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`https://processing-facility-backend.onrender.com/api/dashboard-metrics?timeframe=${timeframe}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const jsonData = await response.json();
        setMetrics(Object.fromEntries(
          Object.entries(jsonData).map(([key, value]) => [key, value ?? 0])
        ));
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeframe]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return <Typography color="error">Error: {error}</Typography>;
  }

  const selectedRangeLabel = timeframes.find(t => t.value === timeframe)?.label || 'This Month';

  const metricSections = [
    {
      type: 'Arabica',
      metrics: [
        { title: 'Total Cherry Weight', key: 'totalArabicaWeight', unit: 'kg', chart: <ArabicaWeightMoM timeframe={timeframe} />, change: { lastValue: metrics.lastmonthArabicaWeight, isGood: false } },
        ...(userRole === 'admin' || userRole === 'manager' ? [
          { title: 'Total Cherry Cost', key: 'totalArabicaCost', unit: 'Rp/kg', chart: <ArabicaCostMoM timeframe={timeframe} />, change: { lastValue: metrics.lastmonthArabicaCost, isGood: false } },
          { title: 'Average Cherry Cost', key: 'avgArabicaCost', unit: 'Rp/kg', chart: <ArabicaAvgCostMoM timeframe={timeframe} />, change: { lastValue: metrics.lastmonthAvgArabicaCost, isGood: false } },
        ] : []),
        { title: 'Total Processed', key: 'totalArabicaProcessed', unit: 'kg', chart: <ArabicaProcessedMoM timeframe={timeframe} />, change: { lastValue: metrics.lastmonthArabicaProcessed, isGood: true } },
        { title: 'Total Production', key: 'totalArabicaProduction', unit: 'kg', chart: <ArabicaProductionMoM timeframe={timeframe} />, change: { lastValue: metrics.lastmonthArabicaProduction, isGood: true } },
        { title: 'Yield', key: 'arabicaYield', unit: '', format: v => v ? `${(100 / v).toFixed(1)}:1` : '0:1', timeframe: 'All time' },
        { title: 'Land Covered', key: 'landCoveredArabica', unit: 'm²', timeframe: 'All time' },
        { title: 'Farmers', key: 'activeArabicaFarmers', unit: 'Farmers', timeframe: 'All time' },
        { title: 'Pending QC', key: 'pendingArabicaQC', unit: 'Batch', timeframe: 'All time' },
        { title: 'Pending Processing', key: 'pendingArabicaProcessing', unit: 'Batch', extra: `${new Intl.NumberFormat('de-DE').format(metrics.pendingArabicaWeightProcessing)} kg`, timeframe: 'All time' },
      ],
      charts: [
        { title: 'Daily Production', component: <ArabicaCategoryChart timeframe={timeframe} />, xs: 12, md: 6 },
        { title: 'Target Achievement', component: <ArabicaAchievement timeframe={timeframe} />, xs: 12, md: 6 },
        { title: 'Farmers Contribution', component: <ArabicaFarmersContribution timeframe={timeframe} />, xs: 12, md: 6 },
        { title: 'Cherry Quality', component: <ArabicaCherryQualitybyDate timeframe={timeframe} />, xs: 12, md: 6 },
        { title: 'Coverage Map', component: <ArabicaMap />, xs: 12, md: 12 },
        { title: 'Sankey Chart', component: <ArabicaSankeyChart height="100%" />, xs: 12, md: 12, sx: { height: { xs: '300px', sm: '400px', md: '500px', lg: '600px', xl: '700px' } } },
      ],
    },
    {
      type: 'Robusta',
      metrics: [
        { title: 'Total Cherry Weight', key: 'totalRobustaWeight', unit: 'kg', chart: <RobustaWeightMoM timeframe={timeframe} />, change: { lastValue: metrics.lastmonthRobustaWeight, isGood: false } },
        ...(userRole === 'admin' || userRole === 'manager' ? [
          { title: 'Total Cherry Cost', key: 'totalRobustaCost', unit: 'Rp/kg', chart: <RobustaCostMoM timeframe={timeframe} />, change: { lastValue: metrics.lastmonthRobustaCost, isGood: false } },
          { title: 'Average Cherry Cost', key: 'avgRobustaCost', unit: 'Rp/kg', chart: <RobustaAvgCostMoM timeframe={timeframe} />, change: { lastValue: metrics.lastmonthAvgRobustaCost, isGood: false } },
        ] : []),
        { title: 'Total Processed', key: 'totalRobustaProcessed', unit: 'kg', chart: <RobustaProcessedMoM timeframe={timeframe} />, change: { lastValue: metrics.lastmonthRobustaProcessed, isGood: true } },
        { title: 'Total Production', key: 'totalRobustaProduction', unit: 'kg', chart: <RobustaProductionMoM timeframe={timeframe} />, change: { lastValue: metrics.lastmonthRobustaProduction, isGood: true } },
        { title: 'Yield', key: 'robustaYield', unit: '', format: v => v ? `${(100 / v).toFixed(1)}:1` : '0:1', timeframe: 'All time' },
        { title: 'Land Covered', key: 'landCoveredRobusta', unit: 'm²', timeframe: 'All time' },
        { title: 'Farmers', key: 'activeRobustaFarmers', unit: 'Farmers', timeframe: 'All time' },
        { title: 'Pending QC', key: 'pendingRobustaQC', unit: 'Batch', timeframe: 'All time' },
        { title: 'Pending Processing', key: 'pendingRobustaProcessing', unit: 'Batch', extra: `${new Intl.NumberFormat('de-DE').format(metrics.pendingRobustaWeightProcessing)} kg`, timeframe: 'All time' },
      ],
      charts: [
        { title: 'Daily Production', component: <RobustaCategoryChart timeframe={timeframe} />, xs: 12, md: 6 },
        { title: 'Target Achievement', component: <RobustaAchievement timeframe={timeframe} />, xs: 12, md: 6 },
        { title: 'Farmers Contribution', component: <RobustaFarmersContribution timeframe={timeframe} />, xs: 12, md: 6 },
        { title: 'Cherry Quality', component: <RobustaCherryQualitybyDate timeframe={timeframe} />, xs: 12, md: 6 },
        { title: 'Coverage Map', component: <RobustaMap />, xs: 12, md: 12 },
        { title: 'Sankey Chart', component: <RobustaSankeyChart height="100%" />, xs: 12, md: 12, sx: { height: { xs: '300px', sm: '400px', md: '500px', lg: '600px', xl: '700px' } } },
      ],
    },
  ];

  return (
    <div style={{ padding: 5, flex: 1, width: '100%', height: '100%' }}>
      <Grid container spacing={3}>
        <Grid item xs={6} md={2.4}>
          <FormControl fullWidth>
            <InputLabel id="timeframe-label">Select Timeframe</InputLabel>
            <Select
              labelId="timeframe-label"
              value={timeframe}
              label="Select Timeframe"
              onChange={(e) => setTimeframe(e.target.value)}
              input={<OutlinedInput label="Select Timeframe" />}
            >
              {timeframes.map(({ value, label }) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {metricSections.map(({ type, metrics, charts }) => (
          <Grid item xs={12} md={12} key={type}>
            <Grid container spacing={3}>
              {metrics.map(({ title, key, unit, chart, change, format, timeframe: tf, extra }) => (
                <Grid item xs={12} md={2.4} sx={{ height: { xs: 'auto', md: '220px' } }} key={key}>
                  <MetricCard
                    title={`${type} ${title}`}
                    value={metrics[key] || 0}
                    unit={unit}
                    timeframeLabel={tf || selectedRangeLabel}
                    change={change ? { ...change, isPositive: (metrics[key] || 0) >= (change.lastValue || 0) } : null}
                    chart={chart}
                    sx={extra ? { display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } : {}}
                  />
                  {extra && (
                    <Typography variant="h4" sx={{ fontSize: '1.5rem', padding: '0 16px 16px' }}>
                      {extra}
                    </Typography>
                  )}
                </Grid>
              ))}
              {charts.map(({ title, component, xs, md, sx }) => (
                <Grid item xs={xs} md={md} sx={{ height: { xs: '600px', sm: '600px', md: '600px', ...sx } }} key={title}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>{type} {title}</Typography>
                      {component}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}

export default Dashboard;