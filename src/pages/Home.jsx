import { useEffect, useState } from "react";
import { Link } from "react-router";
import Icon from "../components/Icon";
import Price from "../components/Price";
import TeeMockup from "../components/TeeMockup";
import { DEFAULT_SETTINGS } from "../../shared/pricing.js";
import { whatsappFor } from "../components/WhatsappButton";
import { useFetch } from "../lib/useFetch";
import { usePageTitle } from "../components/usePageTitle";
import { INSTALLMENTS } from "../lib/format";

// Remeras de muestra para el bloque "Diseñá tu remera"
const PROMO = [
  { garment: "boxy", color: "#E48B9C", design: "margarita", aspect: 1, w: 20 },
  { garment: "clasica", color: "#1C1B1F", design: "sol-retro", aspect: 1, w: 22 },
  { garment: "larga", color: "#A9CFEA", design: "rayo", aspect: 1.33, w: 16 },
];

// Fotos que van rotando en la portada
const HERO_SLIDES = [
  { src: "/img/editorial/portada-1.jpg", alt: "Dos chicas de espaldas en la calle con buzos oversize blanco y rojo" },
  { src: "/img/editorial/portada-2.jpg", alt: "Dos chicos con remeras oversize negras estampadas" },
  { src: "/img/editorial/portada-3.jpg", alt: "Modelo con anteojos de sol blancos y negros" },
  { src: "/img/editorial/portada-4.jpg", alt: "Buzos con capucha negro y verde sobre una pista de atletismo" },
];

// Fotos que rotan en el bloque "Nuevos ingresos"
const NEW_IN = [1, 2, 3, 4, 5].map((n) => `/img/editorial/nuevo-${n}.jpg`);

// Palabras que van rotando arriba del título de la portada
const HERO_WORDS = ["Style", "Oversize", "Unisex", "Streetwear", "Comfy", "Everyday"];

// Foto con reemplazo: si la imagen nueva (generada con IA) todavía no existe,
// muestra una de las fotos que ya tiene la tienda.
function Photo({ src, fallback, ...props }) {
  return (
    <img
      src={src}
      onError={(e) => {
        if (fallback && !e.currentTarget.src.endsWith(fallback)) e.currentTarget.src = fallback;
      }}
      {...props}
    />
  );
}

const categories = [
  { slug: "remeras", label: "Remeras", img: "/img/products/remera-oversize-coral.jpg", note: "Algodón peinado y calce oversize, lisas o estampadas." },
  { slug: "buzos", label: "Buzos", img: "/img/products/buzo-basico-negro.jpg", fallback: "/img/products/buzo-trouble-rosa.jpg", note: "Frisa gruesa para todo el invierno." },
  { slug: "conjuntos", label: "Conjuntos", img: "/img/products/conjunto-buzo-jogger.jpg", fallback: "/img/products/buzo-arena.jpg", note: "Arriba y abajo al tono, 10% menos que por separado." },
  { slug: "pantalones", label: "Pantalones", img: "/img/products/pantalon-ancho.jpg", fallback: "/img/products/remera-semaforo.jpg", note: "Joggers, shorts y pierna ancha." },
  { slug: "accesorios", label: "Accesorios", img: "/img/products/gafas-bicolor.jpg", fallback: "/img/products/bucket-amarillo.jpg", note: "Gafas, pilusos y gorras para completar el look." },
];

const values = [
  {
    title: "Calce amplio",
    text: "Hombro caído y largo extra: ropa que no aprieta y se lleva todo el día.",
    img: "/img/products/remera-oversize-coral.jpg",
    to: "/tienda?categoria=remeras",
    tone: "light",
  },
  {
    title: "Algodón",
    text: "Nuestras remeras son 100% algodón peinado, suaves desde el primer uso.",
    img: "/img/products/remera-oversize-rosa.jpg",
    to: "/tienda",
    tone: "mid",
  },
  {
    title: "Cambios en 30 días",
    text: "¿No te quedó bien el talle? Tenés 30 días para cambiarlo.",
    img: "/img/editorial/etiquetas.jpg",
    to: "/nosotros#envios",
    tone: "green",
  },
  {
    title: "Revendé Reed",
    text: "Packs con precio cerrado para arrancar tu emprendimiento o tu marca.",
    img: "/img/products/remera-independent-roja.jpg",
    to: "/revende",
    tone: "dark",
  },
];

const Arrow = () => <span aria-hidden="true">↗</span>;

