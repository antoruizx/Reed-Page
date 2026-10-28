import { Router } from "express";
import { isValidSignature, syncPayment } from "../lib/payments.js";

const router = Router();

// Mercado Pago avisa acá cada vez que un pago cambia de estado.
// Respondemos 200 rápido; si respondemos error, MP reintenta más tarde.
router.post("/webhook", async (req, res) => {
  const type = req.body?.type || req.query.type || req.query.topic;
  const dataId = req.body?.data?.id || req.query["data.id"] || req.query.id;

  if (type !== "payment" || !dataId) return res.sendStatus(200);
  if (!isValidSignature(req, String(req.query["data.id"] || dataId))) {
    console.warn("Webhook con firma inválida, se ignora");
    return res.sendStatus(401);
  }

  try {
    await syncPayment(dataId);
    res.sendStatus(200);
  } catch (err) {
    console.error("Error procesando webhook de MP:", err.message);
    res.sendStatus(500); // MP va a reintentar
  }
});

export default router;
