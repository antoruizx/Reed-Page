import { Router } from "express";
import Product, { PRODUCT_STATUSES, slugify, statusPatch } from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Design from "../models/Design.js";
import { getSettings, getStore, saveSettings, saveStore } from "../models/Settings.js";
import { ORDER_STATUSES } from "../config.js";
import { applyStock } from "../lib/payments.js";
import { PROVINCES } from "../../shared/store.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { badRequest, notFound } from "../errors.js";

const router = Router();
router.use(requireAuth, requireAdmin);

// ---------- Resumen ----------
router.get("/stats", async (_req, res) => {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [sales, toPrepare, products, lowStock, customers, pendingTransfers] = await Promise.all([
    Order.aggregate([
      { $match: { status: { $in: ["pagada", "preparando", "enviada", "entregada"] }, createdAt: { $gte: since } } },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
    ]),
    Order.countDocuments({ status: "pagada" }),
    Product.countDocuments({ active: true }),
    Product.find({ active: true, "variants.stock": { $lte: 2 } }, { name: 1, slug: 1, variants: 1 }).limit(10),
    User.countDocuments({ role: "customer" }),
    Order.countDocuments({ status: "pendiente", "payment.provider": "transferencia" }),
  ]);
  res.json({
    salesLast30: sales[0]?.total ?? 0,
    ordersLast30: sales[0]?.count ?? 0,
    toPrepare,
    pendingTransfers,
    products,
    customers,
    lowStock: lowStock.map((p) => ({
      id: p._id,
      name: p.name,
      slug: p.slug,
      variants: p.variants.filter((v) => v.stock <= 2),
    })),
  });
});

// ---------- Productos ----------
function cleanProduct(body) {
  const data = {
    name: body.name?.trim(),
    category: body.category,
    description: body.description ?? "",
    details: (body.details || []).map((d) => String(d).trim()).filter(Boolean),
    price: Number(body.price),
    compareAtPrice: body.compareAtPrice ? Number(body.compareAtPrice) : undefined,
    images: (body.images || []).map((u) => String(u).trim()).filter(Boolean),
    colors: body.colors || [],
    variants: (body.variants || []).map((v) => ({ ...v, stock: Math.max(0, Number(v.stock) || 0) })),
    featured: Boolean(body.featured),
    ...(PRODUCT_STATUSES.includes(body.status)
      ? statusPatch(body.status)
      : { active: body.active !== false, soldOut: Boolean(body.soldOut) }),
  };
  const colorNames = new Set(data.colors.map((c) => c.name));
  if (data.variants.some((v) => !colorNames.has(v.color))) {
    throw badRequest("Hay talles cargados para un color que no existe");
  }
  if (data.compareAtPrice && data.compareAtPrice <= data.price) data.compareAtPrice = undefined;
  return data;
}

async function uniqueSlug(name, excludeId) {
  const base = slugify(name) || "producto";
  let slug = base;
  let n = 2;
  while (await Product.exists({ slug, _id: { $ne: excludeId } })) slug = `${base}-${n++}`;
  return slug;
}

router.get("/products", async (_req, res) => {
  const products = await Product.find().sort({ updatedAt: -1 });
  res.json({ products });
});

router.get("/products/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw notFound();
  res.json({ product });
});

router.post("/products", async (req, res) => {
  const data = cleanProduct(req.body ?? {});
  data.slug = await uniqueSlug(data.name || "");
  const product = await Product.create(data);
  res.status(201).json({ product });
});

router.put("/products/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw notFound();
  const data = cleanProduct(req.body ?? {});
  if (data.name !== product.name) data.slug = await uniqueSlug(data.name || "", product._id);
  product.set(data);
  if (!data.compareAtPrice) product.compareAtPrice = undefined;
  await product.save();
  res.json({ product });
});

// Cambiar solo el estado desde la lista: publicado | oculto | agotado
router.patch("/products/:id/status", async (req, res) => {
  const { status } = req.body ?? {};
  if (!PRODUCT_STATUSES.includes(status)) throw badRequest("Estado inválido");
  const product = await Product.findByIdAndUpdate(req.params.id, statusPatch(status), { new: true });
  if (!product) throw notFound();
  res.json({ product });
});

