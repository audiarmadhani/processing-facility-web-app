"use client";

import React, { useState, useEffect } from "react";
import { Box, Typography, MenuItem, Select, FormControl, InputLabel, Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";

const API_BASE_URL = "https://processing-facility-backend.onrender.com"; // Replace with your backend URL

function DatabasePage() {
  const [tables, setTables] = useState([]); // List of tables in the database
  const [selectedTable, setSelectedTable] = useState(""); // Currently selected table
  const [columns, setColumns] = useState([]); // Table columns
  const [rows, setRows] = useState([]); // Table rows
  const [loading, setLoading] = useState(false); // Loading state

  // Fetch tables from the API
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await axios.get(`https://processing-facility-backend.onrender.com/api/tables`);
        setTables(response.data); // Set the tables array
      } catch (err) {
        console.error('Error fetching tables:', err);
      }
    };

    fetchTables();
  }, []);

  // Handle table selection
  const handleChange = (event) => {
    const tableName = event.target.value;
    setSelectedTable(tableName);
    onTableSelect(tableName); // Notify the parent about the selected table
  };

  // Fetch table data when the selected table changes
  useEffect(() => {
    if (!selectedTable) return;

    const fetchTableData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`https://processing-facility-backend.onrender.com/api/tables/${selectedTable}`);
        setColumns(
          response.data.columns.map((col) => ({
            field: col.field,
            headerName: col.headerName || col.field,
            width: col.width || 150,
            editable: col.editable || true, // Allow editing
          }))
        );
        setRows(response.data.rows); // Example: [{ id: 1, name: "John" }, ...]
      } catch (error) {
        console.error("Error fetching table data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTableData();
  }, [selectedTable]);

  // Handle CRUD operations
  const handleProcessRowUpdate = async (newRow, oldRow) => {
    try {
      // Send update request to backend
      await axios.put(`https://processing-facility-backend.onrender.com/api/tables/${selectedTable}/${newRow.id}`, newRow);
      return newRow; // Update locally if successful
    } catch (error) {
      console.error("Error updating row:", error);
      return oldRow; // Revert changes on failure
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`https://processing-facility-backend.onrender.com/api/tables/${selectedTable}/${id}`);
      setRows(rows.filter((row) => row.id !== id)); // Remove row locally
    } catch (error) {
      console.error("Error deleting row:", error);
    }
  };

  const handleAddRow = async () => {
    try {
      const newRow = {}; // Provide default values for new rows if needed
      const response = await axios.post(`https://processing-facility-backend.onrender.com/api/tables/${selectedTable}`, newRow);
      setRows((prevRows) => [...prevRows, response.data]); // Add new row locally
    } catch (error) {
      console.error("Error adding row:", error);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Dropdown for table selection */}
      <FormControl sx={{ minWidth: 200, mb: 2 }}>
        <InputLabel id="table-select-label">Select Table</InputLabel>
        <Select
          labelId="table-select-label"
          value={selectedTable}
          onChange={handleChange}
          displayEmpty
        >
          {tables.length === 0 ? (
            <MenuItem disabled>No tables available</MenuItem>
          ) : (
            tables.map((table) => (
              <MenuItem key={table} value={table}>
                {table}
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>

      {/* Add new row button */}
      {selectedTable && (
        <Button variant="contained" color="primary" onClick={handleAddRow} sx={{ mb: 2 }}>
          Add New Row
        </Button>
      )}

      {/* DataGrid */}
      {selectedTable && (
        <Box sx={{ height: 500, width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            processRowUpdate={handleProcessRowUpdate}
            onProcessRowUpdateError={(error) => console.error("Update error:", error)}
            experimentalFeatures={{ newEditingApi: true }}
            components={{
              Toolbar: () => (
                <Box sx={{ display: "flex", justifyContent: "space-between", p: 1 }}>
                  <Typography variant="body1">
                    Table: {selectedTable}
                  </Typography>
                </Box>
              ),
            }}
            checkboxSelection
            onRowSelectionModelChange={(selection) => {
              const selectedIDs = new Set(selection);
              const selectedRowData = rows.filter((row) => selectedIDs.has(row.id));
              console.log("Selected rows:", selectedRowData);
            }}
          />
        </Box>
      )}
    </Box>
  );
}

export default DatabasePage;