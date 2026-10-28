// Carga productos de ejemplo. Uso: npm run seed   (borra los productos existentes)
import mongoose from "mongoose";
import { connectDB } from "./db.js";
import Product, { slugify } from "./models/Product.js";
import Design from "./models/Design.js";

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
};

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
