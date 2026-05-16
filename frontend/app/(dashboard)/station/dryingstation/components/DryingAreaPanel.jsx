'use client';

import { Button, Typography } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';

export default function DryingAreaPanel({
  area,
  areaData,
  areaLoading,
  totalWeight,
  envData,
  deviceId,
  columns,
  onEnvDetailsClick,
}) {
  if (areaLoading) {
    return (
      <Typography variant="body1" align="center" color="textSecondary">
        Loading...
      </Typography>
    );
  }

  return (
    <>
      <Typography variant="h6" gutterBottom>
        {area}
      </Typography>
      <Typography variant="body2" gutterBottom>
        Total Weight: {totalWeight} kg
      </Typography>
      <Typography variant="body2" gutterBottom>
        Temp: {envData.temperature}°C | Humidity: {envData.humidity}%
        {deviceId && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => onEnvDetailsClick(deviceId)}
            sx={{ ml: 2 }}
          >
            See Details
          </Button>
        )}
      </Typography>
      <AreaDataGrid area={area} areaData={areaData} columns={columns} />
    </>
  );
}

function AreaDataGrid({ area, areaData, columns }) {
  return (
    <div style={{ height: '600px', width: '100%', overflow: 'auto' }}>
      {areaData.length === 0 ? (
        <Typography variant="body1" align="center" color="textSecondary" sx={{ pt: '180px' }}>
          No batches in {area}
        </Typography>
      ) : (
        <DataGrid
          rows={areaData}
          columns={columns}
          pageSizeOptions={[20, 50, 100]}
          disableRowSelectionOnClick
          getRowId={(row) => row.batchNumber}
          slots={{ toolbar: GridToolbar }}
          sx={{
            maxHeight: 600,
            border: '1px solid rgba(0,0,0,0.12)',
            '& .MuiDataGrid-footerContainer': { borderTop: 'none' },
          }}
          rowHeight={40}
          pagination
          initialState={{
            pagination: { paginationModel: { pageSize: 50 } },
          }}
        />
      )}
    </div>
  );
}
