'use client';

import {
  TextField,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Autocomplete,
} from '@mui/material';
import { defaultMenuProps } from '../../_shared/constants/menuProps';
import FarmerDetailFields from './FarmerDetailFields';

export default function CherryReceivingForm({
  farmerList,
  selectedFarmerDetails,
  onFarmerChange,
  type,
  setType,
  producer,
  setProducer,
  notes,
  setNotes,
  bagCountInput,
  onBagCountInputChange,
  onBagCountBlur,
  bagWeights,
  onBagWeightChange,
  totalWeight,
  brix,
  setBrix,
  assigningRFID,
  onSubmit,
}) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
          Cherry Receiving Form
        </Typography>
        <form onSubmit={onSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Autocomplete
                options={farmerList}
                getOptionLabel={(option) => option.farmerName}
                value={selectedFarmerDetails}
                onChange={onFarmerChange}
                renderInput={(params) => (
                  <TextField {...params} label="Farmer Name" required fullWidth />
                )}
              />
            </Grid>
            <FarmerDetailFields farmer={selectedFarmerDetails} />
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel id="type-label">Type</InputLabel>
                <Select
                  labelId="type-label"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  input={<OutlinedInput label="Type" />}
                  MenuProps={defaultMenuProps}
                >
                  <MenuItem value="Arabica">Arabica</MenuItem>
                  <MenuItem value="Robusta">Robusta</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel id="producer-label">Producer</InputLabel>
                <Select
                  labelId="producer-label"
                  value={producer}
                  onChange={(e) => setProducer(e.target.value)}
                  input={<OutlinedInput label="Producer" />}
                  MenuProps={defaultMenuProps}
                >
                  <MenuItem value="BTM">BTM</MenuItem>
                  <MenuItem value="HEQA">HEQA</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Number of Bags"
                type="number"
                value={bagCountInput}
                onChange={onBagCountInputChange}
                onBlur={onBagCountBlur}
                fullWidth
                required
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notes"
                multiline
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6">Bag Weights</Typography>
            </Grid>
            {bagWeights.map((weight, index) => (
              <Grid item xs={6} md={3} key={index}>
                <TextField
                  label={`Bag ${index + 1}`}
                  type="number"
                  value={weight}
                  onChange={(e) => onBagWeightChange(index, e.target.value)}
                  fullWidth
                  inputProps={{ step: 0.1, min: 0 }}
                />
              </Grid>
            ))}
            <Grid item xs={12}>
              <Typography variant="h6">Total Weight: {totalWeight.toFixed(2)} kg</Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Brix (°Bx)"
                type="number"
                value={brix}
                onChange={(e) => setBrix(e.target.value)}
                fullWidth
                inputProps={{ step: 0.1, min: 0 }}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                type="submit"
                disabled={assigningRFID}
                sx={{ mr: 2 }}
              >
                Submit
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
}
