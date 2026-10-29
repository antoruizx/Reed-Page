import { Router } from "express";
import Product from "../models/Product.js";
import { CATEGORIES } from "../config.js";
import { notFound } from "../errors.js";

const router = Router();

const SORTS = {
  nuevos: { createdAt: -1 },
  "precio-asc": { price: 1 },
  "precio-desc": { price: -1 },
};

// GET /api/products?categoria=remeras&talle=M&color=Negro&q=buzo&orden=precio-asc&destacados=1
router.get("/", async (req, res) => {
  const { categoria, talle, color, q, orden, destacados, limit } = req.query;
  const filter = { active: true };

  if (categoria && CATEGORIES.includes(categoria)) filter.category = categoria;
  if (destacados) filter.featured = true;

  // Solo mostramos productos que tengan stock en el talle/color pedido
  if (talle || color) {
    filter.variants = {
      $elemMatch: {
        stock: { $gt: 0 },
        ...(talle ? { size: talle } : {}),
        ...(color ? { color } : {}),
      },
    };
  }
  if (q) {
    const safe = String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 60);
    filter.$or = [{ name: new RegExp(safe, "i") }, { description: new RegExp(safe, "i") }];
  }

  const products = await Product.find(filter)
    .sort(SORTS[orden] || SORTS.nuevos)
    .limit(Math.min(Number(limit) || 60, 100));

  res.json({ products });
});

// Opciones para armar los filtros del catálogo
router.get("/filters", async (_req, res) => {
  const products = await Product.find({ active: true }, { colors: 1, variants: 1 });
  const colors = new Map();
  const sizes = new Set();
  for (const p of products) {
    p.colors.forEach((c) => colors.set(c.name, c.hex));
    p.variants.forEach((v) => v.stock > 0 && sizes.add(v.size));
  }
  const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "Único"];
  res.json({
    categories: CATEGORIES,
    colors: [...colors].map(([name, hex]) => ({ name, hex })),
    sizes: sizeOrder.filter((s) => sizes.has(s)),
  });
});

router.get("/:slug", async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, active: true });
  if (!product) throw notFound("Este producto ya no está disponible");
  const related = await Product.find({
    active: true,
    category: product.category,
    _id: { $ne: product._id },
  }).limit(4);
  // Conjunto: sus prendas sueltas. Prenda suelta: los conjuntos que la incluyen.
  const parts = product.parts?.length
    ? await Product.find({ _id: { $in: product.parts }, active: true })
    : [];
  const sets = await Product.find({ active: true, parts: product._id }).limit(4);
  res.json({ product, related, parts, sets });
});

export default router;
