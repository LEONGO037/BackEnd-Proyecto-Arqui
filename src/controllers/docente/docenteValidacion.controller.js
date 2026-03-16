import bcrypt from "bcrypt";
import {
  obtenerPasswordDocente,
  actualizarPasswordDocente,
} from "../../models/docente/docenteValidacion.model.js";

const PASSWORD_DEFAULT = "Docente#Ucb2026";

/**
 * Reglas de validación de contraseña:
 * - Mínimo 8 caracteres
 * - Al menos una letra mayúscula
 * - Al menos una letra minúscula
 * - Al menos un número
 * - Al menos un carácter especial
 * - Diferente a la contraseña por defecto
 */
const validarFormatoPassword = (password) => {
  const errores = [];

  if (password.length < 8) {
    errores.push("Debe tener al menos 8 caracteres.");
  }
  if (!/[A-Z]/.test(password)) {
    errores.push("Debe contener al menos una letra mayúscula.");
  }
  if (!/[a-z]/.test(password)) {
    errores.push("Debe contener al menos una letra minúscula.");
  }
  if (!/[0-9]/.test(password)) {
    errores.push("Debe contener al menos un número.");
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errores.push("Debe contener al menos un carácter especial (ej: #, @, !, $).");
  }

  return errores;
};


/**
 * PUT /api/docente/:id/cambiar-password
 * Endpoint de cambio: busca al docente por ID, valida la contraseña actual,
 * verifica que la nueva contraseña sea diferente a la default y cumpla
 * los requisitos, y actualiza el hash en la base de datos.
 * Cuerpo esperado: { password_actual: string, nueva_password: string }
 */
export const cambiarPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password_actual, nueva_password } = req.body;

    if (!password_actual || !nueva_password) {
      return res.status(400).json({
        error: "Los campos 'password_actual' y 'nueva_password' son obligatorios.",
      });
    }

    // Verificar que el docente existe
    const docente = await obtenerPasswordDocente(parseInt(id));
    if (!docente) {
      return res.status(404).json({ error: "Docente no encontrado." });
    }

    // Verificar que la contraseña actual sea correcta
    const passwordActualCorrecta = await bcrypt.compare(
      password_actual,
      docente.password_hash
    );
    if (!passwordActualCorrecta) {
      return res.status(401).json({ error: "La contraseña actual es incorrecta." });
    }

    // Validar que la nueva contraseña cumpla el formato requerido
    const erroresFormato = validarFormatoPassword(nueva_password);
    if (erroresFormato.length > 0) {
      return res.status(400).json({
        error: "La nueva contraseña no cumple los requisitos.",
        errores: erroresFormato,
      });
    }

    // Verificar que la nueva contraseña sea diferente a la contraseña por defecto
    if (nueva_password === PASSWORD_DEFAULT) {
      return res.status(400).json({
        error: "La nueva contraseña no puede ser igual a la contraseña por defecto.",
      });
    }

    // Verificar que la nueva contraseña sea diferente a la actual
    const mismaQueActual = await bcrypt.compare(nueva_password, docente.password_hash);
    if (mismaQueActual) {
      return res.status(400).json({
        error: "La nueva contraseña debe ser diferente a la contraseña actual.",
      });
    }

    // Hashear y guardar la nueva contraseña
    const nuevoHash = await bcrypt.hash(nueva_password, 10);
    const docenteActualizado = await actualizarPasswordDocente(parseInt(id), nuevoHash);

    return res.json({
      mensaje: "Contraseña actualizada correctamente.",
      docente: {
        id: docenteActualizado.id,
        nombre: docenteActualizado.nombre,
        email: docenteActualizado.email,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/docente-password/:id/es-default
 * Verifica si la contraseña actual del docente en BD es igual a la contraseña
 * por defecto "Docente#Ucb2026". Útil para detectar primer inicio de sesión
 * y redirigir al formulario de cambio de contraseña.
 */
export const verificarPasswordDefault = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar al docente por ID
    const docente = await obtenerPasswordDocente(parseInt(id));
    if (!docente) {
      return res.status(404).json({ error: "Docente no encontrado." });
    }

    // Comparar el hash almacenado con la contraseña por defecto
    const esDefault = await bcrypt.compare(PASSWORD_DEFAULT, docente.password_hash);

    return res.json({
      es_password_default: esDefault,
      mensaje: esDefault
        ? "El docente aún usa la contraseña por defecto. Se recomienda cambiarla."
        : "El docente ya tiene una contraseña personalizada.",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
