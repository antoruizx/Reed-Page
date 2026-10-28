import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import ProductCard, { ProductGridSkeleton } from "../components/ProductCard";
import Icon from "../components/Icon";
import { useFetch } from "../lib/useFetch";
import { CATEGORY_LABELS } from "../lib/format";
import { usePageTitle } from "../components/usePageTitle";

const SORTS = [
  { value: "nuevos", label: "Lo más nuevo" },
  { value: "precio-asc", label: "Menor precio" },
  { value: "precio-desc", label: "Mayor precio" },
];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const categoria = params.get("categoria") || "";
  const talle = params.get("talle") || "";
  const color = params.get("color") || "";
  const orden = params.get("orden") || "nuevos";
  const q = params.get("q") || "";
  const [search, setSearch] = useState(q);
  const [filtersOpen, setFiltersOpen] = useState(false);

  usePageTitle(CATEGORY_LABELS[categoria] || "Tienda");

  const { data, loading, error } = useFetch(
    "/products",
    { query: { categoria, talle, color, orden, q } },
    [categoria, talle, color, orden, q]
  );
  const { data: filters } = useFetch("/products/filters");

  useEffect(() => setSearch(q), [q]);

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (!value || next.get(key) === value) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const activeCount = [talle, color, q].filter(Boolean).length;

  return (
    <div className="wrap page shop">
      <header className="shop-head">
        <h1 className="page-title">{CATEGORY_LABELS[categoria] || "Toda la tienda"}</h1>
        <nav className="cat-tabs" aria-label="Categorías">
          <button className={!categoria ? "active" : ""} onClick={() => update("categoria", "")}>
            Todo
          </button>
          {Object.entries(CATEGORY_LABELS).map(([slug, label]) => (
            <button
              key={slug}
              className={categoria === slug ? "active" : ""}
              aria-pressed={categoria === slug}
              onClick={() => update("categoria", slug)}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <div className="shop-toolbar">
        <button className="btn btn-outline btn-sm filters-toggle" onClick={() => setFiltersOpen((o) => !o)} aria-expanded={filtersOpen}>
          <Icon name="filter" size={18} /> Filtrar{activeCount > 0 && ` (${activeCount})`}
        </button>
        <span className="result-count" aria-live="polite">
          {!loading && data && `${data.products.length} ${data.products.length === 1 ? "producto" : "productos"}`}
        </span>
        <label className="sort">
          <span className="visually-hidden">Ordenar por</span>
          <select className="select" value={orden} onChange={(e) => update("orden", e.target.value === "nuevos" ? "" : e.target.value)}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="shop-layout">
        <aside className={`filters ${filtersOpen ? "is-open" : ""}`} aria-label="Filtros">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              const next = new URLSearchParams(params);
              search.trim() ? next.set("q", search.trim()) : next.delete("q");
              setParams(next, { replace: true });
            }}
          >
            <label className="visually-hidden" htmlFor="shop-search">
              Buscar productos
            </label>
            <div className="search-box">
              <Icon name="search" size={18} />
              <input
                id="shop-search"
                className="input"
                type="search"
                placeholder="Buscar"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </form>

          {filters?.sizes?.length > 0 && (
            <fieldset>
              <legend>Talle</legend>
              <div className="chips">
                {filters.sizes.map((s) => (
                  <button key={s} type="button" className={`chip ${talle === s ? "active" : ""}`} aria-pressed={talle === s} onClick={() => update("talle", s)}>
                    {s}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {filters?.colors?.length > 0 && (
            <fieldset>
              <legend>Color</legend>
              <div className="color-filters">
                {filters.colors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    className={`color-filter ${color === c.name ? "active" : ""}`}
                    aria-pressed={color === c.name}
                    onClick={() => update("color", c.name)}
                  >
                    <span className="swatch" style={{ "--swatch": c.hex }} />
                    {c.name}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {activeCount > 0 && (
            <button
              type="button"
              className="link clear-filters"
              onClick={() => setParams(categoria ? { categoria } : {}, { replace: true })}
            >
              Borrar filtros
            </button>
          )}
        </aside>

        <section aria-label="Productos">
          {error ? (
            <p className="alert alert-error">{error.message}</p>
          ) : loading ? (
            <div className="product-grid product-grid-3">
              <ProductGridSkeleton count={6} />
            </div>
          ) : data.products.length === 0 ? (
            <div className="empty">
              <h2>No hay productos con esos filtros.</h2>
              <p>Probá con otro talle o color, o mirá toda la tienda.</p>
              <button className="btn btn-dark" onClick={() => setParams({}, { replace: true })}>
                Ver toda la tienda
              </button>
            </div>
          ) : (
            <div className="product-grid product-grid-3">
              {data.products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
