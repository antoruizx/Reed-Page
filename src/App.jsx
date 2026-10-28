import { lazy, Suspense } from "react";
import { Route, Routes, useLocation } from "react-router";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import WhatsappButton from "./components/WhatsappButton";
import ScrollToTop from "./components/ScrollToTop";
import RequireAuth from "./components/RequireAuth";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductPage from "./pages/ProductPage";
import Checkout from "./pages/Checkout";
import OrderPage from "./pages/OrderPage";
import { Login, Register } from "./pages/Auth";
import Account from "./pages/Account";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

// El panel solo lo descargan las admins
const Admin = lazy(() => import("./pages/admin/Admin"));

export default function App() {
  const { pathname } = useLocation();
  const inAdmin = pathname.startsWith("/admin");

  return (
    <>
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>
      <ScrollToTop />
      <Header />
      <main id="contenido">
        <Suspense fallback={<div className="spinner" role="status" aria-label="Cargando" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tienda" element={<Shop />} />
            <Route path="/producto/:slug" element={<ProductPage />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/pedido/:id" element={<OrderPage />} />
            <Route path="/ingresar" element={<Login />} />
            <Route path="/registro" element={<Register />} />
            <Route
              path="/cuenta"
              element={
                <RequireAuth>
                  <Account />
                </RequireAuth>
              }
            />
            <Route path="/nosotros" element={<About />} />
            <Route path="/contacto" element={<Contact />} />
            <Route
              path="/admin/*"
              element={
                <RequireAuth admin>
                  <Admin />
                </RequireAuth>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {!inAdmin && <Footer />}
      <CartDrawer />
      {!inAdmin && <WhatsappButton />}
    </>
  );
}
