export const API_BASE_URL = 'https://processing-facility-backend.onrender.com';

export const INVENTORY_CATEGORIES = ['LAIN-LAIN', 'PERLENGKAPAN KANTOR'];

export const INVENTORY_REMARKS = ['PEMBELIAN', 'PENGGUNAAN'];

export const INVENTORY_LOCATIONS = ['BALI'];

export const INVENTORY_PROJECTS = ['PROCESSING FACILITY'];

export const INVENTORY_UNITS = ['Gram', 'PCS', 'ROLL'];

export const INVENTORY_PIC_PRESETS = ['HARIS'];

export function todayDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function formatStockQuantity(value, unit) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  const isGram = String(unit || '').toLowerCase() === 'gram';
  const fractionDigits = isGram ? 3 : n % 1 === 0 ? 0 : 2;
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(n);
}

export function formatTransactionDateDisplay(value) {
  if (!value) return '';
  const s = String(value).slice(0, 10);
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return s;
  const [, y, mo, d] = match;
  return `${Number(d)}/${Number(mo)}/${y}`;
}

export const DEFAULT_PAGE_SIZE = 100;
