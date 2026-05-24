/**
 * ============================================================================
 *  MARVIN MOLLO — Pruebas unitarias del servicio de PayPal y emisión de facturas
 * ============================================================================
 *  Archivos bajo prueba:
 *    - src/services/paypal.service.js (crearOrden, capturarOrden)
 *    - src/services/factura/emisionFactura.service.js (procesarFacturacion)
 *    - src/services/factura/factura.service.js (generarFacturaPDF)
 *
 *  Estrategia: se mockea fetch global, el modelo de facturas y el servicio
 *  de email para verificar la orquestación sin llamadas reales a PayPal/SMTP.
 *
 *  Cada test sigue las 3 partes:
 *    1) Preparación (Arrange)
 *    2) Lógica de la prueba (Act)
 *    3) Verificación del resultado esperado (Assert)
 * ============================================================================
 */

import { jest } from '@jest/globals';

// ─── Mocks ────────────────────────────────────────────────────────────────────
jest.unstable_mockModule('../../src/models/factura/factura.model.js', () => ({
  obtenerCursosPorIds: jest.fn(),
}));

jest.unstable_mockModule('../../src/services/factura/email.service.js', () => ({
  enviarFacturaPorCorreo: jest.fn().mockResolvedValue(true),
}));

const facturaModel = await import('../../src/models/factura/factura.model.js');
const facturaEmail = await import('../../src/services/factura/email.service.js');

const { crearOrden, capturarOrden } = await import(
  '../../src/services/paypal.service.js'
);
const { procesarFacturacion } = await import(
  '../../src/services/factura/emisionFactura.service.js'
);
const { generarFacturaPDF } = await import(
  '../../src/services/factura/factura.service.js'
);

// Helper para mockear fetch
const mockFetch = (responses) => {
  let i = 0;
  global.fetch = jest.fn(() => {
    const r = responses[i++] ?? responses[responses.length - 1];
    return Promise.resolve({
      ok: r.ok,
      json: () => Promise.resolve(r.data),
    });
  });
};

