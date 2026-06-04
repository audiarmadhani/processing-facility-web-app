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
} from '@mui/material';

export default function FinishDryingDialog({
  open,
  batchNumber,
  finishDate,
  finishTime,
  minFinishDate,
  onDateChange,
  onTimeChange,
  onClose,
  onConfirm,
}) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Finish Drying</DialogTitle>
      <DialogContent>
        <Typography>Finish drying for batch:</Typography>
        <Typography sx={{ mt: 1, mb: 2, fontWeight: 'bold' }}>{batchNumber}</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Finish Date"
            type="date"
            value={finishDate}
            onChange={(e) => onDateChange(e.target.value)}
            sx={{ flex: 1 }}
            required
            InputLabelProps={{ shrink: true }}
            inputProps={{
              min: minFinishDate && minFinishDate !== 'N/A' ? minFinishDate : undefined,
              max: new Date().toISOString().slice(0, 10),
            }}
          />
          <TextField
            label="Finish Time"
            type="time"
            value={finishTime}
            onChange={(e) => onTimeChange(e.target.value)}
            sx={{ flex: 1 }}
            required
            InputLabelProps={{ shrink: true }}
            inputProps={{ step: 60 }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          color="success"
          onClick={onConfirm}
          disabled={!finishDate || !finishTime}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
