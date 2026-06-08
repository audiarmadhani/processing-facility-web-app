'use client';

import {
  Grid,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const DEFECT_FIELDS = [
  { name: 'bijiHitam', label: 'Biji Hitam', placeholder: 'Enter count of black beans' },
  { name: 'bijiHitamSebagian', label: 'Biji Hitam Sebagian', placeholder: 'Enter count of partially black beans' },
  { name: 'bijiHitamPecah', label: 'Biji Hitam Pecah', placeholder: 'Enter count of broken black beans' },
  { name: 'kopiGelondong', label: 'Kopi Gelondong', placeholder: 'Enter count of unprocessed beans' },
  { name: 'bijiCoklat', label: 'Biji Coklat', placeholder: 'Enter count of brown beans' },
  { name: 'bijiBerKulitTanduk', label: 'Biji Berkulit Tanduk', placeholder: 'Enter count of horn-skinned beans' },
  { name: 'bijiPecah', label: 'Biji Pecah', placeholder: 'Enter count of broken beans' },
  { name: 'bijiMuda', label: 'Biji Muda', placeholder: 'Enter count of immature beans' },
  { name: 'bijiBerlubangSatu', label: 'Biji Berlubang Satu', placeholder: 'Enter count of beans with one hole' },
  {
    name: 'bijiBerlubangLebihSatu',
    label: 'Biji Berlubang Lebih dari Satu',
    placeholder: 'Enter count of beans with multiple holes',
  },
  { name: 'bijiBertutul', label: 'Biji Bertutul', placeholder: 'Enter count of spotted beans' },
];

const FOREIGN_MATTER_FIELDS = [
  { name: 'kulitKopiBesar', label: 'Kulit Kopi Besar', placeholder: 'Enter count of large coffee husks' },
  { name: 'kulitKopiSedang', label: 'Kulit Kopi Sedang', placeholder: 'Enter count of medium coffee husks' },
  { name: 'kulitKopiKecil', label: 'Kulit Kopi Kecil', placeholder: 'Enter count of small coffee husks' },
  { name: 'kulitTandukBesar', label: 'Kulit Tanduk Besar', placeholder: 'Enter count of large horn husks' },
  { name: 'kulitTandukSedang', label: 'Kulit Tanduk Sedang', placeholder: 'Enter count of medium horn husks' },
  { name: 'kulitTandukKecil', label: 'Kulit Tanduk Kecil', placeholder: 'Enter count of small horn husks' },
  { name: 'rantingBesar', label: 'Ranting Besar', placeholder: 'Enter count of large twigs' },
  { name: 'rantingSedang', label: 'Ranting Sedang', placeholder: 'Enter count of medium twigs' },
  { name: 'rantingKecil', label: 'Ranting Kecil', placeholder: 'Enter count of small twigs' },
  {
    name: 'totalBobotKotoran',
    label: 'Total Bobot Kotoran (g)',
    placeholder: 'Enter total weight of debris in grams',
  },
];

export default function GbQcDialog({
  open,
  selectedBatch,
  formData,
  onFormChange,
  onClose,
  onOpenCamera,
  onSave,
  onComplete,
  isFormComplete,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>GB QC — Batch {selectedBatch?.batchNumber}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          Enter defect and triage parameters. Complete requires at least one saved cupping session.
        </Typography>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <TextField
              label="Stored Date"
              value={selectedBatch ? new Date(selectedBatch.storedDate).toLocaleDateString() : ''}
              InputProps={{ readOnly: true }}
              fullWidth
              disabled
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Producer"
              value={selectedBatch ? selectedBatch.producer : ''}
              InputProps={{ readOnly: true }}
              fullWidth
              disabled
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Processing Type"
              value={selectedBatch ? selectedBatch.processingType : ''}
              InputProps={{ readOnly: true }}
              fullWidth
              disabled
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Product Line"
              value={selectedBatch ? selectedBatch.productLine : ''}
              InputProps={{ readOnly: true }}
              fullWidth
              disabled
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Total Bags"
              value={selectedBatch ? selectedBatch.totalBags : ''}
              InputProps={{ readOnly: true }}
              fullWidth
              disabled
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Total Weight (kg)"
              value={selectedBatch ? selectedBatch.weight : ''}
              InputProps={{ readOnly: true }}
              fullWidth
              disabled
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Quality"
              value={selectedBatch ? selectedBatch.quality : ''}
              InputProps={{ readOnly: true }}
              fullWidth
              disabled
            />
          </Grid>
        </Grid>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Defects</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <FormControl fullWidth>
                  <InputLabel>Biji Berbau Busuk</InputLabel>
                  <Select
                    name="bijiBauBusuk"
                    value={formData.bijiBauBusuk === null ? '' : formData.bijiBauBusuk.toString()}
                    onChange={onFormChange}
                    input={<OutlinedInput label="Biji Berbau Busuk" />}
                  >
                    <MenuItem value="" disabled>
                      Select Yes/No
                    </MenuItem>
                    <MenuItem value="false">No</MenuItem>
                    <MenuItem value="true">Yes</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {DEFECT_FIELDS.map((field) => (
                <Grid item xs={4} key={field.name}>
                  <TextField
                    name={field.name}
                    label={field.label}
                    type="number"
                    value={formData[field.name]}
                    onChange={onFormChange}
                    fullWidth
                    inputProps={{ min: 0 }}
                    InputProps={{ placeholder: field.placeholder }}
                  />
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Foreign Matter</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <FormControl fullWidth>
                  <InputLabel>Serangga Hidup</InputLabel>
                  <Select
                    name="seranggaHidup"
                    value={formData.seranggaHidup === null ? '' : formData.seranggaHidup.toString()}
                    onChange={onFormChange}
                    input={<OutlinedInput label="Serangga Hidup" />}
                  >
                    <MenuItem value="" disabled>
                      Select Yes/No
                    </MenuItem>
                    <MenuItem value="false">No</MenuItem>
                    <MenuItem value="true">Yes</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {FOREIGN_MATTER_FIELDS.map((field) => (
                <Grid item xs={4} key={field.name}>
                  <TextField
                    name={field.name}
                    label={field.label}
                    type="number"
                    value={formData[field.name]}
                    onChange={onFormChange}
                    fullWidth
                    inputProps={{ min: 0 }}
                    InputProps={{ placeholder: field.placeholder }}
                  />
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Triage Decision</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid item xs={4}>
              <TextField
                name="triage"
                label="Triage"
                type="number"
                value={formData.triage}
                onChange={onFormChange}
                fullWidth
              />
            </Grid>
          </AccordionDetails>
        </Accordion>
      </DialogContent>

      <DialogActions>
        <Button onClick={onOpenCamera}>Capture Image</Button>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="primary" onClick={() => onSave(false)}>
          Save
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => onComplete(true)}
          disabled={!isFormComplete()}
        >
          Complete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
