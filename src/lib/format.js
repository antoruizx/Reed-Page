const ars = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export const money = (n) => ars.format(Math.round(n || 0));

export const CATEGORY_LABELS = {
  remeras: "Remeras",
  buzos: "Buzos",
  pantalones: "Pantalones",
  conjuntos: "Conjuntos",
  accesorios: "Accesorios",
};

export const STATUS_LABELS = {
  pendiente: "Esperando el pago",
  pagada: "Pagado",
  rechazada: "Pago rechazado",
  preparando: "Preparando",
  enviada: "En camino",
  entregada: "Entregado",
  cancelada: "Cancelado",
};

export const formatDate = (d) =>
  new Date(d).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });

// Estado de un producto en el panel
export const PRODUCT_STATUS_LABELS = {
  publicado: "Publicado",
  oculto: "No publicado",
  agotado: "Sin stock",
};

export function productStatus(p) {
  if (!p.active) return "oculto";
  return p.soldOut ? "agotado" : "publicado";
}

// Cuotas sin interés de referencia (Mercado Pago define las reales al pagar)
export const INSTALLMENTS = 3;

export function colorImage(product, colorName) {
  return product.colors?.find((c) => c.name === colorName)?.image || product.images?.[0];
}
