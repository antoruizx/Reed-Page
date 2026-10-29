import mongoose from "mongoose";
import { DEFAULT_SETTINGS } from "../../shared/pricing.js";
import { withStoreDefaults } from "../../shared/store.js";

// Un único documento con los precios de las personalizadas (editable desde el panel)
const settingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "custom" },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, minimize: false }
);

const Settings = mongoose.models.Settings || mongoose.model("Settings", settingsSchema);

export async function getSettings() {
  const doc = await Settings.findById("custom").lean();
  return { ...DEFAULT_SETTINGS, ...(doc?.data || {}) };
}

export async function saveSettings(data) {
  await Settings.findByIdAndUpdate("custom", { data }, { upsert: true });
  return getSettings();
}

// Envíos por zona, retiro y transferencia (otro documento, editable desde Panel → Envíos y pagos)
export async function getStore() {
  const doc = await Settings.findById("store").lean();
  return withStoreDefaults(doc?.data || {});
}

export async function saveStore(data) {
  await Settings.findByIdAndUpdate("store", { data }, { upsert: true });
  return getStore();
}

export default Settings;
