import { useEffect, useState } from "react";
import { api } from "./api";

let cache = null;
let pending = null;

// Modelos, colores, precios, packs y diseños del catálogo (se pide una vez)
export function useCustomConfig() {
  const [state, setState] = useState(cache ? { data: cache, error: null } : { data: null, error: null });
  useEffect(() => {
    if (cache) return;
    pending ??= api("/custom/config");
    pending
      .then((data) => {
        cache = data;
        setState({ data, error: null });
      })
      .catch((error) => {
        pending = null;
        setState({ data: null, error });
      });
  }, []);
  return state;
}

export function invalidateCustomConfig() {
  cache = null;
  pending = null;
}
