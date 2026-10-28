import { useId, useRef } from "react";

// =====================================================================
// Remera ilustrada en SVG. Cada modelo tiene sus proporciones; el color
// es libre y la estampa se dibuja debajo de las sombras de la tela para
// que parezca impresa.
// =====================================================================

const CX = 250;
const TOP = 50;

// Medidas en unidades del dibujo (el lienzo mide 500 × 560)
const SHAPES = {
  clasica: { neckW: 46, neckD: 34, shoulderW: 150, slope: 14, sleeveOut: 62, sleeveDown: 150, cuff: 92, armpitW: 152, armpitY: 225, hemW: 152, len: 440 },
  boxy: { neckW: 48, neckD: 32, shoulderW: 166, slope: 12, sleeveOut: 58, sleeveDown: 128, cuff: 90, armpitW: 168, armpitY: 212, hemW: 170, len: 372 },
  larga: { neckW: 46, neckD: 34, shoulderW: 148, slope: 14, sleeveOut: 66, sleeveDown: 168, cuff: 94, armpitW: 150, armpitY: 232, hemW: 150, len: 486 },
  baby: { neckW: 40, neckD: 30, shoulderW: 92, slope: 20, sleeveOut: 42, sleeveDown: 48, cuff: 54, armpitW: 98, armpitY: 158, hemW: 102, len: 300, waist: 90 },
};

export const shapeFor = (garmentId) => SHAPES[garmentId] || SHAPES.clasica;

function points(s) {
  const S = { x: CX + s.shoulderW, y: TOP + s.slope };
  const T = { x: S.x + s.sleeveOut, y: S.y + s.sleeveDown };
  const B = { x: T.x - s.cuff * 0.56, y: T.y + s.cuff * 0.8 };
  const A = { x: CX + s.armpitW, y: TOP + s.armpitY };
  const H = { x: CX + s.hemW, y: TOP + s.len };
  return { S, T, B, A, H };
}

const mirror = (p) => ({ x: 2 * CX - p.x, y: p.y });
const pt = (p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;

function bodyPath(s, side) {
  const { S, T, B, A, H } = points(s);
  const [S2, T2, B2, A2, H2] = [S, T, B, A, H].map(mirror);
  const nR = { x: CX + s.neckW, y: TOP };
  const nL = mirror(nR);
  const backDepth = side === "back" ? 10 : 12;
  const waistY = TOP + (s.armpitY + s.len) / 2;
  const waist = s.waist ? { x: CX + s.waist, y: waistY } : null;
  const sideR = waist
    ? `Q ${pt({ x: waist.x - 4, y: waistY - 30 })} ${pt(waist)} Q ${pt({ x: waist.x + 4, y: waistY + 40 })} ${pt(H)}`
    : `L ${pt(H)}`;
  const sideL = waist
    ? `Q ${pt(mirror({ x: waist.x + 4, y: waistY + 40 }))} ${pt(mirror(waist))} Q ${pt(mirror({ x: waist.x - 4, y: waistY - 30 }))} ${pt(A2)}`
    : `L ${pt(A2)}`;
  return [
    `M ${pt(nL)}`,
    `C ${pt({ x: CX - s.neckW * 0.5, y: TOP + backDepth })} ${pt({ x: CX + s.neckW * 0.5, y: TOP + backDepth })} ${pt(nR)}`,
    `Q ${pt({ x: (nR.x + S.x) / 2, y: TOP + 2 })} ${pt(S)}`,
    `Q ${pt({ x: S.x + s.sleeveOut * 0.5, y: S.y + s.sleeveDown * 0.35 })} ${pt(T)}`,
    `L ${pt(B)}`,
    `Q ${pt({ x: A.x + 6, y: (A.y + B.y) / 2 })} ${pt(A)}`,
    sideR,
    `Q ${pt({ x: CX, y: H.y + 10 })} ${pt(H2)}`,
    sideL,
    `Q ${pt({ x: A2.x - 6, y: (A2.y + B2.y) / 2 })} ${pt(B2)}`,
    `L ${pt(T2)}`,
    `Q ${pt({ x: S2.x - s.sleeveOut * 0.5, y: S2.y + s.sleeveDown * 0.35 })} ${pt(S2)}`,
    `Q ${pt({ x: (nL.x + S2.x) / 2, y: TOP + 2 })} ${pt(nL)}`,
    "Z",
  ].join(" ");
}

// Escote delantero (más profundo) o trasero (casi recto)
function neckPath(s, side, offset = 0) {
  const depth = side === "back" ? 12 : s.neckD;
  const w = s.neckW + offset * 0.6;
  return `M ${pt({ x: CX - w, y: TOP + offset * 0.3 })} C ${pt({ x: CX - w * 0.6, y: TOP + depth * 1.35 + offset })} ${pt({ x: CX + w * 0.6, y: TOP + depth * 1.35 + offset })} ${pt({ x: CX + w, y: TOP + offset * 0.3 })}`;
}

// Zona de impresión en unidades del dibujo
export function printBox(garment, side) {
  const s = shapeFor(garment.id);
  const w = s.hemW * 2 * (garment.id === "baby" ? 0.62 : 0.62);
  const perCm = w / garment.printArea.w;
  const h = garment.printArea.h * perCm;
  const y = TOP + (side === "back" ? 22 : s.neckD + 26);
  return { x: CX - w / 2, y, w, h, perCm };
}

export function placementRect(garment, side, p) {
  const box = printBox(garment, side);
  const w = p.widthCm * box.perCm;
  const h = w * p.aspect;
  return { x: box.x + p.x * box.w - w / 2, y: box.y + p.y * box.h - h / 2, w, h, box };
}

// Mantiene el diseño dentro de la zona de impresión
export function clampPlacement(garment, side, p) {
  const box = printBox(garment, side);
  const maxW = Math.min(garment.printArea.w, garment.printArea.h / p.aspect);
  const widthCm = Math.min(Math.max(p.widthCm, 3), maxW);
  const halfW = (widthCm * box.perCm) / 2 / box.w;
  const halfH = (widthCm * p.aspect * box.perCm) / 2 / box.h;
  return {
    ...p,
    widthCm,
    x: Math.min(1 - halfW, Math.max(halfW, p.x)),
    y: Math.min(1 - halfH, Math.max(halfH, p.y)),
  };
}

const isDark = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b < 110;
};

