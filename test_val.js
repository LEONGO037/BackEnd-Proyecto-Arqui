import { validarCambioPassword } from './src/validators/autenticacion.validator.js';
console.log('Testing validator...');
try {
  validarCambioPassword({ password_actual: 'OldPass123!@#', nueva_password: 'NewPass123!@#' });
  console.log('Validation passed.');
} catch (e) {
  console.error('Validation failed:', e.message);
}
