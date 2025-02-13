"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from "next-auth/react"; // Import useSession hook
import dynamic from "next/dynamic";
import { TextField } from '@mui/material'; // Import TextField
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'; // Import AdapterDayjs
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'; // Import LocalizationProvider
import { DatePicker } from '@mui/x-date-pickers/DatePicker'; // Import DatePicker
import dayjs from 'dayjs'; // Install: npm install dayjs
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  CircularProgress, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  OutlinedInput
} from '@mui/material';

import TotalBatchesChart from './charts/TotalBatchesChart'; // Adjust the path as necessary
import TotalCostChart from './charts/TotalCostChart'; // Adjust the path as necessary
import ArabicaWeightMoM from './charts/ArabicaWeightMoM'; // Adjust the path as necessary
import RobustaWeightMoM from './charts/RobustaWeightMoM'; // Adjust the path as necessary
import ArabicaCostMoM from './charts/ArabicaCostMoM'; // Adjust the path as necessary
import RobustaCostMoM from './charts/RobustaCostMoM'; // Adjust the path as necessary
import ArabicaAvgCostMoM from './charts/ArabicaAvgCostMoM'; // Adjust the path as necessary
import RobustaAvgCostMoM from './charts/RobustaAvgCostMoM'; // Adjust the path as necessary
import ArabicaProcessedMoM from './charts/ArabicaProcessedMoM'; // Adjust the path as necessary
import RobustaProcessedMoM from './charts/RobustaProcessedMoM'; // Adjust the path as necessary
import ArabicaProductionMoM from './charts/ArabicaProductionMoM'; // Adjust the path as necessary
import RobustaProductionMoM from './charts/RobustaProductionMoM'; // Adjust the path as necessary
import ArabicaCategoryChart from './charts/ArabicaCategoryChart'; // Adjust the path as necessary
import RobustaCategoryChart from './charts/RobustaCategoryChart'; // Adjust the path as necessary
// import ArabicaTVWidget from './charts/ArabicaTVChart'; // Adjust the path if necessary
// import RobustaTVWidget from './charts/RobustaTVChart'; // Adjust the path if necessary
import ArabicaCherryQualityChart from './charts/ArabicaCherryQualityChart';
import RobustaCherryQualityChart from './charts/RobustaCherryQualityChart';
import ArabicaFarmersContributionChart from './charts/ArabicaFarmersContributionChart';
import RobustaFarmersContributionChart from './charts/RobustaFarmersContributionChart';
import ArabicaSankeyChart from './charts/ArabicaSankeyChart';
import RobustaSankeyChart from './charts/RobustaSankeyChart';
import ArabicaAchievementChart from './charts/ArabicaAchievement';
import RobustaAchievementChart from './charts/RobustaAchievement';


const ArabicaMapComponent = dynamic(() => import("./charts/ArabicaMap"), { ssr: false });
const RobustaMapComponent = dynamic(() => import("./charts/RobustaMap"), { ssr: false });


