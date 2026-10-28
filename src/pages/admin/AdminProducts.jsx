import { useState } from "react";
import { Link } from "react-router";
import { useFetch } from "../../lib/useFetch";
import { api } from "../../lib/api";
import { CATEGORY_LABELS, money } from "../../lib/format";
import { usePageTitle } from "../../components/usePageTitle";

export default function AdminProducts() {
  usePageTitle("Productos");
  const { data, loading, error, reload } = useFetch("/admin/products");
  const [message, setMessage] = useState(null);
  const [filter, setFilter] = useState("");

  const remove = async (p) => {
    if (!window.confirm(`¿Borrar "${p.name}"? Si ya se vendió, se oculta de la tienda en vez de borrarse.`)) return;
    try {
      const res = await api(`/admin/products/${p.id}`, { method: "DELETE" });
      setMessage(res.archived ? `"${p.name}" ya tenía ventas: quedó oculto de la tienda.` : `"${p.name}" borrado.`);
      reload();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const products = (data?.products || []).filter((p) =>
    p.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <>
      <div className="admin-head">
        <h1 className="admin-title">Productos</h1>
        <Link to="/admin/productos/nuevo" className="btn btn-primary">
          Nuevo producto
        </Link>
      </div>

      {message && (
        <p className="alert alert-info" role="status">
          {message}
        </p>
      )}

      <input
        className="input admin-search"
        type="search"
        placeholder="Buscar por nombre"
        aria-label="Buscar productos"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      {loading ? (
        <div className="spinner" role="status" aria-label="Cargando" />
      ) : error ? (
        <p className="alert alert-error">{error.message}</p>
      ) : products.length === 0 ? (
        <div className="empty">
          <p>{filter ? "No hay productos con ese nombre." : "Todavía no cargaste productos."}</p>
          {!filter && (
            <Link to="/admin/productos/nuevo" className="btn btn-dark">
              Cargar el primero
            </Link>
          )}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Producto</th>
                <th scope="col">Categoría</th>
                <th scope="col">Precio</th>
                <th scope="col">Stock</th>
                <th scope="col">Estado</th>
                <th scope="col">
                  <span className="visually-hidden">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link to={`/admin/productos/${p.id}`} className="admin-product-cell">
                      <img src={p.images[0]} alt="" width="40" height="50" />
                      <span>
                        <strong>{p.name}</strong>
                        {p.featured && <span className="hint"> Destacado</span>}
                      </span>
                    </Link>
                  </td>
                  <td>{CATEGORY_LABELS[p.category]}</td>
                  <td className="num">{money(p.price)}</td>
                  <td className={`num ${p.totalStock === 0 ? "text-error" : ""}`}>{p.totalStock}</td>
                  <td>
                    <span className={`status ${p.active ? "status-pagada" : ""}`}>
                      {p.active ? "Publicado" : "Oculto"}
                    </span>
                  </td>
                  <td className="row-actions">
                    <Link to={`/admin/productos/${p.id}`} className="btn btn-ghost btn-sm">
                      Editar
                    </Link>
                    <button className="btn btn-ghost btn-sm btn-danger" onClick={() => remove(p)}>
                      Borrar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
