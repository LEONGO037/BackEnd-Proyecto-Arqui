import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";
import "./src/config/db.js";
import { logger, logAplicacion } from "./src/services/logger.service.js";

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(`Servidor corriendo en: http://localhost:${PORT}`);
});

// ---------------------------------------------------------------------------
// Manejo de errores no capturados — Punto 3
//
// Cualquier excepción o promesa rechazada que escape al manejador de Express
// queda registrada. No se imprime el stack crudo en consola en producción.
// ---------------------------------------------------------------------------
process.on("unhandledRejection", (reason) => {
  logger.error("Promesa rechazada sin manejar", reason);
  logAplicacion({
    nivel: "ERROR",
    modulo: "process",
    evento: "UNHANDLED_REJECTION",
    mensaje: reason instanceof Error ? reason.message : String(reason),
    detalle: {
      stack: reason instanceof Error ? reason.stack : undefined,
    },
  }).catch(() => { });
});

process.on("uncaughtException", (err) => {
  logger.error("Excepción no capturada", err);
  logAplicacion({
    nivel: "ERROR",
    modulo: "process",
    evento: "UNCAUGHT_EXCEPTION",
    mensaje: err.message,
    detalle: { stack: err.stack },
  })
    .catch(() => { })
    .finally(() => {
      // Política recomendada: tras una excepción no capturada, el estado del
      // proceso es indefinido. Cerramos el server con gracia y dejamos que
      // el supervisor (PM2/Docker/etc.) lo reinicie.
      server.close(() => process.exit(1));
      setTimeout(() => process.exit(1), 5000).unref();
    });
});

// Cierre limpio en SIGTERM/SIGINT
const cerrarLimpio = (señal) => {
  logger.info(`Recibido ${señal}, cerrando servidor...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
};

process.on("SIGTERM", () => cerrarLimpio("SIGTERM"));
process.on("SIGINT", () => cerrarLimpio("SIGINT"));
