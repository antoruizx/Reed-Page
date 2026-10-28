// Uso: npm run make-admin -- tuemail@gmail.com
import mongoose from "mongoose";
import { connectDB } from "../db.js";
import User from "../models/User.js";

const email = process.argv[2]?.toLowerCase();
if (!email) {
  console.log("Uso: npm run make-admin -- email@ejemplo.com");
  process.exit(1);
}

await connectDB();
const user = await User.findOneAndUpdate({ email }, { role: "admin" }, { new: true });
console.log(user ? `✅ ${user.email} ahora es admin` : `❌ No hay ninguna cuenta con ${email}`);
await mongoose.disconnect();
