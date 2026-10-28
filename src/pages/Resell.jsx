import { Link } from "react-router";
import TeeMockup from "../components/TeeMockup";
import Icon from "../components/Icon";
import { whatsappFor } from "../components/WhatsappButton";
import { useCustomConfig } from "../lib/useCustomConfig";
import { money } from "../lib/format";
import { usePageTitle } from "../components/usePageTitle";
import { garmentById } from "../../shared/pricing.js";

const STEPS = [
  ["Elegí un pack o cuántas querés", "Los packs tienen precio cerrado. Si preferís armar a tu medida, el descuento se aplica solo."],
  ["Armá tus diseños", "Subí tu logo o tu arte, elegí uno de los nuestros o crealo con IA. Lo ves en la remera antes de pagar."],
  ["Las producimos", "Estampamos con DTF, que dura muchísimos lavados y queda bien en cualquier color."],
  ["Las vendés", "Te llegan listas para vender. Con el Pack Marca, además, con etiqueta con tu logo."],
];

export default function Resell() {
  usePageTitle("Revendé con Reed");
  const { data, error } = useCustomConfig();

  if (error) return <p className="wrap page alert alert-error">{error.message}</p>;
  if (!data) return <div className="spinner" role="status" aria-label="Cargando" />;

  const { settings, designs } = data;
  const packs = settings.packs.filter((p) => p.active !== false);
  const g = garmentById(settings, "clasica") || settings.garments[0];
  const a4 = settings.printSizes.find((p) => p.id === "a4") || settings.printSizes[0];
  const single = g.basePrice + a4.price;
  const tiers = [...settings.tiers].sort((a, b) => a.min - b.min);
  const demo = designs.slice(0, 3);
  const demoColors = ["Negro", "Arena", "Uva"].map((n) => settings.colors.find((c) => c.name === n)?.hex || "#ddd");

  return (
    <div className="resell">
      <section className="resell-hero">
        <div className="wrap resell-hero-inner">
          <div>
            <h1>Revendé con Reed.</h1>
            <p>
              Vos ponés la marca y los diseños. Nosotros hacemos las remeras oversize y las estampamos.
              Packs con precio cerrado para arrancar tu emprendimiento.
            </p>
            <div className="hero-ctas">
              <a href="#packs" className="btn btn-primary">
                Ver los packs
              </a>
              <Link to="/disena" className="btn btn-outline">
                Probar el diseñador
              </Link>
            </div>
          </div>
          <div className="resell-tees" aria-hidden="true">
            {demo.map((d, i) => (
              <TeeMockup
                key={d.id}
                garment={g}
                color={demoColors[i]}
                placement={{ src: d.src, aspect: d.height / d.width || 1, widthCm: 20, x: 0.5, y: 0.3 }}
                className={`resell-tee resell-tee-${i}`}
                label=""
              />
            ))}
          </div>
        </div>
      </section>

      <section className="wrap section" id="packs">
        <h2>Packs para emprendedores</h2>
        <div className="pack-grid">
          {packs.map((p, i) => (
            <article key={p.id} className={`pack-card ${i === 1 ? "is-featured" : ""}`}>
              {i === 1 && <span className="badge">El más elegido</span>}
              <h3>{p.name}</h3>
              <p className="pack-price">{money(p.price)}</p>
              <p className="pack-unit">
                {money(p.price / p.units)} por remera
                {single > p.price / p.units && <span> (suelta sale {money(single)})</span>}
              </p>
              <ul>
                {p.perks.map((perk) => (
                  <li key={perk}>
                    <Icon name="check" size={18} /> {perk}
                  </li>
                ))}
              </ul>
              <Link to={`/disena?pack=${p.id}`} className={`btn btn-block ${i === 1 ? "btn-primary" : "btn-dark"}`}>
                Armar este pack
              </Link>
            </article>
          ))}
        </div>
        <p className="hint pack-note">
          Los talles XXL y XXXL suman {money(settings.bigSizeSurcharge)} cada uno. Si querés estampa adelante y atrás, la
          segunda se cobra aparte.
        </p>
      </section>

      <section className="wrap section">
        <h2>¿Preferís armarlo a tu medida?</h2>
        <p className="page-lead">
          En el diseñador, el descuento se aplica solo según cuántas remeras iguales llevás, en los talles que quieras.
        </p>
        <div className="table-wrap tiers-wrap">
          <table className="tiers-table">
            <thead>
              <tr>
                <th scope="col">Remeras del mismo diseño</th>
                <th scope="col">Descuento</th>
                <th scope="col">{g.name} con estampa A4</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">1 a {tiers[0] ? tiers[0].min - 1 : "∞"}</th>
                <td>Precio de lista</td>
                <td>{money(single)} c/u</td>
              </tr>
              {tiers.map((t, i) => (
                <tr key={t.min}>
                  <th scope="row">{tiers[i + 1] ? `${t.min} a ${tiers[i + 1].min - 1}` : `${t.min} o más`}</th>
                  <td>{t.pct}%</td>
                  <td>{money(single * (1 - t.pct / 100))} c/u</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="wrap section">
        <h2>Cómo funciona</h2>
        <ol className="steps">
          {STEPS.map(([title, text]) => (
            <li key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
        <p className="hint">Tiempo de producción: {settings.productionDays} desde que se acredita el pago.</p>
      </section>

      <section className="wrap section resell-faq">
        <h2>Preguntas frecuentes</h2>
        <details>
          <summary>¿Puedo mezclar talles y colores en un pack?</summary>
          <p>Sí. Cada diseño del pack puede ir en el color y los talles que quieras, hasta completar la cantidad del pack.</p>
        </details>
        <details>
          <summary>¿Qué archivo necesito para mi diseño?</summary>
          <p>Un PNG con fondo transparente de al menos 1500 px de ancho es ideal. Si tu logo tiene fondo blanco, el diseñador te lo quita con IA.</p>
        </details>
        <details>
          <summary>¿Puedo revender los diseños de Reed?</summary>
          <p>Sí, los diseños de nuestro catálogo los podés usar en tus remeras para vender. Lo que no podemos estampar son marcas o personajes de otros.</p>
        </details>
        <details>
          <summary>Necesito más de 60 remeras o algo especial</summary>
          <p>
            Escribinos y te armamos un presupuesto.{" "}
            <a className="link" href={whatsappFor("¡Hola Reed! Quiero un presupuesto para revender remeras.")} target="_blank" rel="noreferrer">
              Hablar por WhatsApp
            </a>
          </p>
        </details>
      </section>
    </div>
  );
}