export default function Home() {
  usePageTitle();
  const featured = useFetch("/products", { query: { destacados: 1, limit: 3 } });
  const all = useFetch("/products");
  const [activeCat, setActiveCat] = useState(0);
  const total = all.data?.products.length;
  const cat = categories[activeCat];

  // Portada: cambia de foto cada 5 segundos
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(id);
  }, []);

  const [newSlide, setNewSlide] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNewSlide((n) => (n + 1) % NEW_IN.length), 3200);
    return () => clearInterval(id);
  }, []);

  const [word, setWord] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setWord((w) => (w + 1) % HERO_WORDS.length), 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {/* ---------- Portada ---------- */}
      <section className="hero" data-header-dark>
        <div className="hero-panel">
          <div className="hero-portrait">
            {HERO_SLIDES.map((s, i) => (
              <img
                key={s.src}
                src={s.src}
                alt={i === slide ? s.alt : ""}
                aria-hidden={i !== slide}
                className={i === slide ? "is-active" : ""}
                fetchPriority={i === 0 ? "high" : "auto"}
              />
            ))}
          </div>
          <div className="wrap hero-grid">
          <div className="hero-copy">
            <span className="hero-kicker">
              /{" "}
              <span key={word} className="hero-word">
                {HERO_WORDS[word]}
              </span>
            </span>
            <h1>
              Ropa ancha
              <br />
              para días
              <br />
              largos
            </h1>
            <p>
              Remeras, buzos y accesorios unisex de algodón, con calce oversize y estampas que
              aguantan los lavados.
            </p>
            <Link to="/tienda" className="btn btn-light">
              Ver la tienda
            </Link>
          </div>
          <div className="hero-thumbs" aria-hidden="true">
            <Photo src="/img/editorial/look-parada.jpg" fallback="/img/products/remera-alas-blanca.jpg" alt="" width="1024" height="1536" />
            <Photo src="/img/editorial/look-sentado.jpg" fallback="/img/products/remera-chaos-uva.jpg" alt="" width="1024" height="1536" />
            <Photo src="/img/editorial/look-caminando.jpg" fallback="/img/products/buzo-ladrillo.jpg" alt="" width="1024" height="1536" />
            <p className="hero-signature">Reed</p>
          </div>
          </div>
        </div>
      </section>

      {/* ---------- La colección ---------- */}
      <section className="wrap collection">
        <p className="collection-mark" aria-hidden="true">
          Oversize
        </p>
        <img className="collection-tilt" src="/img/products/bucket-amarillo.jpg" alt="" loading="lazy" width="300" height="300" />
        <img className="collection-main" src="/img/products/remera-oversize-rosa.jpg" alt="Remeras oversize lisas colgadas en un perchero" loading="lazy" width="600" height="750" />
        <img className="collection-side" src="/img/products/remera-semaforo.jpg" alt="" loading="lazy" width="300" height="400" />
        <p className="collection-text">
          Reed es ropa <strong>unisex de calce amplio</strong>: remeras, buzos y accesorios de{" "}
          <strong>algodón</strong>, pensados para <strong>usarse todos los días</strong>, por
          unidad o por mayor.
        </p>
        <div className="collection-cta">
          <p className="spaced">{total ? `${total} modelos` : "Modelos"} en la tienda</p>
          <Link to="/tienda" className="btn btn-dark">
            Ver la colección
          </Link>
        </div>
      </section>

      {/* ---------- Productos destacados ---------- */}
      <section className="wrap tiles" aria-label="Destacados">
        {featured.error ? (
          <p className="alert alert-error">{featured.error.message}</p>
        ) : featured.loading ? (
          [0, 1, 2].map((i) => <div key={i} className="tile skeleton" aria-hidden="true" />)
        ) : (
          featured.data.products.map((p) => (
            <Link key={p.id} to={`/producto/${p.slug}`} className="tile">
              <img src={p.images[0]} alt="" loading="lazy" width="700" height="500" />
              <span className="tile-info">
                <span className="tile-name">{p.name}</span>
                <span className="tile-desc">{p.description}</span>
                <Price price={p.price} compareAtPrice={p.compareAtPrice} />
              </span>
              {p.colors.length > 0 && (
                <span className="tile-colors" aria-label={`${p.colors.length} colores`}>
                  {p.colors.map((c) => (
                    <span key={c.name} style={{ "--swatch": c.hex }} title={c.name} />
                  ))}
                </span>
              )}
            </Link>
          ))
        )}
        <Link to="/tienda?orden=nuevos" className="tile tile-more">
          <span className="new-slides" aria-hidden="true">
            {NEW_IN.map((src, i) => (
              <img key={src} src={src} alt="" loading="lazy" className={i === newSlide ? "is-active" : ""} />
            ))}
          </span>
          <span className="new-shine" aria-hidden="true" />
          <span className="new-label">
            <small>New in · Drop 2026</small>
            Nuevos
            <br />
            ingresos
          </span>
          <span className="new-marquee" aria-hidden="true">
            <span>
              {Array(2).fill("Nuevos ingresos ✦ New in ✦ Oversize ✦ Recién llegado ✦ ").join("")}
            </span>
          </span>
          <span className="new-arrow">
            <Arrow />
          </span>
        </Link>
      </section>

      {/* ---------- Diseñá tu remera ---------- */}
      <section className="wrap">
        <div className="design-promo">
          <div className="design-promo-copy">
            <span className="hero-kicker">/ Nuevo</span>
            <h2>
              Diseñá
              <br />
              tu remera
            </h2>
            <p>
              Elegí el modelo oversize, el color y tu diseño: uno nuestro, el tuyo o uno que crees
              con IA. Lo ves puesto antes de pagar y el precio baja si llevás varias.
            </p>
            <div className="design-promo-ctas">
              <Link to="/disena" className="btn btn-light">
                Empezar a diseñar <Arrow />
              </Link>
              <Link to="/revende" className="btn btn-outline-light">
                Packs para revender <Arrow />
              </Link>
            </div>
          </div>
          <div className="promo-tees" aria-hidden="true">
            {PROMO.map((t, i) => (
              <TeeMockup
                key={t.design}
                garment={DEFAULT_SETTINGS.garments.find((g) => g.id === t.garment)}
                color={t.color}
                placement={{ src: `/img/designs/${t.design}.svg`, aspect: t.aspect, widthCm: t.w, x: 0.5, y: 0.32 }}
                className={`promo-tee promo-tee-${i}`}
                label=""
              />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Frase ---------- */}
      <section className="wrap motto">
        <h2>
          Menos vueltas.
          <br />
          Más ropa que usás.
        </h2>
        <p className="motto-tags">
          <span>#Unisex</span>
          <span>#Oversize</span>
          <span>#Algodón</span>
        </p>
        <p className="motto-text">
          Hacemos ropa simple, cómoda y con estampas que duran, para ponerte sin pensarlo.
        </p>
      </section>

      {/* ---------- Categorías gigantes ---------- */}
      <section className="wrap cats" aria-label="Categorías">
        <ul className="cats-list">
          {categories.map((c, i) => (
            <li key={c.slug}>
              <Link
                to={`/tienda?categoria=${c.slug}`}
                className={i === activeCat ? "is-active" : ""}
                onMouseEnter={() => setActiveCat(i)}
                onFocus={() => setActiveCat(i)}
              >
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
        <Photo key={cat.img} className="cats-photo" src={cat.img} fallback={cat.fallback} alt="" loading="lazy" width="500" height="620" />
        <p className="cats-note">{cat.note}</p>
        <Link to={`/tienda?categoria=${cat.slug}`} className="btn btn-dark cats-cta">
          Ver {cat.label.toLowerCase()} <Arrow />
        </Link>
      </section>

      {/* ---------- Banner oscuro ---------- */}
      <section className="wrap">
        <div className="banner">
          <Photo className="banner-photo" src="/img/editorial/look-espalda.jpg" fallback="/img/products/remera-semaforo.jpg" alt="" loading="lazy" width="1024" height="1536" />
          <h2>
            Hecha
            <br />
            para el
            <br />
            día a día
          </h2>
          <Link to="/tienda" className="btn btn-light banner-cta">
            Ver la tienda <Arrow />
          </Link>
          <p className="banner-text">
            Prendas para ponerte a la mañana y sacarte a la noche. En la ciudad, en la ruta o en
            el monte.
          </p>
          <p className="banner-quote">“Ropa ancha, estampas que aguantan y nada de apuro.”</p>
        </div>
      </section>

      {/* ---------- Por qué Reed ---------- */}
      <section className="wrap values" aria-label="Por qué Reed">
        {values.map((v, i) => {
          const inner = (
            <>
              <span className="value-num">#{i + 1}</span>
              <img src={v.img} alt="" loading="lazy" width="500" height="300" />
              <span className="value-title glass">{v.title}</span>
              <span className="value-text glass">{v.text}</span>
              <span className="value-arrow">
                <Arrow />
              </span>
            </>
          );
          return v.href ? (
            <a key={v.title} href={v.href} target="_blank" rel="noreferrer" className={`value value-${v.tone}`}>
              {inner}
            </a>
          ) : (
            <Link key={v.title} to={v.to} className={`value value-${v.tone}`}>
              {inner}
            </Link>
          );
        })}
      </section>

      {/* ---------- Contacto ---------- */}
      <section className="wrap contact-band">
        <h2>
          ¿Dudas
          <br />
          con el talle?
        </h2>
        <Photo src="/img/editorial/look-piso.jpg" fallback="/img/products/buzo-trouble-rosa.jpg" alt="" loading="lazy" width="1024" height="1536" />
        <div className="contact-band-copy">
          <p>
            Escribinos por WhatsApp y te ayudamos a elegir. Pagás con Mercado Pago, hasta{" "}
            {INSTALLMENTS} cuotas.
          </p>
          <a
            className="btn btn-dark"
            href={whatsappFor("¡Hola Reed! Tengo una duda con un talle.")}
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="whatsapp" size={18} /> Escribinos
          </a>
        </div>
      </section>
    </>
  );
}