export default function TeeMockup({
  garment,
  color = "#F3F3EF",
  side = "front",
  placement,
  editable = false,
  showGuides = false,
  onMove,
  className = "",
  label,
}) {
  const uid = useId().replace(/:/g, "");
  const svgRef = useRef(null);
  const drag = useRef(null);
  const s = shapeFor(garment.id);
  const body = bodyPath(s, side);
  const { S, T, B, A } = points(s);
  const dark = isDark(color);
  const rect = placement?.src ? placementRect(garment, side, placement) : null;
  const box = printBox(garment, side);
  const hemY = TOP + s.len;

  const toSvg = (e) => {
    const m = svgRef.current.getScreenCTM().inverse();
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m);
    return { x: p.x, y: p.y };
  };

  const onPointerDown = (e) => {
    if (!editable || !placement) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { start: toSvg(e), x: placement.x, y: placement.y };
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    const p = toSvg(e);
    onMove?.(
      clampPlacement(garment, side, {
        ...placement,
        x: drag.current.x + (p.x - drag.current.start.x) / box.w,
        y: drag.current.y + (p.y - drag.current.start.y) / box.h,
      })
    );
  };
  const onPointerUp = () => {
    drag.current = null;
  };
  // Mover con flechas del teclado
  const onKeyDown = (e) => {
    if (!editable || !placement) return;
    const step = e.shiftKey ? 0.05 : 0.01;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!d) return;
    e.preventDefault();
    onMove?.(clampPlacement(garment, side, { ...placement, x: placement.x + d[0], y: placement.y + d[1] }));
  };

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 500 560"
      className={`tee-mockup ${editable ? "is-editable" : ""} ${className}`}
      role="img"
      aria-label={label || `${garment.name}, ${side === "back" ? "espalda" : "frente"}`}
    >
      <defs>
        <clipPath id={`body-${uid}`}>
          <path d={body} />
        </clipPath>
        <linearGradient id={`shade-${uid}`} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity=".22" />
          <stop offset=".18" stopColor="#000" stopOpacity="0" />
          <stop offset=".82" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".22" />
        </linearGradient>
        <filter id={`blur-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <radialGradient id={`light-${uid}`} cx=".5" cy=".3" r=".6">
          <stop offset="0" stopColor="#fff" stopOpacity={dark ? 0.16 : 0.3} />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* sombra en el piso */}
      <ellipse cx={CX} cy={hemY + 22} rx={s.hemW * 1.05} ry="10" fill="#2a1f33" opacity=".08" />

      <path d={body} fill={color} />

      {/* estampa: debajo de las sombras para que parezca impresa */}
      {rect && (
        <g clipPath={`url(#body-${uid})`}>
          <image
            href={placement.src}
            x={rect.x}
            y={rect.y}
            width={rect.w}
            height={rect.h}
            preserveAspectRatio="xMidYMid meet"
            opacity={dark ? 0.97 : 0.95}
          />
        </g>
      )}

      {/* volumen de la tela */}
      <g clipPath={`url(#body-${uid})`} pointerEvents="none">
        <rect x="0" y="0" width="500" height="560" fill={`url(#shade-${uid})`} />
        <rect x="0" y="0" width="500" height="560" fill={`url(#light-${uid})`} />
        {/* pliegues */}
        <g fill="none" stroke={dark ? "#fff" : "#000"} strokeOpacity={dark ? 0.05 : 0.035} strokeWidth="14" strokeLinecap="round" filter={`url(#blur-${uid})`}>
          <path d={`M ${A.x - 14} ${A.y + 20} Q ${A.x - 40} ${A.y + 90} ${A.x - 22} ${A.y + 170}`} />
          <path d={`M ${2 * CX - A.x + 14} ${A.y + 20} Q ${2 * CX - A.x + 40} ${A.y + 90} ${2 * CX - A.x + 22} ${A.y + 170}`} />
          <path d={`M ${CX - 30} ${hemY - 10} Q ${CX - 20} ${hemY - 60} ${CX - 44} ${hemY - 110}`} />
        </g>
        {/* costuras */}
        <g fill="none" stroke="#000" strokeOpacity={dark ? 0.35 : 0.14} strokeWidth="1.6">
          <path d={`M ${S.x} ${S.y} Q ${S.x - 8} ${(S.y + A.y) / 2} ${A.x} ${A.y}`} />
          <path d={`M ${2 * CX - S.x} ${S.y} Q ${2 * CX - S.x + 8} ${(S.y + A.y) / 2} ${2 * CX - A.x} ${A.y}`} />
          <path d={`M ${T.x - 6} ${T.y + 8} L ${B.x - 3} ${B.y - 9}`} strokeDasharray="4 4" />
          <path d={`M ${2 * CX - T.x + 6} ${T.y + 8} L ${2 * CX - B.x + 3} ${B.y - 9}`} strokeDasharray="4 4" />
          <path d={`M ${CX - s.hemW + 6} ${hemY - 12} Q ${CX} ${hemY - 2} ${CX + s.hemW - 6} ${hemY - 12}`} strokeDasharray="4 4" />
        </g>
      </g>

      {/* cuello */}
      {side === "front" && (
        <path
          d={`${neckPath(s, "front")} C ${pt({ x: CX + s.neckW * 0.5, y: TOP + 12 })} ${pt({ x: CX - s.neckW * 0.5, y: TOP + 12 })} ${pt({ x: CX - s.neckW, y: TOP })} Z`}
          fill={color}
        />
      )}
      {side === "front" && (
        <path
          d={`${neckPath(s, "front")} C ${pt({ x: CX + s.neckW * 0.5, y: TOP + 12 })} ${pt({ x: CX - s.neckW * 0.5, y: TOP + 12 })} ${pt({ x: CX - s.neckW, y: TOP })} Z`}
          fill="#000"
          opacity={dark ? 0.45 : 0.22}
        />
      )}
      <path d={neckPath(s, side)} fill="none" stroke={color} strokeWidth="13" />
      <path d={neckPath(s, side, 7)} fill="none" stroke="#000" strokeOpacity={dark ? 0.4 : 0.15} strokeWidth="1.6" />
      <path d={body} fill="none" stroke="#000" strokeOpacity={dark ? 0.5 : 0.18} strokeWidth="2" />

      {/* zona de impresión y manija para arrastrar */}
      {showGuides && (
        <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="none" stroke={dark ? "#fff" : "#2a1f33"} strokeOpacity=".45" strokeDasharray="6 6" strokeWidth="1.5" rx="4" />
      )}
      {rect && editable && (
        <rect
          x={rect.x}
          y={rect.y}
          width={rect.w}
          height={rect.h}
          fill="transparent"
          stroke={showGuides ? "#d63a74" : "none"}
          strokeWidth="2"
          className="drag-handle"
          tabIndex={0}
          role="slider"
          aria-label="Posición del diseño: arrastralo o usá las flechas"
          aria-valuetext={`${Math.round(placement.x * 100)}% horizontal, ${Math.round(placement.y * 100)}% vertical`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
        />
      )}
    </svg>
  );
}
