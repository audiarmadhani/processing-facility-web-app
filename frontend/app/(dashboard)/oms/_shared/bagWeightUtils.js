/** Positive number check for bag weight (kg) inputs. */
export function isValidBagWeight(bagWeightKg) {
  const weight = parseFloat(bagWeightKg);
  return Number.isFinite(weight) && weight > 0;
}

/**
 * Bag count from total quantity and per-bag weight.
 * @param {number|string} quantity - Total weight in kg
 * @param {number|string} bagWeightKg - Weight per bag in kg
 * @returns {number}
 */
export function bagsFromWeight(quantity, bagWeightKg) {
  const qty = parseFloat(quantity) || 0;
  const weight = parseFloat(bagWeightKg);
  if (!Number.isFinite(weight) || weight <= 0) return 0;
  return Math.ceil(qty / weight) || 0;
}

/**
 * Prefer stored jumlah_karung; otherwise derive from item bag_weight_kg.
 * @param {{ quantity?: number|string, bag_weight_kg?: number|string, jumlah_karung?: number|string }} item
 * @returns {number}
 */
export function bagsForItem(item) {
  if (item == null) return 0;
  if (item.jumlah_karung !== undefined && item.jumlah_karung !== null && item.jumlah_karung !== '') {
    const n = parseInt(item.jumlah_karung, 10);
    if (Number.isInteger(n) && n > 0) return n;
  }
  return bagsFromWeight(item.quantity, item.bag_weight_kg);
}
