'use client';

import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
} from '@mui/material';
import Webcam from 'react-webcam';

export default function RoboflowCapture({ open, onClose, webcamRef, onCapture }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>Capture Sample Image</DialogTitle>
      <DialogContent>
        <Card variant="outlined" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
          <CardContent>
            <Webcam
              audio={false}
              ref={webcamRef}
              videoConstraints={{
                width: 1920,
                height: 1080,
                facingMode: "user",
              }}
              screenshotFormat="image/jpeg"
              onUserMediaError={error => console.error('Webcam error:', error)}
            />
          </CardContent>
        </Card>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center' }}>
        <Button onClick={onCapture} color="primary" variant="contained">
          Capture
        </Button>
        <Button onClick={onClose} color="secondary" variant="contained">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
