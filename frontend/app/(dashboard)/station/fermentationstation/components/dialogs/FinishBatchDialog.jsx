'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import dayjs from 'dayjs';

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

export default function FinishBatchDialog({ book, form }) {
  return (
    <Dialog
      open={book.openFinishDialog}
      onClose={() => book.setOpenFinishDialog(false)}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>Finish Fermentation - Batch {book.selectedRow?.batchNumber}</DialogTitle>
      <DialogContent sx={dialogContentSx}>
        <TextField
          label="End Date and Time"
          type="datetime-local"
          value={book.endDateTime}
          onChange={(e) => book.setEndDateTime(e.target.value)}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
          inputProps={{
            min: book.selectedRow?.fermentationStart || dayjs().format('YYYY-MM-DDTHH:mm:ss'),
            max: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => book.setOpenFinishDialog(false)}>Cancel</Button>
        <Button
          variant="contained"
          color="primary"
          onClick={form.handleFinishFermentation}
          disabled={!book.endDateTime}
        >
          Finish
        </Button>
      </DialogActions>
    </Dialog>
  );
}
