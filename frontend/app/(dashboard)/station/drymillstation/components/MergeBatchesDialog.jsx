'use client';

import {
  Button, Checkbox, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography,
  FormControl, InputLabel, Select, MenuItem, OutlinedInput, ListItemText, Grid, Table, TableBody,
  TableCell, TableHead, TableRow,
} from '@mui/material';
import axios from 'axios';

export default function MergeBatchesDialog({
  open, onClose, newBatchNumber, totalSelectedWeight, setTotalSelectedWeight,
  selectedBatches, setSelectedBatches, mergeNotes, setMergeNotes, parentBatches, onMerge,
}) {
  return (
  <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
    <DialogTitle>Merge Batches</DialogTitle>
    <DialogContent>
      <Typography>New Batch Number: {newBatchNumber}</Typography>
      <Typography>Total Weight: {totalSelectedWeight.toFixed(2)} kg</Typography>
      <FormControl fullWidth sx={{ mt: 2 }}>
        <InputLabel id="merge-batches-label">Selected Batches</InputLabel>
        <Select
          labelId="merge-batches-label"
          multiple
          value={selectedBatches}
          onChange={(e) => {
            const newSelected = e.target.value;
            setSelectedBatches(newSelected);
            const selectedBatchDetails = parentBatches.filter((b) => newSelected.includes(`${b.batchNumber},${b.producer},${b.processingType}`));
            const totalWeight = selectedBatchDetails.reduce(
              (sum, b) => sum + parseFloat(b.drying_weight || 0),
              0
            );
            setTotalSelectedWeight(totalWeight);
          }}
          input={<OutlinedInput label="Selected Batches" />}
          renderValue={(selected) => selected.map(s => s.split(',')[0]).join(", ")}
          MenuProps={{
            PaperProps: {
              style: {
                maxHeight: 48 * 4.5 + 8,
                width: 250,
              },
            },
          }}
        >
          {parentBatches.map((batch) => (
            <MenuItem
              key={`${batch.batchNumber},${batch.producer},${batch.processingType}`}
              value={`${batch.batchNumber},${batch.producer},${batch.processingType}`}
              disabled={batch.status !== "In Dry Mill" || batch.dryMillExited || batch.storedDate}
            >
              <Checkbox
                checked={selectedBatches.includes(`${batch.batchNumber},${batch.producer},${batch.processingType}`)}
              />
              <ListItemText
                primary={`${batch.batchNumber} (${batch.processingType}, ${batch.producer}, ${batch.drying_weight} kg, ${batch.dryMillMerged})`}
              />
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
