export const FARMER_API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  'https://processing-facility-backend.onrender.com/api';

export const bankOptions = [
  'Bank Mandiri', 'BRI', 'BCA', 'BNI', 'BTN', 'BSI',
  'CIMB Niaga', 'OCBC NISP', 'Permata Bank', 'Danamon', 'BPD Bali',
];

export const brokerOptions = ['Nyoman', 'Agus TS', 'Ketut Darpa', 'Kanggo'];

export const paymentMethodOptions = [
  'Bank Transfer to Farmer', 'Bank Transfer to Broker',
  'Cash to Farmer', 'Cash to Broker',
];

export const contractTypeOptions = ['Contract', 'Beli Putus'];

export const varietyOptions = {
  Arabica: ['Cobra', 'Yellow Caturra', 'Kopyol', 'S-795', 'USDA', 'Abbysinia'],
  Robusta: ['BP42', 'Huni'],
};

export const emptyFarmerForm = () => ({
  farmerName: '',
  farmerAddress: '',
  farmerContact: '',
  elevationMin: '',
  elevationMax: '',
  kabupaten: null,
  kecamatan: null,
  desa: null,
  farmerLandArea: '',
  contractType: '',
  farmType: '',
  farmVarieties: [],
  broker: '',
  paymentMethod: '',
  bankName: '',
  bankAccount: '',
  bankAccountName: '',
  latitude: '',
  longitude: '',
  notes: '',
});

export function farmerRowToForm(row) {
  const varieties = row.farmVarieties
    ? row.farmVarieties.split(',').map((v) => v.trim()).filter(Boolean)
    : [];
  return {
    farmerName: row.farmerName || '',
    farmerAddress: row.farmerAddress || '',
    farmerContact: row.farmerContact || '',
    elevationMin: row.elevationMin != null ? String(row.elevationMin) : '',
    elevationMax: row.elevationMax != null ? String(row.elevationMax) : '',
    kabupaten: row.kabupaten || null,
    kecamatan: row.kecamatan || null,
    desa: row.desa || null,
    farmerLandArea: row.farmerLandArea != null ? String(row.farmerLandArea) : '',
    contractType: row.contractType || '',
    farmType: row.farmType || '',
    farmVarieties: varieties,
    broker: row.broker || '',
    paymentMethod: row.paymentMethod || '',
    bankName: row.bankName || '',
    bankAccount: row.bankAccount || '',
    bankAccountName: row.bankAccountName || '',
    latitude: row.latitude != null ? String(row.latitude) : '',
    longitude: row.longitude != null ? String(row.longitude) : '',
    notes: row.notes || '',
  };
}

export function formToPayload(form) {
  return {
    farmerName: form.farmerName.trim(),
    desa: form.desa,
    kecamatan: form.kecamatan,
    kabupaten: form.kabupaten,
    farmerAddress: form.farmerAddress,
    bankAccount: form.bankAccount.trim() || null,
    bankName: form.bankName.trim() || null,
    bankAccountName: form.bankAccountName.trim() || null,
    farmerLandArea: form.farmerLandArea,
    farmerContact: form.farmerContact,
    elevationMin: form.elevationMin,
    elevationMax: form.elevationMax,
    latitude: form.latitude.trim() === '' ? null : parseFloat(form.latitude),
    longitude: form.longitude.trim() === '' ? null : parseFloat(form.longitude),
    farmType: form.farmType,
    notes: form.notes,
    farmVarieties: form.farmVarieties.join(', ') || null,
    contractType: form.contractType,
    broker: form.broker || null,
    paymentMethod: form.paymentMethod,
  };
}

export function validateFarmerForm(form) {
  if (!form.farmerName?.trim() || !form.farmerAddress?.trim() || !form.farmerContact?.trim() ||
      !form.farmerLandArea || !form.farmType || !form.contractType || !form.paymentMethod) {
    return 'Please fill all required fields.';
  }
  const elevMin = parseFloat(form.elevationMin);
  const elevMax = parseFloat(form.elevationMax);
  if (!Number.isFinite(elevMin) || !Number.isFinite(elevMax)) {
    return 'Elevation min and max are required.';
  }
  if (elevMin < 0 || elevMax < 0) {
    return 'Elevation must be non-negative.';
  }
  if (elevMin > elevMax) {
    return 'Elevation min must be less than or equal to max.';
  }
  if (['Bank Transfer to Farmer', 'Bank Transfer to Broker'].includes(form.paymentMethod) &&
      (!form.bankAccount?.trim() || !form.bankName?.trim())) {
    return 'Bank account and bank name are required for bank transfer methods.';
  }
  return null;
}
