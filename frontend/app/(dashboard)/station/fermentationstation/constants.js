'use client';

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://processing-facility-backend.onrender.com';

export const FERMENTATION_ALLOWED_ROLES = ['admin', 'manager', 'staff'];

export const defaultProcessingTypes = [
  "Aerobic Natural", "Aerobic Pulped Natural", "Aerobic Washed",
  "Anaerobic Natural", "Anaerobic Pulped Natural", "Anaerobic Washed",
  "CM Natural", "CM Pulped Natural", "CM Washed",
  "Natural", "O2 Natural", "O2 Pulped Natural", "O2 Washed",
  "Pulped Natural", "Washed"
];

export const blueBarrelCodes = Array.from({ length: 50 }, (_, i) =>
  `BB-HQ-${String(i + 1).padStart(4, '0')}`
);

export const bucketCodes = Array.from({ length: 50 }, (_, i) =>
  `BUC-HQ-${String(i + 1).padStart(4, '0')}`
);

/** Fermentation vessel type for batches fermented in a bag (listed after buckets). */
export const BAG_TANK = 'Bag';

export const SHARED_TANKS = ['Biomaster', 'Carrybrew', 'Washing Track', BAG_TANK];

export const producers = ['HQ', 'BTM'];

export function isBarrelOrBucket(code) {
  return code?.startsWith('BB-') || code?.startsWith('BUC-');
}

export function isSharedTank(code) {
  return SHARED_TANKS.includes(code);
}

export function getRowTanks(row) {
  if (!row) return [];
  if (Array.isArray(row.tanks) && row.tanks.length) return row.tanks;
  if (!row.tank?.trim()) return [];
  return row.tank.split(',').map((t) => t.trim()).filter(Boolean);
}

export function tanksToDisplay(tanks) {
  if (!tanks?.length) return '';
  return tanks.join(', ');
}

/** Normalize Autocomplete multi-select with shared vs BB/BUC mutual exclusion. */
export function normalizeTanksSelection(newValue) {
  const selected = [...new Set((newValue || []).filter(Boolean))];
  if (!selected.length) return [];

  const last = selected[selected.length - 1];
  if (isSharedTank(last)) {
    return [last];
  }

  return selected.filter((t) => isBarrelOrBucket(t));
}

export function isTankOptionDisabled(option, currentTanks) {
  if (!currentTanks?.length) return false;
  const hasShared = currentTanks.some(isSharedTank);
  const hasBarrel = currentTanks.some(isBarrelOrBucket);

  if (hasShared) {
    return option !== currentTanks[0];
  }
  if (hasBarrel) {
    return isSharedTank(option);
  }
  return false;
}

export const accordionFormContentSx = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  width: { xs: '100%', md: 'calc(50% - 8px)' },
  maxWidth: '100%',
  marginInline: 'auto',
  gap: 2,
  alignItems: 'start',
  '& .MuiTextField-root': { margin: '0 !important' },
  '& .MuiAutocomplete-root': { margin: '0 !important' },
  '& .MuiFormControl-root': { margin: '0 !important' },
  '& .MuiTypography-root': { gridColumn: '1 / -1' },
};

export const accordionDetailsSx = {
  '& .MuiGrid-container': { justifyContent: 'center' },
  '& .MuiGrid-item': {
    flexBasis: '100% !important',
    maxWidth: { xs: '100% !important', md: 'calc(70% - 8px) !important' },
  },
  '& .MuiTextField-root': { marginTop: '0 !important', marginBottom: '0 !important' },
  '& .MuiAutocomplete-root': { marginTop: '0 !important', marginBottom: '0 !important' },
  '& .MuiFormControl-root': { marginTop: '0 !important', marginBottom: '0 !important' },
};
