import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import Icon from "./Icon";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/tienda", label: "Tienda" },
  { to: "/tienda?categoria=remeras", label: "Remeras" },
  { to: "/tienda?categoria=buzos", label: "Buzos" },
  { to: "/tienda?categoria=conjuntos", label: "Conjuntos" },
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

  // Sobre una sección marcada con data-header-dark (la portada negra) el menú
  // es transparente con letras blancas; al pasarla vuelve a ser el claro.
  // La línea de abajo del menú solo aparece cuando se bajó la página.
  const [overDark, setOverDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => {
      const el = document.querySelector("[data-header-dark]");
      const headerH = document.querySelector(".site-header")?.offsetHeight || 72;
      setOverDark(Boolean(el) && el.getBoundingClientRect().bottom > headerH);
      setScrolled(window.scrollY > 0);
    };
    update();
    const late = setTimeout(update, 100); // por si la página termina de cargar después
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      clearTimeout(late);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [location.pathname]);

  const isActive = (to) => {
    const [path, qs] = to.split("?");
    if (location.pathname !== path) return false;
    return (new URLSearchParams(qs).get("categoria") || "") ===
      (new URLSearchParams(location.search).get("categoria") || "");
  };

  return (
    <header
      className={`site-header ${overDark && !menuOpen ? "is-dark" : ""} ${scrolled && !overDark ? "is-scrolled" : ""}`}
    >
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
          <img src="/img/brand/reed-r-ink.png" alt="" width="26" height="22" />
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
          <Link
            to={user ? "/cuenta" : "/ingresar"}
            className="header-action"
            aria-label={user ? "Mi cuenta" : "Iniciar sesión"}
          >
            <Icon name="user" size={18} />
            <span className="header-action-label">{user ? "Cuenta" : "Ingresar"}</span>
          </Link>
          <button
            className="header-action"
            onClick={() => setOpen(true)}
            aria-label={`Abrir carrito, ${count} productos`}
          >
            <Icon name="bag" size={18} />
            <span className="header-action-label">Carrito ({count})</span>
            {count > 0 && <span className="cart-count">{count}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}
