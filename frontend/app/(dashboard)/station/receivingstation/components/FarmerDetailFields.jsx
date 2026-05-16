'use client';

import { Grid, TextField } from '@mui/material';

export default function FarmerDetailFields({ farmer }) {
  if (!farmer) return null;

  return (
    <>
      <Grid item xs={12}>
        <TextField
          label="Farmer Address"
          value={farmer.farmerAddress}
          fullWidth
          InputProps={{ readOnly: true }}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Bank Account"
          value={farmer.bankAccount}
          fullWidth
          InputProps={{ readOnly: true }}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Bank Name"
          value={farmer.bankName}
          fullWidth
          InputProps={{ readOnly: true }}
        />
      </Grid>
    </>
  );
}
