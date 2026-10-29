import { useState } from "react";
import { useSearchParams } from "react-router";
import { useFetch } from "../../lib/useFetch";
import { api } from "../../lib/api";
import { money, STATUS_LABELS, formatDate } from "../../lib/format";
import { usePageTitle } from "../../components/usePageTitle";
import { ProductionSheet } from "../../components/CustomItem";
import { CARRIERS } from "../../../shared/store.js";

// Formulario para cargar el correo y el código de seguimiento
function TrackingForm({ order, onSave }) {
  const [form, setForm] = useState({
    carrier: order.shipping.carrier || "correo",
    code: order.shipping.tracking || "",
    url: order.shipping.trackingUrl || "",
  });
  const [saving, setSaving] = useState(false);
  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ tracking: form });
    setSaving(false);
  };
  return (
    <form className="tracking-form" onSubmit={submit}>
      <h3>Seguimiento</h3>
      <div className="form-row">
        <label className="field">
          <span>Correo</span>
          <select className="select" name="carrier" value={form.carrier} onChange={set}>
            {CARRIERS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Código</span>
          <input className="input" name="code" value={form.code} onChange={set} placeholder="Ej. 360002123456789" />
        </label>
      </div>
      <label className="field">
        <span>Link de seguimiento (opcional)</span>
        <input className="input" name="url" type="url" value={form.url} onChange={set} placeholder="https://…" />
      </label>
      <button className="btn btn-dark btn-sm" disabled={saving}>
        {saving ? "Guardando…" : order.shipping.tracking ? "Actualizar seguimiento" : "Guardar y marcar como enviado"}
      </button>
    </form>
  );
}

const FILTERS = [
  ["", "Todos"],
  ["pagada", "Para preparar"],
  ["preparando", "Preparando"],
  ["enviada", "Enviados"],
  ["pendiente", "Sin pagar"],
];

// Pasos normales de un pedido una vez pagado
const NEXT = { pagada: "preparando", preparando: "enviada", enviada: "entregada" };
const NEXT_LABEL = { pagada: "Empezar a preparar", preparando: "Marcar como enviado", enviada: "Marcar como entregado" };

