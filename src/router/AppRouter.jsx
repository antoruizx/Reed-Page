import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import HomePage from "../pages/HomePage";
import AboutUsPage from "../pages/AboutUsPage";
import Navbar from "../components/Navbar";
import ErrorPage from "../pages/ErrorPage";
import RequireAuth from "./RequireAuth";
import AdminPanelPage from "../pages/AdminPanelPage";
import SignInPage from "../pages/SignInPage";
import Footer2 from "../components/Footer2";
import Products from "../pages/Products";
import { ContactUs } from "../pages/ContactUs";
import Login from "../pages/Login";
import WhatsAppButton from "../components/WhatsAppButton";

function AppRouter() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="" element={<HomePage />} />
        <Route path="aboutUs" element={<AboutUsPage />} />
        <Route path="products" element={<Products />} />
        <Route path="signin" element={<SignInPage />} />
        <Route
          path="adminpanel"
          element={
            <RequireAuth>
              <AdminPanelPage />
            </RequireAuth>
          }
        />
        <Route path="contactUs" element={<ContactUs />} />
        <Route path="login" element={<Login />} />
        <Route path="*" element={<ErrorPage />} />
      </Routes>
      <Footer2 />
      <WhatsAppButton />
    </Router>
  );
}

export default AppRouter;
