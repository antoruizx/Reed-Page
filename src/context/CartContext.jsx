import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const KEY = "reed.cart";

const lineId = (i) => `${i.productId}|${i.color}|${i.size}`;

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(load);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* sin almacenamiento: el carrito vive en memoria */
    }
  }, [items]);

  // item: { productId, slug, name, image, price, color, size, quantity, maxStock }
  const add = useCallback((item) => {
    setItems((prev) => {
      const id = lineId(item);
      const existing = prev.find((i) => lineId(i) === id);
      if (existing) {
        return prev.map((i) =>
          lineId(i) === id
            ? { ...i, quantity: Math.min(i.quantity + item.quantity, item.maxStock ?? 99) }
            : i
        );
      }
      return [...prev, item];
    });
    setOpen(true);
  }, []);

  const setQuantity = useCallback((item, quantity) => {
    setItems((prev) =>
      prev
        .map((i) =>
          lineId(i) === lineId(item)
            ? { ...i, quantity: Math.max(0, Math.min(quantity, i.maxStock ?? 99)) }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const remove = useCallback((item) => {
    setItems((prev) => prev.filter((i) => lineId(i) !== lineId(item)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    return { items, count, subtotal, add, setQuantity, remove, clear, open, setOpen, lineId };
  }, [items, add, setQuantity, remove, clear, open]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
