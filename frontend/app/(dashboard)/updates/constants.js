export const UPDATE_STATIONS = [
  'Receiving',
  'Cherry QC',
  'Fermentation',
  'Processing',
  'Wet Mill',
  'Drying',
  'Dry Mill',
  'GB QC',
  'Farmers',
];

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  'https://processing-facility-backend.onrender.com';
