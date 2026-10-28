import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useFetch } from "../lib/useFetch";
import { MiniTee } from "../components/CustomItem";
import { money, STATUS_LABELS, formatDate } from "../lib/format";
import { usePageTitle } from "../components/usePageTitle";

export default function Account() {
  usePageTitle("Mi cuenta");
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error } = useFetch("/orders/mine");

  return (
    <div className="wrap page account">
      <header className="account-head">
        <div>
          <h1 className="page-title">Hola, {user.name.split(" ")[0]}</h1>
          <p className="page-lead">{user.email}</p>
        </div>
        <div className="account-actions">
          {isAdmin && (
            <Link to="/admin" className="btn btn-dark btn-sm">
              Ir al panel
            </Link>
          )}
          <button
            className="btn btn-outline btn-sm"
            onClick={() => {
              logout();
              navigate("/");
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <section>
        <h2 className="section-title">Mis pedidos</h2>
        {loading ? (
          <div className="spinner" role="status" aria-label="Cargando pedidos" />
        ) : error ? (
          <p className="alert alert-error">{error.message}</p>
        ) : data.orders.length === 0 ? (
          <div className="empty">
            <p>Todavía no hiciste pedidos con esta cuenta.</p>
            <Link to="/tienda" className="btn btn-dark">
              Ir a la tienda
            </Link>
          </div>
        ) : (
          <ul className="order-list">
            {data.orders.map((o) => (
              <li key={o.id}>
                <Link to={`/pedido/${o.id}`} className="order-row">
                  <span className="order-row-thumbs" aria-hidden="true">
                    {o.items.slice(0, 3).map((i) => (
                      <img key={`${i.product}${i.color}${i.size}`} src={i.image} alt="" width="48" height="60" />
                    ))}
                    {(o.customItems || []).slice(0, 2).map((c, idx) => (
                      <span key={idx} className="order-row-tee">
                        <MiniTee config={c.entries[0].config} />
                      </span>
                    ))}
                  </span>
                  <span className="order-row-main">
                    <strong>Pedido #{o.number}</strong>
                    <span className="hint">
                      {formatDate(o.createdAt)},{" "}
                      {o.items.reduce((s, i) => s + i.quantity, 0) + (o.customItems || []).reduce((s, c) => s + c.quantity, 0)} prendas
                    </span>
                  </span>
                  <span className={`status status-${o.status}`}>{STATUS_LABELS[o.status]}</span>
                  <strong className="order-row-total">{money(o.total)}</strong>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
