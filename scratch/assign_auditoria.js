import pool from "../src/config/db.js";

const sql = `
INSERT INTO public.rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permisos p
WHERE r.nombre = 'ADMIN_SEGURIDAD'
  AND p.nombre = 'auditoria:ver'
ON CONFLICT DO NOTHING;
`;

console.log("Asignando permiso 'auditoria:ver' al rol 'ADMIN_SEGURIDAD'...");
pool.query(sql)
  .then(() => {
      console.log("¡Éxito! Permiso de auditoría asignado.");
      process.exit(0);
  })
  .catch((err) => {
      console.error("Error al asignar permiso:", err);
      process.exit(1);
  });
