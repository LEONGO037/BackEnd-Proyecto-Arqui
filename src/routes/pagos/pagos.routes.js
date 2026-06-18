import express from 'express';
import { body } from 'express-validator';
import {
  getConfig,
  postCrearOrden,
  postCapturarOrden,
  getTodosLosPagos,
  getPagosUsuario
} from '../../controllers/pagos/pagos.controller.js';
import { validarCampos } from '../../middlewares/validation.middleware.js';

const router = express.Router();

// Reglas de validación para pagos (Tolerancia a fallos)
const reglasCrearOrden = [
  body('curso_ids')
    .optional()
    .isArray().withMessage('curso_ids debe ser un arreglo'),
  body('curso_id')
    .optional()
    .isInt({ min: 1 }).withMessage('curso_id debe ser un entero positivo'),
  validarCampos
];

const reglasCapturarOrden = [
  body('orderID')
    .trim()
    .notEmpty().withMessage('El orderID de PayPal es obligatorio'),
  validarCampos
];

// Rutas de Pagos
// NOTA: verificarToken ya NO se agrega de forma manual ya que secureByDefault lo hace globalmente.
router.get('/config', getConfig);                                // público (se debe agregar a lista blanca)
router.post('/crear-orden', reglasCrearOrden, postCrearOrden);
router.post('/capturar-orden', reglasCapturarOrden, postCapturarOrden);
router.get('/', getTodosLosPagos);                               // Privado (por defecto token)
router.get('/usuario', getPagosUsuario);                         // Privado (por defecto token)

export default router;
