'use client';

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import dayjs from 'dayjs';

export function generateOrderSheet(formState) {
  const {
    batchNumber, referenceNumber, version, experimentNumber, processingType, description,
    farmerName, type, variety, productLine, preStorage, preFermentationStorageGoal,
    preFermentationStorageStart, preFermentationStorageEnd, prePulped, prePulpedDelva,
    wesorter, preClassifier, cherryType, fermentation, tank, fermentationStarter,
    fermentationStarterAmount, gas, pressure, isSubmerged, totalVolume, stirring,
    fermentationTemperature, pH, fermentationTimeTarget, fermentationStart, postPulped,
    postPulpedDelva, airlock, tankAmount, leachateTarget, brewTankTemperature,
    waterTemperature, coolerTemperature, secondFermentation, secondFermentationTank,
    secondPostPulped, secondPostPulpedDelva, secondWashed, secondStarterType, secondGas,
    secondPressure, secondIsSubmerged, secondTotalVolume, secondTemperature,
    secondFermentationTimeTarget, drying, secondDrying, rehydration,
  } = formState;

  const fullReferenceNumber =
    referenceNumber && version ? `${referenceNumber}-${version}` : '';

  const derivedDate = fermentationStart
    ? dayjs(fermentationStart).format('DD/MM/YYYY HH:mm:ss')
    : dayjs().format('DD/MM/YYYY HH:mm:ss');

  const doc = new jsPDF();
    
    // Set title
    doc.setFontSize(18);
    doc.text('HEQA Fermentation Order Sheet', 105, 20, { align: 'center' });

    const fermentationEndGoal = fermentationStart && fermentationTimeTarget
      ? dayjs(fermentationStart).add(parseInt(fermentationTimeTarget), 'hour').format('DD/MM/YYYY HH:mm:ss')
      : 'N/A';

    const secondFermentationNA = secondFermentation === 'no';

    const secondValue = (value, formatter = (v) => v) => {
      if (secondFermentationNA) return 'N/A';
      if (!value) return 'N/A';
      return formatter(value);
    };

    const isPreStorageNo = preStorage === 'no';

    const preValue = (value, fallback = 'N/A') => {
      if (isPreStorageNo) return fallback;
      return value || 'N/A';
    };

    const formatPreFermDisplay = (dt) => {
      if (!dt) return 'N/A';
      const d = dayjs(dt);
      return d.isValid() ? d.format('DD/MM/YYYY HH:mm:ss') : 'N/A';
    };

    const fields = [
      { label: 'Date', value: derivedDate },
      { label: 'Batch number', value: batchNumber || 'N/A' },
      { label: 'Reference number', value: referenceNumber || 'N/A' },
      { label: 'Version', value: version || '' },
      { label: 'Full Reference Number', value: fullReferenceNumber || 'N/A' },
      { label: 'Processing Type', value: processingType || 'N/A' },
      { label: 'Experiment Number', value: experimentNumber || 'N/A' },
      { label: 'Notes', value: description || 'N/A' },
      { label: 'Farmer', value: farmerName || 'N/A' },
      { label: 'Type', value: type || 'N/A' },
      { label: 'Variety', value: variety || 'N/A' },
      { label: 'Product line', value: productLine || 'N/A' },
      
      { label: 'Pre-fermentation in bag', value: preStorage || 'N/A' },
      { label: 'Pre-fermentation time', value: isPreStorageNo ? 'N/A' : (preFermentationStorageGoal ? `${preFermentationStorageGoal} h` : 'N/A') },
      { label: 'Pre-Fermentation Storage Start', value: isPreStorageNo ? 'N/A' : formatPreFermDisplay(preFermentationStorageStart) },
      { label: 'Pre-Fermentation Storage End', value: isPreStorageNo ? 'N/A' : formatPreFermDisplay(preFermentationStorageEnd) },
      { label: 'Pre-Pulped', value: prePulped || 'N/A' },
      { label: 'Pre-pulped Delva', value: prePulpedDelva || 'N/A' },
      { label: 'Wesorter', value: wesorter || 'N/A' },
      { label: 'Pre-classifier', value: preClassifier || 'N/A' },

      { label: 'Cherry Type', value: cherryType || 'N/A' },
      { label: 'Fermentation', value: fermentation || 'N/A' },
      { label: 'Fermentation tank', value: tank || 'N/A' },
      { label: 'Starter type', value: fermentationStarter || 'N/A' },
      { label: 'Starter amount', value: fermentationStarterAmount !== '' && fermentationStarterAmount != null ? `${fermentationStarterAmount} L` : 'N/A' },
      { label: 'Gas', value: gas || 'N/A' },
      { label: 'Pressure', value: pressure ? `${pressure} psi` : 'N/A' },
      { label: 'Submerged', value: isSubmerged || 'N/A' },
      { label: 'Total Volume', value: totalVolume || 'N/A' },
      { label: 'Stirring', value: stirring || 'N/A' },
      { label: 'Temperature', value: fermentationTemperature || 'ambient' },
      { label: 'pH', value: pH || 'N/A' },
      { label: 'Fermentation Time Target', value: fermentationTimeTarget ? `${fermentationTimeTarget} h` : 'N/A' },
      { label: 'Fermentation Start', value: fermentationStart || 'N/A' },
      { label: 'Post Pulped', value: postPulped || 'N/A' },
      { label: 'Post Pulped Delva', value: postPulpedDelva || 'N/A' },
      { label: 'Airlock', value: airlock || 'N/A' },
      { label: 'Tank amount', value: tankAmount || 'N/A' },
      { label: 'Leachate target', value: leachateTarget ? `${leachateTarget} L` : 'N/A' },
      { label: 'Brew Tank Temperature', value: brewTankTemperature || 'N/A' },
      { label: 'Water Temperature', value: waterTemperature || 'N/A' },
      { label: 'Cooler Temperature', value: coolerTemperature || 'N/A' },

      { label: 'Second Fermentation', value: secondFermentation || 'N/A' },
      { label: 'Second Fermentation Tank', value: secondValue(secondFermentationTank) },
      { label: 'Second Post Pulped', value: secondValue(secondPostPulped) },
      { label: 'Second Post Pulped Delva', value: secondValue(secondPostPulpedDelva) },
      { label: 'Second Washed', value: secondWashed || 'N/A' },
      { label: 'Second Starter', value: secondValue(secondStarterType) },
      { label: 'Second Gas', value: secondValue(secondGas) },
      { label: 'Second Pressure', value: secondValue(secondPressure, v => `${v} psi`) },
      { label: 'Second Submerged', value: secondValue(secondIsSubmerged) },
      { label: 'Second Total Volume', value: secondValue(secondTotalVolume, v => `${v} L`) },
      { label: 'Second Temperature', value: secondValue(secondTemperature, v => `${v} °C`) },
      { label: 'Second Fermentation Time Target', value: secondValue(secondFermentationTimeTarget, v => `${v} h`) },
      
      { label: 'Drying', value: drying || 'N/A' },
      { label: 'Second Drying', value: secondDrying || 'N/A' },
      { label: 'Rehydration', value: rehydration || 'N/A' },
      
    ];

    // Create table
    doc.autoTable({
      startY: 30,
      head: [['Label', 'Value']],
      body: fields.map(field => [field.label, field.value]),
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 80 }, // Label column
        1: { cellWidth: 100 }, // Value column
      },
      margin: { left: 20, right: 20 },
    });

    doc.save(`HEQA_Fermentation_Order_Sheet_${batchNumber || 'Untitled'}.pdf`);
}

