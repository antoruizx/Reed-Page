import { useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import Icon from "../components/Icon";
import { WHATSAPP_URL } from "../components/WhatsappButton";
import { usePageTitle } from "../components/usePageTitle";

// Claves públicas de EmailJS (son públicas por diseño: se usan desde el navegador)
const EMAILJS = {
  service: "service_vv47q89",
  template: "template_nos9a0j",
  publicKey: "G7FPGLf5_C4hkZ4f4",
};

export default function Contact() {
  usePageTitle("Contacto");
  const form = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  const send = async (e) => {
    e.preventDefault();
    setStatus("sending");
    try {
      await emailjs.sendForm(EMAILJS.service, EMAILJS.template, form.current, {
        publicKey: EMAILJS.publicKey,
      });
      form.current.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="wrap page contact">
      <div className="contact-intro">
        <h1 className="page-title">Hablemos.</h1>
        <p className="page-lead">
          Consultas de talles, pedidos por mayor o diseños personalizados. Por WhatsApp te
          respondemos más rápido.
        </p>
        <a href={WHATSAPP_URL} className="btn btn-primary" target="_blank" rel="noreferrer">
          <Icon name="whatsapp" size={20} /> Escribir por WhatsApp
        </a>
      </div>

      <form ref={form} onSubmit={send} className="form-grid contact-form">
        <h2>O mandanos un mensaje</h2>
        <div className="form-row">
          <div className="field">
            <label htmlFor="user_name">Nombre</label>
            <input id="user_name" name="user_name" className="input" required autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="user_phone">Teléfono</label>
            <input id="user_phone" name="user_phone" className="input" type="tel" autoComplete="tel" pattern="[\+0-9\s\-]+" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="user_email">Email</label>
          <input id="user_email" name="user_email" className="input" type="email" required autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="message">Mensaje</label>
          <textarea id="message" name="message" className="textarea" rows="5" required />
        </div>
        {status === "sent" && (
          <p className="alert alert-ok" role="status">
            Mensaje enviado. Te respondemos dentro de las 24 horas hábiles.
          </p>
        )}
        {status === "error" && (
          <p className="alert alert-error" role="alert">
            No se pudo enviar el mensaje. Probá de nuevo o escribinos por WhatsApp.
          </p>
        )}
        <button className="btn btn-dark" disabled={status === "sending"}>
          {status === "sending" ? "Enviando…" : "Enviar mensaje"}
        </button>
      </form>
    </div>
  );
}
