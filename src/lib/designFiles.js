import { api } from "./api";

const MAX_SIDE = 2400; // px: suficiente para estampar A3 con buena calidad
const MAX_DATAURL = 4_000_000; // ~3 MB reales

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No pudimos abrir esa imagen. Probá con un PNG o JPG."));
    img.src = src;
  });
}

// Achica la imagen si hace falta y la devuelve como PNG (mantiene la transparencia)
async function toPng(blob) {
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url);
    let scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    for (let i = 0; i < 6; i++) {
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/png");
      if (dataUrl.length <= MAX_DATAURL) return { dataUrl, width: w, height: h };
      scale *= 0.75;
    }
    throw new Error("La imagen es demasiado pesada. Probá con una más chica.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Recorta los bordes transparentes, para que el diseño ocupe su tamaño real
async function trimTransparent(blob) {
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let [x0, y0, x1, y1] = [width, height, 0, 0];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (data[(y * width + x) * 4 + 3] > 8) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    if (x1 <= x0 || y1 <= y0) return blob;
    const out = document.createElement("canvas");
    out.width = x1 - x0 + 1;
    out.height = y1 - y0 + 1;
    out.getContext("2d").drawImage(canvas, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
    return await new Promise((r) => out.toBlob(r, "image/png"));
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Quita el fondo con IA, en el navegador (la primera vez descarga el modelo, ~40 MB)
export async function removeBackground(blob, onProgress) {
  const { removeBackground: run } = await import("@imgly/background-removal");
  const result = await run(blob, {
    output: { format: "image/png" },
    progress: (key, current, total) => {
      if (total) onProgress?.(Math.round((current / total) * 100), key);
    },
  });
  return trimTransparent(result);
}

const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

export async function uploadDesign(file, { removeBg = false, onStatus } = {}) {
  if (!ACCEPTED.includes(file.type)) throw new Error("Subí un archivo PNG, JPG, WEBP o SVG");
  if (file.size > 15 * 1024 * 1024) throw new Error("El archivo pesa más de 15 MB");
  let blob = file;
  if (removeBg) {
    onStatus?.("Quitando el fondo…");
    blob = await removeBackground(file, (p) => onStatus?.(`Quitando el fondo… ${p}%`));
  }
  onStatus?.("Preparando el archivo…");
  const png = await toPng(blob);
  onStatus?.("Subiendo…");
  const { design } = await api("/designs", {
    method: "POST",
    body: { dataUrl: png.dataUrl, width: png.width, height: png.height, name: file.name.replace(/\.[^.]+$/, "").slice(0, 60) },
  });
  rememberDesign(design);
  return design;
}

// "Tus diseños": los que subiste o creaste, para reusarlos
const KEY = "reed.myDesigns";
export function myDesigns() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}
export function rememberDesign(d) {
  try {
    const list = [d, ...myDesigns().filter((x) => x.id !== d.id)].slice(0, 24);
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* sin almacenamiento */
  }
}

export const designAspect = (d) => (d.width && d.height ? d.height / d.width : 1);
