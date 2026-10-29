// Genera con OpenAI las fotos de modelos de la tienda (portada, productos nuevos,
// conjuntos y gafas). Uso:
//   npm run images                 → genera las que faltan
//   npm run images -- gafas-oval   → genera (o rehace) solo esas
// Necesita OPENAI_API_KEY en el .env. Cada imagen cuesta unos centavos de dólar.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "public", "img");

// Estilo común: campaña minimalista tipo Zara, ropa oversize, sin logos.
const STYLE =
  "Minimalist high-end fashion campaign photo in the style of a Zara or COS lookbook. " +
  "Oversized, relaxed streetwear fit, cool confident attitude, natural editorial pose. " +
  "Soft diffused studio light, realistic skin texture, shot on 35mm, sharp focus. " +
  "Plain garments with no logos, no text, no brand names, no watermarks.";

const SHOTS = [
  // ---------- Portada ----------
  {
    file: "editorial/hero-retrato.jpg",
    size: "1024x1536",
    prompt:
      "Tight close-up portrait of a young woman in her twenties staring straight into the camera with a calm, intense model expression, " +
      "dark hair pulled back, wearing an oversized black hoodie with the hood down, face lit by soft side light, " +
      "deep black background, desaturated warm black and white tones, cinematic, the face fills the frame.",
  },
  {
    file: "editorial/look-parada.jpg",
    size: "1024x1536",
    prompt:
      "Full-body shot of a young woman standing with her hands in the pocket of an oversized charcoal grey hoodie and matching wide fleece joggers, " +
      "white chunky sneakers, light grey seamless studio background with a soft curved shadow.",
  },
  {
    file: "editorial/look-sentado.jpg",
    size: "1024x1536",
    prompt:
      "Full-body shot of a young man sitting relaxed on a white cylindrical plinth, wearing an all-black oversized hoodie and wide black joggers, " +
      "white sneakers, looking to the side, dark grey seamless studio background.",
  },
  {
    file: "editorial/look-caminando.jpg",
    size: "1024x1536",
    prompt:
      "Full-body shot of a young woman walking towards the camera in an oversized cream t-shirt and wide-leg black trousers, slight motion blur on the background, " +
      "dark charcoal studio background, editorial lighting.",
  },
  {
    file: "editorial/look-espalda.jpg",
    size: "1024x1536",
    prompt:
      "A young woman seen from behind standing on a subway platform with a train rushing by in motion blur, wearing an oversized black hoodie and black joggers, " +
      "headphones on, hair in a messy bun, moody urban light.",
  },
  {
    file: "editorial/look-piso.jpg",
    size: "1024x1536",
    prompt:
      "A young woman with long dark hair sitting on the concrete floor of an underground parking garage at night, wearing an oversized dark brown hoodie, " +
      "white socks and white sneakers, hand near her face, flash photography look.",
  },

  // ---------- Prendas sueltas ----------
  {
    file: "products/buzo-basico-negro.jpg",
    size: "1024x1536",
    prompt: "Waist-up shot of a young woman in a plain oversized black hoodie, hands in the front pocket, looking at the camera, off-white seamless studio background.",
  },
  {
    file: "products/buzo-basico-verde.jpg",
    size: "1024x1536",
    prompt: "Waist-up shot of a young man in a plain oversized forest green hoodie, arms crossed, looking slightly away, off-white seamless studio background.",
  },
  {
    file: "products/buzo-basico-chocolate.jpg",
    size: "1024x1536",
    prompt: "Three-quarter shot of a young woman in a plain oversized chocolate brown hoodie with the hood up, light grey studio background.",
  },
  {
    file: "products/jogger-frisa.jpg",
    size: "1024x1536",
    prompt: "Shot from the waist down of a model wearing relaxed black fleece joggers with cuffs and white sneakers, one foot forward, light grey studio background.",
  },
  {
    file: "products/short-frisa.jpg",
    size: "1024x1536",
    prompt: "Shot from the waist down of a model wearing long charcoal grey fleece shorts with a drawstring and white socks with sneakers, off-white studio background.",
  },
  {
    file: "products/short-rustico.jpg",
    size: "1024x1536",
    prompt: "Shot from the waist down of a model wearing black lightweight cotton shorts and a tucked-in oversized white t-shirt hem, bare legs, white sneakers, off-white studio background.",
  },
  {
    file: "products/pantalon-ancho.jpg",
    size: "1024x1536",
    prompt: "Full-body shot of a young woman in high-waisted cream wide-leg pleated trousers and a fitted black top, walking, light beige studio background.",
  },

  // ---------- Conjuntos ----------
  {
    file: "products/conjunto-buzo-jogger.jpg",
    size: "1024x1536",
    prompt:
      "A man and a woman wearing matching oversized tracksuits, he sits on a white plinth in a black hoodie and black joggers, " +
      "she stands next to him in a light grey melange hoodie and joggers with her back half turned, grey seamless studio.",
  },
  {
    file: "products/conjunto-buzo-short.jpg",
    size: "1024x1536",
    prompt:
      "A woman and a man standing side by side, both wearing matching charcoal grey oversized hoodies and fleece shorts, he rests his arm on her shoulder, " +
      "neutral expressions, light grey studio background.",
  },
  {
    file: "products/conjunto-remera-short.jpg",
    size: "1024x1536",
    prompt: "Full-body shot of a young woman in an oversized black t-shirt and matching black cotton shorts, white sneakers, sitting on a low white cube, off-white studio.",
  },
  {
    file: "products/conjunto-remera-pantalon.jpg",
    size: "1024x1536",
    prompt:
      "Black and white photo of a young man and woman standing close, he wears an oversized white t-shirt with black wide trousers, " +
      "she wears an oversized black t-shirt with cream wide trousers, hands in pockets, looking away, white wall, soft window light.",
  },

  // ---------- Gafas (van a Accesorios) ----------
  {
    file: "products/gafas-oval.jpg",
    size: "1024x1536",
    prompt:
      "Close-up of a young woman with slicked-back dark hair wearing small black oval sunglasses, black oversized hoodie under a black leather jacket, " +
      "low angle against a dark modern building facade.",
  },
  {
    file: "products/gafas-bicolor.jpg",
    size: "1024x1536",
    prompt:
      "Close-up beauty shot of a young woman leaning towards the camera wearing chunky rectangular sunglasses with a black and white frame, " +
      "fingertips near her lips, plain white background.",
  },
  {
    file: "products/gafas-shield.jpg",
    size: "1024x1536",
    prompt:
      "Playful close-up of a young woman wearing black wraparound shield sunglasses, framing her face with both hands wearing chunky silver rings, " +
      "black denim top, plain white background.",
  },
  {
    file: "products/gafas-slim.jpg",
    size: "1024x1536",
    prompt:
      "Close-up of a young woman sitting in the back seat of a car wearing slim narrow black sunglasses and a black leather jacket with a high collar, " +
      "soft overcast daylight from the window.",
  },
];

