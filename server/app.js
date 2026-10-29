import express from "express";
import { connectDB } from "./db.js";
import { config } from "./config.js";
import { errorHandler } from "./errors.js";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import paymentRoutes from "./routes/payments.js";
import adminRoutes from "./routes/admin.js";
import designRoutes from "./routes/designs.js";

const app = express();

app.disable("x-powered-by");
// Las subidas de diseños pesan más; el resto de la API acepta bodies chicos
const smallJson = express.json({ limit: "200kb" });
const uploadJson = express.json({ limit: "4.4mb" });
app.use((req, res, next) =>
  req.method === "POST" && req.path === "/api/designs" ? uploadJson(req, res, next) : smallJson(req, res, next)
);

// Front y API viven en el mismo dominio (Vercel en producción, proxy de Vite en local),
// así que no hace falta CORS.

// /api/health?db=1 también prueba la conexión a Mongo (sin mostrar datos sensibles)
app.get("/api/health", async (req, res) => {
  if (!req.query.db) return res.json({ ok: true });
  const mongoUri = !config.mongoUri ? "falta" : /^mongodb(+srv)?:///.test(config.mongoUri) ? "cargada" : "formato inválido";
  try {
    await connectDB();
    res.json({ ok: true, mongoUri, db: "conectada" });
  } catch (err) {
    res.status(503).json({ ok: false, mongoUri, db: err.name || "error", code: err.code ?? null });
  }
});

// Conectamos a Mongo antes de cualquier ruta de la API
app.use("/api", async (_req, _res, next) => {
  await connectDB();
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", designRoutes);

app.use("/api", (_req, res) => res.status(404).json({ message: "Ruta no encontrada" }));
app.use(errorHandler);

export default app;
