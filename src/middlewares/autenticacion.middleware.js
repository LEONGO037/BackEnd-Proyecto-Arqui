import jwt from "jsonwebtoken";

export const verificarToken = (req, res, next) => {

  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: "Token no proporcionado" });
  }

  const token = header.split(" ")[1];

  try {

    const decodificado = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decodificado;

    next();

  } catch (error) {

    return res.status(401).json({ error: "Token inválido o expirado" });

  }
};
