import dayjs from 'dayjs';

export function formatIdr(value) {
  if (value == null || isNaN(value)) return 'N/A';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatReceivingDate(value) {
  return value ? dayjs(value).format('DD-MM-YYYY HH:mm:ss') : 'N/A';
}
