import { useEffect, useState } from "react";
import { api } from "./api";

let cache = null;
let pending = null;

// Zonas de envío, retiro y descuento por transferencia (definidos en el panel)
export function useShipping() {
  const [store, setStore] = useState(cache);
  useEffect(() => {
    if (cache) return;
    pending ??= api("/orders/shipping");
    pending
      .then((s) => {
        cache = s;
        setStore(s);
      })
      .catch(() => {
        pending = null;
      });
  }, []);
  return store;
}

export function invalidateShipping() {
  cache = null;
  pending = null;
}

// Recordamos la provincia del último checkout para calcular el envío en el carrito
const PROVINCE_KEY = "reed.province";

export function savedProvince() {
  try {
    return localStorage.getItem(PROVINCE_KEY) || "";
  } catch {
    return "";
  }
}

export function saveProvince(province) {
  try {
    if (province) localStorage.setItem(PROVINCE_KEY, province);
  } catch {
    /* sin almacenamiento */
  }
}
