'use client';

import { useState, useCallback } from 'react';

export function useSnackbar() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('success');

  const show = useCallback((msg, sev = 'success') => {
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  }, []);

  const showSuccess = useCallback((msg) => show(msg, 'success'), [show]);
  const showError = useCallback((msg) => show(msg, 'error'), [show]);
  const showWarning = useCallback((msg) => show(msg, 'warning'), [show]);

  const handleClose = useCallback(() => setOpen(false), []);

  return {
    open,
    message,
    severity,
    setOpen,
    setMessage,
    setSeverity,
    show,
    showSuccess,
    showError,
    showWarning,
    handleClose,
    snackbarProps: {
      open,
      message,
      severity,
      onClose: handleClose,
    },
  };
}
