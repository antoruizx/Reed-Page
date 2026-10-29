// Carga productos de ejemplo. Uso: npm run seed   (borra los productos existentes)
import mongoose from "mongoose";
import { connectDB } from "./db.js";
import Product, { slugify } from "./models/Product.js";
import Design from "./models/Design.js";
import { SET_DISCOUNT } from "./config.js";

const TEE = [
  "Jersey peinado 24/1, 100% algodón",
  "Calce oversize: hombro caído y largo extra",
  "Cuello con rib reforzado que no se deforma",
  "Lavar del revés con agua fría",
];
const HOODIE = [
  "Frisa invisible 70% algodón, 30% poliéster",
  "Calce amplio, puño y cintura con rib",
  "Capucha doble con cordón",
  "Lavar del revés con agua fría, no usar secarropas",
];
const ALL = ["S", "M", "L", "XL", "XXL"];

// stock: un número por talle (en el mismo orden que sizes)
function variants(colors, sizes = ALL, stock = [4, 8, 10, 6, 3]) {
  return colors.flatMap((c, ci) =>
    sizes.map((size, si) => ({ color: c.name, size, stock: Math.max(0, stock[si] - ci * 2) }))
  );
}

const C = {
  blanco: { name: "Blanco", hex: "#F3F3EF" },
  negro: { name: "Negro", hex: "#1C1B1F" },
  rosa: { name: "Rosa chicle", hex: "#E48B9C" },
  coral: { name: "Coral", hex: "#EC5B57" },
  rojo: { name: "Rojo", hex: "#C9302C" },
  uva: { name: "Uva", hex: "#7A4C7F" },
  arena: { name: "Arena", hex: "#CDBFA3" },
  gris: { name: "Gris melange", hex: "#A9A9AB" },
  empolvado: { name: "Rosa empolvado", hex: "#E7C8C1" },
  ladrillo: { name: "Ladrillo", hex: "#B0563A" },
  amarillo: { name: "Amarillo", hex: "#F0C233" },
  verde: { name: "Verde bosque", hex: "#1F4D3A" },
  chocolate: { name: "Chocolate", hex: "#4A3328" },
  grafito: { name: "Gris grafito", hex: "#5B5B58" },
  crema: { name: "Crema", hex: "#EDE6D6" },
  carey: { name: "Carey", hex: "#6B4A2E" },
};
const FLEECE = [
  "Frisa invisible 70% algodón, 30% poliéster",
  "Calce relajado, cintura elastizada con cordón",
  "Bolsillos laterales",
  "Lavar del revés con agua fría",
];
const SHADES = ["Lente con filtro UV400", "Incluye funda de tela", "Talle único"];
const img = (name) => `/img/products/${name}.jpg`;

