// =====================================================================
// Precios de remeras personalizadas.
// Este archivo lo usan el front (para mostrar el precio en vivo) y el
// back (para cobrar). El servidor SIEMPRE recalcula: el navegador no decide.
// =====================================================================

export const BIG_SIZES = ["XXL", "XXXL"];

// Configuración inicial. Se guarda en la base y se edita desde el panel.
export const DEFAULT_SETTINGS = {
  productionDays: "5 a 7 días hábiles",
  bigSizeSurcharge: 2500, // recargo por talle XXL/XXXL
  garments: [
    {
      id: "boxy",
      name: "Oversize Boxy",
      description: "Corta y bien ancha. El calce más canchero.",
      basePrice: 19000,
      sizes: ["S", "M", "L", "XL", "XXL"],
      printArea: { w: 32, h: 36 }, // centímetros
      active: true,
    },
    {
      id: "clasica",
      name: "Oversize Clásica",
      description: "Hombro caído y largo justo. La que va con todo.",
      basePrice: 18000,
      sizes: ["S", "M", "L", "XL", "XXL", "XXXL"],
      printArea: { w: 30, h: 40 },
      active: true,
    },
    {
      id: "larga",
      name: "Oversize Larga",
      description: "Más larga y suelta. Para usar sola o con bikers.",
      basePrice: 20500,
      sizes: ["S", "M", "L", "XL", "XXL"],
      printArea: { w: 30, h: 44 },
      active: true,
    },
    {
      id: "baby",
      name: "Baby Tee",
      description: "Al cuerpo y cortita, estilo 2000.",
      basePrice: 15500,
      sizes: ["XS", "S", "M", "L"],
      printArea: { w: 22, h: 24 },
      active: true,
    },
  ],
  colors: [
    { name: "Blanco", hex: "#F3F3EF" },
    { name: "Negro", hex: "#1C1B1F" },
    { name: "Gris melange", hex: "#A9A9AB" },
    { name: "Arena", hex: "#CDBFA3" },
    { name: "Celeste", hex: "#A9CFEA" },
    { name: "Rosa chicle", hex: "#E48B9C" },
    { name: "Uva", hex: "#7A4C7F" },
    { name: "Verde oliva", hex: "#6B6B3A" },
    { name: "Azul marino", hex: "#1F2A44" },
    { name: "Ladrillo", hex: "#B0563A" },
  ],
  // Tamaños de estampa: el diseñador elige solo según lo que mide el diseño
  printSizes: [
    { id: "chico", name: "Chico (hasta 10 × 10 cm)", maxW: 10, maxH: 10, price: 4500 },
    { id: "a4", name: "Mediano A4 (hasta 21 × 30 cm)", maxW: 21, maxH: 30, price: 8500 },
    { id: "a3", name: "Grande A3 (hasta 30 × 42 cm)", maxW: 30, maxH: 42, price: 12500 },
  ],
  // Descuento automático según cuántas remeras iguales llevás
  tiers: [
    { min: 5, pct: 10 },
    { min: 10, pct: 15 },
    { min: 25, pct: 20 },
  ],
  // Packs para revendedores: precio cerrado, incluye una estampa por remera
  packs: [
    {
      id: "mini",
      name: "Pack Mini Emprendedor",
      units: 10,
      maxDesigns: 2,
      price: 210000,
      perks: ["10 remeras oversize", "Hasta 2 diseños distintos", "Una estampa por remera, hasta A3"],
      active: true,
    },
    {
      id: "arranque",
      name: "Pack Arranque",
      units: 30,
      maxDesigns: 5,
      price: 585000,
      perks: ["30 remeras oversize", "Hasta 5 diseños distintos", "Una estampa por remera, hasta A3"],
      active: true,
    },
    {
      id: "marca",
      name: "Pack Marca",
      units: 60,
      maxDesigns: 10,
      price: 1080000,
      perks: [
        "60 remeras oversize",
        "Hasta 10 diseños distintos",
        "Una estampa por remera, hasta A3",
        "Etiqueta interna con tu logo",
      ],
      active: true,
    },
  ],
  packGarments: ["boxy", "clasica", "larga"],
};

export const SIDES = ["front", "back"];
export const SIDE_LABELS = { front: "Frente", back: "Espalda" };

export const garmentById = (s, id) => s.garments.find((g) => g.id === id && g.active !== false);

export function placementSize(p) {
  const w = Number(p.widthCm) || 0;
  return { w, h: w * (Number(p.aspect) || 1) };
}

// Qué tamaño de estampa corresponde según cuánto mide el diseño
export function printSizeFor(s, p) {
  const { w, h } = placementSize(p);
  const sorted = [...s.printSizes].sort((a, b) => a.price - b.price);
  return sorted.find((ps) => w <= ps.maxW + 0.01 && h <= ps.maxH + 0.01) || sorted[sorted.length - 1];
}

