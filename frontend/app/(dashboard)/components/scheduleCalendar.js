"use client";

import React, { useEffect, useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { 
  Snackbar,
  Alert,
	Box, 
	CircularProgress, 
	Typography, 
	Button, 
	Dialog, 
	DialogTitle, 
	DialogContent, 
	TextField, 
	useTheme, 
	Toolbar, 
	Grid, 
	FormControl, 
	InputLabel, 
  Select, 
  MenuItem,
	OutlinedInput,
	Autocomplete
} from '@mui/material';

const ScheduleCalendar = () => {
	const [events, setEvents] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [isAddTargetDialogOpen, setIsAddTargetDialogOpen] = useState(false);
	const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false); // For events
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
	const [newEvent, setNewEvent] = useState({  // State for new events
		title: '',
		start: '',
		end: '',
		// ... other event properties
	});
	const [selectedRange, setSelectedRange] = useState(null);
	const theme = useTheme();
	const calendarRef = useRef(null);

	// Predefined options
  const predefinedProcesses = ['Pulped Natural', 'Washed', 'Natural', 'Anaerobic Natural', 'Anaerobic Washed', 'Anaerobic Honey', 'CM Natural', 'CM Washed'];
  const predefinedProductLine = ['Regional Lot', 'Micro Lot', 'Competition Lot'];
  const predefinedProducer = ['HQ', 'BTM'];
  const predefinedMetrics = ['Total Weight Produced'];
  const timeframes = ['this-week', 'next-week', 'previous-week', 'this-month', 'next-month', 'previous-month'];

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

  const handleDateSelect = (selectionInfo) => {
		setSelectedRange(selectionInfo);
	};

	const handleOpenAddTargetDialog = () => {
		if (selectedRange) {
			setNewTarget({
				...newTarget,
				startDate: selectedRange.startStr,
				endDate: selectedRange.endStr,
			});
		} else {
			setNewTarget({
				...newTarget,
				startDate: dayjs().format('YYYY-MM-DD'), // Default to today's date if no range selected
				endDate: dayjs().format('YYYY-MM-DD'),
			});
		}
		setIsAddTargetDialogOpen(true);
	};

	const handleOpenAddEventDialog = () => {
		if (selectedRange) {
			setNewEvent({
				...newEvent,
				start: selectedRange.startStr,
				end: selectedRange.endStr,
			});
		} else {
			setNewEvent({
				...newEvent,
				start: dayjs().format('YYYY-MM-DD'), // Default to today's date if no range selected
				end: dayjs().format('YYYY-MM-DD'),
			});
		}
		setIsAddEventDialogOpen(true);
	};


	const handleSubmitTarget = async () => { // Renamed for clarity
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

			setIsAddTargetDialogOpen(false);
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

	const handleSubmitEvent = async () => {
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

			setIsAddTargetDialogOpen(false);
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

			<Toolbar sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
				<Button variant="contained" color="primary" onClick={handleOpenAddTargetDialog} sx={{ mr: 2 }}>
						Add Target
				</Button>
				<Button variant="contained" color="secondary" onClick={handleOpenAddEventDialog}>
						Add Event
				</Button>
			</Toolbar>

      <FullCalendar
				ref={calendarRef}
				plugins={[dayGridPlugin, interactionPlugin]}
				initialView="dayGridMonth"
				events={events}
				headerToolbar={{
					left: 'prev,next today',
					center: 'title',
					right: 'dayGridMonth,dayGridWeek,dayGridDay',
				}}
				selectable={true}
				select={handleDateSelect}
				style={{ backgroundColor: theme.palette.mode === 'dark' ? '#424242' : '#ffffff', color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000', width: '100%' }}
				aspectRatio={1.6} // Try adjusting this value (lower makes it taller)
      />

      {/* Dialog for adding a new target */}
      <Dialog open={isAddTargetDialogOpen} onClose={() => setIsAddTargetDialogOpen(false)}>
        <DialogTitle>Add New Target</DialogTitle>
        <DialogContent>
					<Grid container spacing={2}>

						<Grid item xs={12}>
							<TextField
								label="Start Date"
								type="date"
								value={newTarget.startDate}
								onChange={(e) => setNewTarget({ ...newTarget, startDate: e.target.value })}
								fullWidth
								margin="normal"
								InputLabelProps={{
									shrink: true,
								}}
							/>
						</Grid>

						<Grid item xs={12}>
							<TextField
								label="End Date"
								type="date"
								value={newTarget.endDate}
								onChange={(e) => setNewTarget({ ...newTarget, endDate: e.target.value })}
								fullWidth
								margin="normal"
								InputLabelProps={{
									shrink: true,
								}}
							/>
						</Grid>

						<Grid item xs={12}>
							<FormControl fullWidth required>
								<InputLabel id="type-label">Type</InputLabel>
								<Select
									labelId="type-label"
									value={newTarget.type}
									onChange={({ target: { value } }) => setType(value)}
									input={<OutlinedInput label="Type" />}
								>
									<MenuItem value="Arabica">Arabica</MenuItem>
									<MenuItem value="Robusta">Robusta</MenuItem>
								</Select>
							</FormControl>
						</Grid>
										
						<Grid item xs={12}>
							<Autocomplete
								freeSolo
								options={predefinedProcesses}
								value={newTarget.processingType}
								onChange={(_, newValue) => setProcessingType(newValue || '')}
								renderInput={(params) => (
									<TextField {...params} label="Process" required />
								)}
							/>
						</Grid>
						
						<Grid item xs={12}>
							<Autocomplete
								freeSolo
								options={predefinedProductLine}
								value={newTarget.productLine}
								onChange={(_, newValue) => setProductLine(newValue || '')}
								renderInput={(params) => (
									<TextField {...params} label="Product Line" required />
								)}
							/>
						</Grid>

						<Grid item xs={12}>
							<Autocomplete
								freeSolo
								options={predefinedProducer}
								value={newTarget.producer}
								onChange={(_, newValue) => setProducer(newValue || '')}
								renderInput={(params) => (
									<TextField {...params} label="Producer" required />
								)}
							/>
						</Grid>

						<Grid item xs={12}>
							<FormControl fullWidth required>
								<InputLabel id="quality-label">Quality</InputLabel>
								<Select
									labelId="quality-label"
									value={newTarget.quality}
									onChange={({ target: { value } }) => setQuality(value)}
									input={<OutlinedInput label="Quality" />}
								>
									<MenuItem value="Specialty">Specialty</MenuItem>
									<MenuItem value="G1">G1</MenuItem>
									<MenuItem value="G2">G2</MenuItem>
									<MenuItem value="G3">G3</MenuItem>
									<MenuItem value="G4">G4</MenuItem>
								</Select>
							</FormControl>
						</Grid>

						<Grid item xs={12}>
							<Autocomplete
								freeSolo
								options={predefinedMetrics}
								value={newTarget.metric}
								onChange={(_, newValue) => setMetric(newValue || '')}
								renderInput={(params) => (
									<TextField {...params} label="Metric" required />
								)}
							/>
						</Grid>

						<Grid item xs={12}>
							<FormControl fullWidth required>
								<InputLabel id="timeframe-label">Timeframe</InputLabel>
								<Select
									labelId="timeframe-label"
									value={newTarget.timeFrame}
									onChange={({ target: { value } }) => setTimeFrame(value)}
									input={<OutlinedInput label="Timeframe" />}
								>
									<MenuItem value="Weekly">Weekly</MenuItem>
									<MenuItem value="Monthly">Monthly</MenuItem>
								</Select>
							</FormControl>
						</Grid>

						<Grid item xs={12}>
							<TextField
								label="Target Value"
								value={newTarget.targetValue}
								onChange={({ target: { value } }) => setTargetValue(value)}
								fullWidth
								required
							/>
						</Grid>

						<Button onClick={handleSubmitTarget} variant="contained" color="primary" sx={{ mt: 2 }}>
							Save Target
						</Button>
					</Grid>
        </DialogContent>
      </Dialog>

			{/* Dialog for adding a new event */}
			<Dialog open={isAddEventDialogOpen} onClose={() => setIsAddEventDialogOpen(false)}>
				<DialogTitle>Add New Event</DialogTitle>
				<DialogContent>
					<TextField
						label="Title"
						value={newEvent.title}
						onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
						fullWidth
						margin="normal"
					/>
					<TextField
						label="Start Date"
						type="date"
						value={newEvent.start}
						onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
						fullWidth
						margin="normal"
						InputLabelProps={{
							shrink: true,
						}}
						/>
					<TextField
						label="End Date"
						type="date"
						value={newEvent.end}
						onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
						fullWidth
						margin="normal"
						InputLabelProps={{
							shrink: true,
						}}
					/>
					{/* ... other event form fields */}
					<Button onClick={handleSubmitEvent} variant="contained" color="primary" sx={{ mt: 2 }}>
						Save Event
					</Button>
				</DialogContent>
			</Dialog>

    </Box>
  );
};

export default ScheduleCalendar;