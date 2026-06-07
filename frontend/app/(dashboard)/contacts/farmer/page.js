"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Button,
  Typography,
  Snackbar,
  Alert,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import axios from "axios";
import { formatIdr } from "../../station/_shared/utils/format";
import FarmerFormFields from "./FarmerFormFields";
import DriverPickupSection from "./components/DriverPickupSection";
import {
  FARMER_API_BASE,
  emptyFarmerForm,
  farmerRowToForm,
  formToPayload,
  validateFarmerForm,
} from "./constants";

const EMPTY = "—";

function formatBrix(value) {
  if (value == null || Number.isNaN(Number(value))) return EMPTY;
  return Number(value).toFixed(2);
}

function formatSummaryCell(value) {
  if (value == null || value === "") return EMPTY;
  return value;
}

function FarmerInputStation() {
  const { data: session, status } = useSession();

  const [farmerData, setFarmerData] = useState([]);
  const [farmerSummaryData, setFarmerSummaryData] = useState([]);
  const [createForm, setCreateForm] = useState(emptyFarmerForm);
  const [locationData, setLocationData] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const [editOpen, setEditOpen] = useState(false);
  const [editFarmerID, setEditFarmerID] = useState(null);
  const [editForm, setEditForm] = useState(emptyFarmerForm);
  const [editSaving, setEditSaving] = useState(false);

  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const fetchFarmerData = useCallback(async () => {
    if (!session?.user?.role) return;
    try {
      const response = await fetch(`${FARMER_API_BASE}/farmer`);
      if (!response.ok) throw new Error("Failed to fetch farmer data");

      const data = await response.json();

      if (session.user.role === "staff") {
        setFarmerData(
          (data.latestRows || []).map((row) => ({ ...row, id: row.farmerID }))
        );
      } else if (["admin", "manager", "receiving"].includes(session.user.role)) {
        setFarmerData(
          (data.allRows || []).map((row) => ({ ...row, id: row.farmerID }))
        );
        setFarmerSummaryData(
          (data.summaryRows || []).map((row) => ({ ...row, id: row.farmerID }))
        );
      }
    } catch (error) {
      console.error("Error fetching farmer data:", error);
      setFarmerData([]);
      setFarmerSummaryData([]);
      showSnackbar("Failed to fetch farmer data.", "error");
    }
  }, [session?.user?.role]);

  const fetchLocationData = async () => {
    try {
      const response = await axios.get(`${FARMER_API_BASE}/location`);
      setLocationData(response.data || []);
    } catch (error) {
      console.error("Error fetching location data:", error);
      showSnackbar("Failed to fetch location data.", "error");
    }
  };

  useEffect(() => {
    if (session?.user?.role) {
      fetchFarmerData();
      fetchLocationData();
    }
  }, [session?.user?.role, fetchFarmerData]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateFarmerForm(createForm);
    if (validationError) {
      showSnackbar(validationError, "error");
      return;
    }

    try {
      const response = await fetch(`${FARMER_API_BASE}/farmer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formToPayload(createForm)),
      });

      if (response.ok) {
        setCreateForm(emptyFarmerForm());
        await fetchFarmerData();
        showSnackbar("Farmer successfully added!");
      } else {
        const errorData = await response.json();
        showSnackbar(errorData.error || errorData.message || "Failed to add farmer.", "error");
      }
    } catch (error) {
      console.error("Failed to communicate with the backend:", error);
      showSnackbar("Failed to communicate with the backend.", "error");
    }
  };

  const handleOpenEdit = (row) => {
    setEditFarmerID(row.farmerID);
    setEditForm(farmerRowToForm(row));
    setEditOpen(true);
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
    setEditFarmerID(null);
    setEditForm(emptyFarmerForm());
  };

  const handleEditSubmit = async () => {
    const validationError = validateFarmerForm(editForm);
    if (validationError) {
      showSnackbar(validationError, "error");
      return;
    }

    setEditSaving(true);
    try {
      const response = await fetch(`${FARMER_API_BASE}/farmer/${editFarmerID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formToPayload(editForm)),
      });

      if (response.ok) {
        handleCloseEdit();
        await fetchFarmerData();
        showSnackbar("Farmer updated successfully!");
      } else {
        const errorData = await response.json();
        showSnackbar(errorData.error || errorData.message || "Failed to update farmer.", "error");
      }
    } catch (error) {
      console.error("Failed to update farmer:", error);
      showSnackbar("Failed to communicate with the backend.", "error");
    } finally {
      setEditSaving(false);
    }
  };

  const detailColumns = [
    { field: "farmerID", headerName: "ID", sortable: true, width: 40 },
    { field: "farmerName", headerName: "Name", sortable: true, width: 300 },
    { field: "desa", headerName: "Desa", sortable: true, width: 120 },
    { field: "kecamatan", headerName: "Kecamatan", sortable: true, width: 120 },
    { field: "kabupaten", headerName: "Kabupaten", sortable: true, width: 120 },
    { field: "farmerAddress", headerName: "Address", sortable: true, width: 200 },
    {
      field: "elevationMin",
      headerName: "Elevation",
      sortable: false,
      width: 120,
      renderCell: ({ row }) => {
        const min = row.elevationMin;
        const max = row.elevationMax;
        if (min == null || max == null) return EMPTY;
        if (min === max) return `${min} m`;
        return `${min}–${max} m`;
      },
    },
    { field: "contractType", headerName: "Contract Type", sortable: true, width: 120 },
    { field: "broker", headerName: "Broker", sortable: true, width: 100 },
    { field: "paymentMethod", headerName: "Payment Method", sortable: true, width: 150 },
    { field: "bankName", headerName: "Bank Name", sortable: true, width: 120 },
    { field: "bankAccount", headerName: "Bank Account", sortable: true, width: 150 },
    { field: "bankAccountName", headerName: "Bank Account Name", sortable: true, width: 180 },
    { field: "farmerLandArea", headerName: "Land Area", sortable: true, width: 120 },
    { field: "farmerContact", headerName: "Contact", sortable: true, width: 150 },
    { field: "farmType", headerName: "Type", sortable: true, width: 90 },
    { field: "farmVarieties", headerName: "Coffee Varieties", sortable: true, width: 180 },
    { field: "registrationDate", headerName: "Registration Date", sortable: true, width: 150 },
    { field: "notes", headerName: "Notes", sortable: true, width: 150 },
    {
      field: "actions",
      headerName: "Actions",
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          aria-label="Edit farmer"
          onClick={() => handleOpenEdit(params.row)}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  const summaryColumns = [
    { field: "farmerName", headerName: "Farmer Name", sortable: true, width: 200 },
    {
      field: "desa",
      headerName: "Desa",
      sortable: true,
      width: 120,
      renderCell: ({ value }) => formatSummaryCell(value),
    },
    {
      field: "kecamatan",
      headerName: "Kecamatan",
      sortable: true,
      width: 120,
      renderCell: ({ value }) => formatSummaryCell(value),
    },
    {
      field: "broker",
      headerName: "Broker",
      sortable: true,
      width: 100,
      renderCell: ({ value }) => formatSummaryCell(value),
    },
    {
      field: "type",
      headerName: "Type",
      sortable: true,
      width: 90,
      renderCell: ({ value }) => formatSummaryCell(value),
    },
    {
      field: "varieties",
      headerName: "Varieties",
      sortable: true,
      width: 180,
      renderCell: ({ value }) => formatSummaryCell(value),
    },
    {
      field: "elevation",
      headerName: "Elevation",
      sortable: true,
      width: 120,
      renderCell: ({ value }) => formatSummaryCell(value),
    },
    {
      field: "brixAverageThisYear",
      headerName: "Brix Avg (This Year)",
      sortable: true,
      width: 150,
      renderCell: ({ value }) => formatBrix(value),
    },
    {
      field: "lastReceivedYear",
      headerName: "Last Received Year",
      sortable: true,
      width: 140,
      renderCell: ({ value }) => formatSummaryCell(value),
    },
    {
      field: "averageCherryPriceThisYear",
      headerName: "Avg Cherry Price (This Year)",
      sortable: true,
      width: 200,
      renderCell: ({ value }) => (value == null ? EMPTY : formatIdr(value)),
    },
  ];

  const gridCommonProps = {
    pageSize: 5,
    rowsPerPageOptions: [5, 10, 20],
    disableSelectionOnClick: true,
    sortingOrder: ["asc", "desc"],
    slots: { toolbar: GridToolbar },
    autosizeOnMount: true,
    autosizeOptions: {
      includeHeaders: true,
      includeOutliers: true,
      expand: true,
    },
    rowHeight: 35,
  };

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (!session?.user || !["admin", "manager", "receiving"].includes(session.user.role)) {
    return (
      <Typography variant="h6">
        Access Denied. You do not have permission to view this page.
      </Typography>
    );
  }

  const canViewGrids = ["admin", "manager", "receiving"].includes(session.user.role);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={5}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
              Farmer Form
            </Typography>
            <form onSubmit={handleCreateSubmit}>
              <FarmerFormFields
                form={createForm}
                setForm={setCreateForm}
                locationData={locationData}
                idPrefix="create"
                resetVarietiesOnFarmTypeChange
              />
              <Button variant="contained" color="primary" type="submit" sx={{ mt: 2 }}>
                Submit
              </Button>
            </form>
          </CardContent>
        </Card>
      </Grid>

      {canViewGrids && (
        <Grid item xs={12} md={7}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Farmer Data
              </Typography>
              <div style={{ height: 800, width: "100%" }}>
                <DataGrid rows={farmerData} columns={detailColumns} {...gridCommonProps} />
              </div>
            </CardContent>
          </Card>
        </Grid>
      )}

      {canViewGrids && (
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Farmer Summary
              </Typography>
              <div style={{ height: 600, width: "100%" }}>
                <DataGrid
                  rows={farmerSummaryData}
                  columns={summaryColumns}
                  {...gridCommonProps}
                />
              </div>
            </CardContent>
          </Card>
        </Grid>
      )}

      {canViewGrids && (
        <Grid item xs={12}>
          <DriverPickupSection />
        </Grid>
      )}

      <Dialog open={editOpen} onClose={handleCloseEdit} maxWidth="md" fullWidth>
        <DialogTitle>Edit Farmer</DialogTitle>
        <DialogContent dividers>
          <FarmerFormFields
            form={editForm}
            setForm={setEditForm}
            locationData={locationData}
            idPrefix="edit"
            resetVarietiesOnFarmTypeChange={false}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit} disabled={editSaving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleEditSubmit} disabled={editSaving}>
            {editSaving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Grid>
  );
}

export default FarmerInputStation;
