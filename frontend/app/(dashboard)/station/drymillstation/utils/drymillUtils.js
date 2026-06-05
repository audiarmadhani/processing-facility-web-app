export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://processing-facility-backend.onrender.com';

export function formatProducerLabel(producer) {
  if (!producer || producer === 'N/A') return 'N/A';
  if (producer === 'HQ') return 'HEQA';
  return producer;
}

export function batchUniqueId(batch) {
  return `${batch.batchNumber},${batch.producer},${batch.processingType}`;
}

export function normalizeStatus(status) {
  return typeof status === 'string' ? status.trim() : status;
}

export function hasExitedDryMill(row) {
  const exited = row?.dryMillExited;
  return exited != null && exited !== false && exited !== '';
}

export function isBatchMerged(row) {
  const merged = row?.dryMillMerged;
  return merged === 'Merged' || merged === true;
}

export function isActiveDryMillBatch(row) {
  return normalizeStatus(row?.status) === 'In Dry Mill';
}

export function canSelectForMerge(row) {
  return (
    isActiveDryMillBatch(row) &&
    row.dryMillEntered &&
    !hasExitedDryMill(row) &&
    !row.storedDate &&
    !isBatchMerged(row)
  );
}

export function mapParentBatch(batch) {
  const producer = batch.producer || 'N/A';
  return {
    batchNumber: batch.batchNumber,
    experimentNumber: batch.experimentNumber ?? null,
    status: batch.status,
    dryMillEntered: batch.dryMillEntered,
    dryMillExited: batch.dryMillExited,
    cherry_weight: parseFloat(batch.cherry_weight || 0).toFixed(2),
    drying_weight: parseFloat(batch.drying_weight || 0).toFixed(2),
    producer,
    producerLabel: formatProducerLabel(producer),
    farmerName: batch.farmerName || 'N/A',
    productLine: batch.productLine || 'N/A',
    processingType: batch.processingType,
    totalBags: batch.totalBags || '0',
    notes: batch.notes || 'N/A',
    type: batch.type || 'N/A',
    farmVarieties: batch.farmVarieties || 'N/A',
    storedDate: batch.storeddatetrunc || null,
    batchType: batch.batchType || 'Cherry',
    lotNumber:
      batch.lotNumber === 'ID-BTM-A-N-AS' && !batch.dryMillExited
        ? 'ID-BTM-A-N'
        : batch.lotNumber,
    referenceNumber: batch.referenceNumber || 'N/A',
    dryMillMerged: batch.dryMillMerged === true ? 'Merged' : 'Not Merged',
    latestMoisture: null,
    id: `${batch.batchNumber}__${producer}__${batch.processingType}`,
  };
}

/** Map batchNumber -> latest DryingMeasurements row from /drying-measurements/latest */
export function indexDryingMeasurementsByBatch(measurements) {
  const map = {};
  (measurements || []).forEach((row) => {
    if (row?.batchNumber) map[row.batchNumber] = row;
  });
  return map;
}

/** Most recent moisture reading across one or more batch numbers (e.g. merge originals). */
export function pickLatestMoistureAcrossBatches(batchNumbers, measurementsByBatch) {
  if (!batchNumbers?.length) return null;

  let bestMoisture = null;
  let bestTime = -Infinity;

  for (const bn of batchNumbers) {
    const rec = measurementsByBatch[bn];
    if (!rec || rec.moisture == null || rec.moisture === '') continue;

    const dateStr = rec.measurement_date || rec.created_at;
    const t = dateStr ? new Date(dateStr).getTime() : 0;
    const time = Number.isNaN(t) ? 0 : t;

    if (time > bestTime) {
      bestTime = time;
      bestMoisture = rec.moisture;
    }
  }

  if (bestMoisture == null) return null;
  const num = parseFloat(bestMoisture);
  return Number.isNaN(num) ? null : num;
}

export function mapSubBatch(batch) {
  const producer = batch.producer || 'N/A';
  return {
    id: `${batch.batchNumber}__${producer}__${batch.processingType}`,
    batchNumber: batch.batchNumber,
    status: batch.status,
    dryMillEntered: batch.dryMillEntered,
    dryMillExited: batch.dryMillExited,
    storedDate: batch.storeddatetrunc || 'N/A',
    weight: parseFloat(batch.weight || 0).toFixed(2),
    producer,
    producerLabel: formatProducerLabel(producer),
    farmerName: batch.farmerName || 'N/A',
    productLine: batch.productLine || 'N/A',
    processingType: batch.processingType,
    quality: batch.quality || 'N/A',
    totalBags: batch.totalBags || '0',
    notes: batch.notes || 'N/A',
    type: batch.type || 'N/A',
    parentBatchNumber: batch.parentBatchNumber || batch.batchNumber,
    lotNumber: batch.lotNumber,
    referenceNumber: batch.referenceNumber || 'N/A',
    bagWeights: batch.bagDetails || [],
  };
}

export function stepPrefsKey(batch) {
  if (!batch?.batchNumber || !batch?.processingType) return null;
  return `drymill-steps-${batch.batchNumber}-${batch.processingType}`;
}

export function loadStepPrefs(batch) {
  const key = stepPrefsKey(batch);
  if (!key || typeof window === 'undefined') {
    return { skipHuller: false, skipSizer: false, skipHandpicking: false };
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { skipHuller: false, skipSizer: false, skipHandpicking: false };
    return { skipHuller: false, skipSizer: false, skipHandpicking: false, ...JSON.parse(raw) };
  } catch {
    return { skipHuller: false, skipSizer: false, skipHandpicking: false };
  }
}

export function saveStepPrefs(batch, prefs) {
  const key = stepPrefsKey(batch);
  if (!key || typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(prefs));
}

export function getProcessStatusLabel(stepStatus) {
  if (!stepStatus) return 'Not started';
  if (stepStatus.handpicking) return 'Handpick Done';
  if (stepStatus.sizer) return 'Sizer Done';
  if (stepStatus.suton) return 'Suton Done';
  if (stepStatus.huller) return 'Huller Done';
  return 'Not started';
}

export function getProcessStatusColor(stepStatus) {
  if (!stepStatus) return 'default';
  if (stepStatus.handpicking) return 'success';
  if (stepStatus.sizer || stepStatus.suton) return 'warning';
  if (stepStatus.huller) return 'info';
  return 'default';
}

export function hasHullerDone(row, processStepStatus) {
  return Boolean(processStepStatus?.[row?.id]?.huller);
}

export function batchPipelineKey(batch) {
  if (!batch?.batchNumber || !batch?.processingType) return '';
  return `${batch.batchNumber}|${batch.processingType}`;
}

export function isMergedDryMillBatch(batch) {
  return Boolean(batch?.batchNumber?.endsWith('-MB'));
}

export function statusFromTrackWeightRows(rows) {
  const status = { huller: false, suton: false, sizer: false, handpicking: false };
  (rows || []).forEach((row) => {
    const step = row.processStep;
    if (step in status && parseFloat(row.totalWeight) > 0) {
      status[step] = true;
    }
  });
  return status;
}
