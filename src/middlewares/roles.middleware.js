import { getRolePermissions } from "../models/permiso.modelo.js";

// Backward-compatible role check (kept for docente/estudiante routes)
export const verificarRol = (...roles) => {
  const permitidos = roles.flat();
  return (req, res, next) => {
    if (!permitidos.includes(req.usuario?.rol)) {
      return res.status(403).json({
        error: "Acceso denegado",
        rol_requerido: permitidos,
        tu_rol: req.usuario?.rol,
      });
    }
    next();
  };
};

// Permission-based middleware.
// Always queries the DB so that permission changes take effect immediately,
// without requiring the user to re-login.
export const verificarPermiso = (...permisosRequeridos) => {
  const permitidos = permisosRequeridos.flat();
  return async (req, res, next) => {
    try {
      const rolId = req.usuario?.rol_id;
      if (!rolId) {
        return res.status(403).json({ error: "Acceso denegado", detalle: "rol_id no encontrado en el token" });
      }

      const permisos = await getRolePermissions(rolId);

      // Si se requiere algún permiso de la lista, verificar si el usuario tiene al menos uno
      if (permitidos.length > 0 && !permitidos.some(p => permisos.includes(p))) {
        return res.status(403).json({
          error: "Acceso denegado",
          permisos_requeridos: permitidos,
        });
      }
      next();
    } catch (error) {
      res.status(500).json({ error: "Error al verificar permisos" });
    }
  };
};
