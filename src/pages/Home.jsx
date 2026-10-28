import { Link } from "react-router";
import ProductCard, { ProductGridSkeleton } from "../components/ProductCard";
import Icon from "../components/Icon";
import TeeMockup from "../components/TeeMockup";
import { DEFAULT_SETTINGS } from "../../shared/pricing.js";
import { useFetch } from "../lib/useFetch";
import { useShipping } from "../lib/useShipping";
import { usePageTitle } from "../components/usePageTitle";
import { money, INSTALLMENTS } from "../lib/format";

const PROMO = [
  { garment: "boxy", color: "#E48B9C", design: "margarita", aspect: 1, w: 20 },
  { garment: "clasica", color: "#1C1B1F", design: "sol-retro", aspect: 1, w: 22 },
  { garment: "larga", color: "#A9CFEA", design: "rayo", aspect: 1.33, w: 16 },
];

const categories = [
  { slug: "remeras", label: "Remeras", img: "/img/products/remera-oversize-coral.jpg", note: "Algodón peinado, calce oversize" },
  { slug: "buzos", label: "Buzos", img: "/img/products/buzo-arena.jpg", note: "Frisa gruesa para todo el invierno" },
  { slug: "accesorios", label: "Accesorios", img: "/img/products/bucket-amarillo.jpg", note: "Pilusos y gorras" },
];

export default function Home() {
  usePageTitle();
  const { data, loading, error } = useFetch("/products", { query: { destacados: 1, limit: 8 } });
  const shipping = useShipping();

  return (
    <>
      <section className="hero">
        <div className="wrap hero-inner">
          <div className="hero-copy">
            <h1>
              Ropa ancha
              <br />
              para días
              <br />
              largos.
            </h1>
            <p>
              Remeras, buzos y accesorios unisex de algodón, con calce oversize y estampas que
              aguantan los lavados.
            </p>
            <div className="hero-ctas">
              <Link to="/tienda" className="btn btn-dark">
                Ver la tienda
              </Link>
              <Link to="/tienda?categoria=buzos" className="btn btn-outline">
                Ver buzos
              </Link>
            </div>
          </div>
          <div className="hero-prints" aria-hidden="true">
            <img src="/img/products/remera-semaforo.jpg" alt="" className="print print-a" width="520" height="400" />
            <img src="/img/products/remera-chaos-uva.jpg" alt="" className="print print-b" width="360" height="300" />
            <img src="/img/products/bucket-amarillo.jpg" alt="" className="print print-c" width="340" height="260" />
          </div>
        </div>
      </section>

      <section className="perks" aria-label="Cómo comprar">
        <div className="wrap perks-inner">
          <p>
            <Icon name="truck" />
            <span>
              Envíos a todo el país
              {shipping && <>, gratis desde {money(shipping.freeFrom)}</>}
            </span>
          </p>
          <p>
            <Icon name="card" />
            <span>Pagás con Mercado Pago, hasta {INSTALLMENTS} cuotas</span>
          </p>
          <p>
            <Icon name="store" />
            <span>Cambios de talle dentro de los 30 días</span>
          </p>
        </div>
      </section>

      <section className="wrap section">
        <div className="section-head">
          <h2>Lo nuevo</h2>
          <Link to="/tienda" className="link">
            Ver todo
          </Link>
        </div>
        {error ? (
          <p className="alert alert-error">{error.message}</p>
        ) : (
          <div className="product-grid">
            {loading ? (
              <ProductGridSkeleton count={4} />
            ) : (
              data.products.map((p) => <ProductCard key={p.id} product={p} />)
            )}
          </div>
        )}
      </section>

      <section className="wrap section">
        <div className="section-head">
          <h2>Elegí por prenda</h2>
        </div>
        <div className="category-grid">
          {categories.map((c) => (
            <Link key={c.slug} to={`/tienda?categoria=${c.slug}`} className="category-tile">
              <img src={c.img} alt="" loading="lazy" width="600" height="700" />
              <span className="category-label">{c.label}</span>
              <span className="category-note">{c.note}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="design-promo">
        <div className="wrap design-promo-inner">
          <div>
            <h2>Diseñá tu remera.</h2>
            <p>
              Elegí el modelo oversize, el color y tu diseño: uno nuestro, el tuyo o uno que crees con
              IA. Lo ves puesto antes de pagar y el precio baja si llevás varias.
            </p>
            <div className="hero-ctas">
              <Link to="/disena" className="btn btn-primary">
                Empezar a diseñar
              </Link>
              <Link to="/revende" className="btn btn-outline-light">
                Packs para revender
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
    </>
  );
}
