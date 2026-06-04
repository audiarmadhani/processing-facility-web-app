'use client';

import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';

export default function AssignDryingDialog({
  open,
  assignBatch,
  assignArea,
  assignDate,
  assignTime,
  dryingAreas,
  onAreaChange,
  onDateChange,
  onTimeChange,
  onClose,
  onConfirm,
}) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Assign to Drying</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2 }}>
          Batch: <b>{assignBatch}</b>
        </Typography>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Drying Area</InputLabel>
          <Select value={assignArea} onChange={(e) => onAreaChange(e.target.value)} label="Drying Area">
            {dryingAreas.map((area) => (
              <MenuItem key={area} value={area}>
                {area}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Entered Date"
            type="date"
            value={assignDate}
            onChange={(e) => onDateChange(e.target.value)}
            sx={{ flex: 1 }}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Entered Time"
            type="time"
            value={assignTime}
            onChange={(e) => onTimeChange(e.target.value)}
            sx={{ flex: 1 }}
            InputLabelProps={{ shrink: true }}
            inputProps={{ step: 60 }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onConfirm}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
