import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import Price, { discountPercent } from "../components/Price";
import ProductCard from "../components/ProductCard";
import { QuantityStepper } from "../components/CartDrawer";
import { whatsappFor } from "../components/WhatsappButton";
import Icon from "../components/Icon";
import { useFetch } from "../lib/useFetch";
import { useCart } from "../context/CartContext";
import { CATEGORY_LABELS, INSTALLMENTS, money } from "../lib/format";
import { usePageTitle } from "../components/usePageTitle";
import NotFound from "./NotFound";

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "Único"];

export default function ProductPage() {
  const { slug } = useParams();
  const { data, loading, error } = useFetch(`/products/${slug}`);
  const product = data?.product;
  usePageTitle(product?.name);

  if (loading) return <div className="spinner" role="status" aria-label="Cargando producto" />;
  if (error?.status === 404) return <NotFound message={error.message} />;
  if (error) return <p className="wrap page alert alert-error">{error.message}</p>;

  return (
    <ProductView
      key={product.id}
      product={product}
      related={data.related}
      parts={data.parts || []}
      sets={data.sets || []}
    />
  );
}

// Conjunto: muestra cuánto se ahorra y las prendas para llevar por separado.
// Prenda suelta: ofrece los conjuntos que la incluyen.
function SetBox({ product, parts, sets }) {
  if (parts.length > 0) {
    const separate = parts.reduce((sum, p) => sum + p.price, 0);
    const saving = separate - product.price;
    return (
      <div className="set-box">
        <p className="set-box-title">
          {saving > 0 ? <>Llevando el conjunto ahorrás <strong>{money(saving)}</strong></> : "Este conjunto incluye"}
        </p>
        <p className="hint">¿Preferís una sola prenda? Comprala por separado:</p>
        <ul className="set-parts">
          {parts.map((p) => (
            <li key={p.id}>
              <Link to={`/producto/${p.slug}`}>
                <img src={p.images[0]} alt="" width="64" height="80" />
                <span>{p.name}</span>
                <span className="set-part-price">{money(p.price)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (sets.length > 0) {
    return (
      <div className="set-box">
        <p className="set-box-title">Completá el look y ahorrá</p>
        <ul className="set-parts">
          {sets.map((p) => (
            <li key={p.id}>
              <Link to={`/producto/${p.slug}`}>
                <img src={p.images[0]} alt="" width="64" height="80" />
                <span>{p.name}</span>
                <span className="set-part-price">{money(p.price)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return null;
}

function ProductView({ product, related, parts, sets }) {
  const { add } = useCart();
  const firstWithStock = product.colors.find((c) =>
    product.variants.some((v) => v.color === c.name && v.stock > 0)
  );
  const [color, setColor] = useState((firstWithStock || product.colors[0])?.name);
  const [size, setSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [sizeError, setSizeError] = useState(false);

  const gallery = useMemo(() => {
    const colorImg = product.colors.find((c) => c.name === color)?.image;
    const rest = product.images.filter((i) => i !== colorImg);
    return colorImg ? [colorImg, ...rest] : product.images;
  }, [product, color]);

  useEffect(() => setActiveImage(0), [color]);

  const sizes = SIZE_ORDER.filter((s) => product.variants.some((v) => v.size === s));
  const variantFor = (s) => product.variants.find((v) => v.color === color && v.size === s);
  const selected = size ? variantFor(size) : null;
  const stock = selected?.stock ?? 0;
  const soldOut = product.totalStock === 0;
  const off = discountPercent(product.price, product.compareAtPrice);

  const pickSize = (s) => {
    setSize(s);
    setSizeError(false);
    setQuantity(1);
  };

  const handleAdd = () => {
    if (!size) {
      setSizeError(true);
      return;
    }
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: gallery[0],
      price: product.price,
      color,
      size,
      quantity,
      maxStock: stock,
    });
  };

  return (
    <>
      <div className="wrap page product-page">
        <nav className="crumbs" aria-label="Estás en">
          <Link to="/tienda">Tienda</Link>
          <span aria-hidden="true">/</span>
          <Link to={`/tienda?categoria=${product.category}`}>{CATEGORY_LABELS[product.category]}</Link>
        </nav>

        <div className="product-layout">
          <div className="gallery">
            <div className="gallery-main">
              <img src={gallery[activeImage]} alt={`${product.name}, ${color}`} width="900" height="1100" />
              {off > 0 && <span className="badge product-card-badge">−{off}%</span>}
            </div>
            {gallery.length > 1 && (
              <div className="gallery-thumbs">
                {gallery.map((img, i) => (
                  <button
                    key={img}
                    className={i === activeImage ? "active" : ""}
                    onClick={() => setActiveImage(i)}
                    aria-label={`Ver foto ${i + 1}`}
                    aria-current={i === activeImage}
                  >
                    <img src={img} alt="" width="120" height="150" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="buy-box">
            <h1>{product.name}</h1>
            <div className="buy-price">
              <Price price={product.price} compareAtPrice={product.compareAtPrice} />
              <span className="hint">
                {INSTALLMENTS} cuotas de {money(product.price / INSTALLMENTS)} con Mercado Pago
              </span>
            </div>
            {product.description && <p className="buy-desc">{product.description}</p>}

            <fieldset className="picker">
              <legend>
                Color: <strong>{color}</strong>
              </legend>
              <div className="color-picker">
                {product.colors.map((c) => {
                  const has = product.variants.some((v) => v.color === c.name && v.stock > 0);
                  return (
                    <button
                      key={c.name}
                      type="button"
                      className={`color-dot ${c.name === color ? "active" : ""} ${has ? "" : "is-out"}`}
                      style={{ "--swatch": c.hex }}
                      aria-pressed={c.name === color}
                      aria-label={`${c.name}${has ? "" : " (sin stock)"}`}
                      title={c.name}
                      onClick={() => {
                        setColor(c.name);
                        if (size && !(product.variants.find((v) => v.color === c.name && v.size === size)?.stock > 0)) setSize(null);
                      }}
                    />
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="picker">
              <legend className="row-between">
                <span>Talle</span>
                <Link to="/nosotros#talles" className="link small">
                  Guía de talles
                </Link>
              </legend>
              <div className="chips">
                {sizes.map((s) => {
                  const v = variantFor(s);
                  const available = v?.stock > 0;
                  return (
                    <button
                      key={s}
                      type="button"
                      className={`chip chip-lg ${size === s ? "active" : ""}`}
                      aria-pressed={size === s}
                      disabled={!available}
                      onClick={() => pickSize(s)}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              {sizeError && <p className="error-text" role="alert">Elegí un talle para seguir.</p>}
              {selected && stock > 0 && stock <= 3 && (
                <p className="hint low-stock">{stock === 1 ? "Queda 1 solo" : `Quedan ${stock}`} en este talle</p>
              )}
            </fieldset>

            <div className="buy-actions">
              <QuantityStepper value={quantity} max={stock || 1} onChange={(q) => setQuantity(Math.max(1, q))} label="Cantidad" />
              <button className="btn btn-primary btn-grow" onClick={handleAdd} disabled={soldOut}>
                {soldOut ? "Sin stock" : "Agregar al carrito"}
              </button>
            </div>

            <SetBox product={product} parts={parts} sets={sets} />

            <a
              className="ask-wa"
              href={whatsappFor(`¡Hola! Tengo una consulta sobre ${product.name} (${color}).`)}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="whatsapp" size={18} /> ¿Dudas con el talle? Preguntanos
            </a>

            {product.details?.length > 0 && (
              <details className="product-details" open>
                <summary>Detalles</summary>
                <ul>
                  {product.details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </details>
            )}
            <details className="product-details">
              <summary>Envíos y cambios</summary>
              <p>
                Enviamos a todo el país o podés retirar sin costo. Si el talle no te queda, lo
                cambiamos dentro de los 30 días con la prenda sin uso y con etiqueta.
              </p>
            </details>
          </div>
        </div>
      </div>

      {related?.length > 0 && (
        <section className="wrap section related">
          <div className="section-head">
            <h2>También te puede gustar</h2>
          </div>
          <div className="product-grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
