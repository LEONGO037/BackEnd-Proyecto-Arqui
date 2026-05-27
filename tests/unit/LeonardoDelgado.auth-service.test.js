/**
 * ============================================================================
 *  LEONARDO DELGADO — Pruebas unitarias del servicio de autenticación
 * ============================================================================
 *  Archivo bajo prueba: src/services/autenticacion.servicio.js
 *  Funciones probadas : iniciarSesion, registrarEstudiante, verificarCodigoEmail,
 *                       solicitarResetPassword
 *
 *  Estrategia: se mockean modelos (usuario.modelo, permiso.modelo), el servicio
 *  de email y librerías externas (bcrypt, jsonwebtoken) para aislar la lógica.
 *
 *  Cada test sigue las 3 partes:
 *    1) Preparación (Arrange)
 *    2) Lógica de la prueba (Act)
 *    3) Verificación del resultado esperado (Assert)
 * ============================================================================
 */

import { jest } from '@jest/globals';

// ─── Mocks de módulos ────────────────────────────────────────────────────────
jest.unstable_mockModule('../../src/models/usuario.modelo.js', () => ({
  obtenerUsuarioPorEmailConRol: jest.fn(),
  obtenerRolPorNombre: jest.fn(),
  obtenerUsuarioPorEmail: jest.fn(),
  obtenerUsuarioPorIdConRol: jest.fn(),
  actualizarPasswordUsuario: jest.fn(),
  incrementarIntentosFallidos: jest.fn(),
  resetearIntentosFallidos: jest.fn(),
  obtenerHistorialPasswords: jest.fn(),
  insertarHistorialPassword: jest.fn(),
  crearUsuarioConVerificacion: jest.fn(),
  verificarCodigoOTP: jest.fn(),
  verificarEmailUsuario: jest.fn(),
  obtenerUsuarioPorResetToken: jest.fn(),
  guardarResetToken: jest.fn(),
  limpiarResetToken: jest.fn(),
  registrarLoginExitoso: jest.fn(),
  contarLoginsRecientes: jest.fn(),
  guardarCodigoVerificacion: jest.fn(),
}));

jest.unstable_mockModule('../../src/models/permiso.modelo.js', () => ({
  getRolePermissions: jest.fn().mockResolvedValue(['permiso:demo']),
}));

jest.unstable_mockModule('../../src/services/email.service.js', () => ({
  enviarEmail: jest.fn().mockResolvedValue(true),
  emailVerificacionCodigo: jest.fn().mockReturnValue('<html>OTP</html>'),
  emailActividadSospechosa: jest.fn().mockReturnValue('<html>alerta</html>'),
  emailResetPassword: jest.fn().mockReturnValue('<html>reset</html>'),
  emailResetPasswordCodigo: jest.fn().mockReturnValue('<html>reset-cod</html>'),
}));

jest.unstable_mockModule('bcrypt', () => ({
  default: {
    compare: jest.fn(),
    hash: jest.fn().mockResolvedValue('hash-fake'),
  },
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: { sign: jest.fn().mockReturnValue('jwt-fake-token') },
}));

const usuarioModel = await import('../../src/models/usuario.modelo.js');
const emailService = await import('../../src/services/email.service.js');
const bcrypt = (await import('bcrypt')).default;

const {
  iniciarSesion,
  registrarEstudiante,
  verificarCodigoEmail,
  solicitarResetPassword,
} = await import('../../src/services/autenticacion.servicio.js');

