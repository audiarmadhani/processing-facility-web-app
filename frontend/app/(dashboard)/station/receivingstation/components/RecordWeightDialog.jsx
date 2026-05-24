'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  Grid,
} from '@mui/material';
import BagWeightsFields from './BagWeightsFields';

export default function RecordWeightDialog({
  open,
  batchNumber,
  isEdit,
  loading,
  saving,
  bagCountInput,
  onBagCountInputChange,
  onBagCountBlur,
  bagWeights,
  onBagWeightChange,
  totalWeight,
  onClose,
  onSave,
}) {
  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEdit ? 'Edit weight' : 'Record weight'}
        {batchNumber ? ` — ${batchNumber}` : ''}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Add extra bags for floaters or adjustments before saving.
        </Typography>
        {loading ? (
          <CircularProgress size={32} />
        ) : (
          <Grid container spacing={2}>
            <BagWeightsFields
              bagCountInput={bagCountInput}
              onBagCountInputChange={onBagCountInputChange}
              onBagCountBlur={onBagCountBlur}
              bagWeights={bagWeights}
              onBagWeightChange={onBagWeightChange}
              totalWeight={totalWeight}
              bagCountStep={0.1}
            />
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onSave} disabled={saving || loading}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
