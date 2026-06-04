'use client';

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const WITA_TZ = 'Asia/Makassar';

function displayValue(value) {
  if (value === undefined || value === null || value === '') return 'N/A';
  return String(value);
}

function formatWeightKg(value) {
  if (value === undefined || value === null || value === '') return 'N/A';
  const num = parseFloat(value);
  if (Number.isNaN(num)) return displayValue(value);
  return num.toFixed(2);
}

function formatMoisturePercent(value) {
  if (value === undefined || value === null || value === '') return 'N/A';
  const num = parseFloat(value);
  if (Number.isNaN(num)) return displayValue(value);
  return `${num.toFixed(1)}%`;
}

function formatBatchNumbers(batchNumbers) {
  if (!batchNumbers || batchNumbers.length === 0) return 'N/A';
  if (batchNumbers.length === 1) return batchNumbers[0];
  return batchNumbers.join(', ');
}

export function orderSheetFilename(batchNumber) {
  const safe = (batchNumber || 'Untitled').trim().replace(/[^\w.-]+/g, '_');
  return `Dry_Mill_Order_Sheet_${safe}.pdf`;
}

function formatNowWita() {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: WITA_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
    .format(new Date())
    .replace(',', '');
}

export function buildDryMillOrderSheetFields(payload) {
  const dateValue = payload.date || formatNowWita();
  const batchNumbers = payload.batchNumbers?.length
    ? payload.batchNumbers
    : payload.batchNumber
      ? [payload.batchNumber]
      : [];

  return [
    { label: 'Date', value: displayValue(dateValue) },
    { label: 'Batch number(s)', value: formatBatchNumbers(batchNumbers) },
    { label: 'Processing type', value: displayValue(payload.processingType) },
    { label: 'Producer', value: displayValue(payload.producer) },
    { label: 'Farmer name', value: displayValue(payload.farmerName) },
    { label: 'Farm varieties', value: displayValue(payload.farmVarieties) },
    { label: 'Type', value: displayValue(payload.type) },
    { label: 'Drying weight (kg)', value: formatWeightKg(payload.dryingWeight) },
    { label: 'Latest moisture (%)', value: formatMoisturePercent(payload.latestMoisture) },
  ];
}

export function generateDryMillOrderSheet(payload) {
  const doc = new jsPDF();
  const fields = buildDryMillOrderSheetFields(payload);
  const filenameBatch =
    payload.batchNumber ||
    (payload.batchNumbers?.length ? payload.batchNumbers[0] : 'Untitled');

  doc.setFontSize(18);
  doc.text('HEQA Dry Mill Order Sheet', 105, 20, { align: 'center' });

  doc.autoTable({
    startY: 30,
    head: [['Label', 'Value']],
    body: fields.map((field) => [field.label, field.value]),
    styles: { fontSize: 10, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 100 },
    },
    margin: { left: 20, right: 20 },
  });

  doc.save(orderSheetFilename(filenameBatch));
}

export function generateDryMillOrderSheetFromRow(row, options = {}) {
  const batchNumbers =
    options.batchNumbers?.length > 0
      ? options.batchNumbers
      : row.batchNumber
        ? [row.batchNumber]
        : [];

  generateDryMillOrderSheet({
    batchNumber: row.batchNumber,
    batchNumbers,
    processingType: row.processingType,
    producer: row.producerLabel || row.producer,
    farmerName: row.farmerName,
    farmVarieties: row.farmVarieties,
    type: row.type,
    dryingWeight: options.dryingWeight ?? row.drying_weight,
    latestMoisture: options.latestMoisture ?? row.latestMoisture,
    date: options.date,
  });
}
