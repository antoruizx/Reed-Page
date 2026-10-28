import express from "express";
import { connectDB } from "./db.js";
import { errorHandler } from "./errors.js";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import paymentRoutes from "./routes/payments.js";
import adminRoutes from "./routes/admin.js";

const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "200kb" }));

// Front y API viven en el mismo dominio (Vercel en producción, proxy de Vite en local),
// así que no hace falta CORS.

app.get("/api/health", (_req, res) => res.json({ ok: true }));

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

app.use("/api", (_req, res) => res.status(404).json({ message: "Ruta no encontrada" }));
app.use(errorHandler);

export default app;