function Dashboard() {
  const { data: session } = useSession();
  const userRole = session?.user?.role || "user"; // Default to "user" if role is missing

  // State for metrics
  const [metrics, setMetrics] = useState({
    totalBatches: 0,
    totalWeight: 0,
    totalCost: 0,
    activeFarmers: 0,
    pendingQC: 0,
    pendingProcessing: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Define error state and setError function

  const formatWeight = (weight) => {
    if (weight >= 1e9) {
      return `${(weight / 1e9).toFixed(2)} B`; // Format to billions
    } else if (weight >= 1e6) {
      return `${(weight / 1e6).toFixed(2)} M`; // Format to millions
    } else if (weight >= 1e3) {
      return `${(weight / 1e3).toFixed(2)} K`; // Format to thousands
    } else {
      return `Rp ${new Intl.NumberFormat('de-DE').format(weight)} /kg`; // Format normally
    }
  };

  const [data, setData] = useState(null);
  const [timeframe, setTimeframe] = useState('this_month');
  const [dashboardData, setDashboardData] = useState(null);

  // User-friendly labels for timeframes
  const timeframes = [
    { value: 'this_week', label: 'This Week' },
    { value: 'last_week', label: 'Last Week' },

    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },

    { value: 'this_year', label: 'This Year' },
    { value: 'last_year', label: 'Last Year' },
  ];

  const timeframeLabels = {
    this_week: 'This Week',
    last_week: 'Last Week',
    this_month: 'This Month',
    last_month: 'Last Month',
    this_year: 'This Year',
    last_year: 'Last Year',
  };

  // Get the human-readable label for the selected timeframe
  const selectedRangeLabel = timeframeLabels[timeframe];

  // Fetch metrics from the backend
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null); // Clear any previous errors

      let apiUrl = `https://processing-facility-backend.onrender.com/api/dashboard-metrics?timeframe=${timeframe}`;

      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const jsonData = await response.json();
        setMetrics(jsonData);
        setDashboardData(response.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData(); // Call the async function
  }, [timeframe]);

  const handleTimeframeChange = (event) => {
    setTimeframe(event.target.value);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </div>
    );
  }
  
  return (
    <div style={{ padding: '0px', flex: 1, border: 0, width: '100%', height: '100%', margin: 5 }}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Grid container spacing={3}>

          {/* Timeframe Selector */}
          <Grid item xs={6} md={2.4}>
            <FormControl fullWidth>
              <InputLabel id="timeframe-label">Select Timeframe</InputLabel>
              <Select
                labelId="timeframe-label"
                id="timeframe-select"
                value={timeframe}
                label="Select Timeframe"
                onChange={handleTimeframeChange}
                input={<OutlinedInput label="Select Timeframe" />}
              >
                {timeframes.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>


          {/* Arabica Section */}
          <Grid item xs={12} md={12}>
            <Grid container spacing={3}>
                
              {/* Total Arabica Weight */}
              <Grid item xs={12} md={2.4} sx={{ height: { xs: 'auto', md: '220px' } }}> {/* Adjust the height as needed */}
                <Card variant="outlined" sx={{ height: '100%' }}> {/* Ensures the Card takes full height */}
                  <CardContent>
                    <Typography variant="body1">Total Arabica Cherry Weight</Typography>
                    <Typography variant="h4" sx={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                      {new Intl.NumberFormat('de-DE').format(metrics.totalArabicaWeight)} kg
                      {metrics.lastmonthArabicaWeight !== 0 && (
                        <Typography
                          variant="subtitle2"
                          color={metrics.totalArabicaWeight >= metrics.lastmonthArabicaWeight ? 'green' : 'red'}
                          sx={{
                            fontWeight: 'bold',
                            backgroundColor: metrics.totalArabicaWeight >= metrics.lastmonthArabicaWeight ? '#e0f4e0' : '#f4e0e0', // Light background color
                            borderRadius: '12px', // Pill shape
                            padding: '4px 8px', // Padding for the pill
                            marginLeft: 'auto', // Push to the far right
                          }}
                        >
                          {metrics.totalArabicaWeight >= metrics.lastmonthArabicaWeight ? '+' : '-'}
                          {Math.abs(((metrics.totalArabicaWeight - metrics.lastmonthArabicaWeight) / metrics.lastmonthArabicaWeight * 100).toFixed(2))}%
                        </Typography>
                      )}
                    </Typography>
                    <Typography variant="caption">{selectedRangeLabel}</Typography>
                    <ArabicaWeightMoM timeframe={timeframe} />
                  </CardContent>
                </Card>
              </Grid>

              {/* Total Arabica Cost */}
              {["admin", "manager"].includes(userRole) && (
              <Grid item xs={12} md={2.4} sx={{ height: { xs: 'auto', md: '220px' } }}> {/* Adjust the height as needed */}
                <Card variant="outlined" sx={{ height: '100%' }}> {/* Ensures the Card takes full height */}
                  <CardContent>
                    <Typography variant="body1">Total Arabica Cherry Cost</Typography>
                    <Typography variant="h4" sx={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                      {formatWeight(metrics.totalArabicaCost)}
                      {metrics.lastmonthArabicaCost !== 0 && (
                        <Typography
                          variant="subtitle2"
                          color={metrics.totalArabicaCost >= metrics.lastmonthArabicaCost ? 'red' : 'green'}
                          sx={{
                            fontWeight: 'bold',
                            backgroundColor: metrics.totalArabicaCost >= metrics.lastmonthArabicaCost ? '#f4e0e0' : '#e0f4e0', // Light background color
                            borderRadius: '12px', // Pill shape
                            padding: '4px 8px', // Padding for the pill
                            marginLeft: 'auto', // Push to the far right
                          }}
                        >
                          {metrics.totalArabicaCost >= metrics.lastmonthArabicaCost ? '+' : '-'}
                          {Math.abs(((metrics.totalArabicaCost - metrics.lastmonthArabicaCost) / metrics.lastmonthArabicaCost * 100).toFixed(2))}%
                        </Typography>
                      )}
                    </Typography>
                    <Typography variant="caption">{selectedRangeLabel}</Typography>
                    <ArabicaCostMoM timeframe={timeframe} />
                  </CardContent>
                </Card>
              </Grid>
              )}
              
              {/* Average Arabica Cost */}
              {["admin", "manager"].includes(userRole) && (
              <Grid item xs={12} md={2.4} sx={{ height: { xs: 'auto', md: '220px' } }}> {/* Adjust the height as needed */}
                <Card variant="outlined" sx={{ height: '100%' }}> {/* Ensures the Card takes full height */}
                  <CardContent>
                    <Typography variant="body1">Average Arabica Cherry Cost</Typography>
                    <Typography variant="h4" sx={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                      Rp {new Intl.NumberFormat('de-DE').format(metrics.avgArabicaCost)} /kg
                      {metrics.lastmonthAvgArabicaCost !== 0 && (
                        <Typography
                          variant="subtitle2"
                          color={metrics.avgArabicaCost >= metrics.lastmonthAvgArabicaCost ? 'red' : 'green'}
                          sx={{
                            fontWeight: 'bold',
                            backgroundColor: metrics.avgArabicaCost >= metrics.lastmonthAvgArabicaCost ? '#f4e0e0' : '#e0f4e0', // Light background color  
                            borderRadius: '12px', // Pill shape
                            padding: '4px 8px', // Padding for the pill
                            marginLeft: 'auto', // Push to the far right
                          }}
                        >
                          {metrics.avgArabicaCost >= metrics.lastmonthAvgArabicaCost ? '+' : '-'}
                          {Math.abs(((metrics.avgArabicaCost - metrics.lastmonthAvgArabicaCost) / metrics.lastmonthAvgArabicaCost * 100).toFixed(2))}%
                        </Typography>
                      )}
                    </Typography>
                    <Typography variant="caption">{selectedRangeLabel}</Typography>
                    <ArabicaAvgCostMoM 
                      arabicaAvgCostData={dashboardData?.arabicaAvgCostMoM} 
                      loading={loading} 
                    />
                  </CardContent>
                </Card>
              </Grid>
              )}

              {/* Total Arabica Processed */}
              <Grid item xs={12} md={2.4} sx={{ height: { xs: 'auto', md: '220px' } }}> {/* Adjust the height as needed */}
                <Card variant="outlined" sx={{ height: '100%' }}> {/* Ensures the Card takes full height */}
                  <CardContent>
                    <Typography variant="body1">Total Arabica Processed</Typography>
                    <Typography variant="h4" sx={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                      {new Intl.NumberFormat('de-DE').format(metrics.totalArabicaProcessed)} kg
                      {metrics.lastmonthArabicaProcessed !== 0 && (
                        <Typography
                          variant="subtitle2"
                          color={metrics.totalArabicaProcessed >= metrics.lastmonthArabicaProcessed ? 'green' : 'red'}
                          sx={{
                            fontWeight: 'bold',
                            backgroundColor: metrics.totalArabicaProcessed >= metrics.lastmonthArabicaProcessed ? '#e0f4e0' : '#f4e0e0', // Light background color  
                            borderRadius: '12px', // Pill shape
                            padding: '4px 8px', // Padding for the pill
                            marginLeft: 'auto', // Push to the far right
                          }}
                        >
                          {metrics.totalArabicaProcessed >= metrics.lastmonthArabicaProcessed ? '+' : '-'}
                          {Math.abs(((metrics.totalArabicaProcessed - metrics.lastmonthArabicaProcessed) / metrics.lastmonthArabicaProcessed * 100).toFixed(2))}%
                        </Typography>
                      )}
                    </Typography>
                    <Typography variant="caption">{selectedRangeLabel}</Typography>
                    <ArabicaProcessedMoM timeframe={timeframe} />
                  </CardContent>
                </Card>
              </Grid>

              {/* Total Arabica Production */}
              <Grid item xs={12} md={2.4} sx={{ height: { xs: 'auto', md: '220px' } }}> {/* Adjust the height as needed */}
                <Card variant="outlined" sx={{ height: '100%' }}> {/* Ensures the Card takes full height */}
                  <CardContent>
                    <Typography variant="body1">Total Arabica Production</Typography>
                    <Typography variant="h4" sx={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                      {new Intl.NumberFormat('de-DE').format(metrics.totalArabicaProduction)} kg
                      {metrics.lastmonthArabicaProduction !== 0 && (
                        <Typography
                          variant="subtitle2"
                          color={metrics.totalArabicaProduction >= metrics.lastmonthArabicaProduction ? 'green' : 'red'}
                          sx={{
                            fontWeight: 'bold',
                            backgroundColor: metrics.totalArabicaProduction >= metrics.lastmonthArabicaProduction ? '#e0f4e0' : '#f4e0e0', // Light background color  
                            borderRadius: '12px', // Pill shape
                            padding: '4px 8px', // Padding for the pill
                            marginLeft: 'auto', // Push to the far right
                          }}
                        >
                          {metrics.totalArabicaProduction >= metrics.lastmonthArabicaProduction ? '+' : '-'}
                          {Math.abs(((metrics.totalArabicaProduction - metrics.lastmonthArabicaProduction) / metrics.lastmonthArabicaProduction * 100).toFixed(2))}%
                        </Typography>
                      )}
                    </Typography>
                    <Typography variant="caption">{selectedRangeLabel}</Typography>
                    <ArabicaProductionMoM timeframe={timeframe} />
                  </CardContent>
                </Card>
              </Grid>

              {/* Arabica Yield */}
              <Grid item xs={12} md={2.4} sx={{ height: { xs: 'auto', md: '220px' } }}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="body1">Arabica Yield</Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontSize: '4rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      {`${(100 / parseFloat(metrics.arabicaYield)).toFixed(1)}:1`}
                    </Typography>
                    <Typography variant="caption">All time</Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Total Arabica Land Covered */}
              <Grid item xs={12} md={2.4} sx={{ height: { xs: 'auto', md: '220px' } }}> {/* Adjust the height as needed */}
                <Card variant="outlined" sx={{ height: '100%' }}> {/* Ensures the Card takes full height */}
                  <CardContent>
                    <Typography variant="body1">Total Arabica Land Covered</Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontSize: '4rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <span>{new Intl.NumberFormat('de-DE').format(metrics.landCoveredArabica)}</span>
                      <span style={{ fontSize: '1rem' }}>m&sup2;</span>
                    </Typography>
                    <Typography variant="caption">All time</Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Arabica Farmers */}
              <Grid item xs={12} md={2.4} sx={{ height: { xs: 'auto', md: '220px' } }}> {/* Adjust the height as needed */}
                <Card variant="outlined" sx={{ height: '100%' }}> {/* Ensures the Card takes full height */}
                  <CardContent>
                    <Typography variant="body1">Arabica Farmers</Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontSize: '4rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <span>{new Intl.NumberFormat('de-DE').format(metrics.activeArabicaFarmers)}</span>
                      <span style={{ fontSize: '1rem' }}>Farmers</span>
                    </Typography>
                    <Typography variant="caption">All time</Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Pending Arabica QC */}
              <Grid item xs={12} md={2.4} sx={{ height: { xs: 'auto', md: '220px' } }}> {/* Adjust the height as needed */}
                <Card variant="outlined" sx={{ height: '100%' }}> {/* Ensures the Card takes full height */}
                  <CardContent>
                    <Typography variant="body1">Pending Arabica QC</Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontSize: '4rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <span>{new Intl.NumberFormat('de-DE').format(metrics.pendingArabicaQC)}</span>
                      <span style={{ fontSize: '1rem' }}>Batch</span>
                    </Typography>
                    <Typography variant="caption">All time</Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Pending Arabica Processing */}
              <Grid item xs={12} md={2.4} sx={{ height: { xs: 'auto', md: '220px' } }}> {/* Adjust the height as needed */}
                <Card variant="outlined" sx={{ height: '100%' }}> {/* Ensures the Card takes full height */}
                  <CardContent>
                    <Typography variant="body1">Pending Arabica Processing</Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontSize: '4rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <span>{new Intl.NumberFormat('de-DE').format(metrics.pendingArabicaProcessing)}</span>
                      <span style={{ fontSize: '1rem' }}>Batch</span>
                    </Typography>
                    <Typography variant="h4" sx={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                      {new Intl.NumberFormat('de-DE').format(metrics.pendingArabicaWeightProcessing)} kg
                    </Typography>
                    <Typography variant="caption">All time</Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Arabica Farmers Contribution Bar Chart */}
              <Grid item xs={12} md={6} sx={{ height: { xs: '600px', sm:'600px', md: '600px' } }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Arabica Farmers Contribution
                    </Typography>
                    <ArabicaFarmersContributionChart timeframe={timeframe} />
                  </CardContent>
                </Card>
              </Grid>

              {/* Arabica Cherry Quality Bar Chart */}
              <Grid item xs={12} md={6} sx={{ height: { xs: '600px', sm:'600px', md: '600px' } }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Arabica Cherry Quality
                    </Typography>
                    <ArabicaCherryQualityChart timeframe={timeframe} />
                  </CardContent>
                </Card>
              </Grid>

              {/* Total Arabica Production Bar Chart */}
              <Grid item xs={12} md={6} sx={{ height: { xs: '600px', sm:'600px', md: '600px' } }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Arabica Daily Production
                    </Typography>
                    <ArabicaCategoryChart timeframe={timeframe} />
                  </CardContent>
                </Card>
              </Grid>

              {/* Arabica Map */}
              <Grid item xs={12} md={6} sx={{ height: { xs: '600px', sm:'600px', md: '600px' } }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Arabica Coverage Map
                    </Typography>
                    <ArabicaMapComponent />
                  </CardContent>
                </Card>
              </Grid>

              {/* Arabica Target Achievement */}
              <Grid item xs={12} md={6} sx={{ height: { xs: '600px', sm:'600px', md: '600px' } }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Arabica Target Achievement
                    </Typography>
                    <ArabicaAchievementChart
                      arabicaAchievement={dashboardData?.arabicaAchievement}
                      loading={loading}
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* Arabica Sankey Chart */}
              <Grid 
                item 
                xs={12} 
                md={12} 
                sx={{ 
                  height: { 
                    xs: '300px', // Small screens
                    sm: '400px', // Tablets
                    md: '500px', // Laptops
                    lg: '600px', // Desktops
                    xl: '700px'  // Large monitors
                  } 
                }}
              >
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent sx={{ height: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                      Arabica Sankey Chart
                    </Typography>
                    {/* Pass height as a prop */}
                    <ArabicaSankeyChart height="100%" />
                  </CardContent>
                </Card>
              </Grid>

              {/* Arabica TradingView Chart */}
              {/* <Grid item xs={12} md={6} sx={{ height: { xs: '600px', sm:'600px', md: '600px' } }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Arabica Futures Price
                    </Typography>
                    <ArabicaTVWidget />
                  </CardContent>
                </Card>
              </Grid> */}

            </Grid>
          </Grid>



          {/* Robusta Section */}
          <Grid item xs={12} md={12}>
            <Grid container spacing={3}>


              {/* Total Robusta Weight */}
              <Grid item xs={12} md={2.4} sx={{ height: { xs: 'auto', md: '220px' } }}> {/* Adjust the height as needed */}
                <Card variant="outlined" sx={{ height: '100%' }}> {/* Ensures the Card takes full height */}
                  <CardContent>
                    <Typography variant="body1">Total Robusta Cherry Weight</Typography>
                    <Typography variant="h4" sx={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                      {new Intl.NumberFormat('de-DE').format(metrics.totalRobustaWeight)} kg
                      {metrics.lastmonthRobustaWeight !== 0 && (
                        <Typography
                          variant="subtitle2"
                          color={metrics.totalRobustaWeight >= metrics.lastmonthRobustaWeight ? 'green' : 'red'}
                          sx={{
                            fontWeight: 'bold',
                            backgroundColor: metrics.totalRobustaWeight >= metrics.lastmonthRobustaWeight ? '#e0f4e0' : '#f4e0e0', // Light background color
                            borderRadius: '12px', // Pill shape
                            padding: '4px 8px', // Padding for the pill
                            marginLeft: 'auto', // Push to the far right
                          }}
                        >
                          {metrics.totalRobustaWeight >= metrics.lastmonthRobustaWeight ? '+' : '-'}
                          {Math.abs(((metrics.totalRobustaWeight - metrics.lastmonthRobustaWeight) / metrics.lastmonthRobustaWeight * 100).toFixed(2))}%
                        </Typography>
                      )}
                    </Typography>
                    <Typography variant="caption">{selectedRangeLabel}</Typography>
                    <RobustaWeightMoM timeframe={timeframe} />
                  </CardContent>
                </Card>
              </Grid>

              {/* Total Robusta Cost */}
              {["admin", "manager"].includes(userRole) && (
              <Grid item xs={12} md={2.4} sx={{ height: { xs: 'auto', md: '220px' } }}> {/* Adjust the height as needed */}
                <Card variant="outlined" sx={{ height: '100%' }}> {/* Ensures the Card takes full height */}
                  <CardContent>
                    <Typography variant="body1">Total Robusta Cherry Cost</Typography>
                    <Typography variant="h4" sx={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                      {formatWeight(metrics.totalRobustaCost)}
                      {metrics.lastmonthRobustaCost !== 0 && (
                        <Typography
                          variant="subtitle2"
                          color={metrics.totalRobustaCost >= metrics.lastmonthRobustaCost ? 'red' : 'green'}
                          sx={{
                            fontWeight: 'bold',
                            backgroundColor: metrics.totalRobustaCost >= metrics.lastmonthRobustaCost ? '#f4e0e0' : '#e0f4e0', // Light background color
                            borderRadius: '12px', // Pill shape
                            padding: '4px 8px', // Padding for the pill
                            marginLeft: 'auto', // Push to the far right
                          }}
                        >
                          {metrics.totalRobustaCost >= metrics.lastmonthRobustaCost ? '+' : '-'}
                          {Math.abs(((metrics.totalRobustaCost - metrics.lastmonthRobustaCost) / metrics.lastmonthRobustaCost * 100).toFixed(2))}%
                        </Typography>
                      )}
                    </Typography>
                    <Typography variant="caption">{selectedRangeLabel}</Typography>
                    <RobustaCostMoM timeframe={timeframe} />
                  </CardContent>
                </Card>
              </Grid>
              )}

              {/* Average Robusta Cost */}
              {["admin", "manager"].includes(userRole) && (
              <Grid item xs={12} md={2.4} sx={{ height: { xs: 'auto', md: '220px' } }}> {/* Adjust the height as needed */}
                <Card variant="outlined" sx={{ height: '100%' }}> {/* Ensures the Card takes full height */}
                  <CardContent>
                    <Typography variant="body1">Average Robusta Cherry Cost</Typography>
                    <Typography variant="h4" sx={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                      Rp {new Intl.NumberFormat('de-DE').format(metrics.avgRobustaCost)} /kg
                      {metrics.lastmonthAvgRobustaCost !== 0 && (
                        <Typography
                          variant="subtitle2"
                          color={metrics.avgRobustaCost >= metrics.lastmonthAvgRobustaCost ? 'red' : 'green'}
                          sx={{
                            fontWeight: 'bold',
                            backgroundColor: metrics.avgRobustaCost >= metrics.lastmonthAvgRobustaCost ? '#f4e0e0' : '#e0f4e0', // Light background color 
                            borderRadius: '12px', // Pill shape
                            padding: '4px 8px', // Padding for the pill
                            marginLeft: 'auto', // Push to the far right
                          }}
                        >
                          {metrics.avgRobustaCost >= metrics.lastmonthAvgRobustaCost ? '+' : '-'}
                          {Math.abs(((metrics.avgRobustaCost - metrics.lastmonthAvgRobustaCost) / metrics.lastmonthAvgRobustaCost * 100).toFixed(2))}%
                        </Typography>
                      )}
                    </Typography>
                    <Typography variant="caption">{selectedRangeLabel}</Typography>
                    <RobustaAvgCostMoM timeframe={timeframe} />
                  </CardContent>
                </Card>
              </Grid>
              )}

              {/* Total Robusta Processed */}
              <Grid item xs={12} md={2.4} sx={{ height: { xs: 'auto', md: '220px' } }}> {/* Adjust the height as needed */}
                <Card variant="outlined" sx={{ height: '100%' }}> {/* Ensures the Card takes full height */}
                  <CardContent>
                    <Typography variant="body1">Total Robusta Processed</Typography>
                    <Typography variant="h4" sx={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                      {new Intl.NumberFormat('de-DE').format(metrics.totalRobustaProcessed)} kg
                      {metrics.lastmonthRobustaProcessed !== 0 && (
                        <Typography
                          variant="subtitle2"
                          color={metrics.totalRobustaProcessed >= metrics.lastmonthRobustaProcessed ? 'green' : 'red'}
                          sx={{
                            fontWeight: 'bold',
                            backgroundColor: metrics.totalRobustaProcessed >= metrics.lastmonthRobustaProcessed ? '#e0f4e0' : '#f4e0e0', // Light background color 
                            borderRadius: '12px', // Pill shape
                            padding: '4px 8px', // Padding for the pill
                            marginLeft: 'auto', // Push to the far right
                          }}
                        >
                          {metrics.totalRobustaProcessed >= metrics.lastmonthRobustaProcessed ? '+' : '-'}
                          {Math.abs(((metrics.totalRobustaProcessed - metrics.lastmonthRobustaProcessed) / metrics.lastmonthRobustaProcessed * 100).toFixed(2))}%
                        </Typography>
                      )}
                    </Typography>
                    <Typography variant="caption">{selectedRangeLabel}</Typography>
                    <RobustaProcessedMoM timeframe={timeframe} />
                  </CardContent>
                </Card>
              </Grid>

              {/* Total Robusta Production */}
              <Grid item xs={12} md={2.4} sx={{ height: { xs: 'auto', md: '220px' } }}> {/* Adjust the height as needed */}
                <Card variant="outlined" sx={{ height: '100%' }}> {/* Ensures the Card takes full height */}
                  <CardContent>
                    <Typography variant="body1">Total Robusta Production</Typography>
                    <Typography variant="h4" sx={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                      {new Intl.NumberFormat('de-DE').format(metrics.totalRobustaProduction)} kg
                      {metrics.lastmonthRobustaProduction !== 0 && (
                        <Typography
                          variant="subtitle2"
                          color={metrics.totalRobustaProduction >= metrics.lastmonthRobustaProduction ? 'green' : 'red'}
                          sx={{
                            fontWeight: 'bold',
                            backgroundColor: metrics.totalRobustaProduction >= metrics.lastmonthRobustaProduction ? '#e0f4e0' : '#f4e0e0', // Light background color 
                            borderRadius: '12px', // Pill shape
                            padding: '4px 8px', // Padding for the pill
                            marginLeft: 'auto', // Push to the far right
                          }}
                        >
                          {metrics.totalRobustaProduction >= metrics.lastmonthRobustaProduction ? '+' : '-'}
                          {Math.abs(((metrics.totalRobustaProduction - metrics.lastmonthRobustaProduction) / metrics.lastmonthRobustaProduction * 100).toFixed(2))}%
                        </Typography>
                      )}
                    </Typography>
                    <Typography variant="caption">{selectedRangeLabel}</Typography>
                    <RobustaProductionMoM timeframe={timeframe} />
                  </CardContent>
                </Card>
              </Grid>

              {/* Robusta Yield */}
              <Grid item xs={12} md={2.4} sx={{ height: { xs: 'auto', md: '220px' } }}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="body1">Robusta Yield</Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontSize: '4rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      {`${(100 / parseFloat(metrics.robustaYield)).toFixed(1)}:1`}
                    </Typography>
                    <Typography variant="caption">All time</Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Total Robusta Land Covered */}
              <Grid item xs={12} md={2.4} sx={{ height: { xs: 'auto', md: '220px' } }}> {/* Adjust the height as needed */}
                <Card variant="outlined" sx={{ height: '100%' }}> {/* Ensures the Card takes full height */}
                  <CardContent>
                    <Typography variant="body1">Total Robusta Land Covered</Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontSize: '4rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <span>{new Intl.NumberFormat('de-DE').format(metrics.landCoveredRobusta)}</span>
                      <span style={{ fontSize: '1rem' }}>m&sup2;</span>
                    </Typography>
                    <Typography variant="caption">All time</Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Robusta Farmers */}
              <Grid item xs={12} md={2.4} sx={{ height: { xs: 'auto', md: '220px' } }}> {/* Adjust the height as needed */}
                <Card variant="outlined" sx={{ height: '100%' }}> {/* Ensures the Card takes full height */}
                  <CardContent>
                    <Typography variant="body1">Robusta Farmers</Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontSize: '4rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <span>{new Intl.NumberFormat('de-DE').format(metrics.activeRobustaFarmers)}</span>
                      <span style={{ fontSize: '1rem' }}>Farmers</span>
                    </Typography>
                    <Typography variant="caption">All time</Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Pending Robusta QC */}
              <Grid item xs={12} md={2.4} sx={{ height: { xs: 'auto', md: '220px' } }}> {/* Adjust the height as needed */}
                <Card variant="outlined" sx={{ height: '100%' }}> {/* Ensures the Card takes full height */}
                  <CardContent>
                    <Typography variant="body1">Pending Robusta QC</Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontSize: '4rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <span>{new Intl.NumberFormat('de-DE').format(metrics.pendingRobustaQC)}</span>
                      <span style={{ fontSize: '1rem' }}>Batch</span>
                    </Typography>
                    <Typography variant="caption">All time</Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Pending Robusta Processing */}
              <Grid item xs={12} md={2.4} sx={{ height: { xs: 'auto', md: '220px' } }}> {/* Adjust the height as needed */}
                <Card variant="outlined" sx={{ height: '100%' }}> {/* Ensures the Card takes full height */}
                  <CardContent>
                    <Typography variant="body1">Pending Robusta Processing</Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontSize: '4rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <span>{new Intl.NumberFormat('de-DE').format(metrics.pendingRobustaProcessing)}</span>
                      <span style={{ fontSize: '1rem' }}>Batch</span>
                    </Typography>
                    <Typography variant="h4" sx={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                      {new Intl.NumberFormat('de-DE').format(metrics.pendingRobustaWeightProcessing)} kg
                    </Typography>
                    <Typography variant="caption">All time</Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Robusta Farmers Contribution Bar Chart */}
              <Grid item xs={12} md={6} sx={{ height: { xs: '600px', sm:'600px', md: '600px' } }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Robusta Farmers Contribution
                    </Typography>
                    <RobustaFarmersContributionChart timeframe={timeframe} />
                  </CardContent>
                </Card>
              </Grid>

              {/* Robusta Cherry Quality Bar Chart */}
              <Grid item xs={12} md={6} sx={{ height: { xs: '600px', sm:'600px', md: '600px' } }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Robusta Cherry Quality
                    </Typography>
                    <RobustaCherryQualityChart timeframe={timeframe} />
                  </CardContent>
                </Card>
              </Grid>

              {/* Total Robusta Production Bar Chart */}
              <Grid item xs={12} md={6} sx={{ height: { xs: '600px', sm:'600px', md: '600px' } }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                    Robusta Daily Production
                    </Typography>
                    <RobustaCategoryChart timeframe={timeframe} />
                  </CardContent>
                </Card>
              </Grid>

              {/* Robusta Map */}
              <Grid item xs={12} md={6} sx={{ height: { xs: '600px', sm:'600px', md: '600px' } }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Robusta Coverage Map
                    </Typography>
                    <RobustaMapComponent />
                  </CardContent>
                </Card>
              </Grid>

              {/* Robusta Target Achievement */}
              <Grid item xs={12} md={6} sx={{ height: { xs: '600px', sm:'600px', md: '600px' } }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Robusta Target Achievement
                    </Typography>
                    <RobustaAchievementChart
                      robustaAchievement={dashboardData?.robustaAchievement}
                      loading={loading}
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* Robusta Sankey Chart */}
              <Grid 
                item 
                xs={12} 
                md={12} 
                sx={{ 
                  height: { 
                    xs: '300px', // Small screens
                    sm: '400px', // Tablets
                    md: '500px', // Laptops
                    lg: '600px', // Desktops
                    xl: '700px'  // Large monitors
                  } 
                }}
              >
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent sx={{ height: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                      Robusta Sankey Chart
                    </Typography>
                    {/* Pass height as a prop */}
                    <RobustaSankeyChart height="100%" />
                  </CardContent>
                </Card>
              </Grid>

              {/* Robusta TradingView Chart */}
              {/* <Grid item xs={12} md={6} sx={{ height: { xs: '600px', sm:'600px', md: '600px' } }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Robusta Futures Price
                    </Typography>
                    <RobustaTVWidget />
                  </CardContent>
                </Card>
              </Grid> */}

            </Grid>
          </Grid>

        </Grid>
      </LocalizationProvider>
    </div>
  );
}

export default Dashboard;