import { getRolePermissions } from "../models/permiso.modelo.js";
import { logSeguridad } from "../services/logger.service.js";

// Backward-compatible role check (kept for docente/estudiante routes)
export const verificarRol = (...roles) => {
  const permitidos = roles.flat();
  return (req, res, next) => {
    if (!permitidos.includes(req.usuario?.rol)) {
      logSeguridad({
        evento: "ACCESO_DENEGADO",
        exito: false,
        usuario_id: req.usuario?.id,
        email: req.usuario?.email,
        req,
        detalle: {
          rol_requerido: permitidos,
          rol_actual: req.usuario?.rol || null,
        },
      }).catch(() => { });

      // No exponemos qué rol se requería ni cuál es el rol actual — solo
      // mensaje genérico. La info detallada queda en log_seguridad para
      // que el admin pueda auditar.
      return res.status(403).json({ error: "Acceso denegado" });
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
        logSeguridad({
          evento: "ACCESO_DENEGADO",
          exito: false,
          usuario_id: req.usuario?.id,
          email: req.usuario?.email,
          req,
          detalle: { motivo: "ROL_ID_AUSENTE" },
        }).catch(() => { });
        return res.status(403).json({ error: "Acceso denegado" });
      }

      const permisos = await getRolePermissions(rolId);

      // Si se requiere algún permiso de la lista, verificar si el usuario tiene al menos uno
      if (permitidos.length > 0 && !permitidos.some(p => permisos.includes(p))) {
        logSeguridad({
          evento: "PERMISO_DENEGADO",
          exito: false,
          usuario_id: req.usuario?.id,
          email: req.usuario?.email,
          req,
          detalle: {
            permisos_requeridos: permitidos,
            permisos_actuales: permisos,
          },
        }).catch(() => { });

        // No exponemos qué permiso se necesita — el atacante no debe saber
        // qué buscar. La info queda en log_seguridad para auditoría.
        return res.status(403).json({ error: "Acceso denegado" });
      }
      next();
    } catch (error) {
      // No exponer error interno al cliente
      res.status(500).json({ error: "Error al verificar permisos" });
    }
  };
};