describe('MARVIN MOLLO - paypal.service + emisionFactura.service + factura.service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── paypal.service: crearOrden ───────────────────────────────────────────

  test('1. crearOrden devuelve los datos de la orden cuando PayPal responde 200', async () => {
    // Preparación
    mockFetch([
      { ok: true, data: { access_token: 'tok-123' } },           // /oauth2/token
      { ok: true, data: { id: 'ORDER-ABC', status: 'CREATED' } },// /checkout/orders
    ]);

    // Lógica
    const orden = await crearOrden(35.50, 'Inscripción curso X', 7);

    // Verificación
    expect(orden).toEqual({ id: 'ORDER-ABC', status: 'CREATED' });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test('2. crearOrden lanza error cuando la autenticación de PayPal falla', async () => {
    // Preparación
    mockFetch([
      { ok: false, data: { error_description: 'invalid_client' } },
    ]);

    // Lógica + Verificación
    await expect(crearOrden(10, 'desc', 1))
      .rejects.toThrow(/PayPal auth error/);
  });

  test('3. crearOrden envía el monto formateado a 2 decimales en el body', async () => {
    // Preparación
    mockFetch([
      { ok: true, data: { access_token: 'tok' } },
      { ok: true, data: { id: 'X' } },
    ]);

    // Lógica
    await crearOrden(12.3, 'Curso Y', 99);

    // Verificación: 12.3 → "12.30"
    const segundaLlamada = global.fetch.mock.calls[1];
    const body = JSON.parse(segundaLlamada[1].body);
    expect(body.purchase_units[0].amount.value).toBe('12.30');
    expect(body.purchase_units[0].reference_id).toBe('curso_99');
  });

  // ─── paypal.service: capturarOrden ────────────────────────────────────────

  test('4. capturarOrden devuelve el resultado de la captura cuando PayPal responde OK', async () => {
    // Preparación
    mockFetch([
      { ok: true, data: { access_token: 'tok' } },
      { ok: true, data: { id: 'CAP-1', status: 'COMPLETED' } },
    ]);

    // Lógica
    const captura = await capturarOrden('ORDER-1');

    // Verificación
    expect(captura).toEqual({ id: 'CAP-1', status: 'COMPLETED' });
  });

  test('5. capturarOrden lanza error cuando PayPal responde no-OK al capturar', async () => {
    // Preparación
    mockFetch([
      { ok: true, data: { access_token: 'tok' } },
      { ok: false, data: { details: 'ORDER_NOT_APPROVED' } },
    ]);

    // Lógica + Verificación
    await expect(capturarOrden('ORDER-MAL'))
      .rejects.toThrow(/Error al capturar orden/);
  });

  // ─── emisionFactura.service: procesarFacturacion ──────────────────────────

  test('6. procesarFacturacion lanza CURSOS_NO_ENCONTRADOS cuando el modelo devuelve []', async () => {
    // Preparación
    facturaModel.obtenerCursosPorIds.mockResolvedValue([]);

    // Lógica + Verificación
    await expect(procesarFacturacion({
      nombre: 'Ana', email: 'a@ucb.edu.bo', curso_ids: [1, 2], transaccionId: 'TX',
    })).rejects.toThrow('CURSOS_NO_ENCONTRADOS');
  });

  test('7. procesarFacturacion calcula correctamente el total sumando costos de cursos', async () => {
    // Preparación
    facturaModel.obtenerCursosPorIds.mockResolvedValue([
      { id: 1, nombre: 'Curso A', costo: '120.50' },
      { id: 2, nombre: 'Curso B', costo: '79.50' },
    ]);

    // Lógica
    const resultado = await procesarFacturacion({
      nombre: 'Ana', email: 'a@ucb.edu.bo', nit: '123',
      curso_ids: [1, 2], transaccionId: 'TX-1',
    });

    // Verificación: 120.50 + 79.50 = 200
    expect(resultado.totalPagado).toBe(200);
    expect(resultado.destinatario).toBe('a@ucb.edu.bo');
    expect(resultado.transaccion).toBe('TX-1');
  });

  test('8. procesarFacturacion invoca enviarFacturaPorCorreo con email y un buffer PDF', async () => {
    // Preparación
    facturaModel.obtenerCursosPorIds.mockResolvedValue([
      { id: 1, nombre: 'Curso Único', costo: '50' },
    ]);

    // Lógica
    await procesarFacturacion({
      nombre: 'Bob', email: 'bob@ucb.edu.bo',
      curso_ids: [1], transaccionId: 'TX-2',
    });

    // Verificación
    expect(facturaEmail.enviarFacturaPorCorreo).toHaveBeenCalledTimes(1);
    const args = facturaEmail.enviarFacturaPorCorreo.mock.calls[0];
    expect(args[0]).toBe('bob@ucb.edu.bo');
    expect(Buffer.isBuffer(args[1])).toBe(true);
    expect(args[1].length).toBeGreaterThan(0);
  });

  // ─── factura.service: generarFacturaPDF ───────────────────────────────────

  test('9. generarFacturaPDF retorna un Buffer no vacío con cabecera de PDF', async () => {
    // Preparación
    const datos = {
      cliente: { nombre: 'Carla', email: 'carla@ucb.edu.bo', nit: '999' },
      cursos: [{ nombre: 'Arquitectura', costo: 200, cantidad: 1 }],
      totalBs: 200,
      transaccionId: 'TX-PDF',
    };

    // Lógica
    const buffer = await generarFacturaPDF(datos);

    // Verificación: los PDFs empiezan con "%PDF"
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.toString('ascii', 0, 4)).toBe('%PDF');
  });

  test('10. generarFacturaPDF maneja correctamente múltiples cursos en la factura', async () => {
    // Preparación
    const datos = {
      cliente: { nombre: 'Diego', email: 'diego@ucb.edu.bo' },
      cursos: [
        { nombre: 'C1', costo: 100, cantidad: 1 },
        { nombre: 'C2', costo: 150, cantidad: 1 },
        { nombre: 'C3', costo: 80, cantidad: 1 },
      ],
      totalBs: 330,
      transaccionId: 'TX-MULTI',
    };

    // Lógica
    const buffer = await generarFacturaPDF(datos);

    // Verificación: el PDF se generó (buffer válido) y NO se cae con múltiples filas
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000); // un PDF mínimo pesa más de 1KB
  });
});
