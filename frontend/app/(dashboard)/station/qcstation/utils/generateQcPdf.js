import jsPDF from 'jspdf';
import 'jspdf-autotable';
import dayjs from 'dayjs';

export function generateQcPdf(row) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [241.3, 279.4]
  });

  const addText = (text, x, y, options = {}) => {
    doc.setFont('courier');
    doc.setFontSize(10);

    if (options.bold) {
      doc.setFont('courier', 'bold');
    }
    if (options.align) {
      doc.text(text, x, y, { align: options.align });
    } else {
      doc.text(text, x, y);
    }
  };

  addText("PT. Berkas Tuaian Melimpah", doc.internal.pageSize.getWidth() / 2, 10, { align: 'center', bold: true });
  addText("Cherry Receiving & QC Report", doc.internal.pageSize.getWidth() / 2, 16, { align: 'center', bold: true });
  addText(`Date: ${dayjs().format('YYYY-MM-DD')}`, doc.internal.pageSize.getWidth() - 10, 10, { align: 'right' });
  addText(`Time: ${dayjs().format('HH:mm:ss')}`, doc.internal.pageSize.getWidth() - 10, 16, { align: 'right' });
  doc.line(5, 20, doc.internal.pageSize.getWidth() - 5, 20);
  addText(`Batch Number: ${row.batchNumber}`, 10, 28, { bold: true });

  let yOffset = 38;
  const columnWidth = (doc.internal.pageSize.getWidth() - 30) / 2;

  addText("Receiving Information:", 10, yOffset, { bold: true });
  yOffset += 6;
  addText(`Farmer Name    : ${row.farmerName || '-'}`, 10, yOffset);
  yOffset += 6;
  addText(`Receiving Date : ${dayjs(row.receivingDate).format('YYYY-MM-DD')}`, 10, yOffset);
  yOffset += 6;
  addText(`Total Weight   : ${row.weight} kg`, 10, yOffset);
  yOffset += 6;
  addText(`Total Bags     : ${row.totalBags}`, 10, yOffset);
  yOffset += 6;
  addText(`Type           : ${row.type || '-'}`, 10, yOffset);
  yOffset += 6;

  addText("Receiving Notes:", 10, yOffset);
  yOffset += 2;
  const recNotesX = 10;
  const recNotesY = yOffset;
  const recNotesWidth = columnWidth;
  const recNotesHeight = 18;
  doc.rect(recNotesX, recNotesY, recNotesWidth, recNotesHeight);
  const recNotesLines = doc.splitTextToSize(row.receivingNotes || '', recNotesWidth - 5);
  recNotesLines.forEach((line, index) => {
    addText(line, recNotesX + 2, recNotesY + 4 + (index * 6));
  });

  yOffset += recNotesHeight + 6;

  let qcOffset = 38;
  addText("QC Information :", 10 + columnWidth + 10, qcOffset, { bold: true });
  qcOffset += 6;
  addText(`QC Date         : ${dayjs(row.qcDate).format('YYYY-MM-DD')}`, 10 + columnWidth + 10, qcOffset);
  qcOffset += 6;
  addText(`Ripeness        : ${row.ripeness || '-'}`, 10 + columnWidth + 10, qcOffset);
  qcOffset += 6;
  addText(`Color           : ${row.color || '-'}`, 10 + columnWidth + 10, qcOffset);
  qcOffset += 6;
  addText(`Foreign Matter  : ${row.foreignMatter || '-'}`, 10 + columnWidth + 10, qcOffset);
  qcOffset += 6;
  addText(`Unripe (%)      : ${row.unripePercentage || '-'}`, 10 + columnWidth + 10, qcOffset);
  qcOffset += 6;
  addText(`Semi-ripe (%)   : ${row.semiripePercentage || '-'}`, 10 + columnWidth + 10, qcOffset);
  qcOffset += 6;
  addText(`Ripe (%)        : ${row.ripePercentage || '-'}`, 10 + columnWidth + 10, qcOffset);
  qcOffset += 6;
  addText(`Overripe (%)    : ${row.overripePercentage || '-'}`, 10 + columnWidth + 10, qcOffset);
  qcOffset += 6;
  addText(`Overall Quality : ${row.overallQuality || '-'}`, 10 + columnWidth + 10, qcOffset);
  qcOffset += 6;
  addText("QC Notes:", 10 + columnWidth + 10, qcOffset);
  qcOffset += 2;
  const qcNotesX = 10 + columnWidth + 10;
  const qcNotesY = qcOffset;
  const qcNotesWidth = columnWidth;
  const qcNotesHeight = 18;
  doc.rect(qcNotesX, qcNotesY, qcNotesWidth, qcNotesHeight);
  const qcNotesLines = doc.splitTextToSize(row.qcNotes || '', qcNotesWidth - 5);
  qcNotesLines.forEach((line, index) => {
    addText(line, qcNotesX + 2, qcNotesY + 4 + (index * 6));
  });

  qcOffset += qcNotesHeight + 6;

  let paymentDetailsY = Math.max(yOffset, qcOffset) + 5;

  addText("Payment Details:", 10, paymentDetailsY, { bold: true });
  doc.line(10, paymentDetailsY + 2, doc.internal.pageSize.getWidth() - 10, paymentDetailsY + 2);

  addText(`Payment Method    : ${row.paymentMethod || '-'}`, 10, paymentDetailsY + 8);
  addText(`Quality Group     : ${row.priceGroup || '-'}`, 10, paymentDetailsY + 14);

  const formattedMinPrice = row.minPrice ? row.minPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';
  const formattedMaxPrice = row.maxPrice ? row.maxPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';
  const formattedPricePerKg = row.price ? row.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';
  const totalPrice = (row.price && row.weight) ? (row.price * row.weight).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';

  addText(`Min Price (Today) : Rp ${formattedMinPrice}`, 10, paymentDetailsY + 20);
  addText(`Max Price (Today) : Rp ${formattedMaxPrice}`, 10, paymentDetailsY + 26);
  addText(`Price/kg          : Rp ${formattedPricePerKg}`, 10, paymentDetailsY + 32);
  addText(`Total Price       : Rp ${totalPrice}`, 10, paymentDetailsY + 38);
  addText(`Farmer Name       : ${row.farmerName || '-'}`, 10, paymentDetailsY + 44);
  addText(`Bank Name         : ${row.bankName || '-'}`, 10, paymentDetailsY + 50);
  addText(`Bank Account      : ${row.bankAccount || '-'}`, 10, paymentDetailsY + 56);

  let signatureOffset = paymentDetailsY + 70;
  doc.line(5, signatureOffset, doc.internal.pageSize.getWidth() - 5, signatureOffset);

  const signatureY = signatureOffset + 40;
  const labelY = signatureY + 6;

  const signatureLength = 20;

  addText("_".repeat(signatureLength), 10, signatureY);
  addText("Receiving Staff", 10, labelY);
  addText(`${row.receivingUpdatedBy || '-'}`, 10, labelY + 6);

  addText("_".repeat(signatureLength), 70, signatureY);
  addText("QC Staff" , 70, labelY);
  addText(`${row.qcCreatedBy || '-'}` , 70, labelY + 6);

  addText("_".repeat(signatureLength), 130, signatureY);
  addText("Manager", 130, labelY);
  addText('Haris Ariansyah', 130, labelY + 6);

  addText("_".repeat(signatureLength), 190, signatureY);
  addText("Farmer", 190, labelY);
  addText(`${row.farmerName || '-'}`, 190, labelY + 6);

  doc.line(5, doc.internal.pageSize.getHeight() - 10, doc.internal.pageSize.getWidth() - 5, doc.internal.pageSize.getHeight() - 10);
  addText(`Printed on: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`, 10, doc.internal.pageSize.getHeight() - 5);

  const filename = `QC_Report_${row.batchNumber}.pdf`;
  doc.save(filename);

  doc.autoPrint();
  const pdfData = doc.output('bloburl');

  const printWindow = window.open('', '_blank');

  if (printWindow) {
    printWindow.document.write(`<iframe src="${pdfData}" width="100%" height="100%" style="border: none;"></iframe>`);
    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => { printWindow.focus(); }, 100);
    }
  } else {
    alert('Please allow popups for this site to enable automatic printing.');
    doc.output('dataurlnewwindow');
  }
}
