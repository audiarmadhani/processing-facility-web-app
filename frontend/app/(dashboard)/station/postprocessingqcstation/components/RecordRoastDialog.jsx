'use client';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

function formatRoastDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d.getTime()) ? String(value) : d.toLocaleString();
}

function formatNumber(value) {
  if (value == null || value === '') return '—';
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : String(value);
}

export default function RecordRoastDialog({
  open,
  batch,
  roastHistory,
  roastedAt,
  setRoastedAt,
  roastProfile,
  setRoastProfile,
  endTemp,
  setEndTemp,
  firstCrackMinutes,
  setFirstCrackMinutes,
  firstCrackTemp,
  setFirstCrackTemp,
  notes,
  setNotes,
  isLoading,
  onClose,
  onAddRoast,
}) {
  const canAddRoast =
    !!batch &&
    !isLoading &&
    roastedAt &&
    roastProfile.trim() !== '' &&
    endTemp !== '' &&
    !isNaN(parseFloat(endTemp)) &&
    firstCrackMinutes !== '' &&
    !isNaN(parseFloat(firstCrackMinutes));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Record roast</DialogTitle>
      <DialogContent>
        {batch && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            Batch {batch.batchNumber} · {batch.processingType}
          </Typography>
        )}

        <Typography variant="subtitle2" gutterBottom>
          Roast history
        </Typography>
        <Table size="small" sx={{ mb: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Roasted at</TableCell>
              <TableCell>Profile</TableCell>
              <TableCell>End °C</TableCell>
              <TableCell>1st crack (min)</TableCell>
              <TableCell>1st crack (°C)</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell>By</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roastHistory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No roasts recorded yet
                </TableCell>
              </TableRow>
            ) : (
              roastHistory.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{formatRoastDate(row.roastedAt)}</TableCell>
                  <TableCell>{row.roastProfile || '—'}</TableCell>
                  <TableCell>{formatNumber(row.endTemp)}</TableCell>
                  <TableCell>{formatNumber(row.firstCrackMinutes)}</TableCell>
                  <TableCell>{formatNumber(row.firstCrackTemp)}</TableCell>
                  <TableCell>{row.notes || '—'}</TableCell>
                  <TableCell>{row.roastedBy || '—'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Typography variant="subtitle2" gutterBottom>
          Add roast
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Roasted at"
              type="datetime-local"
              fullWidth
              value={roastedAt}
              onChange={(e) => setRoastedAt(e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={isLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Roast profile"
              fullWidth
              value={roastProfile}
              onChange={(e) => setRoastProfile(e.target.value)}
              disabled={isLoading}
              placeholder="e.g. Light, Medium, Development"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="End temp (°C)"
              type="number"
              fullWidth
              value={endTemp}
              onChange={(e) => setEndTemp(e.target.value)}
              disabled={isLoading}
              inputProps={{ min: 0, step: 0.1 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="First crack (minutes)"
              type="number"
              fullWidth
              value={firstCrackMinutes}
              onChange={(e) => setFirstCrackMinutes(e.target.value)}
              disabled={isLoading}
              inputProps={{ min: 0, step: 0.1 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="First crack temp (°C, optional)"
              type="number"
              fullWidth
              value={firstCrackTemp}
              onChange={(e) => setFirstCrackTemp(e.target.value)}
              disabled={isLoading}
              inputProps={{ min: 0, step: 0.1 }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Notes (optional)"
              multiline
              rows={2}
              fullWidth
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
            />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" onClick={onAddRoast} disabled={!canAddRoast}>
              Add roast
            </Button>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
