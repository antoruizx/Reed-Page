import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import TeeMockup, { clampPlacement } from "../components/TeeMockup";
import { QuantityStepper } from "../components/CartDrawer";
import Icon from "../components/Icon";
import { useCustomConfig } from "../lib/useCustomConfig";
import { designAspect, myDesigns, rememberDesign, uploadDesign } from "../lib/designFiles";
import { api } from "../lib/api";
import { money } from "../lib/format";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { usePageTitle } from "../components/usePageTitle";
import {
  configError,
  describeSizes,
  garmentById,
  nextTier,
  packError,
  placementSize,
  priceCustom,
  pricePack,
  printSizeFor,
  SIDE_LABELS,
  sizesError,
  totalUnits,
  unitBase,
} from "../../shared/pricing.js";

const AI_IDEAS = [
  "un gato astronauta flotando entre planetas, estilo retro",
  "un cactus con anteojos de sol, colores pastel",
  "una ola japonesa con un sol rojo atrás",
  "un corazón con alas y llamas, estilo tattoo",
];

const PRESETS = [
  { id: "pecho", label: "Logo en el pecho", widthCm: 9, x: 0.74, y: 0.1, sides: ["front"] },
  { id: "centro", label: "Centrado", widthCm: 20, x: 0.5, y: 0.32, sides: ["front", "back"] },
  { id: "grande", label: "Lo más grande posible", widthCm: 60, x: 0.5, y: 0.45, sides: ["front", "back"] },
];

function Step({ n, title, children, aside }) {
  return (
    <section className="dz-step" aria-labelledby={`step-${n}`}>
      <header className="dz-step-head">
        <span className="dz-step-n" aria-hidden="true">
          {n}
        </span>
        <h2 id={`step-${n}`}>{title}</h2>
        {aside}
      </header>
      {children}
    </section>
  );
}

export default function Designer() {
  usePageTitle("Diseñá tu remera");
  const { data, error } = useCustomConfig();

  if (error) return <p className="wrap page alert alert-error">{error.message}</p>;
  if (!data) return <div className="spinner" role="status" aria-label="Cargando el diseñador" />;
  return <DesignerView settings={data.settings} catalog={data.designs} aiEnabled={data.ai} />;
}

