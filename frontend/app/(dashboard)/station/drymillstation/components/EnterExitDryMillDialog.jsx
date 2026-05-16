'use client';

import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';

export function EnterDryMillDialog({ open, enteredAt, setEnteredAt, onClose, onSubmit }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Enter Dry Mill</DialogTitle>
      <DialogContent>
        <TextField
          label="Enter Date"
          type="datetime-local"
          fullWidth
          value={enteredAt}
          onChange={(e) => setEnteredAt(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onSubmit}>Confirm</Button>
      </DialogActions>
    </Dialog>
  );
}

export function ExitDryMillDialog({ open, exitedAt, setExitedAt, onClose, onSubmit }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Exit Dry Mill</DialogTitle>
      <DialogContent>
        <TextField
          label="Exit Date"
          type="datetime-local"
          fullWidth
          value={exitedAt}
          onChange={(e) => setExitedAt(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onSubmit}>Confirm</Button>
      </DialogActions>
    </Dialog>
  );
}
