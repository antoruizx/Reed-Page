import { Link } from "react-router";
import { WHATSAPP_URL } from "./WhatsappButton";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <h2>REED</h2>
          <p>Ropa unisex de calce amplio. Remeras, buzos y accesorios, por unidad o por mayor.</p>
          <div className="pay-logos">
            <img src="/img/pay/mercadopago.png" alt="Mercado Pago" height="28" />
            <img src="/img/pay/visa.svg" alt="Visa" height="20" />
            <img src="/img/pay/mastercard.webp" alt="Mastercard" height="28" />
            <img src="/img/pay/americanexpress.png" alt="American Express" height="28" />
          </div>
        </div>

        <nav aria-label="Tienda">
          <h2>Tienda</h2>
          <Link to="/tienda?categoria=remeras">Remeras</Link>
          <Link to="/tienda?categoria=buzos">Buzos</Link>
          <Link to="/tienda?categoria=pantalones">Pantalones</Link>
          <Link to="/tienda?categoria=conjuntos">Conjuntos</Link>
          <Link to="/tienda?categoria=accesorios">Accesorios</Link>
          <Link to="/tienda">Ver todo</Link>
          <Link to="/disena">Diseñá tu remera</Link>
          <Link to="/revende">Revendé con Reed</Link>
        </nav>

        <nav aria-label="Ayuda">
          <h2>Ayuda</h2>
          <Link to="/nosotros#talles">Guía de talles</Link>
          <Link to="/nosotros#envios">Envíos y cambios</Link>
          <Link to="/contacto">Contacto</Link>
          <Link to="/cuenta">Mis pedidos</Link>
        </nav>

        <nav aria-label="Seguinos">
          <h2>Hablemos</h2>
          <a className="arrow-link" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
            WhatsApp <span aria-hidden="true">↗</span>
          </a>
          <Link className="arrow-link" to="/contacto">
            Formulario de contacto <span aria-hidden="true">↗</span>
          </Link>
        </nav>
      </div>
      <div className="wrap footer-bottom">
        <span>© {new Date().getFullYear()} Reed</span>
        <Link className="arrow-link" to="/nosotros">
          Sobre Reed <span aria-hidden="true">↗</span>
        </Link>
        <a className="arrow-link" href="https://github.com/antoruizx" target="_blank" rel="noreferrer">
          Diseño y desarrollo: Nadia Ruiz <span aria-hidden="true">↗</span>
        </a>
      </div>
    </footer>
  );
}