function DesignerView({ settings, catalog, aiEnabled }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { items: cartItems, addCustom } = useCart();

  // ---------- Modo pack ----------
  const pack = settings.packs.find((p) => p.id === params.get("pack") && p.active !== false) || null;
  const editing = cartItems.find((i) => i.id === params.get("editar") && i.type === "custom") || null;

  const garments = settings.garments.filter((g) => g.active !== false && (!pack || settings.packGarments.includes(g.id)));
  const startDesign = catalog[0];

  const [config, setConfig] = useState(() => {
    if (editing) return editing.config;
    const g = garments.find((x) => x.id === "clasica") || garments[0];
    const base = { garment: g.id, color: settings.colors[0].name, front: null, back: null };
    if (startDesign) {
      base.front = clampPlacement(g, "front", {
        designId: startDesign.id,
        src: startDesign.src,
        name: startDesign.name,
        aspect: designAspect(startDesign),
        widthCm: 20,
        x: 0.5,
        y: 0.32,
      });
    }
    return base;
  });
  const [side, setSide] = useState("front");
  const [sizes, setSizes] = useState(() => editing?.sizes || {});
  const [packEntries, setPackEntries] = useState([]);
  const [tab, setTab] = useState("catalogo");
  const [mine, setMine] = useState(myDesigns);
  const [removeBg, setRemoveBg] = useState(true);
  const [upload, setUpload] = useState({ busy: false, status: "", error: null });
  const [prompt, setPrompt] = useState("");
  const [ai, setAi] = useState({ busy: false, error: null, remaining: null });
  const [guides, setGuides] = useState(true);
  const [notice, setNotice] = useState(null);
  const fileRef = useRef(null);

  const garment = garmentById(settings, config.garment) || garments[0];
  const colorHex = settings.colors.find((c) => c.name === config.color)?.hex || "#ffffff";
  const placement = config[side];

  // Si cambia el modelo, reajustamos los diseños a su zona de impresión
  const setGarment = (id) => {
    const g = garmentById(settings, id);
    setConfig((c) => ({
      ...c,
      garment: id,
      front: c.front && clampPlacement(g, "front", c.front),
      back: c.back && clampPlacement(g, "back", c.back),
    }));
    setSizes((s) => Object.fromEntries(Object.entries(s).filter(([k]) => g.sizes.includes(k))));
  };

  const setPlacement = (p) => setConfig((c) => ({ ...c, [side]: p }));

  const applyDesign = (d) => {
    const prev = config[side];
    setPlacement(
      clampPlacement(garment, side, {
        designId: d.id,
        src: d.src,
        name: d.name,
        aspect: designAspect(d),
        widthCm: prev?.widthCm || 20,
        x: prev?.x ?? 0.5,
        y: prev?.y ?? 0.32,
      })
    );
  };

  const applyPreset = (preset) => {
    if (!placement) return;
    setPlacement(clampPlacement(garment, side, { ...placement, widthCm: preset.widthCm, x: preset.x, y: preset.y }));
  };

  const onFile = async (file) => {
    if (!file) return;
    setUpload({ busy: true, status: "Preparando…", error: null });
    try {
      const d = await uploadDesign(file, { removeBg, onStatus: (status) => setUpload((u) => ({ ...u, status })) });
      setMine(myDesigns());
      applyDesign(d);
      setUpload({ busy: false, status: "", error: null });
    } catch (err) {
      setUpload({ busy: false, status: "", error: err.message });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const createWithAi = async (e) => {
    e.preventDefault();
    setAi({ busy: true, error: null, remaining: ai.remaining });
    try {
      const { design, remaining } = await api("/ai/designs", { method: "POST", body: { prompt } });
      rememberDesign(design);
      setMine(myDesigns());
      applyDesign(design);
      setAi({ busy: false, error: null, remaining });
    } catch (err) {
      setAi({ busy: false, error: err.message, remaining: ai.remaining });
    }
  };

  // ---------- Precios ----------
  const qty = totalUnits(sizes);
  const price = useMemo(() => priceCustom(settings, { config, sizes }), [settings, config, sizes]);
  const unitFrom = unitBase(settings, garment.id, garment.sizes.includes("M") ? "M" : garment.sizes[0]) + price.print;
  const upcoming = nextTier(settings, qty);
  const cfgError = configError(settings, config, { forPack: Boolean(pack) });
  const szError = sizesError(settings, config, sizes);

  const packUnits = packEntries.reduce((s, e) => s + totalUnits(e.sizes), 0);
  const packLine = pack ? { packId: pack.id, items: packEntries } : null;
  const packPrice = pack ? pricePack(settings, packLine) : null;
  const packRemaining = pack ? pack.units - packUnits : 0;

  useEffect(() => setNotice(null), [config, sizes]);

  const addToCart = () => {
    const err = cfgError || szError;
    if (err) return setNotice(err);
    addCustom({
      id: editing?.id,
      type: "custom",
      title: `${garment.name} personalizada`,
      config,
      sizes,
      units: qty,
      total: price.total,
    });
    if (editing) navigate("/disena", { replace: true });
  };

  const addEntryToPack = () => {
    const err = cfgError || szError;
    if (err) return setNotice(err);
    if (packEntries.length >= pack.maxDesigns) return setNotice(`Este pack admite hasta ${pack.maxDesigns} diseños`);
    if (qty > packRemaining) return setNotice(`Te quedan ${packRemaining} remeras para completar el pack`);
    setPackEntries((list) => [...list, { config, sizes }]);
    setSizes({});
    setNotice(null);
  };

  const addPackToCart = () => {
    const err = packError(settings, packLine);
    if (err) return setNotice(err);
    addCustom({ type: "pack", packId: pack.id, title: pack.name, items: packEntries, units: packUnits, total: packPrice.total });
    setPackEntries([]);
  };

  const otherSide = side === "front" ? "back" : "front";
  const dims = placement ? placementSize(placement) : null;
  const tier = placement ? printSizeFor(settings, placement) : null;

  return (
    <div className="designer">
      <div className="wrap dz-head">
        <div>
          <h1 className="page-title">{pack ? `Armá tu ${pack.name}` : editing ? "Editá tu remera" : "Diseñá tu remera"}</h1>
          <p className="page-lead">
            {pack
              ? `${pack.units} remeras, hasta ${pack.maxDesigns} diseños distintos, por ${money(pack.price)}. Armá cada diseño y sumalo al pack.`
              : `Elegí el modelo y el color, poné tu diseño donde quieras y mirá el precio al instante. Las hacemos a pedido en ${settings.productionDays}.`}
          </p>
        </div>
        {!pack && (
          <Link to="/revende" className="link">
            ¿Querés revender? Mirá los packs
          </Link>
        )}
      </div>

      <div className="wrap dz-layout">
        {/* ---------- Vista previa ---------- */}
        <div className="dz-stage">
          <div className="dz-canvas">
            <TeeMockup
              garment={garment}
              color={colorHex}
              side={side}
              placement={placement}
              editable
              showGuides={guides}
              onMove={setPlacement}
            />
            <button type="button" className="dz-other" onClick={() => setSide(otherSide)} aria-label={`Ver ${SIDE_LABELS[otherSide].toLowerCase()}`}>
            <TeeMockup garment={garment} color={colorHex} side={otherSide} placement={config[otherSide]} />
            <span>{SIDE_LABELS[otherSide]}</span>
          </button>
          </div>
          <div className="dz-stage-bar">
            <div className="segmented" role="group" aria-label="Lado de la remera">
              {["front", "back"].map((s) => (
                <button key={s} type="button" className={side === s ? "active" : ""} aria-pressed={side === s} onClick={() => setSide(s)}>
                  {SIDE_LABELS[s]}
                  {config[s] && <span className="dot" aria-label="con diseño" />}
                </button>
              ))}
            </div>
            <label className="check small">
              <input type="checkbox" checked={guides} onChange={(e) => setGuides(e.target.checked)} /> Ver zona de impresión
            </label>
          </div>
          <p className="hint dz-tip">Arrastrá el diseño para moverlo. Con el teclado: Tab hasta el diseño y flechas.</p>
        </div>

        {/* ---------- Pasos ---------- */}
        <div className="dz-panel">
          {pack && (
            <section className="pack-box" aria-live="polite">
              <div className="row-between">
                <strong>{pack.name}</strong>
                <span>
                  {packUnits} de {pack.units} remeras
                </span>
              </div>
              <span className="free-ship-bar" style={{ "--p": packUnits / pack.units }} />
              {packEntries.length > 0 && (
                <ul className="pack-entries">
                  {packEntries.map((e, i) => {
                    const g = garmentById(settings, e.config.garment);
                    const hex = settings.colors.find((c) => c.name === e.config.color)?.hex;
                    return (
                      <li key={i}>
                        <TeeMockup garment={g} color={hex} side={e.config.front ? "front" : "back"} placement={e.config.front || e.config.back} />
                        <span>
                          <strong>{g.name}</strong>
                          <span className="hint">
                            {e.config.color}, {describeSizes(e.sizes)}
                          </span>
                        </span>
                        <button type="button" className="icon-btn" aria-label="Quitar del pack" onClick={() => setPackEntries((l) => l.filter((_, j) => j !== i))}>
                          <Icon name="trash" size={18} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <p className="hint">
                {packRemaining > 0
                  ? `Diseño ${packEntries.length + 1} de hasta ${pack.maxDesigns}. Faltan ${packRemaining} remeras.`
                  : "¡Pack completo! Ya lo podés agregar al carrito."}
              </p>
            </section>
          )}

          <Step n={1} title="Modelo">
            <div className="garment-picker">
              {garments.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={`garment-option ${g.id === garment.id ? "active" : ""}`}
                  aria-pressed={g.id === garment.id}
                  onClick={() => setGarment(g.id)}
                >
                  <TeeMockup garment={g} color={colorHex} label="" />
                  <strong>{g.name}</strong>
                  <span className="hint">{g.description}</span>
                  {!pack && <span className="garment-price">desde {money(g.basePrice)}</span>}
                </button>
              ))}
            </div>
          </Step>

          <Step n={2} title="Color" aside={<span className="dz-step-value">{config.color}</span>}>
            <div className="color-picker">
              {settings.colors.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  className={`color-dot ${c.name === config.color ? "active" : ""}`}
                  style={{ "--swatch": c.hex }}
                  aria-pressed={c.name === config.color}
                  aria-label={c.name}
                  title={c.name}
                  onClick={() => setConfig((cf) => ({ ...cf, color: c.name }))}
                />
              ))}
            </div>
          </Step>

          <Step n={3} title={`Diseño del ${SIDE_LABELS[side].toLowerCase()}`} aside={
            <div className="segmented segmented-sm" role="group" aria-label="Lado que estás editando">
              {["front", "back"].map((s) => (
                <button key={s} type="button" className={side === s ? "active" : ""} aria-pressed={side === s} onClick={() => setSide(s)}>
                  {SIDE_LABELS[s]}
                </button>
              ))}
            </div>
          }>
            <div className="tabs" role="tablist" aria-label="De dónde sale el diseño">
              {[
                ["catalogo", "Diseños de Reed"],
                ["subir", "Subir el mío"],
                ["ia", "Crear con IA"],
              ].map(([id, label]) => (
                <button key={id} role="tab" type="button" aria-selected={tab === id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
                  {label}
                </button>
              ))}
            </div>

            {tab === "catalogo" && (
              <div className="design-grid" role="tabpanel" aria-label="Diseños de Reed">
                {catalog.map((d) => (
                  <button key={d.id} type="button" className={`design-thumb ${placement?.designId === d.id ? "active" : ""}`} onClick={() => applyDesign(d)} aria-pressed={placement?.designId === d.id}>
                    <img src={d.src} alt="" loading="lazy" />
                    <span>{d.name}</span>
                  </button>
                ))}
              </div>
            )}

            {tab === "subir" && (
              <div role="tabpanel" aria-label="Subir el mío" className="upload-panel">
                <label className={`dropzone ${upload.busy ? "is-busy" : ""}`}>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    disabled={upload.busy}
                    onChange={(e) => onFile(e.target.files?.[0])}
                  />
                  <strong>{upload.busy ? upload.status : "Elegí una imagen"}</strong>
                  <span className="hint">PNG, JPG, WEBP o SVG. Para que salga nítido, que tenga al menos 1500 px de ancho.</span>
                </label>
                <label className="check">
                  <input type="checkbox" checked={removeBg} onChange={(e) => setRemoveBg(e.target.checked)} />
                  Quitar el fondo con IA (ideal para fotos y logos sobre fondo blanco)
                </label>
                {upload.error && <p className="alert alert-error">{upload.error}</p>}
                {mine.length > 0 && (
                  <>
                    <h3 className="dz-sub">Tus diseños</h3>
                    <div className="design-grid design-grid-sm">
                      {mine.map((d) => (
                        <button key={d.id} type="button" className={`design-thumb ${placement?.designId === d.id ? "active" : ""}`} onClick={() => applyDesign(d)}>
                          <img src={d.src} alt="" loading="lazy" />
                          <span>{d.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
                <p className="hint">Usá solo imágenes tuyas o que tengas permiso para estampar.</p>
              </div>
            )}

            {tab === "ia" && (
              <div role="tabpanel" aria-label="Crear con IA" className="ai-panel">
                {!aiEnabled ? (
                  <p className="alert alert-info">La creación con IA se activa muy pronto. Mientras tanto, subí tu imagen o elegí un diseño de Reed.</p>
                ) : !user ? (
                  <p className="alert alert-info">
                    Para crear diseños con IA,{" "}
                    <Link to="/ingresar" state={{ from: location.pathname + location.search }} className="link">
                      iniciá sesión
                    </Link>
                    . Es gratis.
                  </p>
                ) : (
                  <form onSubmit={createWithAi} className="form-grid">
                    <div className="field">
                      <label htmlFor="ai-prompt">Contá qué querés que tenga</label>
                      <textarea id="ai-prompt" className="textarea" rows="3" maxLength={400} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Un perro salchicha surfeando una ola, estilo cómic" />
                    </div>
                    <div className="chips">
                      {AI_IDEAS.map((idea) => (
                        <button key={idea} type="button" className="chip chip-sm" onClick={() => setPrompt(idea)}>
                          {idea}
                        </button>
                      ))}
                    </div>
                    {ai.error && <p className="alert alert-error">{ai.error}</p>}
                    <button className="btn btn-dark" disabled={ai.busy || prompt.trim().length < 4}>
                      {ai.busy ? "Creando tu diseño… (tarda unos 30 segundos)" : "Crear diseño"}
                    </button>
                    <p className="hint">
                      {ai.remaining !== null ? `Te quedan ${ai.remaining} diseños con IA por hoy. ` : ""}
                      No uses marcas ni personajes conocidos: no los podemos estampar.
                    </p>
                  </form>
                )}
              </div>
            )}
          </Step>

          <Step n={4} title="Tamaño y posición">
            {placement ? (
              <div className="form-grid">
                <div className="chips">
                  {PRESETS.filter((p) => p.sides.includes(side)).map((p) => (
                    <button key={p.id} type="button" className="chip" onClick={() => applyPreset(p)}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="field">
                  <label htmlFor="dz-size">
                    Ancho: <strong>{dims.w.toFixed(0)} cm</strong>
                  </label>
                  <input
                    id="dz-size"
                    type="range"
                    className="range"
                    min="3"
                    max={Math.floor(Math.min(garment.printArea.w, garment.printArea.h / placement.aspect))}
                    step="0.5"
                    value={placement.widthCm}
                    onChange={(e) => setPlacement(clampPlacement(garment, side, { ...placement, widthCm: Number(e.target.value) }))}
                  />
                </div>
                <p className="print-size-note">
                  Mide {dims.w.toFixed(0)} × {dims.h.toFixed(0)} cm: estampa <strong>{tier.name}</strong>, {money(tier.price)} por remera.
                </p>
                <button type="button" className="link btn-reset" onClick={() => setPlacement(null)}>
                  Sacar el diseño del {SIDE_LABELS[side].toLowerCase()}
                </button>
              </div>
            ) : (
              <p className="hint">
                El {SIDE_LABELS[side].toLowerCase()} va liso. Elegí un diseño arriba si querés estamparlo.
              </p>
            )}
          </Step>

          <Step n={5} title="Talles y cantidad" aside={<Link to="/nosotros#talles" className="link small">Guía de talles</Link>}>
            <div className="size-qty">
              {garment.sizes.map((s) => (
                <div key={s} className="size-qty-row">
                  <span>{s}</span>
                  <QuantityStepper
                    value={sizes[s] || 0}
                    onChange={(n) => setSizes((prev) => ({ ...prev, [s]: Math.max(0, Math.min(pack ? packRemaining + (prev[s] || 0) : 500, n)) }))}
                    label={`Cantidad talle ${s}`}
                  />
                </div>
              ))}
            </div>
            {!pack && (
              <p className="tier-note">
                {price.discountPct > 0 && <strong>Llevás {qty}: tenés {price.discountPct}% de descuento. </strong>}
                {upcoming
                  ? `Con ${upcoming.min - qty} ${upcoming.min - qty === 1 ? "remera más" : "remeras más"} de este diseño tenés ${upcoming.pct}% de descuento.`
                  : qty > 0 && "Ya tenés el mejor descuento."}
              </p>
            )}
          </Step>

          {/* ---------- Resumen ---------- */}
          <section className="dz-summary" aria-live="polite">
            {pack ? (
              <>
                <dl className="totals">
                  <div>
                    <dt>{pack.name}</dt>
                    <dd>{money(pack.price)}</dd>
                  </div>
                  {packPrice.extras > 0 && (
                    <div>
                      <dt>Extras (segunda estampa, talles grandes)</dt>
                      <dd>{money(packPrice.extras)}</dd>
                    </div>
                  )}
                  <div className="totals-total">
                    <dt>Total del pack</dt>
                    <dd>{money(packPrice.total)}</dd>
                  </div>
                </dl>
                <p className="hint">Sale {money(pack.price / pack.units)} por remera.</p>
                {notice && <p className="alert alert-error" role="alert">{notice}</p>}
                {packRemaining > 0 ? (
                  <button type="button" className="btn btn-dark btn-block" onClick={addEntryToPack} disabled={qty === 0 || packEntries.length >= pack.maxDesigns}>
                    {qty === 0 ? "Elegí talles para sumar este diseño" : `Sumar este diseño al pack (${qty} ${qty === 1 ? "remera" : "remeras"})`}
                  </button>
                ) : (
                  <button type="button" className="btn btn-primary btn-block" onClick={addPackToCart}>
                    Agregar pack al carrito
                  </button>
                )}
              </>
            ) : (
              <>
                <dl className="totals">
                  <div>
                    <dt>Remera ({garment.name})</dt>
                    <dd>desde {money(unitFrom - price.print)}</dd>
                  </div>
                  {["front", "back"].map(
                    (s) =>
                      config[s] && (
                        <div key={s}>
                          <dt>Estampa {SIDE_LABELS[s].toLowerCase()}</dt>
                          <dd>{money(printSizeFor(settings, config[s]).price)}</dd>
                        </div>
                      )
                  )}
                  {qty > 0 && price.discount > 0 && (
                    <div className="totals-discount">
                      <dt>Descuento {price.discountPct}%</dt>
                      <dd>−{money(price.discount)}</dd>
                    </div>
                  )}
                  <div className="totals-total">
                    <dt>{qty > 0 ? `Total (${qty} ${qty === 1 ? "remera" : "remeras"})` : "Precio por remera"}</dt>
                    <dd>{money(qty > 0 ? price.total : unitFrom)}</dd>
                  </div>
                </dl>
                {notice && <p className="alert alert-error" role="alert">{notice}</p>}
                <button type="button" className="btn btn-primary btn-block" onClick={addToCart}>
                  {editing ? "Guardar cambios" : "Agregar al carrito"}
                </button>
                <p className="hint">Se hace a pedido: la despachamos en {settings.productionDays}.</p>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
