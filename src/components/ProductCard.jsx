import { useState } from "react";
import { Link } from "react-router";
import Price, { discountPercent } from "./Price";

export default function ProductCard({ product }) {
  const [hoverColor, setHoverColor] = useState(null);
  const off = discountPercent(product.price, product.compareAtPrice);
  const soldOut = product.totalStock === 0;
  const image =
    (hoverColor && product.colors.find((c) => c.name === hoverColor)?.image) || product.images[0];

  return (
    <article className="product-card">
      <Link to={`/producto/${product.slug}`} className="product-card-media">
        <img src={image} alt={product.name} loading="lazy" width="600" height="750" />
        {off > 0 && <span className="badge product-card-badge">−{off}%</span>}
        {soldOut && <span className="product-card-soldout">Sin stock</span>}
      </Link>
      <div className="product-card-body">
        <h3>
          <Link to={`/producto/${product.slug}`}>{product.name}</Link>
        </h3>
        <Price price={product.price} compareAtPrice={product.compareAtPrice} />
      </div>
      {product.colors.length > 1 && (
        <ul className="swatches" aria-label={`${product.colors.length} colores`}>
          {product.colors.map((c) => (
            <li key={c.name}>
              <span
                className="swatch"
                style={{ "--swatch": c.hex }}
                title={c.name}
                onMouseEnter={() => setHoverColor(c.name)}
                onMouseLeave={() => setHoverColor(null)}
              />
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export function ProductGridSkeleton({ count = 4 }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} aria-hidden="true">
      <div className="skeleton" style={{ aspectRatio: "4 / 5" }} />
      <div className="skeleton" style={{ height: 16, width: "70%", marginTop: 14 }} />
      <div className="skeleton" style={{ height: 16, width: "35%", marginTop: 8 }} />
    </div>
  ));
}
