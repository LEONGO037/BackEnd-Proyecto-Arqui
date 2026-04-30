import bcrypt from "bcrypt";
import { crearEstudiante, buscarUsuarioPorEmailOCI } from "../../models/estudiante/estudiante.register.model.js";
import { registrarAuditoria } from "../../services/auditoria.service.js";
import { generarPasswordDefault } from "../../services/administrador.docente/docente.service.js";
import { enviarEmail, emailEstudianteBienvenidaAdmin } from "../../services/email.service.js";

/**
 * Controlador para el registro de estudiantes.
 */
export const registrarEstudiante = async (req, res) => {
    const {
        usuario_id, // ID del administrador que realiza la acción
        nombre,
        apellido_paterno,
        apellido_materno,
        email,
    } = req.body;

    // 1. Validación básica de campos requeridos
    if (!usuario_id || !nombre || !apellido_paterno || !email) {
        return res.status(400).json({
            error: "Los campos usuario_id (admin), nombre, apellido_paterno y email son obligatorios."
        });
    }

    // 2. (Validación de CI_NIT eliminada ya que la columna no existe)

    // 3. Validación de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "El formato del email no es válido." });
    }

    try {
        // 4. Verificar si el usuario ya existe por Email
        const usuarioExistente = await buscarUsuarioPorEmailOCI(email);
        if (usuarioExistente) {
            return res.status(409).json({
                error: "El estudiante ya se encuentra registrado con ese Email."
            });
        }

        // 5. Definir ID de rol (2 para ESTUDIANTE)
        const ROL_ESTUDIANTE_ID = 2;

        // 6. Generar contraseña automática robusta de 12 caracteres
        const password_plano = generarPasswordDefault();
        const password_hash = await bcrypt.hash(password_plano, 12);

        // 7. Crear el estudiante (usuario) en la BD
        const nuevoEstudiante = await crearEstudiante({
            nombre,
            apellido_paterno,
            apellido_materno,
            email,
            password_hash,
            rol_id: ROL_ESTUDIANTE_ID
        });

        // 8. Registrar en auditoría
        await registrarAuditoria({
            usuario_id: parseInt(usuario_id),
            accion: "CREATE",
            tabla_afectada: "usuarios",
            registro_id: nuevoEstudiante.id,
            detalle: {
                mensaje: "Registro de nuevo estudiante con password aleatorio",
                estudiante_email: nuevoEstudiante.email,
                admin_id: usuario_id
            }
        });

        // 9. Enviar correo de bienvenida con la contraseña
        enviarEmail({
            to: email,
            subject: "Tu cuenta de estudiante — College X Nexus",
            html: emailEstudianteBienvenidaAdmin({
                nombre,
                email,
                passwordDefault: password_plano
            })
        }).catch(err => console.error("Error al enviar correo a estudiante:", err));

        // 9. Respuesta exitosa
        return res.status(201).json({
            ok: true,
            mensaje: "Estudiante registrado con éxito",
            data: {
                id: nuevoEstudiante.id,
                nombre: nuevoEstudiante.nombre,
                email: nuevoEstudiante.email
            }
        });

    } catch (error) {
        console.error("Error en registrarEstudiante controller:", error);
        return res.status(500).json({
            error: "Error interno al procesar el registro del estudiante."
        });
    }
};
