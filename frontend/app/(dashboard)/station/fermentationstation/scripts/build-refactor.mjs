import fs from 'fs';
import path from 'path';

const root = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const pagePath = path.join(root, 'page.js');
const lines = fs.readFileSync(pagePath, 'utf8').split('\n');
const full = lines.join('\n');

function slice(start, end) {
  return lines.slice(start - 1, end).join('\n');
}

function write(rel, content) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  console.log('wrote', rel);
}

function extractIdentifiers(code) {
  const ids = new Set();
  const re = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
  let m;
  while ((m = re.exec(code))) {
    const id = m[1];
    if (
      [
        'true', 'false', 'null', 'undefined', 'return', 'new', 'const', 'let', 'var',
        'if', 'else', 'map', 'find', 'filter', 'key', 'value', 'props', 'params', 'option',
        'e', 'event', 'row', 'Box', 'Typography', 'Grid', 'TextField', 'Card', 'CardContent',
        'FormControl', 'InputLabel', 'Select', 'MenuItem', 'OutlinedInput', 'Autocomplete',
        'Accordion', 'AccordionSummary', 'AccordionDetails', 'ExpandMoreIcon', 'CircularProgress',
        'MenuProps', 'sx', 'mb', 'mt', 'xs', 'md', 'item', 'variant', 'fullWidth', 'margin',
        'normal', 'required', 'disabled', 'type', 'number', 'shrink', 'onChange', 'onBlur',
        'onClick', 'onSubmit', 'label', 'options', 'renderInput', 'renderOption', 'renderCell',
        'getOptionLabel', 'isOptionEqualToValue', 'loading', 'InputProps', 'input', 'inputProps',
        'InputLabelProps', 'endAdornment', 'size', 'color', 'text', 'secondary', 'align', 'center',
        'colSpan', 'parseFloat', 'dayjs', 'format', 'String', 'parseInt', 'Array', 'Set', 'Object',
        'Math', 'Date', 'isNaN', 'alert', 'window', 'confirm', 'console', 'error', 'includes',
        'startsWith', 'toLowerCase', 'mode', 'form',
      ].includes(id)
    ) {
      continue;
    }
    ids.add(id);
  }
  return [...ids].sort();
}

const API =
  "export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://processing-facility-backend.onrender.com';\n";

write(
  'constants.js',
  `'use client';

${API}
export const FERMENTATION_ALLOWED_ROLES = ['admin', 'manager', 'staff'];

export const defaultProcessingTypes = [
  "Aerobic Natural", "Aerobic Pulped Natural", "Aerobic Washed",
  "Anaerobic Natural", "Anaerobic Pulped Natural", "Anaerobic Washed",
  "CM Natural", "CM Pulped Natural", "CM Washed",
  "Natural", "O2 Natural", "O2 Pulped Natural", "O2 Washed",
  "Pulped Natural", "Washed"
];

export const blueBarrelCodes = Array.from({ length: 50 }, (_, i) =>
  \`BB-HQ-\${String(i + 1).padStart(4, '0')}\`
);

export const bucketCodes = Array.from({ length: 50 }, (_, i) =>
  \`BUC-HQ-\${String(i + 1).padStart(4, '0')}\`
);

export const producers = ['HQ', 'BTM'];

export const accordionFormContentSx = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  width: { xs: '100%', md: 'calc(50% - 8px)' },
  maxWidth: '100%',
  marginInline: 'auto',
  gap: 2,
  alignItems: 'start',
  '& .MuiTextField-root': { margin: '0 !important' },
  '& .MuiAutocomplete-root': { margin: '0 !important' },
  '& .MuiFormControl-root': { margin: '0 !important' },
  '& .MuiTypography-root': { gridColumn: '1 / -1' },
};

export const accordionDetailsSx = {
  '& .MuiGrid-container': { justifyContent: 'center' },
  '& .MuiGrid-item': {
    flexBasis: '100% !important',
    maxWidth: { xs: '100% !important', md: 'calc(70% - 8px) !important' },
  },
  '& .MuiTextField-root': { marginTop: '0 !important', marginBottom: '0 !important' },
  '& .MuiAutocomplete-root': { marginTop: '0 !important', marginBottom: '0 !important' },
  '& .MuiFormControl-root': { marginTop: '0 !important', marginBottom: '0 !important' },
};
`
);

write(
  'utils/formatDateTimeLocal.js',
  `'use client';

import dayjs from 'dayjs';

export function formatDateTimeLocal(date) {
  if (!date) return '';
  const d = dayjs(date);
  if (!d.isValid()) return '';
  return d.format('YYYY-MM-DDTHH:mm');
}
`
);

write(
  'utils/mapRowToFormState.js',
  `'use client';

export function mapRowToFormState(row) {
  if (!row) return {};
  return { ...row };
}
`
);

