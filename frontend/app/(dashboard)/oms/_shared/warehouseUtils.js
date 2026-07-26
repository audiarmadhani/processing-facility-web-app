export const FALLBACK_WAREHOUSE = {
  id: null,
  name: 'Bali',
  company_name: 'PT. BERKAS TUAIAN MELIMPAH',
  address: 'Bengkala, Kubutambahan, Buleleng, Bali',
  phone: 'Telp. 085175027797',
  is_default: true,
};

export function resolveWarehouse(warehouses = [], warehouseId) {
  if (!Array.isArray(warehouses) || warehouses.length === 0) {
    return FALLBACK_WAREHOUSE;
  }
  const byId = warehouseId
    ? warehouses.find((w) => String(w.id) === String(warehouseId))
    : null;
  if (byId) return byId;
  return warehouses.find((w) => w.is_default) || warehouses[0] || FALLBACK_WAREHOUSE;
}

export function warehousePdfFields(warehouse) {
  const w = warehouse || FALLBACK_WAREHOUSE;
  return {
    company_name: w.company_name || FALLBACK_WAREHOUSE.company_name,
    address: w.address || FALLBACK_WAREHOUSE.address,
    phone: w.phone || FALLBACK_WAREHOUSE.phone,
  };
}
