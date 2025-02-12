import React from 'react';
import { Grid, Card, CardContent, Typography } from '@mui/material';
import ScheduleCalendar from '../components/scheduleCalendar';

const CalendarPage = () => {
  return (
    <Grid container spacing={3}>
      <Grid
        item
        xs={12}
        md={12}
        sx={{
          height: {
            xs: '400px',  // Extra-small screens
            sm: '600px',  // Small screens
            md: '1800px',  // Medium screens
            lg: '1800px',  // Large screens
            xl: '1800px'   // Extra-large screens
          }
        }}
      >
        <Card variant="outlined" sx={{ height: '100%' }}>
          <CardContent sx={{ height: '100%' }}>
            <ScheduleCalendar />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default CalendarPage;
