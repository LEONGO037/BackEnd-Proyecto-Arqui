import bcrypt from "bcrypt";
import { crearEstudiante, buscarUsuarioPorEmailOCI } from "../../models/estudiante/estudiante.register.model.js";
import { registrarAuditoria } from "../../services/auditoria.service.js";

/**
 * Controlador para el registro de estudiantes.
 */
export const registrarEstudiante = async (req, res) => {
    const {
        usuario_id, // ID del administrador que realiza la acción
        nombre,
        apellido_paterno,
        apellido_materno,
        ci_nit,
        email,
        telefono,
        direccion
    } = req.body;

    // 1. Validación básica de campos requeridos
    if (!usuario_id || !nombre || !apellido_paterno || !ci_nit || !email) {
        return res.status(400).json({
            error: "Los campos usuario_id (admin), nombre, apellido_paterno, ci_nit y email son obligatorios."
        });
    }

    // 2. Validación específica de CI_NIT (7-11 caracteres, solo números y letras)
    const ciRegex = /^[a-zA-Z0-9]{7,11}$/;
    if (!ciRegex.test(ci_nit)) {
        return res.status(400).json({
            error: "El CI_NIT debe tener entre 7 y 11 caracteres y solo puede contener letras y números (sin caracteres especiales)."
        });
    }

    // 3. Validación de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "El formato del email no es válido." });
    }

    try {
        // 4. Verificar si el usuario ya existe por Email o CI
        const usuarioExistente = await buscarUsuarioPorEmailOCI(email, ci_nit);
        if (usuarioExistente) {
            return res.status(409).json({
                error: "El estudiante ya se encuentra registrado con ese Email o CI_NIT."
            });
        }

        // 5. Definir ID de rol (2 para ESTUDIANTE)
        const ROL_ESTUDIANTE_ID = 2;

        // 6. Generar contraseña automática: nombre.apellido.ci_nit
        const password_plano = `${nombre}.${apellido_paterno}.${ci_nit}`.toLowerCase().replace(/\s+/g, '');
        const password_hash = await bcrypt.hash(password_plano, 10);

        // 7. Crear el estudiante (usuario) en la BD
        const nuevoEstudiante = await crearEstudiante({
            nombre,
            apellido_paterno,
            apellido_materno,
            ci_nit,
            email,
            password_hash,
            telefono,
            direccion,
            rol_id: ROL_ESTUDIANTE_ID
        });

        // 8. Registrar en auditoría
        await registrarAuditoria({
            usuario_id: parseInt(usuario_id),
            accion: "CREATE",
            tabla_afectada: "usuarios",
            registro_id: nuevoEstudiante.id,
            detalle: {
                mensaje: "Registro de nuevo estudiante con validación de CI",
                estudiante_email: nuevoEstudiante.email,
                admin_id: usuario_id
            }
        });

        // 9. Respuesta exitosa
        return res.status(201).json({
            ok: true,
            mensaje: "Estudiante registrado con éxito",
            data: {
                id: nuevoEstudiante.id,
                nombre: nuevoEstudiante.nombre,
                email: nuevoEstudiante.email,
                ci_nit: nuevoEstudiante.ci_nit
            }
        });

    } catch (error) {
        console.error("Error en registrarEstudiante controller:", error);
        return res.status(500).json({
            error: "Error interno al procesar el registro del estudiante."
        });
    }
};
