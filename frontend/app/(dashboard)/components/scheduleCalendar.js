"use client";

import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { Box, CircularProgress, Typography } from '@mui/material';

const ScheduleCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch targets from the API
  useEffect(() => {
    const fetchTargets = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('https://processing-facility-backend.onrender.com/api/targets');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Map each target into a FullCalendar event.
        // You can adjust the title and additional props as needed.
        const mappedEvents = data.map(target => ({
          id: target.id,
          title: `${target.processingType} (${target.targetValue} kg)`,
          start: target.startDate,
          end: target.endDate, // Note: FullCalendar treats "end" as exclusive.
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
    <Box sx={{ p: 2 }}>
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek,dayGridDay'
        }}
        events={events}
        height="auto"
      />
    </Box>
  );
};

export default ScheduleCalendar;
