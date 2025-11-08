import React from "react";
import "../Styles/PaymentMethods.css";
import visa from "../assets/img/visa.svg";
import mastercard from "../assets/img/mastercard.webp";
import mp from "../assets/img/mercadopago.png";
import amex from "../assets/img/americanexpress.png";

const PaymentMethods = () => {
  return (
    <section className="payment-section text-center py-4">
      <h4 className="payment-title mb-3">Formas de pago</h4>
      <div className="payment-icons d-flex justify-content-center align-items-center flex-wrap gap-4">
        <img src={visa} alt="Visa" className="payment-icon" />
        <img src={mastercard} alt="MasterCard" className="payment-icon" />
        <img src={mp} alt="Mercado Pago" className="payment-icon" />
        <img src={amex} alt="American Express" className="payment-icon" />
      </div>
    </section>
  );
};

export default PaymentMethods;
