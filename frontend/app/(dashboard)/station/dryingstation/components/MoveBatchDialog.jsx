'use client';

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  MenuItem,
  Paper,
  Select,
  FormControl,
  InputLabel,
  TextField,
  Typography,
} from '@mui/material';
import { formatDryingDateTimeWita } from '../utils/dryingRowHelpers';

function formatMovementLabel(movement) {
  if (!movement.fromArea) {
    return `Initial assignment → ${movement.toArea}`;
  }
  return `${movement.fromArea} → ${movement.toArea}`;
}

export default function MoveBatchDialog({
  open,
  selectedBatch,
  dryingAreas,
  newDryingArea,
  onDryingAreaChange,
  moveDate,
  onMoveDateChange,
  moveTime,
  onMoveTimeChange,
  moveNotes,
  onMoveNotesChange,
  dryingAreaMovements,
  movementsLoading,
  onClose,
  onConfirm,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Move Batch {selectedBatch?.batchNumber}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Current area: <strong>{selectedBatch?.dryingArea || '—'}</strong>
        </Typography>

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Drying Area History
        </Typography>
        <Box
          sx={{
            maxHeight: 180,
            overflowY: 'auto',
            mb: 2,
            pr: 0.5,
          }}
        >
          {movementsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : dryingAreaMovements.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No movement history yet
            </Typography>
          ) : (
            dryingAreaMovements.map((movement) => (
              <Paper key={movement.id} variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                <Typography variant="body2">
                  <strong>{formatMovementLabel(movement)}</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDryingDateTimeWita(movement.movedAt)} WITA
                </Typography>
                {movement.notes ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {movement.notes}
                  </Typography>
                ) : null}
              </Paper>
            ))
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        <FormControl fullWidth sx={{ mb: 2 }}>
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

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Move Date"
            type="date"
            value={moveDate}
            onChange={(e) => onMoveDateChange(e.target.value)}
            sx={{ flex: 1 }}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Move Time"
            type="time"
            value={moveTime}
            onChange={(e) => onMoveTimeChange(e.target.value)}
            sx={{ flex: 1 }}
            InputLabelProps={{ shrink: true }}
            inputProps={{ step: 60 }}
          />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Date and time are in WITA (UTC+8)
        </Typography>

        <TextField
          label="Reason for move"
          value={moveNotes}
          onChange={(e) => onMoveNotesChange(e.target.value)}
          fullWidth
          multiline
          minRows={2}
          maxRows={4}
          sx={{ mt: 2 }}
          placeholder="e.g. Moisture too high, needs sun drying"
        />
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