// Borrar de verdad solo si nunca se vendió; si no, se desactiva para no romper pedidos viejos
router.delete("/products/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw notFound();
  if (await Order.exists({ "items.product": product._id })) {
    product.active = false;
    await product.save();
    return res.json({ archived: true });
  }
  await product.deleteOne();
  res.json({ deleted: true });
});

// ---------- Pedidos ----------
router.get("/orders", async (req, res) => {
  const { estado, q } = req.query;
  const filter = {};
  if (estado && ORDER_STATUSES.includes(estado)) filter.status = estado;
  if (req.query.pago === "transferencia") filter["payment.provider"] = "transferencia";
  if (q) {
    const n = Number(String(q).replace("#", ""));
    const safe = String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      ...(n ? [{ number: n }] : []),
      { "customer.email": new RegExp(safe, "i") },
      { "customer.name": new RegExp(safe, "i") },
    ];
  }
  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(200);
  res.json({ orders });
});

// Cambiar estado, cargar el seguimiento del envío o confirmar una transferencia
router.patch("/orders/:id", async (req, res) => {
  const { status, tracking, confirmTransfer } = req.body ?? {};
  const order = await Order.findById(req.params.id);
  if (!order) throw notFound();

  if (confirmTransfer) {
    if (order.payment?.provider !== "transferencia") throw badRequest("Este pedido no es por transferencia");
    order.payment.status = "approved";
    order.payment.method = "transferencia";
    order.payment.paidAt = new Date();
    if (["pendiente", "rechazada"].includes(order.status)) order.status = "pagada";
  }

  if (tracking) {
    const clean = (v, max) => String(v ?? "").trim().slice(0, max);
    const url = clean(tracking.url, 300);
    if (url && !/^https?:\/\//i.test(url)) throw badRequest("El link de seguimiento tiene que empezar con https://");
    order.shipping.carrier = clean(tracking.carrier, 30);
    order.shipping.tracking = clean(tracking.code, 60);
    order.shipping.trackingUrl = url;
    // Cargar el código de un pedido listo lo marca como enviado
    if (order.shipping.tracking && ["pagada", "preparando"].includes(order.status)) order.status = "enviada";
  }

  if (status !== undefined) {
    if (!ORDER_STATUSES.includes(status)) throw badRequest("Estado inválido");
    order.status = status;
  }
  if (order.status === "enviada" && !order.shipping.shippedAt) order.shipping.shippedAt = new Date();

  await order.save();
  if (confirmTransfer) await applyStock(order._id);
  res.json({ order });
});

// ---------- Envíos y pagos ----------
router.get("/store", async (_req, res) => {
  res.json({ store: await getStore() });
});

router.put("/store", async (req, res) => {
  const d = req.body?.store;
  if (!d?.shipping || !Array.isArray(d.shipping.zones)) throw badRequest("Faltan datos de envío");
  const num = (v) => Math.max(0, Math.round(Number(v) || 0));
  const text = (v, max) => String(v ?? "").trim().slice(0, max);

  const used = new Set();
  const zones = d.shipping.zones.map((z, i) => {
    const provinces = (z.provinces || []).filter((p) => PROVINCES.includes(p) && !used.has(p));
    provinces.forEach((p) => used.add(p));
    return {
      id: text(z.id, 40) || `zona-${i + 1}`,
      name: text(z.name, 40) || `Zona ${i + 1}`,
      provinces,
      cost: num(z.cost),
      freeFrom: num(z.freeFrom),
    };
  });

  const cbu = String(d.transfer?.cbu ?? "").replace(/\D/g, "");
  if (cbu && cbu.length !== 22) throw badRequest("El CBU/CVU tiene que tener 22 números");
  const transfer = {
    enabled: Boolean(d.transfer?.enabled),
    discountPct: Math.min(50, num(d.transfer?.discountPct)),
    alias: text(d.transfer?.alias, 40),
    cbu,
    holder: text(d.transfer?.holder, 80),
    bank: text(d.transfer?.bank, 60),
  };
  if (transfer.enabled && !transfer.alias && !transfer.cbu) {
    throw badRequest("Para activar la transferencia cargá tu alias o CBU");
  }

  const store = {
    shipping: { zones, otherCost: num(d.shipping.otherCost), otherFreeFrom: num(d.shipping.otherFreeFrom) },
    pickup: { enabled: d.pickup?.enabled !== false, text: text(d.pickup?.text, 120) },
    transfer,
  };
  res.json({ store: await saveStore(store) });
});

// ---------- Personalizadas: precios, modelos y packs ----------
router.get("/settings", async (_req, res) => {
  res.json({ settings: await getSettings() });
});

router.put("/settings", async (req, res) => {
  const d = req.body?.settings;
  const num = (v) => Math.max(0, Number(v) || 0);
  if (!d || !Array.isArray(d.garments) || !Array.isArray(d.printSizes) || !Array.isArray(d.tiers) || !Array.isArray(d.packs)) {
    throw badRequest("Faltan datos de la configuración");
  }
  const settings = {
    productionDays: String(d.productionDays || "").slice(0, 60),
    bigSizeSurcharge: num(d.bigSizeSurcharge),
    garments: d.garments.map((g) => ({
      id: String(g.id),
      name: String(g.name || "").trim(),
      description: String(g.description || ""),
      basePrice: num(g.basePrice),
      sizes: (g.sizes || []).map(String),
      printArea: { w: num(g.printArea?.w) || 30, h: num(g.printArea?.h) || 40 },
      active: g.active !== false,
    })),
    colors: (d.colors || [])
      .filter((c) => c.name && /^#[0-9a-fA-F]{6}$/.test(c.hex))
      .map((c) => ({ name: String(c.name).trim(), hex: c.hex })),
    printSizes: d.printSizes.map((p) => ({
      id: String(p.id),
      name: String(p.name),
      maxW: num(p.maxW),
      maxH: num(p.maxH),
      price: num(p.price),
    })),
    tiers: d.tiers
      .map((t) => ({ min: Math.floor(num(t.min)), pct: Math.min(90, num(t.pct)) }))
      .filter((t) => t.min > 1 && t.pct > 0)
      .sort((a, b) => a.min - b.min),
    packs: d.packs.map((p) => ({
      id: String(p.id),
      name: String(p.name || "").trim(),
      units: Math.max(1, Math.floor(num(p.units))),
      maxDesigns: Math.max(1, Math.floor(num(p.maxDesigns))),
      price: num(p.price),
      perks: (p.perks || []).map(String).filter(Boolean),
      active: p.active !== false,
    })),
    packGarments: (d.packGarments || []).map(String),
  };
  if (!settings.garments.some((g) => g.active)) throw badRequest("Dejá al menos un modelo de remera activo");
  if (!settings.colors.length) throw badRequest("Dejá al menos un color");
  res.json({ settings: await saveSettings(settings) });
});

// ---------- Diseños del catálogo ----------
router.get("/designs", async (_req, res) => {
  const designs = await Design.find({ kind: "catalog" }).sort({ sort: 1, createdAt: 1 });
  res.json({ designs });
});

// Pasar un diseño subido al catálogo de Reed (primero se sube con POST /api/designs)
router.post("/designs/:id/catalog", async (req, res) => {
  const design = await Design.findById(req.params.id);
  if (!design) throw notFound();
  design.kind = "catalog";
  design.name = String(req.body?.name || design.name).slice(0, 60);
  design.tags = (req.body?.tags || []).map(String);
  design.active = true;
  design.sort = (await Design.countDocuments({ kind: "catalog" })) + 1;
  await design.save();
  res.json({ design });
});

router.patch("/designs/:id", async (req, res) => {
  const design = await Design.findOne({ _id: req.params.id, kind: "catalog" });
  if (!design) throw notFound();
  if (req.body?.name !== undefined) design.name = String(req.body.name).slice(0, 60);
  if (req.body?.active !== undefined) design.active = Boolean(req.body.active);
  if (req.body?.sort !== undefined) design.sort = Number(req.body.sort) || 0;
  await design.save();
  res.json({ design });
});

export default router;
