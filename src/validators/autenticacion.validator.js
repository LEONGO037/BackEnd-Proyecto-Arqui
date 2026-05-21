const EMAIL_UCB_REGEX = /^[A-Z0-9._%+-]+@ucb\.edu\.bo$/i;
const PASSWORD_STRONG_REGEX = /^(?=.*[a-zñáéíóú])(?=.*[A-ZÑÁÉÍÓÚ])(?=.*\d)(?=.*[@$!%*?&_\-#]).{12,}$/;

export const validarCorreoInstitucional = (email) => {
  const correo = String(email || '').trim();
  if (!EMAIL_UCB_REGEX.test(correo)) {
    throw new Error('El correo debe ser institucional (@ucb.edu.bo)');
  }
};

export const validarPasswordFuerte = (password) => {
  const passwordPlano = String(password || '');
  if (!PASSWORD_STRONG_REGEX.test(passwordPlano)) {
    throw new Error('La contraseña debe tener mínimo 12 caracteres, mayúscula, minúscula, número y carácter especial (@$!%*?&_-#)');
  }
};

export const validarCredencialesLogin = ({ email, password }) => {
  if (!email || !password) {
    throw new Error('Correo y contraseña son obligatorios');
  }

  validarCorreoInstitucional(email);
};

export const validarRegistroEstudiante = ({ nombre, apellido_paterno, email, password }) => {
  if (!nombre || !apellido_paterno || !email || !password) {
    throw new Error('Los campos obligatorios no fueron enviados');
  }

  validarCorreoInstitucional(email);
  validarPasswordFuerte(password);
};

export const validarCambioPassword = ({ password_actual, nueva_password }) => {
  if (!password_actual || !nueva_password) {
    throw new Error('Los campos password_actual y nueva_password son obligatorios');
  }

  if (password_actual === nueva_password) {
    throw new Error('La nueva contraseña debe ser diferente a la contraseña actual');
  }

  validarPasswordFuerte(nueva_password);
};
