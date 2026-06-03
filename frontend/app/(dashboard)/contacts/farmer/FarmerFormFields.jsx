'use client';

import {
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Autocomplete,
} from '@mui/material';
import {
  bankOptions,
  brokerOptions,
  paymentMethodOptions,
  contractTypeOptions,
  varietyOptions,
} from './constants';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export default function FarmerFormFields({
  form,
  setForm,
  locationData,
  idPrefix = 'create',
  resetVarietiesOnFarmTypeChange = true,
}) {
  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleKabupatenChange = (event, newValue) => {
    setForm((prev) => ({
      ...prev,
      kabupaten: newValue,
      kecamatan: null,
      desa: null,
    }));
  };

  const handleKecamatanChange = (event, newValue) => {
    setForm((prev) => ({
      ...prev,
      kecamatan: newValue,
      desa: null,
    }));
  };

  const handleDesaChange = (event, newValue) => {
    setField('desa', newValue);
  };

  const handleFarmTypeChange = (e) => {
    const nextType = e.target.value;
    setForm((prev) => ({
      ...prev,
      farmType: nextType,
      farmVarieties: resetVarietiesOnFarmTypeChange ? [] : prev.farmVarieties,
    }));
  };

  const kabupatenList = [...new Set(locationData.map((item) => item.kabupaten))];
  const kecamatanList = form.kabupaten
    ? [...new Set(locationData.filter((item) => item.kabupaten === form.kabupaten).map((item) => item.kecamatan))]
    : [];
  const desaList = form.kecamatan
    ? locationData.filter((item) => item.kecamatan === form.kecamatan).map((item) => item.desa)
    : [];

  const bankTransferRequired = form.paymentMethod?.includes('Bank Transfer');

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          label="Farmer Name"
          type="text"
          value={form.farmerName}
          onChange={(e) => setField('farmerName', e.target.value)}
          fullWidth
          required
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          label="Farmer Contact"
          type="text"
          value={form.farmerContact}
          onChange={(e) => setField('farmerContact', e.target.value)}
          fullWidth
          required
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          label="Farmer Address"
          type="text"
          value={form.farmerAddress}
          onChange={(e) => setField('farmerAddress', e.target.value)}
          fullWidth
          required
        />
      </Grid>

      <Grid item xs={6}>
        <TextField
          label="Elevation Min (m)"
          type="number"
          value={form.elevationMin}
          onChange={(e) => setField('elevationMin', e.target.value)}
          fullWidth
          required
          inputProps={{ min: 0, step: 'any' }}
        />
      </Grid>

      <Grid item xs={6}>
        <TextField
          label="Elevation Max (m)"
          type="number"
          value={form.elevationMax}
          onChange={(e) => setField('elevationMax', e.target.value)}
          fullWidth
          required
          inputProps={{ min: 0, step: 'any' }}
        />
      </Grid>

      <Grid item xs={6}>
        <Autocomplete
          options={kabupatenList}
          value={form.kabupaten}
          onChange={handleKabupatenChange}
          renderInput={(params) => <TextField {...params} label="Kabupaten" />}
        />
      </Grid>

      <Grid item xs={6}>
        <Autocomplete
          options={kecamatanList}
          value={form.kecamatan}
          onChange={handleKecamatanChange}
          disabled={!form.kabupaten}
          renderInput={(params) => <TextField {...params} label="Kecamatan" />}
        />
      </Grid>

      <Grid item xs={6}>
        <Autocomplete
          options={desaList}
          value={form.desa}
          onChange={handleDesaChange}
          disabled={!form.kecamatan}
          renderInput={(params) => <TextField {...params} label="Desa" />}
        />
      </Grid>

      <Grid item xs={6}>
        <TextField
          label="Farmer Land Area"
          type="text"
          value={form.farmerLandArea}
          onChange={(e) => setField('farmerLandArea', e.target.value)}
          fullWidth
          required
        />
      </Grid>

      <Grid item xs={6}>
        <FormControl fullWidth required>
          <InputLabel id={`${idPrefix}-contract-type-label`}>Contract Type</InputLabel>
          <Select
            labelId={`${idPrefix}-contract-type-label`}
            value={form.contractType}
            onChange={(e) => setField('contractType', e.target.value)}
            input={<OutlinedInput label="Contract Type" />}
          >
            {contractTypeOptions.map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={6}>
        <FormControl fullWidth required>
          <InputLabel id={`${idPrefix}-farm-type-label`}>Farm Type</InputLabel>
          <Select
            labelId={`${idPrefix}-farm-type-label`}
            value={form.farmType}
            onChange={handleFarmTypeChange}
            input={<OutlinedInput label="Farm Type" />}
          >
            <MenuItem value="Arabica">Arabica</MenuItem>
            <MenuItem value="Robusta">Robusta</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <FormControl fullWidth disabled={!form.farmType}>
          <InputLabel id={`${idPrefix}-variety-label`}>Farm Varieties</InputLabel>
          <Select
            labelId={`${idPrefix}-variety-label`}
            multiple
            value={form.farmVarieties}
            onChange={(e) => setField('farmVarieties', e.target.value)}
            input={<OutlinedInput label="Farm Varieties" />}
            MenuProps={MenuProps}
          >
            {(varietyOptions[form.farmType] || []).map((variety) => (
              <MenuItem key={variety} value={variety}>{variety}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={6}>
        <FormControl fullWidth>
          <InputLabel id={`${idPrefix}-broker-label`}>Broker</InputLabel>
          <Select
            labelId={`${idPrefix}-broker-label`}
            value={form.broker}
            onChange={(e) => setField('broker', e.target.value)}
            input={<OutlinedInput label="Broker" />}
          >
            <MenuItem value=""><em>None</em></MenuItem>
            {brokerOptions.map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={6}>
        <FormControl fullWidth required>
          <InputLabel id={`${idPrefix}-payment-method-label`}>Payment Method</InputLabel>
          <Select
            labelId={`${idPrefix}-payment-method-label`}
            value={form.paymentMethod}
            onChange={(e) => setField('paymentMethod', e.target.value)}
            input={<OutlinedInput label="Payment Method" />}
          >
            {paymentMethodOptions.map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={4}>
        <Autocomplete
          freeSolo
          options={bankOptions}
          value={form.bankName}
          onChange={(event, newValue) => setField('bankName', newValue || '')}
          onInputChange={(event, newInputValue) => setField('bankName', newInputValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Bank Name"
              fullWidth
              required={bankTransferRequired}
            />
          )}
        />
      </Grid>

      <Grid item xs={8}>
        <TextField
          label="Bank Account Number"
          type="text"
          value={form.bankAccount}
          onChange={(e) => setField('bankAccount', e.target.value)}
          fullWidth
          required={bankTransferRequired}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          label="Bank Account Name"
          type="text"
          value={form.bankAccountName}
          onChange={(e) => setField('bankAccountName', e.target.value)}
          fullWidth
          required={bankTransferRequired}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          label="Notes"
          multiline
          rows={4}
          value={form.notes}
          onChange={(e) => setField('notes', e.target.value)}
          fullWidth
        />
      </Grid>
    </Grid>
  );
}
