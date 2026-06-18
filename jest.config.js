/**
 * Configuración de Jest para proyecto ESM (type: "module").
 * Requiere ejecutar con NODE_OPTIONS=--experimental-vm-modules
 * (ver scripts "test" en package.json).
 */
export default {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  transform: {},
  verbose: true,
  collectCoverageFrom: [
    'src/validators/**/*.js',
    'src/utils/**/*.js',
    'src/middlewares/**/*.js',
    'src/services/**/*.js',
  ],
  coverageDirectory: 'coverage',
  setupFiles: ['<rootDir>/tests/setup.js'],
};
