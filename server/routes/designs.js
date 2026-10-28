import { Router } from "express";
import Design from "../models/Design.js";
import { getSettings } from "../models/Settings.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { badRequest, HttpError, notFound } from "../errors.js";

const router = Router();

const MAX_BYTES = 3 * 1024 * 1024; // 3 MB por archivo (Vercel acepta hasta 4.5 MB por request)

// Solo imágenes rasterizadas. No aceptamos SVG de clientes: puede traer código.
const SIGNATURES = {
  "image/png": (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/webp": (b) => b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP",
};

function parseDataUrl(dataUrl) {
  const m = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ""));
  if (!m) throw badRequest("El archivo tiene que ser PNG, JPG o WEBP");
  const buffer = Buffer.from(m[2], "base64");
  if (buffer.length > MAX_BYTES) throw badRequest("El archivo pesa más de 3 MB. Probá con una imagen más chica.");
  if (!SIGNATURES[m[1]](buffer)) throw badRequest("El archivo no es una imagen válida");
  return { mime: m[1], buffer };
}

// Configuración pública del diseñador: modelos, colores, precios, packs y diseños de Reed
router.get("/custom/config", async (_req, res) => {
  const [settings, designs] = await Promise.all([
    getSettings(),
    Design.find({ kind: "catalog", active: true }).sort({ sort: 1, createdAt: 1 }),
  ]);
  res.set("Cache-Control", "public, max-age=60");
  res.json({
    settings,
    designs,
    ai: Boolean(process.env.OPENAI_API_KEY),
  });
});

// Subir un diseño propio (ya convertido a PNG en el navegador)
router.post("/designs", optionalAuth, async (req, res) => {
  const { dataUrl, name, width, height } = req.body ?? {};
  const { mime, buffer } = parseDataUrl(dataUrl);
  const design = await Design.create({
    kind: "upload",
    name: String(name || "Mi diseño").slice(0, 80),
    data: buffer,
    mime,
    width: Number(width) || undefined,
    height: Number(height) || undefined,
    user: req.user?._id,
  });
  res.status(201).json({ design });
});

router.get("/designs/:id", async (req, res) => {
  const design = await Design.findById(req.params.id);
  if (!design) throw notFound("No encontramos ese diseño");
  res.json({ design });
});

router.get("/designs/:id/image", async (req, res) => {
  const design = await Design.findById(req.params.id).select("+data");
  if (!design?.data) throw notFound("No encontramos ese diseño");
  res.set({
    "Content-Type": design.mime,
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Content-Disposition": `inline; filename="reed-diseno-${design._id}.${design.mime.split("/")[1]}"`,
  });
  res.send(design.data);
});

// Crear un diseño a partir de un texto, con la API de imágenes de OpenAI
router.post("/ai/designs", requireAuth, async (req, res) => {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new HttpError(503, "La creación con IA todavía no está activada");

  const prompt = String(req.body?.prompt || "").trim();
  if (prompt.length < 4) throw badRequest("Contanos un poco más qué querés que tenga el diseño");
  if (prompt.length > 400) throw badRequest("El texto es muy largo: usá hasta 400 caracteres");

  const limit = Number(process.env.AI_DAILY_LIMIT || 8);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const used = await Design.countDocuments({ kind: "ai", user: req.user._id, createdAt: { $gte: since } });
  if (used >= limit && req.user.role !== "admin") {
    throw new HttpError(429, `Ya creaste ${limit} diseños hoy. Mañana podés seguir creando.`);
  }

  const fullPrompt = [
    "Diseño gráfico para estampar en una remera con DTF.",
    "Ilustración centrada, sin remera ni persona ni mockup, fondo transparente,",
    "bordes nítidos, colores planos y con buen contraste.",
    "No incluyas logos de marcas ni personajes con derechos de autor.",
    `Pedido del cliente: ${prompt}`,
  ].join(" ");

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
      prompt: fullPrompt,
      size: "1024x1024",
      background: "transparent",
      output_format: "png",
      quality: process.env.OPENAI_IMAGE_QUALITY || "medium",
      n: 1,
      user: req.user._id.toString(),
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("OpenAI:", body?.error?.message);
    const blocked = body?.error?.code === "moderation_blocked" || /safety|moderation/i.test(body?.error?.message || "");
    throw new HttpError(
      blocked ? 400 : 502,
      blocked
        ? "No podemos crear ese diseño. Probá describirlo de otra forma, sin marcas ni personajes conocidos."
        : "No se pudo crear el diseño. Probá de nuevo en un ratito."
    );
  }
  const b64 = body.data?.[0]?.b64_json;
  if (!b64) throw new HttpError(502, "No se pudo crear el diseño. Probá de nuevo.");

  const design = await Design.create({
    kind: "ai",
    name: prompt.slice(0, 60),
    prompt,
    data: Buffer.from(b64, "base64"),
    mime: "image/png",
    width: 1024,
    height: 1024,
    user: req.user._id,
  });
  res.status(201).json({ design, remaining: Math.max(0, limit - used - 1) });
});

export default router;
