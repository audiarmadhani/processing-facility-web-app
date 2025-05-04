"use client"

import React, { useState, useEffect } from "react";
import {
  Grid,
  Card,
  CardContent,
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
  Snackbar,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useSession } from "next-auth/react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const PostProcessingQCPage = () => {
  const { data: session, status } = useSession();
  const [notQcedBatches, setNotQcedBatches] = useState([]);
  const [completedQCBatches, setCompletedQCBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [formData, setFormData] = useState({
    seranggaHidup: false,
    bijiBauBusuk: false,
    kelembapan: 0,
    bijiHitam: 0,
    bijiHitamSebagian: 0,
    bijiHitamPecah: 0,
    kopiGelondong: 0,
    bijiCoklat: 0,
    kulitKopiBesar: 0,
    kulitKopiSedang: 0,
    kulitKopiKecil: 0,
    bijiBerKulitTanduk: 0,
    kulitTandukBesar: 0,
    kulitTandukSedang: 0,
    kulitTandukKecil: 0,
    bijiPecah: 0,
    bijiMuda: 0,
    bijiBerlubangSatu: 0,
    bijiBerlubangLebihSatu: 0,
    bijiBertutul: 0,
    rantingBesar: 0,
    rantingSedang: 0,
    rantingKecil: 0,
    totalBobotKotoran: 0,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [notQcedRes, completedQCRes] = await Promise.all([
        axios.get("https://processing-facility-backend.onrender.com/api/postprocessing/not-qced"),
        axios.get("https://processing-facility-backend.onrender.com/api/postproqcfin"),
      ]);
      setNotQcedBatches(notQcedRes.data);
      setCompletedQCBatches(completedQCRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setSnackbar({ open: true, message: "Failed to fetch data!", severity: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartQC = async (batch) => {
    setSelectedBatch(batch);
    try {
      const res = await axios.get(`https://processing-facility-backend.onrender.com/api/postproqc/${batch.batchNumber}`);
      if (res.data) {
        setFormData(res.data);
      } else {
        setFormData({
          seranggaHidup: false,
          bijiBauBusuk: false,
          kelembapan: 0,
          bijiHitam: 0,
          bijiHitamSebagian: 0,
          bijiHitamPecah: 0,
          kopiGelondong: 0,
          bijiCoklat: 0,
          kulitKopiBesar: 0,
          kulitKopiSedang: 0,
          kulitKopiKecil: 0,
          bijiBerKulitTanduk: 0,
          kulitTandukBesar: 0,
          kulitTandukSedang: 0,
          kulitTandukKecil: 0,
          bijiPecah: 0,
          bijiMuda: 0,
          bijiBerlubangSatu: 0,
          bijiBerlubangLebihSatu: 0,
          bijiBertutul: 0,
          rantingBesar: 0,
          rantingSedang: 0,
          rantingKecil: 0,
          totalBobotKotoran: 0,
        });
      }
      setOpenDialog(true);
    } catch (error) {
      console.error("Error fetching QC data for batch:", error);
      setSnackbar({ open: true, message: "Failed to load QC data!", severity: "error" });
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBatch(null);
    setFormData({
      seranggaHidup: false,
      bijiBauBusuk: false,
      kelembapan: 0,
      bijiHitam: 0,
      bijiHitamSebagian: 0,
      bijiHitamPecah: 0,
      kopiGelondong: 0,
      bijiCoklat: 0,
      kulitKopiBesar: 0,
      kulitKopiSedang: 0,
      kulitKopiKecil: 0,
      bijiBerKulitTanduk: 0,
      kulitTandukBesar: 0,
      kulitTandukSedang: 0,
      kulitTandukKecil: 0,
      bijiPecah: 0,
      bijiMuda: 0,
      bijiBerlubangSatu: 0,
      bijiBerlubangLebihSatu: 0,
      bijiBertutul: 0,
      rantingBesar: 0,
      rantingSedang: 0,
      rantingKecil: 0,
      totalBobotKotoran: 0,
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    // Handle boolean fields (dropdowns) separately
    if (name === "seranggaHidup" || name === "bijiBauBusuk") {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value === "true", // Convert string "true"/"false" to boolean
      }));
    } else {
      // Handle numeric fields
      const numericValue = value === "" ? 0 : parseFloat(value);
      setFormData((prevData) => ({
        ...prevData,
        [name]: numericValue,
      }));
    }
  };

  const isFormComplete = () => {
    return (
      formData.kelembapan !== 0 &&
      formData.bijiHitam !== 0 &&
      formData.bijiHitamSebagian !== 0 &&
      formData.bijiHitamPecah !== 0 &&
      formData.kopiGelondong !== 0 &&
      formData.bijiCoklat !== 0 &&
      formData.kulitKopiBesar !== 0 &&
      formData.kulitKopiSedang !== 0 &&
      formData.kulitKopiKecil !== 0 &&
      formData.bijiBerKulitTanduk !== 0 &&
      formData.kulitTandukBesar !== 0 &&
      formData.kulitTandukSedang !== 0 &&
      formData.kulitTandukKecil !== 0 &&
      formData.bijiPecah !== 0 &&
      formData.bijiMuda !== 0 &&
      formData.bijiBerlubangSatu !== 0 &&
      formData.bijiBerlubangLebihSatu !== 0 &&
      formData.bijiBertutul !== 0 &&
      formData.rantingBesar !== 0 &&
      formData.rantingSedang !== 0 &&
      formData.rantingKecil !== 0 &&
      formData.totalBobotKotoran !== 0
    );
  };

  const handleSaveQC = async (isCompleted) => {
    try {
      await axios.post("https://processing-facility-backend.onrender.com/api/postproqc", {
        batchNumber: selectedBatch.batchNumber,
        ...formData,
        isCompleted,
      });
      setSnackbar({
        open: true,
        message: isCompleted ? "QC completed successfully!" : "QC data saved successfully!",
        severity: "success",
      });
      fetchData();
      if (isCompleted) {
        handleCloseDialog();
      }
    } catch (error) {
      console.error("Error saving QC data:", error);
      setSnackbar({ open: true, message: "Failed to save QC data!", severity: "error" });
    }
  };

  const handleExportToPDF = (row) => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    const title = "Quality Control Report";
    const titleWidth = doc.getStringUnitWidth(title) * doc.internal.getFontSize() / doc.internal.scaleFactor;
    const titleX = (doc.internal.pageSize.getWidth() - titleWidth) / 2;
    doc.text(title, titleX, 20);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Lot Number        : ${row.batchNumber}`, 14, 35);
    doc.text(`Reference Number  : ${row.referenceNumber}`, 14, 42);

    const columnHeaders = [
      { field: "batchNumber", headerName: "Lot Number" },
      { field: "referenceNumber", headerName: "Reference Number" },
      { field: "generalQuality", headerName: "General Quality" },
      { field: "actualGrade", headerName: "Actual Grade" },
      { field: "kelembapan", headerName: "Kelembapan (%)" },
      { field: "defectScore", headerName: "Defect Score" },
      { field: "defectWeightPercentage", headerName: "Defect Weight (%)" },
      { field: "bijiHitam", headerName: "Biji Hitam" },
      { field: "bijiHitamSebagian", headerName: "Biji Hitam Sebagian" },
      { field: "bijiPecah", headerName: "Biji Pecah" },
      { field: "kopiGelondong", headerName: "Kopi Gelondong" },
      { field: "bijiCoklat", headerName: "Biji Coklat" },
      { field: "kulitKopiBesar", headerName: "Kulit Kopi Besar" },
      { field: "kulitKopiSedang", headerName: "Kulit Kopi Sedang" },
      { field: "kulitKopiKecil", headerName: "Kulit Kopi Kecil" },
      { field: "bijiBerKulitTanduk", headerName: "Biji Berkulit Tanduk" },
      { field: "kulitTandukBesar", headerName: "Kulit Tanduk Besar" },
      { field: "kulitTandukSedang", headerName: "Kulit Tanduk Sedang" },
      { field: "kulitTandukKecil", headerName: "Kulit Tanduk Kecil" },
      { field: "bijiMuda", headerName: "Biji Muda" },
      { field: "bijiBerlubangSatu", headerName: "Biji Berlubang Satu" },
      { field: "bijiBerlubangLebihSatu", headerName: "Biji Berlubang >1" },
      { field: "bijiBertutul", headerName: "Biji Bertutul" },
      { field: "rantingBesar", headerName: "Ranting Besar" },
      { field: "rantingSedang", headerName: "Ranting Sedang" },
      { field: "rantingKecil", headerName: "Ranting Kecil" },
    ];

    const tableRows = columnHeaders.map((col) => [
      col.headerName,
      row[col.field] !== undefined ? row[col.field] : "-",
    ]);

    doc.autoTable({
      startY: 50,
      head: [["Quality Parameter", "Value"]],
      body: tableRows,
      theme: "grid",
      styles: { font: "helvetica", fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      margin: { top: 20 },
    });

    function formatDate(date) {
      const options = { day: '2-digit', month: 'short', year: 'numeric' };
      return new Intl.DateTimeFormat('en-US', options).format(date).replace(/,/, '').replace(/\s+/g, '-');
    }

    const userName = session?.user?.name || 'User';
    const printedText = `Printed on: ${formatDate(new Date())} by: ${userName}`;
    const printedTextWidth = doc.getStringUnitWidth(printedText) * doc.internal.getFontSize() / doc.internal.scaleFactor;
    const printedTextX = (doc.internal.pageSize.getWidth() - printedTextWidth) / 2;
    doc.text(printedText, printedTextX, doc.internal.pageSize.getHeight() - 5);

    doc.save(`QC_Report_${row.batchNumber}.pdf`);
  };

  const notQcedColumns = [
    { field: "batchNumber", headerName: "Lot Number", width: 150 },
    { field: "referenceNumber", headerName: "Reference Number", width: 150 },
    { field: "storedDate", headerName: "Stored Date", width: 150 },
    { field: "processingType", headerName: "Processing Type", width: 180 },
    { field: "productLine", headerName: "Product Line", width: 150 },
    { field: "producer", headerName: "Producer", width: 130 },
    { field: "type", headerName: "Type", width: 130 },
    { field: "quality", headerName: "Quality", width: 130 },
    { field: "weight", headerName: "Total Weight (kg)", width: 150 },
    { field: "totalBags", headerName: "Total Bags", width: 130 },
    { field: "notes", headerName: "Notes", width: 180 },
    {
      field: "action",
      headerName: "Action",
      width: 130,
      renderCell: (params) => (
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() => handleStartQC(params.row)}
        >
          Start QC
        </Button>
      ),
    },
  ];

  const completedQCColumns = [
    {
      field: "export",
      headerName: "Export Data",
      width: 130,
      renderCell: (params) => (
        <button
          onClick={() => handleExportToPDF(params.row)}
          style={{
            padding: "6px 12px",
            backgroundColor: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Export PDF
        </button>
      ),
    },
    { field: "batchNumber", headerName: "Lot Number", width: 150 },
    { field: "referenceNumber", headerName: "Reference Number", width: 150 },
    { field: "storedDate", headerName: "Stored Date", width: 150 },
    { field: "qcDate", headerName: "QC Date", width: 150 },
    { field: "generalQuality", headerName: "General Quality", width: 180 },
    { field: "actualGrade", headerName: "Actual Grade", width: 150 },
    { field: "kelembapan", headerName: "Kelembapan (%)", width: 130 },
    { field: "seranggaHidup", headerName: "Serangga Hidup", width: 150 },
    { field: "bijiBauBusuk", headerName: "Biji Bau Busuk", width: 150 },
    { field: "defectScore", headerName: "Defect Score", width: 140 },
    { field: "totalBobotKotoran", headerName: "Total Bobot Kotoran", width: 180 },
    { field: "defectWeightPercentage", headerName: "Defect Weight (%)", width: 180 },
    { field: "bijiHitam", headerName: "Biji Hitam", width: 130 },
    { field: "bijiHitamSebagian", headerName: "Biji Hitam Sebagian", width: 160 },
    { field: "bijiPecah", headerName: "Biji Pecah", width: 130 },
    { field: "kopiGelondong", headerName: "Kopi Gelondong", width: 150 },
    { field: "bijiCoklat", headerName: "Biji Coklat", width: 130 },
    { field: "kulitKopiBesar", headerName: "Kulit Kopi Besar", width: 150 },
    { field: "kulitKopiSedang", headerName: "Kulit Kopi Sedang", width: 150 },
    { field: "kulitKopiKecil", headerName: "Kulit Kopi Kecil", width: 150 },
    { field: "bijiBerKulitTanduk", headerName: "Biji Berkulit Tanduk", width: 180 },
    { field: "kulitTandukBesar", headerName: "Kulit Tanduk Besar", width: 160 },
    { field: "kulitTandukSedang", headerName: "Kulit Tanduk Sedang", width: 160 },
    { field: "kulitTandukKecil", headerName: "Kulit Tanduk Kecil", width: 160 },
    { field: "bijiMuda", headerName: "Biji Muda", width: 130 },
    { field: "bijiBerlubangSatu", headerName: "Biji Berlubang Satu", width: 170 },
    { field: "bijiBerlubangLebihSatu", headerName: "Biji Berlubang >1", width: 180 },
    { field: "bijiBertutul", headerName: "Biji Bertutul", width: 140 },
    { field: "rantingBesar", headerName: "Ranting Besar", width: 150 },
    { field: "rantingSedang", headerName: "Ranting Sedang", width: 150 },
    { field: "rantingKecil", headerName: "Ranting Kecil", width: 150 },
  ];

  if (status === "loading") return <Typography>Loading...</Typography>;

  if (!session?.user || !["admin", "manager", "postprocessing"].includes(session.user.role))
    return <Typography variant="h6">Access Denied. You do not have permission to view this page.</Typography>;

  return (
    <Grid container spacing={3}>
      {/* Not Yet QCed Batches Table */}
      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Green Bean Batches Not Yet QCed
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              onClick={fetchData}
              disabled={isLoading}
              sx={{ mb: 2 }}
              startIcon={isLoading ? <CircularProgress size={20} /> : null}
            >
              {isLoading ? "Refreshing..." : "Refresh Data"}
            </Button>
            <div style={{ height: 400, width: "100%" }}>
              <DataGrid
                rows={notQcedBatches.map((row, index) => ({ id: index + 1, ...row }))}
                columns={notQcedColumns}
                initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
                pageSizeOptions={[5, 10, 20]}
                disableRowSelectionOnClick
                getRowId={(row) => row.batchNumber}
                slots={{ toolbar: GridToolbar }}
                rowHeight={35}
              />
            </div>
          </CardContent>
        </Card>
      </Grid>

      {/* Completed QC Batches Table */}
      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Completed QC Batches
            </Typography>
            <div style={{ height: 600, width: "100%" }}>
              <DataGrid
                rows={completedQCBatches.map((row, index) => ({ id: index + 1, ...row }))}
                columns={completedQCColumns}
                initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                pageSizeOptions={[10, 20, 50]}
                disableRowSelectionOnClick
                getRowId={(row) => row.batchNumber}
                slots={{ toolbar: GridToolbar }}
                rowHeight={35}
              />
            </div>
          </CardContent>
        </Card>
      </Grid>

      {/* QC Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>Quality Control - Batch {selectedBatch?.batchNumber}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
            Enter the QC parameters for this batch. All fields must be filled to complete the QC process.
          </Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <TextField
                label="Stored Date"
                value={selectedBatch ? new Date(selectedBatch.storedDate).toLocaleDateString() : ""}
                InputProps={{ readOnly: true }}
                fullWidth
                disabled
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Producer"
                value={selectedBatch ? selectedBatch.producer : ""}
                InputProps={{ readOnly: true }}
                fullWidth
                disabled
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Processing Type"
                value={selectedBatch ? selectedBatch.processingType : ""}
                InputProps={{ readOnly: true }}
                fullWidth
                disabled
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Product Line"
                value={selectedBatch ? selectedBatch.productLine : ""}
                InputProps={{ readOnly: true }}
                fullWidth
                disabled
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Total Bags"
                value={selectedBatch ? selectedBatch.totalBags : ""}
                InputProps={{ readOnly: true }}
                fullWidth
                disabled
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Total Weight (kg)"
                value={selectedBatch ? selectedBatch.weight : ""}
                InputProps={{ readOnly: true }}
                fullWidth
                disabled
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Quality"
                value={selectedBatch ? selectedBatch.quality : ""}
                InputProps={{ readOnly: true }}
                fullWidth
                disabled
              />
            </Grid>
          </Grid>

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Moisture</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <TextField
                    name="kelembapan"
                    label="Kelembapan (%)"
                    type="number"
                    value={formData.kelembapan}
                    onChange={handleFormChange}
                    fullWidth
                    inputProps={{ min: 0, step: 0.1 }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

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
                      value={formData.bijiBauBusuk.toString()} // Convert boolean to string for Select
                      onChange={handleFormChange}
                      input={<OutlinedInput label="Biji Berbau Busuk" />}
                    >
                      <MenuItem value="false">No</MenuItem>
                      <MenuItem value="true">Yes</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {[
                  { name: "bijiHitam", label: "Biji Hitam" },
                  { name: "bijiHitamSebagian", label: "Biji Hitam Sebagian" },
                  { name: "bijiHitamPecah", label: "Biji Hitam Pecah" },
                  { name: "kopiGelondong", label: "Kopi Gelondong" },
                  { name: "bijiCoklat", label: "Biji Coklat" },
                  { name: "bijiBerKulitTanduk", label: "Biji Berkulit Tanduk" },
                  { name: "bijiPecah", label: "Biji Pecah" },
                  { name: "bijiMuda", label: "Biji Muda" },
                  { name: "bijiBerlubangSatu", label: "Biji Berlubang Satu" },
                  { name: "bijiBerlubangLebihSatu", label: "Biji Berlubang Lebih dari Satu" },
                  { name: "bijiBertutul", label: "Biji Bertutul" },
                ].map((field) => (
                  <Grid item xs={4} key={field.name}>
                    <TextField
                      name={field.name}
                      label={field.label}
                      type="number"
                      value={formData[field.name]}
                      onChange={handleFormChange}
                      fullWidth
                      inputProps={{ min: 0 }}
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
                      value={formData.seranggaHidup.toString()} // Convert boolean to string for Select
                      onChange={handleFormChange}
                      input={<OutlinedInput label="Serangga Hidup" />}
                    >
                      <MenuItem value="false">No</MenuItem>
                      <MenuItem value="true">Yes</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {[
                  { name: "kulitKopiBesar", label: "Kulit Kopi Besar" },
                  { name: "kulitKopiSedang", label: "Kulit Kopi Sedang" },
                  { name: "kulitKopiKecil", label: "Kulit Kopi Kecil" },
                  { name: "kulitTandukBesar", label: "Kulit Tanduk Besar" },
                  { name: "kulitTandukSedang", label: "Kulit Tanduk Sedang" },
                  { name: "kulitTandukKecil", label: "Kulit Tanduk Kecil" },
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
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleSaveQC(false)}
          >
            Save
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => handleSaveQC(true)}
            disabled={!isFormComplete()}
          >
            Complete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Grid>
  );
};

export default PostProcessingQCPage;