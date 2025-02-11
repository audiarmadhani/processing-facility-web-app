"use client";

import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { Box, CircularProgress, Typography, useTheme } from '@mui/material';

const ScheduleCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();

  // Determine colors based on the current theme mode
  const calendarBgColor = theme.palette.mode === 'dark' ? '#424242' : '#ffffff';
  const calendarTextColor = theme.palette.mode === 'dark' ? '#ffffff' : '#000000';

  // Fetch production target events from the API
  useEffect(() => {
    const fetchTargets = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('https://processing-facility-backend.onrender.com/api/targets');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        // Map each target into a FullCalendar event
        const mappedEvents = data.map(target => ({
          id: target.id,
          // Example: "Wet Hull (200 kg)" or "Natural (1000 kg)"
          title: `${target.processingType} (${target.targetValue} kg)`,
          start: target.startDate,
          // FullCalendar treats "end" as exclusive; adjust if necessary.
          end: target.endDate,
          extendedProps: {
            type: target.type,
            quality: target.quality,
            metric: target.metric,
            timeFrame: target.timeFrame,
            columnName: target.columnName,
            productLine: target.productLine,
            producer: target.producer,
          }
        }));

        setEvents(mappedEvents);
      } catch (err) {
        console.error("Error fetching targets:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTargets();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', p: 2 }}>
        <Typography variant="body1" color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, width: '100%', height: '100%' }}>
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek,dayGridDay'
        }}
        // The style prop sets background and text color based on MUI theme
        style={{ backgroundColor: calendarBgColor, color: calendarTextColor, width: '100%' }}
      />
    </Box>
  );
};

export default ScheduleCalendar;
