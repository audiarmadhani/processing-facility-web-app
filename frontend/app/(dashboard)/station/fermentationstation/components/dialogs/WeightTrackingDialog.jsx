'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import dayjs from 'dayjs';

const dialogContentSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#1E1E1E',
  },
  '& .MuiOutlinedInput-root.Mui-disabled': {
    backgroundColor: '#1E1E1E',
  },
  '& .MuiSelect-select': {
    backgroundColor: 'transparent',
  },
};

export default function WeightTrackingDialog({ book, form }) {
  return (
    <Dialog
      open={book.openWeightDialog}
      onClose={() => book.setOpenWeightDialog(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Track Weight - Batch {book.selectedBatch?.batchNumber}</DialogTitle>
      <DialogContent sx={dialogContentSx}>
        <Typography variant="h6" gutterBottom>
          Add Weight Measurement
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2, mt: 1 }}>
          <Grid item xs={4}>
            <FormControl fullWidth>
              <InputLabel id="processing-type-label">Processing Type</InputLabel>
              <Select
                labelId="processing-type-label"
                value={book.newProcessingType}
                onChange={(e) => book.setNewProcessingType(e.target.value)}
                label="Processing Type"
              >
                {book.availableProcessingTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Weight (kg)"
              type="number"
              value={book.newWeight}
              onChange={(e) => book.setNewWeight(e.target.value)}
              fullWidth
              inputProps={{ min: 0.01, step: 0.01 }}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Measurement Date"
              type="date"
              value={book.newWeightDate}
              onChange={(e) => book.setNewWeightDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={4}>
            <FormControl fullWidth>
              <InputLabel id="producer-label">Producer</InputLabel>
              <Select
                labelId="producer-label"
                value={book.newProducer}
                onChange={(e) => book.setNewProducer(e.target.value)}
                label="Producer"
              >
                {book.producers.map((prod) => (
                  <MenuItem key={prod} value={prod}>
                    {prod}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <Button
          variant="contained"
          color="primary"
          onClick={form.handleAddWeight}
          fullWidth
          sx={{ mb: 2 }}
          disabled={!book.newWeight || !book.newProcessingType || !book.newWeightDate}
        >
          Add Weight
        </Button>
        <Typography variant="h6" gutterBottom>
          Weight History
        </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Processing Type</TableCell>
              <TableCell>Weight (kg)</TableCell>
              <TableCell>Producer</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {form.weightMeasurements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No weight measurements recorded.
                </TableCell>
              </TableRow>
            ) : (
              form.weightMeasurements.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{dayjs(m.measurement_date).format('YYYY-MM-DD')}</TableCell>
                  <TableCell>{m.processingType}</TableCell>
                  <TableCell>{parseFloat(m.weight).toFixed(2)}</TableCell>
                  <TableCell>{m.producer}</TableCell>
                  <TableCell>
                    <Button color="error" size="small" onClick={() => form.handleDeleteWeight(m)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => book.setOpenWeightDialog(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
