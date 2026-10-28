import jwt from "jsonwebtoken";
import { config } from "../config.js";
import User from "../models/User.js";
import { forbidden, unauthorized } from "../errors.js";

export function signToken(user) {
  return jwt.sign({ id: user._id.toString(), role: user.role }, config.jwtSecret, {
    expiresIn: "7d",
  });
}

function readToken(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  return scheme === "Bearer" && token ? token : null;
}

// Si viene un token válido, deja req.user; si no, sigue igual (para compras sin cuenta)
export async function optionalAuth(req, _res, next) {
  const token = readToken(req);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = await User.findById(payload.id);
  } catch {
    // token vencido o inválido: lo tratamos como visitante
  }
  next();
}

export async function requireAuth(req, _res, next) {
  const token = readToken(req);
  if (!token) throw unauthorized();
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw unauthorized("Tu sesión venció. Iniciá sesión de nuevo.");
  }
  // Leemos el usuario de la base para que un cambio de rol se aplique al instante
  const user = await User.findById(payload.id);
  if (!user) throw unauthorized();
  req.user = user;
  next();
}

export function requireAdmin(req, _res, next) {
  if (req.user?.role !== "admin") throw forbidden();
  next();
}
