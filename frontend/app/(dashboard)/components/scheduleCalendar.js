"use client";

import React, { useEffect, useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import dayjs from 'dayjs'; // Import dayjs

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
  Autocomplete,
	Checkbox,
	FormControlLabel
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

	const [newTargetFormValues, setNewTargetFormValues] = useState({  // Separate state for form values
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
		eventName: '',
		startDate: '',
		endDate: '',
		eventDescription: '',
		allDay: false, // Add allDay state, initialized to false
		location: '',
		category: '',
	});

	const [newEventFormValues, setNewEventFormValues] = useState({  // Separate state for form values
		eventName: '',
		startDate: '',
		endDate: '',
		eventDescription: '',
		allDay: false, // Add allDay state, initialized to false
		location: '',
		category: '',
	});

	const [selectedRange, setSelectedRange] = useState(null);
	const [isEventDetailsDialogOpen, setIsEventDetailsDialogOpen] = useState(false); // State for event details dialog
  const [selectedEventDetails, setSelectedEventDetails] = useState(null); // State to store clicked event details
	const [editedEventDetails, setEditedEventDetails] = useState({});
  const theme = useTheme();
  const calendarRef = useRef(null);

	// Predefined options
  const predefinedProcesses = ['Pulped Natural', 'Washed', 'Natural', 'Anaerobic Natural', 'Anaerobic Washed', 'Anaerobic Honey', 'CM Natural', 'CM Washed'];
  const predefinedProductLine = ['Regional Lot', 'Micro Lot', 'Competition Lot', 'Commercial Lot'];
  const predefinedProducer = ['HQ', 'BTM'];
  const predefinedMetrics = ['Total Weight Produced'];
  const timeframes = ['this-week', 'next-week', 'previous-week', 'this-month', 'next-month', 'previous-month'];
	const predefinedCategory = ['Bali Holiday', 'National Holiday'];


  // Determine colors based on the current theme mode
  const calendarBgColor = theme.palette.mode === 'dark' ? '#424242' : '#ffffff';
  const calendarTextColor = theme.palette.mode === 'dark' ? '#ffffff' : '#000000';

  // Fetch production target events from the API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const targetsResponse = await fetch('https://processing-facility-backend.onrender.com/api/targets');
        if (!targetsResponse.ok) {
          throw new Error(`HTTP error! status: ${targetsResponse.status} (Targets)`);
        }
        const targetsData = await targetsResponse.json();

        const eventsResponse = await fetch('https://processing-facility-backend.onrender.com/api/events');
        if (!eventsResponse.ok) {
          throw new Error(`HTTP error! status: ${eventsResponse.status} (Events)`);
        }
        const eventsData = await eventsResponse.json();

				const categoryColors = {
					'Bali Holiday': '#CD7F32',
					'National Holiday': '#BA232C',
					'Joint Holiday': '#FF683E', // Gold for National Holiday
					default: '#444444', // Default gray for unknown categories
				};

        const mappedTargets = targetsData.map((target) => ({
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
            category: 'target', // Add a category to distinguish targets
          },
        }));

        const mappedEvents = eventsData.map((event) => {

					const category = event.category || 'default'; // Use 'default' if no category is provided
					const color = categoryColors[category] || categoryColors.default; // Fallback to default color
	
					return {
						id: event.id,
						title: event.eventName, // Use eventName from your event data
						start: event.startDate,
						end: event.endDate,
						allDay: event.allDay, // Include allDay property
						backgroundColor: color, // Set background color based on category
						borderColor: color, // Match border color with background
						extendedProps: {
							description: event.eventDescription,
							location: event.location,
							category: category, // Add a category to distinguish events
						},
					};
				});

        setEvents([...mappedTargets, ...mappedEvents]); // Combine targets and events

      } catch (err) {
        console.error("Error fetching targets:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

	useEffect(() => {
    // Sync newTargetFormValues with newTarget when newTarget changes (e.g., when a range is selected)
    setNewTargetFormValues(newTarget);
  }, [newTarget]);

	useEffect(() => {
    // Sync newTargetFormValues with newTarget when newTarget changes (e.g., when a range is selected)
    setNewEventFormValues(newEvent);
  }, [newEvent]);

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
				startDate: selectedRange.startStr,
				endDate: selectedRange.endStr,
			});
		} else {
			setNewEvent({
				...newEvent,
				startDate: dayjs().format('YYYY-MM-DD'), // Default to today's date if no range selected
				endDate: dayjs().format('YYYY-MM-DD'),
			});
		}
		setIsAddEventDialogOpen(true);
	};


	const handleSubmitTarget = async () => {
    try {
      const response = await fetch('https://processing-facility-backend.onrender.com/api/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTargetFormValues), // Send the form values
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
      setNewTargetFormValues({ // Clear the form values
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
      const response = await fetch('https://processing-facility-backend.onrender.com/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEventFormValues),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create target.');
      }

      const createdEvent = await response.json();
      setEvents((prevEvents) => [
        ...prevEvents,
        {
          id: createdEvent.id,
          title: `${newEvent.processingType}`,
          start: newEvent.startDate,
          end: newEvent.endDate,
        },
      ]);

			setIsAddEventDialogOpen(false);
      setNewEventFormValues({
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
      console.error('Error creating event:', err);
      alert(`Error: ${err.message}`);
    }
  };

	// Handle event click
  const handleEventClick = (clickInfo) => {
    const { event } = clickInfo;
    const details = {
      id: event.id,
      title: event.title,
      start: event.startStr,
      end: event.endStr,
      ...event.extendedProps,
    };
    setSelectedEventDetails(details);
    setEditedEventDetails(details); // Initialize editable state
    setIsEventDetailsDialogOpen(true);
  };

	// Handle update button click
  const handleUpdate = async () => {
    const { id, type, ...rest } = editedEventDetails;

    try {
      let response;
      if (type === "target") {
        response = await fetch(
          `https://processing-facility-backend.onrender.com/api/targets/${id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(rest),
          }
        );
      } else if (type === "event") {
        response = await fetch(
          `https://processing-facility-backend.onrender.com/api/events/${id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(rest),
          }
        );
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update.");
      }

      // Update local state
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === id ? { ...event, ...editedEventDetails } : event
        )
      );

      setIsEventDetailsDialogOpen(false);
    } catch (err) {
      console.error("Error updating:", err);
      alert(`Error: ${err.message}`);
    }
  };

  // Handle delete button click
  const handleDelete = async () => {
    const { id, type } = selectedEventDetails;

    try {
      let response;
      if (type === "target") {
        response = await fetch(
          `https://processing-facility-backend.onrender.com/api/targets/${id}`,
          { method: "DELETE" }
        );
      } else if (type === "event") {
        response = await fetch(
          `https://processing-facility-backend.onrender.com/api/events/${id}`,
          { method: "DELETE" }
        );
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete.");
      }

      // Remove from local state
      setEvents((prevEvents) =>
        prevEvents.filter((event) => event.id !== id)
      );

      setIsEventDetailsDialogOpen(false);
    } catch (err) {
      console.error("Error deleting:", err);
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
				eventClick={handleEventClick} // Add event click handler
				headerToolbar={{
					left: 'prev,next today',
					center: 'title',
					right: 'dayGridMonth,dayGridWeek,dayGridDay',
				}}
				selectable={true}
				select={handleDateSelect}
				style={{ backgroundColor: theme.palette.mode === 'dark' ? '#424242' : '#ffffff', color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000', width: '100%' }}
				aspectRatio={1.5} // Try adjusting this value (lower makes it taller)
				expandRows= {false}
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
								value={newTargetFormValues.startDate}
								onChange={(e) => setNewTargetFormValues({ ...newTargetFormValues, startDate: e.target.value })}
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
								value={newTargetFormValues.endDate}
								onChange={(e) => setNewTargetFormValues({ ...newTargetFormValues, endDate: e.target.value })}
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
									value={newTargetFormValues.type}
									onChange={(e) => setNewTargetFormValues({ ...newTargetFormValues, type: e.target.value })}
									input={<OutlinedInput label="Type" />}
								>
									<MenuItem value="Arabica">Arabica</MenuItem>
									<MenuItem value="Robusta">Robusta</MenuItem>
								</Select>
							</FormControl>
						</Grid>
										
						<Grid item xs={12}>
							<FormControl fullWidth required>
								<InputLabel id="process-label">Process</InputLabel>
								<Select
									labelId="process-label"
									value={newTargetFormValues.processingType}
									onChange={(e) => setNewTargetFormValues({ ...newTargetFormValues, processingType: e.target.value })}
									input={<OutlinedInput label="Process" />}
								>
									{predefinedProcesses.map((process) => (
										<MenuItem key={process} value={process}>
											{process}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Grid>

						<Grid item xs={12}>
							<FormControl fullWidth required>
								<InputLabel id="product-label">Product Line</InputLabel>
								<Select
									labelId="product-label"
									value={newTargetFormValues.productLine}
									onChange={(e) => setNewTargetFormValues({ ...newTargetFormValues, productLine: e.target.value })}
									input={<OutlinedInput label="Product Line" />}
								>
									{predefinedProductLine.map((productline) => (
										<MenuItem key={productline} value={productline}>
											{productline}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Grid>

						<Grid item xs={12}>
							<FormControl fullWidth required>
								<InputLabel id="producer-label">Producer</InputLabel>
								<Select
									labelId="producer-label"
									value={newTargetFormValues.producer}
									onChange={(e) => setNewTargetFormValues({ ...newTargetFormValues, producer: e.target.value })}
									input={<OutlinedInput label="Producer" />}
								>
									{predefinedProducer.map((producer) => (
										<MenuItem key={producer} value={producer}>
											{producer}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Grid>

						<Grid item xs={12}>
							<FormControl fullWidth required>
								<InputLabel id="quality-label">Quality</InputLabel>
								<Select
									labelId="quality-label"
									value={newTargetFormValues.quality}
									onChange={(e) => setNewTargetFormValues({ ...newTargetFormValues, quality: e.target.value })}
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
							<FormControl fullWidth required>
								<InputLabel id="metric-label">Metric</InputLabel>
								<Select
									labelId="metric-label"
									value={newTargetFormValues.metric}
									onChange={(e) => setNewTargetFormValues({ ...newTargetFormValues, metric: e.target.value })}
									input={<OutlinedInput label="Metric" />}
								>
									{predefinedMetrics.map((metric) => (
										<MenuItem key={metric} value={metric}>
											{metric}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Grid>

						<Grid item xs={12}>
							<FormControl fullWidth required>
								<InputLabel id="timeFrame-label">Timeframe</InputLabel>
								<Select
									labelId="timeFrame-label"
									value={newTargetFormValues.timeFrame}
									onChange={(e) => setNewTargetFormValues({ ...newTargetFormValues, timeFrame: e.target.value })}
									input={<OutlinedInput label="Timeframe" />}
								>
									<MenuItem value="Weekly">Weekly</MenuItem>
								</Select>
							</FormControl>
						</Grid>

						<Grid item xs={12}>
							<TextField
								label="Target Value"
								value={newTargetFormValues.targetValue}
								onChange={(e) => setNewTargetFormValues({ ...newTargetFormValues, targetValue: e.target.value })}
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


			{/* Dialog for adding a new target */}
      <Dialog open={isAddEventDialogOpen} onClose={() => setIsAddEventDialogOpen(false)}>
        <DialogTitle>Add New Event</DialogTitle>
        <DialogContent>

					<Grid container spacing={2}>

						<Grid item xs={12}>
							<TextField
								label="eventName"
								value={newEventFormValues.eventName}
								onChange={(e) => setNewEventFormValues({ ...newEventFormValues, eventName: e.target.value })}
								fullWidth
								margin="normal"
							/>
						</Grid>

						<Grid item xs={12}>
							<TextField
								label="Start Date"
								type="date"
								value={newEventFormValues.startDate}
								onChange={(e) => setNewEventFormValues({ ...newEventFormValues, startDate: e.target.value })}
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
								value={newEventFormValues.endDate}
								onChange={(e) => setNewEventFormValues({ ...newEventFormValues, endDate: e.target.value })}
								fullWidth
								margin="normal"
								InputLabelProps={{
									shrink: true,
								}}
							/>
						</Grid>

						<Grid item xs={12}>
							<FormControlLabel
								control={
									<Checkbox
										checked={newEventFormValues.allDay}
										onChange={(e) =>
											setNewEventFormValues({
												...newEventFormValues,
												allDay: e.target.checked,
											})
										}
									/>
								}
								label="All Day"
							/>
						</Grid>

						<Grid item xs={12}>
							<TextField
								label="Event Description"
								type="eventDescription"
								value={newEventFormValues.eventDescription}
								onChange={(e) => setNewEventFormValues({ ...newEventFormValues, eventDescription: e.target.value })}
								fullWidth
								margin="normal"
								InputLabelProps={{
									shrink: true,
								}}
							/>
						</Grid>

						<Grid item xs={12}>
							<TextField
								label="Location"
								type="location"
								value={newEventFormValues.location}
								onChange={(e) => setNewEventFormValues({ ...newEventFormValues, location: e.target.value })}
								fullWidth
								margin="normal"
								InputLabelProps={{
									shrink: true,
								}}
							/>
						</Grid>

						<Grid item xs={12}>
								<FormControl fullWidth required>
									<InputLabel id="category-label">Category</InputLabel>
									<Select
										labelId="category-label"
										value={newEventFormValues.category}
										onChange={(e) => setNewEventFormValues({ ...newEventFormValues, category: e.target.value })}
										input={<OutlinedInput label="Category" />}
									>
										{predefinedCategory.map((category) => (
										<MenuItem key={category} value={category}>
											{category}
										</MenuItem>
										))}
									</Select>
								</FormControl>
							</Grid>
						<Button onClick={handleSubmitEvent} variant="contained" color="primary" sx={{ mt: 2 }}>
							Save Event
						</Button>
					</Grid>
				</DialogContent>
			</Dialog>

			{/* Dialog for showing/editing event details */}
      <Dialog
        open={isEventDetailsDialogOpen}
        onClose={() => setIsEventDetailsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Event Details</DialogTitle>
        <DialogContent>
          {selectedEventDetails && (
            <>
              <TextField
                label="Title"
                value={editedEventDetails.title || ""}
                onChange={(e) =>
                  setEditedEventDetails({
                    ...editedEventDetails,
                    title: e.target.value,
                  })
                }
                fullWidth
                margin="normal"
              />
              <TextField
                label="Start Date"
                type="date"
                value={editedEventDetails.start || ""}
                onChange={(e) =>
                  setEditedEventDetails({
                    ...editedEventDetails,
                    start: e.target.value,
                  })
                }
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="End Date"
                type="date"
                value={editedEventDetails.end || ""}
                onChange={(e) =>
                  setEditedEventDetails({
                    ...editedEventDetails,
                    end: e.target.value,
                  })
                }
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
              {editedEventDetails.type === "target" && (
                <>
                  <TextField
                    label="Target Value"
                    value={editedEventDetails.targetValue || ""}
                    onChange={(e) =>
                      setEditedEventDetails({
                        ...editedEventDetails,
                        targetValue: e.target.value,
                      })
                    }
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    label="Processing Type"
                    value={editedEventDetails.processingType || ""}
                    onChange={(e) =>
                      setEditedEventDetails({
                        ...editedEventDetails,
                        processingType: e.target.value,
                      })
                    }
                    fullWidth
                    margin="normal"
                  />
                </>
              )}
              {editedEventDetails.type === "event" && (
                <>
                  <TextField
                    label="Description"
                    value={editedEventDetails.eventDescription || ""}
                    onChange={(e) =>
                      setEditedEventDetails({
                        ...editedEventDetails,
                        eventDescription: e.target.value,
                      })
                    }
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    label="Location"
                    value={editedEventDetails.location || ""}
                    onChange={(e) =>
                      setEditedEventDetails({
                        ...editedEventDetails,
                        location: e.target.value,
                      })
                    }
                    fullWidth
                    margin="normal"
                  />
                </>
              )}
            </>
          )}
        </DialogContent>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: 16 }}>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
          <Button onClick={handleUpdate} color="primary" variant="contained">
            Update
          </Button>
        </div>
      </Dialog>

    </Box>
  );
};

export default ScheduleCalendar;