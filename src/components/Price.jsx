import { money } from "../lib/format";

export default function Price({ price, compareAtPrice }) {
  const onSale = compareAtPrice && compareAtPrice > price;
  return (
    <span className="price">
      {onSale && (
        <s>
          <span className="visually-hidden">Antes </span>
          {money(compareAtPrice)}
        </s>
      )}
      <span>
        {onSale && <span className="visually-hidden">Ahora </span>}
        {money(price)}
      </span>
    </span>
  );
}

export function discountPercent(price, compareAtPrice) {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round((1 - price / compareAtPrice) * 100);
}
