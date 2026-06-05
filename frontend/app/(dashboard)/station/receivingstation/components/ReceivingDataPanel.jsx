'use client';

import { Typography, Card, CardContent, Box, Button, TextField, CircularProgress } from '@mui/material';
import StationDataGrid from '../../_shared/components/StationDataGrid';

export default function ReceivingDataPanel({
  title,
  rows,
  columns,
  reportDate,
  onReportDateChange,
  onGenerateReport,
  reportGenerating,
}) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h5" gutterBottom>
          {title}
        </Typography>
        {onGenerateReport ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2, alignItems: 'center' }}>
            <TextField
              label="Report date"
              type="date"
              size="small"
              value={reportDate || ''}
              onChange={(e) => onReportDateChange?.(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button
              variant="contained"
              onClick={onGenerateReport}
              disabled={reportGenerating || !reportDate}
              startIcon={reportGenerating ? <CircularProgress size={18} color="inherit" /> : null}
            >
              {reportGenerating ? 'Generating…' : 'Generate report'}
            </Button>
          </Box>
        ) : null}
        <StationDataGrid rows={rows} columns={columns} />
      </CardContent>
    </Card>
  );
}
