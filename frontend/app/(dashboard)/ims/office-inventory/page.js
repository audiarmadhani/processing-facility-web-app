'use client';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import SummarizeIcon from '@mui/icons-material/Summarize';
import OfficeInventoryForm from './components/OfficeInventoryForm';
import OfficeInventoryGrids from './components/OfficeInventoryGrids';
import { useOfficeInventory } from './hooks/useOfficeInventory';
import { todayDateInputValue } from './constants';

export default function OfficeInventoryPage() {
  const inv = useOfficeInventory();

  return (
    <Grid container spacing={3} sx={{ p: 2 }}>
      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Office Inventory
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Track office inventory additions and deductions. Generate daily reports for any
              past date up to today.
            </Typography>

            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 2,
                mb: 3,
                p: 2,
                bgcolor: 'action.hover',
                borderRadius: 1,
              }}
            >
              <TextField
                label="Report date"
                type="date"
                size="small"
                value={inv.reportDate}
                onChange={(e) => inv.setReportDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: todayDateInputValue() }}
                sx={{ minWidth: 180 }}
              />
              <Button
                variant="contained"
                startIcon={<SummarizeIcon />}
                onClick={inv.generateReport}
                disabled={inv.reportLoading}
              >
                {inv.reportLoading ? 'Generating…' : 'Generate report'}
              </Button>
              <Typography variant="body2" color="text.secondary">
                Generate daily inventory report for the selected date
              </Typography>
            </Box>

            <Typography variant="h6" gutterBottom>
              Record movement
            </Typography>
            <OfficeInventoryForm
              form={inv.form}
              items={inv.items}
              updateForm={inv.updateForm}
              selectItem={inv.selectItem}
              onSubmit={inv.validateAndSubmit}
              submitting={inv.submitting}
            />

            <OfficeInventoryGrids
              items={inv.items}
              movements={inv.movements}
              itemsLoading={inv.itemsLoading}
              movementsLoading={inv.movementsLoading}
            />
          </CardContent>
        </Card>
      </Grid>

      <Dialog
        open={inv.confirmOverstockOpen}
        onClose={() => inv.setConfirmOverstockOpen(false)}
      >
        <DialogTitle>Stock will go negative</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This deduction exceeds the current stock for this item. Do you want to record it
            anyway?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => inv.setConfirmOverstockOpen(false)}>Cancel</Button>
          <Button onClick={inv.postMovement} color="warning" variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={inv.snackbarOpen}
        autoHideDuration={6000}
        onClose={() => inv.setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => inv.setSnackbarOpen(false)}
          severity={inv.snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {inv.snackbarMessage}
        </Alert>
      </Snackbar>
    </Grid>
  );
}
