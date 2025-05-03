"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Button,
  Typography,
  Snackbar,
  Alert,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Divider,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import axios from "axios";
import jsPDF from "jspdf";

const DryMillStation = () => {
  const { data: session, status } = useSession();
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [parentBatches, setParentBatches] = useState([]);
  const [subBatches, setSubBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [grades, setGrades] = useState([]);
  const [currentWeights, setCurrentWeights] = useState({});
  const [rfid, setRfid] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [openCompleteDialog, setOpenCompleteDialog] = useState(false);
  const [openStorageDialog, setOpenStorageDialog] = useState(false);

  const fetchDryMillData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("https://processing-facility-backend.onrender.com/api/dry-mill-data");
      const data = await response.data;

      const formattedData = data.map((batch) => ({
        batchNumber: batch.batchNumber,
        status: batch.status,
        dryMillEntered: batch.dryMillEntered,
        dryMillExited: batch.dryMillExited,
        cherry_weight: batch.cherry_weight || "N/A",
        producer: batch.producer || "N/A",
        productLine: batch.productLine || "N/A",
        processingType: batch.processingType || "N/A",
        quality: batch.quality || "N/A",
        totalBags: batch.totalBags || "N/A",
        notes: batch.notes || "N/A",
        type: batch.type || "N/A",
        storeddatetrunc: batch.storeddatetrunc || "N/A",
        isStored: batch.isStored || false,
        parentBatchNumber: batch.parentBatchNumber || null,
        weight: batch.weight || "N/A",
        referenceNumber: batch.referenceNumber || "N/A",
        bagWeights: batch.bagWeights || [],
      }));

      const parentBatchesData = formattedData.filter(
        (batch) => !batch.parentBatchNumber && !batch.isStored && batch.status !== "Processed"
      );
      const subBatchesData = formattedData.filter(
        (batch) => batch.parentBatchNumber || batch.isStored
      );

      setParentBatches(parentBatchesData);
      setSubBatches(subBatchesData);
    } catch (error) {
      console.error("Error fetching dry mill data:", error);
      setSnackbarMessage(error.response?.data?.error || "Error fetching data. Please try again.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExistingGrades = async (batchNumber) => {
    try {
      const response = await axios.get(
        `https://processing-facility-backend.onrender.com/api/dry-mill-grades/${batchNumber}`
      );
      const data = response.data;
      if (!Array.isArray(data)) {
        throw new Error("Invalid response format: grades data is not an array");
      }

      // Define the desired order of grades
      const gradeOrder = ['Specialty Grade', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'];
      
      // Create a map of fetched grades
      const fetchedGradesMap = {};
      data.forEach(grade => {
        fetchedGradesMap[grade.grade] = {
          grade: grade.grade,
          weight: grade.weight || '',
          bagWeights: Array.isArray(grade.bagWeights) ? grade.bagWeights : [],
          bagged_at: grade.bagged_at || new Date().toISOString().split("T")[0],
        };
      });

      // Ensure all grades are present in the correct order
      const gradesData = gradeOrder.map(grade => 
        fetchedGradesMap[grade] || {
          grade,
          weight: '',
          bagWeights: [],
          bagged_at: new Date().toISOString().split("T")[0],
        }
      );

      return gradesData;
    } catch (error) {
      console.error("Error fetching existing grades:", error);
      setSnackbarMessage(error.response?.data?.error || "Failed to fetch existing grades.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return [
        { grade: "Specialty Grade", weight: '', bagWeights: [], bagged_at: new Date().toISOString().split("T")[0] },
        { grade: "Grade 1", weight: '', bagWeights: [], bagged_at: new Date().toISOString().split("T")[0] },
        { grade: "Grade 2", weight: '', bagWeights: [], bagged_at: new Date().toISOString().split("T")[0] },
        { grade: "Grade 3", weight: '', bagWeights: [], bagged_at: new Date().toISOString().split("T")[0] },
        { grade: "Grade 4", weight: '', bagWeights: [], bagged_at: new Date().toISOString().split("T")[0] },
      ];
    }
  };

  const fetchLatestRfid = async () => {
    try {
      const response = await axios.get("https://processing-facility-backend.onrender.com/api/get-rfid");
      const data = await response.data;
      setRfid(data.rfid || "");
    } catch (error) {
      console.error("Error fetching latest RFID:", error);
      setSnackbarMessage(error.response?.data?.error || "Failed to fetch latest RFID.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const handleScanRfid = async () => {
    if (!rfid) {
      setSnackbarMessage("Please enter or fetch an RFID value.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }
    setIsScanning(true);
    try {
      const response = await axios.post("https://processing-facility-backend.onrender.com/api/scan-rfid", {
        rfid,
        scanned_at: "Dry_Mill",
      });

      const data = await response.data;

      setRfid("");
      setSnackbarMessage(data.message);
      setSnackbarSeverity("success");
      setOpenSnackbar(true);

      fetchDryMillData();

      if (data.exited_at) {
        setOpenStorageDialog(true);
      }
    } catch (error) {
      console.error("Error scanning RFID:", error);
      setSnackbarMessage(error.response?.data?.error || "Failed to scan RFID");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirmComplete = async () => {
    if (!selectedBatch) return;
    try {
      const response = await axios.post(
        `https://processing-facility-backend.onrender.com/api/dry-mill/${selectedBatch.batchNumber}/complete`,
        {}
      );

      const data = await response.data;

      setSnackbarMessage(data.message);
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
      setOpenDialog(false);
      fetchDryMillData();
    } catch (error) {
      console.error("Error marking batch as processed:", error);
      setSnackbarMessage(error.response?.data?.error || "Failed to mark batch as processed");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const handleConfirmStorage = async () => {
    if (!rfid) {
      setSnackbarMessage("Please enter an RFID value.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }
    try {
      const response = await axios.post("https://processing-facility-backend.onrender.com/api/warehouse/scan", {
        rfid,
        scanned_at: "Warehouse",
      });

      const data = await response.data;

      setRfid("");
      setSnackbarMessage(data.message);
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
      setOpenStorageDialog(false);
      fetchDryMillData();
    } catch (error) {
      console.error("Error confirming storage:", error);
      setSnackbarMessage(error.response?.data?.error || "Failed to confirm storage");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const handleSortAndWeigh = async () => {
    if (!selectedBatch) return;
    try {
      const today = new Date().toISOString().slice(0, 10);
      const response = await axios.post(
        `https://processing-facility-backend.onrender.com/api/dry-mill/${selectedBatch.batchNumber}/split`,
        {
          grades: grades.map((g) => ({
            grade: g.grade,
            bagWeights: g.bagWeights,
            bagged_at: today, // Automatically set to today
          })),
        }
      );
      const data = await response.data;

      setSnackbarMessage(data.message);
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
      setOpenDialog(false);
      fetchDryMillData();
    } catch (error) {
      console.error("Error saving green bean splits:", error);
      setSnackbarMessage(error.response?.data?.error || "Failed to save green bean splits");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const handlePrintLabel = (batchNumber, grade, bagIndex, bagWeight) => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [100, 150], // 10 cm x 15 cm
    });

    const farmerName = selectedBatch?.producer || "Unknown Farmer";
    const companyName = selectedBatch?.producer === "BTM" ? "PT Berkas Tuaian Melimpah" : "HEQA";
    const productionDate = new Date().toLocaleDateString();

    // Header Section
    doc.setFillColor(240, 240, 240); // Light gray background
    doc.rect(5, 5, 90, 20, "F"); // Header rectangle
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Green Coffee Beans", 10, 15); // Title
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(companyName, 10, 20); // Company name

    // Main Info Section
    doc.setFontSize(12);
    doc.rect(5, 30, 90, 115, "S"); // Main content border
    let y = 35;
    const labelWidth = 15; // Fixed width for labels to align colons
    doc.text(`Lot Number: ${" ".repeat(Math.max(0, labelWidth - "Lot Number".length))}${batchNumber}`, 10, y); y += 7;
    doc.text(`Reference Number: ${" ".repeat(Math.max(0, labelWidth - "Reference Number".length))}${selectedBatch?.referenceNumber || "N/A"}`, 10, y); y += 7;
    doc.text(`Cherry Lot Number: ${" ".repeat(Math.max(0, labelWidth - "Cherry Lot Number".length))}${selectedBatch?.parentBatchNumber || "N/A"}`, 10, y); y += 7;
    doc.text(`Farmer: ${" ".repeat(Math.max(0, labelWidth - "Farmer".length))}${farmerName}`, 10, y); y += 7;
    doc.text(`Grade: ${" ".repeat(Math.max(0, labelWidth - "Grade".length))}${grade}`, 10, y); y += 7;
    doc.text(`Bag Weight: ${" ".repeat(Math.max(0, labelWidth - "Bag Weight".length))}${bagWeight} kg`, 10, y); y += 7;
    doc.text(`Bag Number: ${" ".repeat(Math.max(0, labelWidth - "Bag Number".length))}${bagIndex + 1}`, 10, y); y += 7;
    doc.text(`Production Date: ${" ".repeat(Math.max(0, labelWidth - "Production Date".length))}${productionDate}`, 10, y); y += 7;

    doc.save(`Label_${batchNumber}_Bag_${bagIndex + 1}.pdf`);
  };

  useEffect(() => {
    fetchDryMillData();
    fetchLatestRfid();
    const intervalId = setInterval(() => {
      fetchDryMillData();
      fetchLatestRfid();
    }, 300000);
    return () => clearInterval(intervalId);
  }, []);

  const handleRefreshData = () => {
    fetchDryMillData();
    fetchLatestRfid();
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleDetailsClick = async (batch) => {
    setSelectedBatch(batch);
    const existingGrades = await fetchExistingGrades(batch.batchNumber);
    setGrades(existingGrades);
    // Reset currentWeights to match the new grades
    setCurrentWeights(existingGrades.reduce((acc, _, idx) => ({ ...acc, [idx]: "" }), {}));
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBatch(null);
  };

  const handleCloseCompleteDialog = () => {
    setOpenCompleteDialog(false);
    setSelectedBatch(null);
  };

  const handleCloseStorageDialog = () => {
    setOpenStorageDialog(false);
    setRfid("");
  };

  const parentColumns = [
    { field: "batchNumber", headerName: "Batch Number", width: 160 },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === "In Dry Mill"
              ? "primary"
              : params.value === "Processed"
              ? "success"
              : "default"
          }
          size="small"
          sx={{ borderRadius: "16px", fontWeight: "medium" }}
        />
      ),
    },
    {
      field: "complete",
      headerName: "Details",
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Button
          variant="outlined"
          size="small"
          onClick={() => handleDetailsClick(params.row)}
        >
          Details
        </Button>
      ),
    },
    { field: "dryMillEntered", headerName: "Dry Mill Entered", width: 150 },
    { field: "dryMillExited", headerName: "Dry Mill Exited", width: 150 },
    { field: "cherry_weight", headerName: "Cherry Weight (kg)", width: 140 },
    { field: "producer", headerName: "Producer", width: 120 },
    { field: "productLine", headerName: "Product Line", width: 160 },
    { field: "processingType", headerName: "Processing Type", width: 180 },
    { field: "type", headerName: "Type", width: 120 },
    { field: "totalBags", headerName: "Total Bags", width: 120 },
    { field: "notes", headerName: "Notes", width: 180 },
  ];

  const subBatchColumns = [
    { field: "batchNumber", headerName: "Batch Number", width: 160 },
    { field: "parentBatchNumber", headerName: "Parent Batch", width: 160 },
    { field: "referenceNumber", headerName: "Ref Number", width: 180 },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === "In Dry Mill"
              ? "primary"
              : params.value === "Processed"
              ? "success"
              : "default"
          }
          size="small"
          sx={{ borderRadius: "16px", fontWeight: "medium" }}
        />
      ),
    },
    { field: "dryMillEntered", headerName: "Dry Mill Entered", width: 150 },
    { field: "dryMillExited", headerName: "Dry Mill Exited", width: 150 },
    { field: "storeddatetrunc", headerName: "Stored Date", width: 150 },
    { field: "weight", headerName: "Weight (kg)", width: 140 },
    { field: "producer", headerName: "Producer", width: 120 },
    { field: "productLine", headerName: "Product Line", width: 160 },
    { field: "processingType", headerName: "Processing Type", width: 180 },
    { field: "type", headerName: "Type", width: 120 },
    { field: "quality", headerName: "Quality", width: 120 },
    { field: "totalBags", headerName: "Bags Qty", width: 120 },
    { field: "notes", headerName: "Notes", width: 180 },
    {
      field: "isStored",
      headerName: "Storage Status",
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value ? "Stored" : "Not Stored"}
          color={params.value ? "success" : "default"}
          size="small"
          sx={{ borderRadius: "16px", fontWeight: "medium" }}
        />
      ),
    },
  ];

  const getParentBatches = () => {
    return [...parentBatches].sort((a, b) => {
      const statusOrder = { "In Dry Mill": 0, "Processed": 1, "Not Started": 2 };
      return (
        (statusOrder[a.status] || 2) -
        (statusOrder[b.status] || 2) ||
        (a.dryMillEntered === "N/A"
          ? Infinity
          : new Date(a.dryMillEntered)) -
          (b.dryMillEntered === "N/A"
            ? Infinity
            : new Date(b.dryMillEntered))
      );
    });
  };

  const getSubBatches = () => {
    return [...subBatches].sort((a, b) =>
      a.parentBatchNumber?.localeCompare(b.parentBatchNumber) ||
      a.batchNumber.localeCompare(b.batchNumber)
    );
  };

  const renderParentDataGrid = () => {
    const sortedData = getParentBatches();
    return (
      <DataGrid
        rows={sortedData}
        columns={parentColumns}
        initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
        pageSizeOptions={[5, 10, 20]}
        disableRowSelectionOnClick
        getRowId={(row) => row.batchNumber}
        slots={{ toolbar: GridToolbar }}
        autosizeOnMount
        autosizeOptions={{ includeHeaders: true, includeOutliers: true, expand: true }}
        rowHeight={35}
        sx={{ height: 400, width: "100%" }}
      />
    );
  };

  const renderSubBatchDataGrid = () => {
    const sortedData = getSubBatches();
    return (
      <DataGrid
        rows={sortedData}
        columns={subBatchColumns}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        pageSizeOptions={[10, 20, 50]}
        disableRowSelectionOnClick
        getRowId={(row) => row.batchNumber}
        slots={{ toolbar: GridToolbar }}
        autosizeOnMount
        autosizeOptions={{ includeHeaders: true, includeOutliers: true, expand: true }}
        rowHeight={35}
        sx={{ height: 600, width: "100%" }}
      />
    );
  };

  if (status === "loading") return <Typography>Loading...</Typography>;

  if (
    !session?.user ||
    !["admin", "manager", "drymill", "postprocessing"].includes(
      session.user.role
    )
  ) {
    return (
      <Typography variant="h6">
        Access Denied. You do not have permission to view this page.
      </Typography>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Dry Mill Station - Active Batches
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleRefreshData}
              disabled={isLoading}
              sx={{ mb: 2, ml: 0 }}
              startIcon={isLoading ? <CircularProgress size={20} /> : null}
            >
              {isLoading ? "Refreshing..." : "Refresh Data"}
            </Button>
            {renderParentDataGrid()}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Green Bean Sub-Batches
            </Typography>
            {renderSubBatchDataGrid()}
          </CardContent>
        </Card>
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Sort, Weigh, and Bag - Batch {selectedBatch?.batchNumber}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
            Add the weight of each bag for each green bean grade. Use the preset buttons (50 kg or 60 kg) or enter a custom weight, then print the label for each bag.
            Preprocessing details: Producer: {selectedBatch?.producer},
            Product Line: {selectedBatch?.productLine}, Processing Type: {selectedBatch?.processingType},
            Type: {selectedBatch?.type}, Cherry Weight: {selectedBatch?.cherry_weight} kg.
            Note: Green bean weight may be less due to processing losses.
          </Typography>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {grades.map((grade, index) => {
              const handleAddBag = (weight) => {
                if (!weight || isNaN(weight) || parseFloat(weight) <= 0) {
                  setSnackbarMessage("Please enter a valid weight.");
                  setSnackbarSeverity("error");
                  setOpenSnackbar(true);
                  return;
                }
                setGrades(prevGrades => {
                  const newGrades = [...prevGrades];
                  newGrades[index] = {
                    ...newGrades[index],
                    bagWeights: [...newGrades[index].bagWeights, parseFloat(weight).toString()],
                  };
                  return newGrades;
                });
                setCurrentWeights(prev => ({ ...prev, [index]: "" })); // Reset current weight
              };

              const handleRemoveBag = (bagIndex) => {
                setGrades(prevGrades => {
                  const newGrades = [...prevGrades];
                  newGrades[index] = {
                    ...newGrades[index],
                    bagWeights: newGrades[index].bagWeights.filter((_, i) => i !== bagIndex),
                  };
                  return newGrades;
                });
              };

              const totalWeight = grade.bagWeights.reduce((sum, w) => sum + parseFloat(w), 0);
              const totalBags = grade.bagWeights.length;

              return (
                <Grid item xs={12} key={`${grade.grade}-${index}`}>
                  <Box sx={{ mb: 2, p: 2, border: "1px solid #e0e0e0", borderRadius: 1 }}>
                    <Typography variant="subtitle1">{grade.grade}</Typography>
                    <Box sx={{ display: "flex", gap: 2, mb: 1, alignItems: "center" }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleAddBag(50)}
                        sx={{ mr: 1 }}
                      >
                        50 kg
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleAddBag(60)}
                        sx={{ mr: 1 }}
                      >
                        60 kg
                      </Button>
                      <TextField
                        label="Custom Weight (kg)"
                        value={currentWeights[index] || ""}
                        onChange={(e) => setCurrentWeights(prev => ({ ...prev, [index]: e.target.value }))}
                        type="number"
                        inputProps={{ min: 0, step: 0.1 }}
                        variant="outlined"
                        sx={{ width: 150, mr: 1 }}
                      />
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => handleAddBag(currentWeights[index])}
                        disabled={!currentWeights[index] || isNaN(parseFloat(currentWeights[index])) || parseFloat(currentWeights[index]) <= 0}
                      >
                        Add Bag
                      </Button>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box>
                      <Typography variant="body2">
                        Total Bags: {totalBags} | Total Weight: {totalWeight.toFixed(2)} kg
                      </Typography>
                      {grade.bagWeights.length > 0 ? (
                        grade.bagWeights.map((weight, bagIndex) => (
                          <Box
                            key={`${grade.grade}-bag-${bagIndex}`}
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              mb: 1,
                            }}
                          >
                            <Typography variant="body1">
                              Bag {bagIndex + 1}: {weight} kg
                            </Typography>
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <Button
                                variant="contained"
                                color="error"
                                size="small"
                                onClick={() => handleRemoveBag(bagIndex)}
                              >
                                Remove
                              </Button>
                              <Button
                                variant="contained"
                                color="secondary"
                                size="small"
                                onClick={() => handlePrintLabel(selectedBatch.batchNumber, grade.grade, bagIndex, weight)}
                              >
                                Print Label
                              </Button>
                            </Box>
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No bags added yet.
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSortAndWeigh}
            disabled={!selectedBatch}
          >
            Save Splits
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleConfirmComplete}
            disabled={!selectedBatch || !grades.some(g => g.bagWeights.length > 0)}
          >
            Mark Complete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openCompleteDialog}
        onClose={handleCloseCompleteDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Mark as Processed</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Confirm marking Batch {selectedBatch?.batchNumber} as processed. All splits must be weighed and bagged.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCompleteDialog}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmComplete}
            disabled={!selectedBatch}
          >
            Mark Processed
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openStorageDialog}
        onClose={handleCloseStorageDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Storage</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Confirm storage for Batch {selectedBatch?.batchNumber} green beans. Enter RFID to proceed.
          </Typography>
          <TextField
            label="RFID"
            value={rfid}
            onChange={(e) => setRfid(e.target.value.trim().toUpperCase())}
            variant="outlined"
            size="small"
            fullWidth
            sx={{ mb: 2 }}
            disabled={isScanning}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStorageDialog}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmStorage}
            disabled={isScanning || !rfid}
          >
            Confirm Storage
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default DryMillStation;