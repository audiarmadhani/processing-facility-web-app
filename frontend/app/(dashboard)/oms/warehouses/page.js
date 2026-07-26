'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { useSession } from 'next-auth/react';

const OMS_API_BASE = 'https://processing-facility-backend.onrender.com/api';

const emptyForm = {
  name: '',
  company_name: 'PT. BERKAS TUAIAN MELIMPAH',
  address: '',
  phone: '',
  is_default: false,
};

export default function WarehousesPage() {
  const { data: session, status } = useSession();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const allowed =
    session?.user &&
    ['admin', 'manager', 'oms'].includes(session.user.role);

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${OMS_API_BASE}/warehouses`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setWarehouses(Array.isArray(data) ? data : []);
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed to load warehouses: ${err.message}`,
        severity: 'error',
      });
      setWarehouses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && allowed) fetchWarehouses();
  }, [status, allowed]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      name: row.name || '',
      company_name: row.company_name || '',
      address: row.address || '',
      phone: row.phone || '',
      is_default: Boolean(row.is_default),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.company_name.trim() || !form.address.trim()) {
      setSnackbar({
        open: true,
        message: 'Name, company name, and address are required.',
        severity: 'warning',
      });
      return;
    }
    setSaving(true);
    try {
      const url = editing
        ? `${OMS_API_BASE}/warehouses/${editing.id}`
        : `${OMS_API_BASE}/warehouses`;
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          company_name: form.company_name.trim(),
          address: form.address.trim(),
          phone: form.phone.trim() || null,
          is_default: form.is_default,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || (await res.text()));
      }
      setDialogOpen(false);
      setSnackbar({
        open: true,
        message: editing ? 'Warehouse updated.' : 'Warehouse created.',
        severity: 'success',
      });
      await fetchWarehouses();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message || 'Failed to save warehouse',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(
    () => [
      { field: 'name', headerName: 'Name', width: 140 },
      { field: 'company_name', headerName: 'Company', width: 220 },
      { field: 'address', headerName: 'Address', flex: 1, minWidth: 240 },
      { field: 'phone', headerName: 'Phone', width: 160 },
      {
        field: 'is_default',
        headerName: 'Default',
        width: 100,
        valueGetter: (value) => (value ? 'Yes' : 'No'),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 120,
        sortable: false,
        renderCell: (params) => (
          <Button size="small" onClick={() => openEdit(params.row)}>
            Edit
          </Button>
        ),
      },
    ],
    []
  );

  if (status === 'loading') return <p>Loading...</p>;
  if (!allowed) {
    return (
      <Typography variant="h6">
        Access Denied. You do not have permission to view this page.
      </Typography>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Warehouses
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Shipping-from addresses used on DO, Surat Jalan, and BAST PDFs.
          </Typography>
        </Box>
        <Button variant="contained" onClick={openCreate}>
          Add warehouse
        </Button>
      </Box>

      <DataGrid
        rows={warehouses}
        columns={columns}
        getRowId={(row) => row.id}
        loading={loading}
        autoHeight
        pageSizeOptions={[10, 25, 50]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        slots={{ toolbar: GridToolbar }}
        disableRowSelectionOnClick
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit warehouse' : 'Add warehouse'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            fullWidth
            helperText="Short label, e.g. Bali, Jakarta"
            sx={{ mt: 1 }}
          />
          <TextField
            label="Company name"
            value={form.company_name}
            onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
            required
            fullWidth
          />
          <TextField
            label="Address"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            required
            fullWidth
            multiline
            minRows={2}
          />
          <TextField
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            fullWidth
            helperText='Shown on PDF header, e.g. "Telp. 085175027797"'
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={form.is_default}
                onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))}
              />
            }
            label="Default warehouse (preselected when generating documents)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
