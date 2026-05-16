import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import angkaTerbilang from '@develoka/angka-terbilang-js';

export function generateSingleInvoice(data, type, batchNumber) {
  const doc = new jsPDF();
  const invoiceNo = `${batchNumber}-${type === 'shipping' ? 'S' : type === 'loading' ? 'L' : type === 'unloading' ? 'U' : 'H'}`;
  const date = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  let amount = 0;
  let description = '';
  const weight = data.weight || 'N/A'; // Use data.weight instead of batchWeights
  const paidToName = data.paidTo && data.paidTo !== '0' ? data.paidTo : 'Cash'; // Handle '0' explicitly

  // Debug: Log values used in PDF
  console.log(`Creating PDF for ${invoiceNo}:`, { paidToName, weight, batchNumber });

  switch (type) {
    case 'shipping':
      amount = data.contractType === 'Kontrak Lahan' ?
        (Number(data.transportCostFarmToCollection) + Number(data.transportCostCollectionToFacility)) :
        Number(data.cost);
      description = data.contractType === 'Kontrak Lahan' ?
        `Biaya Transportasi Kopi ${paidToName} ${weight}kg (Ladang ke Titik Pengumpulan dan Titik Pengumpulan ke Fasilitas)` :
        `Biaya Transportasi Kopi ${paidToName} ${weight}kg (Ladang ke Fasilitas)`;
      break;
    case 'loading':
      amount = Number(data.loadingWorkerCount) * Number(data.loadingWorkerCostPerPerson);
      description = `Upah Kuli Pemuatan Kopi ${paidToName} ${weight}kg`;
      break;
    case 'unloading':
      amount = Number(data.unloadingWorkerCount) * Number(data.unloadingWorkerCostPerPerson);
      description = `Upah Kuli Pembongkaran Kopi ${paidToName} ${weight}kg`;
      break;
    case 'harvesting':
      amount = Number(data.harvestWorkerCount) * Number(data.harvestWorkerCostPerPerson);
      description = `Upah Kuli Panen Kopi ${paidToName} ${weight}kg`;
      break;
  }

  if (amount <= 0) return null; // Skip if no valid amount

  const amountInWords = angkaTerbilang(amount) + ' Rupiah';

  doc.setFontSize(12);
  doc.text('KWITANSI PEMBAYARAN', 105, 20, { align: 'center' });
  doc.text('PT.BERKAS TUAIAN MELIMPAH', 105, 27, { align: 'center' });

  doc.setFontSize(11);
  doc.text(`No                            : ${invoiceNo}`, 20, 40);
  doc.text(`Tanggal                    : ${date}`, 20, 46);
  doc.text('Terima Dari              : PT Berkas Tuaian Melimpah', 20, 52);
  doc.text(`Terbilang                  : ${amountInWords}`, 20, 58);
  doc.text(`Untuk Pembayaran  : ${description}`, 20, 64);

  doc.text(`Rp ${amount.toLocaleString('id-ID')}`, 40, 80);
  doc.text('Penerima', 140, 73);

  doc.rect(30, 71, 45, 15);
  doc.rect(5, 5, 200, 95);

  return { doc, invoiceNo, type, amount };
}

export async function uploadInvoiceToGoogleDrive(pdfBlob, invoiceNo, type, batchNumber, onError) {
  try {
    const formData = new FormData();
    formData.append('file', pdfBlob, `${invoiceNo}.pdf`);
    formData.append('batchNumber', batchNumber);
    formData.append('invoiceType', type);

    const response = await fetch('https://processing-facility-backend.onrender.com/api/upload-invoice', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to upload invoice');
    }

    const data = await response.json();
    console.log(`Invoice ${invoiceNo} ${data.updated ? 'updated' : 'uploaded'} successfully:`, data);
    return data.fileId;
  } catch (error) {
    console.error(`Error uploading invoice ${invoiceNo}:`, error);
    if (onError) {
      onError(`Failed to ${error.message.includes('replace') ? 'replace' : 'upload'} ${type} invoice: ${error.message}`);
    }
    return null;
  }
}

export async function generateAndUploadInvoices(data, batchNumber, contractType, batchWeight, onError) {
  const invoiceTypes = ['shipping', 'loading', 'unloading', 'harvesting'];
  const invoices = [];

  // Add contractType and ensure paidTo and weight are included
  const invoiceData = {
    ...data,
    contractType,
    paidTo: data.paidTo || 'Unknown',
    weight: batchWeight || 'N/A'
  };

  for (const type of invoiceTypes) {
    const invoice = generateSingleInvoice(invoiceData, type, batchNumber);
    if (invoice) {
      const { doc, invoiceNo, type: invoiceType, amount } = invoice;

      // Debug: Log invoice data to verify paidTo and weight
      console.log(`Generating invoice ${invoiceNo}:`, { paidTo: invoiceData.paidTo, weight: invoiceData.weight, amount });

      // Download individual invoice locally
      doc.save(`${invoiceNo}.pdf`);

      // Upload to Google Drive
      const pdfBlob = new Blob([doc.output('arraybuffer')], { type: 'application/pdf' });
      const fileId = await uploadInvoiceToGoogleDrive(pdfBlob, invoiceNo, invoiceType, batchNumber, onError);
      if (fileId) {
        invoices.push({ invoiceNo, type: invoiceType, fileId, amount });
      }
    }
  }

  if (invoices.length > 0) {
    return invoices;
  }
  return [];
}
