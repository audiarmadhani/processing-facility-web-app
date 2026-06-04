'use client';

import {
  TextField, Box, Button, Typography, Snackbar, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Card, CardContent, Divider,
  FormControl, InputLabel, Select, MenuItem, OutlinedInput,
} from '@mui/material';
import { MENU_PROPS } from '../columns';

export default function PreprocessingScanCard({ station }) {
  const {
    batchNumber, setBatchNumber, farmerName, lotNumber, referenceNumber, receivingDate, qcDate,
    totalWeight, totalBags, totalProcessedWeight, weightAvailable, weightProcessed, setWeightProcessed,
    producer, setProducer, productLine, setProductLine, processingType, setProcessingType,
    quality, setQuality, notes, setNotes, openSnackBar, setOpenSnackBar, snackBarMessage, snackBarSeverity,
    openConfirmDialog, selectedBatchNumber, isFinishing, openEditDialog, setOpenEditDialog,
    editProducer, setEditProducer, editProductLine, setEditProductLine, editProcessingType, setEditProcessingType,
    producerOptions, productLineOptions, processingTypeOptions, parseWeightInput,
    handleRfidScan, handleBatchNumberSearch, handleAllWeight, handleSubmit, showWeightHistory,
    handleCancelFinish, handleFinishBatch, handleUpdateMetadata,
  } = station;

  return (
    <Card variant="outlined">
          <CardContent>
  <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
    Processing Station
  </Typography>
  <form onSubmit={handleSubmit}>
    <Grid container spacing={2} alignItems="center">
      <Grid item>
        <Button
          variant="contained"
          color="primary"
          onClick={handleRfidScan}
          sx={{ mt: 1.5 }}
          fullWidth
        >
          Get RFID Tag
        </Button>
      </Grid>
    </Grid>
    <Grid container spacing={2} alignItems="center">
      <Grid item xs>
        <TextField
          label="Batch Number Lookup"
          value={batchNumber}
          onChange={(e) => setBatchNumber(e.target.value)}
          placeholder="Enter batch number to search"
          fullWidth
          margin="normal"
        />
      </Grid>
      <Grid item>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleBatchNumberSearch}
          sx={{ mt: 1.5 }}
        >
          Search
        </Button>
      </Grid>
    </Grid>

    <Grid container spacing={2} sx={{ mt: 2 }}>
      <Grid item xs={12}>
        <TextField
          label="Farmer Name"
          value={farmerName || ''}
          InputProps={{ readOnly: true }}
          fullWidth
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          label="Lot Number"
          value={lotNumber}
          InputProps={{ readOnly: true }}
          fullWidth
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          label="Reference Number"
          value={referenceNumber}
          InputProps={{ readOnly: true }}
          fullWidth
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          label="Date Received"
          value={receivingDate || ''}
          InputProps={{ readOnly: true }}
          fullWidth
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          label="Date QC"
          value={qcDate || ''}
          InputProps={{ readOnly: true }}
          fullWidth
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          label="Total Weight (kg)"
          value={totalWeight || ''}
          InputProps={{ readOnly: true }}
          fullWidth
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          label="Total Bags"
          value={totalBags || ''}
          InputProps={{ readOnly: true }}
          fullWidth
        />
      </Grid>
    </Grid>

    <Divider sx={{ my: 2 }} />

    <Grid container spacing={2}>
      <Grid item xs={6}>
        <TextField
          label="Total Processed Weight (kg)"
          value={totalProcessedWeight || '0.00'}
          InputProps={{ readOnly: true }}
          fullWidth
          margin="normal"
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          label="Weight Available (kg)"
          value={weightAvailable || '0.00'}
          InputProps={{
            readOnly: true,
            style: { color: parseFloat(weightAvailable) <= 0 ? 'red' : 'inherit' },
          }}
          fullWidth
          margin="normal"
        />
      </Grid>
    </Grid>

    <Grid container spacing={2} alignItems="center">
      <Grid item xs={6}>
        <TextField
          label="Weight to Process (kg)"
          value={weightProcessed}
          onChange={(e) => setWeightProcessed(parseWeightInput(e.target.value))}
          fullWidth
          margin="normal"
          inputProps={{ step: 0.01, min: 0 }}
          helperText="Optional — leave blank if unknown; record later from Order Book → Track weight"
        />
      </Grid>
      <Grid item>
        <Button
          variant="contained"
          color="primary"
          onClick={handleAllWeight}
        >
          Process All Weight
        </Button>
      </Grid>
    </Grid>

    <Divider sx={{ my: 2 }} />

    <Grid container spacing={2}>
      <Grid item xs={12}>
        <FormControl fullWidth required>
          <InputLabel id="pd-label">Producer</InputLabel>
          <Select
            labelId="pd-label"
            id="pd"
            value={producer}
            onChange={(e) => setProducer(e.target.value)}
            input={<OutlinedInput label="Producer" />}
            MenuProps={MENU_PROPS}
          >
            <MenuItem value=""><em>None</em></MenuItem>
            <MenuItem value="HQ">HEQA</MenuItem>
            <MenuItem value="BTM">BTM</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <FormControl fullWidth required>
          <InputLabel id="pl-label">Product Line</InputLabel>
          <Select
            labelId="pl-label"
            id="pl"
            value={productLine}
            onChange={(e) => setProductLine(e.target.value)}
            input={<OutlinedInput label="Product Line" />}
            MenuProps={MENU_PROPS}
            disabled={!producer}
          >
            <MenuItem value=""><em>None</em></MenuItem>
            {producerOptions[producer]?.map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <FormControl fullWidth required>
          <InputLabel id="pt-label">Processing Type</InputLabel>
          <Select
            labelId="pt-label"
            id="pt"
            value={processingType}
            onChange={(e) => setProcessingType(e.target.value)}
            input={<OutlinedInput label="Processing Type" />}
            MenuProps={MENU_PROPS}
            disabled={!productLine}
          >
            <MenuItem value=""><em>None</em></MenuItem>
            {productLineOptions[productLine]?.map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <FormControl fullWidth required>
          <InputLabel id="ql-label">Quality</InputLabel>
          <Select
            labelId="ql-label"
            id="ql"
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            input={<OutlinedInput label="Quality" />}
            MenuProps={MENU_PROPS}
            disabled={!processingType}
          >
            <MenuItem value=""><em>None</em></MenuItem>
            {processingTypeOptions[processingType]?.map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Notes"
          multiline
          rows={5}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          fullWidth
          margin="normal"
        />
      </Grid>

      <Grid item>
        <Button type="submit" variant="contained" color="success">
          Send to Wet Mill
        </Button>
      </Grid>
    </Grid>
  </form>
  <Grid container spacing={2} sx={{ mt: 2 }}>
    <Grid item>
      <Button variant="contained" color="info" onClick={showWeightHistory}>
        Show Processing History
      </Button>
    </Grid>
  </Grid>
  <Snackbar
    open={openSnackBar}
    autoHideDuration={6000}
    onClose={() => setOpenSnackBar(false)}
  >
    <Alert onClose={() => setOpenSnackBar(false)} severity={snackBarSeverity}>
      {snackBarMessage}
    </Alert>
  </Snackbar>
  <Dialog
    open={openConfirmDialog}
    onClose={handleCancelFinish}
  >
    <DialogTitle>Confirm Mark as Complete</DialogTitle>
    <DialogContent>
      <Typography>
        Are you sure you want to mark batch {selectedBatchNumber} as complete? This action cannot be undone.
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={handleCancelFinish} color="primary" disabled={isFinishing}>
        Cancel
      </Button>
      <Button
        onClick={() => handleFinishBatch(selectedBatchNumber)}
        color="warning"
        variant="contained"
        disabled={isFinishing}
      >
        {isFinishing ? 'Processing...' : 'Confirm'}
      </Button>
    </DialogActions>
  </Dialog>
  <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} fullWidth>
    <DialogTitle>Edit Processing Info</DialogTitle>

    <DialogContent>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Producer</InputLabel>
        <Select
          value={editProducer}
          onChange={(e) => setEditProducer(e.target.value)}
          label="Producer"
        >
          <MenuItem value=""><em>None</em></MenuItem>
          <MenuItem value="HQ">HEQA</MenuItem>
          <MenuItem value="BTM">BTM</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Product Line</InputLabel>
        <Select
          value={editProductLine}
          onChange={(e) => setEditProductLine(e.target.value)}
          label="Product Line"
          disabled={!editProducer}
        >
          <MenuItem value=""><em>None</em></MenuItem>
          {producerOptions[editProducer]?.map((option) => (
            <MenuItem key={option} value={option}>{option}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel>Processing Type</InputLabel>
        <Select
          value={editProcessingType}
          onChange={(e) => setEditProcessingType(e.target.value)}
          label="Processing Type"
          disabled={!editProductLine}
        >
          <MenuItem value=""><em>None</em></MenuItem>
          {productLineOptions[editProductLine]?.map((option) => (
            <MenuItem key={option} value={option}>{option}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </DialogContent>

    <DialogActions>
      <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
      <Button variant="contained" onClick={handleUpdateMetadata}>
        Save
      </Button>
    </DialogActions>
  </Dialog>
    </CardContent>
    </Card>
  );
}
