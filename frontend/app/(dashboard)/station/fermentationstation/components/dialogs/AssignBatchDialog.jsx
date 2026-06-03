'use client';

import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Autocomplete,
  TextField,
  Box,
} from '@mui/material';

export default function AssignBatchDialog({
  open,
  row,
  availableBatches,
  assignBatchNumber,
  onBatchChange,
  onClose,
  onConfirm,
}) {
  const label = row?.referenceNumber && row?.experimentNumber
    ? `${row.referenceNumber} / EXP ${row.experimentNumber}`
    : row?.experimentNumber || '';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assign Batch</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2 }}>
          Link a received batch to order sheet: <b>{label}</b>
        </Typography>
        <Autocomplete
          options={availableBatches}
          getOptionLabel={(option) => option.batchNumber || ''}
          value={availableBatches.find((b) => b.batchNumber === assignBatchNumber) || null}
          onChange={(e, newValue) => onBatchChange(newValue?.batchNumber || '')}
          renderOption={(props, option) => (
            <li {...props}>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography>{option.batchNumber}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Farmer: {option.farmerName}, {option.weight}kg, Type: {option.type}
                </Typography>
              </Box>
            </li>
          )}
          renderInput={(params) => (
            <TextField {...params} label="Batch Number" required fullWidth />
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onConfirm} disabled={!assignBatchNumber}>
          Assign
        </Button>
      </DialogActions>
    </Dialog>
  );
}
