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


export default function CherryInformationSection({ mode, form }) {
  const {
    MenuProps,
    accordionDetailsSx,
    accordionFormContentSx,
    availableBatches,
    batchNumber,
    checkExperimentNumber,
    description,
    purpose,
    experimentNumber,
    farmerName,
    handleBatchNumberChange,
    handleProcessingTypeChange,
    handleReferenceNumberChange,
    cherryWeight,
    cherryWeightSource,
    cherryWeightLoading,
    processingType,
    productLine,
    referenceMappings,
    referenceNumber,
    setDescription,
    setPurpose,
    setExperimentNumber,
    setProductLine,
    setVersion,
    type,
    variety,
    version,
    brix,
    damagedWeight,
    defectWeight,
    detailsData,
    formatDateTimeLocal,
    harvestAt,
    harvestDate,
    lostWeight,
    preprocessingWeight,
    quality,
    receivedAt,
    receivedWeight,
    rejectWeight,
    setDetailsData
  } = form;

  if (mode === 'create') {
    return (
                <Grid item xs={12}>
                  <Accordion sx={{ mb:0, borderRadius: 2, boxShadow: 'none' }} >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="h6" gutterBottom>Cherry Information</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={accordionDetailsSx}>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Card>
                            <CardContent sx={accordionFormContentSx}>

                              <Autocomplete
                                sx={{ mb: 2 }}
                                options={availableBatches}
                                getOptionLabel={(option) => option.batchNumber || ''}
                                value={
                                  availableBatches.find(b => b.batchNumber === batchNumber) || null
                                }
                                onChange={(e, newValue) => {
                                  handleBatchNumberChange(newValue?.batchNumber || '');
                                }}
                                renderOption={(props, option) => (
                                  <li {...props}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                      <Typography>{option.batchNumber}</Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        Farmer: {option.farmerName}, {option.weight}kg, Type: {option.type}
                                      </Typography>
                                    </Box>
                                  </li>
                                )}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Batch Number (optional)"
                                    fullWidth
                                    helperText="Optional — assign later if cherry has not arrived"
                                  />
                                )}
                              />

                              <TextField
                                label="Cherry weight (kg)"
                                value={
                                  cherryWeightLoading
                                    ? ''
                                    : cherryWeight != null
                                      ? Number(cherryWeight).toFixed(2)
                                      : batchNumber
                                        ? '—'
                                        : ''
                                }
                                disabled
                                fullWidth
                                margin="normal"
                                helperText={
                                  !batchNumber
                                    ? 'Assign a batch to view cherry weight'
                                    : cherryWeightLoading
                                      ? 'Loading cherry weight...'
                                      : cherryWeightSource === 'wetmill'
                                        ? 'Source: Wet mill (for cross-check)'
                                        : cherryWeightSource === 'preprocessing'
                                          ? 'Source: Preprocessing (for cross-check)'
                                          : 'No cherry weight available'
                                }
                                InputProps={{
                                  endAdornment: cherryWeightLoading ? (
                                    <CircularProgress size={20} />
                                  ) : null,
                                }}
                                sx={{ mb: 2 }}
                              />

                              <Autocomplete
                                sx={{ mb: 2 }}   // margin-bottom
                                options={referenceMappings.filter(
                                  m => !processingType || m.processingType === processingType
                                )}
                                getOptionLabel={(option) => option.referenceNumber || ''}
                                value={
                                  referenceMappings.find(m => m.referenceNumber === referenceNumber) || null
                                }
                                onChange={(e, newValue) => {
                                  handleReferenceNumberChange(newValue?.referenceNumber || '');
                                }}
                                isOptionEqualToValue={(option, value) =>
                                  option.referenceNumber === value.referenceNumber
                                }
                                renderInput={(params) => (
                                  <TextField {...params} label="Reference Number" fullWidth />
                                )}
                              />

                              <TextField
                                label="Version"
                                type="number"
                                value={version}
                                onChange={(e) => setVersion(e.target.value)}
                                fullWidth
                                required
                                margin="normal"
                              />

                              <Typography variant="body2" sx={{ mt: 1 }}>
                                Full Reference: {referenceNumber && version
                                  ? `${referenceNumber}-${version}`
                                  : '-'}
                              </Typography>

                              <Autocomplete
                                sx={{ mb: 2 }}   // margin-bottom
                                options={[...new Set(referenceMappings.map(m => m.processingType))]}
                                value={processingType || null}
                                onChange={(e, newValue) => {
                                  handleProcessingTypeChange(newValue || '');
                                }}
                                renderInput={(params) => (
                                  <TextField {...params} label="Processing Type" fullWidth required />
                                )}
                              />

                              <TextField
                                label="Experiment Number"
                                type="number"
                                value={experimentNumber}
                                onChange={(e) => setExperimentNumber(e.target.value)}
                                onBlur={checkExperimentNumber}
                                fullWidth
                                required
                                margin="normal"
                              />
                              <TextField
                                label="Purpose"
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                                fullWidth
                                margin="normal"
                                multiline
                                minRows={3}
                              />
                              <TextField
                                label="Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                fullWidth
                                margin="normal"
                              />
                              <TextField
                                label="Farmer Name"
                                value={farmerName}
                                disabled
                                fullWidth
                                margin="normal"
                                helperText={!batchNumber ? 'Assign a batch to populate' : ''}
                              />
                              <TextField
                                label="Type"
                                value={type}
                                disabled
                                fullWidth
                                margin="normal"
                                helperText={!batchNumber ? 'Assign a batch to populate' : ''}
                              />
                              <FormControl fullWidth required={Boolean(batchNumber)} sx={{ marginTop: '16px' }}>
                                <InputLabel id="variety-label">Variety</InputLabel>
                                <Select
                                  labelId="variety-label"
                                  value={variety}
                                  input={<OutlinedInput label="Variety" />}
                                  disabled
                                >
                                  <MenuItem value={variety}>{variety || '-'}</MenuItem>
                                </Select>
                              </FormControl>
                              <FormControl fullWidth required sx={{ marginTop: '16px' }}>
                                <InputLabel id="product-line-label">Product</InputLabel>
                                <Select
                                  labelId="product-line-label"
                                  value={productLine}
                                  onChange={(e) => setProductLine(e.target.value)}
                                  input={<OutlinedInput label="Product" />}
                                  MenuProps={MenuProps}
                                >
                                  <MenuItem value="production lot">Production Lot</MenuItem>
                                  <MenuItem value="experiment lot">Experiment Lot</MenuItem>
                                </Select>
                              </FormControl>
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
              <Typography variant="h6" gutterBottom>Cherry Information</Typography>
            </AccordionSummary>
            <AccordionDetails sx={accordionDetailsSx}>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={4}>
                  <TextField
                    label="Batch Number"
                    value={detailsData.batchNumber || 'TBD'}
                    onChange={(e) => setDetailsData({ ...detailsData, batchNumber: e.target.value })}
                    fullWidth
                    disabled
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Cherry weight (kg)"
                    value={
                      cherryWeightLoading
                        ? ''
                        : cherryWeight != null
                          ? Number(cherryWeight).toFixed(2)
                          : detailsData.batchNumber
                            ? '—'
                            : ''
                    }
                    disabled
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                    helperText={
                      cherryWeightLoading
                        ? 'Loading cherry weight...'
                        : cherryWeightSource === 'wetmill'
                          ? 'Source: Wet mill (for cross-check)'
                          : cherryWeightSource === 'preprocessing'
                            ? 'Source: Preprocessing (for cross-check)'
                            : detailsData.batchNumber
                              ? 'No cherry weight available'
                              : ''
                    }
                    InputProps={{
                      endAdornment: cherryWeightLoading ? (
                        <CircularProgress size={20} />
                      ) : null,
                    }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                    <InputLabel id="reference-number-details-label">Reference Number</InputLabel>
                    <Select
                      labelId="reference-number-details-label"
                      value={detailsData.referenceNumber || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const selectedMapping = referenceMappings.find(mapping => mapping.referenceNumber === value);
                        setDetailsData({
                          ...detailsData,
                          referenceNumber: value,
                          processingType: selectedMapping ? selectedMapping.processingType : detailsData.processingType
                        });
                      }}
                      label="Reference Number"
                    >
                      {referenceMappings
                        .filter(mapping => !detailsData.processingType || mapping.processingType === detailsData.processingType)
                        .map(mapping => (
                          <MenuItem key={mapping.id} value={mapping.referenceNumber}>
                            {mapping.referenceNumber}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                <TextField
                  label="Version"
                  type="number"
                  value={detailsData.version || ''}
                  onChange={(e) =>
                    setDetailsData({ ...detailsData, version: e.target.value })
                  }
                  fullWidth
                  variant="outlined"
                  sx={{ mt: 1 }}
                />
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                    <InputLabel id="processing-type-details-label">Processing Type</InputLabel>
                    <Select
                      labelId="processing-type-details-label"
                      value={detailsData.processingType || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setDetailsData({
                          ...detailsData,
                          processingType: value,
                          // ✅ do NOT touch referenceNumber
                        });
                      }}
                      label="Processing Type"
                    >
                      {[...new Set(referenceMappings.map(mapping => mapping.processingType))].map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Experiment Number"
                    type="number"
                    value={detailsData.experimentNumber || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, experimentNumber: e.target.value })}
                    onBlur={() => checkExperimentNumber(detailsData.experimentNumber, detailsData.id)}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Purpose"
                    value={detailsData.purpose || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, purpose: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                    multiline
                    minRows={3}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Description"
                    value={detailsData.description || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, description: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Farmer Name"
                    value={detailsData.farmerName || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, farmerName: e.target.value })}
                    fullWidth
                    disabled
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                    <InputLabel id="type-details-label">Type</InputLabel>
                    <Select
                      labelId="type-details-label"
                      value={detailsData.type || ''}
                      onChange={(e) => setDetailsData({ ...detailsData, type: e.target.value })}
                      label="Type"
                      disabled
                    >
                      <MenuItem value="arabica">Arabica</MenuItem>
                      <MenuItem value="robusta">Robusta</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                    <InputLabel id="variety-details-label">Variety</InputLabel>
                    <Select
                      labelId="variety-details-label"
                      value={detailsData.variety || ''}
                      onChange={(e) => setDetailsData({ ...detailsData, variety: e.target.value })}
                      label="Variety"
                    >
                      <MenuItem value="cobra">Cobra</MenuItem>
                      <MenuItem value="yellow caturra">Yellow Caturra</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Harvest Date"
                    type="date"
                    value={detailsData.harvestDate || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, harvestDate: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Harvest At"
                    type="datetime-local"
                    value={formatDateTimeLocal(detailsData.harvestAt || '')}
                    onChange={(e) => setDetailsData({ ...detailsData, harvestAt: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Received At"
                    type="datetime-local"
                    value={formatDateTimeLocal(detailsData.receivedAt || '')}
                    onChange={(e) => setDetailsData({ ...detailsData, receivedAt: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Received Weight (kg)"
                    type="number"
                    value={detailsData.receivedWeight || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, receivedWeight: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Reject Weight (kg)"
                    type="number"
                    value={detailsData.rejectWeight || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, rejectWeight: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Defect Weight (kg)"
                    type="number"
                    value={detailsData.defectWeight || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, defectWeight: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Damaged Weight (kg)"
                    type="number"
                    value={detailsData.damagedWeight || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, damagedWeight: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Lost Weight (kg)"
                    type="number"
                    value={detailsData.lostWeight || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, lostWeight: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Preprocessing Weight (kg)"
                    type="number"
                    value={detailsData.preprocessingWeight || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, preprocessingWeight: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Quality (%)"
                    type="number"
                    value={detailsData.quality || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, quality: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Brix"
                    type="number"
                    value={detailsData.brix || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, brix: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Product Line"
                    value={detailsData.productLine || ''}
                    onChange={(e) => setDetailsData({ ...detailsData, productLine: e.target.value })}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
  );
}
