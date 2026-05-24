/**
 * ============================================================================
 *  ALAN FLOREZ — Pruebas unitarias de utilitarios y middleware de roles
 * ============================================================================
 *  Archivos bajo prueba:
 *    - src/utils/asyncHandler.js
 *    - src/middlewares/roles.middleware.js (verificarRol y verificarPermiso)
 *
 *  Cada test sigue las 3 partes:
 *    1) Preparación (Arrange)
 *    2) Lógica de la prueba (Act)
 *    3) Verificación del resultado esperado (Assert)
 * ============================================================================
 */

import { jest } from '@jest/globals';

// ─── Mock del modelo permiso ANTES de importar el middleware ─────────────────
// (jest.unstable_mockModule debe ejecutarse antes del import dinámico)
jest.unstable_mockModule('../../src/models/permiso.modelo.js', () => ({
  getRolePermissions: jest.fn(),
}));

const { asyncHandler } = await import('../../src/utils/asyncHandler.js');
const { verificarRol, verificarPermiso } = await import(
  '../../src/middlewares/roles.middleware.js'
);
const { getRolePermissions } = await import(
  '../../src/models/permiso.modelo.js'
);

// Helpers para construir req/res/next falsos
const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('ALAN FLOREZ - asyncHandler + roles.middleware', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── asyncHandler ─────────────────────────────────────────────────────────

  test('1. asyncHandler ejecuta funciones async exitosas sin llamar a next con error', async () => {
    // Preparación
    const handler = jest.fn().mockResolvedValue('ok');
    const wrapped = asyncHandler(handler);
    const req = {};
    const res = buildRes();
    const next = jest.fn();

    // Lógica
    await wrapped(req, res, next);

    // Verificación
    expect(handler).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  test('2. asyncHandler captura errores async y los pasa a next', async () => {
    // Preparación
    const error = new Error('falla async');
    const handler = jest.fn().mockRejectedValue(error);
    const wrapped = asyncHandler(handler);
    const next = jest.fn();

    // Lógica
    await wrapped({}, buildRes(), next);

    // Verificación
    expect(next).toHaveBeenCalledWith(error);
  });

  test('3. asyncHandler captura throws síncronos dentro de un handler async', async () => {
    // Preparación: función async que lanza inmediatamente — async siempre devuelve
    // una Promise, así que el throw queda dentro de la promesa y es capturable.
    const handler = async () => { throw new Error('falla en handler async'); };
    const wrapped = asyncHandler(handler);
    const next = jest.fn();

    // Lógica
    await wrapped({}, buildRes(), next);

    // Verificación
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(next.mock.calls[0][0].message).toBe('falla en handler async');
  });

  // ─── verificarRol ─────────────────────────────────────────────────────────

  test('4. verificarRol permite acceso cuando el rol del usuario está en la lista permitida', () => {
    // Preparación
    const middleware = verificarRol('ADMINISTRADOR');
    const req = { usuario: { rol: 'ADMINISTRADOR' } };
    const res = buildRes();
    const next = jest.fn();

    // Lógica
    middleware(req, res, next);

    // Verificación
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('5. verificarRol responde 403 cuando el rol del usuario NO está permitido', () => {
    // Preparación
    const middleware = verificarRol('ADMINISTRADOR', 'DOCENTE');
    const req = { usuario: { rol: 'ESTUDIANTE' } };
    const res = buildRes();
    const next = jest.fn();

    // Lógica
    middleware(req, res, next);

    // Verificación
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Acceso denegado',
      rol_requerido: ['ADMINISTRADOR', 'DOCENTE'],
      tu_rol: 'ESTUDIANTE',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('6. verificarRol acepta arrays anidados (flat) de roles', () => {
    // Preparación
    const middleware = verificarRol(['ADMINISTRADOR', 'DOCENTE']);
    const req = { usuario: { rol: 'DOCENTE' } };
    const res = buildRes();
    const next = jest.fn();

    // Lógica
    middleware(req, res, next);

    // Verificación
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  // ─── verificarPermiso ─────────────────────────────────────────────────────

  test('7. verificarPermiso permite acceso cuando el usuario posee al menos un permiso requerido', async () => {
    // Preparación
    getRolePermissions.mockResolvedValue(['cursos:crear', 'cursos:ver']);
    const middleware = verificarPermiso('cursos:crear');
    const req = { usuario: { rol_id: 1 } };
    const res = buildRes();
    const next = jest.fn();

    // Lógica
    await middleware(req, res, next);

    // Verificación
    expect(getRolePermissions).toHaveBeenCalledWith(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('8. verificarPermiso responde 403 cuando el usuario no posee ninguno de los permisos requeridos', async () => {
    // Preparación
    getRolePermissions.mockResolvedValue(['cursos:ver']);
    const middleware = verificarPermiso('cursos:eliminar');
    const req = { usuario: { rol_id: 2 } };
    const res = buildRes();
    const next = jest.fn();

    // Lógica
    await middleware(req, res, next);

    // Verificación
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Acceso denegado',
      permisos_requeridos: ['cursos:eliminar'],
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('9. verificarPermiso responde 403 cuando el token no incluye rol_id', async () => {
    // Preparación
    const middleware = verificarPermiso('cursos:ver');
    const req = { usuario: {} };
    const res = buildRes();
    const next = jest.fn();

    // Lógica
    await middleware(req, res, next);

    // Verificación
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Acceso denegado',
      detalle: 'rol_id no encontrado en el token',
    });
    expect(getRolePermissions).not.toHaveBeenCalled();
  });

  test('10. verificarPermiso responde 500 cuando getRolePermissions arroja una excepción', async () => {
    // Preparación
    getRolePermissions.mockRejectedValue(new Error('DB caída'));
    const middleware = verificarPermiso('cursos:ver');
    const req = { usuario: { rol_id: 3 } };
    const res = buildRes();
    const next = jest.fn();

    // Lógica
    await middleware(req, res, next);

    // Verificación
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error al verificar permisos' });
    expect(next).not.toHaveBeenCalled();
  });
});
