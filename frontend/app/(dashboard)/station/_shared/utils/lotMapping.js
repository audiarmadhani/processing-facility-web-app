/** Derive producer label from preprocessing lot mapping (wet mill weight UI). */
export function deriveProducerFromLotMapping(processingType, lotMapping) {
  if (!lotMapping || !Array.isArray(lotMapping)) return '';
  const mapping = lotMapping.find((m) => m.processingType === processingType);
  if (!mapping || !mapping.lotNumber) return '';
  if (mapping.lotNumber.startsWith('HQ')) return 'HQ';
  if (mapping.lotNumber.startsWith('ID-BTM')) return 'BTM';
  return '';
}
