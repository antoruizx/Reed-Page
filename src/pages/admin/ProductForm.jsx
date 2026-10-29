import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { api } from "../../lib/api";
import { CATEGORY_LABELS, PRODUCT_STATUS_LABELS, productStatus } from "../../lib/format";
import { usePageTitle } from "../../components/usePageTitle";

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Único"];

const EMPTY = {
  name: "",
  category: "remeras",
  price: "",
  compareAtPrice: "",
  description: "",
  details: "",
  images: "",
  colors: [{ name: "Negro", hex: "#1c1b1f", image: "" }],
  sizes: ["S", "M", "L", "XL"],
  stock: {}, // { "Negro|M": 5 }
  featured: false,
  status: "publicado",
};

const key = (color, size) => `${color}|${size}`;

function fromProduct(p) {
  const sizes = ALL_SIZES.filter((s) => p.variants.some((v) => v.size === s));
  return {
    name: p.name,
    category: p.category,
    price: p.price,
    compareAtPrice: p.compareAtPrice || "",
    description: p.description || "",
    details: (p.details || []).join("\n"),
    images: p.images.join("\n"),
    colors: p.colors.map((c) => ({ ...c, image: c.image || "" })),
    sizes,
    stock: Object.fromEntries(p.variants.map((v) => [key(v.color, v.size), v.stock])),
    featured: p.featured,
    status: productStatus(p),
  };
}

