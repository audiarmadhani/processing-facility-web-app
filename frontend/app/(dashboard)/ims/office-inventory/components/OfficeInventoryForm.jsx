'use client';

import {
  Autocomplete,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  TextField,
} from '@mui/material';
import {
  INVENTORY_CATEGORIES,
  INVENTORY_LOCATIONS,
  INVENTORY_PIC_PRESETS,
  INVENTORY_PROJECTS,
  INVENTORY_REMARKS,
  INVENTORY_UNITS,
  todayDateInputValue,
} from '../constants';

function PresetAutocomplete({ label, value, onChange, options, disabled = false }) {
  return (
    <Autocomplete
      freeSolo
      disabled={disabled}
      options={options}
      value={value}
      onChange={(_e, newValue) => onChange(newValue ?? '')}
      onInputChange={(_e, newInput) => onChange(newInput)}
      renderInput={(params) => (
        <TextField {...params} label={label} size="small" disabled={disabled} />
      )}
    />
  );
}

export default function OfficeInventoryForm({
  form,
  items,
  updateForm,
  selectItem,
  onSubmit,
  submitting,
}) {
  const isExistingItem = Boolean(form.itemId);
  const selectedItemOption =
    items.find((i) => i.id === form.itemId) ||
    (form.itemName ? form.itemName : null);

  return (
    <Box component="form" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <FormControl component="fieldset" sx={{ mb: 2 }}>
        <FormLabel component="legend">Movement type</FormLabel>
        <RadioGroup
          row
          value={form.movementType}
          onChange={(e) => updateForm({ movementType: e.target.value })}
        >
          <FormControlLabel value="IN" control={<Radio />} label="Add (IN)" />
          <FormControlLabel value="OUT" control={<Radio />} label="Deduct (OUT)" />
        </RadioGroup>
      </FormControl>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Autocomplete
            freeSolo
            options={items}
            getOptionLabel={(option) =>
              typeof option === 'string' ? option : option.name
            }
            value={selectedItemOption}
            onChange={(_e, newValue) => {
              if (newValue == null) {
                selectItem(null);
              } else if (typeof newValue === 'string') {
                selectItem(newValue);
              } else {
                selectItem(newValue);
              }
            }}
            onInputChange={(_e, newInput, reason) => {
              if (reason === 'input') {
                const match = items.find(
                  (i) => i.name.toLowerCase() === newInput.trim().toLowerCase()
                );
                if (match) {
                  selectItem(match);
                } else {
                  selectItem(newInput);
                }
              }
            }}
            renderInput={(params) => (
              <TextField {...params} label="Nama Barang" required size="small" />
            )}
            isOptionEqualToValue={(option, value) =>
              typeof option === 'object' && typeof value === 'object'
                ? option.id === value.id
                : option === value
            }
          />
        </Grid>

        <Grid item xs={12} md={2}>
          <PresetAutocomplete
            label="Kategori"
            value={form.category}
            onChange={(v) => updateForm({ category: v })}
            options={INVENTORY_CATEGORIES}
            disabled={isExistingItem}
          />
        </Grid>

        <Grid item xs={12} md={2}>
          <PresetAutocomplete
            label="Satuan"
            value={form.unit}
            onChange={(v) => updateForm({ unit: v })}
            options={INVENTORY_UNITS}
            disabled={isExistingItem}
          />
        </Grid>

        <Grid item xs={12} md={2}>
          <TextField
            label="Quantity"
            type="number"
            size="small"
            fullWidth
            required
            value={form.quantity}
            onChange={(e) => updateForm({ quantity: e.target.value })}
            inputProps={{ min: 0, step: 'any' }}
          />
        </Grid>

        <Grid item xs={12} md={2}>
          <TextField
            label="Transaction date"
            type="date"
            size="small"
            fullWidth
            required
            value={form.transactionDate}
            onChange={(e) => updateForm({ transactionDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            inputProps={{ max: todayDateInputValue() }}
          />
        </Grid>

        <Grid item xs={12} md={2}>
          <PresetAutocomplete
            label="PIC"
            value={form.pic}
            onChange={(v) => updateForm({ pic: v })}
            options={INVENTORY_PIC_PRESETS}
          />
        </Grid>

        <Grid item xs={12} md={2}>
          <PresetAutocomplete
            label="Remarks"
            value={form.remarks}
            onChange={(v) => updateForm({ remarks: v })}
            options={INVENTORY_REMARKS}
          />
        </Grid>

        <Grid item xs={12} md={2}>
          <PresetAutocomplete
            label="Location"
            value={form.location}
            onChange={(v) => updateForm({ location: v })}
            options={INVENTORY_LOCATIONS}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <PresetAutocomplete
            label="Project"
            value={form.project}
            onChange={(v) => updateForm({ project: v })}
            options={INVENTORY_PROJECTS}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            sx={{ height: '40px' }}
          >
            {submitting ? 'Saving…' : 'Record movement'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