const key = process.env.OPENAI_API_KEY;
if (!key) {
  console.error("Falta OPENAI_API_KEY en el .env");
  process.exit(1);
}

const only = process.argv.slice(2);
const todo = SHOTS.filter((s) =>
  only.length ? only.some((o) => s.file.includes(o)) : !existsSync(join(root, s.file))
);
console.log(`🖼️  ${todo.length} imágenes para generar`);

async function generate(shot) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
      prompt: `${shot.prompt} ${STYLE}`,
      size: shot.size,
      quality: process.env.OPENAI_IMAGE_QUALITY || "medium",
      output_format: "jpeg",
      output_compression: 82,
      n: 1,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.message || `HTTP ${res.status}`);
  const out = join(root, shot.file);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, Buffer.from(body.data[0].b64_json, "base64"));
}

// De a 3 en paralelo para no tardar una eternidad
let failed = 0;
for (let i = 0; i < todo.length; i += 3) {
  await Promise.all(
    todo.slice(i, i + 3).map((shot) =>
      generate(shot)
        .then(() => console.log(`✅ ${shot.file}`))
        .catch((err) => {
          failed++;
          console.error(`❌ ${shot.file}: ${err.message}`);
        })
    )
  );
}
console.log(failed ? `Terminó con ${failed} errores (volvé a correrlo para reintentar)` : "Listo");
