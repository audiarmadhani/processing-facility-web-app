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

export default function GreenBeanReceivingForm({
  farmerList,
  selectedFarmerDetails,
  onFarmerChange,
  type,
  setType,
  producer,
  setProducer,
  processingType,
  setProcessingType,
  grade,
  setGrade,
  price,
  setPrice,
  moisture,
  setMoisture,
  notes,
  setNotes,
  assigningRFID,
  onSubmit,
}) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h5" gutterBottom sx={{ mb: 1 }}>
          Green Bean Receiving Form
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
              <FormControl fullWidth required>
                <InputLabel id="processing-type-label">Processing Type</InputLabel>
                <Select
                  labelId="processing-type-label"
                  value={processingType}
                  onChange={(e) => setProcessingType(e.target.value)}
                  input={<OutlinedInput label="Processing Type" />}
                  MenuProps={defaultMenuProps}
                >
                  <MenuItem value="Washed">Washed</MenuItem>
                  <MenuItem value="Natural">Natural</MenuItem>
                  <MenuItem value="Honey">Honey</MenuItem>
                  <MenuItem value="Anaerobic">Anaerobic</MenuItem>
                  <MenuItem value="CM Natural">CM Natural</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel id="grade-label">Grade</InputLabel>
                <Select
                  labelId="grade-label"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  input={<OutlinedInput label="Grade" />}
                  MenuProps={defaultMenuProps}
                >
                  <MenuItem value="Specialty Grade">Specialty Grade</MenuItem>
                  <MenuItem value="Grade 1">Grade 1</MenuItem>
                  <MenuItem value="Grade 2">Grade 2</MenuItem>
                  <MenuItem value="Grade 3">Grade 3</MenuItem>
                  <MenuItem value="Grade 4">Grade 4</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Price (IDR/kg)"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                fullWidth
                inputProps={{ step: '0.1', min: '0' }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Moisture (%)"
                type="number"
                value={moisture}
                onChange={(e) => setMoisture(e.target.value)}
                fullWidth
                inputProps={{ step: '0.1', min: '0', max: '100' }}
              />
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
