'use client';

import {
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Box,
  Divider,
} from '@mui/material';

export default function RejectMergeDialog({
  open,
  onClose,
  selectedRejectBatches,
  rejectWeights,
  onRejectWeightChange,
  totalRejectWeight,
  hasEmptyReject,
  onConfirm,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Merge Reject Batches</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {selectedRejectBatches.map((batch) => {
            const availableWeight = Number(batch.weight || 0);
            const rejectValue = Number(rejectWeights[batch.batchNumber] || 0);
            const isError = rejectValue < 0 || rejectValue > availableWeight;

            return (
              <Box
                key={batch.batchNumber}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr',
                  gap: 2,
                  alignItems: 'center',
                }}
              >
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {batch.batchNumber}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {batch.farmerName}
                  </Typography>
                </Box>

                <TextField
                  label="Available (kg)"
                  value={availableWeight.toFixed(2)}
                  size="small"
                  disabled
                  fullWidth
                />

                <TextField
                  label="Reject (kg)"
                  type="number"
                  size="small"
                  fullWidth
                  value={rejectWeights[batch.batchNumber] || ''}
                  onChange={(e) =>
                    onRejectWeightChange(batch.batchNumber, e.target.value)
                  }
                  inputProps={{ min: 0, step: 0.01 }}
                  error={isError}
                  helperText={
                    isError
                      ? 'Exceeds available'
                      : `Remaining ${(availableWeight - rejectValue).toFixed(2)} kg`
                  }
                />
              </Box>
            );
          })}
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography variant="subtitle2">Total Reject Weight</Typography>
            <Typography
              variant="h6"
              color={totalRejectWeight > 0 ? 'error.main' : 'text.secondary'}
            >
              {totalRejectWeight.toFixed(2)} kg
            </Typography>
          </Box>

          <Button
            variant="contained"
            color="error"
            onClick={onConfirm}
            disabled={
              hasEmptyReject ||
              totalRejectWeight <= 0 ||
              selectedRejectBatches.some((b) => {
                const available = Number(b.weight || 0);
                const reject = Number(rejectWeights[b.batchNumber]);
                return reject <= 0 || reject > available;
              })
            }
          >
            Merge Reject
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
