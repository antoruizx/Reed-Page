import mongoose from "mongoose";
import { config } from "./config.js";

// En Vercel cada función puede reutilizar la conexión entre requests "tibias".
// Guardamos la promesa en globalThis para no abrir una conexión nueva cada vez.
const cached = (globalThis.__reedMongo ??= { conn: null, promise: null });

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    if (!config.mongoUri) throw new Error("MONGO_URI no está configurada");
    cached.promise = mongoose
      .connect(config.mongoUri, { bufferCommands: false, serverSelectionTimeoutMS: 8000 })
      .then((m) => m);
  }
  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
  return cached.conn;
}
