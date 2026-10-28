import { useEffect, useState } from "react";
import { api } from "./api";

let cache = null;

// Costo de envío y monto para envío gratis, definidos en el servidor
export function useShipping() {
  const [shipping, setShipping] = useState(cache);
  useEffect(() => {
    if (cache) return;
    api("/orders/shipping")
      .then((s) => {
        cache = s;
        setShipping(s);
      })
      .catch(() => {});
  }, []);
  return shipping;
}
