'use client';

import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Grid,
} from '@mui/material';

export default function TrackWeightDialog({
  open,
  row,
  weightValue,
  onWeightChange,
  onClose,
  onConfirm,
  parseWeightInput,
}) {
  if (!row) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Track weight processed</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Record cherry weight processed for this wet mill run. Available for batch:{' '}
          <strong>{row.availableWeight} kg</strong>
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField label="Batch" value={row.batchNumber} fullWidth InputProps={{ readOnly: true }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Lot" value={row.lotNumber} fullWidth InputProps={{ readOnly: true }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Processing type"
              value={row.processingType}
              fullWidth
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Producer" value={row.producer} fullWidth InputProps={{ readOnly: true }} />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Weight processed (kg)"
              type="number"
              value={weightValue}
              onChange={(e) => onWeightChange(parseWeightInput(e.target.value))}
              fullWidth
              required
              inputProps={{ step: 0.01, min: 0 }}
              autoFocus
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onConfirm} disabled={!weightValue}>
          Save weight
        </Button>
      </DialogActions>
    </Dialog>
  );
}
