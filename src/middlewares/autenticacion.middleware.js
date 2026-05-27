import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { logSeguridad } from "../services/logger.service.js";

export const verificarToken = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) {
    logSeguridad({
      evento: "TOKEN_NO_PROPORCIONADO",
      exito: false,
      req,
    }).catch(() => { });
    return res.status(401).json({ error: "Token no proporcionado" });
  }

  const token = header.split(" ")[1];
  try {
    const decodificado = jwt.verify(token, process.env.JWT_SECRET, {
      audience: "college-x-nexus",
      issuer: "ucb-api",
    });

    // Reject tokens issued before last password change
    const res2 = await pool.query(
      "SELECT password_cambiado_en, activo FROM usuarios WHERE id = $1",
      [decodificado.id]
    );
    const row = res2.rows[0];

    if (!row?.activo) {
      logSeguridad({
        evento: "TOKEN_INVALIDO",
        exito: false,
        usuario_id: decodificado.id,
        email: decodificado.email,
        req,
        detalle: { motivo: "USUARIO_DESACTIVADO" },
      }).catch(() => { });
      return res.status(401).json({ error: "Token inválido: usuario desactivado" });
    }

    if (row?.password_cambiado_en) {
      const cambiadoEn = Math.floor(new Date(row.password_cambiado_en).getTime() / 1000);
      if (decodificado.iat < cambiadoEn) {
        logSeguridad({
          evento: "TOKEN_INVALIDO",
          exito: false,
          usuario_id: decodificado.id,
          email: decodificado.email,
          req,
          detalle: { motivo: "PASSWORD_CAMBIADO" },
        }).catch(() => { });
        return res.status(401).json({ error: "Token inválido: contraseña cambiada recientemente" });
      }
    }

    req.usuario = decodificado;
    next();
  } catch (err) {
    logSeguridad({
      evento: err?.name === "TokenExpiredError" ? "TOKEN_EXPIRADO" : "TOKEN_INVALIDO",
      exito: false,
      req,
      detalle: { motivo: err?.name || "JWT_INVALIDO" },
    }).catch(() => { });
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
};
