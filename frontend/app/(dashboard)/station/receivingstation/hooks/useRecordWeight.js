'use client';

import { useState, useCallback } from 'react';
import { apiUrl } from '../../_shared/config';

export function useRecordWeight({ session, onSaved, showSuccess, showError }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [bagCountInput, setBagCountInput] = useState('1');
  const [bagWeights, setBagWeights] = useState(['']);
  const [totalWeight, setTotalWeight] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const resetBagState = useCallback((count = 1, weights = ['']) => {
    setBagCountInput(String(count));
    setBagWeights(weights);
    const total = weights.reduce((sum, w) => sum + parseFloat(w || 0), 0);
    setTotalWeight(total);
  }, []);

  const openRecordWeight = useCallback(async (row) => {
    if (!row?.batchNumber) return;
    setSelectedBatch(row);
    setDialogOpen(true);
    setLoading(true);

    try {
      const response = await fetch(apiUrl(`/receiving/${encodeURIComponent(row.batchNumber)}/bags`));
      if (!response.ok) {
        throw new Error('Failed to load bag weights');
      }
      const data = await response.json();
      if (data.bags?.length > 0) {
        const weights = data.bags
          .sort((a, b) => a.bagNumber - b.bagNumber)
          .map((b) => String(b.weight));
        resetBagState(weights.length, weights);
      } else {
        resetBagState(1, ['']);
      }
    } catch (error) {
      console.error('Error loading bag weights:', error);
      showError?.('Failed to load bag weights.');
      resetBagState(1, ['']);
    } finally {
      setLoading(false);
    }
  }, [resetBagState, showError]);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setSelectedBatch(null);
    resetBagState(1, ['']);
  }, [resetBagState]);

  const handleBagWeightChange = (index, value) => {
    const updated = [...bagWeights];
    updated[index] = value;
    setBagWeights(updated);
    const total = updated.reduce((sum, w) => sum + parseFloat(w || 0), 0);
    setTotalWeight(total);
  };

  const handleBagCountInputChange = (e) => {
    setBagCountInput(e.target.value);
  };

  const handleBagCountBlur = () => {
    const parsedValue = parseInt(bagCountInput, 10);
    const newValue = isNaN(parsedValue) || parsedValue < 1 ? 1 : parsedValue;
    setBagCountInput(newValue.toString());

    if (newValue > bagWeights.length) {
      setBagWeights([...bagWeights, ...Array(newValue - bagWeights.length).fill('')]);
    } else {
      setBagWeights(bagWeights.slice(0, newValue));
    }
  };

  const handleSave = async () => {
    if (!session?.user?.name) {
      showError?.('No user session found.');
      return;
    }
    if (!selectedBatch?.batchNumber) {
      showError?.('No batch selected.');
      return;
    }
    if (bagWeights.some((w) => !w || parseFloat(w) <= 0)) {
      showError?.('Please enter valid weights for all bags.');
      return;
    }

    const bagPayload = bagWeights.map((weight, index) => ({
      bagNumber: index + 1,
      weight: parseFloat(weight),
    }));

    setSaving(true);
    try {
      const response = await fetch(
        apiUrl(`/receiving/${encodeURIComponent(selectedBatch.batchNumber)}/weights`),
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bagPayload,
            updatedBy: session.user.name,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save weights');
      }

      showSuccess?.(`Weights recorded for batch ${selectedBatch.batchNumber}`);
      closeDialog();
      onSaved?.();
    } catch (error) {
      console.error('Error saving weights:', error);
      showError?.(error.message || 'Failed to save weights.');
    } finally {
      setSaving(false);
    }
  };

  const isPendingWeight = (row) => {
    const w = parseFloat(row?.weight);
    const bags = parseInt(row?.totalBags, 10);
    return (!w || w <= 0) || (!bags || bags <= 0);
  };

  return {
    dialogOpen,
    selectedBatch,
    bagCountInput,
    bagWeights,
    totalWeight,
    loading,
    saving,
    openRecordWeight,
    closeDialog,
    handleBagWeightChange,
    handleBagCountInputChange,
    handleBagCountBlur,
    handleSave,
    isPendingWeight,
  };
}
