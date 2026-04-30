import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const verificarToken = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Token no proporcionado" });

  const token = header.split(" ")[1];
  try {
    const decodificado = jwt.verify(token, process.env.JWT_SECRET, {
      audience: "college-x-nexus",
      issuer: "ucb-api",
    });

    // Reject tokens issued before last password change
    const res2 = await pool.query(
      "SELECT password_cambiado_en FROM usuarios WHERE id = $1",
      [decodificado.id]
    );
    const row = res2.rows[0];
    if (row?.password_cambiado_en) {
      const cambiadoEn = Math.floor(new Date(row.password_cambiado_en).getTime() / 1000);
      if (decodificado.iat < cambiadoEn) {
        return res.status(401).json({ error: "Token inválido: contraseña cambiada recientemente" });
      }
    }

    req.usuario = decodificado;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
};
