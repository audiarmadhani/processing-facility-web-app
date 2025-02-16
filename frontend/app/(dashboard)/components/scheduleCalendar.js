"use client";

import React, { useEffect, useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import dayjs from 'dayjs'; // Import dayjs
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'; // Correct import
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

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
	const { data: session, status } = useSession(); // Get session data
	const [events, setEvents] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [isAddTargetDialogOpen, setIsAddTargetDialogOpen] = useState(false);
	const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false); // For events
	const [isAddPriceDialogOpen, setIsAddPriceDialogOpen] = useState(false); // New state for price dialog
	const [newTarget, setNewTarget] = useState({
		referenceNumber: '',
		metric: '',
		timeFrame: '',
		targetValue: '',
		startDate: '',
		endDate: '',
	});	

	const [newTargetFormValues, setNewTargetFormValues] = useState({  // Separate state for form values
		referenceNumber: '',
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
	const [newPrice, setNewPrice] = useState({  // New state for price
		type: '',
		minPrice: '',
		maxPrice: '',
		validAt: '',
		validUntil: ''
	});
	
	const [selectedRange, setSelectedRange] = useState(null);
	const [isEventDetailsDialogOpen, setIsEventDetailsDialogOpen] = useState(false); // State for event details dialog
  	const [selectedEventDetails, setSelectedEventDetails] = useState(null); // State to store clicked event details
	const [editedEventDetails, setEditedEventDetails] = useState({});
	const theme = useTheme();
	const calendarRef = useRef(null);

	const [referenceMappings, setReferenceMappings] = useState([]);

	// Predefined options
	// State for predefinedReferenceNumber
	const [predefinedReferenceNumber, setPredefinedReferenceNumber] = useState([]);
	const [predefinedProductLine, setPredefinedProductLine] = useState([]);
	const [predefinedProcessingType, setPredefinedProcessingType] = useState([]);
	const [predefinedProducer, setPredefinedProducer] = useState([]);
	const [predefinedQuality, setPredefinedQuality] = useState([]);
	const [predefinedType, setPredefinedType] = useState([]);
	const predefinedTypes = ['Arabica', 'Robusta']; // For Price Metric


	// Fetch reference mappings from the API
	useEffect(() => {
		const fetchReferenceMappings = async () => {
			try {
				const response = await fetch('https://processing-facility-backend.onrender.com/api/referenceMappings');
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				const data = await response.json();
				setReferenceMappings(data); // Store the full dataset
			} catch (err) {
				console.error("Error fetching reference mappings:", err);
				setError(err.message);
			}
		};

		fetchReferenceMappings();
	}, []);

	const handleReferenceNumberChange = (event, value) => {
		// Find the selected reference mapping object
		const selectedMapping = referenceMappings.find(
			(mapping) => mapping.referenceNumber === value
		);

		if (selectedMapping) {
			// Update the form values with the selected data
			setNewTargetFormValues({
				...newTargetFormValues,
				referenceNumber: selectedMapping.referenceNumber,
				productLine: selectedMapping.productLine,
				processingType: selectedMapping.processingType,
				producer: selectedMapping.producer,
				quality: selectedMapping.quality,
				type: selectedMapping.type,
			});
		}
	};


  const predefinedMetrics = ['Total Weight Produced'];
  const timeframes = ['this-week', 'next-week', 'previous-week', 'this-month', 'next-month', 'previous-month'];
	const predefinedCategory = ['Bali Holiday', 'National Holiday'];


  // Determine colors based on the current theme mode
  const calendarBgColor = theme.palette.mode === 'dark' ? '#424242' : '#ffffff';
  const calendarTextColor = theme.palette.mode === 'dark' ? '#ffffff' : '#000000';

	const [refreshCounter, setRefreshCounter] = useState(0);

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
					title: `${target.referenceNumber} (${target.targetValue} kg)`,
					start: target.startDate,
					end: target.endDate,
					extendedProps: {
						type: 'target',
						referenceNumber: target.referenceNumber,
						metric: target.metric,
						timeFrame: target.timeFrame,
						targetValue: target.targetValue,
						productLine: target.productLine,
						processingType: target.processingType,
						producer: target.producer,
						quality: target.quality,
						coffeeType: target.type
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
						type: 'event', // Add a category to distinguish targets
						backgroundColor: color, // Set background color based on category
						borderColor: color, // Match border color with background
						extendedProps: {
							eventDescription: event.eventDescription,
							location: event.location,
							category: category, // Add a category to distinguish events
						},
					};
				});

        setEvents([...mappedTargets, ...mappedEvents]); // Combine targets and events

      } catch (err) {
				console.error("Error fetching data:", err);
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};
	
		fetchData();
	}, [refreshCounter]); // Add refreshCounter as dependency

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

  const handleOpenAddPriceDialog = () => {
    setIsAddPriceDialogOpen(true);
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
          title: `${newTarget.referenceNumber} (${newTarget.targetValue} kg)`,
          start: newTarget.startDate,
          end: newTarget.endDate,
					referenceNumber: newTarget.referenceNumber,
          extendedProps: { category: 'target' },
        },
      ]);

			if (response.ok) {
				setRefreshCounter(prev => prev + 1); // Trigger data refresh
				setIsAddTargetDialogOpen(false);
				setNewTargetFormValues({ // Clear the form values
					referenceNumber: '',
					metric: '',
					timeFrame: '',
					targetValue: '',
					startDate: '',
					endDate: '',
				});
			}

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
        throw new Error(errorData.error || 'Failed to create event.');
      }

      const createdEvent = await response.json();
      setEvents((prevEvents) => [
        ...prevEvents,
        {
          id: createdEvent.id,
          title: newEventFormValues.eventName,
          start: newEventFormValues.startDate,
          end: newEventFormValues.endDate,
          allDay: newEventFormValues.allDay,
          extendedProps: { category: 'event' },
        },
      ]);

			if (response.ok) {
				setRefreshCounter(prev => prev + 1); // Trigger data refresh
				setIsAddEventDialogOpen(false);
				setNewEventFormValues({
					eventName: '',
					startDate: '',
					endDate: '',
					eventDescription: '',
					allDay: false,
					location: '',
					category: '',
				});
			}

    } catch (err) {
      console.error('Error creating event:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleSubmitPrice = async () => {
    if (!session || !session.user) {
        console.error("No user session found.");
        alert("You must be logged in to add a price metric.");
        return;
      }

    try {
        const payload = {
            ...newPrice,
            createdBy: session.user.email  // Add createdBy here
        };

        const response = await fetch('https://processing-facility-backend.onrender.com/api/price', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create price metric.');
        }

        // Optionally, refresh your data or give user feedback here.
        if(response.ok) {
            setRefreshCounter(prev => prev + 1); //trigger refresh data
            setIsAddPriceDialogOpen(false);
            setNewPrice({ // Clear the form values
                type: '',
                minPrice: '',
                maxPrice: '',
                validAt: '',
                validUntil: ''
            });
        }
    } catch (err) {
        console.error('Error creating price metric:', err);
        alert(`Error: ${err.message}`);
    }
};

	const handleEventClick = (clickInfo) => {
		const { event } = clickInfo;
		const isTarget = event.extendedProps.type === 'target';
		const isPrice = event.extendedProps.type === 'price'; //check if it is price

		if (isPrice) {
			const priceDetails = {
				id: event.id,
				type: event.extendedProps.type, // Make sure this is 'price'
				minPrice: event.extendedProps.minPrice,
				maxPrice: event.extendedProps.maxPrice,
				validAt: event.extendedProps.validAt,
				validUntil: event.extendedProps.validUntil,
				// ... any other fields you want to display/edit
			};
			setSelectedEventDetails(priceDetails);
			setEditedEventDetails(priceDetails);
			setIsEventDetailsDialogOpen(true);
			return; // Important:  Exit early after handling price
		}

		const baseDetails = {
			id: event.id,
			type: event.extendedProps.type || 'event',
			startDate: dayjs(event.start).format('YYYY-MM-DD'),
			endDate: event.end
				? dayjs(event.end).subtract(1, 'day').format('YYYY-MM-DD')
				: dayjs(event.start).format('YYYY-MM-DD'),
		};

		// ... (rest of your existing handleEventClick logic for events and targets) ...
		const eventSpecific = {
			title: event.title,
			eventName: event.title,
			eventDescription: event.extendedProps.eventDescription,
			location: event.extendedProps.location,
			category: event.extendedProps.category,
			allDay: event.allDay,
		};

		const targetSpecific = {
			targetValue: event.title.match(/\((\d+)\s?kg\)/)?.[1] || 'N/A',
			title: event.title,
			referenceNumber: event.extendedProps.referenceNumber,
			targetValue: event.extendedProps.targetValue || 'N/A',
		};

		// Find the corresponding reference mapping for targets
		if (isTarget) {
			const selectedMapping = referenceMappings.find(
				(mapping) => mapping.referenceNumber === event.extendedProps.referenceNumber
			);

			if (selectedMapping) {
				targetSpecific.productLine = selectedMapping.productLine;
				targetSpecific.processingType = selectedMapping.processingType;
				targetSpecific.producer = selectedMapping.producer;
				targetSpecific.quality = selectedMapping.quality;
				targetSpecific.coffeeType = selectedMapping.coffeeType;
			}
		}

		const details = {
			...baseDetails,
			...(isTarget ? targetSpecific : eventSpecific),
		};

		setSelectedEventDetails(details);
		setEditedEventDetails(details);
		setIsEventDetailsDialogOpen(true);
	};	
	

	// Handle update: Sends updated data to the proper API endpoint based on type.
	const handleUpdate = async () => {
		const { id, type, ...rest } = editedEventDetails;
	
		if (!id || !type) {
			alert("Missing event ID or type. Please try again.");
			return;
		}
	
		try {
			let url = "";
			let payload = {};
	
			if (type === "target") {
				url = `https://processing-facility-backend.onrender.com/api/targets/${id}`;
				payload = {
					targetValue: editedEventDetails.targetValue,
					startDate: editedEventDetails.startDate,
					endDate: editedEventDetails.endDate,
					id: editedEventDetails.id
				};
			} else if (type === "event") {
				url = `https://processing-facility-backend.onrender.com/api/events/${id}`;
				payload = rest; // Send all fields for events
			} else if (type === "price") {
				url = `https://processing-facility-backend.onrender.com/api/price/${id}`;
				payload = {
					type: editedEventDetails.type,
					min_price: editedEventDetails.minPrice,  // Use snake_case
					max_price: editedEventDetails.maxPrice,
					valid_at: editedEventDetails.validAt,
					valid_until: editedEventDetails.validUntil,
				};
			}
	
			const response = await fetch(url, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
	
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData?.error || "Failed to update.");
			}
			if (type === 'price') {
				// Handle price update in state
				setEvents(prevEvents =>
					prevEvents.map(evt =>
						evt.id === id ? { ...evt, ...payload, title: `${payload.type} Price` } : evt //update
					)
				);
			}
			else{
				// Update local state
				setEvents(prevEvents =>
					prevEvents.map(evt => {
						if (evt.id === id) {
							if (type === "target") {
								// For targets: preserve original data and update only allowed fields
								return {
									...evt,
									title: `${evt.extendedProps.referenceNumber} (${editedEventDetails.targetValue} kg)`,
									start: editedEventDetails.startDate,
									end: editedEventDetails.endDate,
									extendedProps: {
										...evt.extendedProps,
										targetValue: editedEventDetails.targetValue
									}
								};
							}
							// For events: keep existing update logic
							return { ...evt, ...editedEventDetails };
						}
						return evt;
					})
				);
			}
	
	
			if (response.ok) {
				setRefreshCounter(prev => prev + 1); // Trigger data refresh
				setIsEventDetailsDialogOpen(false);
			}
	
		} catch (err) {
			console.error("Error updating record:", err);
			alert(`Update failed: ${err.message}`);
		}
	};


	// Handle delete: Calls the proper API endpoint based on type and removes the event from local state.
	const handleDelete = async () => {
		const { id, type } = selectedEventDetails;
	
		if (!id || !type) {
			alert("Missing event ID or type.");
			return;
		}
	
		try {
			let url = "";
			if (type === "target") {
				url = `https://processing-facility-backend.onrender.com/api/targets/${id}`;
			} else if (type === "event") {
				url = `https://processing-facility-backend.onrender.com/api/events/${id}`;
			} else if (type === "price") { // Add condition for price
				url = `https://processing-facility-backend.onrender.com/api/price/${id}`;
			}
	
			const response = await fetch(url, { method: "DELETE" });
	
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to delete.");
			}
	
			// Remove the deleted event/target/price from local state.
			setEvents((prevEvents) => prevEvents.filter((evt) => evt.id !== id));
	
			if (response.ok) {
				setRefreshCounter(prev => prev + 1); // Trigger data refresh
				setIsEventDetailsDialogOpen(false);
			}
	
		} catch (err) {
			console.error("Error deleting record:", err);
			alert(`Deletion failed: ${err.message}`);
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
				<Button variant="contained" color="primary" onClick={handleOpenAddEventDialog}>
						Add Event
				</Button>
				<Button variant="contained" color="primary" onClick={handleOpenAddPriceDialog}>
						Add Price
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
				firstDay={1}
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
										
						{/* Reference Number Dropdown */}
						<Grid item xs={12}>
							<Autocomplete
								options={referenceMappings.map((mapping) => mapping.referenceNumber)}
								value={newTargetFormValues.referenceNumber}
								onChange={(_, newValue) => handleReferenceNumberChange(_, newValue)}
								renderInput={(params) => (
									<TextField {...params} label="Reference Number" fullWidth />
								)}
							/>
						</Grid>

						{/* Auto-populated Fields */}
						<Grid item xs={6}>
							<TextField
								label="Product Line"
								value={newTargetFormValues.productLine || ''}
								fullWidth
								InputProps={{ readOnly: true }}
							/>
						</Grid>

						<Grid item xs={6}>
							<TextField
								label="Processing Type"
								value={newTargetFormValues.processingType || ''}
								fullWidth
								InputProps={{ readOnly: true }}
							/>
						</Grid>

						<Grid item xs={6}>
							<TextField
								label="Producer"
								value={newTargetFormValues.producer || ''}
								fullWidth
								InputProps={{ readOnly: true }}
							/>
						</Grid>

						<Grid item xs={6}>
							<TextField
								label="Quality"
								value={newTargetFormValues.quality || ''}
								fullWidth
								InputProps={{ readOnly: true }}
							/>
						</Grid>

						<Grid item xs={6}>
							<TextField
								label="Type"
								value={newTargetFormValues.type || ''}
								fullWidth
								InputProps={{ readOnly: true }}
							/>
						</Grid>

						<Grid item xs={6}>
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


	{/* Dialog for adding a new event */}
      <Dialog open={isAddEventDialogOpen} onClose={() => setIsAddEventDialogOpen(false)}>
        <DialogTitle>Add New Event</DialogTitle>
        <DialogContent>

					<LocalizationProvider dateAdapter={AdapterDayjs}>
						
						<Grid container spacing={2}>

							<Grid item xs={12}>
								<TextField
									label="Event Name"
									fullWidth
									value={newEvent.eventName}
									onChange={(e) => setNewEvent({ ...newEvent, eventName: e.target.value })}
								/>
							</Grid>

							<Grid item xs={12} sm={6}>
								<DateTimePicker
									label="Start Date and Time"
									value={newEvent.startDate ? dayjs(newEvent.startDate) : null}
									onChange={(newValue) => {
										if (newValue) {
											let newStartDate = newValue;
											if (newEvent.allDay) {
													newStartDate = newStartDate.startOf('day'); // Set to 00:00:00
											}
											setNewEvent({ ...newEvent, startDate: newStartDate.toISOString()});
										} else {
											setNewEvent({ ...newEvent, startDate: ''})
										}

									}}
									renderInput={(params) => <TextField {...params} fullWidth />}
								/>
							</Grid>

							<Grid item xs={12} sm={6}>
								<DateTimePicker
									label="End Date and Time"
									value={newEvent.endDate ? dayjs(newEvent.endDate) : null}
									onChange={(newValue) => {
										if (newValue) {
												let newEndDate = newValue;
												if (newEvent.allDay) {
													newEndDate = newEndDate.endOf('day'); // Set to 23:59:59
												}
												setNewEvent({ ...newEvent, endDate: newEndDate.toISOString() });
										} else {
												setNewEvent({ ...newEvent, endDate: '' });
										}
									}}
									renderInput={(params) => <TextField {...params} fullWidth />}
								/>
							</Grid>

							<Grid item xs={12}>
								<FormControlLabel
									control={
										<Checkbox
											checked={newEvent.allDay}
											onChange={(e) => {
												const isAllDay = e.target.checked;
												setNewEvent(prevEvent => {
													let updatedEvent = { ...prevEvent, allDay: isAllDay };

													if (isAllDay) {
														if (updatedEvent.startDate) {
																updatedEvent.startDate = dayjs(updatedEvent.startDate).startOf('day').toISOString();
														}
														if (updatedEvent.endDate) {
																updatedEvent.endDate = dayjs(updatedEvent.endDate).endOf('day').toISOString();
														}
													}
													// No else needed.  If not allDay, keep the time the user selected.

													return updatedEvent;
												});
											}}
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
					</LocalizationProvider>
				</DialogContent>
			</Dialog>

	{/* Dialog for adding a new price metric */}
		<Dialog open={isAddPriceDialogOpen} onClose={() => setIsAddPriceDialogOpen(false)}>
			<DialogTitle>Add New Price Metric</DialogTitle>
			<DialogContent>
				<LocalizationProvider dateAdapter={AdapterDayjs}>
					<Grid container spacing={2}>
						<Grid item xs={12}>
							<FormControl fullWidth required>
								<InputLabel id="price-type-label">Type</InputLabel>
								<Select
									labelId="price-type-label"
									value={newPrice.type}
									onChange={(e) => setNewPrice({ ...newPrice, type: e.target.value })}
									input={<OutlinedInput label="Type" />}
								>
									{predefinedTypes.map((type) => (
										<MenuItem key={type} value={type}>
											{type}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Grid>
						<Grid item xs={12}>
							<TextField
								label="Minimum Price"
								type="number"
								value={newPrice.minPrice}
								onChange={(e) => setNewPrice({ ...newPrice, minPrice: e.target.value })}
								fullWidth
								required
							/>
						</Grid>
						<Grid item xs={12}>
							<TextField
								label="Maximum Price"
								type="number"
								value={newPrice.maxPrice}
								onChange={(e) => setNewPrice({ ...newPrice, maxPrice: e.target.value })}
								fullWidth
								required
							/>
						</Grid>
						<Grid item xs={12}>
							<DateTimePicker
								label="Valid At"
								value={newPrice.validAt ? dayjs(newPrice.validAt) : null}
								onChange={(newValue) => {
									if (newValue) {
										setNewPrice({ ...newPrice, validAt: newValue.toISOString() });
									} else {
										setNewPrice({ ...newPrice, validAt: '' }); // Handle null/clear
									}
								}}
								renderInput={(params) => <TextField {...params} fullWidth />}
							/>
						</Grid>
						<Grid item xs={12}>
							<DateTimePicker
								label="Valid Until"
								value={newPrice.validUntil ? dayjs(newPrice.validUntil) : null}
								onChange={(newValue) => {
									if (newValue) {
										setNewPrice({ ...newPrice, validUntil: newValue.toISOString() });
									} else {
										setNewPrice({ ...newPrice, validUntil: '' }); // Handle null/clear
									}
								}}
								renderInput={(params) => <TextField {...params} fullWidth />}
							/>
						</Grid>

						<Grid item xs={12}>
							<Button onClick={handleSubmitPrice} variant="contained" color="success">
								Save Price Metric
							</Button>
						</Grid>
					</Grid>
				</LocalizationProvider>
			</DialogContent>
		</Dialog>

	{/* Dialog for showing/editing event details */}
		<Dialog
			open={isEventDetailsDialogOpen}
			onClose={() => setIsEventDetailsDialogOpen(false)}
			maxWidth="sm"
			fullWidth
		>
			<DialogTitle>
				{editedEventDetails.type === 'price' ? 'Edit Price Metric' : 'Edit Event Details'}
			</DialogTitle>

			<DialogContent dividers>
				<LocalizationProvider dateAdapter={AdapterDayjs}>
					<Grid container spacing={2}>

						{/* Price-Specific Fields */}
						{editedEventDetails.type === 'price' && (
							<>
								<Grid item xs={12}>
									<FormControl fullWidth required>
										<InputLabel id="price-type-label">Type</InputLabel>
										<Select
											labelId="price-type-label"
											value={editedEventDetails.type || ''}
											onChange={(e) => setEditedEventDetails(prev => ({ ...prev, type: e.target.value }))}
											input={<OutlinedInput label="Type" />}
										>
											{predefinedTypes.map((type) => (
												<MenuItem key={type} value={type}>
													{type}
												</MenuItem>
											))}
										</Select>
									</FormControl>
								</Grid>
								<Grid item xs={12}>
									<TextField
										label="Minimum Price"
										type="number"
										value={editedEventDetails.minPrice || ''}
										onChange={(e) => setEditedEventDetails(prev => ({ ...prev, minPrice: e.target.value }))}
										fullWidth
										required
									/>
								</Grid>
								<Grid item xs={12}>
									<TextField
										label="Maximum Price"
										type="number"
										value={editedEventDetails.maxPrice || ''}
										onChange={(e) => setEditedEventDetails(prev => ({ ...prev, maxPrice: e.target.value }))}
										fullWidth
										required
									/>
								</Grid>
								<Grid item xs={12}>
									<DateTimePicker
										label="Valid At"
										value={editedEventDetails.validAt ? dayjs(editedEventDetails.validAt) : null}
										onChange={(newValue) => {
											if (newValue) {
												setEditedEventDetails(prev => ({ ...prev, validAt: newValue.toISOString() }));
											} else {
												setEditedEventDetails(prev => ({ ...prev, validAt: '' })); // Handle null/clear
											}
										}}
										renderInput={(params) => <TextField {...params} fullWidth />}
									/>
								</Grid>
								<Grid item xs={12}>
									<DateTimePicker
										label="Valid Until"
										value={editedEventDetails.validUntil ? dayjs(editedEventDetails.validUntil) : null}
										onChange={(newValue) => {
											if (newValue) {
												setEditedEventDetails(prev => ({ ...prev, validUntil: newValue.toISOString() }));
											} else {
												setEditedEventDetails(prev => ({ ...prev, validUntil: '' })); // Handle null/clear
											}
										}}
										renderInput={(params) => <TextField {...params} fullWidth />}
									/>
								</Grid>
							</>
						)}

						{/* Common Fields */}
						{editedEventDetails.type !== 'price' && (
						<Grid item xs={12} sm={6}>
							<DateTimePicker
								label="Start Date and Time"
								value={editedEventDetails.startDate ? dayjs(editedEventDetails.startDate) : null}
								onChange={(newValue) => {
									if (newValue) {
										let newStartDate = newValue;
										if (editedEventDetails.allDay) {
											newStartDate = newStartDate.startOf('day'); // Set to 00:00:00 if all-day
										}
										setEditedEventDetails(prev => ({ ...prev, startDate: newStartDate.toISOString() }));
									} else {
										setEditedEventDetails(prev => ({ ...prev, startDate: '' })); // Handle null/clear
									}
								}}
								renderInput={(params) => <TextField {...params} fullWidth />}
							/>
						</Grid>
						)}

						{editedEventDetails.type !== 'price' && (
						<Grid item xs={12} sm={6}>
							<DateTimePicker
								label="End Date and Time"
								value={editedEventDetails.endDate ? dayjs(editedEventDetails.endDate) : null}
								onChange={(newValue) => {
									if (newValue) {
										let newEndDate = newValue;
										if (editedEventDetails.allDay) {
											newEndDate = newEndDate.endOf('day');
										}
										setEditedEventDetails(prev => ({ ...prev, endDate: newEndDate.toISOString() }));
									} else {
										setEditedEventDetails(prev => ({ ...prev, endDate: '' }));//handle empty date
									}
								}}
								renderInput={(params) => <TextField {...params} fullWidth />}
							/>
						</Grid>
						)}

						{/* Event-Specific Fields */}
						{editedEventDetails.type === 'event' && (
							<>
								<Grid item xs={12}>
									<TextField
										label="Event Name"
										fullWidth
										value={editedEventDetails.eventName || ''}
										onChange={(e) => setEditedEventDetails(prev => ({ ...prev, eventName: e.target.value }))}
									/>
								</Grid>

								<Grid item xs={12}>
									<TextField
										label="Description"
										multiline
										rows={3}
										fullWidth
										value={editedEventDetails.eventDescription || ''}
										onChange={(e) => setEditedEventDetails(prev => ({ ...prev, eventDescription: e.target.value }))}
									/>
								</Grid>

								<Grid item xs={12} sm={6}>
									<TextField
										label="Location"
										fullWidth
										value={editedEventDetails.location || ''}
										onChange={(e) => setEditedEventDetails(prev => ({ ...prev, location: e.target.value }))}
									/>
								</Grid>

								<Grid item xs={12} sm={6}>
									<Autocomplete
										options={predefinedCategory}
										value={editedEventDetails.category || ''}
										onChange={(_, newValue) => setEditedEventDetails(prev => ({ ...prev, category: newValue }))}
										renderInput={(params) => (
											<TextField
												{...params}
												label="Category"
												fullWidth
											/>
										)}
									/>
								</Grid>

								<Grid item xs={12}>
									<FormControlLabel
										control={
											<Checkbox
												checked={editedEventDetails.allDay || false}
												onChange={(e) => {
													const isAllDay = e.target.checked;
													setEditedEventDetails(prevDetails => {
														let updatedDetails = { ...prevDetails, allDay: isAllDay };

														if (isAllDay) {
															if (updatedDetails.startDate) {
																updatedDetails.startDate = dayjs(updatedDetails.startDate).startOf('day').toISOString();
															}
															if (updatedDetails.endDate) {
																updatedDetails.endDate = dayjs(updatedDetails.endDate).endOf('day').toISOString();
															}
														}
														return updatedDetails;
													});
												}}
											/>
										}
										label="All-Day Event"
									/>
								</Grid>

							</>
						)}

						{/* Target-Specific Fields */}
						{editedEventDetails.type === 'target' && (
							<>
								{/* Read-only display fields */}
								<Grid item xs={12}>
									<TextField
										label="Reference Number"
										fullWidth
										value={editedEventDetails.referenceNumber || ''}
										InputProps={{ readOnly: true }}
									/>
								</Grid>

								<Grid item xs={6}>
									<TextField
										label="Product Line"
										fullWidth
										value={editedEventDetails.productLine || ''}
										InputProps={{ readOnly: true }}
									/>
								</Grid>

								<Grid item xs={6}>
									<TextField
										label="Processing Type"
										fullWidth
										value={editedEventDetails.processingType || ''}
										InputProps={{ readOnly: true }}
									/>
								</Grid>

								<Grid item xs={6}>
									<TextField
										label="Producer"
										fullWidth
										value={editedEventDetails.producer || ''}
										InputProps={{ readOnly: true }}
									/>
								</Grid>

								<Grid item xs={6}>
									<TextField
										label="Quality"
										fullWidth
										value={editedEventDetails.quality || ''}
										InputProps={{ readOnly: true }}
									/>
								</Grid>

								<Grid item xs={6}>
									<TextField
										label="Type"
										fullWidth
										value={editedEventDetails.coffeeType || ''}
										InputProps={{ readOnly: true }}
									/>
								</Grid>

								{/* Editable field */}
								<Grid item xs={12}>
									<TextField
										label="Target Value (kg)"
										type="number"
										fullWidth
										value={editedEventDetails.targetValue || ''}
										onChange={(e) =>
											setEditedEventDetails((prev) => ({ ...prev, targetValue: e.target.value }))
										}
									/>
								</Grid>
							</>
						)}

					</Grid>
				</LocalizationProvider>
			</DialogContent>


			<div style={{ display: "flex", justifyContent: "flex-end", padding: 16 }}>
				<Button onClick={handleDelete} color="error" variant="contained" sx={{ mr: 2 }}>
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