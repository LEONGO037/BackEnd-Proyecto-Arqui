/**
 * ============================================================================
 *  JUAN JOSÉ — Pruebas unitarias del módulo de validadores de autenticación
 * ============================================================================
 *  Archivo bajo prueba: src/validators/autenticacion.validator.js
 *
 *  Cada test sigue las 3 partes:
 *    1) Preparación (Arrange)
 *    2) Lógica de la prueba (Act)
 *    3) Verificación del resultado esperado (Assert)
 * ============================================================================
 */

import { jest } from '@jest/globals';
import {
  validarCorreoInstitucional,
  validarPasswordFuerte,
  validarCredencialesLogin,
  validarRegistroEstudiante,
  validarCambioPassword,
} from '../../src/validators/autenticacion.validator.js';

describe('JUAN JOSÉ - autenticacion.validator', () => {

  // ─── validarCorreoInstitucional ────────────────────────────────────────────

  test('1. validarCorreoInstitucional acepta un correo institucional @ucb.edu.bo', () => {
    // Preparación
    const correoValido = 'juan.perez@ucb.edu.bo';

    // Lógica
    const ejecutar = () => validarCorreoInstitucional(correoValido);

    // Verificación
    expect(ejecutar).not.toThrow();
  });

  test('2. validarCorreoInstitucional rechaza un correo NO institucional (gmail.com)', () => {
    // Preparación
    const correoExterno = 'usuario@gmail.com';

    // Lógica
    const ejecutar = () => validarCorreoInstitucional(correoExterno);

    // Verificación
    expect(ejecutar).toThrow('El correo debe ser institucional (@ucb.edu.bo)');
  });

  test('3. validarCorreoInstitucional rechaza string vacío o null', () => {
    // Preparación
    const correoVacio = '';
    const correoNull = null;

    // Lógica + Verificación (combinadas porque ambos deben lanzar error)
    expect(() => validarCorreoInstitucional(correoVacio)).toThrow();
    expect(() => validarCorreoInstitucional(correoNull)).toThrow();
  });

  // ─── validarPasswordFuerte ─────────────────────────────────────────────────

  test('4. validarPasswordFuerte acepta una contraseña que cumple todas las reglas', () => {
    // Preparación: 12 chars, mayús, minús, dígito, especial
    const passwordFuerte = 'Abcdef123@xyz';

    // Lógica
    const ejecutar = () => validarPasswordFuerte(passwordFuerte);

    // Verificación
    expect(ejecutar).not.toThrow();
  });

  test('5. validarPasswordFuerte rechaza contraseña sin carácter especial', () => {
    // Preparación
    const passwordSinEspecial = 'Abcdefgh1234';

    // Lógica
    const ejecutar = () => validarPasswordFuerte(passwordSinEspecial);

    // Verificación
    expect(ejecutar).toThrow(/mínimo 12 caracteres/);
  });

  test('6. validarPasswordFuerte rechaza contraseña con menos de 12 caracteres', () => {
    // Preparación
    const passwordCorta = 'Abc1@xy'; // 7 caracteres

    // Lógica
    const ejecutar = () => validarPasswordFuerte(passwordCorta);

    // Verificación
    expect(ejecutar).toThrow();
  });

  // ─── validarCredencialesLogin ──────────────────────────────────────────────

  test('7. validarCredencialesLogin lanza error cuando faltan campos obligatorios', () => {
    // Preparación
    const credencialesIncompletas = { email: 'a@ucb.edu.bo', password: '' };

    // Lógica
    const ejecutar = () => validarCredencialesLogin(credencialesIncompletas);

    // Verificación
    expect(ejecutar).toThrow('Correo y contraseña son obligatorios');
  });

  // ─── validarRegistroEstudiante ─────────────────────────────────────────────

  test('8. validarRegistroEstudiante valida correctamente datos completos y válidos', () => {
    // Preparación
    const datos = {
      nombre: 'María',
      apellido_paterno: 'López',
      email: 'maria.lopez@ucb.edu.bo',
      password: 'Estudiante1@xx',
    };

    // Lógica
    const ejecutar = () => validarRegistroEstudiante(datos);

    // Verificación
    expect(ejecutar).not.toThrow();
  });

  test('9. validarRegistroEstudiante rechaza cuando falta apellido_paterno', () => {
    // Preparación
    const datosIncompletos = {
      nombre: 'María',
      apellido_paterno: '',
      email: 'maria.lopez@ucb.edu.bo',
      password: 'Estudiante1@xx',
    };

    // Lógica
    const ejecutar = () => validarRegistroEstudiante(datosIncompletos);

    // Verificación
    expect(ejecutar).toThrow('Los campos obligatorios no fueron enviados');
  });

  // ─── validarCambioPassword ─────────────────────────────────────────────────

  test('10. validarCambioPassword rechaza cuando la nueva contraseña es igual a la actual', () => {
    // Preparación
    const datos = {
      password_actual: 'MiPassword1@xx',
      nueva_password: 'MiPassword1@xx',
    };

    // Lógica
    const ejecutar = () => validarCambioPassword(datos);

    // Verificación
    expect(ejecutar).toThrow('La nueva contraseña debe ser diferente a la contraseña actual');
  });
});
