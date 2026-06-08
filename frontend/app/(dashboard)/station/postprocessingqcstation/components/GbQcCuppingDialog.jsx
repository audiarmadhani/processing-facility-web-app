'use client';

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

function formatCuppedDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
}

function formatOkLabel(value) {
  if (value === true) return 'OK';
  if (value === false) return 'Not OK';
  return '—';
}

export default function GbQcCuppingDialog({
  open,
  selectedBatch,
  formData,
  onFormChange,
  onEditCuppingEntry,
  onCancelCuppingEdit,
  onAddCuppingEntry,
  onRemoveCuppingEntry,
  onClose,
  onSave,
  saving,
}) {
  const draft = formData.cuppingDraft || {};
  const isEditing = draft.editingIndex !== null && draft.editingIndex !== undefined;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Cupping — Batch {selectedBatch?.batchNumber}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          Record cupping sessions for this batch. Save when finished; GB QC can be completed separately.
        </Typography>

        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Cupping sessions
        </Typography>
        <Table size="small" sx={{ mb: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Date cupped</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell>OK / Not OK</TableCell>
              <TableCell width={100} />
            </TableRow>
          </TableHead>
          <TableBody>
            {(formData.cuppingEntries || []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No cupping entries yet
                </TableCell>
              </TableRow>
            ) : (
              formData.cuppingEntries.map((entry, index) => (
                <TableRow
                  key={entry.id || `draft-${index}`}
                  selected={isEditing && draft.editingIndex === index}
                >
                  <TableCell>{formatCuppedDate(entry.cuppedAt)}</TableCell>
                  <TableCell>{entry.notes}</TableCell>
                  <TableCell>{formatOkLabel(entry.okForFurtherProcess)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => onEditCuppingEntry(index)}
                        aria-label="Edit cupping entry"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => onRemoveCuppingEntry(index)}
                        aria-label="Remove cupping entry"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              name="cuppingDraft.cuppedAt"
              label="Date cupped"
              type="date"
              value={draft.cuppedAt || ''}
              onChange={onFormChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={8}>
            <FormControl fullWidth>
              <InputLabel>OK for further process?</InputLabel>
              <Select
                name="cuppingDraft.okForFurtherProcess"
                value={
                  draft.okForFurtherProcess === null || draft.okForFurtherProcess === undefined
                    ? ''
                    : draft.okForFurtherProcess.toString()
                }
                onChange={onFormChange}
                input={<OutlinedInput label="OK for further process?" />}
              >
                <MenuItem value="" disabled>
                  Select OK / Not OK
                </MenuItem>
                <MenuItem value="true">OK</MenuItem>
                <MenuItem value="false">Not OK</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="cuppingDraft.notes"
              label="Cupping notes"
              value={draft.notes || ''}
              onChange={onFormChange}
              fullWidth
              multiline
              minRows={3}
              placeholder="Describe aroma, flavor, body, acidity, defects from the sample roast..."
            />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button variant="contained" onClick={onAddCuppingEntry}>
                {isEditing ? 'Update cupping' : 'Add cupping'}
              </Button>
              {isEditing ? (
                <Button variant="outlined" onClick={onCancelCuppingEdit}>
                  Cancel edit
                </Button>
              ) : null}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" color="primary" onClick={onSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
