'use client';

import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  TextField,
  Typography,
} from '@mui/material';

export default function RecordRoastDialog({
  open,
  batch,
  roastedAt,
  setRoastedAt,
  notes,
  setNotes,
  startQcAfter,
  setStartQcAfter,
  isLoading,
  onClose,
  onConfirm,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Record roast</DialogTitle>
      <DialogContent>
        {batch && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            Batch {batch.batchNumber} · {batch.processingType}
          </Typography>
        )}
        <TextField
          label="Roasted at"
          type="datetime-local"
          fullWidth
          value={roastedAt}
          onChange={(e) => setRoastedAt(e.target.value)}
          InputLabelProps={{ shrink: true }}
          margin="normal"
          disabled={isLoading}
        />
        <TextField
          label="Notes (optional)"
          multiline
          rows={3}
          fullWidth
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          margin="normal"
          disabled={isLoading}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={startQcAfter}
              onChange={(e) => setStartQcAfter(e.target.checked)}
              disabled={isLoading}
            />
          }
          label="Open QC form after recording"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onConfirm} disabled={isLoading || !batch}>
          Confirm roast
        </Button>
      </DialogActions>
    </Dialog>
  );
}
