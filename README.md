# Reed · tienda online de ropa unisex

E-commerce full stack de remeras, buzos y accesorios oversize: catálogo con filtros, carrito, checkout con **Mercado Pago (Checkout Pro)**, cuentas de usuario y un panel para administrar productos, stock y pedidos.

**Demo:** https://reed-project-gilt.vercel.app

## Stack

| Capa | Tecnología |
| --- | --- |
| Front | React 19, React Router 7, Vite 6, CSS propio (sin frameworks) |
| Back | Node.js + Express 5, corriendo como función serverless en Vercel |
| Base de datos | MongoDB Atlas + Mongoose |
| Pagos | Mercado Pago Checkout Pro + webhooks firmados |
| Auth | JWT + bcrypt, roles `customer` / `admin` |

## Qué hace

- **Tienda:** filtros por categoría, talle, color y precio; búsqueda; los filtros viven en la URL para poder compartirlos.
- **Producto:** galería, foto distinta por color, stock por combinación color + talle, aviso de "quedan pocas".
- **Carrito lateral** guardado en el navegador, con barra de envío gratis.
- **Checkout:** compra con o sin cuenta, envío a domicilio o retiro, cálculo de envío en el servidor.
- **Pagos seguros:** los precios siempre se recalculan en el servidor; el estado del pago se consulta a la API de Mercado Pago (nunca se confía en lo que manda el navegador) y el stock se descuenta una sola vez, al aprobarse el pago.
- **Mi cuenta:** historial de pedidos con su estado.
- **Panel admin:** resumen de ventas, alertas de poco stock, alta/edición de productos con grilla de stock, gestión de pedidos (preparando → enviado → entregado) y link directo al WhatsApp de cada cliente.

## Estructura

```
api/index.js          → entrada de la API en Vercel
server/
  app.js              → app de Express (rutas + errores)
  models/             → User, Product, Order
  routes/             → auth, products, orders, payments, admin
  lib/payments.js     → Mercado Pago: preferencias, webhooks, stock
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

## Deploy en Vercel

1. Importá el repo en Vercel (detecta Vite solo; la API sale de la carpeta `api/`).
2. En **Settings → Environment Variables** cargá todo lo de `.env.example`, con `SITE_URL=https://tu-dominio.vercel.app`.
3. En MongoDB Atlas → **Network Access**, permití `0.0.0.0/0` (Vercel no tiene IP fija).
4. En Mercado Pago → **Webhooks**, configurá `https://tu-dominio.vercel.app/api/payments/webhook` con el evento **Pagos** y copiá la clave secreta en `MP_WEBHOOK_SECRET`.
5. Cuando esté todo probado, cambiá el token de prueba por el de producción.

## Seguridad

- El `.env` nunca se sube al repo (está en `.gitignore`).
- Contraseñas con bcrypt; el campo `password` nunca sale de la base.
- Los pedidos de invitados se ven solo con una clave aleatoria que viaja en el link.
- Los webhooks se validan con la firma `x-signature` de Mercado Pago.

---

Diseño y desarrollo: [Nadia Antonella Ruiz](https://github.com/antoruizx)
