'use client';

import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';

export default function MoveBatchDialog({
  open,
  selectedBatch,
  dryingAreas,
  newDryingArea,
  onDryingAreaChange,
  onClose,
  onConfirm,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Move Batch {selectedBatch?.batchNumber}</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mt: 1 }}>
          <InputLabel id="drying-area-label">New Drying Area</InputLabel>
          <Select
            labelId="drying-area-label"
            value={newDryingArea}
            onChange={(e) => onDryingAreaChange(e.target.value)}
            label="New Drying Area"
          >
            {dryingAreas
              .filter((area) => area !== selectedBatch?.dryingArea)
              .map((area) => (
                <MenuItem key={area} value={area}>
                  {area}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="primary" onClick={onConfirm} disabled={!newDryingArea}>
          Move
        </Button>
      </DialogActions>
    </Dialog>
  );
}
