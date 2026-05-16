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
import { deriveProducerFromLotMapping } from '../../_shared/utils/lotMapping';

export default function WeightTrackingDialog({
  open,
  selectedBatch,
  editingWeightId,
  availableProcessingTypes,
  newProcessingType,
  onProcessingTypeChange,
  availableProducersForType,
  newProducer,
  onProducerChange,
  newBagNumber,
  newBagWeight,
  onWeightInputChange,
  newWeightDate,
  onWeightDateChange,
  onAddOrUpdate,
  totalWeights,
  weightMeasurements,
  selectedWeightIds,
  onSelectAllWeights,
  onSelectWeight,
  onOpenDeleteConfirm,
  onEditBagWeight,
  onDeleteSingle,
  onClose,
}) {
  return (
    <>
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
                    {availableProcessingTypes.map((type) => (
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
                    disabled={editingWeightId !== null || !newProcessingType}
                  >
                    {availableProducersForType.map((prod) => (
                      <MenuItem key={prod} value={prod}>
                        {prod}
                      </MenuItem>
                    ))}
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
                  onChange={onWeightInputChange}
                  type="text"
                  size="small"
                  fullWidth
                  inputProps={{ pattern: '[0-9]*[,.]?[0-9]+' }}
                  placeholder="e.g., 12.34 or 12,34"
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
                      ? selectedBatch.startProcessingDate !== 'N/A'
                        ? selectedBatch.startProcessingDate
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
                <TableCell align="right">Total Weight (kg)</TableCell>
                <TableCell>Lot Number</TableCell>
                <TableCell>Reference Number</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedBatch?.lotMapping?.map((mapping, index) => {
                const currentProducer = mapping.lotNumber?.startsWith('HQ')
                  ? 'HQ'
                  : mapping.lotNumber?.startsWith('ID-BTM')
                    ? 'BTM'
                    : 'N/A';
                const typeMeasurements = weightMeasurements.filter(
                  (m) => m.processingType === mapping.processingType && m.producer === currentProducer
                );
                const latestDate =
                  typeMeasurements.length > 0
                    ? new Date(
                        Math.max(...typeMeasurements.map((m) => new Date(m.measurement_date).getTime()))
                      )
                        .toISOString()
                        .slice(0, 10)
                    : null;
                const key = `${mapping.processingType}_${currentProducer}`;
                const total =
                  latestDate && totalWeights[latestDate]?.[key] ? totalWeights[latestDate][key] : 0;
                return (
                  <TableRow key={index}>
                    <TableCell>{mapping.processingType}</TableCell>
                    <TableCell>{currentProducer}</TableCell>
                    <TableCell align="right">{total.toFixed(2)}</TableCell>
                    <TableCell>{mapping.lotNumber || 'N/A'}</TableCell>
                    <TableCell>{mapping.referenceNumber || 'N/A'}</TableCell>
                  </TableRow>
                );
              }) || []}
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
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {weightMeasurements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
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
                    <TableCell>
                      {new Date(m.measurement_date).toLocaleDateString('en-US', {
                        timeZone: 'Asia/Makassar',
                      })}
                    </TableCell>
                    <TableCell>{m.processingType}</TableCell>
                    <TableCell>
                      {m.producer ||
                        deriveProducerFromLotMapping(m.processingType, selectedBatch?.lotMapping) ||
                        'N/A'}
                    </TableCell>
                    <TableCell>{m.bagNumber}</TableCell>
                    <TableCell align="right">{m.weight.toFixed(2)}</TableCell>
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
    </>
  );
}
