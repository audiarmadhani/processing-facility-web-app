"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { TextField, Dialog, DialogContent, DialogTitle, Button } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
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
  OutlinedInput,
  Box,
  Snackbar,
  Alert
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'; // Added for pop-up chart

import TotalBatchesChart from './charts/TotalBatchesChart';
import TotalCostChart from './charts/TotalCostChart';
import ArabicaWeightMoM from './charts/ArabicaWeightMoM';
import RobustaWeightMoM from './charts/RobustaWeightMoM';
import ArabicaCostMoM from './charts/ArabicaCostMoM';
import RobustaCostMoM from './charts/RobustaCostMoM';
import ArabicaAvgCostMoM from './charts/ArabicaAvgCostMoM';
import RobustaAvgCostMoM from './charts/RobustaAvgCostMoM';
import ArabicaProcessedMoM from './charts/ArabicaProcessedMoM';
import RobustaProcessedMoM from './charts/RobustaProcessedMoM';
import ArabicaProductionMoM from './charts/ArabicaProductionMoM';
import RobustaProductionMoM from './charts/RobustaProductionMoM';
import ArabicaCategoryChart from './charts/ArabicaCategoryChart';
import RobustaCategoryChart from './charts/RobustaCategoryChart';
import ArabicaCherryQualityChart from './charts/ArabicaCherryQualityChart';
import RobustaCherryQualityChart from './charts/RobustaCherryQualityChart';
import ArabicaFarmersContributionChart from './charts/ArabicaFarmersContributionChart';
import RobustaFarmersContributionChart from './charts/RobustaFarmersContributionChart';

const ArabicaMapComponent = dynamic(() => import("./charts/ArabicaMap"), { ssr: false });
const RobustaMapComponent = dynamic(() => import("./charts/RobustaMap"), { ssr: false });

