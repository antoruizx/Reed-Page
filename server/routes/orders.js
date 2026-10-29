import { Router } from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { getStore } from "../models/Settings.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { createPreference, syncPayment } from "../lib/payments.js";
import { buildCustomItems } from "../lib/custom.js";
import { badRequest, notFound } from "../errors.js";
import { PROVINCES, shippingQuote, transferDiscount } from "../../shared/store.js";

const router = Router();

// Lo que el front necesita para calcular envío y descuento (sin datos bancarios)
router.get("/shipping", async (_req, res) => {
  const store = await getStore();
  res.json({
    shipping: store.shipping,
    pickup: store.pickup,
    transfer: { enabled: store.transfer.enabled, discountPct: store.transfer.discountPct },
  });
});

// Datos para transferir: solo se muestran dentro de un pedido por transferencia
function transferInfo(store) {
  const { alias, cbu, holder, bank } = store.transfer;
  return { alias, cbu, holder, bank };
}

// Crea el pedido y devuelve el link de pago de Mercado Pago
router.post("/", optionalAuth, async (req, res) => {
  const { items = [], custom = [], customer = {}, shipping = {}, paymentMethod } = req.body ?? {};
  const store = await getStore();
  const byTransfer = paymentMethod === "transferencia";
  if (byTransfer && !store.transfer.enabled) throw badRequest("El pago por transferencia no está disponible");
  if (shipping.method !== "envio" && !store.pickup.enabled) throw badRequest("El retiro en persona no está disponible");
  if (!Array.isArray(items) || !Array.isArray(custom) || items.length + custom.length === 0) {
    throw badRequest("Tu carrito está vacío");
  }
  if (items.length > 30) throw badRequest("Demasiados productos en un solo pedido");

  // Los precios SIEMPRE salen de la base, nunca del navegador
  const ids = [...new Set(items.map((i) => i.productId))];
  const products = await Product.find({ _id: { $in: ids }, active: true });
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  const orderItems = [];
  const problems = [];
  for (const i of items) {
    const p = byId.get(String(i.productId));
    const qty = Math.floor(Number(i.quantity));
    if (!p) {
      problems.push("Uno de los productos ya no está disponible");
      continue;
    }
    if (!qty || qty < 1 || qty > 20) throw badRequest("Cantidad inválida");
    const variant = p.soldOut ? null : p.variants.find((v) => v.color === i.color && v.size === i.size);
    if (!variant || variant.stock < qty) {
      problems.push(
        variant?.stock
          ? `De ${p.name} (${i.color}, ${i.size}) quedan solo ${variant.stock}`
          : `${p.name} (${i.color}, ${i.size}) se quedó sin stock`
      );
      continue;
    }
    orderItems.push({
      product: p._id,
      name: p.name,
      slug: p.slug,
      image: p.images[0],
      color: i.color,
      size: i.size,
      price: p.price,
      quantity: qty,
    });
  }
  if (problems.length) throw badRequest(problems.join(". "), { items: problems });

  if (shipping.method === "envio") {
    const missing = ["address", "city", "province", "zip"].filter((k) => !shipping[k]?.trim());
    if (missing.length) {
      throw badRequest("Completá la dirección de envío", Object.fromEntries(missing.map((k) => [k, "Requerido"])));
    }
    if (!PROVINCES.includes(shipping.province)) {
      throw badRequest("Elegí una provincia de la lista", { province: "Elegí una de la lista" });
    }
  }

  const { customItems, subtotal: customSubtotal } = await buildCustomItems(custom);
  const subtotal = orderItems.reduce((s, i) => s + i.price * i.quantity, 0) + customSubtotal;
  const quote = shipping.method === "envio" ? shippingQuote(store, shipping.province, subtotal) : null;
  const shippingCost = quote ? quote.cost : 0;
  const discount = byTransfer ? transferDiscount(store, subtotal) : 0;

  const order = new Order({
    user: req.user?._id,
    customer: {
      name: customer.name,
      email: customer.email || req.user?.email,
      phone: customer.phone,
    },
    shipping: {
      method: shipping.method === "envio" ? "envio" : "retiro",
      address: shipping.address,
      city: shipping.city,
      province: shipping.province,
      zip: shipping.zip,
      notes: shipping.notes,
      zone: quote?.zone,
    },
    items: orderItems,
    customItems,
    subtotal,
    shippingCost,
    discount,
    total: subtotal - discount + shippingCost,
    payment: { provider: byTransfer ? "transferencia" : "mercadopago" },
  });
  await order.save();

  // Por transferencia no hay link de pago: el pedido muestra los datos para transferir
  const checkoutUrl = byTransfer ? null : await createPreference(order, order.accessKey);
  res.status(201).json({ order, accessKey: order.accessKey, checkoutUrl });
});

router.get("/mine", requireAuth, async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.json({ orders });
});

// Ver un pedido: la dueña, una admin, o quien tenga la clave del link de Mercado Pago
router.get("/:id", optionalAuth, async (req, res) => {
  let order = await Order.findById(req.params.id).select("+accessKey");
  if (!order) throw notFound("No encontramos ese pedido");

  const isOwner = req.user && order.user?.equals(req.user._id);
  const isAdmin = req.user?.role === "admin";
  const hasKey = req.query.key && req.query.key === order.accessKey;
  if (!isOwner && !isAdmin && !hasKey) throw notFound("No encontramos ese pedido");

  // Al volver de Mercado Pago viene ?payment_id=...: lo verificamos contra MP.
  // Esto también hace que funcione en local, donde los webhooks no llegan.
  const paymentId = req.query.payment_id;
  if (paymentId && paymentId !== "null" && order.payment?.paymentId !== paymentId) {
    try {
      order = (await syncPayment(paymentId)) || order;
    } catch (err) {
      console.error("No se pudo verificar el pago", err.message);
    }
  }

  const byTransfer = order.payment?.provider === "transferencia";
  const transfer = byTransfer && order.status === "pendiente" ? transferInfo(await getStore()) : undefined;
  res.json({ order, transfer });
});

// Reintentar el pago de un pedido que quedó pendiente o rechazado
router.post("/:id/pay", optionalAuth, async (req, res) => {
  const order = await Order.findById(req.params.id).select("+accessKey");
  if (!order) throw notFound("No encontramos ese pedido");
  const allowed =
    (req.user && order.user?.equals(req.user._id)) || req.body?.key === order.accessKey;
  if (!allowed) throw notFound("No encontramos ese pedido");
  if (!["pendiente", "rechazada"].includes(order.status)) {
    throw badRequest("Este pedido ya no se puede pagar");
  }
  // El total ya tiene el descuento de transferencia: no se puede pagar con Mercado Pago
  if (order.payment?.provider === "transferencia") {
    throw badRequest("Este pedido se paga por transferencia. Escribinos si querés cambiar el medio de pago.");
  }
  const checkoutUrl = await createPreference(order, order.accessKey);
  res.json({ checkoutUrl });
});

export default router;
