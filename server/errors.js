export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (msg, details) => new HttpError(400, msg, details);
export const unauthorized = (msg = "Tenés que iniciar sesión") => new HttpError(401, msg);
export const forbidden = (msg = "No tenés permiso para hacer esto") => new HttpError(403, msg);
export const notFound = (msg = "No encontrado") => new HttpError(404, msg);

// Middleware final de errores (Express 5 captura los errores de funciones async solo)
export function errorHandler(err, req, res, _next) {
  if (err?.name === "ValidationError") {
    const details = Object.fromEntries(
      Object.entries(err.errors).map(([k, v]) => [k, v.message])
    );
    return res.status(400).json({ message: "Revisá los datos ingresados", details });
  }
  if (err?.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "campo";
    return res.status(409).json({ message: `Ya existe un registro con ese ${field}` });
  }
  if (err?.name === "CastError") {
    return res.status(404).json({ message: "No encontrado" });
  }
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    message: status >= 500 ? "Error del servidor. Probá de nuevo en un rato." : err.message,
    ...(err.details ? { details: err.details } : {}),
  });
}
