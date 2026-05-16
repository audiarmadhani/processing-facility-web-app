'use client';

import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography,
} from '@mui/material';

export default function SplitBatchDialog({
  open, onClose, splitBatchNumber, splitCount, setSplitCount, splitWeights, setSplitWeights,
  weightAvailable, scannedRfids, rfidScanMessage, onFetchRfid, onSplit, parseWeightInput,
  onSplitCountChange,
}) {
  return (
  <Dialog
    open={open}
    onClose={onClose}
  >
    <DialogTitle>Split Batch {splitBatchNumber}</DialogTitle>
    <DialogContent>
      <Typography>Enter details to split batch into new batches with suffix -SB-xxx:</Typography>
      <TextField
        label="Number of Splits"
        type="number"
        value={splitCount}
        onChange={(e) => {
          const newCount = Math.max(2, parseInt(e.target.value) || 2);
          onSplitCountChange(newCount);
        }}
        fullWidth
        margin="normal"
        inputProps={{ min: 2 }}
      />
      {Array.from({ length: splitCount }, (_, index) => (
        <TextField
          key={index}
          label={`Weight for Split ${index + 1} (kg)`}
          type="number"
          value={splitWeights[index] || ''}
          onChange={(e) => {
            const newWeights = [...splitWeights];
            newWeights[index] = parseWeightInput(e.target.value);
            setSplitWeights(newWeights);
          }}
          fullWidth
          margin="normal"
          inputProps={{ step: 0.01, min: 0 }}
          helperText={index === 0 ? `Total available weight: ${weightAvailable} kg` : ''}
        />
      ))}
      <Typography sx={{ mt: 2 }}>
        {`Scan ${splitCount - 1} new RFID card(s) for the split batches (first uses original RFID).`}
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={onFetchRfid}
        sx={{ mt: 1 }}
        disabled={scannedRfids.length >= (splitCount - 1)}
      >
        Scan Next RFID
      </Button>
      <Typography sx={{ mt: 2 }}>
        {`Scan ${splitCount - 1} new RFID card(s) for the split batches (first uses original RFID).`}
      </Typography>
      <Typography color={rfidScanMessage.includes('Please') ? 'error' : 'inherit'}>
        {rfidScanMessage}
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="primary">
        Cancel
      </Button>
      <Button
        onClick={onSplit}
        color="secondary"
        variant="contained"
        disabled={!splitWeights.every(w => parseFloat(w) > 0) || scannedRfids.length < (splitCount - 1)}
      >
        Split
      </Button>
    </DialogActions>
  </Dialog>
  );
}
