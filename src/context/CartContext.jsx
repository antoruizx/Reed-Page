import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const KEY = "reed.cart";

// Productos de la tienda: una línea por producto + color + talle.
// Personalizadas y packs: cada una es su propia línea, con un id.
const lineId = (i) => (i.type ? i.id : `${i.productId}|${i.color}|${i.size}`);
export const isCustomLine = (i) => i.type === "custom" || i.type === "pack";
export const lineTotal = (i) => (isCustomLine(i) ? i.total : i.price * i.quantity);
export const lineUnits = (i) => (isCustomLine(i) ? i.units : i.quantity);

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

const newId = () =>
  globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;

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

  // Personalizada o pack. Si trae id de una línea existente, la reemplaza (edición).
  const addCustom = useCallback((line) => {
    const withId = { ...line, id: line.id || newId() };
    setItems((prev) =>
      prev.some((i) => i.id === withId.id)
        ? prev.map((i) => (i.id === withId.id ? withId : i))
        : [...prev, withId]
    );
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
        .filter((i) => isCustomLine(i) || i.quantity > 0)
    );
  }, []);

  const remove = useCallback((item) => {
    setItems((prev) => prev.filter((i) => lineId(i) !== lineId(item)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => {
    const count = items.reduce((s, i) => s + lineUnits(i), 0);
    const subtotal = items.reduce((s, i) => s + lineTotal(i), 0);
    return { items, count, subtotal, add, addCustom, setQuantity, remove, clear, open, setOpen, lineId };
  }, [items, add, addCustom, setQuantity, remove, clear, open]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
