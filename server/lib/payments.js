import crypto from "node:crypto";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import { config } from "../config.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { HttpError } from "../errors.js";

let client;
function mp() {
  if (!config.mp.accessToken) {
    throw new HttpError(503, "Los pagos todavía no están configurados (falta MP_ACCESS_TOKEN)");
  }
  client ??= new MercadoPagoConfig({ accessToken: config.mp.accessToken });
  return client;
}

const isPublicUrl = (url) => url.startsWith("https://");

export function orderReturnUrl(order, accessKey) {
  return `${config.siteUrl}/pedido/${order._id}?key=${accessKey}`;
}

// Crea la preferencia de Checkout Pro y devuelve el link de pago
export async function createPreference(order, accessKey) {
  const back = orderReturnUrl(order, accessKey);
  const customLines = (order.customItems || []).map((c, idx) => ({
    id: `custom-${idx}`,
    title: `${c.title} (${c.quantity} ${c.quantity === 1 ? "remera" : "remeras"})`,
    quantity: 1,
    unit_price: c.total,
    currency_id: "ARS",
  }));
  const body = {
    items: [...order.items.map((i) => ({
      id: String(i.product),
      title: `${i.name} · ${i.color} · ${i.size}`,
      quantity: i.quantity,
      unit_price: i.price,
      currency_id: "ARS",
      picture_url: i.image?.startsWith("http") ? i.image : `${config.siteUrl}${i.image}`,
    })), ...customLines],
    payer: { name: order.customer.name, email: order.customer.email },
    external_reference: order._id.toString(),
    back_urls: { success: back, failure: back, pending: back },
    statement_descriptor: "REED",
    metadata: { order_number: order.number },
  };
  if (order.shippingCost > 0) {
    body.shipments = { cost: order.shippingCost, mode: "not_specified" };
  }
  // Mercado Pago solo acepta auto_return y webhooks con URLs públicas (https)
  if (isPublicUrl(config.siteUrl)) {
    body.auto_return = "approved";
    body.notification_url = `${config.siteUrl}/api/payments/webhook`;
  }

  const pref = await new Preference(mp()).create({ body });
  order.payment = { ...order.payment, preferenceId: pref.id };
  await order.save();
  return pref.init_point;
}

const STATUS_MAP = {
  approved: "pagada",
  authorized: "pendiente",
  pending: "pendiente",
  in_process: "pendiente",
  in_mediation: "pendiente",
  rejected: "rechazada",
  cancelled: "cancelada",
  refunded: "cancelada",
  charged_back: "cancelada",
};

// Consulta el pago en Mercado Pago (nunca confiamos en lo que manda el navegador)
// y actualiza el pedido. Es idempotente: se puede llamar varias veces sin problema.
export async function syncPayment(paymentId) {
  const payment = await new Payment(mp()).get({ id: String(paymentId) });
  const order = await Order.findById(payment.external_reference);
  if (!order) return null;

  const newStatus = STATUS_MAP[payment.status] || "pendiente";
  // No pisamos estados que la tienda ya avanzó a mano (preparando, enviada...)
  const canUpdate = ["pendiente", "rechazada"].includes(order.status) || newStatus === "cancelada";
  order.payment = {
    ...order.payment,
    paymentId: String(payment.id),
    status: payment.status,
    statusDetail: payment.status_detail,
    method: payment.payment_method_id,
    paidAt: payment.status === "approved" ? new Date(payment.date_approved || Date.now()) : order.payment?.paidAt,
  };
  if (canUpdate) order.status = newStatus;
  await order.save();

  if (payment.status === "approved") await applyStock(order._id);
  return order;
}

// Descuenta el stock una sola vez por pedido
async function applyStock(orderId) {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, stockApplied: false },
    { $set: { stockApplied: true } },
    { new: true }
  );
  if (!order) return; // ya se había aplicado
  for (const item of order.items) {
    const res = await Product.updateOne(
      {
        _id: item.product,
        variants: { $elemMatch: { color: item.color, size: item.size, stock: { $gte: item.quantity } } },
      },
      { $inc: { "variants.$.stock": -item.quantity } }
    );
    if (res.modifiedCount === 0) {
      console.warn(`⚠️ Pedido #${order.number}: no alcanzó el stock de ${item.name} ${item.color}/${item.size}`);
    }
  }
}

// Valida la firma x-signature que manda Mercado Pago en los webhooks
// https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
export function isValidSignature(req, dataId) {
  if (!config.mp.webhookSecret) return true; // sin clave configurada no se puede validar
  const signature = req.headers["x-signature"] || "";
  const requestId = req.headers["x-request-id"] || "";
  const parts = Object.fromEntries(
    signature.split(",").map((p) => p.trim().split("=").map((s) => s.trim()))
  );
  if (!parts.ts || !parts.v1) return false;
  const id = /^[a-z0-9]+$/i.test(dataId) ? String(dataId).toLowerCase() : dataId;
  const manifest = `id:${id};request-id:${requestId};ts:${parts.ts};`;
  const expected = crypto.createHmac("sha256", config.mp.webhookSecret).update(manifest).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
  } catch {
    return false;
  }
}
