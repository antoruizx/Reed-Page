import TeeMockup from "./TeeMockup";
import { useCustomConfig } from "../lib/useCustomConfig";
import { DEFAULT_SETTINGS, describeSizes, SIDE_LABELS, placementSize, printSizeFor } from "../../shared/pricing.js";

// Entradas de una personalizada (1) o de un pack (varias), venga del carrito o de un pedido
export const entriesOf = (line) =>
  line.entries || (line.type === "pack" ? line.items : [{ config: line.config, sizes: line.sizes }]);

export function useGarmentLookup() {
  const { data } = useCustomConfig();
  const settings = data?.settings || DEFAULT_SETTINGS;
  const garment = (id) =>
    settings.garments.find((g) => g.id === id) ||
    DEFAULT_SETTINGS.garments.find((g) => g.id === id) || { id, name: id, printArea: { w: 30, h: 40 } };
  const hex = (name) => settings.colors.find((c) => c.name === name)?.hex || "#dddddd";
  return { settings, garment, hex };
}

export function MiniTee({ config, side }) {
  const { garment, hex } = useGarmentLookup();
  const s = side || (config.front ? "front" : "back");
  return <TeeMockup garment={garment(config.garment)} color={hex(config.color)} side={s} placement={config[s]} label="" />;
}

// Resumen en una línea: "Oversize Clásica, Negro: 3 M, 2 L"
export function EntrySummary({ entry }) {
  const { garment } = useGarmentLookup();
  return (
    <span className="cart-line-meta">
      {garment(entry.config.garment).name}, {entry.config.color}: {describeSizes(entry.sizes)}
    </span>
  );
}

// Ficha de producción para el panel: todo lo que hace falta para estampar
export function ProductionSheet({ entry }) {
  const { settings, garment } = useGarmentLookup();
  const g = garment(entry.config.garment);
  return (
    <div className="production">
      <div className="production-tees">
        {["front", "back"].map((side) => (
          <figure key={side}>
            <MiniTee config={entry.config} side={side} />
            <figcaption>{SIDE_LABELS[side]}</figcaption>
          </figure>
        ))}
      </div>
      <div>
        <p>
          <strong>{g.name}</strong>, color {entry.config.color}
          <br />
          Talles: {describeSizes(entry.sizes)}
        </p>
        <ul>
          {["front", "back"].map((side) => {
            const p = entry.config[side];
            if (!p) return null;
            const { w, h } = placementSize(p);
            return (
              <li key={side}>
                {SIDE_LABELS[side]}: {p.name || "diseño"}, {w.toFixed(1)} × {h.toFixed(1)} cm ({printSizeFor(settings, p).name}),
                centro a {Math.round(p.x * 100)}% del ancho y {Math.round(p.y * 100)}% del alto de la zona.{" "}
                <a href={p.src} target="_blank" rel="noreferrer" download>
                  Descargar archivo
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
