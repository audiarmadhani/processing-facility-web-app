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


export default function SecondFermentationSection({ mode, form }) {
  const {
    MenuProps,
    accordionDetailsSx,
    accordionFormContentSx,
    availableTanks,
    fermentation,
    isSecondFermentationDisabled,
    secondFermentation,
    secondFermentationTank,
    secondFermentationTimeTarget,
    secondGas,
    secondIsSubmerged,
    secondPostPulped,
    secondPostPulpedDelva,
    secondPressure,
    secondStarterType,
    secondTemperature,
    secondTotalVolume,
    secondWashed,
    setSecondFermentation,
    setSecondFermentationTank,
    setSecondFermentationTimeTarget,
    setSecondGas,
    setSecondIsSubmerged,
    setSecondPostPulped,
    setSecondPostPulpedDelva,
    setSecondPressure,
    setSecondStarterType,
    setSecondTemperature,
    setSecondTotalVolume,
    setSecondWashed,
    tank,
    type,
    detailsData,
    formatDateTimeLocal,
    gas,
    isDetailsSecondFermentationDisabled,
    secondActualVolume,
    secondFermentationCherryWeight,
    secondFermentationEnd,
    secondFermentationPulpedWeight,
    secondFermentationStart,
    secondMosstoUsed,
    secondWaterUsed,
    setDetailsData
  } = form;

  if (mode === 'create') {
    return (
                <Grid item xs={12}>
                  <Accordion sx={{ mb:0, borderRadius: 2, boxShadow: 'none' }} >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="h6" gutterBottom>Second Fermentation Section</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={accordionDetailsSx}>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Card>
                            <CardContent sx={accordionFormContentSx}>

                              <Autocomplete
                                sx={{ mb: 2 }}   // margin-bottom
                                options={['yes', 'no']}
                                value={secondFermentation || null}
                                onChange={(e, newValue) => setSecondFermentation(newValue || '')}
                                renderInput={(params) => (
                                  <TextField {...params} label="Second Fermentation" fullWidth />
                                )}
                              />

                              <FormControl fullWidth sx={{ marginTop: '16px' }}>
                                <InputLabel id="second-fermentation-tank-label">Second Fermentation Tank</InputLabel>
                                <Select
                                  labelId="second-fermentation-tank-label"
                                  value={secondFermentationTank}
                                  onChange={(e) => setSecondFermentationTank(e.target.value)}
                                  input={<OutlinedInput label="Second Fermentation Tank" />}
                                  MenuProps={MenuProps}
                                  disabled={isSecondFermentationDisabled}
                                >
                                  {availableTanks.map(tank => (
                                    <MenuItem key={tank} value={tank}>{tank}</MenuItem>
                                  ))}
                                </Select>
                              </FormControl>

                              <Autocomplete
                                sx={{ mb: 2 }}   // margin-bottom
                                options={['yes', 'no']}
                                value={secondPostPulped || null}
                                onChange={(e, newValue) => setSecondPostPulped(newValue || '')}
                                renderInput={(params) => (
                                  <TextField {...params} label="Second Post-pulped" fullWidth />
                                )}
                              />

                              <Autocomplete
                                sx={{ mb: 2 }}   // margin-bottom
                                options={['yes', 'no']}
                                value={secondPostPulpedDelva || null}
                                onChange={(e, newValue) => setSecondPostPulpedDelva(newValue || '')}
                                renderInput={(params) => (
                                  <TextField {...params} label="Second Post-pulped Delva" fullWidth />
                                )}
                              />

                              <Autocomplete
                                sx={{ mb: 2 }}   // margin-bottom
                                options={['yes', 'no']}
                                value={secondWashed || null}
                                onChange={(e, newValue) => setSecondWashed(newValue || '')}
                                renderInput={(params) => (
                                  <TextField {...params} label="Second Washed" fullWidth />
                                )}
                              />

                              <TextField
                                label="Starter"
                                value={secondStarterType}
                                onChange={(e) => setSecondStarterType(e.target.value)}
                                fullWidth
                                margin="normal"
                                disabled={isSecondFermentationDisabled}
                              />

                              <Autocomplete
                                sx={{ mb: 2 }}   // margin-bottom
                                options={['air', 'co2', 'n2', 'pure o2']}
                                value={secondGas || null}
                                onChange={(e, newValue) => setSecondGas(newValue || '')}
                                renderInput={(params) => (
                                  <TextField {...params} label="Second Gas" fullWidth />
                                )}
                                disabled={isSecondFermentationDisabled}
                              />

                              <TextField
                                label="Second Pressure (psi)"
                                type="number"
                                value={secondPressure}
                                onChange={(e) => setSecondPressure(e.target.value)}
                                fullWidth
                                margin="normal"
                                disabled={isSecondFermentationDisabled}
                              />

                              <Autocomplete
                                sx={{ mb: 2 }}   // margin-bottom
                                options={['yes', 'no']}
                                value={secondIsSubmerged || null}
                                onChange={(e, newValue) => setSecondIsSubmerged(newValue || '')}
                                renderInput={(params) => (
                                  <TextField {...params} label="Second Is Submerged" fullWidth />
                                )}
                              />

                              <TextField
                                label="Second Total Volume (L)"
                                type="number"
                                value={secondTotalVolume}
                                onChange={(e) => setSecondTotalVolume(e.target.value)}
                                fullWidth
                                margin="normal"
                                disabled={isSecondFermentationDisabled}
                              />
                              <TextField
                                label="Second Temperature (°C)"
                                type="number"
                                value={secondTemperature}
                                onChange={(e) => setSecondTemperature(e.target.value)}
                                fullWidth
                                margin="normal"
                                disabled={isSecondFermentationDisabled}
                              />
                              <TextField
                                label="Second Fermentation Time Target (h)"
                                type="number"
                                value={secondFermentationTimeTarget}
                                onChange={(e) => setSecondFermentationTimeTarget(e.target.value)}
                                fullWidth
                                margin="normal"
                                disabled={isSecondFermentationDisabled}
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
          <Accordion sx={{ mb:2, borderRadius: 2, boxShadow: 'none' }} >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" gutterBottom>Second Fermentation Details</Typography>
            </AccordionSummary>
            <AccordionDetails sx={accordionDetailsSx}>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={4}>
                  <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                    <InputLabel id="second-fermentation-details-label">Second Fermentation</InputLabel>
                    <Select
                      labelId="second-fermentation-details-label"
                      value={detailsData.secondFermentation || ''}
                      onChange={(e) => setDetailsData({ ...detailsData, secondFermentation: e.target.value })}
                      label="Second Fermentation"
                    >
                      <MenuItem value="yes">Yes</MenuItem>
                      <MenuItem value="no">No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                    <InputLabel id="second-fermentation-tank-details-label">Second Fermentation Tank</InputLabel>
                    <Select
                      labelId="second-fermentation-tank-details-label"
                      value={detailsData.secondFermentationTank || ''}
                      onChange={(e) => setDetailsData({ ...detailsData, secondFermentationTank: e.target.value })}
                      label="Second Fermentation Tank"
                      disabled={isDetailsSecondFermentationDisabled}
                    >
                      {availableTanks.map(tank => (
                        <MenuItem key={tank} value={tank}>{tank}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                    <InputLabel id="second-post-pulped-details-label">Second Post-pulped</InputLabel>
                    <Select
                      labelId="second-post-pulped-details-label"
                      value={detailsData.secondPostPulped || ''}
                      onChange={(e) => setDetailsData({ ...detailsData, secondPostPulped: e.target.value })}
                      label="Second Post-pulped"
                    >
                      <MenuItem value="yes">Yes</MenuItem>
                      <MenuItem value="no">No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                    <InputLabel id="second-post-pulped-delva-label">Second Post-pulped Delva</InputLabel>
                    <Select
                      labelId="second-post-pulped-delva-label"
                      value={detailsData.secondPostPulpedDelva || ''}
                      onChange={(e) => setDetailsData({ ...detailsData, secondPostPulpedDelva: e.target.value })}
                      label="second-post-pulped Delva"
                    >
                      <MenuItem value="yes">Yes</MenuItem>
                      <MenuItem value="no">No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                    <InputLabel id="second-washed-details-label">Washed</InputLabel>
                    <Select
                      labelId="second-washed-details-label"
                      value={detailsData.secondWashed || ''}
                      onChange={(e) => setDetailsData({ ...detailsData, secondWashed: e.target.value })}
                      label="Washed"
                      disabled={isDetailsSecondFermentationDisabled}
                    >
                      <MenuItem value="yes">Yes</MenuItem>
                      <MenuItem value="no">No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Cherry Weight Before Pulping (kg)"
                    type="number"
                    value={detailsData.secondFermentationCherryWeight || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, secondFermentationCherryWeight: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                    disabled={isDetailsSecondFermentationDisabled}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Pulped Beans Weight (kg)"
                    type="number"
                    value={detailsData.secondFermentationPulpedWeight || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, secondFermentationPulpedWeight: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                    disabled={isDetailsSecondFermentationDisabled}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Starter"
                    value={detailsData.secondStarterType || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, secondStarterType: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                    disabled={isDetailsSecondFermentationDisabled}
                  />
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                    <InputLabel id="second-gas-details-label">Second Gas</InputLabel>
                    <Select
                      labelId="second-gas-details-label"
                      value={detailsData.secondGas || ''}
                      onChange={(e) => setDetailsData({ ...detailsData, secondGas: e.target.value })}
                      label="Second Gas"
                      disabled={isDetailsSecondFermentationDisabled}
                    >
                      <MenuItem value="air">Air</MenuItem>
                      <MenuItem value="co2">CO2</MenuItem>
                      <MenuItem value="n2">N2</MenuItem>
                      <MenuItem value="pure o2">Pure O2</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Second Pressure (psi)"
                    type="number"
                    value={detailsData.secondPressure || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, secondPressure: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                    disabled={isDetailsSecondFermentationDisabled}
                  />
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                    <InputLabel id="second-is-submerged-details-label">Second Is Submerged</InputLabel>
                    <Select
                      labelId="second-is-submerged-details-label"
                      value={detailsData.secondIsSubmerged || ''}
                      onChange={(e) => setDetailsData({ ...detailsData, secondIsSubmerged: e.target.value })}
                      label="Second Is Submerged"
                      disabled={isDetailsSecondFermentationDisabled}
                    >
                      <MenuItem value="yes">Yes</MenuItem>
                      <MenuItem value="no">No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Second Total Volume (L)"
                    type="number"
                    value={detailsData.secondTotalVolume || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, secondTotalVolume: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                    disabled={isDetailsSecondFermentationDisabled}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Second Water Used (L)"
                    type="number"
                    value={detailsData.secondWaterUsed || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, secondWaterUsed: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                    disabled={isDetailsSecondFermentationDisabled}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Second Mossto Used"
                    type="number"
                    value={detailsData.secondMosstoUsed || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, secondMosstoUsed: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                    disabled={isDetailsSecondFermentationDisabled}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Second Actual Volume (L)"
                    type="number"
                    value={detailsData.secondActualVolume || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, secondActualVolume: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                    disabled={isDetailsSecondFermentationDisabled}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Second Temperature (°C)"
                    type="number"
                    value={detailsData.secondTemperature || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, secondTemperature: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                    disabled={isDetailsSecondFermentationDisabled}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Second Fermentation Time Target (h)"
                    type="number"
                    value={detailsData.secondFermentationTimeTarget || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, secondFermentationTimeTarget: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                    disabled={isDetailsSecondFermentationDisabled}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Second Fermentation Start"
                    type="datetime-local"
                    value={formatDateTimeLocal(detailsData.secondFermentationStart || '')}
                    onChange={(e) => setDetailsData({ ...detailsData, secondFermentationStart: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                    InputLabelProps={{ shrink: true }}
                    disabled={isDetailsSecondFermentationDisabled}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Second Fermentation End"
                    type="datetime-local"
                    value={formatDateTimeLocal(detailsData.secondFermentationEnd || '')}
                    onChange={(e) => setDetailsData({ ...detailsData, secondFermentationEnd: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                    InputLabelProps={{ shrink: true }}
                    disabled={isDetailsSecondFermentationDisabled}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
  );
}
