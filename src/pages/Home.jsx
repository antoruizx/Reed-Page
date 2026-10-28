import { Link } from "react-router";
import ProductCard, { ProductGridSkeleton } from "../components/ProductCard";
import Icon from "../components/Icon";
import { whatsappFor } from "../components/WhatsappButton";
import { useFetch } from "../lib/useFetch";
import { useShipping } from "../lib/useShipping";
import { usePageTitle } from "../components/usePageTitle";
import { money, INSTALLMENTS } from "../lib/format";

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

      <section className="wholesale">
        <div className="wrap wholesale-inner">
          <div>
            <h2>Hacemos tu remera.</h2>
            <p>
              ¿Tenés una marca, un equipo o un evento? Estampamos remeras y buzos con tu diseño, por
              cantidad y con precio mayorista. Contanos qué necesitás y te pasamos presupuesto.
            </p>
            <a
              className="btn btn-primary"
              href={whatsappFor("¡Hola Reed! Quiero pedir un presupuesto de prendas personalizadas.")}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="whatsapp" size={20} /> Pedir presupuesto
            </a>
          </div>
          <img src="/img/products/remera-alas-blanca.jpg" alt="Remera blanca con estampa grande en la espalda" loading="lazy" width="560" height="430" />
        </div>
      </section>
    </>
  );
}
