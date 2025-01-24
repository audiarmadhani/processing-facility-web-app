"use client";

import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import {
  DataGrid,
  GridActionsCellItem,
  GridRowModes,
  GridToolbarContainer,
  GridRowEditStopReasons,
} from "@mui/x-data-grid";
import axios from "axios";

const API_BASE_URL = "https://processing-facility-backend.onrender.com"; // Replace with your backend URL

function EditToolbar({ setRows, setRowModesModel }) {
  const handleAddClick = () => {
    const id = Math.random().toString(36).substr(2, 9); // Generate a random ID
    setRows((prevRows) => [
      ...prevRows,
      { id, isNew: true }, // Add a new row with default empty fields
    ]);
    setRowModesModel((prev) => ({
      ...prev,
      [id]: { mode: GridRowModes.Edit, fieldToFocus: "id" },
    }));
  };

  return (
    <GridToolbarContainer>
      <Button color="primary" startIcon={<AddIcon />} onClick={handleAddClick}>
        Add record
      </Button>
    </GridToolbarContainer>
  );
}

export default function DatabasePage() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [rowModesModel, setRowModesModel] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch list of tables
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/tables`);
        setTables(response.data);
      } catch (err) {
        console.error("Error fetching tables:", err);
      }
    };
    fetchTables();
  }, []);

  // Fetch data and column structure when a table is selected
  useEffect(() => {
    if (!selectedTable) return;

    const fetchTableData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/tables/${selectedTable}`);
        const { rows: tableRows, columns: tableColumns } = response.data;

        setColumns(
          tableColumns.map((col) => ({
            field: col.field,
            headerName: col.headerName || col.field,
            width: col.width || 150,
            editable: true,
          }))
        );
        setRows(
          tableRows.map((row) => ({
            ...row,
            id: getRowId(row),
          }))
        );
      } catch (err) {
        console.error("Error fetching table data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTableData();
  }, [selectedTable]);

  // Generate unique row identifier
  const getRowId = (row) => {
    return row.id || `${row[columns[0]?.field]}_${row[columns[1]?.field]}`;
  };

  // Handle CRUD actions
  const handleRowEditStop = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const processRowUpdate = async (newRow) => {
    const id = getRowId(newRow);
    try {
      await axios.put(`${API_BASE_URL}/api/tables/${selectedTable}/${id}`, newRow);
      return { ...newRow, isNew: false };
    } catch (err) {
      console.error("Error updating row:", err);
      throw err;
    }
  };

  const handleDeleteClick = (id) => async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/tables/${selectedTable}/${id}`);
      setRows((prevRows) => prevRows.filter((row) => row.id !== id));
    } catch (err) {
      console.error("Error deleting row:", err);
    }
  };

  const handleSaveClick = (id) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
  };

  const handleCancelClick = (id) => () => {
    setRowModesModel({
      ...rowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });
    const editedRow = rows.find((row) => row.id === id);
    if (editedRow?.isNew) {
      setRows((prevRows) => prevRows.filter((row) => row.id !== id));
    }
  };

  const handleEditClick = (id) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
  };

  const columnsWithActions = [
    ...columns,
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 100,
      getActions: ({ id }) => {
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

        if (isInEditMode) {
          return [
            <GridActionsCellItem
              icon={<SaveIcon />}
              label="Save"
              onClick={handleSaveClick(id)}
              color="primary"
            />,
            <GridActionsCellItem
              icon={<CancelIcon />}
              label="Cancel"
              onClick={handleCancelClick(id)}
              color="inherit"
            />,
          ];
        }

        return [
          <GridActionsCellItem
            icon={<EditIcon />}
            label="Edit"
            onClick={handleEditClick(id)}
            color="inherit"
          />,
          <GridActionsCellItem
            icon={<DeleteIcon />}
            label="Delete"
            onClick={handleDeleteClick(id)}
            color="inherit"
          />,
        ];
      },
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
      {/* Dropdown for table selection */}
      <Box sx={{ mb: 2 }}>
        <select
          value={selectedTable}
          onChange={(e) => setSelectedTable(e.target.value)}
          style={{ padding: "8px", fontSize: "16px" }}
        >
          <option value="" disabled>
            Select a table
          </option>
          {tables.map((table) => (
            <option key={table} value={table}>
              {table}
            </option>
          ))}
        </select>
      </Box>

      {/* DataGrid */}
      <Box sx={{ height: 500, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columnsWithActions}
          editMode="row"
          rowModesModel={rowModesModel}
          onRowModesModelChange={setRowModesModel}
          onRowEditStop={handleRowEditStop}
          processRowUpdate={processRowUpdate}
          loading={loading}
          slots={{
            toolbar: EditToolbar,
          }}
          slotProps={{
            toolbar: { setRows, setRowModesModel },
          }}
        />
      </Box>
    </Box>
  );
}