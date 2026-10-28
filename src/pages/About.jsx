import { Link } from "react-router";
import { usePageTitle } from "../components/usePageTitle";

// Medidas de referencia con la prenda apoyada plana. Reemplazalas por las reales de tu molde.
const TEE_SIZES = [
  ["S", 56, 72],
  ["M", 59, 74],
  ["L", 62, 76],
  ["XL", 65, 78],
  ["XXL", 68, 80],
];
const HOODIE_SIZES = [
  ["S", 60, 68],
  ["M", 63, 70],
  ["L", 66, 72],
  ["XL", 69, 74],
  ["XXL", 72, 76],
];

function SizeTable({ caption, rows }) {
  return (
    <table className="size-table">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">Talle</th>
          <th scope="col">Ancho (axila a axila)</th>
          <th scope="col">Largo</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([s, w, l]) => (
          <tr key={s}>
            <th scope="row">{s}</th>
            <td>{w} cm</td>
            <td>{l} cm</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function About() {
  usePageTitle("Nosotros");
  return (
    <div className="about">
      <section className="wrap page about-intro">
        <h1 className="page-title">Ropa que se usa hasta gastarla.</h1>
        <div className="about-cols">
          <p>
            Reed nació con una idea simple: prendas originales, cómodas y fáciles de combinar, que
            se puedan comprar de a una o por cantidad. Vendemos por menor y también por mayor a
            marcas, emprendimientos y empresas.
          </p>
          <p>
            Nos gusta que cada diseño se pueda hacer realidad. Si tenés una idea para tu marca,
            tu equipo o tu evento, la estampamos con vos.
          </p>
        </div>
        <img className="about-photo" src="/img/products/remera-chaos-uva.jpg" alt="Dos personas de espaldas con remeras color uva estampadas" width="1200" height="800" />
      </section>

      <section className="wrap section about-quality">
        <h2>De qué están hechas</h2>
        <dl className="materials">
          <div>
            <dt>Remeras</dt>
            <dd>
              Jersey peinado 100% algodón. Cuello con rib que vuelve a su forma y tintura con
              fijador, para que el color aguante los lavados.
            </dd>
          </div>
          <div>
            <dt>Buzos</dt>
            <dd>
              Frisa invisible de algodón y poliéster: abriga, seca rápido y no hace bolitas. Calce
              amplio, puño y cintura con rib.
            </dd>
          </div>
          <div>
            <dt>Accesorios</dt>
            <dd>Pilusos, gorras, vinchas y collares que van cambiando con cada temporada.</dd>
          </div>
        </dl>
      </section>

      <section className="wrap section" id="talles">
        <h2>Guía de talles</h2>
        <p className="page-lead">
          Medí una remera o buzo que te quede como te gusta, apoyado plano, y compará. Todo es de
          calce oversize: si preferís algo más al cuerpo, elegí un talle menos.
        </p>
        <div className="size-tables">
          <SizeTable caption="Remeras" rows={TEE_SIZES} />
          <SizeTable caption="Buzos" rows={HOODIE_SIZES} />
        </div>
      </section>

      <section className="wrap section" id="envios">
        <h2>Envíos y cambios</h2>
        <div className="about-cols">
          <p>
            Enviamos a todo el país por correo y despachamos dentro de las 48 horas hábiles de
            confirmado el pago. También podés retirar sin costo en San Miguel de Tucumán.
          </p>
          <p>
            Si el talle no te queda, lo cambiamos dentro de los 30 días. La prenda tiene que estar
            sin uso y con su etiqueta. Escribinos por WhatsApp con tu número de pedido.
          </p>
        </div>
        <Link to="/contacto" className="btn btn-outline">
          Escribinos
        </Link>
      </section>
    </div>
  );
}
