import {
    listarCatalogo,
    obtenerCatalogoPorId,
    crearRegistro,
    listarRegistros,
    obtenerRegistroPorId,
    actualizarEstadoRegistro,
    crearPlanAccion,
    actualizarPlanAccion,
    obtenerResumen,
} from "../../models/riesgos/riesgos.model.js";
import { ejecutarDeteccionCompleta } from "../../services/riesgos/deteccion.service.js";
import { logAplicacion, logSeguridad } from "../../services/logger.service.js";

// ===========================================================================
// Controller del Módulo de Gestión de Riesgos
// ===========================================================================

const ESTADOS_REGISTRO_VALIDOS = ["DETECTADO", "EN_REVISION", "MITIGADO", "CERRADO", "FALSO_POSITIVO"];
const ESTADOS_PLAN_VALIDOS = ["PENDIENTE", "EN_PROGRESO", "COMPLETADO", "CANCELADO"];
const CATEGORIAS_VALIDAS = ["CRITICO", "ALTO", "MEDIO", "BAJO"];

// ───── CATÁLOGO ────────────────────────────────────────────────────────────

export const getCatalogo = async (req, res, next) => {
    try {
        const { categoria } = req.query;
        if (categoria && !CATEGORIAS_VALIDAS.includes(categoria)) {
            return res.status(400).json({ error: "Categoría inválida" });
        }
        const datos = await listarCatalogo({ categoria: categoria || null });
        res.json({ total: datos.length, datos });
    } catch (error) {
        next(error);
    }
};

// ───── REGISTROS ───────────────────────────────────────────────────────────

export const getRegistros = async (req, res, next) => {
    try {
        const { estado, categoria, desde, hasta, limite } = req.query;

        if (estado && !ESTADOS_REGISTRO_VALIDOS.includes(estado)) {
            return res.status(400).json({ error: "Estado inválido" });
        }
        if (categoria && !CATEGORIAS_VALIDAS.includes(categoria)) {
            return res.status(400).json({ error: "Categoría inválida" });
        }

        const datos = await listarRegistros({
            estado: estado || null,
            categoria: categoria || null,
            desde: desde ? new Date(desde) : null,
            hasta: hasta ? new Date(hasta + "T23:59:59") : null,
            limite,
        });
        res.json({ total: datos.length, datos });
    } catch (error) {
        next(error);
    }
};

export const getRegistroPorId = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: "ID inválido" });
        }
        const registro = await obtenerRegistroPorId(id);
        if (!registro) return res.status(404).json({ error: "Registro no encontrado" });
        res.json(registro);
    } catch (error) {
        next(error);
    }
};

export const postRegistroManual = async (req, res, next) => {
    try {
        const {
            riesgo_catalogo_id,
            usuario_afectado_id,
            email_afectado,
            ip,
            detalle,
        } = req.body;

        if (!Number.isInteger(riesgo_catalogo_id) || riesgo_catalogo_id <= 0) {
            return res.status(400).json({ error: "riesgo_catalogo_id es requerido" });
        }

        const cat = await obtenerCatalogoPorId(riesgo_catalogo_id);
        if (!cat) return res.status(404).json({ error: "Riesgo del catálogo no encontrado" });

        const nuevo = await crearRegistro({
            riesgo_catalogo_id,
            origen: "MANUAL",
            usuario_afectado_id: usuario_afectado_id || null,
            email_afectado: email_afectado || null,
            ip: ip || null,
            detalle: detalle || {},
            detectado_por_id: req.usuario.id,
        });

        /*
        logAplicacion({
            nivel: "INFO",
            modulo: "riesgos",
            evento: "REGISTRO_MANUAL_CREADO",
            mensaje: `Registro manual de riesgo ${cat.codigo}`,
            usuario_id: req.usuario.id,
            detalle: { registro_id: nuevo.id, catalogo_codigo: cat.codigo },
        }).catch(() => { });
        */

        res.status(201).json(nuevo);
    } catch (error) {
        next(error);
    }
};

export const putEstadoRegistro = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const { estado } = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: "ID inválido" });
        }
        if (!ESTADOS_REGISTRO_VALIDOS.includes(estado)) {
            return res.status(400).json({ error: "Estado inválido" });
        }

        const actualizado = await actualizarEstadoRegistro(id, estado, req.usuario.id);
        if (!actualizado) return res.status(404).json({ error: "Registro no encontrado" });

        /*
        logAplicacion({
            nivel: "INFO",
            modulo: "riesgos",
            evento: "ESTADO_REGISTRO_ACTUALIZADO",
            mensaje: `Registro ${id} → ${estado}`,
            usuario_id: req.usuario.id,
            detalle: { registro_id: id, nuevo_estado: estado },
        }).catch(() => { });
        */

        res.json(actualizado);
    } catch (error) {
        next(error);
    }
};

