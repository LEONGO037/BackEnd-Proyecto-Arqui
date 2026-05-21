import bcrypt from "bcrypt";
import { crearEstudiante, buscarUsuarioPorEmailOCI } from "../../models/estudiante/estudiante.register.model.js";
import { registrarAuditoria } from "../../services/auditoria.service.js";

const generarPasswordDefault = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

export const registrarEstudiante = async (req, res) => {
    const {
        usuario_id,
        nombre,
        apellido_paterno,
        apellido_materno,
        email,
    } = req.body;

    if (!usuario_id || !nombre || !apellido_paterno || !email) {
        return res.status(400).json({
            error: "Los campos usuario_id (admin), nombre, apellido_paterno y email son obligatorios."
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "El formato del email no es válido." });
    }

    try {
        const usuarioExistente = await buscarUsuarioPorEmailOCI(email);
        if (usuarioExistente) {
            return res.status(409).json({
                error: "El estudiante ya se encuentra registrado con ese Email."
            });
        }

        const ROL_ESTUDIANTE_ID = 2;
        const password_plano = generarPasswordDefault();
        const password_hash = await bcrypt.hash(password_plano, 10);

        const nuevoEstudiante = await crearEstudiante({
            nombre,
            apellido_paterno,
            apellido_materno,
            email,
            password_hash,
            rol_id: ROL_ESTUDIANTE_ID
        });

        await registrarAuditoria({
            usuario_id: parseInt(usuario_id),
            accion: "CREATE",
            tabla_afectada: "usuarios",
            registro_id: nuevoEstudiante.id,
            detalle: {
                mensaje: "Registro de nuevo estudiante",
                estudiante_email: nuevoEstudiante.email,
                admin_id: usuario_id
            }
        });

        return res.status(201).json({
            ok: true,
            mensaje: "Estudiante registrado con éxito",
            data: {
                id: nuevoEstudiante.id,
                nombre: nuevoEstudiante.nombre,
                email: nuevoEstudiante.email,
            }
        });

    } catch (error) {
        console.error("Error en registrarEstudiante controller:", error);
        return res.status(500).json({
            error: "Error interno al procesar el registro del estudiante."
        });
    }
};
