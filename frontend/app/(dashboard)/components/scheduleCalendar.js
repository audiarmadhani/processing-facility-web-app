"use client";

import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction'; // Import interaction plugin for dateClick and select
import { Box, CircularProgress, Typography, Button, Dialog, DialogTitle, DialogContent, TextField, useTheme } from '@mui/material';

const ScheduleCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false); // State to control the dialog
  const [newTarget, setNewTarget] = useState({
    type: '',
    processingType: '',
    productLine: '',
    producer: '',
    quality: '',
    metric: '',
    timeFrame: '',
    targetValue: '',
    startDate: '',
    endDate: '',
  });
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
          title: `${target.processingType} (${target.targetValue} kg)`,
          start: target.startDate,
          end: target.endDate,
          extendedProps: {
            type: target.type,
            quality: target.quality,
            metric: target.metric,
            timeFrame: target.timeFrame,
            columnName: target.columnName,
            productLine: target.productLine,
            producer: target.producer,
          },
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

  // Handle date click event
  const handleDateClick = (arg) => {
    setNewTarget({
      ...newTarget,
      startDate: arg.dateStr, // Set the clicked date as the start date
      endDate: arg.dateStr,   // Default end date to the same as start date
    });
    setOpenDialog(true); // Open the dialog for creating a new target
  };

  // Handle date range selection
  const handleDateSelect = (selectionInfo) => {
    setNewTarget({
      ...newTarget,
      startDate: selectionInfo.startStr, // Set the start date of the selected range
      endDate: selectionInfo.endStr,     // Set the end date of the selected range
    });
    setOpenDialog(true); // Open the dialog for creating a new target
  };

  // Handle form submission to create a new target
  const handleSubmit = async () => {
    try {
      const response = await fetch('https://processing-facility-backend.onrender.com/api/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTarget),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create target.');
      }

      const createdTarget = await response.json();
      setEvents((prevEvents) => [
        ...prevEvents,
        {
          id: createdTarget.id,
          title: `${newTarget.processingType} (${newTarget.targetValue} kg)`,
          start: newTarget.startDate,
          end: newTarget.endDate,
        },
      ]);

      setOpenDialog(false); // Close the dialog after successful creation
      setNewTarget({
        type: '',
        processingType: '',
        productLine: '',
        producer: '',
        quality: '',
        metric: '',
        timeFrame: '',
        targetValue: '',
        startDate: '',
        endDate: '',
      });
    } catch (err) {
      console.error('Error creating target:', err);
      alert(`Error: ${err.message}`);
    }
  };

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
        plugins={[dayGridPlugin, interactionPlugin]} // Add interaction plugin
        initialView="dayGridMonth"
        events={events}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek,dayGridDay',
        }}
        selectable={true} // Enable date range selection
        dateClick={handleDateClick} // Handle single date clicks
        select={handleDateSelect}   // Handle date range selection
        style={{ backgroundColor: calendarBgColor, color: calendarTextColor, width: '100%' }}
        // height={800} // Or some other fixed height
				aspectRatio={1.4} // Try adjusting this value (lower makes it taller)
      />

      {/* Dialog for adding a new target */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Add New Target</DialogTitle>
        <DialogContent>
          <TextField
            label="Processing Type"
            value={newTarget.processingType}
            onChange={(e) => setNewTarget({ ...newTarget, processingType: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Product Line"
            value={newTarget.productLine}
            onChange={(e) => setNewTarget({ ...newTarget, productLine: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Producer"
            value={newTarget.producer}
            onChange={(e) => setNewTarget({ ...newTarget, producer: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Quality"
            value={newTarget.quality}
            onChange={(e) => setNewTarget({ ...newTarget, quality: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Metric"
            value={newTarget.metric}
            onChange={(e) => setNewTarget({ ...newTarget, metric: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Time Frame"
            value={newTarget.timeFrame}
            onChange={(e) => setNewTarget({ ...newTarget, timeFrame: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Target Value"
            type="number"
            value={newTarget.targetValue}
            onChange={(e) => setNewTarget({ ...newTarget, targetValue: e.target.value })}
            fullWidth
            margin="normal"
          />
          <Button onClick={handleSubmit} variant="contained" color="primary" sx={{ mt: 2 }}>
            Save Target
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ScheduleCalendar;