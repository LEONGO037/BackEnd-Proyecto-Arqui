/**
 * Script de seed: crea las 4 cuentas de prueba que usan las pruebas ATDD
 * del Entregable #6 (repo ATDD-XCN).
 *
 * Uso:
 *   cd BackEnd-Proyecto-Arqui
 *   node scripts/seed-test-accounts.js
 *
 * El script lee las credenciales de la BD desde el .env del backend
 * (las mismas que usa src/config/db.js). Es idempotente: si una cuenta
 * ya existe con ese email, le ACTUALIZA el password_hash y el flag
 * debe_cambiar_password para que coincida con lo que esperan los tests.
 *
 * Cuentas creadas:
 *   1) estudiante.test@ucb.edu.bo   rol ESTUDIANTE     debe_cambiar=false
 *   2) docente.test@ucb.edu.bo      rol DOCENTE        debe_cambiar=false
 *   3) admin.test@ucb.edu.bo        rol ADMINISTRADOR  debe_cambiar=false
 *   4) docente.cambio@ucb.edu.bo    rol DOCENTE        debe_cambiar=TRUE   (para TC-003 y TC-012)
 *
 * Las 4 cuentas se crean con email_verificado=TRUE, intentos_fallidos=0
 * y bloqueado_hasta=NULL, listas para login inmediato.
 */

import pool from "../src/config/db.js";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12; // mismo valor que autenticacion.servicio.js

const TEST_ACCOUNTS = [
  {
    email: "estudiante.test@ucb.edu.bo",
    password: "Estudiante#2026!ok",
    nombre: "Estudiante",
    apellido_paterno: "Test",
    apellido_materno: "ATDD",
    rol: "ESTUDIANTE",
    debe_cambiar_password: false,
  },
  {
    email: "docente.test@ucb.edu.bo",
    password: "Docente#2026!ok",
    nombre: "Docente",
    apellido_paterno: "Test",
    apellido_materno: "ATDD",
    rol: "DOCENTE",
    debe_cambiar_password: false,
  },
  {
    email: "admin.test@ucb.edu.bo",
    password: "Admin#2026!ok",
    nombre: "Admin",
    apellido_paterno: "Test",
    apellido_materno: "ATDD",
    rol: "ADMINISTRADOR",
    debe_cambiar_password: false,
  },
  {
    email: "docente.cambio@ucb.edu.bo",
    password: "TempCambio#2026",
    nombre: "Docente",
    apellido_paterno: "Cambio",
    apellido_materno: "Forzado",
    rol: "DOCENTE",
    debe_cambiar_password: true, // <-- clave para TC-003 (cambio exitoso)
  },
  {
    // Cuenta separada para TC-012 (validacion de coincidencia).
    // Necesaria porque TC-003 consume la flag debe_cambiar_password de la
    // cuenta anterior tras cambiar el password exitosamente. Mantener 2
    // cuentas garantiza que ambos tests sean reproducibles.
    email: "docente.cambio2@ucb.edu.bo",
    password: "TempCambio2#2026",
    nombre: "Docente",
    apellido_paterno: "Cambio",
    apellido_materno: "Coincidencia",
    rol: "DOCENTE",
    debe_cambiar_password: true, // <-- clave para TC-012 (validacion no coinciden)
  },
];

async function obtenerRolId(nombreRol) {
  const res = await pool.query(
    "SELECT id, nombre FROM roles WHERE nombre = $1",
    [nombreRol]
  );
  if (res.rows.length === 0) {
    // Intentar alias comunes
    const alias = {
      ADMINISTRADOR: ["ADMIN", "ADMINISTRATOR", "ADMIN_CUENTAS"],
    };
    if (alias[nombreRol]) {
      for (const a of alias[nombreRol]) {
        const r = await pool.query(
          "SELECT id, nombre FROM roles WHERE nombre = $1",
          [a]
        );
        if (r.rows.length > 0) {
          console.log(`   [info] rol ${nombreRol} no existe, usando alias ${a}`);
          return r.rows[0].id;
        }
      }
    }
    throw new Error(
      `No se encontro el rol "${nombreRol}" en la tabla roles. ` +
        `Roles disponibles: ${await listarRolesDisponibles()}`
    );
  }
  return res.rows[0].id;
}

async function listarRolesDisponibles() {
  const res = await pool.query("SELECT nombre FROM roles ORDER BY id");
  return res.rows.map((r) => r.nombre).join(", ");
}

async function upsertCuenta(cuenta) {
  const rolId = await obtenerRolId(cuenta.rol);
  const passwordHash = await bcrypt.hash(cuenta.password, SALT_ROUNDS);

  const res = await pool.query(
    `
    INSERT INTO usuarios
      (nombre, apellido_paterno, apellido_materno, email, password_hash, rol_id,
       email_verificado, debe_cambiar_password, intentos_fallidos, bloqueado_hasta,
       activo)
    VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7, 0, NULL, TRUE)
    ON CONFLICT (email) DO UPDATE
      SET password_hash         = EXCLUDED.password_hash,
          email_verificado      = TRUE,
          debe_cambiar_password = EXCLUDED.debe_cambiar_password,
          intentos_fallidos     = 0,
          bloqueado_hasta       = NULL,
          activo                = TRUE,
          rol_id                = EXCLUDED.rol_id,
          nombre                = EXCLUDED.nombre,
          apellido_paterno      = EXCLUDED.apellido_paterno,
          apellido_materno      = EXCLUDED.apellido_materno
    RETURNING id, email, rol_id, (xmax = 0) AS inserted
    `,
    [
      cuenta.nombre,
      cuenta.apellido_paterno,
      cuenta.apellido_materno,
      cuenta.email,
      passwordHash,
      rolId,
      cuenta.debe_cambiar_password,
    ]
  );
  const row = res.rows[0];
  return {
    id: row.id,
    email: row.email,
    accion: row.inserted ? "INSERTADA" : "ACTUALIZADA",
  };
}

async function main() {
  console.log("Seed de cuentas de prueba ATDD — Entregable #6");
  console.log("================================================");

  // Conexion rapida (no usar el "console.log Conectado a Supabase" del pool)
  try {
    await pool.query("SELECT 1");
  } catch (err) {
    console.error("ERROR: no se pudo conectar a la BD. Revisa el .env.");
    console.error(err.message);
    process.exit(1);
  }

  console.log("Roles disponibles en la BD:", await listarRolesDisponibles());
  console.log("");

  for (const cuenta of TEST_ACCOUNTS) {
    try {
      const r = await upsertCuenta(cuenta);
      console.log(
        `  [OK] ${r.accion.padEnd(11)} id=${r.id}  ${r.email}  (rol ${cuenta.rol}, debe_cambiar=${cuenta.debe_cambiar_password})`
      );
    } catch (err) {
      console.error(`  [FAIL] ${cuenta.email}: ${err.message}`);
    }
  }

  console.log("");
  console.log("Listo. Ahora puedes correr las pruebas ATDD desde ATDD-XCN/:");
  console.log("  mvn clean compile test");
  console.log("");

  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Fallo inesperado:", err);
  process.exit(1);
});
