import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const root = path.dirname(new URL(import.meta.url).pathname);
const repoRoot = path.resolve(root, '../../../../..');
const pageContent = execSync(
  `git -C "${repoRoot}" show HEAD:"frontend/app/(dashboard)/station/fermentationstation/page.js"`,
  { encoding: 'utf8' }
);
const lines = pageContent.split('\n');

function slice(start, end) {
  return lines.slice(start - 1, end).join('\n');
}

const formKeys = `batchNumber setBatchNumber referenceNumber setReferenceNumber version setVersion fullReferenceNumber experimentNumber setExperimentNumber processingType setProcessingType description setDescription farmerName setFarmerName type setType variety setVariety harvestDate setHarvestDate harvestAt setHarvestAt receivedAt setReceivedAt receivedWeight setReceivedWeight rejectWeight setRejectWeight defectWeight setDefectWeight damagedWeight setDamagedWeight lostWeight setLostWeight preprocessingWeight setPreprocessingWeight quality setQuality brix setBrix preStorage setPreStorage preStorageCondition setPreStorageCondition preFermentationStorageGoal setPreFermentationStorageGoal preFermentationStorageStart setPreFermentationStorageStart preFermentationStorageEnd setPreFermentationStorageEnd prePulped setPrePulped prePulpedDelva setPrePulpedDelva preFermentationTimeAfterPulping setPreFermentationTimeAfterPulping prePulpedWeight setPrePulpedWeight cherryType setCherryType fermentationCherryWeight setFermentationCherryWeight fermentation setFermentation tank setTank fermentationStarter setFermentationStarter fermentationStarterAmount setFermentationStarterAmount gas setGas pressure setPressure isSubmerged setIsSubmerged totalVolume setTotalVolume waterUsed setWaterUsed starterUsed setStarterUsed stirring setStirring fermentationTemperature setFermentationTemperature pH setPH fermentationTimeTarget setFermentationTimeTarget fermentationStart setFermentationStart fermentationEnd setFermentationEnd finalPH setFinalPH finalTDS setFinalTDS finalTemperature setFinalTemperature postFermentationWeight setPostFermentationWeight postPulped setPostPulped postPulpedDelva setPostPulpedDelva secondFermentation setSecondFermentation secondFermentationTank setSecondFermentationTank secondPostPulped setSecondPostPulped secondPostPulpedDelva setSecondPostPulpedDelva secondWashed setSecondWashed secondFermentationCherryWeight setSecondFermentationCherryWeight secondFermentationPulpedWeight setSecondFermentationPulpedWeight secondStarterType setSecondStarterType secondGas setSecondGas secondPressure setSecondPressure secondIsSubmerged setSecondIsSubmerged secondTotalVolume setSecondTotalVolume secondWaterUsed setSecondWaterUsed secondMosstoUsed setSecondMosstoUsed secondActualVolume setSecondActualVolume secondTemperature setSecondTemperature secondFermentationTimeTarget setSecondFermentationTimeTarget secondFermentationStart setSecondFermentationStart secondFermentationEnd setSecondFermentationEnd dryingArea setDryingArea avgTemperature setAvgTemperature preDryingWeight setPreDryingWeight finalMoisture setFinalMoisture postDryingWeight setPostDryingWeight dryingStart setDryingStart dryingEnd setDryingEnd secondDrying setSecondDrying secondDryingArea setSecondDryingArea secondAverageTemperature setSecondAverageTemperature secondFinalMoisture setSecondFinalMoisture secondPostDryingWeight setSecondPostDryingWeight secondDryingStart setSecondDryingStart secondDryingEnd setSecondDryingEnd rehydration setRehydration storage setStorage storageTemperature setStorageTemperature hullingTime setHullingTime bagType setBagType postHullingWeight setPostHullingWeight productLine setProductLine wesorter setWesorter preClassifier setPreClassifier airlock setAirlock tankAmount setTankAmount leachateTarget setLeachateTarget leachate setLeachate brewTankTemperature setBrewTankTemperature waterTemperature setWaterTemperature coolerTemperature setCoolerTemperature drying setDrying availableBatches availableTanks isLoadingTanks tankError referenceMappings availableProcessingTypes fieldDisabled detailsFieldDisabled isSecondFermentationDisabled isDetailsSecondFermentationDisabled derivedDate formatDateTimeLocal handleBatchNumberChange handleReferenceNumberChange handleProcessingTypeChange handleTankChange handleSubmit resetForm checkExperimentNumber generateOrderSheet detailsData setDetailsData handleUpdateDetails selectedBatch setSelectedBatch openDetailsDialog setOpenDetailsDialog handleDetailsClick fetchDetailsData fetchAvailableBatches fetchAvailableTanks fetchReferenceMappings producers MenuProps accordionFormContentSx accordionDetailsSx`.split(
  ' '
);

const keySet = new Set(formKeys);

function usedKeys(code) {
  const found = new Set();
  const re = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
  let m;
  while ((m = re.exec(code))) {
    if (keySet.has(m[1])) found.add(m[1]);
  }
  return [...found].sort();
}

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
  const keys = [...new Set([...usedKeys(createBlock), ...usedKeys(detailsBlock)])];
  const destruct = keys.join(',\n    ');

  write(
    `components/sections/${s.name}.jsx`,
    `'use client';

${sectionImports}

export default function ${s.name}({ mode, form }) {
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

function write(rel, content) {
  fs.writeFileSync(path.join(root, rel), content);
  console.log('rebuilt', rel);
}

console.log('sections rebuilt from git HEAD');
