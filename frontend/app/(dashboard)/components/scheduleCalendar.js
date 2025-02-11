"use client";

import React, { useEffect, useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  TextField,
  Typography,
  useTheme,
  GlobalStyles
} from '@mui/material';

const ScheduleCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newTarget, setNewTarget] = useState({
    type: '',
    processingType: '',
    productLine: '',
    producer: '',
    quality: '',
    metric: 'Total Weight Produced',
    timeFrame: 'Weekly',
    targetValue: '',
    startDate: '',
    endDate: ''
  });

  const calendarRef = useRef(null);
  const containerRef = useRef(null);
  const theme = useTheme();

  // Fetch existing targets
  useEffect(() => {
    const fetchTargets = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('https://processing-facility-backend.onrender.com/api/targets');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        const mappedEvents = data.map(target => ({
          id: target.id,
          title: `${target.processingType} (${target.targetValue} kg)`,
          start: target.startDate,
          end: target.endDate,
          extendedProps: target
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

  // Handle date range selection to open the form
  const handleDateSelect = (selectInfo) => {
    setNewTarget({
      ...newTarget,
      startDate: selectInfo.startStr,
      endDate: selectInfo.endStr
    });
    setOpenDialog(true);
  };

  // Handle form input changes
  const handleChange = (e) => {
    setNewTarget({ ...newTarget, [e.target.name]: e.target.value });
  };

  // Submit new target
  const handleSubmit = async () => {
    try {
      const response = await fetch('https://processing-facility-backend.onrender.com/api/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTarget)
      });

      if (!response.ok) throw new Error('Failed to create target');

      setOpenDialog(false);
      setNewTarget({
        type: '',
        processingType: '',
        productLine: '',
        producer: '',
        quality: '',
        metric: 'Total Weight Produced',
        timeFrame: 'Weekly',
        targetValue: '',
        startDate: '',
        endDate: ''
      });

      // Refresh events
      const newEvent = {
        title: `${newTarget.processingType} (${newTarget.targetValue} kg)`,
        start: newTarget.startDate,
        end: newTarget.endDate,
      };
      setEvents([...events, newEvent]);
    } catch (err) {
      console.error('Error submitting target:', err);
    }
  };

  return (
    <Box ref={containerRef} sx={{ p: 2, width: '100%', height: '100%' }}>
      <GlobalStyles styles={{
        '.fc-daygrid-day-frame': { height: '80px !important', overflow: 'hidden' },
        '.fc-daygrid-day-top': { minHeight: '30px !important' }
      }} />
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" align="center">{error}</Typography>
      ) : (
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          selectable={true}
          selectMirror={true}  // Highlights selected range
          select={handleDateSelect}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek,dayGridDay'
          }}
          height="auto"
        />
      )}

      {/* Dialog for Creating Target */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Create New Target</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 400 }}>
          <TextField
            label="Start Date"
            type="date"
            name="startDate"
            value={newTarget.startDate}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="End Date"
            type="date"
            name="endDate"
            value={newTarget.endDate}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />

          <Select name="type" value={newTarget.type} onChange={handleChange} displayEmpty>
            <MenuItem value="" disabled>Select Type</MenuItem>
            <MenuItem value="Arabica">Arabica</MenuItem>
            <MenuItem value="Robusta">Robusta</MenuItem>
          </Select>

          <Select name="processingType" value={newTarget.processingType} onChange={handleChange} displayEmpty>
            <MenuItem value="" disabled>Select Processing Type</MenuItem>
            <MenuItem value="Wet Hull">Wet Hull</MenuItem>
            <MenuItem value="Natural">Natural</MenuItem>
            <MenuItem value="Washed">Washed</MenuItem>
          </Select>

          <Select name="productLine" value={newTarget.productLine} onChange={handleChange} displayEmpty>
            <MenuItem value="" disabled>Select Product Line</MenuItem>
            <MenuItem value="Regional Lot">Regional Lot</MenuItem>
          </Select>

          <TextField name="producer" label="Producer" value={newTarget.producer} onChange={handleChange} />

          <Select name="quality" value={newTarget.quality} onChange={handleChange} displayEmpty>
            <MenuItem value="" disabled>Select Quality</MenuItem>
            <MenuItem value="Specialty">Specialty</MenuItem>
            <MenuItem value="G4">G4</MenuItem>
          </Select>

          <TextField name="targetValue" label="Target Value (kg)" type="number" value={newTarget.targetValue} onChange={handleChange} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScheduleCalendar;
