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


export default function PreFermentationSection({ mode, form }) {
  const {
    accordionDetailsSx,
    accordionFormContentSx,
    fermentation,
    preClassifier,
    preFermentationStorageEnd,
    preFermentationStorageGoal,
    preFermentationStorageStart,
    prePulped,
    prePulpedDelva,
    preStorage,
    setPreClassifier,
    setPreFermentationStorageEnd,
    setPreFermentationStorageGoal,
    setPreFermentationStorageStart,
    setPrePulped,
    setPrePulpedDelva,
    setPreStorage,
    setWesorter,
    type,
    wesorter,
    detailsData,
    formatDateTimeLocal,
    preFermentationTimeAfterPulping,
    prePulpedWeight,
    preStorageCondition,
    setDetailsData,
    storage
  } = form;

  if (mode === 'create') {
    return (
                <Grid item xs={12}>
                  <Accordion sx={{ mb:0, borderRadius: 2, boxShadow: 'none' }} >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="h6" gutterBottom>Pre-Fermentation Section</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={accordionDetailsSx}>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Card>
                            <CardContent sx={accordionFormContentSx}>

                              <Autocomplete
                                sx={{ mb: 2 }}   // margin-bottom
                                options={['yes', 'no']}
                                value={preStorage || null}
                                onChange={(e, newValue) => setPreStorage(newValue || '')}
                                renderInput={(params) => (
                                  <TextField {...params} label="Pre-fermentation" fullWidth />
                                )}
                              />

                              <TextField
                                label="Pre-Fermentation Storage Goal (h)"
                                type="number"
                                value={preFermentationStorageGoal}
                                onChange={(e) => setPreFermentationStorageGoal(e.target.value)}
                                fullWidth
                                margin="normal"
                              />

                              <TextField
                                label="Pre-Fermentation Storage Start"
                                type="datetime-local"
                                value={preFermentationStorageStart}
                                onChange={(e) => setPreFermentationStorageStart(e.target.value)}
                                fullWidth
                                margin="normal"
                                InputLabelProps={{ shrink: true }}
                              />

                              <TextField
                                label="Pre-Fermentation Storage End"
                                type="datetime-local"
                                value={preFermentationStorageEnd}
                                onChange={(e) => setPreFermentationStorageEnd(e.target.value)}
                                fullWidth
                                margin="normal"
                                InputLabelProps={{ shrink: true }}
                              />

                              <Autocomplete
                                sx={{ mb: 2 }}   // margin-bottom
                                options={['yes', 'no']}
                                value={prePulped || null}
                                onChange={(e, newValue) => setPrePulped(newValue || '')}
                                renderInput={(params) => (
                                  <TextField {...params} label="Pre-pulped" fullWidth />
                                )}
                              />

                              <Autocomplete
                                sx={{ mb: 2 }}   // margin-bottom
                                options={['yes', 'no']}
                                value={prePulpedDelva || null}
                                onChange={(e, newValue) => setPrePulpedDelva(newValue || '')}
                                renderInput={(params) => (
                                  <TextField {...params} label="Pre-pulped Delva" fullWidth />
                                )}
                              />

                              <Autocomplete
                                sx={{ mb: 2 }}   // margin-bottom
                                options={['yes', 'no']}
                                value={wesorter || null}
                                onChange={(e, newValue) => setWesorter(newValue || '')}
                                renderInput={(params) => (
                                  <TextField {...params} label="Wesorter" fullWidth />
                                )}
                              />

                              <Autocomplete
                                sx={{ mb: 2 }}   // margin-bottom
                                options={['yes', 'no']}
                                value={preClassifier || null}
                                onChange={(e, newValue) => setPreClassifier(newValue || '')}
                                renderInput={(params) => (
                                  <TextField {...params} label="Pre-classifier" fullWidth />
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
          <Accordion sx={{ mb:2, borderRadius: 2, boxShadow: 'none' }} >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" gutterBottom>Pre-Fermentation Details</Typography>
            </AccordionSummary>
            <AccordionDetails sx={accordionDetailsSx}>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={4}>
                  <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                    <InputLabel id="pre-storage-details-label">Pre-storage</InputLabel>
                    <Select
                      labelId="pre-storage-details-label"
                      value={detailsData.preStorage || ''}
                      onChange={(e) => setDetailsData({ ...detailsData, preStorage: e.target.value })}
                      label="Pre-storage"
                    >
                      <MenuItem value="yes">Yes</MenuItem>
                      <MenuItem value="no">No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Pre-storage Condition"
                    value={detailsData.preStorageCondition || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, preStorageCondition: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Pre-Fermentation Storage Goal (h)"
                    type="number"
                    value={detailsData.preFermentationStorageGoal || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, preFermentationStorageGoal: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Pre-Fermentation Storage Start"
                    type="datetime-local"
                    value={formatDateTimeLocal(detailsData.preFermentationStorageStart || '')}
                    onChange={(e) => setDetailsData({ ...detailsData, preFermentationStorageStart: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Pre-Fermentation Storage End"
                    type="datetime-local"
                    value={formatDateTimeLocal(detailsData.preFermentationStorageEnd || '')}
                    onChange={(e) => setDetailsData({ ...detailsData, preFermentationStorageEnd: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                    <InputLabel id="pre-pulped-details-label">Pre-pulped</InputLabel>
                    <Select
                      labelId="pre-pulped-details-label"
                      value={detailsData.prePulped || ''}
                      onChange={(e) => setDetailsData({ ...detailsData, prePulped: e.target.value })}
                      label="Pre-pulped"
                    >
                      <MenuItem value="yes">Yes</MenuItem>
                      <MenuItem value="no">No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                    <InputLabel id="pre-pulped-delva-details-label">Pre-pulped Delva</InputLabel>
                    <Select
                      labelId="pre-pulped-delva-details-label"
                      value={detailsData.prePulpedDelva || ''}
                      onChange={(e) => setDetailsData({ ...detailsData, prePulpedDelva: e.target.value })}
                      label="Pre-pulped Delva"
                    >
                      <MenuItem value="yes">Yes</MenuItem>
                      <MenuItem value="no">No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Time After Pulping (h)"
                    type="number"
                    value={detailsData.preFermentationTimeAfterPulping || ''}
                    onChange={(e) =>
                      setDetailsData({
                        ...detailsData,
                        preFermentationTimeAfterPulping: e.target.value
                      })
                    }
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Post-pulped Weight (kg)"
                    type="number"
                    value={detailsData.prePulpedWeight || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, prePulpedWeight: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                    <InputLabel id="wesorter-details-label">Wesorter</InputLabel>
                    <Select
                      labelId="wesorter-details-label"
                      value={detailsData.wesorter || ''}
                      onChange={(e) => setDetailsData({ ...detailsData, wesorter: e.target.value })}
                      label="Wesorter"
                    >
                      <MenuItem value="yes">Yes</MenuItem>
                      <MenuItem value="no">No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                    <InputLabel id="pre-classifier-details-label">Pre-classifier</InputLabel>
                    <Select
                      labelId="pre-classifier-details-label"
                      value={detailsData.preClassifier || ''}
                      onChange={(e) => setDetailsData({ ...detailsData, preClassifier: e.target.value })}
                      label="Pre-classifier"
                    >
                      <MenuItem value="yes">Yes</MenuItem>
                      <MenuItem value="no">No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
  );
}
