const EMAIL_UCB_REGEX = /^[A-Z0-9._%+-]+@ucb\.edu\.bo$/i;
const PASSWORD_STRONG_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export const validarCorreoInstitucional = (email) => {
  const correo = String(email || '').trim();
  if (!EMAIL_UCB_REGEX.test(correo)) {
    throw new Error('El correo debe ser institucional (@ucb.edu.bo)');
  }
};

export const validarPasswordFuerte = (password) => {
  const passwordPlano = String(password || '');
  if (!PASSWORD_STRONG_REGEX.test(passwordPlano)) {
    throw new Error('La contraseña debe tener al menos 8 caracteres, mayúscula, minúscula, número y carácter especial');
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
