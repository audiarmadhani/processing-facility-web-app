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
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useSession } from "next-auth/react";

const PostProcessingQCPage = () => {
	const { data: session, status } = useSession();
  const [batchNumber, setBatchNumber] = useState("");
  const [batchData, setBatchData] = useState(null);
  const [qcData, setQcData] = useState([]);
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
    fetchQCData();
  }, []);

  const fetchQCData = async () => {
    try {
      const res = await axios.get("https://processing-facility-backend.onrender.com/api/postproqcfin");
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
  
    // Convert input value to a number (float or integer)
    const numericValue = value === "" ? 0 : parseFloat(value);

    setFormData((prevData) => ({
        ...prevData,
        [name]: numericValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("https://processing-facility-backend.onrender.com/api/postproqc", { batchNumber, ...formData });
  
      setSnackbar({ open: true, message: "QC Data Saved!", severity: "success" });
  
      // Fetch updated QC data
      fetchQCData();
  
      // Reset batch search
      setBatchNumber("");
      setBatchData(null);
  
      // Reset QC input form
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
  
    } catch (error) {
      console.error("Error submitting QC data:", error);
      setSnackbar({ open: true, message: "Failed to Save!", severity: "error" });
    }
  };

  const handleExportToPDF = (row) => {
		const doc = new jsPDF();
	
		// Set header on the left
		doc.setFont("helvetica", "bold");
		doc.setFontSize(12);
		doc.text("PT. Berkas Tuaian Melimpah", 14, 15);
		doc.setFont("helvetica", "normal");
		doc.text("lorem ipsum", 14, 22);
		doc.text("dolor sit amet", 14, 29);
	
		// Set title
		doc.setFont("helvetica", "bold");
		doc.setFontSize(18);
		const title = "Quality Control Report";
		const titleWidth = doc.getStringUnitWidth(title) * doc.internal.getFontSize() / doc.internal.scaleFactor;
		const titleX = (doc.internal.pageSize.getWidth() - titleWidth) / 2; // Center the title
		doc.text(title, titleX, 45); // Adjusted Y position for title
	
		// Add a line break for better spacing
		doc.setFontSize(12);
		doc.setFont("helvetica", "normal");
		doc.text(`Batch Number: ${row.batchNumber}`, 14, 55);
	
		// Table headers mapping (Use headerName instead of field names)
		const columnHeaders = [
			{ field: "batchNumber", headerName: "Batch Number" },
			{ field: "generalQuality", headerName: "General Quality" },
			{ field: "actualGrade", headerName: "Actual Grade" },
			{ field: "kelembapan", headerName: "Kelembapan (%)" },
			{ field: "defectScore", headerName: "Defect Score" },
			{ field: "defectWeightPercentage", headerName: "Defect Weight (%)" },
			{ field: "bijiHitam", headerName: "Biji Hitam" },
			{ field: "bijiHitamSebagian", headerName: "Biji Hitam Sebagian" },
			{ field: "bijiPecah", headerName: "Biji Pecah" },
			{ field: "bijiHitam", headerName: "Biji Hitam"},
			{ field: "bijiHitamSebagian", headerName: "Biji Hitam Sebagian"},
			{ field: "bijiPecah", headerName: "Biji Pecah"},
			{ field: "kopiGelondong", headerName: "Kopi Gelondong"},
			{ field: "bijiCoklat", headerName: "Biji Coklat"},
			{ field: "kulitKopiBesar", headerName: "Kulit Kopi Besar"},
			{ field: "kulitKopiSedang", headerName: "Kulit Kopi Sedang"},
			{ field: "kulitKopiKecil", headerName: "Kulit Kopi Kecil"},
			{ field: "bijiBerKulitTanduk", headerName: "Biji Berkulit Tanduk"},
			{ field: "kulitTandukBesar", headerName: "Kulit Tanduk Besar"},
			{ field: "kulitTandukSedang", headerName: "Kulit Tanduk Sedang"},
			{ field: "kulitTandukKecil", headerName: "Kulit Tanduk Kecil"},
			{ field: "bijiMuda", headerName: "Biji Muda"},
			{ field: "bijiBerlubangSatu", headerName: "Biji Berlubang Satu"},
			{ field: "bijiBerlubangLebihSatu", headerName: "Biji Berlubang >1"},
			{ field: "bijiBertutul", headerName: "Biji Bertutul"},
			{ field: "rantingBesar", headerName: "Ranting Besar"},
			{ field: "rantingSedang", headerName: "Ranting Sedang"},
			{ field: "rantingKecil", headerName: "Ranting Kecil"},
		];
	
		// Extract rows in "label : value" format
		const tableRows = columnHeaders.map((col) => [
			col.headerName,
			row[col.field] !== undefined ? row[col.field] : "-",
		]);
	
		// Create the table
		doc.autoTable({
			startY: 60, // Adjust starting Y position for the table
			head: [["Quality Parameter", "Value"]],
			body: tableRows,
			theme: "grid",
			styles: { font: "helvetica", fontSize: 10 },
			headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] }, // Blue header
			alternateRowStyles: { fillColor: [240, 240, 240] }, // Light grey rows
			margin: { top: 20 },
		});
	
		// Add printed date and user name at the bottom center
		const date = new Date().toLocaleDateString();
		const userName = session?.user?.name || 'User'; // Fallback to 'User' if name is not available
		const printedText = `Printed on: ${date} by: ${userName}`;
		const printedTextWidth = doc.getStringUnitWidth(printedText) * doc.internal.getFontSize() / doc.internal.scaleFactor;
		const printedTextX = (doc.internal.pageSize.getWidth() - printedTextWidth) / 2; // Center the printed text
		doc.text(printedText, printedTextX, doc.internal.pageSize.getHeight() - 20);
	
		// Save PDF
		doc.save(`QC_Report_${row.batchNumber}.pdf`);
	};

  const qcColumns = [
    { field: "batchNumber", headerName: "Batch Number", width: 150 },
    { field: "generalQuality", headerName: "General Quality", width: 180 },
    { field: "actualGrade", headerName: "Actual Grade", width: 150 },
    { field: "kelembapan", headerName: "Kelembapan (%)", width: 130 },
    { field: "seranggaHidup", headerName: "Serangga Hidup", width: 150 },
    { field: "bijiBauBusuk", headerName: "Biji Bau Busuk", width: 150 },
    { field: "defectScore", headerName: "Defect Score", width: 140 },
    { field: "totalBobotKotoran", headerName: "Total Bobot Kotoran", width: 180 },
    { field: "defectWeightPercentage", headerName: "Defect Weight (%)", width: 180 },
		{
			field: "export",
			headerName: "Export",
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
                <Grid item xs={9}>
                    <TextField
                    label="Batch Number"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    fullWidth
                    required
                    margin="normal"
                    />
                </Grid>
                <Grid item xs={3}>
                    <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleBatchNumberSearch}
                    style={{ marginTop: "24px" }}
                    fullWidth
                    >
                    Search
                    </Button>
                </Grid>
                </Grid>
                <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={6}>
                    <TextField
                    label="Reference Number"
                    value={batchData ? batchData.referenceNumber : ""}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    disabled={!batchData}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                    label="Stored Date"
                    value={batchData ? new Date(batchData.storedDate).toLocaleDateString() : ""}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    disabled={!batchData}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                    label="Processing Type"
                    value={batchData ? batchData.processingType : ""}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    disabled={!batchData}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                    label="Total Weight (kg)"
                    value={batchData ? batchData.weight : ""}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    disabled={!batchData}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                    label="Total Bags"
                    value={batchData ? batchData.totalBags : ""}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    disabled={!batchData}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                    label="Quality"
                    value={batchData ? batchData.quality : ""}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    disabled={!batchData}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                    label="Producer"
                    value={batchData ? batchData.producer : ""}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    disabled={!batchData}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                    label="Product Line"
                    value={batchData ? batchData.productLine : ""}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    disabled={!batchData}
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                    label="Notes"
                    value={batchData ? batchData.notes : ""}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    multiline
                    rows={9}
                    disabled={!batchData}
                    />
                </Grid>
                </Grid>
            </CardContent>
        </Card>
    </Grid>

      {/* QC Input Form (7u width) */}
    <Grid item xs={12} md={7}>
        <Card variant="outlined">
            <CardContent>
            <Typography variant="h5" gutterBottom sx={{ mb: 2 }} > 
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
                    <Button type="submit" variant="contained" color="primary" style={{ marginTop: "12px" }}>
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