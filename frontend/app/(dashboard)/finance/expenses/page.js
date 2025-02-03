"use client";

import { useState } from "react";
import { TextField, MenuItem, Button, Grid, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useEffect } from "react";
import axios from "axios";

const expenseTypes = {
  Operations: ["Vollers/Warehouse", "Accountant", "Tax", "Bank", "Office", "Flight", "Hotel", "Travel", "Packaging", "PostNL", "Others"],
  Marketing: ["Website", "Marketing Materials", "Competition", "Booth"],
  Legal: ["Notary", "Others"],
  Inventory: ["Coffee Beans", "Coffee Sample", "Tools", "Jute Bag", "Grainpro", "Packaging", "Office", "Packaging Exotic", "Consumables"],
  Freight: ["ID Shipment", "NL Shipment", "ID-NL Shipment", "Gojek", "Jastip", "Document"],
  Others: ["Others"],
};

const invoiceRecipients = ["PT Berkas Tuaian Melimpah", "Fabriek Group Indonesia BV"];

export default function ExpensesPage() {
  const [formData, setFormData] = useState({
    type: "",
    subType: "",
    detail: "",
    invoiceFiles: [],
    invoiceAmount: "",
    recipient: "",
    amountPaid: "",
    accountDetails: "",
  });

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/expenses");
      setExpenses(response.data);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
    setLoading(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (event) => {
    setFormData((prev) => ({
      ...prev,
      invoiceFiles: event.target.files,
    }));
  };

  const handleDrop = (acceptedFiles) => {
    setFiles(acceptedFiles);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const formDataObj = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "invoiceFiles") {
          Array.from(formData.invoiceFiles).forEach((file) => {
            formDataObj.append("invoiceFiles", file);
          });
        } else {
          formDataObj.append(key, formData[key]);
        }
      });

      await axios.post("/api/expenses", formDataObj, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setFormData({
        type: "",
        subType: "",
        detail: "",
        invoiceFiles: [],
        invoiceAmount: "",
        recipient: "",
        amountPaid: "",
        accountDetails: "",
      });

      fetchExpenses();
    } catch (error) {
      console.error("Error submitting expense:", error);
    }
  };

  const columns = [
    { field: "type", headerName: "Type", width: 150, editable: true },
    { field: "subType", headerName: "Sub Type", width: 200, editable: true },
    { field: "detail", headerName: "Details", width: 250, editable: true },
    { field: "invoiceAmount", headerName: "Invoice Amount", width: 150, editable: true },
    { field: "recipient", headerName: "Recipient", width: 200, editable: true },
    { field: "amountPaid", headerName: "Amount Paid", width: 150, editable: true },
    { field: "accountDetails", headerName: "Account Details", width: 200, editable: true },
  ];

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={5}>
        <Typography variant="h5">Add Expense</Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            select
            fullWidth
            label="Type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            margin="normal"
          >
            {Object.keys(expenseTypes).map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label="Sub Type"
            name="subType"
            value={formData.subType}
            onChange={handleChange}
            margin="normal"
            disabled={!formData.type}
          >
            {formData.type && expenseTypes[formData.type].map((subType) => (
              <MenuItem key={subType} value={subType}>
                {subType}
              </MenuItem>
            ))}
          </TextField>

          <TextField fullWidth label="Expense Detail" name="detail" value={formData.detail} onChange={handleChange} margin="normal" />

          <FileUpload onDrop={handleDrop} />

          <TextField fullWidth label="Invoice Amount" name="invoiceAmount" value={formData.invoiceAmount} onChange={handleChange} margin="normal" />
          <TextField
            select
            fullWidth
            label="Invoice Recipient"
            name="recipient"
            value={formData.recipient}
            onChange={handleChange}
            margin="normal"
          >
            {invoiceRecipients.map((recip) => (
              <MenuItem key={recip} value={recip}>
                {recip}
              </MenuItem>
            ))}
          </TextField>

          <TextField fullWidth label="Amount Paid" name="amountPaid" value={formData.amountPaid} onChange={handleChange} margin="normal" />
          <TextField fullWidth label="Account Details" name="accountDetails" value={formData.accountDetails} onChange={handleChange} margin="normal" />

          <Button type="submit" variant="contained" color="primary" fullWidth>
            Submit
          </Button>
        </form>
      </Grid>

      <Grid item xs={12} md={7}>
        <Typography variant="h5">Expenses Overview</Typography>
        <DataGrid
          rows={expenses}
          columns={columns}
          loading={loading}
          checkboxSelection
          disableSelectionOnClick
          autoHeight
        />
      </Grid>
    </Grid>
  );
}