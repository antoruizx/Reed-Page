// Configuración central. Todo lo sensible viene de variables de entorno.
const required = ["MONGO_URI", "JWT_SECRET"];
for (const key of required) {
  if (!process.env[key]) {
    console.warn(`⚠️  Falta la variable de entorno ${key}`);
  }
}

export const config = {
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  adminEmail: (process.env.ADMIN_EMAIL || "").trim().toLowerCase(),
  siteUrl: (process.env.SITE_URL || "http://localhost:5173").replace(/\/$/, ""),
  mp: {
    accessToken: process.env.MP_ACCESS_TOKEN,
    webhookSecret: process.env.MP_WEBHOOK_SECRET,
  },
  shipping: {
    cost: Number(process.env.SHIPPING_COST ?? 6500),
    freeFrom: Number(process.env.FREE_SHIPPING_FROM ?? 80000),
  },
};

export const CATEGORIES = ["remeras", "buzos", "accesorios"];
export const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Único"];
export const ORDER_STATUSES = [
  "pendiente", // creada, esperando pago
  "pagada",
  "rechazada",
  "preparando",
  "enviada",
  "entregada",
  "cancelada",
];
