"use client"

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
      const res = await axios.get("https://processing-facility-backend.onrender.com/api/postproqc");
      setQcData(res.data);
    } catch (error) {
      console.error("Error fetching QC data:", error);
    }
  };

  const handleBatchNumberSearch = async () => {
    try {
      const res = await axios.get(`https://processing-facility-backend.onrender.com/api/postprocessing/${batchNumber}`);
      
      // Since response is an array, take the first item
      if (res.data.length > 0) {
        setBatchData(res.data[0]); 
      } else {
        setBatchData(null);
        setSnackbar({ open: true, message: "Batch not found!", severity: "error" });
      }
    } catch (error) {
      console.error("Batch not found:", error);
      setBatchData(null);
      setSnackbar({ open: true, message: "Batch not found!", severity: "error" });
    }
  };


  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("https://processing-facility-backend.onrender.com/api/postproqc", { batchNumber, ...formData });
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
                    <TextField label="Stored Date" value={new Date(batchData.storedDate).toLocaleDateString()} InputProps={{ readOnly: true }} fullWidth />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField label="Processing Type" value={batchData.processingType} InputProps={{ readOnly: true }} fullWidth />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField label="Total Weight (kg)" value={batchData.weight} InputProps={{ readOnly: true }} fullWidth />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField label="Total Bags" value={batchData.totalBags} InputProps={{ readOnly: true }} fullWidth />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField label="Quality" value={batchData.quality} InputProps={{ readOnly: true }} fullWidth />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField label="Producer" value={batchData.producer} InputProps={{ readOnly: true }} fullWidth />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField label="Product Line" value={batchData.productLine} InputProps={{ readOnly: true }} fullWidth />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Notes"
                      value={batchData.notes}
                      InputProps={{ readOnly: true }}
                      fullWidth
                      multiline
                      rows={2}
                    />
                  </Grid>
                </Grid>
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

            <Grid item xs={4}>
              <FormControl sx={{ mt: 2 }}>
                <InputLabel>Serangga Hidup</InputLabel>
                <Select name="seranggaHidup" value={formData.seranggaHidup} onChange={handleFormChange} input={<OutlinedInput label="Serangga Hidup" />}>
                  <MenuItem value={false}>No</MenuItem>
                  <MenuItem value={true}>Yes</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={4}>
              <FormControl sx={{ mt: 2 }}>
                <InputLabel>Biji Berbau Busuk</InputLabel>
                <Select name="bijiBauBusuk" value={formData.bijiBauBusuk} onChange={handleFormChange} input={<OutlinedInput label="Biji Berbau Busuk" />}>
                  <MenuItem value={false}>No</MenuItem>
                  <MenuItem value={true}>Yes</MenuItem>
                </Select>
              </FormControl>
            </Grid>

              <Grid item xs={4}>
                <TextField
                    name="kelembapan"
                    label="Kelembapan (%)"
                    type="number"
                    value={formData.kelembapan}
                    onChange={handleFormChange}
                    sx={{ mt: 2 }}
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                name="bijiHitam"
                label="Biji Hitam"
                type="number"
                value={formData.bijiHitam}
                onChange={handleFormChange}
                sx={{ mt: 2 }}
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                name="bijiHitamSebagian"
                label="Biji Hitam Sebagian"
                type="number"
                value={formData.bijiHitamSebagian}
                onChange={handleFormChange}
                sx={{ mt: 2 }}
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                name="bijiHitamPecah"
                label="Biji Hitam Pecah"
                type="number"
                value={formData.bijiHitamPecah}
                onChange={handleFormChange}
                sx={{ mt: 2 }}
                fullWidth
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                name="kopiGelondong"
                label="Kopi Gelondong"
                type="number"
                value={formData.kopiGelondong}
                onChange={handleFormChange}
                sx={{ mt: 2 }}
                fullWidth
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                name="bijiCoklat"
                label="Biji Coklat"
                type="number"
                value={formData.bijiCoklat}
                onChange={handleFormChange}
                sx={{ mt: 2 }}
                fullWidth
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                name="kulitKopiBesar"
                label="Kulit Kopi Besar"
                type="number"
                value={formData.kulitKopiBesar}
                onChange={handleFormChange}
                sx={{ mt: 2 }}
                fullWidth
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                name="kulitKopiSedang"
                label="Kulit Kopi Sedang"
                type="number"
                value={formData.kulitKopiSedang}
                onChange={handleFormChange}
                sx={{ mt: 2 }}
                fullWidth
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                name="kulitKopiKecil"
                label="Kulit Kopi Kecil"
                type="number"
                value={formData.kulitKopiKecil}
                onChange={handleFormChange}
                sx={{ mt: 2 }}
                fullWidth
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                name="bijiBerkulitTanduk"
                label="Biji Berkulit Tanduk"
                type="number"
                value={formData.bijiBerKulitTanduk}
                onChange={handleFormChange}
                sx={{ mt: 2 }}
                fullWidth
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                name="kulitTandukBesar"
                label="Kulit Tanduk Besar"
                type="number"
                value={formData.kulitTandukBesar}
                onChange={handleFormChange}
                sx={{ mt: 2 }}
                fullWidth
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                name="kulitTandukSedang"
                label="Kulit Tanduk Sedang"
                type="number"
                value={formData.kulitTandukSedang}
                onChange={handleFormChange}
                sx={{ mt: 2 }}
                fullWidth
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                name="kulitTandukKecil"
                label="Kulit Tanduk Kecil"
                type="number"
                value={formData.kulitTandukKecil}
                onChange={handleFormChange}
                sx={{ mt: 2 }}
                fullWidth
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                name="bijiPecah"
                label="Biji Pecah"
                type="number"
                value={formData.bijiPecah}
                onChange={handleFormChange}
                sx={{ mt: 2 }}
                fullWidth
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                name="bijiMuda"
                label="Biji Muda"
                type="number"
                value={formData.bijiMuda}
                onChange={handleFormChange}
                sx={{ mt: 2 }}
                fullWidth
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                name="bijiBerlubangSatu"
                label="Biji Berlubang Satu"
                type="number"
                value={formData.bijiBerlubangSatu}
                onChange={handleFormChange}
                sx={{ mt: 2 }}
                fullWidth
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                name="bijiBerlubangLebihSatu"
                label="Biji Berlubang Lebih dari Satu"
                type="number"
                value={formData.bijiBerlubangLebihSatu}
                onChange={handleFormChange}
                sx={{ mt: 2 }}
                fullWidth
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                name="bijiBertutul"
                label="Biji Bertutul"
                type="number"
                value={formData.bijiBertutul}
                onChange={handleFormChange}
                sx={{ mt: 2 }}
                fullWidth
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                name="rantingBesar"
                label="Ranting Besar"
                type="number"
                value={formData.rantingBesar}
                onChange={handleFormChange}
                sx={{ mt: 2 }}
                fullWidth
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                name="rantingSedang"
                label="Ranting Sedang"
                type="number"
                value={formData.rantingSedang}
                onChange={handleFormChange}
                sx={{ mt: 2 }}
                fullWidth
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                name="rantingKecil"
                label="Ranting Kecil"
                type="number"
                value={formData.rantingKecil}
                onChange={handleFormChange}
                sx={{ mt: 2 }}
                fullWidth
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                name="totalBobotKotoran"
                label="Total Bobot Kotoran (g)"
                type="number"
                value={formData.totalBobotKotoran}
                onChange={handleFormChange}
                sx={{ mt: 2 }}
                fullWidth
                />
              </Grid>

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