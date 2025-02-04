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
                <Grid container spacing={2}> {/* Container for 3-column grid */}

                {/* Dropdown Fields */}
                <Grid item xs={4}>
                    <FormControl fullWidth>
                    <InputLabel>Serangga Hidup</InputLabel>
                    <Select name="seranggaHidup" value={formData.seranggaHidup} onChange={handleFormChange} input={<OutlinedInput label="Serangga Hidup" />}>
                        <MenuItem value={false}>No</MenuItem>
                        <MenuItem value={true}>Yes</MenuItem>
                    </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={4}>
                    <FormControl fullWidth>
                    <InputLabel>Biji Berbau Busuk</InputLabel>
                    <Select name="bijiBauBusuk" value={formData.bijiBauBusuk} onChange={handleFormChange} input={<OutlinedInput label="Biji Berbau Busuk" />}>
                        <MenuItem value={false}>No</MenuItem>
                        <MenuItem value={true}>Yes</MenuItem>
                    </Select>
                    </FormControl>
                </Grid>

                {/* Numeric Input Fields */}
                {[
                    { name: "kelembapan", label: "Kelembapan (%)" },
                    { name: "bijiHitam", label: "Biji Hitam" },
                    { name: "bijiHitamSebagian", label: "Biji Hitam Sebagian" },
                    { name: "bijiHitamPecah", label: "Biji Hitam Pecah" },
                    { name: "kopiGelondong", label: "Kopi Gelondong" },
                    { name: "bijiCoklat", label: "Biji Coklat" },
                    { name: "kulitKopiBesar", label: "Kulit Kopi Besar" },
                    { name: "kulitKopiSedang", label: "Kulit Kopi Sedang" },
                    { name: "kulitKopiKecil", label: "Kulit Kopi Kecil" },
                    { name: "bijiBerkulitTanduk", label: "Biji Berkulit Tanduk" },
                    { name: "kulitTandukBesar", label: "Kulit Tanduk Besar" },
                    { name: "kulitTandukSedang", label: "Kulit Tanduk Sedang" },
                    { name: "kulitTandukKecil", label: "Kulit Tanduk Kecil" },
                    { name: "bijiPecah", label: "Biji Pecah" },
                    { name: "bijiMuda", label: "Biji Muda" },
                    { name: "bijiBerlubangSatu", label: "Biji Berlubang Satu" },
                    { name: "bijiBerlubangLebihSatu", label: "Biji Berlubang Lebih dari Satu" },
                    { name: "bijiBertutul", label: "Biji Bertutul" },
                    { name: "rantingBesar", label: "Ranting Besar" },
                    { name: "rantingSedang", label: "Ranting Sedang" },
                    { name: "rantingKecil", label: "Ranting Kecil" },
                    { name: "totalBobotKotoran", label: "Total Bobot Kotoran (g)" },
                ].map((field) => (
                    <Grid item xs={4} key={field.name}>
                    <TextField
                        name={field.name}
                        label={field.label}
                        type="number"
                        value={formData[field.name]}
                        onChange={handleFormChange}
                        fullWidth
                    />
                    </Grid>
                ))}

                {/* Submit Button */}
                <Grid item xs={12}>
                    <Button type="submit" variant="contained" color="primary">
                    Submit QC Data
                    </Button>
                </Grid>

                </Grid>
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