let exportOrder = slice(1017, 1294);
exportOrder = exportOrder
  .replace(/^  const generateOrderSheet = \(\) => \{/, 'export function generateOrderSheet(formState) {')
  .replace(/^  const generateOrderSheetRow = \(row\) => \{/, 'export function generateOrderSheetRow(row) {');

// Prefix form fields in generateOrderSheet with formState.
const formFields = [
  'batchNumber', 'referenceNumber', 'version', 'experimentNumber', 'processingType', 'description',
  'farmerName', 'type', 'variety', 'productLine', 'preStorage', 'preFermentationStorageGoal',
  'preFermentationStorageStart', 'preFermentationStorageEnd', 'prePulped', 'prePulpedDelva',
  'wesorter', 'preClassifier', 'cherryType', 'fermentation', 'tank', 'fermentationStarter',
  'fermentationStarterAmount', 'gas', 'pressure', 'isSubmerged', 'totalVolume', 'stirring',
  'fermentationTemperature', 'pH', 'fermentationTimeTarget', 'fermentationStart', 'postPulped',
  'postPulpedDelva', 'airlock', 'tankAmount', 'leachateTarget', 'brewTankTemperature',
  'waterTemperature', 'coolerTemperature', 'secondFermentation', 'secondFermentationTank',
  'secondPostPulped', 'secondPostPulpedDelva', 'secondWashed', 'secondStarterType', 'secondGas',
  'secondPressure', 'secondIsSubmerged', 'secondTotalVolume', 'secondTemperature',
  'secondFermentationTimeTarget', 'drying', 'secondDrying', 'rehydration', 'fermentationStart',
];
const uniqueFields = [...new Set(formFields)];
for (const f of uniqueFields) {
  const re = new RegExp(`(?<!formState\\.)(?<!data\\.)(?<!row\\.)(?<![A-Za-z0-9_])${f}(?![A-Za-z0-9_])`, 'g');
  exportOrder = exportOrder.replace(re, (match, offset, str) => {
    const before = str.slice(Math.max(0, offset - 20), offset);
    if (before.includes('formState.') || before.includes('data.') || before.includes('label:')) return match;
    if (f === 'fermentationStart' && before.includes('function generateOrderSheetRow')) return match;
    return `formState.${match}`;
  });
}

// Manual fix for generateOrderSheet - use destructuring at top instead
const orderSheetBody = slice(1017, 1129);
const orderSheetRowBody = slice(1131, 1294);

write(
  'utils/exportOrderSheet.js',
  `'use client';

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
    referenceNumber && version ? \`\${referenceNumber}-\${version}\` : '';

  const derivedDate = fermentationStart
    ? dayjs(fermentationStart).format('DD/MM/YYYY HH:mm:ss')
    : dayjs().format('DD/MM/YYYY HH:mm:ss');

${orderSheetBody.replace(/^  const generateOrderSheet = \(\) => \{\n/, '').replace(/^    const doc = new jsPDF\(\);\n/, '  const doc = new jsPDF();\n')}
}

${orderSheetRowBody
  .replace(/^  const generateOrderSheetRow = \(row\) => \{/, 'export function generateOrderSheetRow(row) {')
  .replace(/^  ;\n?$/, '')}
`
);

write(
  'utils/exportFullXlsx.js',
  `'use client';

import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

${slice(1626, 1661).replace(/^  const downloadFermentationDataExcel/, 'export function downloadFermentationDataExcel')}
`
);

const sectionImports = `import {
  Typography,
  Grid,
  TextField,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Box,
  CircularProgress,
} from '@mui/material';
import { Autocomplete } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { accordionFormContentSx, accordionDetailsSx } from '../../constants';
import { wideMenuProps as MenuProps } from '../../../_shared/constants/menuProps';
import { formatDateTimeLocal } from '../../utils/formatDateTimeLocal';
`;

const sections = [
  { name: 'CherryInformationSection', create: [1691, 1836], details: [2642, 2919] },
  { name: 'PreFermentationSection', create: [1838, 1934], details: [2921, 3071] },
  { name: 'FermentationSection', create: [1936, 2170], details: [3073, 3452] },
  { name: 'SecondFermentationSection', create: [2172, 2312], details: [3454, 3712] },
  { name: 'DryingSection', create: [2314, 2361], details: [3714, 3992] },
];

for (const s of sections) {
  const createBlock = slice(s.create[0], s.create[1]);
  const detailsBlock = slice(s.details[0], s.details[1]);
  const ids = [
    ...new Set([
      ...extractIdentifiers(createBlock),
      ...extractIdentifiers(detailsBlock),
    ]),
  ];
  const destruct = ids.join(',\n  ');

  write(
    `components/sections/${s.name}.jsx`,
    `'use client';

${sectionImports}

export default function ${s.name}({ mode, ...form }) {
  const {
  ${destruct}
  } = form;

  if (mode === 'create') {
    return (
${createBlock}
    );
  }

  return (
${detailsBlock}
  );
}
`
  );
}

// Extract hook logic (lines 52-1661) - save for manual hook file
write('scripts/_hookLogic.txt', slice(52, 1661), '');

console.log('build complete');
