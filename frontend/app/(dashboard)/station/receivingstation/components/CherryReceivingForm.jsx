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
  brix,
  setBrix,
  driverPickupHandoffCode,
  setDriverPickupHandoffCode,
  assigningRFID,
  onSubmit,
}) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h5" gutterBottom sx={{ mb: 1 }}>
          Cherry Receiving Form
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Create the batch and assign RFID first. Record bag weights from the table after creation.
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
                label="Notes"
                multiline
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                fullWidth
              />
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
              <TextField
                label="Driver pickup code (optional)"
                value={driverPickupHandoffCode}
                onChange={(e) =>
                  setDriverPickupHandoffCode(
                    e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6)
                  )
                }
                fullWidth
                placeholder="6 characters from driver"
                inputProps={{ maxLength: 6, style: { letterSpacing: '0.2em' } }}
                helperText="Enter the code the driver received after farm pickup to link this batch later."
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
