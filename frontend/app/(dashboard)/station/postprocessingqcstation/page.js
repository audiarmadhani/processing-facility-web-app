import React, { useState, useEffect, useRef } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Divider,
  Snackbar,
  Alert,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import axios from "axios";

const PostProcessingQCPage = () => {
  const [batchNumber, setBatchNumber] = useState("");
  const [batchData, setBatchData] = useState(null);
  const [qcData, setQcData] = useState([]);
  const [formData, setFormData] = useState({
    seranggaHidup: false,
    bijiBauBusuk: false,
    kelembapan: "",
    bijiHitam: "",
    bijiHitamSebagian: "",
    bijiHitamPecah: "",
    kopiGelondong: "",
    bijiCoklat: "",
    kulitKopiBesar: "",
    kulitKopiSedang: "",
    kulitKopiKecil: "",
    bijiBerKulitTanduk: "",
    kulitTandukBesar: "",
    kulitTandukSedang: "",
    kulitTandukKecil: "",
    bijiPecah: "",
    bijiMuda: "",
    bijiBerlubangSatu: "",
    bijiBerlubangLebihSatu: "",
    bijiBertutul: "",
    rantingBesar: "",
    rantingSedang: "",
    rantingKecil: "",
    totalBobotKotoran: "",
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchQCData();
  }, []);

  const fetchQCData = async () => {
    try {
      const res = await axios.get("/api/postproqc");
      setQcData(res.data);
    } catch (error) {
      console.error("Error fetching QC data:", error);
    }
  };

  const handleBatchNumberSearch = async () => {
    try {
      const res = await axios.get(`/api/postprocessing/${batchNumber}`);
      setBatchData(res.data);
    } catch (error) {
      console.error("Batch not found:", error);
      setBatchData(null);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/postproqc", { batchNumber, ...formData });
      setSnackbar({ open: true, message: "QC Data Saved!", severity: "success" });
      fetchQCData();
    } catch (error) {
      console.error("Error submitting QC data:", error);
      setSnackbar({ open: true, message: "Failed to Save!", severity: "error" });
    }
  };

  const qcColumns = [
    { field: "batchNumber", headerName: "Batch Number", width: 150 },
    { field: "seranggaHidup", headerName: "Serangga Hidup", width: 150 },
    { field: "bijiBauBusuk", headerName: "Biji Bau Busuk", width: 150 },
    { field: "kelembapan", headerName: "Kelembapan", width: 130 },
    { field: "bijiHitam", headerName: "Biji Hitam", width: 130 },
    { field: "bijiHitamSebagian", headerName: "Biji Hitam Sebagian", width: 160 },
    { field: "bijiHitamPecah", headerName: "Biji Hitam Pecah", width: 160 },
  ];

  return (
    <Grid container spacing={3}>
      {/* Batch Search Section (5u width) */}
      <Grid item xs={12} md={5}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
              Batch Search
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={8}>
                <TextField
                  label="Batch Number"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  fullWidth
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={4}>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleBatchNumberSearch}
                  style={{ marginTop: "24px" }}
                >
                  Search
                </Button>
              </Grid>
            </Grid>
            {batchData && (
              <>
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={6}>
                    <TextField label="Reference Number" value={batchData.referenceNumber} InputProps={{ readOnly: true }} fullWidth />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField label="Stored Date" value={batchData.storedDate} InputProps={{ readOnly: true }} fullWidth />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField label="Process" value={batchData.process} InputProps={{ readOnly: true }} fullWidth />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField label="Total Weight" value={batchData.totalWeight} InputProps={{ readOnly: true }} fullWidth />
                  </Grid>
                </Grid>
                <Divider style={{ margin: "16px 0" }} />
              </>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* QC Input Form (7u width) */}
      <Grid item xs={12} md={7}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              QC Input Form
            </Typography>
            <form onSubmit={handleSubmit}>

              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Serangga Hidup</InputLabel>
                <Select name="seranggaHidup" value={formData.seranggaHidup} onChange={handleFormChange}>
                  <MenuItem value={false}>No</MenuItem>
                  <MenuItem value={true}>Yes</MenuItem>
                </Select>
              </FormControl>

              <TextField
                name="kelembapan"
                label="Kelembapan (%)"
                type="number"
                value={formData.kelembapan}
                onChange={handleFormChange}
                fullWidth
                sx={{ mt: 2 }}
              />

              <TextField
                name="bijiHitam"
                label="Biji Hitam"
                type="number"
                value={formData.bijiHitam}
                onChange={handleFormChange}
                fullWidth
                sx={{ mt: 2 }}
              />

              <TextField
                name="totalBobotKotoran"
                label="Total Bobot Kotoran (g)"
                type="number"
                value={formData.totalBobotKotoran}
                onChange={handleFormChange}
                fullWidth
                sx={{ mt: 2 }}
              />

              <Button type="submit" variant="contained" color="primary" sx={{ mt: 3 }}>
                Submit QC Data
              </Button>
              
            </form>
          </CardContent>
        </Card>
      </Grid>

      {/* QC Data Table */}
      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              QC Data
            </Typography>
            <div style={{ height: 600, width: "100%" }}>
              <DataGrid rows={qcData.map((row, index) => ({ id: index + 1, ...row }))} columns={qcColumns} pageSize={5} slots={{ toolbar: GridToolbar }} />
            </div>
          </CardContent>
        </Card>
      </Grid>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Grid>
  );
};

export default PostProcessingQCPage;