import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { invalidateShipping } from "../../lib/useShipping";
import { money } from "../../lib/format";
import { usePageTitle } from "../../components/usePageTitle";
import { PROVINCES } from "../../../shared/store.js";

function MoneyField({ label, value, onChange, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input className="input" type="number" min="0" step="100" value={value} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} />
      {hint && <span className="hint">{hint}</span>}
    </label>
  );
}

export default function AdminShipping() {
  usePageTitle("Envíos y pagos");
  const [store, setStore] = useState(null);
  const [state, setState] = useState({ saving: false, message: null, error: null });

  useEffect(() => {
    api("/admin/store")
      .then(({ store }) => setStore(store))
      .catch((error) => setState((s) => ({ ...s, error: error.message })));
  }, []);

  if (!store) return state.error ? <p className="alert alert-error">{state.error}</p> : <div className="spinner" role="status" aria-label="Cargando" />;

  const zones = store.shipping.zones;
  const setShipping = (patch) => setStore((s) => ({ ...s, shipping: { ...s.shipping, ...patch } }));
  const setZone = (i, patch) => setShipping({ zones: zones.map((z, j) => (j === i ? { ...z, ...patch } : z)) });
  const setTransfer = (patch) => setStore((s) => ({ ...s, transfer: { ...s.transfer, ...patch } }));
  const setPickup = (patch) => setStore((s) => ({ ...s, pickup: { ...s.pickup, ...patch } }));

  // Cada provincia puede estar en una sola zona: al sumarla a una, se saca de las otras
  const toggleProvince = (i, province) => {
    const has = zones[i].provinces.includes(province);
    setShipping({
      zones: zones.map((z, j) => {
        if (j === i) return { ...z, provinces: has ? z.provinces.filter((p) => p !== province) : [...z.provinces, province] };
        return has ? z : { ...z, provinces: z.provinces.filter((p) => p !== province) };
      }),
    });
  };
  const assigned = new Set(zones.flatMap((z) => z.provinces));
  const unassigned = PROVINCES.filter((p) => !assigned.has(p));

  const save = async () => {
    setState({ saving: true, message: null, error: null });
    try {
      const { store: saved } = await api("/admin/store", { method: "PUT", body: { store } });
      setStore(saved);
      invalidateShipping();
      setState({ saving: false, message: "Cambios guardados. Ya se aplican en el checkout.", error: null });
    } catch (err) {
      setState({ saving: false, message: null, error: err.message });
    }
  };

  return (
    <div className="admin-custom">
      <div className="admin-head">
        <div>
          <h1 className="admin-title">Envíos y pagos</h1>
          <p className="hint">Costo de envío por zona, retiro en persona y pago por transferencia.</p>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={state.saving}>
          {state.saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
      {state.message && <p className="alert alert-ok" role="status">{state.message}</p>}
      {state.error && <p className="alert alert-error" role="alert">{state.error}</p>}

      <section className="admin-card">
        <h2>Zonas de envío</h2>
        <p className="hint">
          Cada provincia va en una sola zona. Las que no estén en ninguna usan el precio de "Resto del país". Si el pedido supera el
          mínimo, el envío es gratis (0 = nunca gratis).
        </p>
        <div className="zones-admin">
          {zones.map((z, i) => (
            <div key={z.id} className="zone-admin form-grid">
              <div className="form-row zone-head">
                <label className="field">
                  <span>Nombre de la zona</span>
                  <input className="input" value={z.name} onChange={(e) => setZone(i, { name: e.target.value })} />
                </label>
                <MoneyField label="Costo de envío" value={z.cost} onChange={(v) => setZone(i, { cost: v })} />
                <MoneyField label="Gratis desde" value={z.freeFrom} onChange={(v) => setZone(i, { freeFrom: v })} hint={z.freeFrom ? money(z.freeFrom) : "Nunca gratis"} />
              </div>
              <div className="zone-provinces">
                <span className="hint">Provincias de esta zona:</span>
                {z.provinces.length === 0 && <span className="hint zone-empty">Ninguna todavía</span>}
                <div className="chips">
                  {z.provinces.map((p) => (
                    <button key={p} type="button" className="chip chip-sm active" onClick={() => toggleProvince(i, p)} aria-label={`Quitar ${p} de ${z.name}`}>
                      {p} ✕
                    </button>
                  ))}
                </div>
                <select
                  className="select zone-add"
                  value=""
                  aria-label={`Agregar provincia a ${z.name}`}
                  onChange={(e) => e.target.value && toggleProvince(i, e.target.value)}
                >
                  <option value="">+ Agregar provincia</option>
                  {PROVINCES.filter((p) => !z.provinces.includes(p)).map((p) => {
                    const from = zones.find((other) => other.provinces.includes(p));
                    return (
                      <option key={p} value={p}>
                        {p}
                        {from ? ` (se saca de ${from.name})` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-danger zone-remove"
                onClick={() => setShipping({ zones: zones.filter((_, j) => j !== i) })}
              >
                Quitar zona
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() =>
            setShipping({ zones: [...zones, { id: `zona-${Date.now()}`, name: "Nueva zona", provinces: [], cost: 8000, freeFrom: 90000 }] })
          }
        >
          Agregar zona
        </button>

        <h3 className="zone-other-title">Resto del país</h3>
        <p className="hint">
          {unassigned.length
            ? `Se usa para: ${unassigned.join(", ")}.`
            : "Todas las provincias tienen zona. Esto solo se usaría si agregás una nueva."}
        </p>
        <div className="form-row zone-head">
          <MoneyField label="Costo de envío" value={store.shipping.otherCost} onChange={(v) => setShipping({ otherCost: v })} />
          <MoneyField label="Gratis desde" value={store.shipping.otherFreeFrom} onChange={(v) => setShipping({ otherFreeFrom: v })} />
        </div>
      </section>

      <section className="admin-card form-grid">
        <h2>Retiro en persona</h2>
        <label className="check">
          <input type="checkbox" checked={store.pickup.enabled} onChange={(e) => setPickup({ enabled: e.target.checked })} /> Ofrecer retiro sin costo
        </label>
        <label className="field">
          <span>Texto que ve el cliente</span>
          <input className="input" value={store.pickup.text} onChange={(e) => setPickup({ text: e.target.value })} />
        </label>
      </section>

      <section className="admin-card form-grid">
        <h2>Transferencia bancaria</h2>
        <p className="hint">
          El cliente ve el alias y el CBU recién después de confirmar el pedido. El pedido queda "Esperando el pago" hasta que vos confirmes
          que te llegó la plata (ahí se descuenta el stock).
        </p>
        <label className="check">
          <input type="checkbox" checked={store.transfer.enabled} onChange={(e) => setTransfer({ enabled: e.target.checked })} /> Aceptar transferencias
        </label>
        <div className="form-row">
          <label className="field">
            <span>Descuento (%)</span>
            <input className="input" type="number" min="0" max="50" value={store.transfer.discountPct} onChange={(e) => setTransfer({ discountPct: e.target.value === "" ? "" : Number(e.target.value) })} />
            <span className="hint">Sobre los productos, no sobre el envío</span>
          </label>
          <label className="field">
            <span>Alias</span>
            <input className="input" value={store.transfer.alias} onChange={(e) => setTransfer({ alias: e.target.value })} placeholder="reed.tienda.mp" />
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            <span>CBU / CVU</span>
            <input className="input" inputMode="numeric" value={store.transfer.cbu} onChange={(e) => setTransfer({ cbu: e.target.value })} placeholder="22 números" />
          </label>
          <label className="field">
            <span>Titular</span>
            <input className="input" value={store.transfer.holder} onChange={(e) => setTransfer({ holder: e.target.value })} />
          </label>
          <label className="field">
            <span>Banco o billetera</span>
            <input className="input" value={store.transfer.bank} onChange={(e) => setTransfer({ bank: e.target.value })} placeholder="Mercado Pago, Galicia…" />
          </label>
        </div>
      </section>
    </div>
  );
}
