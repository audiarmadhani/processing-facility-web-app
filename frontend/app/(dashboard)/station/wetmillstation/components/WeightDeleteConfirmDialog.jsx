'use client';

import {
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { deriveProducerFromLotMapping } from '../../_shared/utils/lotMapping';

export default function WeightDeleteConfirmDialog({
  open,
  selectedWeightIds,
  weightMeasurements,
  selectedBatch,
  onClose,
  onConfirm,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Confirm Deletion</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete {selectedWeightIds.length} weight measurement
          {selectedWeightIds.length > 1 ? 's' : ''}?
        </Typography>
        {selectedWeightIds.length > 0 && (
          <Typography variant="body2" sx={{ mt: 2 }}>
            Affected bags:{' '}
            {weightMeasurements
              .filter((m) => selectedWeightIds.includes(m.id))
              .map(
                (m) =>
                  `Bag ${m.bagNumber} (${m.processingType}, ${m.producer || deriveProducerFromLotMapping(m.processingType, selectedBatch?.lotMapping) || 'N/A'}, ${m.weight.toFixed(2)} kg)`
              )
              .join(', ')}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="error" onClick={onConfirm}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
