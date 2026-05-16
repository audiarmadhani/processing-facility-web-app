'use client';

import {
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Checkbox,
  Box,
  Grid,
} from '@mui/material';

export default function DryingWeightDialog({
  open,
  selectedBatch,
  editingWeightId,
  processingTypes,
  newProcessingType,
  onProcessingTypeChange,
  newProducer,
  onProducerChange,
  newBagNumber,
  newBagWeight,
  onBagWeightChange,
  newWeightDate,
  onWeightDateChange,
  onAddOrUpdate,
  totalWeights,
  weightMeasurements,
  newProducerDisplay,
  formatDateForDisplay,
  selectedWeightIds,
  onSelectAllWeights,
  onSelectWeight,
  onOpenDeleteConfirm,
  onEditBagWeight,
  onDeleteSingle,
  onClose,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Track Weight - Batch {selectedBatch?.batchNumber || 'N/A'}</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            {editingWeightId ? 'Edit Bag Weight' : 'Add Bag Weight'}
          </Typography>
          <Grid container spacing={1} alignItems="center">
            <Grid item xs={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="processing-type-label">Processing Type</InputLabel>
                <Select
                  labelId="processing-type-label"
                  value={newProcessingType}
                  onChange={(e) => onProcessingTypeChange(e.target.value)}
                  label="Processing Type"
                  disabled={editingWeightId !== null}
                >
                  {processingTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="producer-label">Producer</InputLabel>
                <Select
                  labelId="producer-label"
                  value={newProducer}
                  onChange={(e) => onProducerChange(e.target.value)}
                  label="Producer"
                  disabled={editingWeightId !== null}
                >
                  <MenuItem value="HQ">HQ</MenuItem>
                  <MenuItem value="BTM">BTM</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={2}>
              <TextField
                label="Bag Number"
                value={newBagNumber}
                InputProps={{ readOnly: true }}
                size="small"
                fullWidth
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                label="Weight (kg)"
                value={newBagWeight}
                onChange={(e) => onBagWeightChange(e.target.value)}
                type="number"
                size="small"
                fullWidth
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                label="Date"
                type="date"
                value={newWeightDate}
                onChange={(e) => onWeightDateChange(e.target.value)}
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  min: selectedBatch
                    ? selectedBatch.startDryingDate !== 'N/A'
                      ? selectedBatch.startDryingDate
                      : new Date('1970-01-01').toISOString().slice(0, 10)
                    : new Date('1970-01-01').toISOString().slice(0, 10),
                  max: new Date().toISOString().slice(0, 10),
                }}
              />
            </Grid>
            <Grid item xs={1}>
              <Button
                variant="contained"
                color="primary"
                onClick={onAddOrUpdate}
                fullWidth
                size="small"
                disabled={!newProcessingType || !newProducer || !newBagWeight}
              >
                {editingWeightId ? 'Update' : 'Add'}
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Typography variant="h6" gutterBottom>
          Batch Summary
        </Typography>
        <Table size="small" sx={{ mb: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Processing Type</TableCell>
              <TableCell>Producer</TableCell>
              <TableCell>Reference Number</TableCell>
              <TableCell>Lot Number</TableCell>
              <TableCell align="right">Total Weight (kg)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {processingTypes.map((type) => {
              const typeMeasurements = weightMeasurements.filter((m) => m.processingType === type);
              const latestDate =
                typeMeasurements.length > 0
                  ? typeMeasurements.reduce(
                      (latest, m) =>
                        m.measurement_date !== 'N/A' && (!latest || m.measurement_date > latest)
                          ? m.measurement_date
                          : latest,
                      null
                    )
                  : null;
              const total = (latestDate && totalWeights[latestDate]?.[type]) || 0;
              const referenceNumber =
                typeMeasurements.length > 0
                  ? typeMeasurements.find((m) => m.processingType === type)?.lotMapping[type]
                      ?.referenceNumber || 'N/A'
                  : 'N/A';
              const lotNumber =
                typeMeasurements.length > 0
                  ? typeMeasurements.find((m) => m.processingType === type)?.lotMapping[type]
                      ?.lotNumber || 'N/A'
                  : 'N/A';
              return (
                <TableRow key={type}>
                  <TableCell>{type}</TableCell>
                  <TableCell>{newProducerDisplay || 'N/A'}</TableCell>
                  <TableCell>{referenceNumber}</TableCell>
                  <TableCell>{lotNumber}</TableCell>
                  <TableCell align="right">{total.toFixed(2)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <Typography variant="h6" gutterBottom>
          Weight History
        </Typography>
        <Button
          variant="contained"
          color="error"
          onClick={onOpenDeleteConfirm}
          disabled={selectedWeightIds.length === 0}
          sx={{ mb: 2 }}
        >
          Delete Selected
        </Button>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={
                    selectedWeightIds.length === weightMeasurements.length &&
                    weightMeasurements.length > 0
                  }
                  onChange={onSelectAllWeights}
                />
              </TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Processing Type</TableCell>
              <TableCell>Producer</TableCell>
              <TableCell>Bag Number</TableCell>
              <TableCell align="right">Weight (kg)</TableCell>
              <TableCell>Reference Number</TableCell>
              <TableCell>Lot Number</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {weightMeasurements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No weight measurements recorded
                </TableCell>
              </TableRow>
            ) : (
              weightMeasurements.map((m) => (
                <TableRow key={m.id}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedWeightIds.includes(m.id)}
                      onChange={() => onSelectWeight(m.id)}
                    />
                  </TableCell>
                  <TableCell>{formatDateForDisplay(m.measurement_date)}</TableCell>
                  <TableCell>{m.processingType}</TableCell>
                  <TableCell>{m.producer || 'N/A'}</TableCell>
                  <TableCell>{m.bagNumber}</TableCell>
                  <TableCell align="right">{parseFloat(m.weight).toFixed(2)}</TableCell>
                  <TableCell>{m.referenceNumbers}</TableCell>
                  <TableCell>{m.lotNumbers}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => onEditBagWeight(m)}
                      sx={{ mr: 1 }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      onClick={() => onDeleteSingle(m.id)}
                    >
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
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
