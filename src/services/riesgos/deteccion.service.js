import pool from "../../config/db.js";
import { logAplicacion } from "../logger.service.js";
import {
    crearRegistro,
    existeRegistroReciente,
    obtenerCatalogoPorCodigo,
} from "../../models/riesgos/riesgos.model.js";

// ===========================================================================
// Servicio de Detección Automática de Riesgos
//
// Escanea las tablas log_seguridad y log_aplicacion en una ventana de tiempo
// y, cuando encuentra patrones que coinciden con los riesgos del catálogo,
// crea un riesgo_registro automáticamente (con deduplicación).
//
// Reglas implementadas (las del Excel que son detectables desde logs):
//   RC-001 → 3+ LOGIN_FALLIDO del mismo email/IP en ventana corta
//   RC-004 → 5+ ACCESO_DENEGADO/PERMISO_DENEGADO del mismo usuario en 10 min
//   RC-005 → cualquier TOKEN_INVALIDO o TOKEN_EXPIRADO
//   RC-007 → 3+ ERROR_NO_MANEJADO con status >= 500 en mismo endpoint en 5 min
//   RC-014 → LOGIN_EXITOSO entre las 3am-5am hora local Bolivia
//   RC-015 → CAMBIO_PASSWORD sin RESET_PASSWORD_SOLICITADO previo
//
// El resto de eventos del catálogo (RC-002, RC-003, RC-006, RC-008, RC-009,
// RC-010, RC-011, RC-012, RC-013) requieren contexto adicional (geolocalización,
// historial de IP, etc.) o eventos no presentes en los logs actuales — se
// registran manualmente.
// ===========================================================================

const VENTANA_DETECCION_MIN = 30;

// ---------------------------------------------------------------------------
// Helper para crear un registro con deduplicación
// ---------------------------------------------------------------------------
const registrarSiNoExiste = async ({
    codigo, usuario_afectado_id = null, email_afectado = null, ip = null,
    detalle = {}, ventanaMinutos = 30,
}) => {
    const cat = await obtenerCatalogoPorCodigo(codigo);
    if (!cat) return null;

    const reciente = await existeRegistroReciente({
        riesgo_catalogo_id: cat.id,
        usuario_afectado_id,
        email_afectado,
        ip,
        ventanaMinutos,
    });
    if (reciente) return null;

    return crearRegistro({
        riesgo_catalogo_id: cat.id,
        origen: "AUTOMATICO",
        usuario_afectado_id,
        email_afectado,
        ip,
        detalle,
    });
};

// ---------------------------------------------------------------------------
// RC-001: 3+ LOGIN_FALLIDO o LOGIN_BLOQUEADO_RATE_LIMIT del mismo email/IP
// en los últimos 15 min. Si el rate-limit bloqueó antes de llegar al
// controlador, esos bloqueos también cuentan como intentos sospechosos.
// ---------------------------------------------------------------------------
const detectarRC001 = async () => {
    const { rows } = await pool.query(`
        SELECT email, ip, COUNT(*)::int AS intentos,
               MAX(fecha) AS ultimo_intento
          FROM public.log_seguridad
         WHERE evento IN ('LOGIN_FALLIDO', 'LOGIN_BLOQUEADO_RATE_LIMIT')
           AND fecha >= NOW() - INTERVAL '15 minutes'
         GROUP BY email, ip
        HAVING COUNT(*) >= 3
    `);

    const creados = [];
    for (const r of rows) {
        const reg = await registrarSiNoExiste({
            codigo: "RC-001",
            email_afectado: r.email,
            ip: r.ip,
            ventanaMinutos: 30,
            detalle: {
                intentos: r.intentos,
                ultimo_intento: r.ultimo_intento,
                ventana_minutos: 15,
            },
        });
        if (reg) creados.push(reg);
    }
    return creados;
};

// ---------------------------------------------------------------------------
// RC-004: 5+ accesos/permisos denegados del mismo usuario en 10 min.
// Incluye:
//   - ACCESO_DENEGADO         (middleware de rol)
//   - PERMISO_DENEGADO        (middleware de permiso)
//   - PERMISO_DENEGADO_FRONTEND (PermisoProtectedRoute bloqueó por URL directa)
//
// Para presentaciones bajamos el umbral a 3 (en producción podría subirse).
// ---------------------------------------------------------------------------
const detectarRC004 = async () => {
    const { rows } = await pool.query(`
        SELECT usuario_id, email, ip, COUNT(*)::int AS intentos
          FROM public.log_seguridad
         WHERE evento IN ('ACCESO_DENEGADO','PERMISO_DENEGADO','PERMISO_DENEGADO_FRONTEND')
           AND fecha >= NOW() - INTERVAL '10 minutes'
           AND usuario_id IS NOT NULL
         GROUP BY usuario_id, email, ip
        HAVING COUNT(*) >= 3
    `);

    const creados = [];
    for (const r of rows) {
        const reg = await registrarSiNoExiste({
            codigo: "RC-004",
            usuario_afectado_id: r.usuario_id,
            email_afectado: r.email,
            ip: r.ip,
            ventanaMinutos: 30,
            detalle: { intentos: r.intentos, ventana_minutos: 10 },
        });
        if (reg) creados.push(reg);
    }
    return creados;
};

