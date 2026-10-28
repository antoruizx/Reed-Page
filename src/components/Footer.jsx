import { Link } from "react-router";
import Icon from "./Icon";
import { WHATSAPP_URL } from "./WhatsappButton";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <img src="/img/brand/reed-r-white.png" alt="Reed" width="72" height="62" />
          <p>Ropa unisex de calce amplio. Remeras, buzos y accesorios, por unidad o por mayor.</p>
        </div>

        <nav aria-label="Tienda">
          <h2>Tienda</h2>
          <Link to="/tienda?categoria=remeras">Remeras</Link>
          <Link to="/tienda?categoria=buzos">Buzos</Link>
          <Link to="/tienda?categoria=accesorios">Accesorios</Link>
          <Link to="/tienda">Ver todo</Link>
        </nav>

        <nav aria-label="Ayuda">
          <h2>Ayuda</h2>
          <Link to="/nosotros#talles">Guía de talles</Link>
          <Link to="/nosotros#envios">Envíos y cambios</Link>
          <Link to="/contacto">Contacto</Link>
          <Link to="/cuenta">Mis pedidos</Link>
        </nav>

        <div>
          <h2>Pagá como quieras</h2>
          <div className="pay-logos">
            <img src="/img/pay/mercadopago.png" alt="Mercado Pago" height="28" />
            <img src="/img/pay/visa.svg" alt="Visa" height="20" />
            <img src="/img/pay/mastercard.webp" alt="Mastercard" height="28" />
            <img src="/img/pay/americanexpress.png" alt="American Express" height="28" />
          </div>
          <a className="footer-wa" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
            <Icon name="whatsapp" size={20} /> Escribinos por WhatsApp
          </a>
        </div>
      </div>
      <div className="wrap footer-bottom">
        <span>© {new Date().getFullYear()} Reed</span>
        <span>
          Diseño y desarrollo:{" "}
          <a href="https://github.com/antoruizx" target="_blank" rel="noreferrer">
            Nadia Ruiz
          </a>
        </span>
      </div>
    </footer>
  );
}