describe('LEONARDO DELGADO - autenticacion.servicio', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── iniciarSesion ────────────────────────────────────────────────────────

  test('1. iniciarSesion lanza "Credenciales inválidas" cuando el usuario no existe', async () => {
    // Preparación
    usuarioModel.obtenerUsuarioPorEmailConRol.mockResolvedValue(null);

    // Lógica + Verificación
    await expect(
      iniciarSesion('inexistente@ucb.edu.bo', 'Password1234@')
    ).rejects.toThrow('Credenciales inválidas');
  });

  test('2. iniciarSesion lanza error cuando la cuenta está desactivada', async () => {
    // Preparación
    usuarioModel.obtenerUsuarioPorEmailConRol.mockResolvedValue({
      id: 1, activo: false, email_verificado: true, password_hash: 'h',
    });

    // Lógica + Verificación
    await expect(
      iniciarSesion('user@ucb.edu.bo', 'Password1234@')
    ).rejects.toThrow(/desactivada/);
  });

  test('3. iniciarSesion lanza error cuando la cuenta está bloqueada', async () => {
    // Preparación
    usuarioModel.obtenerUsuarioPorEmailConRol.mockResolvedValue({
      id: 1, activo: true, email_verificado: true,
      bloqueado_hasta: new Date(Date.now() + 3_600_000),
      password_hash: 'h',
    });

    // Lógica + Verificación
    await expect(
      iniciarSesion('user@ucb.edu.bo', 'Password1234@')
    ).rejects.toThrow(/bloqueada/);
  });

  test('4. iniciarSesion lanza error cuando el email no está verificado', async () => {
    // Preparación
    usuarioModel.obtenerUsuarioPorEmailConRol.mockResolvedValue({
      id: 1, activo: true, email_verificado: false, password_hash: 'h',
    });

    // Lógica + Verificación
    await expect(
      iniciarSesion('user@ucb.edu.bo', 'Password1234@')
    ).rejects.toThrow(/verificar tu correo/);
  });

  test('5. iniciarSesion incrementa intentos fallidos cuando la contraseña es incorrecta', async () => {
    // Preparación
    usuarioModel.obtenerUsuarioPorEmailConRol.mockResolvedValue({
      id: 42, activo: true, email_verificado: true, password_hash: 'hash-real',
    });
    bcrypt.compare.mockResolvedValue(false);

    // Lógica
    await expect(
      iniciarSesion('user@ucb.edu.bo', 'PasswordMal12@')
    ).rejects.toThrow('Credenciales inválidas');

    // Verificación
    expect(usuarioModel.incrementarIntentosFallidos).toHaveBeenCalledWith(42);
  });

  test('6. iniciarSesion devuelve token y datos del usuario en login exitoso', async () => {
    // Preparación
    usuarioModel.obtenerUsuarioPorEmailConRol.mockResolvedValue({
      id: 7, nombre: 'Ana', email: 'ana@ucb.edu.bo',
      rol_nombre: 'ESTUDIANTE', rol_id: 2,
      activo: true, email_verificado: true, password_hash: 'h',
      password_cambiado_en: new Date(),
    });
    bcrypt.compare.mockResolvedValue(true);
    usuarioModel.contarLoginsRecientes.mockResolvedValue(0);

    // Lógica
    const resultado = await iniciarSesion('ana@ucb.edu.bo', 'Password1234@');

    // Verificación
    expect(resultado.token).toBe('jwt-fake-token');
    expect(resultado.usuario).toMatchObject({
      id: 7, nombre: 'Ana', email: 'ana@ucb.edu.bo', rol: 'ESTUDIANTE',
    });
    expect(usuarioModel.resetearIntentosFallidos).toHaveBeenCalledWith(7);
  });

  // ─── registrarEstudiante ─────────────────────────────────────────────────

  test('7. registrarEstudiante rechaza correos institucionales duplicados', async () => {
    // Preparación
    usuarioModel.obtenerUsuarioPorEmail.mockResolvedValue({ id: 1 });

    // Lógica + Verificación
    await expect(registrarEstudiante({
      nombre: 'Luis',
      apellido_paterno: 'Pérez',
      email: 'luis@ucb.edu.bo',
      password: 'Password1234@',
    })).rejects.toThrow('El correo electrónico ya está registrado');
  });

  test('8. registrarEstudiante crea usuario y envía email de verificación', async () => {
    // Preparación
    usuarioModel.obtenerUsuarioPorEmail.mockResolvedValue(null);
    usuarioModel.obtenerRolPorNombre.mockResolvedValue({ id: 99 });
    usuarioModel.crearUsuarioConVerificacion.mockResolvedValue({
      id: 5, nombre: 'Luis', email: 'luis@ucb.edu.bo',
    });

    // Lógica
    const resultado = await registrarEstudiante({
      nombre: 'Luis',
      apellido_paterno: 'Pérez',
      email: 'luis@ucb.edu.bo',
      password: 'Password1234@',
    });

    // Verificación
    expect(usuarioModel.crearUsuarioConVerificacion).toHaveBeenCalled();
    expect(emailService.enviarEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'luis@ucb.edu.bo' })
    );
    expect(resultado.mensaje).toMatch(/Registro exitoso/);
  });

  // ─── verificarCodigoEmail ─────────────────────────────────────────────────

  test('9. verificarCodigoEmail lanza error cuando el código no es válido o expiró', async () => {
    // Preparación
    usuarioModel.verificarCodigoOTP.mockResolvedValue(null);

    // Lógica + Verificación
    await expect(
      verificarCodigoEmail('a@ucb.edu.bo', '123456')
    ).rejects.toThrow('Código inválido o expirado');
  });

  // ─── solicitarResetPassword ───────────────────────────────────────────────

  test('10. solicitarResetPassword devuelve mensaje genérico aunque el correo NO exista (anti-enumeración)', async () => {
    // Preparación
    usuarioModel.obtenerUsuarioPorEmail.mockResolvedValue(null);

    // Lógica
    const resultado = await solicitarResetPassword('nadie@ucb.edu.bo');

    // Verificación
    expect(resultado.mensaje).toMatch(/Si el correo existe/);
    expect(usuarioModel.guardarResetToken).not.toHaveBeenCalled();
  });
});
