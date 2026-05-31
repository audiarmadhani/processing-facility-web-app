'use client';

import {
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
  minFinishDate,
  onDateChange,
  onClose,
  onConfirm,
}) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Finish Drying</DialogTitle>
      <DialogContent>
        <Typography>Finish drying for batch:</Typography>
        <Typography sx={{ mt: 1, mb: 2, fontWeight: 'bold' }}>{batchNumber}</Typography>
        <TextField
          label="Finish Date"
          type="date"
          value={finishDate}
          onChange={(e) => onDateChange(e.target.value)}
          fullWidth
          required
          InputLabelProps={{ shrink: true }}
          inputProps={{
            min: minFinishDate && minFinishDate !== 'N/A' ? minFinishDate : undefined,
            max: new Date().toISOString().slice(0, 10),
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="success" onClick={onConfirm} disabled={!finishDate}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
