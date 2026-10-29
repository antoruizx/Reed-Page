import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import Icon from "../components/Icon";
import { EntrySummary, MiniTee } from "../components/CustomItem";
import { whatsappFor } from "../components/WhatsappButton";
import { api } from "../lib/api";
import { money, STATUS_LABELS, formatDate } from "../lib/format";
import { orderKey, rememberOrder } from "../lib/orders";
import { usePageTitle } from "../components/usePageTitle";
import { carrierFor } from "../../shared/store.js";

// Datos para transferir, con botón para copiar cada uno
function TransferBox({ order, transfer }) {
  const [copied, setCopied] = useState(null);
  const copy = async (label, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* el navegador no deja copiar: se puede seleccionar a mano */
    }
  };
  const rows = [
    ["Monto", money(order.total), String(Math.round(order.total))],
    ["Alias", transfer.alias, transfer.alias],
    ["CBU / CVU", transfer.cbu, transfer.cbu],
    ["Titular", transfer.holder],
    ["Banco", transfer.bank],
  ].filter(([, v]) => v);
  return (
    <div className="transfer-box">
      <h2>Datos para transferir</h2>
      <dl>
        {rows.map(([label, shown, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>
              <span className="num">{shown}</span>
              {value && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => copy(label, value)}>
                  {copied === label ? "Copiado" : "Copiar"}
                </button>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <a
        className="btn btn-primary"
        href={whatsappFor(`¡Hola! Te mando el comprobante de la transferencia del pedido #${order.number} (${money(order.total)}).`)}
        target="_blank"
        rel="noreferrer"
      >
        <Icon name="whatsapp" size={18} /> Enviar comprobante por WhatsApp
      </a>
    </div>
  );
}

function TrackingInfo({ shipping }) {
  if (!shipping.tracking) return null;
  const carrier = carrierFor(shipping.carrier);
  const link = shipping.trackingUrl || carrier?.url;
  return (
    <div className="tracking-info">
      <h2>Seguimiento</h2>
      <p>
        {carrier && carrier.id !== "otro" ? carrier.name : "Código"}: <strong className="num">{shipping.tracking}</strong>
      </p>
      {link && (
        <a className="btn btn-outline btn-sm" href={link} target="_blank" rel="noreferrer">
          <Icon name="truck" size={18} /> Seguir mi envío
        </a>
      )}
    </div>
  );
}

const COPY = {
  pagada: {
    title: "¡Listo! Tu pedido está pago.",
    text: "Te avisamos por email y WhatsApp cuando lo despachemos.",
  },
  pendiente: {
    title: "Estamos esperando la confirmación del pago.",
    text: "Si pagaste en efectivo o por transferencia, puede tardar unas horas. Esta página se actualiza sola.",
  },
  rechazada: {
    title: "El pago no se aprobó.",
    text: "No se cobró nada. Podés probar con otro medio de pago; tu pedido queda guardado.",
  },
  preparando: { title: "Estamos preparando tu pedido.", text: "Te avisamos cuando salga." },
  enviada: { title: "Tu pedido está en camino.", text: "Si tenés dudas con la entrega, escribinos." },
  entregada: { title: "Tu pedido fue entregado.", text: "¡Que lo disfrutes!" },
  cancelada: { title: "Este pedido fue cancelado.", text: "Si no sabés por qué, escribinos y lo vemos." },
};

export default function OrderPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const key = params.get("key") || orderKey(id);
  const paymentId = params.get("payment_id");
  const [order, setOrder] = useState(null);
  const [transfer, setTransfer] = useState(null);
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);
  usePageTitle(order ? `Pedido #${order.number}` : "Tu pedido");

  useEffect(() => {
    if (key) rememberOrder(id, key);
  }, [id, key]);

  useEffect(() => {
    let timer;
    let tries = 0;
    const load = (withPayment) =>
      api(`/orders/${id}`, { query: { key, payment_id: withPayment ? paymentId : undefined } })
        .then(({ order, transfer }) => {
          setOrder(order);
          setTransfer(transfer || null);
          // Mientras esté pendiente con Mercado Pago, consultamos cada 5 segundos (hasta 2 minutos)
          const byTransfer = order.payment?.provider === "transferencia";
          if (order.status === "pendiente" && !byTransfer && tries++ < 24) timer = setTimeout(() => load(false), 5000);
        })
        .catch(setError);
    load(true);
    return () => clearTimeout(timer);
  }, [id, key, paymentId]);

  const retry = async () => {
    setRetrying(true);
    try {
      const { checkoutUrl } = await api(`/orders/${id}/pay`, { method: "POST", body: { key } });
      window.location.assign(checkoutUrl);
    } catch (err) {
      setError(err);
      setRetrying(false);
    }
  };

  if (error && !order) {
    return (
      <div className="wrap page">
        <div className="empty">
          <h1 className="page-title">No pudimos abrir este pedido.</h1>
          <p>{error.message}. Si compraste con una cuenta, iniciá sesión y buscalo en Mis pedidos.</p>
          <Link to="/cuenta" className="btn btn-dark">
            Ir a Mis pedidos
          </Link>
        </div>
      </div>
    );
  }
  if (!order) return <div className="spinner" role="status" aria-label="Cargando pedido" />;

  const byTransfer = order.payment?.provider === "transferencia";
  const copy =
    byTransfer && order.status === "pendiente"
      ? {
          title: "¡Pedido confirmado! Falta la transferencia.",
          text: "Transferí el total y mandanos el comprobante por WhatsApp. Lo preparamos apenas se acredite.",
        }
      : COPY[order.status];
  const tone = { pagada: "ok", rechazada: "bad", cancelada: "bad" }[order.status] || "wait";

  return (
    <div className="wrap page order-page">
      <section className={`order-hero tone-${tone}`} aria-live="polite">
        <span className="order-icon">
          <Icon name={tone === "ok" ? "check" : tone === "bad" ? "close" : "card"} size={28} />
        </span>
        <div>
          <p className="order-number">
            Pedido #{order.number}, {formatDate(order.createdAt)}
          </p>
          <h1>{copy.title}</h1>
          <p>{copy.text}</p>
          {!byTransfer && ["pendiente", "rechazada"].includes(order.status) && (
            <button className="btn btn-primary" onClick={retry} disabled={retrying}>
              {retrying ? "Abriendo Mercado Pago…" : order.status === "rechazada" ? "Probar otro medio de pago" : "Pagar ahora"}
            </button>
          )}
          {error && order && <p className="alert alert-error">{error.message}</p>}
        </div>
      </section>

      {byTransfer && transfer && <TransferBox order={order} transfer={transfer} />}

      <div className="order-grid">
        <section>
          <h2>Productos</h2>
          <ul className="cart-lines">
            {order.items.map((i) => (
              <li key={`${i.product}-${i.color}-${i.size}`} className="cart-line">
                <span className="cart-line-img">
                  <img src={i.image} alt="" width="80" height="100" />
                </span>
                <div className="cart-line-info">
                  <span className="cart-line-name">{i.name}</span>
                  <span className="cart-line-meta">
                    {i.color} / {i.size} / {i.quantity} u.
                  </span>
                </div>
                <span className="cart-line-price">{money(i.price * i.quantity)}</span>
              </li>
            ))}
            {(order.customItems || []).map((c, idx) => (
              <li key={`c${idx}`} className="cart-line">
                <span className="cart-line-img cart-line-tee">
                  <MiniTee config={c.entries[0].config} />
                </span>
                <div className="cart-line-info">
                  <span className="cart-line-name">{c.title}</span>
                  {c.entries.map((e, j) => (
                    <EntrySummary key={j} entry={e} />
                  ))}
                  {c.discountPct > 0 && <span className="cart-line-meta">Con {c.discountPct}% de descuento</span>}
                </div>
                <span className="cart-line-price">{money(c.total)}</span>
              </li>
            ))}
          </ul>
          <dl className="totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{money(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div>
                <dt>Descuento transferencia</dt>
                <dd>−{money(order.discount)}</dd>
              </div>
            )}
            <div>
              <dt>Envío</dt>
              <dd>{order.shippingCost ? money(order.shippingCost) : "Sin costo"}</dd>
            </div>
            <div className="totals-total">
              <dt>Total</dt>
              <dd>{money(order.total)}</dd>
            </div>
          </dl>
        </section>

        <section className="order-side">
          <h2>Entrega</h2>
          {order.shipping.method === "envio" ? (
            <p>
              Envío a domicilio
              <br />
              {order.shipping.address}
              <br />
              {order.shipping.city}, {order.shipping.province} ({order.shipping.zip})
            </p>
          ) : (
            <p>Retiro sin costo. Te escribimos para coordinar.</p>
          )}
          <TrackingInfo shipping={order.shipping} />
          <h2>Estado</h2>
          <p>{STATUS_LABELS[order.status]}</p>
          <h2>Pago</h2>
          <p>{byTransfer ? "Transferencia bancaria" : "Mercado Pago"}</p>
          <a
            className="btn btn-outline btn-sm"
            href={whatsappFor(`¡Hola! Tengo una consulta sobre mi pedido #${order.number}.`)}
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="whatsapp" size={18} /> Consultar por este pedido
          </a>
        </section>
      </div>
    </div>
  );
}
