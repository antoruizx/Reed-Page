# Reed · tienda online de ropa unisex

E-commerce full stack de remeras, buzos y accesorios oversize: catálogo con filtros, carrito, checkout con **Mercado Pago (Checkout Pro)**, cuentas de usuario y un panel para administrar productos, stock y pedidos.

Lo distinto: un **diseñador de remeras** donde elegís modelo, color y diseño (de Reed, tuyo o creado con IA), lo ves puesto, y el precio se calcula al instante con descuentos por cantidad. Más **packs para revendedores** con precio cerrado.

**Demo:** https://reed-project-gilt.vercel.app

## Stack

| Capa | Tecnología |
| --- | --- |
| Front | React 19, React Router 7, Vite 6, CSS propio (sin frameworks) |
| Back | Node.js + Express 5, corriendo como función serverless en Vercel |
| Base de datos | MongoDB Atlas + Mongoose |
| Pagos | Mercado Pago Checkout Pro + webhooks firmados |
| IA | Quitar fondo: `@imgly/background-removal` (en el navegador). Crear diseños: OpenAI Images (`gpt-image-1`) |
| Auth | JWT + bcrypt, roles `customer` / `admin` |

## Qué hace

- **Tienda:** filtros por categoría, talle, color y precio; búsqueda; los filtros viven en la URL para poder compartirlos.
- **Producto:** galería, foto distinta por color, stock por combinación color + talle, aviso de "quedan pocas".
- **Carrito lateral** guardado en el navegador, con barra de envío gratis.
- **Checkout:** compra con o sin cuenta, envío a domicilio o retiro, cálculo de envío en el servidor.
- **Pagos seguros:** los precios siempre se recalculan en el servidor; el estado del pago se consulta a la API de Mercado Pago (nunca se confía en lo que manda el navegador) y el stock se descuenta una sola vez, al aprobarse el pago.
- **Mi cuenta:** historial de pedidos con su estado.
- **Diseñá tu remera** (`/disena`):
  - 4 modelos (Oversize Boxy, Clásica, Larga y Baby Tee) dibujados en SVG, que cambian de color al instante.
  - Diseño adelante, atrás o en los dos lados; se arrastra con el mouse, el dedo o las flechas del teclado.
  - El tamaño de estampa (chico, A4, A3) y su precio salen solos de lo que mide el diseño.
  - Subir tu imagen (con **quitar el fondo con IA**, en el navegador) o **crear un diseño desde un texto** con la API de imágenes de OpenAI.
  - Talles mezclados y descuento automático por cantidad (10%, 15%, 20%).
- **Revendé con Reed** (`/revende`): packs Mini, Arranque y Marca con precio cerrado, armados desde el mismo diseñador.
- **Panel admin:** precios de remeras, estampas, colores, descuentos y packs editables; catálogo de diseños; ficha de producción de cada personalizada (medidas, posición y archivo para descargar); resumen de ventas, alertas de poco stock, alta/edición de productos con grilla de stock, gestión de pedidos (preparando → enviado → entregado) y link directo al WhatsApp de cada cliente.

## Estructura

```
api/index.js          → entrada de la API en Vercel
server/
  app.js              → app de Express (rutas + errores)
  models/             → User, Product, Order
  routes/             → auth, products, orders, payments, admin
  lib/payments.js     → Mercado Pago: preferencias, webhooks, stock
  lib/custom.js       → arma y valida remeras personalizadas y packs
shared/pricing.js     → precios de personalizadas (lo usan front y back)
  seed.js             → carga productos de ejemplo
src/
  pages/              → Home, Tienda, Producto, Checkout, Pedido, Cuenta…
  pages/admin/        → panel (se descarga solo si sos admin)
  context/            → sesión y carrito
  styles/             → sistema visual
public/img/           → fotos optimizadas
```

## Correrlo en tu compu

Necesitás Node 20 o más nuevo.

```bash
npm install
cp .env.example .env      # y completá los valores
npm run seed              # carga los productos de ejemplo
npm run dev               # front en :5173 y API en :8000
```

Abrí http://localhost:5173. Para ser admin, registrate con el email que pusiste en `ADMIN_EMAIL` (o corré `npm run make-admin -- tu@email.com`).

### Probar pagos sin plata real

1. En [Mercado Pago Developers](https://www.mercadopago.com.ar/developers/panel/app) creá una aplicación (Checkout Pro).
2. Copiá el **Access Token de prueba** en `MP_ACCESS_TOKEN`.
3. Creá **cuentas de prueba** (una vendedora y una compradora) y pagá con la compradora usando las [tarjetas de prueba](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/your-integrations/test/cards).

En local los webhooks no llegan (Mercado Pago necesita una URL pública), pero no importa: al volver de Mercado Pago la página del pedido verifica el pago sola.

### Activar la creación de diseños con IA

1. Creá una API key en [platform.openai.com](https://platform.openai.com/api-keys) y cargale saldo.
2. Ponela en `OPENAI_API_KEY`. Cada diseño cuesta unos centavos de dólar según la calidad (`OPENAI_IMAGE_QUALITY`).
3. `AI_DAILY_LIMIT` limita cuántos diseños puede crear cada persona por día (las admins no tienen límite). Solo se puede crear con la sesión iniciada.

Sin la key, la pestaña "Crear con IA" avisa que se activa pronto y el resto del diseñador funciona igual.

## Deploy en Vercel

1. Importá el repo en Vercel (detecta Vite solo; la API sale de la carpeta `api/`).
2. En **Settings → Environment Variables** cargá todo lo de `.env.example`, con `SITE_URL=https://tu-dominio.vercel.app`.
3. En MongoDB Atlas → **Network Access**, permití `0.0.0.0/0` (Vercel no tiene IP fija).
4. En Mercado Pago → **Webhooks**, configurá `https://tu-dominio.vercel.app/api/payments/webhook` con el evento **Pagos** y copiá la clave secreta en `MP_WEBHOOK_SECRET`.
5. Cuando esté todo probado, cambiá el token de prueba por el de producción.

## Precios de las personalizadas

Todo se edita desde **Panel → Personalizadas**. Fórmula:

```
precio por remera = remera lisa (según modelo, + recargo XXL/XXXL) + estampa de cada lado (según tamaño)
total = suma de todas − descuento por cantidad (sobre remeras del mismo diseño)
pack = precio cerrado + segunda estampa (si lleva adelante y atrás) + recargo de talles grandes
```

Los valores iniciales son de ejemplo: ajustalos con tus costos reales.

## Seguridad

- El `.env` nunca se sube al repo (está en `.gitignore`).
- Contraseñas con bcrypt; el campo `password` nunca sale de la base.
- Los pedidos de invitados se ven solo con una clave aleatoria que viaja en el link.
- Los webhooks se validan con la firma `x-signature` de Mercado Pago.
- Los diseños subidos se validan por contenido (PNG, JPG o WEBP reales, hasta 3 MB). No se aceptan SVG de clientes porque pueden traer código: el navegador los convierte a PNG antes de subirlos.

## Licencias

`@imgly/background-removal` es AGPL-3.0: como este repo es público, cumplís la licencia. Si algún día el código pasa a ser privado, hay que comprar su licencia comercial o cambiar a otro servicio para quitar fondos.

---

Diseño y desarrollo: [Nadia Antonella Ruiz](https://github.com/antoruizx)
