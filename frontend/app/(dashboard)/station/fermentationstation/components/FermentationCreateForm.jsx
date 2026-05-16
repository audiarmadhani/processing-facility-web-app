'use client';

import { Typography, Grid, Button, Card, CardContent, Alert, Box } from '@mui/material';
import CherryInformationSection from './sections/CherryInformationSection';
import PreFermentationSection from './sections/PreFermentationSection';
import FermentationSection from './sections/FermentationSection';
import SecondFermentationSection from './sections/SecondFermentationSection';
import DryingSection from './sections/DryingSection';

export default function FermentationCreateForm({ form }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h5" gutterBottom sx={{ mb: 5 }}>
          Fermentation Station Form
        </Typography>
        {form.tankError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {form.tankError}
          </Alert>
        )}
        <form onSubmit={form.handleSubmit}>
          <Grid container spacing={2}>
            <CherryInformationSection mode="create" form={form} />
            <PreFermentationSection mode="create" form={form} />
            <FermentationSection mode="create" form={form} />
            <SecondFermentationSection mode="create" form={form} />
            <DryingSection mode="create" form={form} />

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={form.generateOrderSheet}
                  disabled={!form.batchNumber || !form.experimentNumber}
                >
                  Generate Order Sheet
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={!form.batchNumber || !form.experimentNumber}
                >
                  Start Fermentation
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
}
