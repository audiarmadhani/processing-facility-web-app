'use client';

import dynamic from 'next/dynamic';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { useMemo } from 'react';
import { useDriverPickups } from '../hooks/useDriverPickups';
import { enrichPickupRowsWithFacilityDistance } from '../utils/pickupGeo';

const DriverPickupMap = dynamic(() => import('./DriverPickupMap'), { ssr: false });

const EMPTY = '—';

function formatTimestamp(value) {
  if (!value) return EMPTY;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EMPTY;
  return date.toLocaleString();
}

function formatCoord(value) {
  if (value == null || Number.isNaN(Number(value))) return EMPTY;
  return Number(value).toFixed(5);
}

function formatWeight(value) {
  if (value == null || Number.isNaN(Number(value))) return EMPTY;
  return Number(value).toLocaleString();
}

function formatDistanceKm(value) {
  if (value == null || Number.isNaN(Number(value))) return EMPTY;
  return `${Number(value).toFixed(2)} km`;
}

function buildYearOptions(currentYear) {
  const years = [];
  for (let y = currentYear; y >= currentYear - 5; y -= 1) {
    years.push(y);
  }
  return years;
}

const pickupColumns = [
  {
    field: 'arrival_timestamp',
    headerName: 'Arrival',
    sortable: true,
    width: 160,
    renderCell: ({ value }) => formatTimestamp(value),
  },
  { field: 'driver_name', headerName: 'Driver', sortable: true, width: 120 },
  { field: 'farm_name', headerName: 'Farm Name', sortable: true, width: 140 },
  { field: 'farmer_name', headerName: 'Farmer (Driver)', sortable: true, width: 140 },
  { field: 'village', headerName: 'Village', sortable: true, width: 110 },
  {
    field: 'latitude',
    headerName: 'Lat',
    sortable: true,
    width: 100,
    renderCell: ({ value }) => formatCoord(value),
  },
  {
    field: 'longitude',
    headerName: 'Lng',
    sortable: true,
    width: 100,
    renderCell: ({ value }) => formatCoord(value),
  },
  {
    field: 'facility_distance_km',
    headerName: 'Dist. to Facility (km)',
    sortable: true,
    width: 150,
    renderCell: ({ value }) => formatDistanceKm(value),
  },
  {
    field: 'estimated_weight',
    headerName: 'Est. Weight (kg)',
    sortable: true,
    width: 130,
    renderCell: ({ value }) => formatWeight(value),
  },
  { field: 'species', headerName: 'Species', sortable: true, width: 90 },
  { field: 'handoff_code', headerName: 'Handoff', sortable: true, width: 90 },
  {
    field: 'batchNumber',
    headerName: 'Batch #',
    sortable: true,
    width: 120,
    renderCell: ({ value }) => value || EMPTY,
  },
  {
    field: 'registered_farmer_name',
    headerName: 'Registered Farmer',
    sortable: true,
    width: 150,
    renderCell: ({ value }) => value || EMPTY,
  },
];

const gridCommonProps = {
  pageSize: 5,
  rowsPerPageOptions: [5, 10, 20],
  disableSelectionOnClick: true,
  sortingOrder: ['asc', 'desc'],
  slots: { toolbar: GridToolbar },
  autosizeOnMount: true,
  autosizeOptions: {
    includeHeaders: true,
    includeOutliers: true,
    expand: true,
  },
  rowHeight: 35,
};

export default function DriverPickupSection() {
  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => buildYearOptions(currentYear), [currentYear]);
  const { year, setYear, rows, loading, error } = useDriverPickups(currentYear);
  const rowsWithDistance = useMemo(
    () => enrichPickupRowsWithFacilityDistance(rows),
    [rows]
  );

  return (
    <Card variant="outlined">
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
            mb: 2,
          }}
        >
          <Typography variant="h5">Driver Pickups ({year})</Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="driver-pickup-year-label">Year</InputLabel>
            <Select
              labelId="driver-pickup-year-label"
              value={year}
              label="Year"
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {yearOptions.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <DriverPickupMap rows={rowsWithDistance} />
            </Grid>
            <Grid item xs={12} md={6}>
              {rows.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 2 }}>
                  No driver pickups for {year}.
                </Typography>
              ) : null}
              <div style={{ height: 480, width: '100%' }}>
                <DataGrid rows={rowsWithDistance} columns={pickupColumns} {...gridCommonProps} />
              </div>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );
}
