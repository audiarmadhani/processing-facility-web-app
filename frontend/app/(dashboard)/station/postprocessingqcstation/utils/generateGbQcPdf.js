import jsPDF from 'jspdf';
import 'jspdf-autotable';

function formatDate(date) {
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  return new Intl.DateTimeFormat('en-US', options).format(date).replace(/,/, '').replace(/\s+/g, '-');
}

export function generateGbQcPdf(row, userName = 'User') {
  const doc = new jsPDF();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  const title = 'Quality Control Report';
  const titleWidth =
    (doc.getStringUnitWidth(title) * doc.internal.getFontSize()) / doc.internal.scaleFactor;
  const titleX = (doc.internal.pageSize.getWidth() - titleWidth) / 2;
  doc.text(title, titleX, 20);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Lot Number        : ${row.batchNumber}`, 14, 35);
  doc.text(`Reference Number  : ${row.referenceNumber}`, 14, 42);

  const columnHeaders = [
    { field: 'batchNumber', headerName: 'Lot Number' },
    { field: 'referenceNumber', headerName: 'Reference Number' },
    { field: 'generalQuality', headerName: 'General Quality' },
    { field: 'actualGrade', headerName: 'Actual Grade' },
    { field: 'kelembapan', headerName: 'Kelembapan (%)' },
    { field: 'waterActivity', headerName: 'Water Activity' },
    { field: 'triage', headerName: 'Triage' },
    { field: 'defectScore', headerName: 'Defect Score' },
    { field: 'defectWeightPercentage', headerName: 'Defect Weight (%)' },
    { field: 'bijiHitam', headerName: 'Biji Hitam' },
    { field: 'bijiHitamSebagian', headerName: 'Biji Hitam Sebagian' },
    { field: 'bijiPecah', headerName: 'Biji Pecah' },
    { field: 'kopiGelondong', headerName: 'Kopi Gelondong' },
    { field: 'bijiCoklat', headerName: 'Biji Coklat' },
    { field: 'kulitKopiBesar', headerName: 'Kulit Kopi Besar' },
    { field: 'kulitKopiSedang', headerName: 'Kulit Kopi Sedang' },
    { field: 'kulitKopiKecil', headerName: 'Kulit Kopi Kecil' },
    { field: 'bijiBerKulitTanduk', headerName: 'Biji Berkulit Tanduk' },
    { field: 'kulitTandukBesar', headerName: 'Kulit Tanduk Besar' },
    { field: 'kulitTandukSedang', headerName: 'Kulit Tanduk Sedang' },
    { field: 'kulitTandukKecil', headerName: 'Kulit Tanduk Kecil' },
    { field: 'bijiMuda', headerName: 'Biji Muda' },
    { field: 'bijiBerlubangSatu', headerName: 'Biji Berlubang Satu' },
    { field: 'bijiBerlubangLebihSatu', headerName: 'Biji Berlubang >1' },
    { field: 'bijiBertutul', headerName: 'Biji Bertutul' },
    { field: 'rantingBesar', headerName: 'Ranting Besar' },
    { field: 'rantingSedang', headerName: 'Ranting Sedang' },
    { field: 'rantingKecil', headerName: 'Ranting Kecil' },
  ];

  const tableRows = columnHeaders.map((col) => [
    col.headerName,
    row[col.field] !== undefined ? row[col.field] : '-',
  ]);

  doc.autoTable({
    startY: 50,
    head: [['Quality Parameter', 'Value']],
    body: tableRows,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [240, 240, 240] },
    margin: { top: 20 },
  });

  const printedText = `Printed on: ${formatDate(new Date())} by: ${userName}`;
  const printedTextWidth =
    (doc.getStringUnitWidth(printedText) * doc.internal.getFontSize()) / doc.internal.scaleFactor;
  const printedTextX = (doc.internal.pageSize.getWidth() - printedTextWidth) / 2;
  doc.text(printedText, printedTextX, doc.internal.pageSize.getHeight() - 5);

  doc.save(`QC_Report_${row.batchNumber}.pdf`);
}
