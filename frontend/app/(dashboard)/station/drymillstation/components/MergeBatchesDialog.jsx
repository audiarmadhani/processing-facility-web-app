'use client';

import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';

export default function MergeBatchesDialog({
  open,
  onClose,
  newBatchNumber,
  totalSelectedWeight,
  selectedBatchDetails,
  mergeNotes,
  setMergeNotes,
  onMerge,
  isLoading,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Confirm merge</DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 1 }}>
          New batch number: <strong>{newBatchNumber}</strong>
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          Combined drying weight: <strong>{totalSelectedWeight.toFixed(2)} kg</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Each batch must already have huller output saved and a sample roast recorded in GB QC.
        </Typography>
        <Typography variant="subtitle2" gutterBottom>
          Batches to merge ({selectedBatchDetails.length})
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Batch</TableCell>
              <TableCell>Processing</TableCell>
              <TableCell>Producer</TableCell>
              <TableCell align="right">Weight (kg)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {selectedBatchDetails.map((batch) => (
              <TableRow key={batch.id}>
                <TableCell>{batch.batchNumber}</TableCell>
                <TableCell>{batch.processingType}</TableCell>
                <TableCell>{batch.producerLabel}</TableCell>
                <TableCell align="right">{batch.drying_weight}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TextField
          label="Merge notes (optional)"
          multiline
          rows={3}
          value={mergeNotes}
          onChange={(e) => setMergeNotes(e.target.value)}
          fullWidth
          margin="normal"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={onMerge}
          color="primary"
          variant="contained"
          disabled={selectedBatchDetails.length < 2 || isLoading}
        >
          Confirm merge
        </Button>
      </DialogActions>
    </Dialog>
  );
}
