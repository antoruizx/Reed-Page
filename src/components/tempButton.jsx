import React from "react";
import { BsWhatsapp } from "react-icons/bs";
import "../Styles/WhatsAppButton.css";

const WhatsAppButton = () => {
  const phoneNumber = "+5493814988682"; 
  const message = "Hola! Quisiera más información 😊";

  return (
    <a
      href={`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`}
      className="whatsapp-fab"
      target="_blank"
      rel="noopener noreferrer"
    >
      <BsWhatsapp size={28} />
    </a>
  );
};

export default WhatsAppButton;
