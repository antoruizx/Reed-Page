import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173", // o el puerto donde corre tu front
  credentials: true
}));
app.use(cookieParser());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch(err => console.log("❌ Error al conectar MongoDB:", err));

app.listen(process.env.PORT || 8000, () => {
  console.log(`🌐 Servidor corriendo en puerto ${process.env.PORT || 8000}`);
});
