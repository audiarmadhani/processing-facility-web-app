'use client';

import {
  Typography,
  Grid,
  Button,
  TextField,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
} from '@mui/material';
import { defaultMenuProps } from '../../_shared/constants/menuProps';

export default function QcAssessmentForm({ station }) {
  const {
    batchNumber,
    setBatchNumber,
    farmerName,
    receivingDate,
    weight,
    totalBags,
    contractType,
    price,
    setPrice,
    ripeness,
    setRipeness,
    color,
    setColor,
    foreignMatter,
    setForeignMatter,
    overallQuality,
    setOverallQuality,
    qcNotes,
    setQcNotes,
    paymentMethod,
    setPaymentMethod,
    roboflowResults,
    handleRfidScan,
    handleBatchNumberSearch,
    handleSubmit,
    openFormCapture,
  } = station;

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
          QC Station Form
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item>
              <Button
                variant="contained"
                color="primary"
                onClick={handleRfidScan}
                style={{ marginTop: '24px' }}
              >
                Get RFID Tag
              </Button>
            </Grid>
            <Grid item xs>
              <TextField
                label="Batch Number Lookup"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="Enter batch number to search"
                fullWidth
                required
                margin="normal"
              />
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleBatchNumberSearch}
                style={{ marginTop: '24px' }}
              >
                Search
              </Button>
            </Grid>
          </Grid>
          {farmerName && (
            <div>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Farmer Name"
                    value={farmerName}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    margin="normal"
                    sx={{ marginTop: "16px" }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Date Received"
                    value={receivingDate}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    margin="normal"
                    sx={{ marginTop: "16px" }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Total Weight"
                    value={weight}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    margin="normal"
                    sx={{ marginTop: "16px" }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Total Bags"
                    value={totalBags}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    margin="normal"
                    sx={{ marginTop: "16px" }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Contract Type"
                    value={contractType}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    margin="normal"
                    sx={{ marginTop: "16px" }}
                  />
                </Grid>
              </Grid>
              <Divider style={{ margin: '16px 0' }} />
            </div>
          )}

          <FormControl fullWidth required sx={{ marginTop: "16px" }}>
            <InputLabel id="ripeness-label">Ripeness</InputLabel>
            <Select
              labelId="ripeness-label"
              id="ripeness"
              multiple
              value={ripeness}
              onChange={(e) => setRipeness(e.target.value)}
              input={<OutlinedInput label="Ripeness" />}
              MenuProps={defaultMenuProps}
            >
              <MenuItem value="Unripe">Unripe</MenuItem>
              <MenuItem value="Semiripe">Semi-ripe</MenuItem>
              <MenuItem value="Ripe">Ripe</MenuItem>
              <MenuItem value="Overripe">Overripe</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth required sx={{ marginTop: "16px" }}>
            <InputLabel id="color-label">Color</InputLabel>
            <Select
              labelId="color-label"
              id="color"
              multiple
              value={color}
              onChange={(e) => setColor(e.target.value)}
              input={<OutlinedInput label="Color" />}
              MenuProps={defaultMenuProps}
            >
              <MenuItem value="Green">Green</MenuItem>
              <MenuItem value="Yellowish Green">Yellowish Green</MenuItem>
              <MenuItem value="Yellow">Yellow</MenuItem>
              <MenuItem value="Red">Red</MenuItem>
              <MenuItem value="Dark Red">Dark Red</MenuItem>
              <MenuItem value="Black">Black</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth required sx={{ marginTop: "16px" }}>
            <InputLabel id="fm-label">Foreign Matter</InputLabel>
            <Select
              labelId="fm-label"
              id="fm"
              value={foreignMatter}
              onChange={(e) => setForeignMatter(e.target.value)}
              input={<OutlinedInput label="Foreign Matter" />}
              MenuProps={defaultMenuProps}
            >
              <MenuItem value="None">None</MenuItem>
              <MenuItem value="Some">Some</MenuItem>
              <MenuItem value="Yes">Yes</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth required sx={{ marginTop: "16px" }}>
            <InputLabel id="oq-label">Overall Quality</InputLabel>
            <Select
              labelId="oq-label"
              id="oq"
              value={overallQuality}
              onChange={(e) => setOverallQuality(e.target.value)}
              input={<OutlinedInput label="Overall Quality" />}
              MenuProps={defaultMenuProps}
            >
              <MenuItem value="Poor">Poor</MenuItem>
              <MenuItem value="Fair">Fair</MenuItem>
              <MenuItem value="Good">Good</MenuItem>
              <MenuItem value="Excellent">Excellent</MenuItem>
            </Select>
          </FormControl>

          {contractType === 'Beli Putus' && (
            <TextField
              label="Price per kg (Rp)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              type="number"
              fullWidth
              required
              margin="normal"
              inputProps={{ min: 0, step: 0.01 }}
            />
          )}

          <FormControl fullWidth required sx={{ marginTop: "16px" }}>
            <InputLabel id="pm-label">Payment Method</InputLabel>
            <Select
              labelId="pm-label"
              id="pm"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              input={<OutlinedInput label="Payment Method" />}
              MenuProps={defaultMenuProps}
            >
              <MenuItem value="Cash to Farmer">Cash to Farmer</MenuItem>
              <MenuItem value="Cash to Broker">Cash to Broker</MenuItem>
              <MenuItem value="Bank Transfer to Farmer">Bank Transfer to Farmer</MenuItem>
              <MenuItem value="Bank Transfer to Broker">Bank Transfer to Broker</MenuItem>
              <MenuItem value="Check">Contract</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="QC Notes"
            multiline
            rows={4}
            value={qcNotes}
            onChange={(e) => setQcNotes(e.target.value)}
            placeholder="Add QC notes"
            fullWidth
            margin="normal"
          />

          {roboflowResults.unripe !== null && (
            <TextField
              label="Unripe"
              value={roboflowResults.unripe}
              fullWidth
              margin="normal"
              InputProps={{ readOnly: true }}
            />
          )}

          {roboflowResults.semi_ripe !== null && (
            <TextField
              label="Semi-Ripe"
              value={roboflowResults.semi_ripe}
              fullWidth
              margin="normal"
              InputProps={{ readOnly: true }}
            />
          )}

          {roboflowResults.ripe !== null && (
            <TextField
              label="Ripe"
              value={roboflowResults.ripe}
              fullWidth
              margin="normal"
              InputProps={{ readOnly: true }}
            />
          )}

          {roboflowResults.overripe !== null && (
            <TextField
              label="Overripe"
              value={roboflowResults.overripe}
              fullWidth
              margin="normal"
              InputProps={{ readOnly: true }}
            />
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            You can capture a cherry photo now or add one later from the completed QC table.
          </Typography>

          <Button
            variant="contained"
            color="secondary"
            onClick={openFormCapture}
            style={{ marginTop: '16px', marginRight: '16px' }}
            disabled={!batchNumber}
          >
            Capture Sample Image
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            style={{ marginTop: '16px' }}
            disabled={!batchNumber}
          >
            Submit QC Data
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