const products = [
  {
    name: "Remera Oversize Lisa",
    category: "remeras",
    price: 29900,
    description: "La base de todo placard. Ancha, pesada y suave desde el primer uso.",
    details: TEE,
    images: ["/img/products/remera-oversize-rosa.jpg", "/img/products/remera-oversize-coral.jpg"],
    colors: [
      { ...C.rosa, image: "/img/products/remera-oversize-rosa.jpg" },
      { ...C.coral, image: "/img/products/remera-oversize-coral.jpg" },
      C.negro,
      C.blanco,
    ],
    featured: true,
  },
  {
    name: "Remera Alas",
    category: "remeras",
    price: 34900,
    description: "Estampa grande en la espalda con serigrafía al agua: no se cuartea con los lavados.",
    details: TEE,
    images: ["/img/products/remera-alas-blanca.jpg"],
    colors: [C.blanco, C.negro],
    featured: true,
  },
  {
    name: "Remera Semáforo",
    category: "remeras",
    price: 34900,
    compareAtPrice: 39900,
    description: "Tres bloques de color bordados en la espalda. Para los días de sol largo.",
    details: TEE,
    images: ["/img/products/remera-semaforo.jpg"],
    colors: [C.blanco],
    featured: true,
  },
  {
    name: "Remera Independent",
    category: "remeras",
    price: 32900,
    description: "Frase en la espalda, lisa adelante. Roja de verdad: tintura fijada, no destiñe.",
    details: TEE,
    images: ["/img/products/remera-independent-roja.jpg"],
    colors: [C.rojo, C.negro],
  },
  {
    name: "Remera Chaos",
    category: "remeras",
    price: 34900,
    description: "Calavera con flores, estampa en la espalda. Lavado vintage color uva.",
    details: TEE,
    images: ["/img/products/remera-chaos-uva.jpg"],
    colors: [C.uva],
    featured: true,
  },
  {
    name: "Buzo Arena",
    category: "buzos",
    price: 64900,
    description: "Buzo canguro sin estampa, de frisa gruesa. El que vas a usar todo el invierno.",
    details: HOODIE,
    images: ["/img/products/buzo-arena.jpg"],
    colors: [C.arena, C.gris],
    featured: true,
  },
  {
    name: "Buzo Trouble",
    category: "buzos",
    price: 69900,
    description: "Letras en relieve al frente y cordón negro de contraste.",
    details: HOODIE,
    images: ["/img/products/buzo-trouble-rosa.jpg"],
    colors: [C.empolvado],
  },
  {
    name: "Buzo Ladrillo",
    category: "buzos",
    price: 64900,
    compareAtPrice: 72900,
    description: "Color tierra, capucha amplia y bolsillo canguro.",
    details: HOODIE,
    images: ["/img/products/buzo-ladrillo.jpg"],
    colors: [C.ladrillo, C.negro],
  },
  {
    name: "Piluso Bucket",
    category: "accesorios",
    price: 21900,
    description: "Gabardina de algodón, ala corta y costuras en contraste. Talle único regulable.",
    details: ["Gabardina 100% algodón", "Talle único (56–58 cm)", "Lavar a mano"],
    images: ["/img/products/bucket-amarillo.jpg"],
    colors: [C.amarillo, C.negro],
    sizes: ["Único"],
    featured: true,
  },

  // ---------- Prendas sueltas que forman los conjuntos ----------
  {
    name: "Buzo Oversize Básico",
    category: "buzos",
    price: 59900,
    description: "Buzo canguro liso, bien ancho y pesado. Combina con el jogger y el short de frisa.",
    details: HOODIE,
    images: [img("buzo-basico-negro"), img("buzo-basico-verde")],
    colors: [
      { ...C.negro, image: img("buzo-basico-negro") },
      { ...C.verde, image: img("buzo-basico-verde") },
      { ...C.chocolate, image: img("buzo-basico-chocolate") },
      C.grafito,
    ],
  },
  {
    name: "Jogger Frisa",
    category: "pantalones",
    price: 49900,
    description: "Jogger de frisa con pierna recta y puño. El par del buzo básico.",
    details: FLEECE,
    images: [img("jogger-frisa")],
    colors: [C.negro, C.grafito],
  },
  {
    name: "Short Frisa",
    category: "pantalones",
    price: 34900,
    description: "Short largo de frisa, cómodo para todo el día. Se arma conjunto con el buzo básico.",
    details: FLEECE,
    images: [img("short-frisa")],
    colors: [C.grafito, C.verde, C.chocolate, C.negro],
  },
  {
    name: "Short Rústico",
    category: "pantalones",
    price: 27900,
    description: "Short de algodón rústico, liviano para el verano. Va con cualquier remera oversize.",
    details: ["Algodón rústico 100%", "Cintura elastizada con cordón", "Lavar con agua fría"],
    images: [img("short-rustico")],
    colors: [C.negro, C.blanco],
  },
  {
    name: "Pantalón Ancho",
    category: "pantalones",
    price: 54900,
    description: "Pierna ancha y tiro alto, de gabardina liviana. Queda perfecto con remera oversize.",
    details: ["Gabardina de algodón", "Pierna ancha, tiro alto", "Pinzas al frente", "Lavar con agua fría"],
    images: [img("pantalon-ancho")],
    colors: [C.crema, C.negro],
  },

  // ---------- Gafas ----------
  {
    name: "Gafas Oval",
    category: "accesorios",
    price: 22900,
    description: "Marco ovalado y fino, lentes negras. El toque noventoso para cualquier look.",
    details: SHADES,
    images: [img("gafas-oval")],
    colors: [C.negro],
    sizes: ["Único"],
    featured: true,
  },
  {
    name: "Gafas Bicolor",
    category: "accesorios",
    price: 24900,
    description: "Marco rectangular grueso en blanco y negro. Para no pasar desapercibida.",
    details: SHADES,
    images: [img("gafas-bicolor")],
    colors: [C.negro, C.blanco],
    sizes: ["Único"],
  },
  {
    name: "Gafas Shield",
    category: "accesorios",
    price: 26900,
    description: "Lente envolvente de una sola pieza, estilo deportivo de los 2000.",
    details: SHADES,
    images: [img("gafas-shield")],
    colors: [C.negro],
    sizes: ["Único"],
  },
  {
    name: "Gafas Slim",
    category: "accesorios",
    price: 21900,
    description: "Marco angosto y alargado. Combinan con todo, de día o de noche.",
    details: SHADES,
    images: [img("gafas-slim")],
    colors: [C.negro, C.carey],
    sizes: ["Único"],
  },
];

