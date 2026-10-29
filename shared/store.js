// =====================================================================
// Envíos por zona y pago por transferencia.
// Lo usan el front (para mostrar el costo en vivo) y el back (para cobrar).
// El servidor SIEMPRE recalcula: el navegador no decide.
// =====================================================================

export const PROVINCES = [
  "Buenos Aires", "CABA", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes", "Entre Ríos",
  "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro",
  "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero",
  "Tierra del Fuego", "Tucumán",
];

// Empresas de envío para el seguimiento (el link lleva a su página de seguimiento)
export const CARRIERS = [
  { id: "correo", name: "Correo Argentino", url: "https://www.correoargentino.com.ar/formularios/e-commerce" },
  { id: "andreani", name: "Andreani", url: "https://www.andreani.com/" },
  { id: "oca", name: "OCA", url: "https://www.oca.com.ar/" },
  { id: "viacargo", name: "Vía Cargo", url: "https://www.viacargo.com.ar/" },
  { id: "otro", name: "Otra", url: "" },
];

// Valores iniciales de ejemplo: se editan desde Panel → Envíos y pagos
export const DEFAULT_STORE = {
  shipping: {
    zones: [
      { id: "tucuman", name: "Tucumán", provinces: ["Tucumán"], cost: 3500, freeFrom: 50000 },
      { id: "noa", name: "Norte", provinces: ["Salta", "Jujuy", "Catamarca", "Santiago del Estero", "La Rioja"], cost: 6500, freeFrom: 80000 },
      { id: "centro", name: "Centro y Cuyo", provinces: ["Córdoba", "Santa Fe", "Entre Ríos", "Mendoza", "San Juan", "San Luis", "La Pampa"], cost: 7500, freeFrom: 90000 },
      { id: "amba", name: "Buenos Aires", provinces: ["Buenos Aires", "CABA"], cost: 8500, freeFrom: 90000 },
      { id: "nea", name: "Noreste", provinces: ["Chaco", "Corrientes", "Formosa", "Misiones"], cost: 8000, freeFrom: 90000 },
      { id: "patagonia", name: "Patagonia", provinces: ["Neuquén", "Río Negro", "Chubut", "Santa Cruz", "Tierra del Fuego"], cost: 11000, freeFrom: 120000 },
    ],
    // Para una provincia que no esté en ninguna zona
    otherCost: 9000,
    otherFreeFrom: 100000,
  },
  pickup: {
    enabled: true,
    text: "San Miguel de Tucumán. Coordinamos por WhatsApp.",
  },
  transfer: {
    enabled: false,
    discountPct: 10,
    alias: "",
    cbu: "",
    holder: "",
    bank: "",
  },
};

// Junta lo guardado con los valores por defecto (por si falta algún campo)
export function withStoreDefaults(data = {}) {
  return {
    shipping: { ...DEFAULT_STORE.shipping, ...(data.shipping || {}) },
    pickup: { ...DEFAULT_STORE.pickup, ...(data.pickup || {}) },
    transfer: { ...DEFAULT_STORE.transfer, ...(data.transfer || {}) },
  };
}

export function zoneFor(store, province) {
  return store.shipping.zones.find((z) => z.provinces.includes(province)) || null;
}

// Costo de envío a domicilio según la provincia y el subtotal
export function shippingQuote(store, province, subtotal) {
  const zone = zoneFor(store, province);
  const cost = zone ? zone.cost : store.shipping.otherCost;
  const freeFrom = zone ? zone.freeFrom : store.shipping.otherFreeFrom;
  const isFree = freeFrom > 0 && subtotal >= freeFrom;
  return { zone: zone?.name || "Resto del país", cost: isFree ? 0 : cost, baseCost: cost, freeFrom, isFree };
}

// El mínimo para envío gratis más bajo (para el carrito, antes de saber la provincia)
export function lowestFreeFrom(store) {
  const all = [...store.shipping.zones.map((z) => z.freeFrom), store.shipping.otherFreeFrom].filter((n) => n > 0);
  return all.length ? Math.min(...all) : 0;
}

// Descuento por pagar con transferencia (sobre los productos, no sobre el envío)
export function transferDiscount(store, subtotal) {
  if (!store.transfer.enabled) return 0;
  return Math.round((subtotal * (store.transfer.discountPct || 0)) / 100);
}

export function carrierFor(id) {
  return CARRIERS.find((c) => c.id === id) || null;
}
