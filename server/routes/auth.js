import { Router } from "express";
import User from "../models/User.js";
import { config } from "../config.js";
import { requireAuth, signToken } from "../middleware/auth.js";
import { badRequest, unauthorized } from "../errors.js";

const router = Router();

router.post("/register", async (req, res) => {
  const { name, email, phone, password } = req.body ?? {};
  if (!password || password.length < 8) {
    throw badRequest("La contraseña tiene que tener al menos 8 caracteres", {
      password: "Mínimo 8 caracteres",
    });
  }
  const normalized = String(email || "").trim().toLowerCase();
  if (await User.exists({ email: normalized })) {
    throw badRequest("Ya hay una cuenta con ese email. Probá iniciar sesión.", {
      email: "Ya está registrado",
    });
  }
  const user = await User.create({
    name,
    email: normalized,
    phone,
    password,
    role: config.adminEmail && normalized === config.adminEmail ? "admin" : "customer",
  });
  res.status(201).json({ token: signToken(user), user: user.toPublic() });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  const user = await User.findOne({ email: String(email || "").trim().toLowerCase() }).select(
    "+password"
  );
  if (!user || !(await user.checkPassword(String(password || "")))) {
    throw unauthorized("El email o la contraseña no coinciden");
  }
  res.json({ token: signToken(user), user: user.toPublic() });
});

// Devuelve el usuario logueado (sirve también para validar el token)
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user.toPublic() });
});

router.patch("/me", requireAuth, async (req, res) => {
  const { name, phone } = req.body ?? {};
  if (name !== undefined) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;
  await req.user.save();
  res.json({ user: req.user.toPublic() });
});

export default router;
