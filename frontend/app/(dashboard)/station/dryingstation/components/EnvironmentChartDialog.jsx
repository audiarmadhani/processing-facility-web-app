'use client';

import { useMemo } from 'react';
import {
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Line } from 'react-chartjs-2';
import './chartSetup';
import { getEnvColumns } from '../columns';

const envColumns = getEnvColumns();

export default function EnvironmentChartDialog({
  open,
  selectedDevice,
  historicalEnvData,
  onClose,
}) {
  const envChartData = useMemo(
    () => ({
      labels: historicalEnvData.map((d) => {
        const date = new Date(d.recorded_at);
        date.setHours(date.getHours() + 8);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      }),
      datasets: [
        {
          label: 'Temperature (°C)',
          data: historicalEnvData.map((d) => Number(d.temperature)),
          borderColor: 'rgba(255,99,132,1)',
          fill: false,
          tension: 0.1,
        },
        {
          label: 'Humidity (%)',
          data: historicalEnvData.map((d) => Number(d.humidity)),
          borderColor: 'rgba(75,192,192,1)',
          fill: false,
          tension: 0.1,
        },
      ],
    }),
    [historicalEnvData]
  );

  const envChartOptions = useMemo(
    () => ({
      scales: {
        x: {
          type: 'time',
          time: {
            parser: (value) => {
              const [datePart, timePart] = value.split(' ');
              const [year, month, day] = datePart.split('-').map(Number);
              const [hours, minutes] = timePart.split(':').map(Number);
              const utcDate = new Date(Date.UTC(year, month - 1, day, hours - 8, minutes));
              return utcDate;
            },
            unit: 'hour',
            displayFormats: {
              hour: 'yyyy-MM-dd HH:mm',
            },
            tooltipFormat: 'yyyy-MM-dd HH:mm',
          },
          title: { display: true, text: 'Date and Time (WITA)' },
        },
        y: {
          title: { display: true, text: 'Value' },
          min: 0,
          max: 100,
        },
      },
      plugins: {
        legend: { display: true },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            title: (tooltipItems) => {
              const date = new Date(tooltipItems[0].parsed.x);
              date.setHours(date.getHours() + 8);
              return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            },
          },
        },
      },
    }),
    []
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Environmental Data - Device {selectedDevice}</DialogTitle>
      <DialogContent>
        {historicalEnvData.length === 0 ? (
          <Typography variant="body1" align="center" color="textSecondary" sx={{ mt: 2 }}>
            No environmental data available
          </Typography>
        ) : (
          <>
            <Line data={envChartData} options={envChartOptions} />
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Historical Environmental Data
            </Typography>
            <EnvDataGrid historicalEnvData={historicalEnvData} />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function EnvDataGrid({ historicalEnvData }) {
  return (
    <div style={{ height: 300, width: '100%' }}>
      <DataGrid
        rows={historicalEnvData.map((row, index) => ({ id: index, ...row }))}
        columns={envColumns}
        pageSizeOptions={[100, 200, 500]}
        slots={{ toolbar: GridToolbar }}
        sx={{
          border: '1px solid rgba(0,0,0,0.12)',
          '& .MuiDataGrid-footerContainer': { borderTop: 'none' },
        }}
        rowHeight={35}
        pagination
        initialState={{
          pagination: { paginationModel: { pageSize: 100 } },
          sorting: { sortModel: [{ field: 'recorded_at', sort: 'desc' }] },
        }}
      />
    </div>
  );
}

