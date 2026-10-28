import { Link } from "react-router";
import { usePageTitle } from "../components/usePageTitle";

export default function NotFound({ message }) {
  usePageTitle("Página no encontrada");
  return (
    <div className="wrap page not-found">
      <img src="/img/brand/reed-r-ink.png" alt="" width="140" height="120" />
      <h1 className="page-title">{message || "Esta página no existe."}</h1>
      <p className="page-lead">Puede que el link esté mal escrito o que el producto ya no esté a la venta.</p>
      <Link to="/tienda" className="btn btn-dark">
        Ir a la tienda
      </Link>
    </div>
  );
}
