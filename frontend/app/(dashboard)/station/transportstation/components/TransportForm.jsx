'use client';

import {
  TextField, Button, Typography, Grid, Card, CardContent,
  FormControl, InputLabel, Select, MenuItem, Chip, Autocomplete, OutlinedInput, Divider,
  Collapse, Tooltip
} from '@mui/material';

export default function TransportForm({ station }) {
  const {
    batchNumbers,
    selectedBatchNumbers,
    setSelectedBatchNumbers,
    contractType,
    kabupatenList,
    kecamatanList,
    desaList,
    kabupaten,
    kecamatan,
    desa,
    handleKabupatenChange,
    handleKecamatanChange,
    handleDesaChange,
    cost,
    setCost,
    transportCostCollectionToFacility,
    setTransportCostCollectionToFacility,
    loadingWorkerCount,
    setLoadingWorkerCount,
    loadingWorkerCostPerPerson,
    setLoadingWorkerCostPerPerson,
    unloadingWorkerCount,
    setUnloadingWorkerCount,
    unloadingWorkerCostPerPerson,
    setUnloadingWorkerCostPerPerson,
    transportCostFarmToCollection,
    setTransportCostFarmToCollection,
    harvestWorkerCount,
    setHarvestWorkerCount,
    harvestWorkerCostPerPerson,
    setHarvestWorkerCostPerPerson,
    paidTo,
    handlePaidToChange,
    contacts,
    isOtherFarmer,
    customPaidTo,
    setCustomPaidTo,
    customFarmerAddress,
    setCustomFarmerAddress,
    customBankAccount,
    setCustomBankAccount,
    customBankName,
    setCustomBankName,
    selectedFarmerDetails,
    paymentMethod,
    setPaymentMethod,
    handleSubmit,
  } = station;

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h5" gutterBottom>Transport Station Form</Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Batch Number</InputLabel>
                <Select
                  multiple
                  value={selectedBatchNumbers}
                  onChange={e => setSelectedBatchNumbers(e.target.value)}
                  input={<OutlinedInput label="Batch Number" />}
                  renderValue={selected => (
                    <div>
                      {selected.map(value => <Chip key={value} label={value} />)}
                    </div>
                  )}
                >
                  {batchNumbers.map(batch => (
                    <MenuItem key={batch.batchNumber} value={batch.batchNumber}>{batch.batchNumber}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Contract Type"
                value={contractType}
                fullWidth
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                options={kabupatenList}
                value={kabupaten}
                onChange={handleKabupatenChange}
                renderInput={params => <TextField {...params} label="Kabupaten" />}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                options={kecamatanList}
                value={kecamatan}
                onChange={handleKecamatanChange}
                disabled={!kabupaten}
                renderInput={params => <TextField {...params} label="Kecamatan" />}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                options={desaList}
                value={desa}
                onChange={handleDesaChange}
                disabled={!kecamatan}
                renderInput={params => <TextField {...params} label="Desa" />}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2 }}>Cost Details</Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label={contractType === 'Kontrak Lahan' ? 'Transport Cost (Collection Point to Facility)' : 'Transport Cost (Farm to Facility)'}
                type="number"
                value={contractType === 'Kontrak Lahan' ? transportCostCollectionToFacility : cost}
                onChange={e => contractType === 'Kontrak Lahan' ? setTransportCostCollectionToFacility(e.target.value) : setCost(e.target.value)}
                fullWidth
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Divider style={{ margin: '16px 0' }} />
            <Grid item xs={6}>
              <Tooltip title="Number of workers loading cherries onto the truck">
                <TextField
                  label="Loading Workers Count"
                  type="number"
                  value={loadingWorkerCount}
                  onChange={e => setLoadingWorkerCount(e.target.value)}
                  fullWidth
                  inputProps={{ min: 0 }}
                />
              </Tooltip>
            </Grid>
            <Grid item xs={6}>
              <Tooltip title="Cost per loading worker (IDR)">
                <TextField
                  label="Cost per Loading Worker"
                  type="number"
                  value={loadingWorkerCostPerPerson}
                  onChange={e => setLoadingWorkerCostPerPerson(e.target.value)}
                  fullWidth
                  inputProps={{ min: 0 }}
                />
              </Tooltip>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Total Loading Cost"
                value={(Number(loadingWorkerCount) * Number(loadingWorkerCostPerPerson)).toFixed(0)}
                fullWidth
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Divider style={{ margin: '16px 0' }} />
            <Grid item xs={6}>
              <Tooltip title="Number of workers unloading cherries from the truck">
                <TextField
                  label="Unloading Workers Count"
                  type="number"
                  value={unloadingWorkerCount}
                  onChange={e => setUnloadingWorkerCount(e.target.value)}
                  fullWidth
                  inputProps={{ min: 0 }}
                />
              </Tooltip>
            </Grid>
            <Grid item xs={6}>
              <Tooltip title="Cost per unloading worker (IDR)">
                <TextField
                  label="Cost per Unloading Worker"
                  type="number"
                  value={unloadingWorkerCostPerPerson}
                  onChange={e => setUnloadingWorkerCostPerPerson(e.target.value)}
                  fullWidth
                  inputProps={{ min: 0 }}
                />
              </Tooltip>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Total Unloading Cost"
                value={(Number(unloadingWorkerCount) * Number(unloadingWorkerCostPerPerson)).toFixed(0)}
                fullWidth
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Divider style={{ margin: '16px 0' }} />
            <Collapse in={contractType === 'Kontrak Lahan'}>
              <Grid item xs={12}>
                <TextField
                  label="Transport Cost (Farm to Collection Point)"
                  type="number"
                  value={transportCostFarmToCollection}
                  onChange={e => setTransportCostFarmToCollection(e.target.value)}
                  fullWidth
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Divider style={{ margin: '16px 0' }} />
              <Grid item xs={6}>
                <Tooltip title="Number of workers harvesting cherries at the farm">
                  <TextField
                    label="Harvest Workers Count (Buruh Petik)"
                    type="number"
                    value={harvestWorkerCount}
                    onChange={e => setHarvestWorkerCount(e.target.value)}
                    fullWidth
                    inputProps={{ min: 0 }}
                  />
                </Tooltip>
              </Grid>
              <Grid item xs={6}>
                <Tooltip title="Cost per worker for harvesting (IDR)">
                  <TextField
                    label="Cost per Harvest Worker"
                    type="number"
                    value={harvestWorkerCostPerPerson}
                    onChange={e => setHarvestWorkerCostPerPerson(e.target.value)}
                    fullWidth
                    inputProps={{ min: 0 }}
                  />
                </Tooltip>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Total Harvest Cost"
                  value={(Number(harvestWorkerCount) * Number(harvestWorkerCostPerPerson)).toFixed(0)}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Divider style={{ margin: '16px 0' }} />
            </Collapse>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Paid To</InputLabel>
                <Select
                  value={paidTo}
                  onChange={handlePaidToChange}
                  input={<OutlinedInput label="Paid To" />}
                >
                  {contacts.map(contact => (
                    <MenuItem key={contact.ID} value={contact.name}>
                      {contact.name}
                    </MenuItem>
                  ))}
                  <MenuItem value="Others">Others</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {isOtherFarmer && (
              <>
                <Grid item xs={12}>
                  <TextField
                    label="Paid To Name"
                    value={customPaidTo}
                    onChange={e => setCustomPaidTo(e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Address"
                    value={customFarmerAddress}
                    onChange={e => setCustomFarmerAddress(e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Bank Account"
                    value={customBankAccount}
                    onChange={e => setCustomBankAccount(e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Bank Name"
                    value={customBankName}
                    onChange={e => setCustomBankName(e.target.value)}
                    fullWidth
                  />
                </Grid>
              </>
            )}
            {!isOtherFarmer && selectedFarmerDetails && (
              <>
                <Grid item xs={12}>
                  <TextField
                    label="ID"
                    value={selectedFarmerDetails.farmerID || ''}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Address"
                    value={selectedFarmerDetails.farmerAddress || 'N/A'}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Bank Account"
                    value={selectedFarmerDetails.bankAccount || ''}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Bank Name"
                    value={selectedFarmerDetails.bankName || ''}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              </>
            )}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  input={<OutlinedInput label="Payment Method" />}
                >
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="bank transfer">Bank Transfer</MenuItem>
                  <MenuItem value="check">Check</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary">
                Submit
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
}
