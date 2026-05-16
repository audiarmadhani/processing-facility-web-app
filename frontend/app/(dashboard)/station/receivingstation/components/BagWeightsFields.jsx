'use client';

import { Grid, TextField, Typography } from '@mui/material';

export default function BagWeightsFields({
  bagCountInput,
  onBagCountInputChange,
  onBagCountBlur,
  bagWeights,
  onBagWeightChange,
  totalWeight,
  bagCountStep = 0.1,
}) {
  return (
    <>
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
            inputProps={{ step: bagCountStep, min: 0 }}
          />
        </Grid>
      ))}
      <Grid item xs={12}>
        <Typography variant="h6">Total Weight: {totalWeight.toFixed(2)} kg</Typography>
      </Grid>
    </>
  );
}
