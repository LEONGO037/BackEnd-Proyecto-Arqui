/**
 * ============================================================================
 *  CHRISTIAN CORONEL — Pruebas unitarias del middleware de autenticación JWT
 * ============================================================================
 *  Archivo bajo prueba: src/middlewares/autenticacion.middleware.js
 *  Función probada    : verificarToken
 *
 *  Estrategia: se mockean jsonwebtoken y el pool de DB para aislar
 *  completamente la lógica del middleware (no se requiere DB ni JWT real).
 *
 *  Cada test sigue las 3 partes:
 *    1) Preparación (Arrange)
 *    2) Lógica de la prueba (Act)
 *    3) Verificación del resultado esperado (Assert)
 * ============================================================================
 */

import { jest } from '@jest/globals';

// ─── Mocks ────────────────────────────────────────────────────────────────────
jest.unstable_mockModule('jsonwebtoken', () => ({
  default: { verify: jest.fn() },
}));

jest.unstable_mockModule('../../src/config/db.js', () => ({
  default: { query: jest.fn() },
}));

const jwt = (await import('jsonwebtoken')).default;
const pool = (await import('../../src/config/db.js')).default;
const { verificarToken } = await import(
  '../../src/middlewares/autenticacion.middleware.js'
);

// Helpers
const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('CHRISTIAN CORONEL - verificarToken (autenticacion.middleware)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('1. Responde 401 cuando no se envía la cabecera Authorization', async () => {
    // Preparación
    const req = { headers: {} };
    const res = buildRes();
    const next = jest.fn();

    // Lógica
    await verificarToken(req, res, next);

    // Verificación
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token no proporcionado' });
    expect(next).not.toHaveBeenCalled();
  });

  test('2. Responde 401 cuando jwt.verify lanza una excepción (token inválido)', async () => {
    // Preparación
    jwt.verify.mockImplementation(() => { throw new Error('jwt malformed'); });
    const req = { headers: { authorization: 'Bearer token-roto' } };
    const res = buildRes();
    const next = jest.fn();

    // Lógica
    await verificarToken(req, res, next);

    // Verificación
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido o expirado' });
  });

  test('3. Llama a jwt.verify con audience e issuer correctos', async () => {
    // Preparación
    jwt.verify.mockReturnValue({ id: 1, iat: Math.floor(Date.now() / 1000) });
    pool.query.mockResolvedValue({ rows: [{ activo: true, password_cambiado_en: null }] });
    const req = { headers: { authorization: 'Bearer token-bueno' } };

    // Lógica
    await verificarToken(req, buildRes(), jest.fn());

    // Verificación
    expect(jwt.verify).toHaveBeenCalledWith(
      'token-bueno',
      'test-secret-key-for-unit-tests',
      { audience: 'college-x-nexus', issuer: 'ucb-api' }
    );
  });

  test('4. Responde 401 cuando el usuario está desactivado en BD', async () => {
    // Preparación
    jwt.verify.mockReturnValue({ id: 7, iat: Math.floor(Date.now() / 1000) });
    pool.query.mockResolvedValue({ rows: [{ activo: false, password_cambiado_en: null }] });
    const req = { headers: { authorization: 'Bearer x' } };
    const res = buildRes();
    const next = jest.fn();

    // Lógica
    await verificarToken(req, res, next);

    // Verificación
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido: usuario desactivado' });
    expect(next).not.toHaveBeenCalled();
  });

  test('5. Responde 401 si el token fue emitido antes del cambio de contraseña', async () => {
    // Preparación
    const ahoraSeg = Math.floor(Date.now() / 1000);
    jwt.verify.mockReturnValue({ id: 9, iat: ahoraSeg - 3600 }); // 1h antes
    pool.query.mockResolvedValue({
      rows: [{ activo: true, password_cambiado_en: new Date(ahoraSeg * 1000) }],
    });
    const req = { headers: { authorization: 'Bearer x' } };
    const res = buildRes();

    // Lógica
    await verificarToken(req, res, jest.fn());

    // Verificación
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Token inválido: contraseña cambiada recientemente',
    });
  });

  test('6. Llama a next() y adjunta req.usuario cuando todo es válido', async () => {
    // Preparación
    const payload = { id: 42, rol: 'ESTUDIANTE', iat: Math.floor(Date.now() / 1000) };
    jwt.verify.mockReturnValue(payload);
    pool.query.mockResolvedValue({ rows: [{ activo: true, password_cambiado_en: null }] });
    const req = { headers: { authorization: 'Bearer x' } };
    const res = buildRes();
    const next = jest.fn();

    // Lógica
    await verificarToken(req, res, next);

    // Verificación
    expect(req.usuario).toEqual(payload);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('7. Consulta a la BD por el id del usuario decodificado', async () => {
    // Preparación
    jwt.verify.mockReturnValue({ id: 99, iat: Math.floor(Date.now() / 1000) });
    pool.query.mockResolvedValue({ rows: [{ activo: true, password_cambiado_en: null }] });
    const req = { headers: { authorization: 'Bearer x' } };

    // Lógica
    await verificarToken(req, buildRes(), jest.fn());

    // Verificación
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT password_cambiado_en, activo FROM usuarios WHERE id = $1'),
      [99]
    );
  });

  test('8. Responde 401 si la consulta a la BD no encuentra usuario (rows vacío)', async () => {
    // Preparación
    jwt.verify.mockReturnValue({ id: 123, iat: Math.floor(Date.now() / 1000) });
    pool.query.mockResolvedValue({ rows: [] });
    const req = { headers: { authorization: 'Bearer x' } };
    const res = buildRes();
    const next = jest.fn();

    // Lógica
    await verificarToken(req, res, next);

    // Verificación
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido: usuario desactivado' });
    expect(next).not.toHaveBeenCalled();
  });

  test('9. Acepta el segundo segmento del header "Bearer <token>" como el token', async () => {
    // Preparación
    jwt.verify.mockReturnValue({ id: 1, iat: Math.floor(Date.now() / 1000) });
    pool.query.mockResolvedValue({ rows: [{ activo: true, password_cambiado_en: null }] });
    const req = { headers: { authorization: 'Bearer mi-jwt-token' } };

    // Lógica
    await verificarToken(req, buildRes(), jest.fn());

    // Verificación
    expect(jwt.verify.mock.calls[0][0]).toBe('mi-jwt-token');
  });

  test('10. Permite el acceso aún si password_cambiado_en es posterior pero el iat es posterior al cambio', async () => {
    // Preparación
    const ahoraSeg = Math.floor(Date.now() / 1000);
    jwt.verify.mockReturnValue({ id: 5, iat: ahoraSeg }); // emitido ahora
    pool.query.mockResolvedValue({
      rows: [{ activo: true, password_cambiado_en: new Date((ahoraSeg - 100) * 1000) }],
    });
    const req = { headers: { authorization: 'Bearer x' } };
    const res = buildRes();
    const next = jest.fn();

    // Lógica
    await verificarToken(req, res, next);

    // Verificación
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
