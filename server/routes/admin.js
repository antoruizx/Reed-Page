import { Router } from "express";
import Product, { slugify } from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { ORDER_STATUSES } from "../config.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { badRequest, notFound } from "../errors.js";

const router = Router();
router.use(requireAuth, requireAdmin);

// ---------- Resumen ----------
router.get("/stats", async (_req, res) => {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [sales, toPrepare, products, lowStock, customers] = await Promise.all([
    Order.aggregate([
      { $match: { status: { $in: ["pagada", "preparando", "enviada", "entregada"] }, createdAt: { $gte: since } } },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
    ]),
    Order.countDocuments({ status: "pagada" }),
    Product.countDocuments({ active: true }),
    Product.find({ active: true, "variants.stock": { $lte: 2 } }, { name: 1, slug: 1, variants: 1 }).limit(10),
    User.countDocuments({ role: "customer" }),
  ]);
  res.json({
    salesLast30: sales[0]?.total ?? 0,
    ordersLast30: sales[0]?.count ?? 0,
    toPrepare,
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
    active: body.active !== false,
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

router.patch("/orders/:id", async (req, res) => {
  const { status } = req.body ?? {};
  if (!ORDER_STATUSES.includes(status)) throw badRequest("Estado inválido");
  const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
  if (!order) throw notFound();
  res.json({ order });
});

export default router;
