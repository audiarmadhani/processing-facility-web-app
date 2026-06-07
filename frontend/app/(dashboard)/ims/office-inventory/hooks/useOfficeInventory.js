'use client';

import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL, todayDateInputValue } from '../constants';
import { generateOfficeInventoryReport } from '../utils/generateOfficeInventoryReport';

const emptyForm = () => ({
  movementType: 'IN',
  itemId: null,
  itemName: '',
  category: '',
  unit: '',
  quantity: '',
  transactionDate: todayDateInputValue(),
  pic: '',
  remarks: '',
  location: '',
  project: '',
  detail: '',
});

export function useOfficeInventory() {
  const [items, setItems] = useState([]);
  const [movements, setMovements] = useState([]);
  const [movementsTotal, setMovementsTotal] = useState(0);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportDate, setReportDate] = useState(todayDateInputValue());
  const [form, setForm] = useState(emptyForm);
  const [confirmOverstockOpen, setConfirmOverstockOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [searchItem, setSearchItem] = useState(null);
  const [searchMovements, setSearchMovements] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  const fetchItems = useCallback(async () => {
    setItemsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/office-inventory/items`);
      if (!response.ok) throw new Error('Failed to fetch items');
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      setItems([]);
      showSnackbar(error.message || 'Failed to fetch items', 'error');
    } finally {
      setItemsLoading(false);
    }
  }, [showSnackbar]);

  const fetchMovements = useCallback(async () => {
    setMovementsLoading(true);
    try {
      const params = new URLSearchParams({ limit: '5000', offset: '0' });
      const response = await fetch(
        `${API_BASE_URL}/api/office-inventory/movements?${params.toString()}`
      );
      if (!response.ok) throw new Error('Failed to fetch movements');
      const data = await response.json();
      setMovements(Array.isArray(data.rows) ? data.rows : []);
      setMovementsTotal(typeof data.total === 'number' ? data.total : data.rows?.length ?? 0);
    } catch (error) {
      setMovements([]);
      setMovementsTotal(0);
      showSnackbar(error.message || 'Failed to fetch movements', 'error');
    } finally {
      setMovementsLoading(false);
    }
  }, [showSnackbar]);

  const fetchItemMovementHistory = useCallback(
    async (item) => {
      if (!item?.id) {
        setSearchItem(null);
        setSearchMovements([]);
        return;
      }
      setSearchItem(item);
      setSearchLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/office-inventory/items/${item.id}/movement-history`
        );
        if (!response.ok) throw new Error('Failed to fetch item movement history');
        const data = await response.json();
        setSearchMovements(Array.isArray(data.rows) ? data.rows : []);
        if (data.item) setSearchItem(data.item);
      } catch (error) {
        setSearchMovements([]);
        showSnackbar(error.message || 'Failed to fetch item movement history', 'error');
      } finally {
        setSearchLoading(false);
      }
    },
    [showSnackbar]
  );

  useEffect(() => {
    fetchItems();
    fetchMovements();
  }, [fetchItems, fetchMovements]);

  const updateForm = useCallback((patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetForm = useCallback(() => {
    setForm(emptyForm());
  }, []);

  const selectItem = useCallback((item) => {
    if (!item) {
      updateForm({ itemId: null, itemName: '', category: '', unit: '' });
      return;
    }
    if (typeof item === 'string') {
      updateForm({
        itemId: null,
        itemName: item,
        category: '',
        unit: '',
      });
      return;
    }
    updateForm({
      itemId: item.id,
      itemName: item.name,
      category: item.category,
      unit: item.unit,
    });
  }, [updateForm]);

  const postMovement = useCallback(async () => {
    setSubmitting(true);
    try {
      const payload = {
        movementType: form.movementType,
        quantity: parseFloat(form.quantity),
        transactionDate: form.transactionDate,
        remarks: form.remarks || null,
        pic: form.pic || null,
        location: form.location || null,
        project: form.project || null,
        notes: form.detail?.trim() || null,
      };

      if (form.itemId) {
        payload.itemId = form.itemId;
      } else {
        payload.name = form.itemName.trim();
        payload.category = form.category.trim();
        payload.unit = form.unit.trim();
      }

      const response = await fetch(`${API_BASE_URL}/api/office-inventory/movements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to record movement');
      }

      showSnackbar('Movement recorded successfully');
      resetForm();
      await Promise.all([fetchItems(), fetchMovements()]);
      if (searchItem?.id && (form.itemId === searchItem.id || form.itemName === searchItem.name)) {
        await fetchItemMovementHistory(searchItem);
      }
    } catch (error) {
      showSnackbar(error.message || 'Failed to record movement', 'error');
    } finally {
      setSubmitting(false);
      setConfirmOverstockOpen(false);
    }
  }, [form, fetchItems, fetchMovements, resetForm, showSnackbar, searchItem, fetchItemMovementHistory]);

  const validateAndSubmit = useCallback(() => {
    const qty = parseFloat(form.quantity);
    if (!form.itemName.trim()) {
      showSnackbar('Item name is required', 'error');
      return;
    }
    if (!form.itemId && (!form.category.trim() || !form.unit.trim())) {
      showSnackbar('Category and unit are required for new items', 'error');
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      showSnackbar('Enter a valid quantity greater than 0', 'error');
      return;
    }
    if (!form.transactionDate) {
      showSnackbar('Transaction date is required', 'error');
      return;
    }

    if (form.movementType === 'OUT') {
      const selected = items.find((i) => i.id === form.itemId);
      const currentStock = selected ? Number(selected.currentStock) : 0;
      if (form.itemId && qty > currentStock) {
        setConfirmOverstockOpen(true);
        return;
      }
    }

    postMovement();
  }, [form, items, postMovement, showSnackbar]);

  const generateReport = useCallback(async () => {
    if (!reportDate) {
      showSnackbar('Select a report date', 'error');
      return;
    }
    setReportLoading(true);
    try {
      const params = new URLSearchParams({ date: reportDate });
      const response = await fetch(
        `${API_BASE_URL}/api/office-inventory/daily-report?${params.toString()}`
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch report data');
      }
      const data = await response.json();
      if (!data.rows || data.rows.length === 0) {
        showSnackbar('No movements on this date', 'warning');
        return;
      }
      generateOfficeInventoryReport(data.rows, reportDate);
    } catch (error) {
      showSnackbar(error.message || 'Failed to generate report', 'error');
    } finally {
      setReportLoading(false);
    }
  }, [reportDate, showSnackbar]);

  return {
    items,
    movements,
    movementsTotal,
    itemsLoading,
    movementsLoading,
    submitting,
    reportLoading,
    reportDate,
    setReportDate,
    form,
    updateForm,
    selectItem,
    validateAndSubmit,
    confirmOverstockOpen,
    setConfirmOverstockOpen,
    postMovement,
    generateReport,
    fetchItems,
    fetchMovements,
    searchItem,
    setSearchItem,
    searchMovements,
    searchLoading,
    fetchItemMovementHistory,
    snackbarOpen,
    setSnackbarOpen,
    snackbarMessage,
    snackbarSeverity,
  };
}
