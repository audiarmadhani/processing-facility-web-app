'use client';

import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

export function downloadFermentationDataExcel(row) {
    // Clone row to avoid mutating original
    const exportData = { ...row };

    // Remove internal fields you don’t want
    delete exportData.id;

    // Format all date fields consistently
    Object.keys(exportData).forEach(key => {
      if (
        key.toLowerCase().includes("date") ||
        key.toLowerCase().includes("start") ||
        key.toLowerCase().includes("end") ||
        key.toLowerCase().includes("time")
      ) {
        if (exportData[key]) {
          exportData[key] = dayjs(exportData[key])
            .format('YYYY-MM-DD HH:mm:ss');
        }
      }
    });

    const worksheet = XLSX.utils.json_to_sheet([exportData]);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'Fermentation Full Data'
    );

    XLSX.writeFile(
      workbook,
      `Fermentation_${row.batchNumber}_FULL.xlsx`
    );
  };
