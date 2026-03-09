// src/routes/pagos/pagos.routes.js
import express from 'express';
import { verificarToken } from '../../middlewares/autenticacion.middleware.js';
import { getConfig, postCrearOrden, postCapturarOrden, getTodosLosPagos, getPagosUsuario } from '../../controllers/pagos/pagos.controller.js';

const router = express.Router();

router.get('/config', getConfig);                          // público — devuelve clientId
router.post('/crear-orden', verificarToken, postCrearOrden);
router.post('/capturar-orden', verificarToken, postCapturarOrden);
router.get('/', verificarToken, getTodosLosPagos);             // Admin (validación de rol en front según solicitud)
router.get('/usuario', verificarToken, getPagosUsuario);       // Estudiante

export default router;
