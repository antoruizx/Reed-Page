// Configuración central. Todo lo sensible viene de variables de entorno.
const required = ["MONGO_URI", "JWT_SECRET"];
for (const key of required) {
  if (!process.env[key]) {
    console.warn(`⚠️  Falta la variable de entorno ${key}`);
  }
}

// Limpia errores típicos al pegar variables en Vercel: espacios, comillas o "NOMBRE=" delante
function cleanEnv(name) {
  const unquote = (s) => s.trim().replace(/^["']+|["']+$/g, "").trim();
  let v = unquote(process.env[name] || "");
  if (v.startsWith(`${name}=`)) v = unquote(v.slice(name.length + 1));
  return v || undefined;
}

// Un link de Mongo no lleva espacios: sacamos espacios, saltos de línea, caracteres
// invisibles y cualquier cosa pegada antes de "mongodb"
function cleanMongoUri() {
  let v = (cleanEnv("MONGO_URI") || "").replace(/[\s​-‍﻿]/g, "");
  const start = v.indexOf("mongodb");
  if (start > 0) v = v.slice(start);
  return v.replace(/["']+$/g, "") || undefined;
}

export const config = {
  mongoUri: cleanMongoUri(),
  jwtSecret: cleanEnv("JWT_SECRET"),
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

export const CATEGORIES = ["remeras", "buzos", "pantalones", "conjuntos", "accesorios"];
// Un conjunto sale este porcentaje menos que comprar sus prendas por separado
export const SET_DISCOUNT = 0.1;
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
