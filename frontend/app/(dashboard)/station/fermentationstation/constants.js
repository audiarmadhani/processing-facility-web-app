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

export const producers = ['HQ', 'BTM'];

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
