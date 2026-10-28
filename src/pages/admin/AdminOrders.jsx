import { useState } from "react";
import { useSearchParams } from "react-router";
import { useFetch } from "../../lib/useFetch";
import { api } from "../../lib/api";
import { money, STATUS_LABELS, formatDate } from "../../lib/format";
import { usePageTitle } from "../../components/usePageTitle";
import { ProductionSheet } from "../../components/CustomItem";

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
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);
  const { data, loading, error, reload } = useFetch("/admin/orders", { query: { estado, q: search } }, [estado, search]);

  const changeStatus = async (order, status) => {
    try {
      await api(`/admin/orders/${order.id}`, { method: "PATCH", body: { status } });
      reload();
    } catch (err) {
      window.alert(err.message);
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
              className={`chip ${estado === value ? "active" : ""}`}
              aria-pressed={estado === value}
              onClick={() => setParams(value ? { estado: value } : {})}
            >
              {label}
            </button>
          ))}
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
                        Subtotal {money(o.subtotal)}, envío {money(o.shippingCost)}
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
                    </div>
                    <div>
                      <h3>Pago</h3>
                      <p>
                        {o.payment?.paymentId ? (
                          <>
                            Mercado Pago #{o.payment.paymentId}
                            <br />
                            {o.payment.method} ({o.payment.status})
                          </>
                        ) : (
                          "Todavía no hay pago"
                        )}
                      </p>
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
