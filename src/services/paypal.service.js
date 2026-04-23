// src/services/paypal.service.js
const BASE_URL = 'https://api-m.sandbox.paypal.com';

const getAccessToken = async () => {
  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`PayPal auth error: ${data.error_description}`);
  return data.access_token;
};

/**
 * Crea una orden de pago en PayPal
 * @param {number} monto - Monto en USD
 * @param {string} descripcion - Descripción del item
 * @param {number} cursoId - ID del curso para referencia
 */
export const crearOrden = async (monto, descripcion, cursoId) => {
  const token = await getAccessToken();

  const res = await fetch(`${BASE_URL}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: `curso_${cursoId}`,
          description: descripcion,
          amount: {
            currency_code: 'USD',
            value: monto.toFixed(2),
          },
        },
      ],
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Error al crear orden: ${JSON.stringify(data)}`);
  return data;
};

/**
 * Captura (cobra) una orden ya aprobada por el usuario
 * @param {string} orderId - ID de la orden PayPal
 */
export const capturarOrden = async (orderId) => {
  const token = await getAccessToken();

  const res = await fetch(`${BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Error al capturar orden: ${JSON.stringify(data)}`);
  return data; // Completado
};