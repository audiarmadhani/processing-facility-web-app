import React from 'react';
import { Grid, Card, CardContent, Typography } from '@mui/material';
import ScheduleCalendar from '../../components/scheduleCalendar';

const SchedulePage = () => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={12} sx={{ height: { xs: '400px', sm: '500px', md: '600px', lg: '700px' } }}>
        <Card variant="outlined" sx={{ height: '100%' }}>
          <CardContent sx={{ height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Production Targets Schedule
            </Typography>
            <ScheduleCalendar />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default SchedulePage;
