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


export default function FermentationSection({ mode, form }) {
  const {
    accordionDetailsSx,
    accordionFormContentSx,
    airlock,
    availableTanks,
    brewTankTemperature,
    cherryType,
    coolerTemperature,
    detailsData,
    fermentation,
    fermentationStart,
    fermentationStarter,
    fermentationStarterAmount,
    fermentationTemperature,
    fermentationTimeTarget,
    fieldDisabled,
    gas,
    handleTankChange,
    isLoadingTanks,
    isSubmerged,
    leachateTarget,
    pH,
    postPulped,
    postPulpedDelva,
    pressure,
    setAirlock,
    setBrewTankTemperature,
    setCherryType,
    setCoolerTemperature,
    setFermentation,
    setFermentationStart,
    setFermentationStarter,
    setFermentationStarterAmount,
    setFermentationTemperature,
    setFermentationTimeTarget,
    setGas,
    setIsSubmerged,
    setLeachateTarget,
    setPH,
    setPostPulped,
    setPostPulpedDelva,
    setPressure,
    setStirring,
    setTankAmount,
    setTotalVolume,
    setWaterTemperature,
    stirring,
    tank,
    tankAmount,
    totalVolume,
    type,
    waterTemperature,
    detailsFieldDisabled,
    fermentationCherryWeight,
    fermentationEnd,
    finalPH,
    finalTDS,
    finalTemperature,
    formatDateTimeLocal,
    leachate,
    postFermentationWeight,
    setDetailsData,
    starterUsed,
    waterUsed
  } = form;

  if (mode === 'create') {
    return (
                <Grid item xs={12}>
                  <Accordion sx={{ mb:0, borderRadius: 2, boxShadow: 'none' }} >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="h6" gutterBottom>Fermentation Section</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={accordionDetailsSx}>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Card>
                            <CardContent sx={accordionFormContentSx}>

                              <Autocomplete
                                sx={{ mb: 2 }}   // margin-bottom
                                options={['whole cherry', 'pulped']}
                                value={cherryType || null}
                                onChange={(e, newValue) => setCherryType(newValue || '')}
                                renderInput={(params) => (
                                  <TextField {...params} label="Cherry Type" fullWidth />
                                )}
                              />

                              <Autocomplete
                                sx={{ mb: 2 }}   // margin-bottom
                                options={['yes', 'no']}
                                value={fermentation || null}
                                onChange={(e, newValue) => setFermentation(newValue || '')}
                                renderInput={(params) => (
                                  <TextField {...params} label="Fermentation" fullWidth />
                                )}
                              />

                              <Autocomplete
                                sx={{ mb: 2 }}   // margin-bottom
                                options={availableTanks}
                                value={tank || null}
                                onChange={(e, newValue) => handleTankChange(newValue || '')}
                                loading={isLoadingTanks}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Fermentation Tank"
                                    fullWidth
                                    InputProps={{
                                      ...params.InputProps,
                                      endAdornment: (
                                        <>
                                          {isLoadingTanks ? <CircularProgress size={20} /> : null}
                                          {params.InputProps.endAdornment}
                                        </>
                                      ),
                                    }}
                                  />
                                )}
                              />

                              <TextField
                                label="Starter"
                                value={fermentationStarter}
                                onChange={(e) => setFermentationStarter(e.target.value)}
                                fullWidth
                                margin="normal"
                              />

                              <TextField
                                fullWidth
                                label="Starter Amount (gr)"
                                type="number"
                                value={fermentationStarterAmount}
                                onChange={(e) => setFermentationStarterAmount(e.target.value)}
                                sx={{ marginTop: '16px' }}
                              />

                              <Autocomplete
                                sx={{ mb: 2 }}   // margin-bottom
                                options={['air', 'co2', 'n2', 'pure o2']}
                                value={gas || null}
                                onChange={(e, newValue) => setGas(newValue || '')}
                                renderInput={(params) => (
                                  <TextField {...params} label="Gas" fullWidth />
                                )}
                                disabled={fieldDisabled.gas}
                              />

                              <TextField
                                label="Pressure (psi)"
                                type="number"
                                value={pressure}
                                onChange={(e) => setPressure(e.target.value)}
                                fullWidth
                                margin="normal"
                              />

                              <Autocomplete
                                sx={{ mb: 2 }}   // margin-bottom
                                options={['yes', 'no']}
                                value={isSubmerged || null}
                                onChange={(e, newValue) => setIsSubmerged(newValue || '')}
                                renderInput={(params) => (
                                  <TextField {...params} label="Is Submerged" fullWidth />
                                )}
                              />

                              <TextField
                                label="Total Volume (L)"
                                type="number"
                                value={totalVolume}
                                onChange={(e) => setTotalVolume(e.target.value)}
                                fullWidth
                                margin="normal"
                              />
                              <TextField
                                label="Stirring (Hz)"
                                type="number"
                                value={stirring}
                                onChange={(e) => setStirring(e.target.value)}
                                fullWidth
                                margin="normal"
                                disabled={fieldDisabled.stirring}
                              />
                              <TextField
                                label="Fermentation Temperature (°C)"
                                type="number"
                                value={fermentationTemperature}
                                onChange={(e) => setFermentationTemperature(e.target.value)}
                                fullWidth
                                margin="normal"
                                disabled={fieldDisabled.fermentationTemperature}
                              />
                              <TextField
                                label="pH"
                                type="number"
                                value={pH}
                                onChange={(e) => setPH(e.target.value)}
                                fullWidth
                                margin="normal"
                                disabled={fieldDisabled.pH}
                              />
                              <TextField
                                label="Fermentation Time Target (h)"
                                type="number"
                                value={fermentationTimeTarget}
                                onChange={(e) => setFermentationTimeTarget(e.target.value)}
                                fullWidth
                                margin="normal"
                              />
                              <TextField
                                label="Fermentation Start"
                                type="datetime-local"
                                value={fermentationStart}
                                onChange={(e) => setFermentationStart(e.target.value)}
                                fullWidth
                                margin="normal"
                                InputLabelProps={{ shrink: true }}
                              />

                              <Autocomplete
                                sx={{ mb: 2 }}   // margin-bottom
                                options={['yes', 'no']}
                                value={postPulped || null}
                                onChange={(e, newValue) => setPostPulped(newValue || '')}
                                renderInput={(params) => (
                                  <TextField {...params} label="Post-pulped" fullWidth />
                                )}
                              />

                              <Autocomplete
                                sx={{ mb: 2 }}   // margin-bottom
                                options={['yes', 'no']}
                                value={postPulpedDelva || null}
                                onChange={(e, newValue) => setPostPulpedDelva(newValue || '')}
                                renderInput={(params) => (
                                  <TextField {...params} label="Post-pulped Delva" fullWidth />
                                )}
                              />

                              <TextField
                                label="Airlock"
                                value={airlock}
                                onChange={(e) => setAirlock(e.target.value)}
                                fullWidth
                                margin="normal"
                                disabled={fieldDisabled.airlock}
                              />
                              <TextField
                                label="Tank Amount"
                                type="number"
                                value={detailsData.tankAmount}
                                onChange={(e) => setTankAmount(e.target.value)}
                                fullWidth
                                margin="normal"
                                disabled={fieldDisabled.tankAmount}
                              />
                              <TextField
                                label="Leachate Target (L)"
                                type="number"
                                value={detailsData.leachateTarget}
                                onChange={(e) => setLeachateTarget(e.target.value)}
                                fullWidth
                                margin="normal"
                                disabled={fieldDisabled.leachateTarget}
                              />
                              <TextField
                                label="Brew Tank Temperature (°C)"
                                type="number"
                                value={detailsData.brewTankTemperature}
                                onChange={(e) => setBrewTankTemperature(e.target.value)}
                                fullWidth
                                margin="normal"
                                disabled={fieldDisabled.brewTankTemperature}
                              />
                              <TextField
                                label="Water Temperature (°C)"
                                type="number"
                                value={detailsData.waterTemperature}
                                onChange={(e) => setWaterTemperature(e.target.value)}
                                fullWidth
                                margin="normal"
                                disabled={fieldDisabled.waterTemperature}
                              />
                              <TextField
                                label="Cooler Temperature (°C)"
                                type="number"
                                value={detailsData.coolerTemperature}
                                onChange={(e) => setCoolerTemperature(e.target.value)}
                                fullWidth
                                margin="normal"
                                disabled={fieldDisabled.coolerTemperature}
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
              <Typography variant="h6" gutterBottom>Fermentation Details</Typography>
            </AccordionSummary>
            <AccordionDetails sx={accordionDetailsSx}>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={4}>
                  <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                    <InputLabel id="cherry-type-details-label">Cherry Type</InputLabel>
                    <Select
                      labelId="cherry-type-details-label"
                      value={detailsData.cherryType || ''}
                      onChange={(e) => setDetailsData({ ...detailsData, cherryType: e.target.value })}
                      label="Cherry Type"
                    >
                      <MenuItem value="whole cherry">Whole Cherry</MenuItem>
                      <MenuItem value="pulped">Pulped</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Fermentation Cherry Weight (kg)"
                    type="number"
                    value={detailsData.fermentationCherryWeight || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, fermentationCherryWeight: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                    <InputLabel id="fermentation-details-label">Fermentation</InputLabel>
                    <Select
                      labelId="fermentation-details-label"
                      value={detailsData.fermentation || ''}
                      onChange={(e) => setDetailsData({ ...detailsData, fermentation: e.target.value })}
                      label="Fermentation"
                    >
                      <MenuItem value="yes">Yes</MenuItem>
                      <MenuItem value="no">No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                    <InputLabel id="fermentation-tank-details-label">Fermentation Tank</InputLabel>
                    <Select
                      labelId="fermentation-tank-details-label"
                      value={detailsData.tank || ''}
                      onChange={(e) => setDetailsData({ ...detailsData, tank: e.target.value })}
                      label="Fermentation Tank"
                    >
                      {availableTanks.map(tank => (
                        <MenuItem key={tank} value={tank}>{tank}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Starter"
                    value={detailsData.fermentationStarter || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, fermentationStarter: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Starter Amount (gr)"
                    type="number"
                    value={detailsData.fermentationStarterAmount || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, fermentationStarterAmount: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                    <InputLabel id="gas-details-label">Gas</InputLabel>
                    <Select
                      labelId="gas-details-label"
                      value={detailsData.gas || ''}
                      onChange={(e) => setDetailsData({ ...detailsData, gas: e.target.value })}
                      label="Gas"
                      disabled={detailsFieldDisabled.gas}
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
                    label="Pressure (psi)"
                    type="number"
                    value={detailsData.pressure || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, pressure: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                    <InputLabel id="is-submerged-details-label">Is Submerged</InputLabel>
                    <Select
                      labelId="is-submerged-details-label"
                      value={detailsData.isSubmerged || ''}
                      onChange={(e) => setDetailsData({ ...detailsData, isSubmerged: e.target.value })}
                      label="Is Submerged"
                    >
                      <MenuItem value="yes">Yes</MenuItem>
                      <MenuItem value="no">No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Total Volume (L)"
                    type="number"
                    value={detailsData.totalVolume || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, totalVolume: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Water Used (L)"
                    type="number"
                    value={detailsData.waterUsed || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, waterUsed: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Starter Used"
                    type="number"
                    value={detailsData.starterUsed || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, starterUsed: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Stirring (Hz)"
                    type="number"
                    value={detailsData.stirring || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, stirring: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                    disabled={detailsFieldDisabled.stirring}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Fermentation Temperature (°C)"
                    type="number"
                    value={detailsData.fermentationTemperature || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, fermentationTemperature: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                    disabled={detailsFieldDisabled.fermentationTemperature}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="pH"
                    type="number"
                    value={detailsData.pH || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, pH: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                    disabled={detailsFieldDisabled.pH}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Fermentation Time Target (h)"
                    type="number"
                    value={detailsData.fermentationTimeTarget || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, fermentationTimeTarget: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Fermentation Start"
                    type="datetime-local"
                    value={formatDateTimeLocal(detailsData.fermentationStart || detailsData.startDate)}
                    onChange={(e) => setDetailsData({ ...detailsData, fermentationStart: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Fermentation End"
                    type="datetime-local"
                    value={formatDateTimeLocal(detailsData.fermentationEnd || detailsData.endDate)}
                    onChange={(e) => setDetailsData({ ...detailsData, fermentationEnd: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Final pH"
                    type="number"
                    value={detailsData.finalPH || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, finalPH: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Final TDS"
                    type="number"
                    value={detailsData.finalTDS || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, finalTDS: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Final Temperature (°C)"
                    type="number"
                    value={detailsData.finalTemperature || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, finalTemperature: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Post Fermentation Weight (kg)"
                    type="number"
                    value={detailsData.postFermentationWeight || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, postFermentationWeight: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                    <InputLabel id="post-pulped-details-label">Post-pulped</InputLabel>
                    <Select
                      labelId="post-pulped-details-label"
                      value={detailsData.postPulped || ''}
                      onChange={(e) => setDetailsData({ ...detailsData, postPulped: e.target.value })}
                      label="Post-pulped"
                    >
                      <MenuItem value="yes">Yes</MenuItem>
                      <MenuItem value="no">No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                    <InputLabel id="post-pulped-delva-label">Post-pulped Delva</InputLabel>
                    <Select
                      labelId="post-pulped-delva-label"
                      value={detailsData.postPulpedDelva || ''}
                      onChange={(e) => setDetailsData({ ...detailsData, postPulpedDelva: e.target.value })}
                      label="Post-pulped Delva"
                    >
                      <MenuItem value="yes">Yes</MenuItem>
                      <MenuItem value="no">No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={4}>
                  <TextField
                    label="Airlock"
                    value={detailsData.airlock || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, airlock: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                    disabled={detailsFieldDisabled.airlock}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Tank Amount"
                    type="number"
                    value={tankAmount}
                    onChange={(e) => setTankAmount(e.target.value)}
                    fullWidth
                    margin="normal"
                    disabled={fieldDisabled.tankAmount}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Leachate Target (L)"
                    type="number"
                    value={leachateTarget}
                    onChange={(e) => setLeachateTarget(e.target.value)}
                    fullWidth
                    margin="normal"
                    disabled={fieldDisabled.leachateTarget}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Leachate (L)"
                    type="number"
                    value={detailsData.leachate || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, leachate: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Brew Tank Temperature (°C)"
                    type="number"
                    value={brewTankTemperature}
                    onChange={(e) => setBrewTankTemperature(e.target.value)}
                    fullWidth
                    margin="normal"
                    disabled={fieldDisabled.brewTankTemperature}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Water Temperature (°C)"
                    type="number"
                    value={waterTemperature}
                    onChange={(e) => setWaterTemperature(e.target.value)}
                    fullWidth
                    margin="normal"
                    disabled={fieldDisabled.waterTemperature}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Cooler Temperature (°C)"
                    type="number"
                    value={coolerTemperature}
                    onChange={(e) => setCoolerTemperature(e.target.value)}
                    fullWidth
                    margin="normal"
                    disabled={fieldDisabled.coolerTemperature}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
  );
}
