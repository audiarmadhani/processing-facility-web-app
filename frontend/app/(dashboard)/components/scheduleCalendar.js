"use client";

import React, { useEffect, useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { Box, CircularProgress, Typography, useTheme, GlobalStyles } from '@mui/material';

const ScheduleCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const calendarRef = useRef(null);
  const containerRef = useRef(null);
  const theme = useTheme();

  // Determine colors based on theme
  const calendarBgColor = theme.palette.mode === 'dark' ? '#424242' : '#ffffff';
  const calendarTextColor = theme.palette.mode === 'dark' ? '#ffffff' : '#000000';

  // Fetch target events from the API
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

  // Use ResizeObserver to update FullCalendar size when container resizes
  useEffect(() => {
    if (!containerRef.current || !calendarRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.updateSize();
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => {
      resizeObserver.disconnect();
    };
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
    <Box ref={containerRef} sx={{ p: 2, width: '100%', height: '100%' }}>
      {/* GlobalStyles to override the day cell height */}
      <GlobalStyles styles={{
        '.fc-daygrid-day-frame': {
          height: '80px !important',
          overflow: 'hidden',
        },
        // Optional: Force day cell top area to have a consistent height
        '.fc-daygrid-day-top': {
          minHeight: '30px !important'
        }
      }} />
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek,dayGridDay'
        }}
        height="auto"
        style={{ 
          backgroundColor: calendarBgColor, 
          color: calendarTextColor, 
          width: '100%' 
        }}
      />
    </Box>
  );
};

export default ScheduleCalendar;