export default function ProductForm() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  usePageTitle(isNew ? "Nuevo producto" : form.name || "Editar producto");

  useEffect(() => {
    if (isNew) return;
    api(`/admin/products/${id}`)
      .then(({ product }) => setForm(fromProduct(product)))
      .catch(setError)
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const images = form.images.split("\n").map((s) => s.trim()).filter(Boolean);

  const updateColor = (i, patch) =>
    setForm((f) => {
      const old = f.colors[i];
      const colors = f.colors.map((c, j) => (j === i ? { ...c, ...patch } : c));
      // si cambia el nombre del color, movemos su stock
      let stock = f.stock;
      if (patch.name !== undefined && patch.name !== old.name) {
        stock = Object.fromEntries(
          Object.entries(f.stock).map(([k, v]) => {
            const [c, s] = k.split("|");
            return [c === old.name ? key(patch.name, s) : k, v];
          })
        );
      }
      return { ...f, colors, stock };
    });

  const toggleSize = (s) =>
    setForm((f) => ({
      ...f,
      sizes: f.sizes.includes(s) ? f.sizes.filter((x) => x !== s) : ALL_SIZES.filter((x) => x === s || f.sizes.includes(x)),
    }));

  const save = async (e) => {
    e.preventDefault();
    setError(null);
    const colors = form.colors.filter((c) => c.name.trim());
    if (!colors.length) return setError({ message: "Agregá al menos un color" });
    if (!form.sizes.length) return setError({ message: "Elegí al menos un talle" });
    if (!images.length) return setError({ message: "Agregá al menos una foto" });

    const body = {
      name: form.name,
      category: form.category,
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
      description: form.description,
      details: form.details.split("\n"),
      images,
      colors: colors.map((c) => ({ name: c.name.trim(), hex: c.hex, ...(c.image ? { image: c.image } : {}) })),
      variants: colors.flatMap((c) =>
        form.sizes.map((s) => ({ color: c.name.trim(), size: s, stock: Number(form.stock[key(c.name, s)] || 0) }))
      ),
      featured: form.featured,
      status: form.status,
    };

    setSaving(true);
    try {
      await api(isNew ? "/admin/products" : `/admin/products/${id}`, { method: isNew ? "POST" : "PUT", body });
      navigate("/admin/productos");
    } catch (err) {
      setError(err);
      setSaving(false);
    }
  };

  if (loading) return <div className="spinner" role="status" aria-label="Cargando" />;

  return (
    <form onSubmit={save} className="product-form">
      <div className="admin-head">
        <div>
          <Link to="/admin/productos" className="link small">
            Volver a productos
          </Link>
          <h1 className="admin-title">{isNew ? "Nuevo producto" : "Editar producto"}</h1>
        </div>
        <button className="btn btn-primary" disabled={saving}>
          {saving ? "Guardando…" : isNew ? "Publicar producto" : "Guardar cambios"}
        </button>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error.message}
          {error.details && typeof error.details === "object" && (
            <ul>
              {Object.entries(error.details).map(([k, v]) => (
                <li key={k}>{String(v)}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="product-form-grid">
        <div className="admin-card form-grid">
          <h2>Información</h2>
          <div className="field">
            <label htmlFor="name">Nombre</label>
            <input id="name" className="input" required value={form.name} onChange={set("name")} />
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="category">Categoría</label>
              <select id="category" className="select" value={form.category} onChange={set("category")}>
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="price">Precio</label>
              <input id="price" className="input" type="number" min="0" step="100" required value={form.price} onChange={set("price")} />
            </div>
            <div className="field">
              <label htmlFor="compareAtPrice">Precio anterior</label>
              <input id="compareAtPrice" className="input" type="number" min="0" step="100" value={form.compareAtPrice} onChange={set("compareAtPrice")} />
              <span className="hint">Si lo completás, se muestra tachado como oferta</span>
            </div>
          </div>
          <div className="field">
            <label htmlFor="description">Descripción</label>
            <textarea id="description" className="textarea" rows="3" value={form.description} onChange={set("description")} />
          </div>
          <div className="field">
            <label htmlFor="details">Detalles</label>
            <textarea id="details" className="textarea" rows="4" value={form.details} onChange={set("details")} placeholder={"Jersey peinado 100% algodón\nCalce oversize"} />
            <span className="hint">Uno por línea: tela, calce, cuidados</span>
          </div>
        </div>

        <div className="admin-card form-grid">
          <h2>Fotos</h2>
          <div className="field">
            <label htmlFor="images">Links de las fotos</label>
            <textarea id="images" className="textarea" rows="4" value={form.images} onChange={set("images")} placeholder="/img/products/mi-remera.jpg" />
            <span className="hint">
              Una por línea. La primera es la principal. Pueden ser fotos de la carpeta
              public/img/products o links de internet (por ejemplo, de Cloudinary).
            </span>
          </div>
          {images.length > 0 && (
            <div className="image-previews">
              {images.map((src) => (
                <img key={src} src={src} alt="" width="80" height="100" />
              ))}
            </div>
          )}
          <label className="check">
            <input type="checkbox" checked={form.featured} onChange={set("featured")} /> Mostrar en “Lo nuevo” de la portada
          </label>
          <div className="field">
            <label htmlFor="status">Estado</label>
            <select id="status" className="select" value={form.status} onChange={set("status")}>
              {Object.entries(PRODUCT_STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <span className="hint">
              {form.status === "oculto"
                ? "No aparece en la tienda."
                : form.status === "agotado"
                  ? "Se ve en la tienda con el cartel “Sin stock” y no se puede comprar. El stock cargado se guarda igual."
                  : "Se ve en la tienda y se puede comprar."}
            </span>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <h2>Colores, talles y stock</h2>
        <div className="colors-editor">
          {form.colors.map((c, i) => (
            <div className="color-row" key={i}>
              <input type="color" value={c.hex} onChange={(e) => updateColor(i, { hex: e.target.value })} aria-label={`Color ${i + 1}`} />
              <input className="input" placeholder="Nombre del color" value={c.name} onChange={(e) => updateColor(i, { name: e.target.value })} aria-label={`Nombre del color ${i + 1}`} />
              <select className="select" value={c.image} onChange={(e) => updateColor(i, { image: e.target.value })} aria-label={`Foto del color ${c.name}`}>
                <option value="">Foto: la principal</option>
                {images.map((src, j) => (
                  <option key={src} value={src}>
                    Foto {j + 1}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-danger"
                onClick={() => setForm((f) => ({ ...f, colors: f.colors.filter((_, j) => j !== i) }))}
                disabled={form.colors.length === 1}
              >
                Quitar
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setForm((f) => ({ ...f, colors: [...f.colors, { name: "", hex: "#ffffff", image: "" }] }))}
          >
            Agregar color
          </button>
        </div>

        <fieldset className="sizes-editor">
          <legend>Talles</legend>
          <div className="chips">
            {ALL_SIZES.map((s) => (
              <button key={s} type="button" className={`chip ${form.sizes.includes(s) ? "active" : ""}`} aria-pressed={form.sizes.includes(s)} onClick={() => toggleSize(s)}>
                {s}
              </button>
            ))}
          </div>
        </fieldset>

        {form.sizes.length > 0 && form.colors.some((c) => c.name.trim()) && (
          <div className="table-wrap">
            <table className="admin-table stock-table">
              <caption className="hint">Unidades disponibles de cada combinación</caption>
              <thead>
                <tr>
                  <th scope="col">Color</th>
                  {form.sizes.map((s) => (
                    <th key={s} scope="col">
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {form.colors
                  .filter((c) => c.name.trim())
                  .map((c) => (
                    <tr key={c.name}>
                      <th scope="row">
                        <span className="swatch" style={{ "--swatch": c.hex }} /> {c.name}
                      </th>
                      {form.sizes.map((s) => (
                        <td key={s}>
                          <input
                            className="input stock-input"
                            type="number"
                            min="0"
                            inputMode="numeric"
                            aria-label={`Stock ${c.name} ${s}`}
                            value={form.stock[key(c.name, s)] ?? 0}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, stock: { ...f.stock, [key(c.name, s)]: e.target.value } }))
                            }
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </form>
  );
}
