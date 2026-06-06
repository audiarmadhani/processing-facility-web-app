'use client';

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import dayjs from 'dayjs';
import { formatStockQuantity } from '../constants';

function formatReportHeaderDate(value) {
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('D-MMM-YYYY') : '';
}

function formatReportCellDate(value) {
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('D-MMM-YYYY') : '';
}

function formatQuantityCell(value, unit) {
  if (value == null || value === '') return '';
  return formatStockQuantity(value, unit);
}

export function officeInventoryReportFilename(reportDate) {
  const ymd = dayjs(reportDate).isValid()
    ? dayjs(reportDate).format('YYYYMMDD')
    : dayjs().format('YYYYMMDD');
  return `BTM Inventory - Daily Report ${ymd}.pdf`;
}

export function generateOfficeInventoryReport(rows, reportDate) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('DAILY REPORT INVENTORY', 14, 14);

  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(formatReportHeaderDate(reportDate), 14, 22);

  const tableBody = (rows || []).map((row) => [
    row.name || '',
    row.category || '',
    row.pic || '',
    row.remarks || '',
    formatReportCellDate(row.transactionDate),
    row.location || '',
    row.project || '',
    row.quantityIn != null ? formatQuantityCell(row.quantityIn, row.unit) : '',
    row.quantityOut != null ? formatQuantityCell(row.quantityOut, row.unit) : '',
    row.unit || '',
    formatQuantityCell(row.stockAfter, row.unit),
  ]);

  doc.autoTable({
    startY: 28,
    head: [[
      'NAMA BARANG',
      'KATEGORI',
      'PIC',
      'Remarks',
      'Tgl',
      'LOCATION',
      'PROJECT',
      'IN',
      'OUT',
      'SATUAN',
      'STOCK',
    ]],
    body: tableBody,
    styles: { fontSize: 7, cellPadding: 1.2 },
    headStyles: { fillColor: [240, 240, 240], textColor: 20, fontStyle: 'bold' },
    theme: 'grid',
  });

  doc.save(officeInventoryReportFilename(reportDate));
}
