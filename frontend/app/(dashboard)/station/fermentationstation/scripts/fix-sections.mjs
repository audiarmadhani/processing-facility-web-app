import fs from 'fs';
import path from 'path';

const root = path.dirname(path.dirname(new URL(import.meta.url).pathname));

const formKeys = `batchNumber setBatchNumber referenceNumber setReferenceNumber version setVersion fullReferenceNumber experimentNumber setExperimentNumber processingType setProcessingType description setDescription farmerName setFarmerName type setType variety setVariety harvestDate setHarvestDate harvestAt setHarvestAt receivedAt setReceivedAt receivedWeight setReceivedWeight rejectWeight setRejectWeight defectWeight setDefectWeight damagedWeight setDamagedWeight lostWeight setLostWeight preprocessingWeight setPreprocessingWeight quality setQuality brix setBrix preStorage setPreStorage preStorageCondition setPreStorageCondition preFermentationStorageGoal setPreFermentationStorageGoal preFermentationStorageStart setPreFermentationStorageStart preFermentationStorageEnd setPreFermentationStorageEnd prePulped setPrePulped prePulpedDelva setPrePulpedDelva preFermentationTimeAfterPulping setPreFermentationTimeAfterPulping prePulpedWeight setPrePulpedWeight cherryType setCherryType fermentationCherryWeight setFermentationCherryWeight fermentation setFermentation tank setTank fermentationStarter setFermentationStarter fermentationStarterAmount setFermentationStarterAmount gas setGas pressure setPressure isSubmerged setIsSubmerged totalVolume setTotalVolume waterUsed setWaterUsed starterUsed setStarterUsed stirring setStirring fermentationTemperature setFermentationTemperature pH setPH fermentationTimeTarget setFermentationTimeTarget fermentationStart setFermentationStart fermentationEnd setFermentationEnd finalPH setFinalPH finalTDS setFinalTDS finalTemperature setFinalTemperature postFermentationWeight setPostFermentationWeight postPulped setPostPulped postPulpedDelva setPostPulpedDelva secondFermentation setSecondFermentation secondFermentationTank setSecondFermentationTank secondPostPulped setSecondPostPulped secondPostPulpedDelva setSecondPostPulpedDelva secondWashed setSecondWashed secondFermentationCherryWeight setSecondFermentationCherryWeight secondFermentationPulpedWeight setSecondFermentationPulpedWeight secondStarterType setSecondStarterType secondGas setSecondGas secondPressure setSecondPressure secondIsSubmerged setSecondIsSubmerged secondTotalVolume setSecondTotalVolume secondWaterUsed setSecondWaterUsed secondMosstoUsed setSecondMosstoUsed secondActualVolume setSecondActualVolume secondTemperature setSecondTemperature secondFermentationTimeTarget setSecondFermentationTimeTarget secondFermentationStart setSecondFermentationStart secondFermentationEnd setSecondFermentationEnd dryingArea setDryingArea avgTemperature setAvgTemperature preDryingWeight setPreDryingWeight finalMoisture setFinalMoisture postDryingWeight setPostDryingWeight dryingStart setDryingStart dryingEnd setDryingEnd secondDrying setSecondDrying secondDryingArea setSecondDryingArea secondAverageTemperature setSecondAverageTemperature secondFinalMoisture setSecondFinalMoisture secondPostDryingWeight setSecondPostDryingWeight secondDryingStart setSecondDryingStart secondDryingEnd setSecondDryingEnd rehydration setRehydration storage setStorage storageTemperature setStorageTemperature hullingTime setHullingTime bagType setBagType postHullingWeight setPostHullingWeight productLine setProductLine wesorter setWesorter preClassifier setPreClassifier airlock setAirlock tankAmount setTankAmount leachateTarget setLeachateTarget leachate setLeachate brewTankTemperature setBrewTankTemperature waterTemperature setWaterTemperature coolerTemperature setCoolerTemperature drying setDrying availableBatches availableTanks isLoadingTanks tankError referenceMappings availableProcessingTypes fieldDisabled detailsFieldDisabled isSecondFermentationDisabled isDetailsSecondFermentationDisabled derivedDate formatDateTimeLocal handleBatchNumberChange handleReferenceNumberChange handleProcessingTypeChange handleTankChange handleSubmit resetForm checkExperimentNumber generateOrderSheet detailsData setDetailsData handleUpdateDetails selectedBatch setSelectedBatch openDetailsDialog setOpenDetailsDialog handleDetailsClick fetchDetailsData fetchAvailableBatches fetchAvailableTanks fetchReferenceMappings producers`.split(
  ' '
);

const keys = [...formKeys].sort((a, b) => b.length - a.length);

function prefixFormKeys(code) {
  let out = code;
  for (const key of keys) {
    const re = new RegExp(`(?<![.\\w])${key}(?![\\w])`, 'g');
    out = out.replace(re, `f.${key}`);
  }
  // undo double prefix
  out = out.replace(/f\.f\./g, 'f.');
  return out;
}

const sectionsDir = path.join(root, 'components/sections');
for (const file of fs.readdirSync(sectionsDir).filter((f) => f.endsWith('.jsx'))) {
  let content = fs.readFileSync(path.join(sectionsDir, file), 'utf8');
  const headerEnd = content.indexOf('export default function');
  const header = content.slice(0, headerEnd);
  const rest = content.slice(headerEnd);
  const fnMatch = rest.match(/export default function \w+\(\{ mode, \.\.\.form \}\) \{[\s\S]*?const \{[\s\S]*?\} = form;\s*/);
  if (!fnMatch) {
    console.log('skip', file);
    continue;
  }
  const afterDestruct = rest.slice(fnMatch[0].length);
  const fixedBody = prefixFormKeys(afterDestruct);
  const newContent =
    header +
    `export default function ${file.replace('.jsx', '')}({ mode, form: f }) {
` +
    fixedBody;
  fs.writeFileSync(path.join(sectionsDir, file), newContent);
  console.log('fixed', file);
}
