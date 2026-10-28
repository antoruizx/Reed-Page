import Icon from "./Icon";

const PHONE = "5493814988682";
export const WHATSAPP_URL = `https://wa.me/${PHONE}?text=${encodeURIComponent(
  "¡Hola Reed! Tengo una consulta 🙂"
)}`;

export const whatsappFor = (text) => `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`;

export default function WhatsappButton() {
  return (
    <a
      href={WHATSAPP_URL}
      className="wa-fab"
      target="_blank"
      rel="noreferrer"
      aria-label="Escribinos por WhatsApp"
    >
      <Icon name="whatsapp" size={28} />
    </a>
  );
}
