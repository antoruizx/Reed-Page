import { Link } from "react-router";
import { useFetch } from "../../lib/useFetch";
import { money } from "../../lib/format";
import { usePageTitle } from "../../components/usePageTitle";

export default function Dashboard() {
  usePageTitle("Panel");
  const { data, loading, error } = useFetch("/admin/stats");

  if (loading) return <div className="spinner" role="status" aria-label="Cargando" />;
  if (error) return <p className="alert alert-error">{error.message}</p>;

  return (
    <>
      <h1 className="admin-title">Resumen</h1>

      {data.toPrepare > 0 && (
        <Link to="/admin/pedidos?estado=pagada" className="admin-callout">
          <strong>
            {data.toPrepare} {data.toPrepare === 1 ? "pedido pago" : "pedidos pagos"} para preparar
          </strong>
          <span>Ver pedidos</span>
        </Link>
      )}

      {data.pendingTransfers > 0 && (
        <Link to="/admin/pedidos?estado=pendiente&pago=transferencia" className="admin-callout">
          <strong>
            {data.pendingTransfers} {data.pendingTransfers === 1 ? "transferencia" : "transferencias"} por confirmar
          </strong>
          <span>Revisar</span>
        </Link>
      )}

      <dl className="stats">
        <div>
          <dt>Ventas de los últimos 30 días</dt>
          <dd>{money(data.salesLast30)}</dd>
        </div>
        <div>
          <dt>Pedidos pagos en 30 días</dt>
          <dd>{data.ordersLast30}</dd>
        </div>
        <div>
          <dt>Productos publicados</dt>
          <dd>{data.products}</dd>
        </div>
        <div>
          <dt>Clientes con cuenta</dt>
          <dd>{data.customers}</dd>
        </div>
      </dl>

      <section className="admin-card">
        <h2>Poco stock</h2>
        {data.lowStock.length === 0 ? (
          <p className="hint">Todo bien: ningún talle tiene 2 unidades o menos.</p>
        ) : (
          <ul className="low-list">
            {data.lowStock.map((p) => (
              <li key={p.id}>
                <Link to={`/admin/productos/${p.id}`}>{p.name}</Link>
                <span className="hint">
                  {p.variants.map((v) => `${v.color} ${v.size}: ${v.stock}`).join(", ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