function Dashboard() {
  const { data: session } = useSession();
  const userRole = session?.user?.role || "user";

  const [metrics, setMetrics] = useState({
    totalBatches: 0, 
    totalArabicaWeight: 0, 
    totalRobustaWeight: 0, 
    totalArabicaCost: 0, 
    totalRobustaCost: 0,
    lastmonthArabicaWeight: 0, 
    lastmonthRobustaWeight: 0, 
    lastmonthArabicaCost: 0, 
    lastmonthRobustaCost: 0,
    totalWeight: 0,
    totalCost: 0,
    activeFarmers: 0,
    pendingQC: 0,
    pendingProcessing: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [arabicaTargets, setArabicaTargets] = useState([]);
  const [heqaTargets, setHeqaTargets] = useState([]);
  const [robustaTargets, setRobustaTargets] = useState([]);
  const [landTargets, setLandTargets] = useState([]);
  const [isLoadingTargets, setIsLoadingTargets] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  // New state for batch tracking
  const [batchTrackingData, setBatchTrackingData] = useState([]);
  const [isLoadingBatchTracking, setIsLoadingBatchTracking] = useState(false);
  const [batchFilter, setBatchFilter] = useState('');
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  const formatWeight = (weight) => {
    if (weight >= 1e9) {
      return `${(weight / 1e9).toFixed(2)} B`;
    } else if (weight >= 1e6) {
      return `${(weight / 1e6).toFixed(2)} M`;
    } else if (weight >= 1e3) {
      return `${(weight / 1e3).toFixed(2)} K`;
    } else {
      return `Rp ${new Intl.NumberFormat('de-DE').format(weight)} /kg`;
    }
  };

  const [timeframe, setTimeframe] = useState('this_month');

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

  const selectedRangeLabel = timeframeLabels[timeframe];

  // Fetch Batch Tracking Data
  const fetchBatchTrackingData = useCallback(async () => {
    console.log('Starting fetchBatchTrackingData');
    setIsLoadingBatchTracking(true);
    try {
      const url = batchFilter
        ? `https://processing-facility-backend.onrender.com/api/batch-tracking?batchNumbers=${encodeURIComponent(batchFilter)}`
        : 'https://processing-facility-backend.onrender.com/api/batch-tracking';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Raw Batch Tracking API response:', data);
      const formattedData = data.map((row, index) => ({
        id: index,
        ...row,
        processingType: row.processingType === 'Unknown' ? 'N/A' : row.processingType,
      }));
      console.log('Setting batchTrackingData:', formattedData);
      setBatchTrackingData(formattedData);
    } catch (err) {
      console.error('Error fetching batch tracking data:', err);
      setError(err.message || 'Failed to fetch batch tracking data');
      setOpenSnackbar(true);
      setBatchTrackingData([]);
    } finally {
      setIsLoadingBatchTracking(false);
    }
  }, [batchFilter]);

  // Fetch Arabica targets
  const fetchArabicaTargets = useCallback(async () => {
    console.log('Starting fetchArabicaTargets');
    setIsLoadingTargets(true);
    try {
      const response = await fetch('https://processing-facility-backend.onrender.com/api/arabica-targets');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Raw API response:', data);
      if (!data.arabicaTarget || !Array.isArray(data.arabicaTarget)) {
        throw new Error('Invalid response format: arabicaTarget array not found');
      }
      const formattedData = data.arabicaTarget.map((row, index) => {
        const formattedRow = {
          id: index,
          processingType: row.processingType,
          cherryNow: parseFloat(row.cherryNow) || null,
          projectedGB: parseFloat(row.projectedGB) || null,
          cherryTarget: parseFloat(row.cherryTarget) || null,
          gbTarget: parseFloat(row.gbTarget) || null,
          cherryDeficit: parseFloat(row.cherryDeficit) || null,
          cherryperdTarget: parseFloat(row.cherryperdTarget) || null,
        };
        console.log('Formatted row:', formattedRow);
        return formattedRow;
      });
      console.log('Setting arabicaTargets:', formattedData);
      setArabicaTargets(formattedData);
    } catch (err) {
      console.error('Error fetching Arabica targets:', err);
      setError(err.message || 'Failed to fetch Arabica targets');
      setOpenSnackbar(true);
      setArabicaTargets([]);
    } finally {
      setIsLoadingTargets(false);
    }
  }, []);

  // Fetch Heqa targets
  const fetchHeqaTargets = useCallback(async () => {
    console.log('Starting fetchHeqaTargets');
    setIsLoadingTargets(true);
    try {
      const response = await fetch('https://processing-facility-backend.onrender.com/api/heqa-targets');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Raw API response:', data);
      if (!data.heqaTarget || !Array.isArray(data.heqaTarget)) {
        throw new Error('Invalid response format: heqaTarget array not found');
      }
      const formattedData = data.heqaTarget.map((row, index) => {
        const formattedRow = {
          id: index,
          productLine: row.productLine,
          cherryNow: parseFloat(row.cherryNow) || null,
          projectedGB: parseFloat(row.projectedGB) || null,
          cherryTarget: parseFloat(row.cherryTarget) || null,
          gbTarget: parseFloat(row.gbTarget) || null,
          cherryDeficit: parseFloat(row.cherryDeficit) || null,
          cherryperdTarget: parseFloat(row.cherryperdTarget) || null,
        };
        console.log('Formatted row:', formattedRow);
        return formattedRow;
      });
      console.log('Setting heqaTargets:', formattedData);
      setHeqaTargets(formattedData);
    } catch (err) {
      console.error('Error fetching Heqa targets:', err);
      setError(err.message || 'Failed to fetch Heqa targets');
      setOpenSnackbar(true);
      setHeqaTargets([]);
    } finally {
      setIsLoadingTargets(false);
    }
  }, []);

  // Fetch Robusta targets
  const fetchRobustaTargets = useCallback(async () => {
    console.log('Starting fetchRobustaTargets');
    setIsLoadingTargets(true);
    try {
      const response = await fetch('https://processing-facility-backend.onrender.com/api/robusta-targets');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Raw Robusta API response:', data);
      if (!data.robustaTarget || !Array.isArray(data.robustaTarget)) {
        throw new Error('Invalid response format: robustaTarget array not found');
      }
      const formattedData = data.robustaTarget.map((row, index) => {
        const formattedRow = {
          id: index,
          processingType: row.processingType,
          cherryNow: parseFloat(row.cherryNow) || null,
          projectedGB: parseFloat(row.projectedGB) || null,
          cherryTarget: parseFloat(row.cherryTarget) || null,
          gbTarget: parseFloat(row.gbTarget) || null,
          cherryDeficit: parseFloat(row.cherryDeficit) || null,
          cherryperdTarget: parseFloat(row.cherryperdTarget) || null,
        };
        console.log('Formatted Robusta row:', formattedRow);
        return formattedRow;
      });
      console.log('Setting robustaTargets:', formattedData);
      setRobustaTargets(formattedData);
    } catch (err) {
      console.error('Error fetching Robusta targets:', err);
      setError(err.message || 'Failed to fetch Robusta targets');
      setOpenSnackbar(true);
      setRobustaTargets([]);
    } finally {
      setIsLoadingTargets(false);
    }
  }, []);

  // Fetch Land targets
  const fetchLandTargets = useCallback(async () => {
    console.log('Starting fetchLandTargets');
    setIsLoadingTargets(true);
    try {
      const response = await fetch('https://processing-facility-backend.onrender.com/api/land-targets');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Raw API response:', data);
      if (!data.landTarget || !Array.isArray(data.landTarget)) {
        throw new Error('Invalid response format: landTarget array not found');
      }
      const formattedData = data.landTarget.map((row, index) => {
        const formattedRow = {
          id: index,
          farmerName: row.farmerName,
          brokerName: row.brokerName || null,
          contractValue: parseFloat(row.contractValue) || null,
          cherryEstimate: parseFloat(row.cherryEstimate) || null,
          gbEstimate: parseFloat(row.gbEstimate) || null,
          currentcherrytotal: parseFloat(row.currentcherrytotal) || null,
          difference: parseFloat(row.difference) || null,
        };
        console.log('Formatted row:', formattedRow);
        return formattedRow;
      });
      console.log('Setting landTargets:', formattedData);
      setLandTargets(formattedData);
    } catch (err) {
      console.error('Error fetching land targets:', err);
      setError(err.message || 'Failed to fetch land targets');
      setOpenSnackbar(true);
      setLandTargets([]);
    } finally {
      setIsLoadingTargets(false);
    }
  }, []);

  // Fetch metrics and targets
  useEffect(() => {
    const fetchData = async () => {
      console.log('Starting fetchData');
      setLoading(true);
      setError(null);

      let apiUrl = `https://processing-facility-backend.onrender.com/api/dashboard-metrics?timeframe=${timeframe}`;

      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        console.log('Dashboard metrics:', jsonData);
        setMetrics(jsonData);
      } catch (err) {
        console.error("Error fetching dashboard metrics:", err);
        setError(err.message);
        setOpenSnackbar(true);
      } finally {
        setLoading(false);
      }
    };

    const fetchAllData = async () => {
      await fetchData();
      await fetchArabicaTargets();
      await fetchRobustaTargets();
      await fetchLandTargets();
      await fetchHeqaTargets();
      await fetchBatchTrackingData(); // Added batch tracking fetch
    };

    fetchAllData();
  }, [timeframe, fetchArabicaTargets, fetchRobustaTargets, fetchLandTargets, fetchHeqaTargets, fetchBatchTrackingData]);

  const handleTimeframeChange = (event) => {
    setTimeframe(event.target.value);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
    setError(null);
  };

  const handleBatchFilterChange = (event) => {
    setBatchFilter(event.target.value);
  };

  const handleBatchClick = (batch) => {
    setSelectedBatch(batch);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBatch(null);
  };

  // Prepare data for the line chart in the dialog
  const getChartData = (batchNumber) => {
    if (!batchNumber) return { nodes: [], links: [], title: '' };

    // Filter all batch entries with the same batchNumber
    const batchEntries = batchTrackingData.filter(b => b.batchNumber === batchNumber);
    if (batchEntries.length === 0) return { nodes: [], links: [], title: '' };

    // Get unique processing types and grades
    const processingTypes = [...new Set(batchEntries.map(b => b.processingType))];
    const grades = [...new Set(batchEntries.map(b => b.grade))];
    const title = `Batch ${batchNumber} (${processingTypes.join(', ')}, Grade ${grades.join(', ')})`;

    // Define processing stages
    const stages = [
      { name: 'Receiving', weightKey: 'receiving_weight', dateKey: 'receiving_date' },
      { name: 'Preprocessing', weightKey: 'preprocessing_weight', dateKey: 'preprocessing_date' },
      { name: 'Wet Mill', weightKey: 'wetmill_weight', dateKey: 'wetmill_weight_date' },
      { name: 'Fermentation', weightKey: 'fermentation_weight', dateKey: 'fermentation_weight_date' },
      { name: 'Drying', weightKey: 'drying_weight', dateKey: 'drying_weight_date' },
      { name: 'Dry Mill', weightKey: 'dry_mill_weight', dateKey: 'dry_mill_weight_date' },
    ];

    // Create nodes and links for the chart
    const nodes = [];
    const links = [];
    let nodeId = 0;

    // Add nodes for shared stages (Receiving, Preprocessing)
    const sharedStages = ['Receiving', 'Preprocessing'];
    sharedStages.forEach((stageName, stageIndex) => {
      const stage = stages.find(s => s.name === stageName);
      // Sum weights for shared stages across all entries
      const totalWeight = batchEntries.reduce((sum, entry) => {
        const weight = parseFloat(entry[stage.weightKey]);
        return isNaN(weight) ? sum : sum + weight;
      }, 0);
      if (!isNaN(totalWeight)) {
        nodes.push({
          id: nodeId,
          name: stageName,
          weight: totalWeight,
          y: stageIndex * 100, // Vertical positioning
          x: 0, // Center for shared stages
        });
        if (stageIndex > 0) {
          links.push({
            source: nodeId - 1,
            target: nodeId,
            curve: 'basis',
          });
        }
        nodeId++;
      }
    });

    // Handle splits after Preprocessing
    const splitStageIndex = sharedStages.length; // Start splitting at Wet Mill
    batchEntries.forEach((entry, entryIndex) => {
      const processingType = entry.processingType;
      // Start at Wet Mill or later stages
      stages.slice(splitStageIndex).forEach((stage, stageIndex) => {
        const weight = parseFloat(entry[stage.weightKey]);
        if (!isNaN(weight) && weight > 0 && entry[stage.weightKey] !== 'N/A') {
          // Skip Fermentation for Natural/CM Natural
          if (stage.name === 'Fermentation' && ['Natural', 'CM Natural'].includes(processingType)) {
            return;
          }
          // Skip Wet Mill for Natural/Honey if not applicable
          if (stage.name === 'Wet Mill' && ['Natural', 'Honey'].includes(processingType) && entry[stage.weightKey] === 'N/A') {
            return;
          }
          const node = {
            id: nodeId,
            name: stage.name,
            weight: weight,
            processingType: processingType,
            y: (stageIndex + splitStageIndex) * 100,
            x: entryIndex * 100 - ((batchEntries.length - 1) * 50), // Spread branches horizontally
          };
          nodes.push(node);

          // Link to previous node (Preprocessing or previous stage in the same branch)
          if (stageIndex === 0) {
            // Link to Preprocessing (last shared stage)
            const preprocessingNode = nodes.find(n => n.name === 'Preprocessing');
            if (preprocessingNode) {
              links.push({
                source: preprocessingNode.id,
                target: nodeId,
                curve: 'basis',
              });
            }
          } else {
            // Link to previous stage in the same branch
            const prevStage = stages[stageIndex + splitStageIndex - 1];
            const prevNode = nodes.find(n => n.name === prevStage.name && n.processingType === processingType);
            if (prevNode) {
              links.push({
                source: prevNode.id,
                target: nodeId,
                curve: 'basis',
              });
            }
          }
          nodeId++;
        }
      });
    });

    return { nodes, links, title };
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!session?.user || !['admin', 'manager', 'staff', 'receiving'].includes(session.user.role)) {
    return (
      <Typography variant="h6">
        Access Denied. You do not have permission to view this page.
      </Typography>
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

          {/* Batch Tracking Filter */}
          <Grid item xs={6} md={2.4}>
            <TextField
              label="Filter Batch Numbers (comma-separated)"
              value={batchFilter}
              onChange={handleBatchFilterChange}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  fetchBatchTrackingData();
                }
              }}
              fullWidth
              variant="outlined"
            />
          </Grid>

          {/* Batch Tracking Table */}
          <Grid item xs={12} md={12} sx={{ height: { xs: '600px', sm: '600px', md: '600px' } }}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent sx={{ height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Batch Tracking
                </Typography>
                {isLoadingBatchTracking ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
                    <CircularProgress />
                  </Box>
                ) : batchTrackingData.length === 0 ? (
                  <Typography variant="body1" color="error">
                    No batch tracking data available. Please try again later or check batch numbers.
                  </Typography>
                ) : (
                  <DataGrid
                    rows={batchTrackingData}
                    columns={[
                      { 
                        field: 'batchNumber', 
                        headerName: 'Batch Number', 
                        width: 180,
                        renderCell: (params) => (
                          <Button
                            variant="text"
                            color="primary"
                            onClick={() => handleBatchClick(params.row)}
                          >
                            {params.value}
                          </Button>
                        ),
                      },
                      { field: 'farmerName', headerName: 'Farmer Name', width: 150 },
                      { field: 'processingType', headerName: 'Processing Type', width: 140 },
                      { field: 'position', headerName: 'Position', width: 150 },
                      { field: 'status', headerName: 'Status', width: 120 },
                      { 
                        field: 'receiving_weight', 
                        headerName: 'Receiving Weight (kg)', 
                        width: 160,
                        cellClassName: (params) => (params.value === 'N/A' ? 'null-weight' : ''),
                        valueFormatter: (value) => value === 'N/A' ? 'N/A' : new Intl.NumberFormat('de-DE').format(parseFloat(value)),
                      },
                      { 
                        field: 'preprocessing_weight', 
                        headerName: 'Preprocessing Weight (kg)', 
                        width: 180,
                        cellClassName: (params) => (params.value === 'N/A' ? 'null-weight' : ''),
                        valueFormatter: (value) => value === 'N/A' ? 'N/A' : new Intl.NumberFormat('de-DE').format(parseFloat(value)),
                      },
                      { 
                        field: 'wetmill_weight', 
                        headerName: 'Wet Mill Weight (kg)', 
                        width: 160,
                        cellClassName: (params) => (params.value === 'N/A' ? 'null-weight' : ''),
                        valueFormatter: (value) => value === 'N/A' ? 'N/A' : new Intl.NumberFormat('de-DE').format(parseFloat(value)),
                      },
                      { 
                        field: 'fermentation_weight', 
                        headerName: 'Fermentation Weight (kg)', 
                        width: 180,
                        cellClassName: (params) => (params.value === 'N/A' ? 'null-weight' : ''),
                        valueFormatter: (value) => value === 'N/A' ? 'N/A' : new Intl.NumberFormat('de-DE').format(parseFloat(value)),
                      },
                      { 
                        field: 'drying_weight', 
                        headerName: 'Drying Weight (kg)', 
                        width: 150,
                        cellClassName: (params) => (params.value === 'N/A' ? 'null-weight' : ''),
                        valueFormatter: (value) => value === 'N/A' ? 'N/A' : new Intl.NumberFormat('de-DE').format(parseFloat(value)),
                      },
                      { 
                        field: 'dry_mill_weight', 
                        headerName: 'Dry Mill Weight (kg)', 
                        width: 150,
                        cellClassName: (params) => (params.value === 'N/A' ? 'null-weight' : ''),
                        valueFormatter: (value) => value === 'N/A' ? 'N/A' : new Intl.NumberFormat('de-DE').format(parseFloat(value)),
                      },
                    ]}
                    pageSizeOptions={[20, 50, 200]}
                    slots={{ toolbar: GridToolbar }}
                    sx={{
                      height: '100%',
                      border: '1px solid rgba(0,0,0,0.12)',
                      '& .MuiDataGrid-footerContainer': { borderTop: 'none' },
                      '& .null-weight': { color: 'red', fontWeight: 'bold' },
                      '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f5f5f5' },
                      '& .MuiDataGrid-cell': { fontSize: '0.85rem' },
                    }}
                    rowHeight={32}
                    disableRowSelectionOnClick
                    initialState={{
                      pagination: { paginationModel: { pageSize: 50 } },
                      sorting: {
                        sortModel: [{ field: 'batchNumber', sort: 'asc' }],
                      },
                    }}
                    localeText={{
                      noRowsLabel: 'No batch tracking data available'
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Batch Tracking Dialog */}
          <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
            <DialogTitle>
              {selectedBatch && getChartData(selectedBatch.batch_number).title}
            </DialogTitle>
            <DialogContent>
              {selectedBatch && (
                <LineChart
                  width={800}
                  height={600}
                  margin={{ top: 20, right: 100, left: 100, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="x" hide />
                  <YAxis type="number" dataKey="y" hide reversed />
                  {getChartData(selectedBatch.batch_number).links.map((link, index) => (
                    <Line
                      key={`line-${index}`}
                      data={getChartData(selectedBatch.batch_number).nodes.filter(n => [link.source, link.target].includes(n.id))}
                      dataKey="x"
                      type="basis"
                      stroke="#8884d8"
                      dot={false}
                      isAnimationActive={false}
                    />
                  ))}
                  <Scatter
                    data={getChartData(selectedBatch.batch_number).nodes}
                    fill="#8884d8"
                  >
                    {getChartData(selectedBatch.batch_number).nodes.map((node, index) => (
                      <g key={`node-${index}`}>
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={8}
                          fill="#8884d8"
                        />
                        <text
                          x={node.x + 10}
                          y={node.y}
                          fill="#000"
                          fontSize={12}
                          textAnchor="start"
                        >
                          {`${node.name}: ${node.weight.toFixed(2)} kg${node.processingType ? ` (${node.processingType})` : ''}`}
                        </text>
                      </g>
                    ))}
                  </Scatter>
                  <Tooltip
                    formatter={(value, name, props) => [
                      `${props.payload.weight.toFixed(2)} kg`,
                      props.payload.name + (props.payload.processingType ? ` (${props.payload.processingType})` : ''),
                    ]}
                  />
                </LineChart>
              )}
              <Button onClick={handleCloseDialog} variant="contained" sx={{ mt: 2 }}>
                Close
              </Button>
            </DialogContent>
          </Dialog>

          {/* Arabica Section */}
          <Grid item xs={12} md={12}>
            <Grid container spacing={3}>

              {/* Land Target Achievement */}
              <Grid item xs={12} md={12} sx={{ height: { xs: '600px', sm: '600px', md: '600px' } }}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent sx={{ height: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                      Land Target Achievement
                    </Typography>
                    {isLoadingTargets ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <CircularProgress />
                      </Box>
                    ) : landTargets.length === 0 ? (
                      <Typography variant="body1" color="error">
                        No Land target data available. Please try again later.
                      </Typography>
                    ) : (
                      <>
                        <DataGrid
                          rows={landTargets}
                          columns={[
                            { 
                              field: 'farmerName', 
                              headerName: 'Farmer Name', 
                              width: 250,
                            },
                            { 
                              field: 'brokerName', 
                              headerName: 'Broker', 
                              width: 100,
                            },
                            { 
                              field: 'contractValue', 
                              headerName: 'Contract Value (Rp)', 
                              width: 200,
                              type: 'number',
                              valueFormatter: (value) => 
                                value != null 
                                  ? new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(value) 
                                  : 'N/A',
                            },
                            { 
                              field: 'cherryEstimate', 
                              headerName: 'Cherry Estimate (kg)', 
                              width: 180,
                              type: 'number',
                              valueFormatter: (value) => 
                                value != null 
                                  ? new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(value) 
                                  : 'N/A',
                            },
                            { 
                              field: 'gbEstimate', 
                              headerName: 'GB Estimate (kg)', 
                              width: 150,
                              type: 'number',
                              valueFormatter: (value) => 
                                value != null 
                                  ? new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(value) 
                                  : 'N/A',
                            },
                            { 
                              field: 'currentcherrytotal', 
                              headerName: 'Current Cherry Total (kg)', 
                              width: 200,
                              type: 'number',
                              valueFormatter: (value) => 
                                value != null 
                                  ? new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(value) 
                                  : 'N/A',
                            },
                            { 
                              field: 'difference', 
                              headerName: 'Deficit (kg)', 
                              width: 200,
                              type: 'number',
                              valueFormatter: (value) => 
                                value != null 
                                  ? new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(value) 
                                  : 'N/A',
                              cellClassName: (params) => (params.value != null && params.value < 0 ? 'negative-deficit' : '')
                            },
                          ]}
                          pageSizeOptions={[20, 50, 200]}
                          slots={{ toolbar: GridToolbar }}
                          sx={{
                            height: '100%',
                            border: '1px solid rgba(0,0,0,0.12)',
                            '& .MuiDataGrid-footerContainer': { borderTop: 'none' },
                            '& .negative-deficit': { color: 'red', fontWeight: 'bold' },
                            '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f5f5f5' },
                            '& .MuiDataGrid-cell': { fontSize: '0.85rem' },
                          }}
                          rowHeight={32}
                          disableRowSelectionOnClick
                          initialState={{
                            pagination: { paginationModel: { pageSize: 50 } },
                            sorting: {
                              sortModel: [{ field: 'processingType', sort: 'asc' }],
                            },
                          }}
                          localeText={{
                            noRowsLabel: 'No data available for Arabica targets'
                          }}
                        />
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
                
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
                      {new Intl.NumberFormat('de-DE').format(metrics.avgArabicaCost)} /kg
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
                    <ArabicaAvgCostMoM timeframe={timeframe} />
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

              {/* Total Arabica Production Bar Chart
              <Grid item xs={12} md={6} sx={{ height: { xs: '600px', sm:'600px', md: '600px' } }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Arabica Daily Production
                    </Typography>
                    <ArabicaCategoryChart timeframe={timeframe} />
                  </CardContent>
                </Card>
              </Grid> */}

              {/* Arabica Target Achievement */}
              {/* <Grid item xs={12} md={6} sx={{ height: { xs: '600px', sm:'600px', md: '600px' } }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Arabica Target Achievement
                    </Typography>
                    <ArabicaAchievementChart timeframe={timeframe}/>
                  </CardContent>
                </Card>
              </Grid> */}

              {/* Arabica Target Achievement */}
              <Grid item xs={12} md={12} sx={{ height: { xs: '400px', sm: '400px', md: '400px' } }}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent sx={{ height: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                      Arabica Target Achievement
                    </Typography>
                    {isLoadingTargets ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
                        <CircularProgress />
                      </Box>
                    ) : arabicaTargets.length === 0 ? (
                      <Typography variant="body1" color="error">
                        No Arabica target data available. Please try again later.
                      </Typography>
                    ) : (
                      <>
                        <DataGrid
                          rows={arabicaTargets}
                          columns={[
                            { 
                              field: 'processingType', 
                              headerName: 'Processing Type', 
                              width: 180,
                            },
                            { 
                              field: 'cherryNow', 
                              headerName: 'Cherry Now (kg)', 
                              width: 150,
                              type: 'number',
                              valueFormatter: (value) => 
                                value != null 
                                  ? new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(value) 
                                  : 'N/A',
                            },
                            { 
                              field: 'projectedGB', 
                              headerName: 'Projected GB (kg)', 
                              width: 150,
                              type: 'number',
                              valueFormatter: (value) => 
                                value != null 
                                  ? new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(value) 
                                  : 'N/A',
                            },
                            { 
                              field: 'cherryTarget', 
                              headerName: 'Cherry Target (kg)', 
                              width: 150,
                              type: 'number',
                              valueFormatter: (value) => 
                                value != null 
                                  ? new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(value) 
                                  : 'N/A',
                            },
                            { 
                              field: 'gbTarget', 
                              headerName: 'GB Target (kg)', 
                              width: 150,
                              type: 'number',
                              valueFormatter: (value) => 
                                value != null 
                                  ? new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(value) 
                                  : 'N/A',
                            },
                            { 
                              field: 'cherryDeficit', 
                              headerName: 'Cherry Deficit (kg)', 
                              width: 150,
                              type: 'number',
                              valueFormatter: (value) => 
                                value != null 
                                  ? new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(value) 
                                  : 'N/A',
                              cellClassName: (params) => (params.value != null && params.value < 0 ? 'negative-deficit' : '')
                            },
                            { 
                              field: 'cherryperdTarget', 
                              headerName: 'Cherry/Day Target (kg)', 
                              width: 250,
                              type: 'number',
                              valueFormatter: (value) => 
                                value != null 
                                  ? new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(value) 
                                  : 'N/A',
                              cellClassName: (params) => (params.value != null && params.value < 0 ? 'negative-deficit' : '')
                            },
                          ]}
                          pageSizeOptions={[5]}
                          slots={{ toolbar: GridToolbar }}
                          sx={{
                            height: '80%',
                            border: '1px solid rgba(0,0,0,0.12)',
                            '& .MuiDataGrid-footerContainer': { borderTop: 'none' },
                            '& .negative-deficit': { color: 'red', fontWeight: 'bold' },
                            '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f5f5f5' },
                            '& .MuiDataGrid-cell': { fontSize: '0.85rem' },
                          }}
                          rowHeight={32}
                          disableRowSelectionOnClick
                          initialState={{
                            pagination: { paginationModel: { pageSize: 5 } },
                            sorting: {
                              sortModel: [{ field: 'processingType', sort: 'asc' }],
                            },
                          }}
                          localeText={{
                            noRowsLabel: 'No data available for Arabica targets'
                          }}
                        />
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Arabica Target Achievement */}
              <Grid item xs={12} md={12} sx={{ height: { xs: '400px', sm: '400px', md: '400px' } }}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent sx={{ height: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                      HEQA Target Achievement
                    </Typography>
                    {isLoadingTargets ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
                        <CircularProgress />
                      </Box>
                    ) : heqaTargets.length === 0 ? (
                      <Typography variant="body1" color="error">
                        No HEQA target data available. Please try again later.
                      </Typography>
                    ) : (
                      <>
                        <DataGrid
                          rows={heqaTargets}
                          columns={[
                            { 
                              field: 'productLine', 
                              headerName: 'Product Line', 
                              width: 180,
                            },
                            { 
                              field: 'cherryNow', 
                              headerName: 'Cherry Now (kg)', 
                              width: 150,
                              type: 'number',
                              valueFormatter: (value) => 
                                value != null 
                                  ? new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(value) 
                                  : 'N/A',
                            },
                            { 
                              field: 'projectedGB', 
                              headerName: 'Projected GB (kg)', 
                              width: 150,
                              type: 'number',
                              valueFormatter: (value) => 
                                value != null 
                                  ? new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(value) 
                                  : 'N/A',
                            },
                            { 
                              field: 'cherryTarget', 
                              headerName: 'Cherry Target (kg)', 
                              width: 150,
                              type: 'number',
                              valueFormatter: (value) => 
                                value != null 
                                  ? new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(value) 
                                  : 'N/A',
                            },
                            { 
                              field: 'gbTarget', 
                              headerName: 'GB Target (kg)', 
                              width: 150,
                              type: 'number',
                              valueFormatter: (value) => 
                                value != null 
                                  ? new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(value) 
                                  : 'N/A',
                            },
                            { 
                              field: 'cherryDeficit', 
                              headerName: 'Cherry Deficit (kg)', 
                              width: 150,
                              type: 'number',
                              valueFormatter: (value) => 
                                value != null 
                                  ? new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(value) 
                                  : 'N/A',
                              cellClassName: (params) => (params.value != null && params.value < 0 ? 'negative-deficit' : '')
                            },
                            { 
                              field: 'cherryperdTarget', 
                              headerName: 'Cherry/Day Target (kg)', 
                              width: 250,
                              type: 'number',
                              valueFormatter: (value) => 
                                value != null 
                                  ? new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(value) 
                                  : 'N/A',
                              cellClassName: (params) => (params.value != null && params.value < 0 ? 'negative-deficit' : '')
                            },
                          ]}
                          pageSizeOptions={[5]}
                          slots={{ toolbar: GridToolbar }}
                          sx={{
                            height: '80%',
                            border: '1px solid rgba(0,0,0,0.12)',
                            '& .MuiDataGrid-footerContainer': { borderTop: 'none' },
                            '& .negative-deficit': { color: 'red', fontWeight: 'bold' },
                            '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f5f5f5' },
                            '& .MuiDataGrid-cell': { fontSize: '0.85rem' },
                          }}
                          rowHeight={32}
                          disableRowSelectionOnClick
                          initialState={{
                            pagination: { paginationModel: { pageSize: 5 } },
                            sorting: {
                              sortModel: [{ field: 'productLine', sort: 'asc' }],
                            },
                          }}
                          localeText={{
                            noRowsLabel: 'No data available for HEQA targets'
                          }}
                        />
                      </>
                    )}
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

              {/* Arabica Map */}
              <Grid item xs={12} md={12} sx={{ height: { xs: '600px', sm:'600px', md: '600px' } }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Arabica Coverage Map
                    </Typography>
                    <ArabicaMapComponent />
                  </CardContent>
                </Card>
              </Grid>

              {/* Arabica Sankey Chart */}
              {/* <Grid 
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
                    <ArabicaSankeyChart height="100%" />
                  </CardContent>
                </Card>
              </Grid> */}

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
                      {new Intl.NumberFormat('de-DE').format(metrics.avgRobustaCost)} /kg
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

              {/* Total Robusta Production Bar Chart */}
              {/* <Grid item xs={12} md={6} sx={{ height: { xs: '600px', sm:'600px', md: '600px' } }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                    Robusta Daily Production
                    </Typography>
                    <RobustaCategoryChart timeframe={timeframe} />
                  </CardContent>
                </Card>
              </Grid> */}

              {/* Robusta Target Achievement */}
              {/* <Grid item xs={12} md={6} sx={{ height: { xs: '600px', sm:'600px', md: '600px' } }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Robusta Target Achievement
                    </Typography>
                    <RobustaAchievementChart timeframe={timeframe} />
                  </CardContent>
                </Card>
              </Grid> */}

              {/* Robusta Target Achievement */}
              <Grid item xs={12} md={12} sx={{ height: { xs: '400px', sm: '400px', md: '400px' } }}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent sx={{ height: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                      Robusta Target Achievement
                    </Typography>
                    {isLoadingTargets ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
                        <CircularProgress />
                      </Box>
                    ) : robustaTargets.length === 0 ? (
                      <Typography variant="body1" color="error">
                        No Robusta target data available. Please try again later.
                      </Typography>
                    ) : (
                      <>
                        <DataGrid
                          rows={robustaTargets}
                          columns={[
                            { 
                              field: 'processingType', 
                              headerName: 'Processing Type', 
                              width: 180,
                            },
                            { 
                              field: 'cherryNow', 
                              headerName: 'Cherry Now (kg)', 
                              width: 150,
                              type: 'number',
                              valueFormatter: (value) => 
                                value != null 
                                  ? new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(value) 
                                  : 'N/A',
                            },
                            { 
                              field: 'projectedGB', 
                              headerName: 'Projected GB (kg)', 
                              width: 150,
                              type: 'number',
                              valueFormatter: (value) => 
                                value != null 
                                  ? new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(value) 
                                  : 'N/A',
                            },
                            { 
                              field: 'cherryTarget', 
                              headerName: 'Cherry Target (kg)', 
                              width: 150,
                              type: 'number',
                              valueFormatter: (value) => 
                                value != null 
                                  ? new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(value) 
                                  : 'N/A',
                            },
                            { 
                              field: 'gbTarget', 
                              headerName: 'GB Target (kg)', 
                              width: 150,
                              type: 'number',
                              valueFormatter: (value) => 
                                value != null 
                                  ? new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(value) 
                                  : 'N/A',
                            },
                            { 
                              field: 'cherryDeficit', 
                              headerName: 'Cherry Deficit (kg)', 
                              width: 150,
                              type: 'number',
                              valueFormatter: (value) => 
                                value != null 
                                  ? new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(value) 
                                  : 'N/A',
                              cellClassName: (params) => (params.value != null && params.value < 0 ? 'negative-deficit' : '')
                            },
                            { 
                              field: 'cherryperdTarget', 
                              headerName: 'Cherry/Day Target (kg)', 
                              width: 250,
                              type: 'number',
                              valueFormatter: (value) => 
                                value != null 
                                  ? new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(value) 
                                  : 'N/A',
                              cellClassName: (params) => (params.value != null && params.value < 0 ? 'negative-deficit' : '')
                            },
                          ]}
                          pageSizeOptions={[5]}
                          slots={{ toolbar: GridToolbar }}
                          sx={{
                            height: '80%',
                            border: '1px solid rgba(0,0,0,0.12)',
                            '& .MuiDataGrid-footerContainer': { borderTop: 'none' },
                            '& .negative-deficit': { color: 'red', fontWeight: 'bold' },
                            '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f5f5f5' },
                            '& .MuiDataGrid-cell': { fontSize: '0.85rem' },
                          }}
                          rowHeight={32}
                          disableRowSelectionOnClick
                          initialState={{
                            pagination: { paginationModel: { pageSize: 5 } },
                            sorting: {
                              sortModel: [{ field: 'processingType', sort: 'asc' }],
                            },
                          }}
                          localeText={{
                            noRowsLabel: 'No data available for Robusta targets'
                          }}
                        />
                      </>
                    )}
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

              {/* Robusta Map */}
              <Grid item xs={12} md={12} sx={{ height: { xs: '600px', sm:'600px', md: '600px' } }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Robusta Coverage Map
                    </Typography>
                    <RobustaMapComponent />
                  </CardContent>
                </Card>
              </Grid>

              {/* Robusta Sankey Chart */}
              {/* <Grid 
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
                    <RobustaSankeyChart height="100%" />
                  </CardContent>
                </Card>
              </Grid> */}

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