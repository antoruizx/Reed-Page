import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import Icon from "./Icon";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/tienda", label: "Tienda" },
  { to: "/tienda?categoria=remeras", label: "Remeras" },
  { to: "/tienda?categoria=buzos", label: "Buzos" },
  { to: "/disena", label: "Diseñá la tuya", accent: true },
  { to: "/revende", label: "Revendé" },
  { to: "/nosotros", label: "Nosotros" },
];

export default function Header() {
  const { count, setOpen } = useCart();
  const { user, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location]);

  const isActive = (to) => {
    const [path, qs] = to.split("?");
    if (location.pathname !== path) return false;
    return (new URLSearchParams(qs).get("categoria") || "") ===
      (new URLSearchParams(location.search).get("categoria") || "");
  };

  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <button
          className="icon-btn menu-toggle"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <Icon name={menuOpen ? "close" : "menu"} />
        </button>

        <Link to="/" className="brand" aria-label="Reed, ir al inicio">
          <img src="/img/brand/reed-r-ink.png" alt="" width="40" height="34" />
          <span>Reed</span>
        </Link>

        <nav className={`main-nav ${menuOpen ? "is-open" : ""}`} aria-label="Principal">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={() => [isActive(l.to) ? "active" : "", l.accent ? "nav-accent" : ""].join(" ").trim()}
              end
            >
              {l.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/admin" className="nav-admin">
              Panel
            </NavLink>
          )}
        </nav>

        <div className="header-actions">
          <Link to={user ? "/cuenta" : "/ingresar"} className="icon-btn" aria-label={user ? "Mi cuenta" : "Iniciar sesión"}>
            <Icon name="user" />
          </Link>
          <button className="icon-btn" onClick={() => setOpen(true)} aria-label={`Abrir carrito, ${count} productos`}>
            <Icon name="bag" />
            {count > 0 && <span className="cart-count">{count}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}
