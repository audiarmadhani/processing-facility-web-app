'use client';

import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from '@mui/material';

export default function FinishDryingDialog({ open, batchNumber, onClose, onConfirm }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Finish Drying</DialogTitle>
      <DialogContent>
        <Typography>Are you sure you want to finish drying for batch:</Typography>
        <Typography sx={{ mt: 2, fontWeight: 'bold' }}>{batchNumber}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="success" onClick={onConfirm}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
