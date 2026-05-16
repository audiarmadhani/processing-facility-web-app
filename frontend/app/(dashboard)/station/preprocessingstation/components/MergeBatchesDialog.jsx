'use client';

import {
  Button, Checkbox, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, OutlinedInput, ListItemText, TextField, Typography,
} from '@mui/material';
import { MENU_PROPS } from '../columns';

export default function MergeBatchesDialog({
  open, onClose, newBatchNumber, selectedBatches, setSelectedBatches, mergeNotes, setMergeNotes,
  unprocessedBatches, onMerge,
}) {
  return (
  <Dialog
    open={open}
    onClose={onClose}
  >
    <DialogTitle>Merge Batches</DialogTitle>
    <DialogContent>
      <Typography>Select batches to merge into new batch: {newBatchNumber}</Typography>
      <FormControl fullWidth sx={{ mt: 2 }}>
        <InputLabel id="merge-batches-label">Select Batches</InputLabel>
        <Select
          labelId="merge-batches-label"
          multiple
          value={selectedBatches}
          onChange={(e) => setSelectedBatches(e.target.value)}
          input={<OutlinedInput label="Select Batches" />}
          renderValue={(selected) => selected.join(', ')}
          MenuProps={MENU_PROPS}
        >
          {unprocessedBatches.map((batch) => (
            <MenuItem
              key={batch.batchNumber}
              value={batch.batchNumber}
              disabled={batch.finished || parseFloat(batch.availableWeight) <= 0 || batch.commodityType === 'Green Bean'}
            >
              <Checkbox checked={selectedBatches.includes(batch.batchNumber)} />
              <ListItemText primary={`${batch.batchNumber} (${batch.type}, ${batch.availableWeight} kg)`} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        label="Merge Notes"
        multiline
        rows={4}
        value={mergeNotes}
        onChange={(e) => setMergeNotes(e.target.value)}
        fullWidth
        margin="normal"
      />
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="primary">
        Cancel
      </Button>
      <Button
        onClick={onMerge}
        color="primary"
        variant="contained"
        disabled={selectedBatches.length < 2}
      >
        Merge
      </Button>
    </DialogActions>
  </Dialog>
  );
}
