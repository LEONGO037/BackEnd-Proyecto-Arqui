// src/routes/pagos/factura.routes.js
import { Router } from 'express';
import { postGenerarYEnviarFactura } from '../../controllers/pagos/factura.controller.js';
import { verificarToken } from "../../middlewares/autenticacion.middleware.js";

const router = Router();

router.post('/enviar', verificarToken, postGenerarYEnviarFactura);

export default router;