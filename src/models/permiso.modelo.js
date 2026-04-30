import pool from "../config/db.js";

export const getRolePermissions = async (rolId) => {
  const res = await pool.query(
    `SELECT p.nombre
     FROM permisos p
     JOIN rol_permisos rp ON rp.permiso_id = p.id
     WHERE rp.rol_id = $1 AND p.activo = TRUE`,
    [rolId]
  );
  return res.rows.map((r) => r.nombre);
};

export const getAllRoles = async () => {
  const rolesRes = await pool.query(
    `SELECT r.id, r.nombre, r.descripcion, r.activo,
            COALESCE(json_agg(p.nombre) FILTER (WHERE p.nombre IS NOT NULL), '[]') AS permisos
     FROM roles r
     LEFT JOIN rol_permisos rp ON rp.rol_id = r.id
     LEFT JOIN permisos p ON p.id = rp.permiso_id AND p.activo = TRUE
     GROUP BY r.id
     ORDER BY r.id`
  );
  return rolesRes.rows;
};

export const getAllPermisos = async () => {
  const res = await pool.query(
    `SELECT id, nombre, descripcion, activo FROM permisos ORDER BY nombre`
  );
  return res.rows;
};

export const createRole = async (nombre, descripcion) => {
  const res = await pool.query(
    `INSERT INTO roles (nombre, descripcion) VALUES ($1, $2) RETURNING *`,
    [nombre, descripcion]
  );
  return res.rows[0];
};

export const updateRole = async (id, nombre, descripcion) => {
  const res = await pool.query(
    `UPDATE roles SET nombre = $1, descripcion = $2 WHERE id = $3 RETURNING *`,
    [nombre, descripcion, id]
  );
  return res.rows[0];
};

export const deleteRole = async (id) => {
  // Block deletion if users are still assigned to this role
  const usersRes = await pool.query(
    `SELECT COUNT(*) FROM usuarios WHERE rol_id = $1`, [id]
  );
  if (parseInt(usersRes.rows[0].count) > 0) {
    const err = new Error('No se puede eliminar el rol porque tiene usuarios asignados. Reasigna los usuarios primero.');
    err.status = 409;
    throw err;
  }
  // Remove permission assignments first, then the role
  await pool.query(`DELETE FROM rol_permisos WHERE rol_id = $1`, [id]);
  await pool.query(`DELETE FROM roles WHERE id = $1`, [id]);
};

export const createPermiso = async (nombre, descripcion) => {
  const res = await pool.query(
    `INSERT INTO permisos (nombre, descripcion) VALUES ($1, $2) RETURNING *`,
    [nombre, descripcion]
  );
  return res.rows[0];
};

export const assignPermisoToRol = async (rolId, permisoId) => {
  await pool.query(
    `INSERT INTO rol_permisos (rol_id, permiso_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [rolId, permisoId]
  );
};

export const removePermisoFromRol = async (rolId, permisoId) => {
  await pool.query(
    `DELETE FROM rol_permisos WHERE rol_id = $1 AND permiso_id = $2`,
    [rolId, permisoId]
  );
};

export const getUserWithPermissions = async (userId) => {
  const res = await pool.query(
    `SELECT u.id, u.nombre, u.apellido_paterno, u.email, u.rol_id,
            r.nombre AS rol_nombre,
            COALESCE(json_agg(p.nombre) FILTER (WHERE p.nombre IS NOT NULL), '[]') AS permisos
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     LEFT JOIN rol_permisos rp ON rp.rol_id = r.id
     LEFT JOIN permisos p ON p.id = rp.permiso_id AND p.activo = TRUE
     WHERE u.id = $1
     GROUP BY u.id, r.nombre`,
    [userId]
  );
  return res.rows[0];
};

export const getAccessMatrix = async () => {
  const rolesRes = await pool.query(`SELECT id, nombre FROM roles ORDER BY nombre`);
  const permisosRes = await pool.query(`SELECT nombre FROM permisos WHERE activo = TRUE ORDER BY nombre`);

  const roles = rolesRes.rows.map((r) => r.nombre);
  const permisos = permisosRes.rows.map((p) => p.nombre);

  const asignaciones = await pool.query(
    `SELECT r.nombre AS rol, p.nombre AS permiso
     FROM rol_permisos rp
     JOIN roles r ON r.id = rp.rol_id
     JOIN permisos p ON p.id = rp.permiso_id
     WHERE p.activo = TRUE`
  );

  const matriz = {};
  for (const rol of roles) {
    matriz[rol] = {};
    for (const permiso of permisos) {
      matriz[rol][permiso] = false;
    }
  }
  for (const row of asignaciones.rows) {
    if (matriz[row.rol]) matriz[row.rol][row.permiso] = true;
  }

  return { roles, permisos, matriz };
};

export const getUserRol = async (userId) => {
  const res = await pool.query(
    `SELECT u.rol_id, r.nombre AS rol_nombre
     FROM usuarios u JOIN roles r ON r.id = u.rol_id WHERE u.id = $1`,
    [userId]
  );
  return res.rows[0];
};

export const updateUserRol = async (userId, rolId) => {
  const res = await pool.query(
    `UPDATE usuarios SET rol_id = $1 WHERE id = $2 RETURNING id, nombre, email, rol_id`,
    [rolId, userId]
  );
  return res.rows[0];
};

export const getAllUsuariosConRol = async () => {
  const res = await pool.query(
    `SELECT u.id, u.nombre, u.apellido_paterno, u.email,
            r.nombre AS rol_nombre, u.rol_id,
            u.bloqueado_hasta, u.intentos_fallidos,
            u.email_verificado
     FROM usuarios u
     LEFT JOIN roles r ON r.id = u.rol_id
     ORDER BY u.id`
  );
  return res.rows;
};

export const deleteUsuarioById = async (id) => {
  await pool.query(`DELETE FROM usuarios WHERE id = $1`, [id]);
};
