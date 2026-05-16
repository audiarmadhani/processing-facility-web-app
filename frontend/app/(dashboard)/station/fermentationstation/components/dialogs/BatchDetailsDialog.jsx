'use client';

import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import CherryInformationSection from '../sections/CherryInformationSection';
import PreFermentationSection from '../sections/PreFermentationSection';
import FermentationSection from '../sections/FermentationSection';
import SecondFermentationSection from '../sections/SecondFermentationSection';
import DryingSection from '../sections/DryingSection';

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

export default function BatchDetailsDialog({ form }) {
  return (
    <Dialog
      open={form.openDetailsDialog}
      onClose={() => form.setOpenDetailsDialog(false)}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>Details - Batch {form.selectedBatch?.batchNumber}</DialogTitle>
      <DialogContent sx={dialogContentSx}>
        <CherryInformationSection mode="details" form={form} />
        <PreFermentationSection mode="details" form={form} />
        <FermentationSection mode="details" form={form} />
        <SecondFermentationSection mode="details" form={form} />
        <DryingSection mode="details" form={form} />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => form.setOpenDetailsDialog(false)}>Cancel</Button>
        <Button variant="contained" color="primary" onClick={form.handleUpdateDetails}>
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
