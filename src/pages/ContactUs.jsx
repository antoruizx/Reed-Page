import React, { useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import "../Styles/Contact.css";

export const ContactUs = () => {
  const form = useRef();
  const [status, setStatus] = useState(null); // "success" | "error"

  const sendEmail = (e) => {
    e.preventDefault();
    setStatus(null);

    emailjs
      .sendForm(
        "service_vv47q89",
        "template_nos9a0j",
        form.current,
        "G7FPGLf5_C4hkZ4f4"
      )
      .then(
        (result) => {
          console.log("✅ Email enviado:", result.text);
          setStatus("success");
          form.current.reset();
        },
        (error) => {
          console.error("❌ Error al enviar:", error.text);
          setStatus("error");
        }
      );
  };

  return (
    <div className="contact-container text-center py-5">
      <h1 className="contact-title">
        Contact <span>Here</span>
      </h1>

      <form ref={form} onSubmit={sendEmail} className="contact-form mx-auto">
        <input type="text" name="user_name" placeholder="Tu nombre" required />
        <input
          type="email"
          name="user_email"
          placeholder="example@gmail.com"
          required
        />
        <input
          type="tel"
          name="user_phone"
          placeholder="+549..."
          pattern="[\+0-9\s-]+"
          title="Solo números y símbolo +"
          required
        />
        <textarea
          name="message"
          rows="5"
          placeholder="Escribí tu mensaje..."
          required
        ></textarea>

        <button type="submit" className="btn-verde">
          Enviar mensaje
        </button>
      </form>

      {status === "success" && (
        <p className="alert alert-success mt-3">✅ Enviado correctamente</p>
      )}
      {status === "error" && (
        <p className="alert alert-danger mt-3">
          ❌ Hubo un error. Intentá nuevamente.
        </p>
      )}
    </div>
  );
};
