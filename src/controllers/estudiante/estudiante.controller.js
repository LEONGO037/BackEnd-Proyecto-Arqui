import { crearEstudiante } from "../../models/estudiante/estudiante.register.model.js";
import { registrarAuditoria } from "../../services/auditoria.service.js";

/**
 * Controlador para el registro de estudiantes.
 */
export const registrarEstudiante = async (req, res) => {
    const {
        usuario_id, // ID del administrador que registra
        nombre,
        apellido_paterno,
        apellido_materno,
        ci,
        email,
        telefono,
        direccion,
        carrera
    } = req.body;

    // 1. Validación básica
    if (!usuario_id || !nombre || !apellido_paterno || !ci || !email || !carrera) {
        return res.status(400).json({
            error: "Los campos usuario_id (del administrador), nombre, apellido paterno, CI, email y carrera son obligatorios."
        });
    }

    // Validación de formato de email simple
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "El formato del email no es válido." });
    }

    try {
        // 2. Crear el estudiante en la BD
        const nuevoEstudiante = await crearEstudiante({
            nombre,
            apellido_paterno,
            apellido_materno,
            ci,
            email,
            telefono,
            direccion,
            carrera
        });

        // 3. Registrar en auditoría
        // Usamos el usuario_id proporcionado en el cuerpo de la petición
        await registrarAuditoria({
            usuario_id,
            accion: "CREATE",
            tabla_afectada: "estudiantes",
            registro_id: nuevoEstudiante.id,
            detalle: {
                mensaje: "Registro de nuevo estudiante realizado por administrador",
                estudiante_email: nuevoEstudiante.email,
                admin_id: usuario_id
            }
        });

        // 4. Respuesta exitosa
        return res.status(201).json({
            ok: true,
            mensaje: "Estudiante registrado con éxito",
            data: nuevoEstudiante
        });

    } catch (error) {
        console.error("Error en registrarEstudiante controller:", error);

        // Si es un error de duplicidad (ej. CI o Email ya existente)
        if (error.code === '23505') {
            return res.status(409).json({
                error: "El estudiante con ese CI o Email ya está registrado."
            });
        }

        return res.status(500).json({
            error: "Error interno del servidor al registrar el estudiante."
        });
    }
};
