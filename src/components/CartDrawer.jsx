import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import Icon from "./Icon";
import { isCustomLine, useCart } from "../context/CartContext";
import { EntrySummary, MiniTee, entriesOf } from "./CustomItem";
import { useShipping } from "../lib/useShipping";
import { money } from "../lib/format";

export function QuantityStepper({ value, max, onChange, label }) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(value - 1)} aria-label="Restar uno">
        <Icon name="minus" size={16} />
      </button>
      <span aria-live="polite">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={max !== undefined && value >= max}
        aria-label="Sumar uno"
      >
        <Icon name="plus" size={16} />
      </button>
    </div>
  );
}

function CustomCartLine({ line, editable, onRemove }) {
  const { setOpen } = useCart();
  const entries = entriesOf(line);
  return (
    <li className="cart-line">
      <span className="cart-line-img cart-line-tee">
        <MiniTee config={entries[0].config} />
      </span>
      <div className="cart-line-info">
        <span className="cart-line-name">{line.title}</span>
        {line.type === "pack" && (
          <span className="cart-line-meta">
            {line.units} remeras, {entries.length} {entries.length === 1 ? "diseño" : "diseños"}
          </span>
        )}
        {entries.map((e, idx) => (
          <EntrySummary key={idx} entry={e} />
        ))}
        {editable && (
          <div className="cart-line-actions">
            {line.type === "custom" && (
              <Link to={`/disena?editar=${line.id}`} className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
                Editar
              </Link>
            )}
            <button className="icon-btn" onClick={onRemove} aria-label={`Quitar ${line.title}`}>
              <Icon name="trash" size={18} />
            </button>
          </div>
        )}
      </div>
      <span className="cart-line-price">{money(line.total)}</span>
    </li>
  );
}

export function CartLines({ editable = true }) {
  const { items, setQuantity, remove, lineId } = useCart();
  return (
    <ul className="cart-lines">
      {items.map((i) =>
        isCustomLine(i) ? (
          <CustomCartLine key={lineId(i)} line={i} editable={editable} onRemove={() => remove(i)} />
        ) : (
        <li key={lineId(i)} className="cart-line">
          <Link to={`/producto/${i.slug}`} className="cart-line-img">
            <img src={i.image} alt="" width="80" height="100" />
          </Link>
          <div className="cart-line-info">
            <Link to={`/producto/${i.slug}`} className="cart-line-name">
              {i.name}
            </Link>
            <span className="cart-line-meta">
              {i.color} / {i.size}
              {!editable && ` / ${i.quantity} u.`}
            </span>
            {editable && (
              <div className="cart-line-actions">
                <QuantityStepper
                  value={i.quantity}
                  max={i.maxStock}
                  onChange={(q) => setQuantity(i, q)}
                  label={`Cantidad de ${i.name}`}
                />
                <button className="icon-btn" onClick={() => remove(i)} aria-label={`Quitar ${i.name}`}>
                  <Icon name="trash" size={18} />
                </button>
              </div>
            )}
          </div>
          <span className="cart-line-price">{money(i.price * i.quantity)}</span>
        </li>
        )
      )}
    </ul>
  );
}

export default function CartDrawer() {
  const { items, subtotal, open, setOpen } = useCart();
  const shipping = useShipping();
  const navigate = useNavigate();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  const missingForFree = shipping ? shipping.freeFrom - subtotal : 0;

  return (
    <div className={`drawer ${open ? "is-open" : ""}`} aria-hidden={!open}>
      <div className="drawer-backdrop" onClick={() => setOpen(false)} />
      <aside
        className="drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        tabIndex={-1}
        ref={panelRef}
        inert={!open}
      >
        <div className="drawer-head">
          <h2 id="cart-title">Tu carrito</h2>
          <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Cerrar carrito">
            <Icon name="close" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="drawer-empty">
            <p>Todavía no agregaste nada.</p>
            <Link to="/tienda" className="btn btn-dark" onClick={() => setOpen(false)}>
              Ir a la tienda
            </Link>
          </div>
        ) : (
          <>
            {shipping && (
              <p className="free-ship">
                {missingForFree > 0 ? (
                  <>
                    Te faltan <strong>{money(missingForFree)}</strong> para el envío gratis
                  </>
                ) : (
                  <>Tenés envío gratis</>
                )}
                <span
                  className="free-ship-bar"
                  style={{ "--p": Math.min(1, subtotal / shipping.freeFrom) }}
                />
              </p>
            )}
            <div className="drawer-body">
              <CartLines />
            </div>
            <div className="drawer-foot">
              <div className="row-between">
                <span>Subtotal</span>
                <strong>{money(subtotal)}</strong>
              </div>
              <p className="hint">El envío se calcula en el próximo paso.</p>
              <button
                className="btn btn-primary btn-block"
                onClick={() => {
                  setOpen(false);
                  navigate("/checkout");
                }}
              >
                Finalizar compra
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
