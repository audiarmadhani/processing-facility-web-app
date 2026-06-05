'use client';

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import dayjs from 'dayjs';

function formatReportDate(value) {
  if (!value) return '';
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('DD/MM/YYYY') : '';
}

function formatDecimalId(value, fractionDigits = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(n);
}

function formatPriceId(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatExperiment(experimentNumber) {
  if (experimentNumber == null || String(experimentNumber).trim() === '') return '';
  return String(experimentNumber).trim();
}

export function cherryReceiveReportFilename(reportDate) {
  const ymd = dayjs(reportDate).isValid()
    ? dayjs(reportDate).format('YYYYMMDD')
    : dayjs().format('YYYYMMDD');
  return `HEQA_BTM Production 2026 - Report Cherry Receive ${ymd}.pdf`;
}

export function generateCherryReceiveReport(rows, reportDate) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const displayDate = formatReportDate(reportDate);
  const normalizedRows = (rows || []).map((row) => {
    const weight = Number(row.weight) || 0;
    const price = row.price != null && row.price !== '' ? Number(row.price) : null;
    return {
      batchNumber: row.batchNumber || '',
      receivingDate: formatReportDate(row.receivingDate),
      farmerName: row.farmerName || '',
      broker: row.broker || '',
      type: row.type || '',
      variety: row.farmVarieties || '',
      brix: row.brix != null && row.brix !== '' ? String(row.brix) : '',
      weight,
      producer: row.producer || '',
      price,
      experiment: formatExperiment(row.experimentNumber),
    };
  });

  const totalQty = normalizedRows.reduce((sum, row) => sum + row.weight, 0);
  const pricedRows = normalizedRows.filter((row) => row.price != null && Number.isFinite(row.price));
  const avgPrice =
    pricedRows.length > 0
      ? pricedRows.reduce((sum, row) => sum + row.price, 0) / pricedRows.length
      : null;

  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('REPORT CHERRIES RECEIVE', 14, 14);

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  const summaryParts = [
    displayDate,
    totalQty > 0 ? formatDecimalId(totalQty) : '0,00',
    avgPrice != null ? formatPriceId(avgPrice) : '',
  ].filter(Boolean);
  doc.text(summaryParts.join('   '), 14, 22);

  const tableBody = normalizedRows.map((row) => {
    const ratio =
      totalQty > 0 && row.weight > 0
        ? `${formatDecimalId((row.weight / totalQty) * 100)}%`
        : '';
    return [
      row.batchNumber,
      row.receivingDate,
      row.farmerName,
      row.broker,
      row.type,
      row.variety,
      row.brix,
      row.weight > 0 ? formatDecimalId(row.weight) : '',
      row.producer,
      row.price != null ? formatPriceId(row.price) : '',
      row.experiment,
      ratio,
    ];
  });

  doc.autoTable({
    startY: 28,
    head: [[
      'Batch',
      'Date',
      'Farmer',
      'Broker',
      'Jenis',
      'Variety',
      'Brix',
      'Qty',
      'Producer',
      'Price/Kg',
      'Experiment',
      'Ratio',
    ]],
    body: tableBody,
    styles: { fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: [240, 240, 240], textColor: 20, fontStyle: 'bold' },
    theme: 'grid',
  });

  doc.save(cherryReceiveReportFilename(reportDate));
}
