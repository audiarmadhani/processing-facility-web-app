'use client';

import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Divider, Typography,
} from '@mui/material';

export default function WeightHistoryDialog({ open, onClose, weightHistory }) {
  return (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Weight Processing History</DialogTitle>
    <DialogContent>
      {weightHistory.length === 0 ? (
        <Typography>No processing history available.</Typography>
      ) : (
        weightHistory.map((history, index) => (
          <Box key={index} sx={{ mb: 2 }}>
            <Typography variant="h6">Batch: {history.batchNumber}</Typography>
            {history.merged && (
              <>
                <Typography>Status: Merged</Typography>
                <Typography>Merged From: {history.mergedFrom.join(', ') || 'N/A'}</Typography>
                <Typography>Merged At: {history.mergedAt}</Typography>
                <Typography>Merged By: {history.mergeCreatedBy}</Typography>
                {history.mergeNotes !== 'N/A' && (
                  <Typography>Merge Notes: {history.mergeNotes}</Typography>
                )}
                <Divider sx={{ my: 1 }} />
              </>
            )}
            <Typography>Lot Number: {history.lotNumber}</Typography>
            <Typography>Reference Number: {history.referenceNumber}</Typography>
            <Typography>Total Weight: {history.totalWeight} kg</Typography>
            <Typography>Processed Weight: {history.totalProcessedWeight} kg</Typography>
            <Typography>Available Weight: {history.weightAvailable} kg</Typography>
            <Typography>Finished: {history.finished ? 'Yes' : 'No'}</Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle1">Processing Logs:</Typography>
            {history.processedLogs.length === 0 ? (
              <Typography>No processing logs available for this batch.</Typography>
            ) : (
              history.processedLogs.map((log, logIndex) => (
                <Box key={logIndex} sx={{ ml: 2 }}>
                  <Typography>Processing Date: {log.processingDate}</Typography>
                  <Typography>Weight Processed: {log.weightProcessed} kg</Typography>
                  <Typography>Processing Type: {log.processingType}</Typography>
                  <Typography>Lot Number: {log.lotNumber}</Typography>
                  <Typography>Reference Number: {log.referenceNumber}</Typography>
                  {log.notes && <Typography>Notes: {log.notes}</Typography>}
                  <Divider sx={{ my: 0.5 }} />
                </Box>
              ))
            )}
          </Box>
        ))
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="primary">
        Close
      </Button>
    </DialogActions>
  </Dialog>
  );
}
