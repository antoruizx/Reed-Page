import { useState } from "react";
import { Link } from "react-router";
import { CartLines } from "../components/CartDrawer";
import Icon from "../components/Icon";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useShipping } from "../lib/useShipping";
import { api } from "../lib/api";
import { money } from "../lib/format";
import { rememberOrder } from "../lib/orders";
import { usePageTitle } from "../components/usePageTitle";

const PROVINCES = [
  "Buenos Aires", "CABA", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes", "Entre Ríos",
  "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro",
  "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero",
  "Tierra del Fuego", "Tucumán",
];

function Field({ label, name, error, hint, children, ...input }) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      {children || (
        <input id={name} name={name} className="input" aria-invalid={!!error} aria-describedby={error ? `${name}-err` : undefined} {...input} />
      )}
      {hint && !error && <span className="hint">{hint}</span>}
      {error && (
        <span className="error-text" id={`${name}-err`}>
          {error}
        </span>
      )}
    </div>
  );
}

export default function Checkout() {
  usePageTitle("Finalizar compra");
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const shipping = useShipping();

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    method: "envio",
    address: "",
    city: "",
    province: "",
    zip: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ sending: false, error: null });

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const shippingCost =
    form.method !== "envio" || !shipping ? 0 : subtotal >= shipping.freeFrom ? 0 : shipping.cost;
  const total = subtotal + shippingCost;

  if (items.length === 0) {
    return (
      <div className="wrap page">
        <div className="empty">
          <h1 className="page-title">Tu carrito está vacío.</h1>
          <p>Agregá algo de la tienda para hacer tu pedido.</p>
          <Link to="/tienda" className="btn btn-dark">
            Ir a la tienda
          </Link>
        </div>
      </div>
    );
  }

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Ingresá tu nombre";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Revisá el email";
    if (form.phone.replace(/\D/g, "").length < 8) e.phone = "Ingresá un teléfono con código de área";
    if (form.method === "envio") {
      if (!form.address.trim()) e.address = "Ingresá calle y número";
      if (!form.city.trim()) e.city = "Ingresá la ciudad";
      if (!form.province) e.province = "Elegí la provincia";
      if (!form.zip.trim()) e.zip = "Ingresá el código postal";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) {
      document.querySelector("[aria-invalid='true']")?.focus();
      return;
    }
    setStatus({ sending: true, error: null });
    try {
      const { order, accessKey, checkoutUrl } = await api("/orders", {
        method: "POST",
        body: {
          items: items.map((i) => ({ productId: i.productId, color: i.color, size: i.size, quantity: i.quantity })),
          customer: { name: form.name, email: form.email, phone: form.phone },
          shipping: {
            method: form.method,
            address: form.address,
            city: form.city,
            province: form.province,
            zip: form.zip,
            notes: form.notes,
          },
        },
      });
      rememberOrder(order.id, accessKey);
      clear();
      window.location.assign(checkoutUrl);
    } catch (err) {
      setErrors(err.details && typeof err.details === "object" && !Array.isArray(err.details) ? err.details : {});
      setStatus({ sending: false, error: err.message });
    }
  };

  return (
    <div className="wrap page checkout">
      <h1 className="page-title">Finalizar compra</h1>
      {!user && (
        <p className="page-lead">
          ¿Ya tenés cuenta?{" "}
          <Link to="/ingresar" state={{ from: "/checkout" }} className="link">
            Iniciá sesión
          </Link>{" "}
          para ver tus pedidos después. Si no, comprá igual como invitada/o.
        </p>
      )}

      <form className="checkout-layout" onSubmit={submit} noValidate>
        <div className="checkout-main">
          <section className="checkout-block">
            <h2>Tus datos</h2>
            <div className="form-grid">
              <Field label="Nombre y apellido" name="name" value={form.name} onChange={set} autoComplete="name" error={errors.name} />
              <div className="form-row">
                <Field label="Email" name="email" type="email" value={form.email} onChange={set} autoComplete="email" error={errors.email} hint="Te mandamos el comprobante acá" />
                <Field label="Teléfono" name="phone" type="tel" value={form.phone} onChange={set} autoComplete="tel" placeholder="381 555 1234" error={errors.phone} />
              </div>
            </div>
          </section>

          <section className="checkout-block">
            <h2>Entrega</h2>
            <div className="ship-options" role="radiogroup" aria-label="Forma de entrega">
              <label className={`ship-option ${form.method === "envio" ? "active" : ""}`}>
                <input type="radio" name="method" value="envio" checked={form.method === "envio"} onChange={set} />
                <Icon name="truck" />
                <span>
                  <strong>Envío a domicilio</strong>
                  <span className="hint">
                    {shipping
                      ? subtotal >= shipping.freeFrom
                        ? "Gratis"
                        : `${money(shipping.cost)}, gratis desde ${money(shipping.freeFrom)}`
                      : "A todo el país"}
                  </span>
                </span>
              </label>
              <label className={`ship-option ${form.method === "retiro" ? "active" : ""}`}>
                <input type="radio" name="method" value="retiro" checked={form.method === "retiro"} onChange={set} />
                <Icon name="store" />
                <span>
                  <strong>Retiro sin costo</strong>
                  <span className="hint">San Miguel de Tucumán. Coordinamos por WhatsApp.</span>
                </span>
              </label>
            </div>

            {form.method === "envio" && (
              <div className="form-grid ship-form">
                <Field label="Calle y número" name="address" value={form.address} onChange={set} autoComplete="street-address" error={errors.address} placeholder="Av. Mate de Luna 1234, depto 3B" />
                <div className="form-row">
                  <Field label="Ciudad" name="city" value={form.city} onChange={set} autoComplete="address-level2" error={errors.city} />
                  <Field label="Provincia" name="province" error={errors.province}>
                    <select id="province" name="province" className="select" value={form.province} onChange={set} aria-invalid={!!errors.province}>
                      <option value="">Elegí una</option>
                      {PROVINCES.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Código postal" name="zip" value={form.zip} onChange={set} autoComplete="postal-code" inputMode="numeric" error={errors.zip} />
                </div>
                <Field label="Indicaciones (opcional)" name="notes" value={form.notes} onChange={set} placeholder="Timbre, horario, entre calles…" />
              </div>
            )}
          </section>
        </div>

        <aside className="checkout-summary" aria-label="Resumen del pedido">
          <h2>Tu pedido</h2>
          <CartLines editable={false} />
          <dl className="totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{money(subtotal)}</dd>
            </div>
            <div>
              <dt>Envío</dt>
              <dd>{form.method === "retiro" ? "Sin costo" : shippingCost === 0 ? "Gratis" : money(shippingCost)}</dd>
            </div>
            <div className="totals-total">
              <dt>Total</dt>
              <dd>{money(total)}</dd>
            </div>
          </dl>

          {status.error && (
            <p className="alert alert-error" role="alert">
              {status.error}
            </p>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={status.sending}>
            {status.sending ? "Conectando con Mercado Pago…" : `Pagar ${money(total)} con Mercado Pago`}
          </button>
          <p className="hint secure-note">
            Vas a pagar en el sitio de Mercado Pago con tarjeta, débito, dinero en cuenta o efectivo.
            Nosotros nunca vemos los datos de tu tarjeta.
          </p>
          <Link to="/tienda" className="link small">
            Seguir comprando
          </Link>
        </aside>
      </form>
    </div>
  );
}