export const placements = (config) => SIDES.map((side) => config[side] && { side, ...config[side] }).filter(Boolean);

export function printCost(s, config) {
  return placements(config).reduce((sum, p) => sum + printSizeFor(s, p).price, 0);
}

export function unitBase(s, garmentId, size) {
  const g = garmentById(s, garmentId);
  if (!g) return 0;
  return g.basePrice + (BIG_SIZES.includes(size) ? s.bigSizeSurcharge : 0);
}

export function tierFor(s, qty) {
  return [...s.tiers].sort((a, b) => b.min - a.min).find((t) => qty >= t.min) || null;
}

export function nextTier(s, qty) {
  return [...s.tiers].sort((a, b) => a.min - b.min).find((t) => qty < t.min) || null;
}

export const totalUnits = (sizes) =>
  Object.values(sizes || {}).reduce((a, n) => a + (Math.max(0, Math.floor(Number(n))) || 0), 0);

// Remera personalizada suelta (o varias iguales en distintos talles)
export function priceCustom(s, line) {
  const qty = totalUnits(line.sizes);
  const print = printCost(s, line.config);
  let subtotal = 0;
  for (const [size, n] of Object.entries(line.sizes || {})) {
    subtotal += (Number(n) || 0) * (unitBase(s, line.config.garment, size) + print);
  }
  const tier = tierFor(s, qty);
  const discount = tier ? Math.round((subtotal * tier.pct) / 100) : 0;
  return { qty, print, subtotal, discountPct: tier?.pct || 0, discount, total: subtotal - discount };
}

// Pack: precio cerrado + extras (segunda estampa y talles grandes)
export function pricePack(s, line) {
  const pack = s.packs.find((p) => p.id === line.packId && p.active !== false);
  if (!pack) return null;
  let extras = 0;
  let qty = 0;
  for (const item of line.items || []) {
    const n = totalUnits(item.sizes);
    qty += n;
    const prints = placements(item.config).map((p) => printSizeFor(s, p).price).sort((a, b) => a - b);
    if (prints.length > 1) extras += prints[0] * n; // la estampa más barata se cobra aparte
    for (const big of BIG_SIZES) extras += (Number(item.sizes?.[big]) || 0) * s.bigSizeSurcharge;
  }
  return { pack, qty, extras, total: pack.price + extras };
}

// Valida una configuración; devuelve un texto de error o null
export function configError(s, config, { forPack = false } = {}) {
  if (!config) return "Falta la configuración de la remera";
  const g = garmentById(s, config.garment);
  if (!g) return "Ese modelo de remera no está disponible";
  if (forPack && !s.packGarments.includes(g.id)) return `${g.name} no entra en los packs`;
  if (!s.colors.some((c) => c.name === config.color)) return "Ese color no está disponible";
  const ps = placements(config);
  if (ps.length === 0) return "Agregá un diseño adelante o atrás";
  for (const p of ps) {
    if (!p.designId) return "Falta el diseño";
    const { w, h } = placementSize(p);
    if (!(w >= 3) || w > g.printArea.w + 0.01 || h > g.printArea.h + 0.01) return "El diseño no entra en la remera";
  }
  return null;
}

export function sizesError(s, config, sizes) {
  const g = garmentById(s, config?.garment);
  if (!g) return "Modelo inválido";
  const entries = Object.entries(sizes || {}).filter(([, n]) => Number(n) > 0);
  if (!entries.length) return "Elegí al menos un talle";
  for (const [size, n] of entries) {
    if (!g.sizes.includes(size)) return `${g.name} no viene en talle ${size}`;
    if (!Number.isInteger(Number(n)) || n < 0 || n > 500) return "Cantidad inválida";
  }
  return null;
}

export function packError(s, line) {
  const pack = s.packs.find((p) => p.id === line.packId && p.active !== false);
  if (!pack) return "Ese pack no está disponible";
  const items = line.items || [];
  if (!items.length) return "El pack está vacío";
  if (items.length > pack.maxDesigns) return `El ${pack.name} admite hasta ${pack.maxDesigns} diseños`;
  for (const item of items) {
    const err = configError(s, item.config, { forPack: true }) || sizesError(s, item.config, item.sizes);
    if (err) return err;
  }
  const qty = items.reduce((a, i) => a + totalUnits(i.sizes), 0);
  if (qty !== pack.units) return `El ${pack.name} lleva ${pack.units} remeras y armaste ${qty}`;
  return null;
}

export function describeSizes(sizes) {
  return Object.entries(sizes || {})
    .filter(([, n]) => Number(n) > 0)
    .map(([s, n]) => `${n} ${s}`)
    .join(", ");
}
