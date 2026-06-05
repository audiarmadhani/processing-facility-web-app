'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  API_BASE_URL,
  isMergedDryMillBatch,
  loadStepPrefs,
  saveStepPrefs,
} from '../utils/drymillUtils';

export const PROCESS_STEPS = ['Huller', 'Suton', 'Sizer', 'Handpicking'];
export const GRADE_ORDER = [
  'Specialty Grade',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Asalan',
];

const STEP_LABELS = ['Huller', 'Suton', 'Sizer', 'Hand picking'];

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
    case 'Huller':
      return 'huller';
    case 'Suton':
      return 'suton';
    case 'Sizer':
      return 'sizer';
    case 'Handpicking':
      return 'handpicking';
    default:
      return label?.toLowerCase();
  }
};

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
  setHasUnsavedChanges,
  onProcessSaved,
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [processTables, setProcessTables] = useState(createEmptyProcessTables);
  const [skipHuller, setSkipHuller] = useState(false);
  const [skipSizer, setSkipSizer] = useState(false);
  const [skipHandpicking, setSkipHandpicking] = useState(false);
  const [yieldWarning, setYieldWarning] = useState(null);

  const dryingWeight = useMemo(
    () => parseFloat(selectedBatch?.drying_weight || 0),
    [selectedBatch]
  );

  const isMergedBatch = useMemo(
    () => isMergedDryMillBatch(selectedBatch),
    [selectedBatch]
  );

  const markDirty = useCallback(() => {
    setHasUnsavedChanges?.(true);
  }, [setHasUnsavedChanges]);

  const persistStepPrefs = useCallback(
    (prefs) => {
      if (selectedBatch) saveStepPrefs(selectedBatch, prefs);
    },
    [selectedBatch]
  );

  const initProcessTablesFromEvents = useCallback(async () => {
    if (!selectedBatch) return;

    const { batchNumber, processingType, producer } = selectedBatch;

    if (!batchNumber || !processingType || !producer) {
      return;
    }

    const res = await axios.get(
      `${API_BASE_URL}/api/drymill/track-weight/${batchNumber}/${producer}`,
      { params: { processingType } }
    );

    const base = createEmptyProcessTables();

    res.data.forEach((row) => {
      const step = row.processStep;
      const grade = row.grade;

      if (step === 'huller') {
        base.Huller.outputWeight = String(row.totalWeight);
        return;
      }

      const stepKey = capitalize(step);

      if (base[stepKey]?.grades && grade in base[stepKey].grades) {
        base[stepKey].grades[grade].weight = String(row.totalWeight);
      }
    });

    setProcessTables(base);
    setHasUnsavedChanges?.(false);
    onProcessSaved?.(selectedBatch.id, res.data);

    const hullerSaved = parseFloat(base.Huller.outputWeight) > 0;
    if (isMergedDryMillBatch(selectedBatch) && hullerSaved) {
      setActiveStep(1);
    }
  }, [selectedBatch, setHasUnsavedChanges, onProcessSaved]);

  useEffect(() => {
    if (active && selectedBatch) {
      const prefs = loadStepPrefs(selectedBatch);
      setSkipHuller(prefs.skipHuller);
      setSkipSizer(prefs.skipSizer);
      setSkipHandpicking(prefs.skipHandpicking);
      setActiveStep(0);
      setYieldWarning(null);
      initProcessTablesFromEvents();
    }
  }, [active, selectedBatch, initProcessTablesFromEvents]);

  const postProcessEvent = async (body) => {
    await axios.post(`${API_BASE_URL}/api/drymill/process-event`, body);
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
      await postProcessEvent({
        batchNumber: selectedBatch.batchNumber,
        processingType: selectedBatch.processingType,
        processStep: 'huller',
        producer: selectedBatch.producer,
        inputWeight: 0,
        outputWeight: parsed,
        operator: session?.user?.name || 'unknown',
        notes: `Huller output recorded via UI: ${parsed.toFixed(2)} kg`,
      });

      showSnackbar('Huller step saved.', 'success');
      setHasUnsavedChanges?.(false);
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

  const handleSaveAllGrades = async (procLabel) => {
    if (!selectedBatch) return;

    const grades = processTables?.[procLabel]?.grades || {};
    const toSave = GRADE_ORDER.filter((g) => {
      const w = grades[g]?.weight ?? '';
      const parsed = parseWeightInput(w);
      return !isNaN(parsed) && parsed > 0;
    });

    if (toSave.length === 0) {
      showSnackbar(`Enter at least one ${procLabel} grade weight.`, 'error');
      return;
    }

    for (const gradeName of toSave) {
      const parsed = parseWeightInput(grades[gradeName]?.weight);
      if (isNaN(parsed) || parsed <= 0) {
        showSnackbar(`Invalid weight for ${gradeName}.`, 'error');
        return;
      }
    }

    setIsLoading(true);
    try {
      const step = normalizeProcessStep(procLabel);
      for (const gradeName of toSave) {
        const parsed = parseWeightInput(grades[gradeName]?.weight);
        await postProcessEvent({
          batchNumber: selectedBatch.batchNumber,
          processingType: selectedBatch.processingType,
          processStep: step,
          producer: selectedBatch.producer,
          grade: gradeName,
          inputWeight: 0,
          outputWeight: parsed,
          operator: session?.user?.name || 'unknown',
          notes: `${procLabel} ${gradeName} recorded via UI: ${parsed.toFixed(2)} kg`,
        });
      }

      showSnackbar(`${procLabel} grades saved (${toSave.length}).`, 'success');
      setHasUnsavedChanges?.(false);
      await fetchDryMillData();
      await initProcessTablesFromEvents();
    } catch (err) {
      const message = err.response?.data?.error || `Failed to save ${procLabel} grades`;
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

  const sutonYieldBase = skipHuller || hullerTotal <= 0 ? dryingWeight : hullerTotal;

  const handpickYieldBase = useMemo(() => {
    if (!skipSizer && sizerTotal > 0) return sizerTotal;
    if (sutonTotal > 0) return sutonTotal;
    if (!skipHuller && hullerTotal > 0) return hullerTotal;
    return dryingWeight;
  }, [skipSizer, skipHuller, sizerTotal, sutonTotal, hullerTotal, dryingWeight]);

  useEffect(() => {
    if (!active) return;
    let stepTotal = 0;
    let priorTotal = 0;
    let stepName = '';

    if (activeStep === 1) {
      stepTotal = sutonTotal;
      priorTotal = sutonYieldBase;
      stepName = 'Suton';
    } else if (activeStep === 2 && !skipSizer) {
      stepTotal = sizerTotal;
      priorTotal = sutonTotal;
      stepName = 'Sizer';
    } else if (activeStep === 3 && !skipHandpicking) {
      stepTotal = handpickTotal;
      priorTotal = handpickYieldBase;
      stepName = 'Hand picking';
    } else {
      setYieldWarning(null);
      return;
    }

    if (!priorTotal || priorTotal <= 0 || stepTotal <= 0) {
      setYieldWarning(null);
      return;
    }
    if (stepTotal > priorTotal * 1.05) {
      setYieldWarning(
        `${stepName} subtotal (${stepTotal.toFixed(2)} kg) exceeds the previous step (${priorTotal.toFixed(2)} kg) by more than 5%.`
      );
    } else {
      setYieldWarning(null);
    }
  }, [
    active,
    activeStep,
    skipHuller,
    skipSizer,
    skipHandpicking,
    sutonTotal,
    sizerTotal,
    handpickTotal,
    sutonYieldBase,
    handpickYieldBase,
  ]);

  const handleSkipChange = (key, value) => {
    const next = {
      skipHuller: key === 'skipHuller' ? value : skipHuller,
      skipSizer: key === 'skipSizer' ? value : skipSizer,
      skipHandpicking: key === 'skipHandpicking' ? value : skipHandpicking,
    };
    if (key === 'skipHuller') setSkipHuller(value);
    if (key === 'skipSizer') setSkipSizer(value);
    if (key === 'skipHandpicking') setSkipHandpicking(value);
    persistStepPrefs(next);
  };

  const renderGradeStep = (proc) => {
    let stepTotal = 0;
    let stepYield = null;

    if (proc === 'Suton') {
      stepTotal = sutonTotal;
      stepYield = calcYield(sutonTotal, sutonYieldBase);
    }
    if (proc === 'Sizer') {
      stepTotal = sizerTotal;
      stepYield = calcYield(sizerTotal, sutonTotal);
    }
    if (proc === 'Handpicking') {
      stepTotal = handpickTotal;
      stepYield = calcYield(handpickTotal, handpickYieldBase);
    }

    const skipKey =
      proc === 'Sizer' ? 'skipSizer' : proc === 'Handpicking' ? 'skipHandpicking' : null;
    const skipped =
      proc === 'Sizer' ? skipSizer : proc === 'Handpicking' ? skipHandpicking : false;

    return (
      <Box>
        {skipKey && (
          <FormControlLabel
            control={
              <Checkbox
                checked={skipped}
                onChange={(e) => handleSkipChange(skipKey, e.target.checked)}
                disabled={isLoading}
              />
            }
            label={`Skip ${proc === 'Handpicking' ? 'hand picking' : proc} for this batch`}
            sx={{ mb: 1 }}
          />
        )}
        {skipped ? (
          <Typography variant="body2" color="text.secondary">
            This step is skipped. Use Next to continue.
          </Typography>
        ) : (
          <>
            <Table size="small" sx={{ mb: 1 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Grade</TableCell>
                  <TableCell>Yield (%)</TableCell>
                  <TableCell>Total Weight (kg)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {GRADE_ORDER.map((gradeName) => {
                  const value = processTables?.[proc]?.grades?.[gradeName]?.weight ?? '';
                  let yieldPct = null;
                  if (proc === 'Suton') {
                    yieldPct = calcYield(
                      toNumber(processTables.Suton.grades[gradeName]?.weight),
                      sutonYieldBase
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
                      handpickYieldBase
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
                            markDirty();
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
                    </TableRow>
                  );
                })}
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
                    <Typography fontWeight={700}>{stepTotal.toFixed(2)} kg</Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <Button
              variant="contained"
              onClick={() => handleSaveAllGrades(proc)}
              disabled={isLoading || !selectedBatch}
            >
              Save all {proc} grades
            </Button>
          </>
        )}
      </Box>
    );
  };

  const hullerLocked = isMergedBatch && hullerTotal > 0;

  const renderStepContent = () => {
    if (activeStep === 0) {
      return (
        <Box>
          {!isMergedBatch && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={skipHuller}
                  onChange={(e) => handleSkipChange('skipHuller', e.target.checked)}
                  disabled={isLoading}
                />
              }
              label="Skip Huller for this batch"
              sx={{ mb: 1 }}
            />
          )}
          {hullerLocked ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Huller output was carried forward from merged source batches.
              </Typography>
              <TextField
                label="Huller output (kg)"
                value={processTables.Huller.outputWeight || ''}
                type="number"
                size="small"
                fullWidth
                disabled
                sx={{ mb: 2 }}
              />
            </>
          ) : skipHuller ? (
            <Typography variant="body2" color="text.secondary">
              Suton yields will use drying weight ({dryingWeight.toFixed(2)} kg) as the base.
            </Typography>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Record total output weight after hulling.
              </Typography>
              <TextField
                label="Huller output (kg)"
                value={processTables.Huller.outputWeight || ''}
                onChange={(e) => {
                  markDirty();
                  setProcessTables((p) => ({
                    ...p,
                    Huller: { ...(p.Huller || {}), outputWeight: e.target.value },
                  }));
                }}
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                size="small"
                fullWidth
                disabled={isLoading || !selectedBatch}
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                onClick={handleSaveHullerOutput}
                disabled={isLoading || !selectedBatch}
              >
                Save Huller step
              </Button>
            </>
          )}
        </Box>
      );
    }

    if (activeStep === 1) return renderGradeStep('Suton');
    if (activeStep === 2) return renderGradeStep('Sizer');
    if (activeStep === 3) return renderGradeStep('Handpicking');

    return null;
  };

  const maxStep = STEP_LABELS.length - 1;

  return (
    <Box>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
        {STEP_LABELS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {yieldWarning && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {yieldWarning}
        </Alert>
      )}

      {renderStepContent()}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button disabled={activeStep === 0 || isLoading} onClick={() => setActiveStep((s) => s - 1)}>
          Back
        </Button>
        <Button
          variant="contained"
          disabled={activeStep >= maxStep || isLoading}
          onClick={() => setActiveStep((s) => Math.min(maxStep, s + 1))}
        >
          Next
        </Button>
      </Box>

      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
        Weights are saved per step. This page records process totals only, not bags or inventory.
      </Typography>
    </Box>
  );
}
