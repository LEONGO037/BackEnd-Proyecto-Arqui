export const verificarRol = (rolPermitido) => {

  return (req, res, next) => {

    if (req.usuario.rol !== rolPermitido) {
      return res.status(403).json({
        error: "No tiene permisos para acceder a esta ruta"
      });
    }

    next();
  };
};
