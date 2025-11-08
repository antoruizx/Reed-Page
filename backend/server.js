import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import { verifyToken } from "./middleware/authMiddleware.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(cookieParser());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch(err => console.log("❌ Error al conectar MongoDB:", err));

app.use("/api/auth", authRoutes);

app.listen(process.env.PORT || 8000, () => {
  console.log(`🌐 Servidor corriendo en puerto ${process.env.PORT || 8000}`);
});

app.get("/api/auth/profile", verifyToken, (req, res) => {
  res.json({
    message: "Acceso autorizado ✅",
    user: req.user
  });
});
