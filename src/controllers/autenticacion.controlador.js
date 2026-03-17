import { registrarEstudiante } from "../services/autenticacion.servicio.js";
import { iniciarSesion } from "../services/autenticacion.servicio.js";
import { cambiarPassword as cambiarPasswordServicio } from "../services/autenticacion.servicio.js";
import { registrarAuditoriaSegura } from "../services/auditoria.service.js";
export const registrar = async (req, res) => {
  try {

    const usuario = await registrarEstudiante(req.body);

    await registrarAuditoriaSegura({
      usuario_id: usuario.id,
      accion: "CREATE",
      tabla_afectada: "usuarios",
      registro_id: usuario.id,
      detalle: {
        evento: "REGISTRO_USUARIO",
        email: usuario.email,
        rol_id: usuario.rol_id,
      },
    });

    res.status(201).json({
      mensaje: "Estudiante registrado correctamente",
      usuario
    });

  } catch (error) {

    res.status(400).json({
      error: error.message
    });

  }
};

export const login = async (req, res) => {
  try {

    const { email, password } = req.body;

    const resultado = await iniciarSesion(email, password);

    res.json(resultado);

  } catch (error) {

    res.status(401).json({
      error: error.message
    });

  }
};

export const cambiarPassword = async (req, res) => {
  try {
    const { password_actual, nueva_password } = req.body;

    const usuarioActualizado = await cambiarPasswordServicio(
      req.usuario.id,
      password_actual,
      nueva_password
    );

    await registrarAuditoriaSegura({
      usuario_id: req.usuario.id,
      accion: "UPDATE",
      tabla_afectada: "usuarios",
      registro_id: req.usuario.id,
      detalle: {
        evento: "CAMBIO_PASSWORD",
        rol: req.usuario.rol,
      },
    });

    res.json({
      mensaje: "Contraseña actualizada correctamente",
      usuario: {
        id: usuarioActualizado.id,
        nombre: usuarioActualizado.nombre,
        email: usuarioActualizado.email,
      },
    });
  } catch (error) {
    const status = error.message === "La contraseña actual es incorrecta" ? 401 : 400;
    res.status(status).json({ error: error.message });
  }
};
