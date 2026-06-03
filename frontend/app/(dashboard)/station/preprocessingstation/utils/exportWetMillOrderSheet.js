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

export function orderSheetFilename(batchNumber) {
  const safe = (batchNumber || 'Untitled').trim().replace(/[^\w.-]+/g, '_');
  return `Wet_Mill_Order_Sheet_${safe}.pdf`;
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
  }).format(new Date()).replace(',', '');
}

export function buildWetMillOrderSheetFields(payload) {
  const dateValue = payload.date || payload.startProcessingDate || formatNowWita();

  return [
    { label: 'Date', value: displayValue(dateValue) },
    { label: 'Batch number', value: displayValue(payload.batchNumber) },
    { label: 'Farmer name', value: displayValue(payload.farmerName) },
    { label: 'Lot number', value: displayValue(payload.lotNumber) },
    { label: 'Reference number', value: displayValue(payload.referenceNumber) },
    { label: 'Date received', value: displayValue(payload.receivingDate) },
    { label: 'Date QC', value: displayValue(payload.qcDate) },
    { label: 'Total weight (kg)', value: formatWeightKg(payload.weight) },
    { label: 'Total bags', value: displayValue(payload.totalBags) },
    { label: 'Weight to wet mill (kg)', value: formatWeightKg(payload.weightToWetMill) },
    { label: 'Producer', value: displayValue(payload.producer) },
    { label: 'Product line', value: displayValue(payload.productLine) },
    { label: 'Processing type', value: displayValue(payload.processingType) },
    { label: 'Quality', value: displayValue(payload.quality) },
    { label: 'Type', value: displayValue(payload.type) },
    { label: 'Notes', value: displayValue(payload.notes) },
    { label: 'Cherry score', value: displayValue(payload.cherryScore) },
    { label: 'Cherry group', value: displayValue(payload.cherryGroup) },
    { label: 'Ripeness', value: displayValue(payload.ripeness) },
    { label: 'Color', value: displayValue(payload.color) },
    { label: 'Foreign matter', value: displayValue(payload.foreignMatter) },
    { label: 'Overall quality', value: displayValue(payload.overallQuality) },
  ];
}

export function generateWetMillOrderSheet(payload) {
  const doc = new jsPDF();
  const fields = buildWetMillOrderSheetFields(payload);

  doc.setFontSize(18);
  doc.text('HEQA Wet Mill Order Sheet', 105, 20, { align: 'center' });

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

  doc.save(orderSheetFilename(payload.batchNumber));
}

export function generateWetMillOrderSheetFromRow(row) {
  generateWetMillOrderSheet({
    batchNumber: row.batchNumber,
    farmerName: row.farmerName,
    lotNumber: row.lotNumber,
    referenceNumber: row.referenceNumber,
    receivingDate: row.receivingDate,
    qcDate: row.qcDate,
    weight: row.weight,
    totalBags: row.totalBags,
    weightToWetMill: row.processedWeight,
    producer: row.producer,
    productLine: row.productLine,
    processingType: row.processingType,
    quality: row.quality,
    type: row.type,
    notes: row.preprocessingNotes,
    cherryScore: row.cherryScore,
    cherryGroup: row.cherryGroup,
    ripeness: row.ripeness,
    color: row.color,
    foreignMatter: row.foreignMatter,
    overallQuality: row.overallQuality,
    date: row.startProcessingDate,
    startProcessingDate: row.startProcessingDate,
  });
}

export function generateWetMillOrderSheetFromForm({
  batchNumber,
  farmerName,
  lotNumber,
  referenceNumber,
  receivingDate,
  qcDate,
  totalWeight,
  totalBags,
  weightToWetMill,
  producer,
  productLine,
  processingType,
  quality,
  type,
  notes,
  cherryScore,
  cherryGroup,
  ripeness,
  color,
  foreignMatter,
  overallQuality,
}) {
  generateWetMillOrderSheet({
    batchNumber,
    farmerName,
    lotNumber,
    referenceNumber,
    receivingDate,
    qcDate,
    weight: totalWeight,
    totalBags,
    weightToWetMill,
    producer,
    productLine,
    processingType,
    quality,
    type,
    notes,
    cherryScore,
    cherryGroup,
    ripeness,
    color,
    foreignMatter,
    overallQuality,
    date: formatNowWita(),
  });
}
