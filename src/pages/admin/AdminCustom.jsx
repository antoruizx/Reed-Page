import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import { invalidateCustomConfig } from "../../lib/useCustomConfig";
import { uploadDesign } from "../../lib/designFiles";
import { money } from "../../lib/format";
import { usePageTitle } from "../../components/usePageTitle";
import TeeMockup from "../../components/TeeMockup";

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

function NumberField({ label, value, onChange, hint, step = 100, min = 0 }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input className="input" type="number" min={min} step={step} value={value} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} />
      {hint && <span className="hint">{hint}</span>}
    </label>
  );
}

export default function AdminCustom() {
  usePageTitle("Personalizadas");
  const [settings, setSettings] = useState(null);
  const [designs, setDesigns] = useState([]);
  const [state, setState] = useState({ saving: false, message: null, error: null });
  const [upload, setUpload] = useState({ busy: false, status: "", error: null });
  const fileRef = useRef(null);

  useEffect(() => {
    api("/admin/settings").then(({ settings }) => setSettings(settings)).catch((error) => setState((s) => ({ ...s, error: error.message })));
    api("/admin/designs").then(({ designs }) => setDesigns(designs)).catch(() => {});
  }, []);

  if (!settings) return state.error ? <p className="alert alert-error">{state.error}</p> : <div className="spinner" role="status" aria-label="Cargando" />;

  const update = (key, value) => setSettings((s) => ({ ...s, [key]: value }));
  const updateList = (key, i, patch) => update(key, settings[key].map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const removeFrom = (key, i) => update(key, settings[key].filter((_, j) => j !== i));

  const save = async () => {
    setState({ saving: true, message: null, error: null });
    try {
      const { settings: saved } = await api("/admin/settings", { method: "PUT", body: { settings } });
      setSettings(saved);
      invalidateCustomConfig();
      setState({ saving: false, message: "Cambios guardados. Ya se ven en el diseñador.", error: null });
    } catch (err) {
      setState({ saving: false, message: null, error: err.message });
    }
  };

  const addCatalogDesign = async (file) => {
    if (!file) return;
    setUpload({ busy: true, status: "Subiendo…", error: null });
    try {
      const d = await uploadDesign(file, { onStatus: (status) => setUpload((u) => ({ ...u, status })) });
      const { design } = await api(`/admin/designs/${d.id}/catalog`, { method: "POST", body: { name: d.name } });
      setDesigns((list) => [...list, design]);
      invalidateCustomConfig();
      setUpload({ busy: false, status: "", error: null });
    } catch (err) {
      setUpload({ busy: false, status: "", error: err.message });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const patchDesign = async (d, patch) => {
    const { design } = await api(`/admin/designs/${d.id}`, { method: "PATCH", body: patch });
    setDesigns((list) => list.map((x) => (x.id === d.id ? design : x)));
    invalidateCustomConfig();
  };

  const firstColor = settings.colors[0]?.hex || "#ffffff";

  return (
    <div className="admin-custom">
      <div className="admin-head">
        <div>
          <h1 className="admin-title">Personalizadas</h1>
          <p className="hint">Precios, modelos, colores, descuentos y packs del diseñador de remeras.</p>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={state.saving}>
          {state.saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
      {state.message && <p className="alert alert-ok" role="status">{state.message}</p>}
      {state.error && <p className="alert alert-error" role="alert">{state.error}</p>}

      <section className="admin-card form-grid">
        <h2>General</h2>
        <div className="form-row">
          <label className="field">
            <span>Tiempo de producción</span>
            <input className="input" value={settings.productionDays} onChange={(e) => update("productionDays", e.target.value)} />
            <span className="hint">Se muestra en el diseñador y en los packs</span>
          </label>
          <NumberField label="Recargo talles XXL y XXXL" value={settings.bigSizeSurcharge} onChange={(v) => update("bigSizeSurcharge", v)} hint="Por remera" />
        </div>
      </section>

      <section className="admin-card">
        <h2>Modelos de remera</h2>
        <div className="garments-admin">
          {settings.garments.map((g, i) => (
            <div key={g.id} className={`garment-admin ${g.active === false ? "is-off" : ""}`}>
              <TeeMockup garment={g} color={firstColor} label="" />
              <div className="form-grid">
                <div className="form-row">
                  <label className="field">
                    <span>Nombre</span>
                    <input className="input" value={g.name} onChange={(e) => updateList("garments", i, { name: e.target.value })} />
                  </label>
                  <NumberField label="Precio de la remera lisa" value={g.basePrice} onChange={(v) => updateList("garments", i, { basePrice: v })} />
                </div>
                <label className="field">
                  <span>Descripción</span>
                  <input className="input" value={g.description} onChange={(e) => updateList("garments", i, { description: e.target.value })} />
                </label>
                <div className="field">
                  <span>Talles</span>
                  <div className="chips">
                    {ALL_SIZES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`chip chip-sm ${g.sizes.includes(s) ? "active" : ""}`}
                        aria-pressed={g.sizes.includes(s)}
                        onClick={() =>
                          updateList("garments", i, {
                            sizes: g.sizes.includes(s) ? g.sizes.filter((x) => x !== s) : ALL_SIZES.filter((x) => x === s || g.sizes.includes(x)),
                          })
                        }
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-row">
                  <NumberField label="Zona de impresión: ancho (cm)" step={1} value={g.printArea.w} onChange={(v) => updateList("garments", i, { printArea: { ...g.printArea, w: v } })} />
                  <NumberField label="Alto (cm)" step={1} value={g.printArea.h} onChange={(v) => updateList("garments", i, { printArea: { ...g.printArea, h: v } })} />
                </div>
                <div className="row-wrap">
                  <label className="check">
                    <input type="checkbox" checked={g.active !== false} onChange={(e) => updateList("garments", i, { active: e.target.checked })} /> Disponible
                  </label>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={settings.packGarments.includes(g.id)}
                      onChange={(e) => update("packGarments", e.target.checked ? [...settings.packGarments, g.id] : settings.packGarments.filter((x) => x !== g.id))}
                    />{" "}
                    Entra en los packs
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-card">
        <h2>Colores</h2>
        <div className="colors-editor">
          {settings.colors.map((c, i) => (
            <div className="color-row color-row-simple" key={i}>
              <input type="color" value={c.hex} onChange={(e) => updateList("colors", i, { hex: e.target.value })} aria-label={`Color ${c.name}`} />
              <input className="input" value={c.name} onChange={(e) => updateList("colors", i, { name: e.target.value })} aria-label="Nombre del color" />
              <button type="button" className="btn btn-ghost btn-sm btn-danger" onClick={() => removeFrom("colors", i)} disabled={settings.colors.length === 1}>
                Quitar
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-outline btn-sm" onClick={() => update("colors", [...settings.colors, { name: "Nuevo color", hex: "#888888" }])}>
            Agregar color
          </button>
        </div>
      </section>

      <section className="admin-card">
        <h2>Tamaños de estampa</h2>
        <p className="hint">El diseñador elige el tamaño solo, según lo que mide el diseño en la remera.</p>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Nombre</th>
                <th scope="col">Hasta ancho (cm)</th>
                <th scope="col">Hasta alto (cm)</th>
                <th scope="col">Precio por remera</th>
              </tr>
            </thead>
            <tbody>
              {settings.printSizes.map((p, i) => (
                <tr key={p.id}>
                  <td>
                    <input className="input" value={p.name} onChange={(e) => updateList("printSizes", i, { name: e.target.value })} aria-label="Nombre" />
                  </td>
                  <td>
                    <input className="input stock-input" type="number" value={p.maxW} onChange={(e) => updateList("printSizes", i, { maxW: Number(e.target.value) })} aria-label="Ancho máximo" />
                  </td>
                  <td>
                    <input className="input stock-input" type="number" value={p.maxH} onChange={(e) => updateList("printSizes", i, { maxH: Number(e.target.value) })} aria-label="Alto máximo" />
                  </td>
                  <td>
                    <input className="input" type="number" step="100" value={p.price} onChange={(e) => updateList("printSizes", i, { price: Number(e.target.value) })} aria-label="Precio" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-card">
        <h2>Descuentos por cantidad</h2>
        <p className="hint">Se aplican a remeras iguales (mismo diseño), sumando todos los talles.</p>
        <div className="tiers-editor">
          {settings.tiers.map((t, i) => (
            <div key={i} className="tier-row">
              <NumberField label="Desde (remeras)" step={1} min={2} value={t.min} onChange={(v) => updateList("tiers", i, { min: v })} />
              <NumberField label="Descuento (%)" step={1} value={t.pct} onChange={(v) => updateList("tiers", i, { pct: v })} />
              <button type="button" className="btn btn-ghost btn-sm btn-danger" onClick={() => removeFrom("tiers", i)}>
                Quitar
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-outline btn-sm" onClick={() => update("tiers", [...settings.tiers, { min: 50, pct: 25 }])}>
            Agregar escalón
          </button>
        </div>
      </section>

      <section className="admin-card">
        <h2>Packs para revendedores</h2>
        <div className="packs-admin">
          {settings.packs.map((p, i) => (
            <div key={p.id} className="pack-admin form-grid">
              <label className="field">
                <span>Nombre</span>
                <input className="input" value={p.name} onChange={(e) => updateList("packs", i, { name: e.target.value })} />
              </label>
              <div className="form-row">
                <NumberField label="Remeras" step={1} min={1} value={p.units} onChange={(v) => updateList("packs", i, { units: v })} />
                <NumberField label="Diseños máx." step={1} min={1} value={p.maxDesigns} onChange={(v) => updateList("packs", i, { maxDesigns: v })} />
              </div>
              <NumberField label="Precio del pack" value={p.price} onChange={(v) => updateList("packs", i, { price: v })} hint={p.units ? `${money(p.price / p.units)} por remera` : ""} />
              <label className="field">
                <span>Qué incluye</span>
                <textarea className="textarea" rows="4" value={p.perks.join("\n")} onChange={(e) => updateList("packs", i, { perks: e.target.value.split("\n") })} />
                <span className="hint">Uno por línea</span>
              </label>
              <label className="check">
                <input type="checkbox" checked={p.active !== false} onChange={(e) => updateList("packs", i, { active: e.target.checked })} /> Publicado
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-card">
        <div className="row-between">
          <h2>Diseños del catálogo</h2>
          <label className={`btn btn-outline btn-sm file-btn ${upload.busy ? "is-busy" : ""}`}>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" disabled={upload.busy} onChange={(e) => addCatalogDesign(e.target.files?.[0])} />
            {upload.busy ? upload.status : "Subir diseño"}
          </label>
        </div>
        {upload.error && <p className="alert alert-error">{upload.error}</p>}
        <p className="hint">Subí PNG con fondo transparente. Los que ocultes dejan de verse en el diseñador.</p>
        <div className="design-grid design-grid-admin">
          {designs.map((d) => (
            <div key={d.id} className={`design-thumb ${d.active ? "" : "is-off"}`}>
              <img src={d.src} alt="" loading="lazy" />
              <input className="input" value={d.name} aria-label="Nombre del diseño" onChange={(e) => setDesigns((l) => l.map((x) => (x.id === d.id ? { ...x, name: e.target.value } : x)))} onBlur={(e) => patchDesign(d, { name: e.target.value })} />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => patchDesign(d, { active: !d.active })}>
                {d.active ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
