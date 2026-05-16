'use client';

import {
  Button, Checkbox, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography,
  FormControl, InputLabel, Select, MenuItem, OutlinedInput, ListItemText, Grid, Table, TableBody,
  TableCell, TableHead, TableRow,
} from '@mui/material';
import axios from 'axios';

export default function SampleTrackingDialog({ open, onClose, selectedBatch, sampleDateTaken, setSampleDateTaken, sampleWeightTaken, setSampleWeightTaken, sampleHistory, setSampleHistory, isLoading, onAddSample, fetchDryMillData, logError, setSnackbarMessage, setSnackbarSeverity, setOpenSnackbar }) {
  return (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="md"
    fullWidth
  >
    <DialogTitle>Sample Tracking - Batch {selectedBatch?.batchNumber}</DialogTitle>
    <DialogContent>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6}>
          <TextField
            label="Date Taken"
            type="date"
            value={sampleDateTaken}
            onChange={(e) => setSampleDateTaken(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            disabled={isLoading}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Weight Taken (kg)"
            type="number"
            value={sampleWeightTaken}
            onChange={(e) => setSampleWeightTaken(e.target.value)}
            fullWidth
            inputProps={{ min: 0, step: 0.1 }}
            disabled={isLoading}
          />
        </Grid>
      </Grid>
      <Button
        variant="contained"
        color="primary"
        onClick={onAddSample}
        disabled={isLoading || !sampleWeightTaken || isNaN(parseFloat(sampleWeightTaken)) || parseFloat(sampleWeightTaken) <= 0}
        sx={{ mb: 2 }}
      >
        Add Sample
      </Button>
      <Typography variant="h6" gutterBottom>Sample History</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date Taken</TableCell>
            <TableCell>Weight Taken (kg)</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sampleHistory.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} align="center">No samples recorded.</TableCell>
            </TableRow>
          ) : (
            sampleHistory.map((sample, index) => (
              <TableRow key={index}>
                <TableCell>{new Date(sample.dateTaken).toLocaleDateString()}</TableCell>
                <TableCell>{parseFloat(sample.weightTaken).toFixed(2)}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={async () => {
                      try {
                        await axios.delete(
                          `https://processing-facility-backend.onrender.com/api/dry-mill/${selectedBatch.batchNumber}/remove-sample/${sample.id}`
                        );
                        setSampleHistory(sampleHistory.filter((s) => s.id !== sample.id));
                        setSnackbarMessage("Sample removed successfully.");
                        setSnackbarSeverity("success");
                        setOpenSnackbar(true);
                        await fetchDryMillData();
                      } catch (error) {
                        const message = error.response?.data?.error || "Failed to remove sample.";
                        logError(message, error);
                        setSnackbarMessage(message);
                        setSnackbarSeverity("error");
                        setOpenSnackbar(true);
                      }
                    }}
                    disabled={isLoading}
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <Typography variant="h6" sx={{ mt: 2 }}>
        Total Sample Weight Taken: {sampleHistory.reduce((acc, sample) => acc + parseFloat(sample.weightTaken || 0), 0).toFixed(2)} kg
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={isLoading}>
        Close
      </Button>
    </DialogActions>
  </Dialog>
  );
}
