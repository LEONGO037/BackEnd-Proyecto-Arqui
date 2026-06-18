// Variables de entorno mínimas para los tests (evita que módulos lean .env real)
process.env.JWT_SECRET = 'test-secret-key-for-unit-tests';
process.env.PAYPAL_CLIENT_ID = 'test-paypal-client-id';
process.env.PAYPAL_CLIENT_SECRET = 'test-paypal-secret';
process.env.NODE_ENV = 'test';
