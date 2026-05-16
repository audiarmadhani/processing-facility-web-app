'use client';

import { Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import Webcam from 'react-webcam';

export default function GbQcCameraDialog({ open, onClose, webcamRef, onCapture }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Capture QC Image</DialogTitle>
      <DialogContent sx={{ textAlign: 'center' }}>
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          width="100%"
          videoConstraints={{ facingMode: 'environment' }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onCapture}>
          Capture
        </Button>
      </DialogActions>
    </Dialog>
  );
}