// ---------------------------------------------------------------------------
// RC-005: TOKEN_INVALIDO o TOKEN_EXPIRADO reciente
// ---------------------------------------------------------------------------
const detectarRC005 = async () => {
    const { rows } = await pool.query(`
        SELECT usuario_id, email, ip, evento, fecha, detalle
          FROM public.log_seguridad
         WHERE evento IN ('TOKEN_INVALIDO','TOKEN_EXPIRADO')
           AND fecha >= NOW() - INTERVAL '30 minutes'
         ORDER BY fecha DESC
    `);

    const creados = [];
    for (const r of rows) {
        const reg = await registrarSiNoExiste({
            codigo: "RC-005",
            usuario_afectado_id: r.usuario_id,
            email_afectado: r.email,
            ip: r.ip,
            ventanaMinutos: 30,
            detalle: {
                evento_origen: r.evento,
                fecha_evento: r.fecha,
                motivo: r.detalle?.motivo || null,
            },
        });
        if (reg) creados.push(reg);
    }
    return creados;
};

// ---------------------------------------------------------------------------
// RC-007: 3+ errores 500 en el mismo endpoint en 5 min
// ---------------------------------------------------------------------------
const detectarRC007 = async () => {
    const { rows } = await pool.query(`
        SELECT detalle->>'ruta' AS ruta,
               COUNT(*)::int AS errores,
               MAX(fecha) AS ultimo
          FROM public.log_aplicacion
         WHERE modulo = 'express'
           AND evento = 'ERROR_NO_MANEJADO'
           AND nivel = 'ERROR'
           AND (detalle->>'status')::int >= 500
           AND fecha >= NOW() - INTERVAL '5 minutes'
         GROUP BY detalle->>'ruta'
        HAVING COUNT(*) >= 3
    `);

    const creados = [];
    for (const r of rows) {
        const reg = await registrarSiNoExiste({
            codigo: "RC-007",
            ventanaMinutos: 30,
            detalle: { ruta: r.ruta, errores: r.errores, ultimo: r.ultimo },
        });
        if (reg) creados.push(reg);
    }
    return creados;
};

// ---------------------------------------------------------------------------
// RC-014: LOGIN_EXITOSO entre 3am-5am (hora La Paz, UTC-4)
// ---------------------------------------------------------------------------
const detectarRC014 = async () => {
    const { rows } = await pool.query(`
        SELECT usuario_id, email, ip, fecha
          FROM public.log_seguridad
         WHERE evento = 'LOGIN_EXITOSO'
           AND fecha >= NOW() - INTERVAL '24 hours'
           AND EXTRACT(HOUR FROM (fecha AT TIME ZONE 'America/La_Paz')) BETWEEN 3 AND 4
    `);

    const creados = [];
    for (const r of rows) {
        const reg = await registrarSiNoExiste({
            codigo: "RC-014",
            usuario_afectado_id: r.usuario_id,
            email_afectado: r.email,
            ip: r.ip,
            ventanaMinutos: 60,
            detalle: { fecha_login: r.fecha },
        });
        if (reg) creados.push(reg);
    }
    return creados;
};

// ---------------------------------------------------------------------------
// RC-015: CAMBIO_PASSWORD sin RESET_PASSWORD_SOLICITADO previo en últimas 24h
// ---------------------------------------------------------------------------
const detectarRC015 = async () => {
    const { rows } = await pool.query(`
        SELECT s.usuario_id, s.email, s.ip, s.fecha
          FROM public.log_seguridad s
         WHERE s.evento = 'CAMBIO_PASSWORD'
           AND s.fecha >= NOW() - INTERVAL '24 hours'
           AND NOT EXISTS (
                SELECT 1
                  FROM public.log_seguridad r
                 WHERE r.evento IN ('RESET_PASSWORD_SOLICITADO','RESET_PASSWORD_COMPLETADO')
                   AND r.usuario_id = s.usuario_id
                   AND r.fecha BETWEEN s.fecha - INTERVAL '1 hour' AND s.fecha
           )
    `);

    const creados = [];
    for (const r of rows) {
        const reg = await registrarSiNoExiste({
            codigo: "RC-015",
            usuario_afectado_id: r.usuario_id,
            email_afectado: r.email,
            ip: r.ip,
            ventanaMinutos: 60,
            detalle: { fecha_cambio: r.fecha },
        });
        if (reg) creados.push(reg);
    }
    return creados;
};

// ---------------------------------------------------------------------------
// Ejecutar todas las detecciones
// ---------------------------------------------------------------------------
export const ejecutarDeteccionCompleta = async () => {
    const resultados = {
        "RC-001": [],
        "RC-004": [],
        "RC-005": [],
        "RC-007": [],
        "RC-014": [],
        "RC-015": [],
    };

    const detecciones = [
        ["RC-001", detectarRC001],
        ["RC-004", detectarRC004],
        ["RC-005", detectarRC005],
        ["RC-007", detectarRC007],
        ["RC-014", detectarRC014],
        ["RC-015", detectarRC015],
    ];

    for (const [codigo, fn] of detecciones) {
        try {
            resultados[codigo] = await fn();
        } catch (err) {
            /*
            await logAplicacion({
                nivel: "ERROR",
                modulo: "riesgos",
                evento: "DETECCION_FALLIDA",
                mensaje: `Falló detección de ${codigo}`,
                detalle: { error: err.message },
            }).catch(() => { });
            */
        }
    }

    const totalCreados = Object.values(resultados).reduce((s, arr) => s + arr.length, 0);

    if (totalCreados > 0) {
        /*
        await logAplicacion({
            nivel: "INFO",
            modulo: "riesgos",
            evento: "DETECCION_COMPLETADA",
            mensaje: `Detección automática creó ${totalCreados} nuevos registros`,
            detalle: Object.fromEntries(
                Object.entries(resultados).map(([k, v]) => [k, v.length])
            ),
        }).catch(() => { });
        */
    }

    return {
        total_creados: totalCreados,
        por_evento: Object.fromEntries(
            Object.entries(resultados).map(([k, v]) => [k, v.length])
        ),
        ventana_evaluacion_min: VENTANA_DETECCION_MIN,
    };
};
