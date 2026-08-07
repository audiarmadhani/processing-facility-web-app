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