// ---------- Conjuntos: salen 10% menos que las prendas por separado ----------
const sets = [
  {
    name: "Conjunto Buzo + Jogger",
    parts: ["buzo-oversize-basico", "jogger-frisa"],
    description: "Buzo oversize básico y jogger de frisa al tono. El conjunto para todo el invierno.",
    images: [img("conjunto-buzo-jogger")],
    colors: [C.negro, C.grafito],
    featured: true,
  },
  {
    name: "Conjunto Buzo + Short",
    parts: ["buzo-oversize-basico", "short-frisa"],
    description: "Buzo oversize y short de frisa del mismo color. Cómodo y canchero.",
    images: [img("conjunto-buzo-short")],
    colors: [C.grafito, C.verde, C.chocolate],
  },
  {
    name: "Conjunto Remera + Short",
    parts: ["remera-oversize-lisa", "short-rustico"],
    description: "Remera oversize lisa y short rústico. El uniforme del verano.",
    images: [img("conjunto-remera-short")],
    colors: [C.negro, C.blanco],
  },
  {
    name: "Conjunto Remera + Pantalón Ancho",
    parts: ["remera-oversize-lisa", "pantalon-ancho"],
    description: "Remera oversize y pantalón de pierna ancha. Simple, prolijo y con onda.",
    images: [img("conjunto-remera-pantalon")],
    colors: [C.negro, C.crema],
  },
];

await connectDB();
await Product.deleteMany({});
for (const p of products) {
  const { sizes, ...rest } = p;
  await Product.create({
    ...rest,
    slug: slugify(p.name),
    variants: sizes ? variants(p.colors, sizes, [15]) : variants(p.colors),
  });
}
console.log(`✅ ${products.length} productos cargados`);

for (const set of sets) {
  const parts = await Product.find({ slug: { $in: set.parts } });
  if (parts.length !== set.parts.length) throw new Error(`Faltan prendas para ${set.name}`);
  const separate = parts.reduce((sum, p) => sum + p.price, 0);
  await Product.create({
    ...set,
    category: "conjuntos",
    slug: slugify(set.name),
    parts: parts.map((p) => p._id),
    details: ["Incluye: " + parts.map((p) => p.name).join(" + "), "Cada prenda se puede comprar por separado"],
    price: Math.round((separate * (1 - SET_DISCOUNT)) / 100) * 100,
    compareAtPrice: separate, // se muestra tachado: lo que salen por separado
    variants: variants(set.colors),
  });
}
console.log(`✅ ${sets.length} conjuntos cargados`);

// Diseños del catálogo para el diseñador de remeras (originales de Reed)
const designs = [
  ["Sol retro", "sol-retro.svg", 400, 400, ["retro", "verano"]],
  ["Cerros", "cerros.svg", 400, 320, ["paisaje", "tucumán"]],
  ["Ondas", "ondas.svg", 380, 260, ["minimal"]],
  ["Rayo", "rayo.svg", 300, 400, ["energía"]],
  ["Margarita", "margarita.svg", 400, 400, ["flores", "y2k"]],
  ["Ojo místico", "ojo.svg", 400, 300, ["místico"]],
  ["Corazón", "corazon.svg", 400, 360, ["amor"]],
  ["Carita damero", "damero.svg", 400, 400, ["y2k", "skate"]],
  ["Logo Reed", "../brand/reed-r-ink.png", 458, 391, ["reed"]],
];
await Design.deleteMany({ kind: "catalog", url: { $exists: true } });
await Design.insertMany(
  designs.map(([name, file, width, height, tags], i) => ({
    kind: "catalog",
    name,
    url: `/img/designs/${file}`.replace("/designs/../", "/"),
    width,
    height,
    tags,
    sort: i,
  }))
);
console.log(`✅ ${designs.length} diseños de catálogo cargados`);
await mongoose.disconnect();
