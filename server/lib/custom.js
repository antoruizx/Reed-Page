import Design from "../models/Design.js";
import { getSettings } from "../models/Settings.js";
import {
  configError,
  garmentById,
  packError,
  priceCustom,
  pricePack,
  SIDES,
  sizesError,
  totalUnits,
} from "../../shared/pricing.js";
import { badRequest } from "../errors.js";

const clamp = (n, min, max) => Math.min(max, Math.max(min, Number(n) || 0));

// Nos quedamos solo con los campos conocidos y tomamos la imagen desde la base
function cleanConfig(raw, designsById) {
  const config = { garment: String(raw?.garment || ""), color: String(raw?.color || "") };
  for (const side of SIDES) {
    const p = raw?.[side];
    if (!p) continue;
    const design = designsById.get(String(p.designId));
    if (!design) throw badRequest("Uno de los diseños ya no está disponible. Volvé a cargarlo.");
    config[side] = {
      designId: design.id,
      src: design.src,
      name: design.name,
      aspect: clamp(p.aspect, 0.05, 20),
      widthCm: clamp(p.widthCm, 0, 60),
      x: clamp(p.x, 0, 1),
      y: clamp(p.y, 0, 1),
    };
  }
  return config;
}

function cleanSizes(raw) {
  return Object.fromEntries(
    Object.entries(raw || {})
      .map(([k, v]) => [String(k), Math.floor(Number(v))])
      .filter(([, v]) => v > 0)
  );
}

// Recibe lo que mandó el carrito y devuelve los ítems listos para guardar, con precios del servidor
export async function buildCustomItems(rawItems = []) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) return { customItems: [], subtotal: 0 };
  if (rawItems.length > 20) throw badRequest("Demasiadas remeras personalizadas en un solo pedido");

  const settings = await getSettings();
  const ids = new Set();
  const collect = (cfg) => SIDES.forEach((s) => cfg?.[s]?.designId && ids.add(String(cfg[s].designId)));
  for (const raw of rawItems) {
    if (raw.type === "pack") (raw.items || []).forEach((i) => collect(i.config));
    else collect(raw.config);
  }
  const validIds = [...ids].filter((id) => /^[a-f0-9]{24}$/.test(id));
  const designs = await Design.find({ _id: { $in: validIds } });
  const designsById = new Map(designs.map((d) => [d.id, d]));

  const customItems = [];
  for (const raw of rawItems) {
    if (raw.type === "pack") {
      const line = {
        packId: String(raw.packId),
        items: (raw.items || []).slice(0, 20).map((i) => ({
          config: cleanConfig(i.config, designsById),
          sizes: cleanSizes(i.sizes),
        })),
      };
      const err = packError(settings, line);
      if (err) throw badRequest(err);
      const price = pricePack(settings, line);
      customItems.push({
        kind: "pack",
        title: price.pack.name,
        packId: price.pack.id,
        entries: line.items.map((i) => ({ ...i, units: totalUnits(i.sizes) })),
        quantity: price.qty,
        subtotal: price.total,
        discountPct: 0,
        total: price.total,
      });
    } else {
      const config = cleanConfig(raw.config, designsById);
      const sizes = cleanSizes(raw.sizes);
      const err = configError(settings, config) || sizesError(settings, config, sizes);
      if (err) throw badRequest(err);
      const price = priceCustom(settings, { config, sizes });
      customItems.push({
        kind: "custom",
        title: `${garmentById(settings, config.garment).name} personalizada`,
        entries: [{ config, sizes, units: price.qty }],
        quantity: price.qty,
        subtotal: price.subtotal,
        discountPct: price.discountPct,
        total: price.total,
      });
    }
  }
  return { customItems, subtotal: customItems.reduce((s, i) => s + i.total, 0) };
}
