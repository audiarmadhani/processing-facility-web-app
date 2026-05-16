'use client';

import { Typography, Grid, Card, CardContent } from '@mui/material';
import StationDataGrid from '../../_shared/components/StationDataGrid';

export default function ReceivingDataPanel({ title, rows, columns }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h5" gutterBottom>
          {title}
        </Typography>
        <StationDataGrid rows={rows} columns={columns} />
      </CardContent>
    </Card>
  );
}
