import { NavLink, Route, Routes } from "react-router";
import Dashboard from "./Dashboard";
import AdminProducts from "./AdminProducts";
import ProductForm from "./ProductForm";
import AdminOrders from "./AdminOrders";
import AdminCustom from "./AdminCustom";
import AdminShipping from "./AdminShipping";
import "../../styles/admin.css";

export default function Admin() {
  return (
    <div className="admin">
      <aside className="admin-nav" aria-label="Panel">
        <p className="admin-nav-title">Panel de Reed</p>
        <NavLink to="/admin" end>
          Resumen
        </NavLink>
        <NavLink to="/admin/pedidos">Pedidos</NavLink>
        <NavLink to="/admin/productos">Productos</NavLink>
        <NavLink to="/admin/personalizadas">Personalizadas</NavLink>
        <NavLink to="/admin/envios">Envíos y pagos</NavLink>
        <NavLink to="/" className="admin-nav-back">
          Ver la tienda
        </NavLink>
      </aside>
      <div className="admin-main">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="pedidos" element={<AdminOrders />} />
          <Route path="productos" element={<AdminProducts />} />
          <Route path="productos/nuevo" element={<ProductForm />} />
          <Route path="productos/:id" element={<ProductForm />} />
          <Route path="personalizadas" element={<AdminCustom />} />
          <Route path="envios" element={<AdminShipping />} />
        </Routes>
      </div>
    </div>
  );
}
