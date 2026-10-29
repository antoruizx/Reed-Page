import mongoose from "mongoose";
import { CATEGORIES, SIZES } from "../config.js";

const colorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    hex: { type: String, required: true, match: /^#[0-9a-fA-F]{6}$/ },
    image: { type: String }, // foto que se muestra al elegir este color (opcional)
  },
  { _id: false }
);

// Una variante = combinación color + talle, con su propio stock
const variantSchema = new mongoose.Schema(
  {
    color: { type: String, required: true },
    size: { type: String, required: true, enum: SIZES },
    stock: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "El producto necesita un nombre"], trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: { type: String, required: true, enum: CATEGORIES },
    description: { type: String, default: "" },
    details: [{ type: String }], // tela, calce, cuidados
    price: { type: Number, required: [true, "Poné un precio"], min: 0 },
    compareAtPrice: { type: Number, min: 0 }, // precio tachado (oferta)
    images: {
      type: [String],
      validate: [(v) => v.length > 0, "Agregá al menos una foto"],
    },
    colors: [colorSchema],
    variants: [variantSchema],
    // Solo para conjuntos: las prendas que lo forman (se pueden comprar por separado)
    parts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true }, // false = no publicado
    soldOut: { type: Boolean, default: false }, // marcado "sin stock" a mano (se ve pero no se vende)
  },
  { timestamps: true }
);

// Estado para el panel: publicado | oculto | agotado
export const PRODUCT_STATUSES = ["publicado", "oculto", "agotado"];
export function statusPatch(status) {
  if (status === "oculto") return { active: false, soldOut: false };
  if (status === "agotado") return { active: true, soldOut: true };
  return { active: true, soldOut: false };
}

// Versión para la tienda: si está marcado sin stock, se muestra todo en 0
export function forShop(product) {
  const json = product.toJSON();
  if (!product.soldOut) return json;
  return { ...json, totalStock: 0, variants: json.variants.map((v) => ({ ...v, stock: 0 })) };
}

productSchema.virtual("totalStock").get(function () {
  return (this.variants || []).reduce((sum, v) => sum + v.stock, 0);
});

productSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

productSchema.index({ name: "text", description: "text" });

export function slugify(text) {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default mongoose.models.Product || mongoose.model("Product", productSchema);