export function generateOrderSheetRow(row) {
    const doc = new jsPDF();

    // -----------------------------
    // NORMALIZE DATA SOURCE
    // -----------------------------
    const data = row || {};

    const safe = (val, fallback = 'N/A') => {
      return val !== undefined && val !== null && val !== '' ? val : fallback;
    };

    const formatUnit = (val, unit) => {
      if (!val) return 'N/A';
      return `${val} ${unit}`;
    };

    // -----------------------------
    // DERIVED VALUES
    // -----------------------------
    const fermentationEndGoal =
      data.fermentationStart && data.fermentationTimeTarget
        ? dayjs(data.fermentationStart)
            .add(parseInt(data.fermentationTimeTarget), 'hour')
            .format('DD/MM/YYYY HH:mm:ss')
        : 'N/A';

    const secondFermentationNA = data.secondFermentation === 'no';
    const isPreStorageNo = data.preStorage === 'no';

    const secondValue = (value, formatter = (v) => v) => {
      if (secondFermentationNA) return 'N/A';
      return value ? formatter(value) : 'N/A';
    };

    const preValue = (value, formatter = (v) => v) => {
      if (isPreStorageNo) return 'N/A';
      return value ? formatter(value) : 'N/A';
    };

    const formatPreFermDisplayRow = (raw) => {
      if (!raw) return 'N/A';
      const d = dayjs(raw);
      return d.isValid() ? d.format('DD/MM/YYYY HH:mm:ss') : String(raw);
    };

    // -----------------------------
    // TITLE
    // -----------------------------
    doc.setFontSize(18);
    doc.text('HEQA Fermentation Order Sheet', 105, 20, { align: 'center' });

    // -----------------------------
    // FIELDS (GROUPED)
    // -----------------------------
    const fields = [
      // GENERAL
      { label: 'Date', value: safe(data.derivedDate) },
      { label: 'Batch number', value: safe(data.batchNumber) },
      { label: 'Reference number', value: safe(data.referenceNumber) },
      { label: 'Version', value: safe(data.version, '-') },
      { label: 'Full Reference Number', value: safe(data.fullReferenceNumber) },
      { label: 'Processing Type', value: safe(data.processingType) },
      { label: 'Experiment Number', value: safe(data.experimentNumber) },
      { label: 'Notes', value: safe(data.description) },

      // ORIGIN
      { label: 'Farmer', value: safe(data.farmerName) },
      { label: 'Type', value: safe(data.type) },
      { label: 'Variety', value: safe(data.variety) },
      { label: 'Product line', value: safe(data.productLine) },

      // PRE-FERMENTATION
      { label: 'Pre-fermentation in bag', value: safe(data.preStorage) },
      {
        label: 'Pre-fermentation time',
        value: preValue(data.preFermentationStorageGoal, v => `${v} h`)
      },
      {
        label: 'Pre-Fermentation Storage Start',
        value: isPreStorageNo ? 'N/A' : formatPreFermDisplayRow(data.preFermentationStorageStart)
      },
      {
        label: 'Pre-Fermentation Storage End',
        value: isPreStorageNo ? 'N/A' : formatPreFermDisplayRow(data.preFermentationStorageEnd)
      },
      { label: 'Pre-Pulped', value: safe(data.prePulped) },
      { label: 'Pre-pulped Delva', value: safe(data.prePulpedDelva) },
      { label: 'Wesorter', value: safe(data.wesorter) },
      { label: 'Pre-classifier', value: safe(data.preClassifier) },

      // FERMENTATION
      { label: 'Cherry Type', value: safe(data.cherryType) },
      { label: 'Fermentation', value: safe(data.fermentation) },
      { label: 'Fermentation tank', value: safe(data.tank) },
      { label: 'Starter type', value: safe(data.fermentationStarter) },
      {
        label: 'Starter amount (gr)',
        value:
          data.fermentationStarterAmount !== undefined &&
          data.fermentationStarterAmount !== null &&
          data.fermentationStarterAmount !== ''
            ? `${data.fermentationStarterAmount} gr`
            : 'N/A'
      },
      { label: 'Gas', value: safe(data.gas) },
      { label: 'Pressure', value: formatUnit(data.pressure, 'psi') },
      { label: 'Submerged', value: safe(data.isSubmerged) },
      { label: 'Total Volume', value: safe(data.totalVolume) },
      { label: 'Stirring', value: safe(data.stirring) },
      { label: 'Temperature', value: safe(data.fermentationTemperature, 'ambient') },
      { label: 'pH', value: safe(data.pH) },
      { label: 'Fermentation Time Target', value: formatUnit(data.fermentationTimeTarget, 'h') },
      { label: 'Fermentation Start', value: safe(data.fermentationStart) },
      { label: 'Fermentation End (Calculated)', value: fermentationEndGoal },

      // POST
      { label: 'Post Pulped', value: safe(data.postPulped) },
      { label: 'Post Pulped Delva', value: safe(data.postPulpedDelva) },
      { label: 'Airlock', value: safe(data.airlock) },
      { label: 'Tank amount', value: safe(data.tankAmount) },
      { label: 'Leachate target', value: formatUnit(data.leachateTarget, 'L') },
      { label: 'Brew Tank Temperature', value: safe(data.brewTankTemperature) },
      { label: 'Water Temperature', value: safe(data.waterTemperature) },
      { label: 'Cooler Temperature', value: safe(data.coolerTemperature) },

      // SECOND FERMENTATION
      { label: 'Second Fermentation', value: safe(data.secondFermentation) },
      { label: 'Second Tank', value: secondValue(data.secondFermentationTank) },
      { label: 'Second Post Pulped', value: secondValue(data.secondPostPulped) },
      { label: 'Second Delva', value: secondValue(data.secondPostPulpedDelva) },
      { label: 'Second Washed', value: safe(data.secondWashed) },
      { label: 'Second Starter', value: secondValue(data.secondStarterType) },
      { label: 'Second Gas', value: secondValue(data.secondGas) },
      { label: 'Second Pressure', value: secondValue(data.secondPressure, v => `${v} psi`) },
      { label: 'Second Submerged', value: secondValue(data.secondIsSubmerged) },
      { label: 'Second Volume', value: secondValue(data.secondTotalVolume, v => `${v} L`) },
      { label: 'Second Temperature', value: secondValue(data.secondTemperature, v => `${v} °C`) },
      { label: 'Second Time Target', value: secondValue(data.secondFermentationTimeTarget, v => `${v} h`) },

      // DRYING
      { label: 'Drying', value: safe(data.drying) },
      { label: 'Second Drying', value: safe(data.secondDrying) },
      { label: 'Rehydration', value: safe(data.rehydration) },
    ];

    // -----------------------------
    // TABLE
    // -----------------------------
    doc.autoTable({
      startY: 30,
      head: [['Label', 'Value']],
      body: fields.map(field => [field.label, field.value]),
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 80 }, // Label column
        1: { cellWidth: 100 }, // Value column
      },
      margin: { left: 20, right: 20 },
    });

    doc.save(`HEQA_Fermentation_Order_Sheet_${data.batchNumber || 'Untitled'}.pdf`);
  };
