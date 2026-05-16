'use client';

import {
  Typography,
  Grid,
  TextField,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Box,
  CircularProgress,
} from '@mui/material';
import { Autocomplete } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { accordionFormContentSx, accordionDetailsSx } from '../../constants';
import { wideMenuProps as MenuProps } from '../../../_shared/constants/menuProps';
import { formatDateTimeLocal } from '../../utils/formatDateTimeLocal';


export default function DryingSection({ mode, form }) {
  const {
    accordionDetailsSx,
    accordionFormContentSx,
    drying,
    rehydration,
    secondDrying,
    setDrying,
    setRehydration,
    setSecondDrying,
    avgTemperature,
    bagType,
    detailsData,
    dryingArea,
    dryingEnd,
    dryingStart,
    finalMoisture,
    formatDateTimeLocal,
    hullingTime,
    postDryingWeight,
    postHullingWeight,
    preDryingWeight,
    secondAverageTemperature,
    secondDryingArea,
    secondDryingEnd,
    secondDryingStart,
    secondFinalMoisture,
    secondPostDryingWeight,
    setDetailsData,
    storage,
    storageTemperature,
    type
  } = form;

  if (mode === 'create') {
    return (
                <Grid item xs={12}>
                  <Accordion sx={{ mb:0, borderRadius: 2, boxShadow: 'none' }} >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="h6" gutterBottom>Drying Section</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={accordionDetailsSx}>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Card>
                            <CardContent sx={accordionFormContentSx}>

                              <Autocomplete
                                sx={{ mb: 2 }}   // margin-bottom
                                options={['Greenhouse', 'Drying Room', 'Sun Dry']}
                                value={drying || null}
                                onChange={(e, newValue) => setDrying(newValue || '')}
                                renderInput={(params) => (
                                  <TextField {...params} label="Drying Method" fullWidth />
                                )}
                              />

                              <Autocomplete
                                sx={{ mb: 2 }}   // margin-bottom
                                options={['yes', 'no']}
                                value={secondDrying || null}
                                onChange={(e, newValue) => setSecondDrying(newValue || '')}
                                renderInput={(params) => (
                                  <TextField {...params} label="Second Drying" fullWidth />
                                )}
                              />

                              <Autocomplete
                                sx={{ mb: 2 }}   // margin-bottom
                                options={['yes', 'no']}
                                value={rehydration || null}
                                onChange={(e, newValue) => setRehydration(newValue || '')}
                                renderInput={(params) => (
                                  <TextField {...params} label="Rehydration" fullWidth />
                                )}
                              />

                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
    );
  }

  return (
    <>
          <Accordion sx={{ mb:2, borderRadius: 2, boxShadow: 'none' }} >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" gutterBottom>Drying Details</Typography>
            </AccordionSummary>
            <AccordionDetails sx={accordionDetailsSx}>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={4}>
                  <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                    <InputLabel id="drying-area-details-label">Drying Area</InputLabel>
                    <Select
                      labelId="drying-area-details-label"
                      value={detailsData.dryingArea || ''}
                      onChange={(e) => setDetailsData({ ...detailsData, dryingArea: e.target.value })}
                      label="Drying Area"
                    >
                      <MenuItem value="greenhouse">Greenhouse</MenuItem>
                      <MenuItem value="sun dry">Sun Dry</MenuItem>
                      <MenuItem value="drying room">Drying Room</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Average Temperature (°C)"
                    type="number"
                    value={detailsData.avgTemperature || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, avgTemperature: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Pre-drying Weight (kg)"
                    type="number"
                    value={detailsData.preDryingWeight || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, preDryingWeight: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Final Moisture (%)"
                    type="number"
                    value={detailsData.finalMoisture || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, finalMoisture: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Post-drying Weight (kg)"
                    type="number"
                    value={detailsData.postDryingWeight || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, postDryingWeight: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Drying Start"
                    type="datetime-local"
                    value={formatDateTimeLocal(detailsData.dryingStart || '')}
                    onChange={(e) => setDetailsData({ ...detailsData, dryingStart: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Drying End"
                    type="datetime-local"
                    value={formatDateTimeLocal(detailsData.dryingEnd || '')}
                    onChange={(e) => setDetailsData({ ...detailsData, dryingEnd: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                    <InputLabel id="second-drying-details-label">Second Drying</InputLabel>
                    <Select
                      labelId="second-drying-details-label"
                      value={detailsData.secondDrying || ''}
                      onChange={(e) => setDetailsData({ ...detailsData, secondDrying: e.target.value })}
                      label="Second Drying"
                    >
                      <MenuItem value="yes">Yes</MenuItem>
                      <MenuItem value="no">No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                    <InputLabel id="second-drying-area-details-label">Second Drying Area</InputLabel>
                    <Select
                      labelId="second-drying-area-details-label"
                      value={detailsData.secondDryingArea || ''}
                      onChange={(e) => setDetailsData({ ...detailsData, secondDryingArea: e.target.value })}
                      label="Second Drying Area"
                    >
                      <MenuItem value="greenhouse">Greenhouse</MenuItem>
                      <MenuItem value="outside">Outside</MenuItem>
                      <MenuItem value="drying room">Drying Room</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Second Average Temperature (°C)"
                    type="number"
                    value={detailsData.secondAverageTemperature || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, secondAverageTemperature: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Second Final Moisture (%)"
                    type="number"
                    value={detailsData.secondFinalMoisture || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, secondFinalMoisture: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Second Post-drying Weight (kg)"
                    type="number"
                    value={detailsData.secondPostDryingWeight || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, secondPostDryingWeight: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Second Drying Start"
                    type="datetime-local"
                    value={formatDateTimeLocal(detailsData.secondDryingStart || '')}
                    onChange={(e) => setDetailsData({ ...detailsData, secondDryingStart: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Second Drying End"
                    type="datetime-local"
                    value={formatDateTimeLocal(detailsData.secondDryingEnd || '')}
                    onChange={(e) => setDetailsData({ ...detailsData, secondDryingEnd: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                    <InputLabel id="rehydration-details-label">Rehydration</InputLabel>
                    <Select
                      labelId="rehydration-details-label"
                      value={detailsData.rehydration || ''}
                      onChange={(e) => setDetailsData({ ...detailsData, rehydration: e.target.value })}
                      label="Rehydration"
                    >
                      <MenuItem value="yes">Yes</MenuItem>
                      <MenuItem value="no">No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                    <InputLabel id="drying-details-label">Drying Method</InputLabel>
                    <Select
                      labelId="drying-details-label"
                      value={detailsData.drying || ''}
                      onChange={(e) => setDetailsData({ ...detailsData, drying: e.target.value })}
                      label="Drying Method"
                    >
                      <MenuItem value="Greenhouse">Greenhouse</MenuItem>
                      <MenuItem value="Drying Room">Drying Room</MenuItem>
                      <MenuItem value="Sun Dry">Sun Dry</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ mb:2, borderRadius: 2, boxShadow: 'none' }} >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" gutterBottom>Post Drying Details</Typography>
            </AccordionSummary>
            <AccordionDetails sx={accordionDetailsSx}>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={4}>
                  <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                    <InputLabel id="storage-details-label">Storage</InputLabel>
                    <Select
                      labelId="storage-details-label"
                      value={detailsData.storage || ''}
                      onChange={(e) => setDetailsData({ ...detailsData, storage: e.target.value })}
                      label="Storage"
                    >
                      <MenuItem value="yes">Yes</MenuItem>
                      <MenuItem value="no">No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Storage Temperature (°C)"
                    type="number"
                    value={detailsData.storageTemperature || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, storageTemperature: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Hulling Time"
                    type="datetime-local"
                    value={formatDateTimeLocal(detailsData.hullingTime || '')}
                    onChange={(e) => setDetailsData({ ...detailsData, hullingTime: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                    <InputLabel id="bag-type-details-label">Bag Type</InputLabel>
                    <Select
                      labelId="bag-type-details-label"
                      value={detailsData.bagType || ''}
                      onChange={(e) => setDetailsData({ ...detailsData, bagType: e.target.value })}
                      label="Bag Type"
                    >
                      <MenuItem value="jute">Jute</MenuItem>
                      <MenuItem value="plastic">Plastic</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Post-hulling Weight (kg)"
                    type="number"
                    value={detailsData.postHullingWeight || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, postHullingWeight: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
    </>
  );
}