// ───── PLANES DE ACCIÓN ────────────────────────────────────────────────────

export const postPlanAccion = async (req, res, next) => {
    try {
        const registro_id = Number(req.params.id);
        const { descripcion, consecuencias, responsable_id, fecha_limite } = req.body;

        if (!Number.isInteger(registro_id) || registro_id <= 0) {
            return res.status(400).json({ error: "ID de registro inválido" });
        }
        if (!descripcion || typeof descripcion !== "string" || descripcion.trim().length < 5) {
            return res.status(400).json({ error: "descripcion es requerida (mínimo 5 caracteres)" });
        }

        const registro = await obtenerRegistroPorId(registro_id);
        if (!registro) return res.status(404).json({ error: "Registro no encontrado" });

        const nuevoPlan = await crearPlanAccion({
            riesgo_registro_id: registro_id,
            descripcion: descripcion.trim(),
            consecuencias: consecuencias || null,
            responsable_id: responsable_id || null,
            fecha_limite: fecha_limite || null,
            creado_por_id: req.usuario.id,
        });

        /*
        logAplicacion({
            nivel: "INFO",
            modulo: "riesgos",
            evento: "PLAN_ACCION_CREADO",
            mensaje: `Plan de acción para registro ${registro_id}`,
            usuario_id: req.usuario.id,
            detalle: { plan_id: nuevoPlan.id, registro_id },
        }).catch(() => { });
        */

        res.status(201).json(nuevoPlan);
    } catch (error) {
        next(error);
    }
};

export const putPlanAccion = async (req, res, next) => {
    try {
        const plan_id = Number(req.params.planId);
        const { estado, observaciones, fecha_completado } = req.body;

        if (!Number.isInteger(plan_id) || plan_id <= 0) {
            return res.status(400).json({ error: "ID de plan inválido" });
        }
        if (estado && !ESTADOS_PLAN_VALIDOS.includes(estado)) {
            return res.status(400).json({ error: "Estado de plan inválido" });
        }

        const actualizado = await actualizarPlanAccion(plan_id, {
            estado: estado || null,
            observaciones: observaciones || null,
            fecha_completado: fecha_completado || null,
        });
        if (!actualizado) return res.status(404).json({ error: "Plan no encontrado" });

        /*
        logAplicacion({
            nivel: "INFO",
            modulo: "riesgos",
            evento: "PLAN_ACCION_ACTUALIZADO",
            mensaje: `Plan ${plan_id} actualizado`,
            usuario_id: req.usuario.id,
            detalle: { plan_id, nuevo_estado: estado },
        }).catch(() => { });
        */

        res.json(actualizado);
    } catch (error) {
        next(error);
    }
};

// ───── DASHBOARD ───────────────────────────────────────────────────────────

export const getResumen = async (req, res, next) => {
    try {
        const resumen = await obtenerResumen();
        res.json(resumen);
    } catch (error) {
        next(error);
    }
};

// ───── REPORTE DE DENEGACIÓN DESDE FRONTEND ────────────────────────────────
//
// El frontend bloquea el acceso a rutas protegidas SIN hacer fetch al backend.
// Para que esos intentos queden registrados (y la detección de RC-004 los
// cuente), el guardia de ruta del frontend llama a este endpoint cuando
// bloquea a un usuario autenticado que intenta acceder a una ruta sin tener
// el permiso requerido.
//
// Requiere solo estar autenticado (cualquier rol). El usuario se identifica
// con el token, no con el body.
// ---------------------------------------------------------------------------
export const postReportarDenegacionFrontend = async (req, res, next) => {
    try {
        const { ruta_intentada, permiso_requerido } = req.body || {};

        logSeguridad({
            evento: "PERMISO_DENEGADO_FRONTEND",
            exito: false,
            usuario_id: req.usuario?.id,
            email: req.usuario?.email,
            req,
            detalle: {
                ruta_intentada: typeof ruta_intentada === "string" ? ruta_intentada.slice(0, 255) : null,
                permiso_requerido: typeof permiso_requerido === "string" ? permiso_requerido.slice(0, 80) : null,
                rol: req.usuario?.rol,
            },
        }).catch(() => { });

        res.status(204).end();
    } catch (error) {
        next(error);
    }
};

// ───── DETECCIÓN AUTOMÁTICA ────────────────────────────────────────────────

export const postEjecutarDeteccion = async (req, res, next) => {
    try {
        const resultado = await ejecutarDeteccionCompleta();

        /*
        logAplicacion({
            nivel: "INFO",
            modulo: "riesgos",
            evento: "DETECCION_MANUAL_EJECUTADA",
            mensaje: `Detección lanzada manualmente: ${resultado.total_creados} registros nuevos`,
            usuario_id: req.usuario.id,
            detalle: resultado,
        }).catch(() => { });
        */

        res.json(resultado);
    } catch (error) {
        next(error);
    }
};
