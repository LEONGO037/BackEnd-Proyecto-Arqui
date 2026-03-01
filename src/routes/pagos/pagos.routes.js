// src/routes/pagos/pagos.routes.js
import express from 'express';
import { verificarToken } from '../../middlewares/autenticacion.middleware.js';
import { getConfig, postCrearOrden, postCapturarOrden } from '../../controllers/pagos/pagos.controller.js';

const router = express.Router();

router.get('/config', getConfig);                          // público — devuelve clientId
router.post('/crear-orden', verificarToken, postCrearOrden);
router.post('/capturar-orden', verificarToken, postCapturarOrden);

export default router;
