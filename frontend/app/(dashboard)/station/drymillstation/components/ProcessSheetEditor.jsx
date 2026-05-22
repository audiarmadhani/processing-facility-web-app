'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Box, Button, TextField, Typography, Table, TableBody, TableCell, TableHead, TableRow,
} from '@mui/material';

export const PROCESS_STEPS = ['Huller', 'Suton', 'Sizer', 'Handpicking'];
export const GRADE_ORDER = ['Specialty Grade', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Asalan'];

const createEmptyProcessTables = () => {
  const base = {
    Huller: { outputWeight: '' },
    Suton: { grades: {} },
    Sizer: { grades: {} },
    Handpicking: { grades: {} },
  };

  GRADE_ORDER.forEach((g) => {
    base.Suton.grades[g] = { weight: '' };
    base.Sizer.grades[g] = { weight: '' };
    base.Handpicking.grades[g] = { weight: '' };
  });

  return base;
};

const capitalize = (s) =>
  typeof s === 'string' ? s.charAt(0).toUpperCase() + s.slice(1) : s;

const normalizeProcessStep = (label) => {
  switch (label) {
    case 'Huller': return 'huller';
    case 'Suton': return 'suton';
    case 'Sizer': return 'sizer';
    case 'Handpicking': return 'handpicking';
    default: return label?.toLowerCase();
  }
};

// ---------- Yield helpers ----------
const parseWeightInput = (v) => {
  const normalized = String(v ?? '').trim().replace(',', '.');
  if (!normalized) return NaN;
  const n = parseFloat(normalized);
  return isNaN(n) ? NaN : n;
};

const toNumber = (v) => {
  const n = parseWeightInput(v);
  return isNaN(n) ? 0 : n;
};

const sumGrades = (grades = {}) =>
  Object.values(grades).reduce((sum, g) => sum + toNumber(g.weight), 0);

const calcYield = (num, denom) => {
  if (!denom || denom <= 0) return null;
  return (num / denom) * 100;
};

export default function ProcessSheetEditor({
  active,
  selectedBatch,
  session,
  isLoading,
  setIsLoading,
  showSnackbar,
  logError,
  fetchDryMillData,
}) {
  const [processTables, setProcessTables] = useState({
    Huller: { outputWeight: '' },
    Suton: { grades: {} },
    Sizer: { grades: {} },
    Handpicking: { grades: {} },
  });

const initProcessTablesFromEvents = useCallback(async () => {
  if (!selectedBatch) return;

  const { batchNumber, processingType, producer } = selectedBatch;

  if (!batchNumber || !processingType || !producer) {
    console.error("batchNumber, processingType, and producer are required");
    return;
  }

  const res = await axios.get(
    `https://processing-facility-backend.onrender.com/api/drymill/track-weight/${batchNumber}/${producer}`,
    {
      params: { processingType }
    }
  );

  const base = createEmptyProcessTables();

  res.data.forEach((row) => {
    const step = row.processStep;
    const grade = row.grade;

    if (step === "huller") {
      base.Huller.outputWeight = String(row.totalWeight);
      return;
    }

    const stepKey = capitalize(step);

    if (base[stepKey]?.grades && grade in base[stepKey].grades) {
      base[stepKey].grades[grade].weight = String(row.totalWeight);
    }
  });

  setProcessTables(base);

}, [selectedBatch]);

// Re-init table whenever dialog opens
useEffect(() => {
  if (active) {
    initProcessTablesFromEvents();
  }
}, [active, initProcessTablesFromEvents]);

  const handleSaveProcessGrade = async (procLabel, gradeName) => {
    if (!selectedBatch) return;

    const step = normalizeProcessStep(procLabel);
    const valueStr = processTables?.[procLabel]?.grades?.[gradeName]?.weight ?? '';
    const parsed = parseWeightInput(valueStr);

    if (isNaN(parsed) || parsed <= 0) {
      showSnackbar('Enter a valid positive weight.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://processing-facility-backend.onrender.com'}/api/drymill/process-event`,
        {
          batchNumber: selectedBatch.batchNumber,
          processingType: selectedBatch.processingType,
          processStep: step,
          producer: selectedBatch.producer,
          grade: gradeName,
          inputWeight: 0,
          outputWeight: parsed,
          operator: session?.user?.name || 'unknown',
          notes: `${procLabel} ${gradeName} recorded via UI: ${parsed.toFixed(2)} kg`,
        }
      );

      showSnackbar(`Saved ${procLabel} - ${gradeName}`, 'success');

      await initProcessTablesFromEvents();
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to save process grade';
      logError(message, err);
      showSnackbar(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

const handleSaveHullerOutput = async () => {
  if (!selectedBatch) {
    showSnackbar('Batch missing.', 'error');
    return;
  }
  const outStr = processTables?.Huller?.outputWeight || '';
  const parsed = parseWeightInput(outStr);
  if (isNaN(parsed) || parsed <= 0) {
    showSnackbar('Enter a valid positive huller output weight.', 'error');
    return;
  }

  setIsLoading(true);
  try {
    await axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://processing-facility-backend.onrender.com'}/api/drymill/process-event`,
      {
        batchNumber: selectedBatch.batchNumber,
        processingType: selectedBatch.processingType,
        processStep: 'huller',
        producer: selectedBatch.producer,
        inputWeight: 0,
        outputWeight: parsed,
        operator: session?.user?.name || 'unknown',
        notes: `Huller output recorded via UI: ${parsed.toFixed(2)} kg`
      }
    );

    showSnackbar('Recorded Huller output.', 'success');
    await fetchDryMillData();
    await initProcessTablesFromEvents();
  } catch (err) {
    const message = err.response?.data?.error || 'Failed to record huller output';
    logError(message, err);
    showSnackbar(message, 'error');
  } finally {
    setIsLoading(false);
  }
};

  const hullerTotal = toNumber(processTables.Huller.outputWeight);
  const sutonTotal = sumGrades(processTables.Suton.grades);
  const sizerTotal = sumGrades(processTables.Sizer.grades);
  const handpickTotal = sumGrades(processTables.Handpicking.grades);

  return (
    <>
    <Typography variant="h6" gutterBottom>Track Weight — Sheet View</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
      Edit the total weight for each step. Huller only needs a single output total. Other steps take per-grade totals.
    </Typography>

    {/* HULLER: single total row */}
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1">Huller (output)</Typography>
      <Table size="small" sx={{ mb: 1 }}>
        <TableHead>
          <TableRow>
            <TableCell>Step</TableCell>
            <TableCell>Output Weight (kg)</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>Huller</TableCell>
            <TableCell>
              <TextField
                value={processTables.Huller.outputWeight || ''}
                onChange={(e) => setProcessTables((p) => ({ ...p, Huller: { ...(p.Huller || {}), outputWeight: e.target.value } }))}
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                size="small"
                fullWidth
                disabled={isLoading || !selectedBatch}
              />
            </TableCell>
            <TableCell>
              <Button variant="contained" size="small" onClick={handleSaveHullerOutput} disabled={isLoading || !selectedBatch}>Save</Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Box>

    {/* Suton / Sizer / Handpicking - each a small sheet of grades */}
    {['Suton', 'Sizer', 'Handpicking'].map((proc) => {
      // ---- STEP TOTALS ----
      let stepTotal = 0;
      let stepYield = null;

      if (proc === 'Suton') {
        stepTotal = sutonTotal;
        stepYield = calcYield(sutonTotal, hullerTotal);
      }

      if (proc === 'Sizer') {
        stepTotal = sizerTotal;
        stepYield = calcYield(sizerTotal, sutonTotal);
      }

      if (proc === 'Handpicking') {
        stepTotal = handpickTotal;
        stepYield = calcYield(handpickTotal, sizerTotal);
      }

      return (
        <Box key={proc} sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>{proc}</Typography>
          <Table size="small" sx={{ mb: 1 }}>
            <TableHead>
              <TableRow>
                <TableCell>Grade</TableCell>
                <TableCell>Yield (%)</TableCell>
                <TableCell>Total Weight (kg)</TableCell>
                <TableCell width={150}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {GRADE_ORDER.map((gradeName) => {
                const value = processTables?.[proc]?.grades?.[gradeName]?.weight ?? '';
              
                let yieldPct = null;
                if (proc === 'Suton') {
                  yieldPct = calcYield(
                    toNumber(processTables.Suton.grades[gradeName]?.weight),
                    hullerTotal
                  );
                }

                if (proc === 'Sizer') {
                  yieldPct = calcYield(
                    toNumber(processTables.Sizer.grades[gradeName]?.weight),
                    sutonTotal
                  );
                }

                if (proc === 'Handpicking') {
                  yieldPct = calcYield(
                    toNumber(processTables.Handpicking.grades[gradeName]?.weight),
                    sizerTotal
                  );
                }
                
                return (
                  <TableRow key={`${proc}-${gradeName}`}>
                    <TableCell>{gradeName}</TableCell>

                    <TableCell align="right">
                      <Typography variant="body2" color="text.secondary">
                        {yieldPct !== null ? `${yieldPct.toFixed(1)} %` : '–'}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <TextField
                        value={value}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setProcessTables((prev) => ({
                            ...prev,
                            [proc]: {
                              ...prev[proc],
                              grades: {
                                ...prev[proc].grades,
                                [gradeName]: {
                                  ...prev[proc].grades[gradeName],
                                  weight: newValue,
                                },
                              },
                            },
                          }));
                        }}
                        size="small"
                        type="number"
                        inputProps={{ min: 0, step: 0.01 }}
                        fullWidth
                        disabled={isLoading || !selectedBatch}
                      />
                    </TableCell>

                    <TableCell>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleSaveProcessGrade(proc, gradeName)}
                        disabled={isLoading || !selectedBatch}
                      >
                        Save
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {/* SUBTOTAL ROW */}
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell>
                  <Typography fontWeight={700}>Subtotal</Typography>
                </TableCell>

                <TableCell align="right">
                  <Typography fontWeight={700}>
                    {stepYield !== null ? `${stepYield.toFixed(1)} %` : '–'}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography fontWeight={700}>
                    {stepTotal.toFixed(2)} kg
                  </Typography>
                </TableCell>

                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      );
    })}

    <Box sx={{ mt: 1 }}>
      <Typography variant="body2">Notes:</Typography>
      <Typography variant="caption" color="text.secondary">
        - Each save records a process event (audit log).
        - This screen tracks totals only, not bags or inventory.
        - Final grading & storage are handled after processing is complete.
      </Typography>
    </Box>
    </>
  );
}
