'use client';

import { Snackbar, Alert } from '@mui/material';

export default function StationSnackbar({
  open,
  message,
  severity = 'success',
  onClose,
  autoHideDuration = 6000,
}) {
  return (
    <Snackbar open={open} autoHideDuration={autoHideDuration} onClose={onClose}>
      <Alert onClose={onClose} severity={severity} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