// Link para escribirle al cliente por WhatsApp (agrega el 549 si falta)
function waCustomer(o) {
  let phone = o.customer.phone.replace(/\D/g, "").replace(/^0/, "");
  if (!phone.startsWith("54")) phone = `549${phone}`;
  const text = `¡Hola ${o.customer.name.split(" ")[0]}! Te escribimos de Reed por tu pedido #${o.number}.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export default function AdminOrders() {
  usePageTitle("Pedidos");
  const [params, setParams] = useSearchParams();
  const estado = params.get("estado") || "";
  const pago = params.get("pago") || "";
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);
  const { data, loading, error, reload } = useFetch("/admin/orders", { query: { estado, pago, q: search } }, [estado, pago, search]);

  const patchOrder = async (order, body) => {
    try {
      await api(`/admin/orders/${order.id}`, { method: "PATCH", body });
      reload();
    } catch (err) {
      window.alert(err.message);
    }
  };
  const changeStatus = (order, status) => patchOrder(order, { status });
  const confirmTransfer = (order) => {
    if (window.confirm(`¿Confirmás que recibiste ${money(order.total)} del pedido #${order.number}? Se descuenta el stock.`)) {
      patchOrder(order, { confirmTransfer: true });
    }
  };

  return (
    <>
      <h1 className="admin-title">Pedidos</h1>

      <div className="admin-filters">
        <div className="chips" role="group" aria-label="Filtrar por estado">
          {FILTERS.map(([value, label]) => (
            <button
              key={value}
              className={`chip ${estado === value && !pago ? "active" : ""}`}
              aria-pressed={estado === value && !pago}
              onClick={() => setParams(value ? { estado: value } : {})}
            >
              {label}
            </button>
          ))}
          <button
            className={`chip ${pago ? "active" : ""}`}
            aria-pressed={Boolean(pago)}
            onClick={() => setParams({ estado: "pendiente", pago: "transferencia" })}
          >
            Transferencias por confirmar
          </button>
        </div>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(q.trim());
          }}
        >
          <input className="input admin-search" type="search" placeholder="Número, nombre o email" aria-label="Buscar pedidos" value={q} onChange={(e) => setQ(e.target.value)} />
        </form>
      </div>

      {loading ? (
        <div className="spinner" role="status" aria-label="Cargando" />
      ) : error ? (
        <p className="alert alert-error">{error.message}</p>
      ) : data.orders.length === 0 ? (
        <p className="empty">No hay pedidos {estado ? `en "${FILTERS.find((f) => f[0] === estado)?.[1]}"` : "todavía"}.</p>
      ) : (
        <ul className="admin-orders">
          {data.orders.map((o) => {
            const open = openId === o.id;
            return (
              <li key={o.id} className={`admin-order ${open ? "is-open" : ""}`}>
                <button className="admin-order-row" onClick={() => setOpenId(open ? null : o.id)} aria-expanded={open}>
                  <strong>#{o.number}</strong>
                  <span>
                    {o.customer.name}
                    <span className="hint"> {formatDate(o.createdAt)}</span>
                  </span>
                  <span className={`status status-${o.status}`}>{STATUS_LABELS[o.status]}</span>
                  <strong className="num">{money(o.total)}</strong>
                </button>

                {open && (
                  <div className="admin-order-detail">
                    <div>
                      <h3>Productos</h3>
                      <ul>
                        {o.items.map((i) => (
                          <li key={`${i.product}${i.color}${i.size}`}>
                            {i.quantity} × {i.name}, {i.color}, talle {i.size}
                            <span className="hint"> ({money(i.price * i.quantity)})</span>
                          </li>
                        ))}
                      </ul>
                      {(o.customItems || []).map((c, idx) => (
                        <div key={idx} className="production-item">
                          <h4>
                            {c.title}: {c.quantity} remeras, {money(c.total)}
                            {c.discountPct > 0 && ` (−${c.discountPct}%)`}
                          </h4>
                          {c.entries.map((e, j) => (
                            <ProductionSheet key={j} entry={e} />
                          ))}
                        </div>
                      ))}
                      <p className="hint">
                        Subtotal {money(o.subtotal)}
                        {o.discount > 0 && `, descuento −${money(o.discount)}`}, envío {money(o.shippingCost)}
                        {o.shipping.zone && ` (${o.shipping.zone})`}
                      </p>
                    </div>
                    <div>
                      <h3>Cliente</h3>
                      <p>
                        {o.customer.name}
                        <br />
                        <a href={`mailto:${o.customer.email}`}>{o.customer.email}</a>
                        <br />
                        <a href={waCustomer(o)} target="_blank" rel="noreferrer">
                          {o.customer.phone}
                        </a>
                      </p>
                      <h3>Entrega</h3>
                      {o.shipping.method === "envio" ? (
                        <p>
                          {o.shipping.address}
                          <br />
                          {o.shipping.city}, {o.shipping.province} ({o.shipping.zip})
                          {o.shipping.notes && (
                            <>
                              <br />
                              <em>{o.shipping.notes}</em>
                            </>
                          )}
                        </p>
                      ) : (
                        <p>Retira en persona</p>
                      )}
                      {o.shipping.method === "envio" && !["pendiente", "rechazada", "cancelada"].includes(o.status) && (
                        <TrackingForm key={o.shipping.tracking || "nuevo"} order={o} onSave={(body) => patchOrder(o, body)} />
                      )}
                    </div>
                    <div>
                      <h3>Pago</h3>
                      <p>
                        {o.payment?.provider === "transferencia" ? (
                          o.payment.status === "approved" ? (
                            <>Transferencia recibida el {formatDate(o.payment.paidAt)}</>
                          ) : (
                            "Transferencia: todavía no la confirmaste"
                          )
                        ) : o.payment?.paymentId ? (
                          <>
                            Mercado Pago #{o.payment.paymentId}
                            <br />
                            {o.payment.method} ({o.payment.status})
                          </>
                        ) : (
                          "Todavía no hay pago"
                        )}
                      </p>
                      {o.payment?.provider === "transferencia" && o.status === "pendiente" && (
                        <button className="btn btn-primary btn-sm" onClick={() => confirmTransfer(o)}>
                          Confirmar transferencia recibida
                        </button>
                      )}
                      <div className="admin-order-actions">
                        {NEXT[o.status] && (
                          <button className="btn btn-dark btn-sm" onClick={() => changeStatus(o, NEXT[o.status])}>
                            {NEXT_LABEL[o.status]}
                          </button>
                        )}
                        <label>
                          <span className="visually-hidden">Cambiar estado</span>
                          <select className="select" value={o.status} onChange={(e) => changeStatus(o, e.target.value)}>
                            {Object.entries(STATUS_LABELS).map(([v, l]) => (
                              <option key={v} value={v}>
                                {l}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
