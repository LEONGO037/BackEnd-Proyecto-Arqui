import pool from "../src/config/db.js";

const sql = `
CREATE TABLE IF NOT EXISTS public.riesgos_matriz (
    id SERIAL PRIMARY KEY,
    activo_informacion VARCHAR(255) NOT NULL,
    amenaza_vulnerabilidad TEXT NOT NULL,
    consecuencia_riesgo TEXT NOT NULL,
    probabilidad_inherente SMALLINT NOT NULL CHECK (probabilidad_inherente BETWEEN 1 AND 5),
    impacto_inherente SMALLINT NOT NULL CHECK (impacto_inherente BETWEEN 1 AND 5),
    riesgo_inherente INT NOT NULL,
    nivel_riesgo_inherente VARCHAR(20) NOT NULL,
    tratamiento_riesgo VARCHAR(50) NOT NULL,
    controles_implementar TEXT NOT NULL,
    control_tipo VARCHAR(50) NOT NULL,
    control_nivel VARCHAR(50) NOT NULL,
    control_frecuencia VARCHAR(50) NOT NULL,
    probabilidad_residual SMALLINT NOT NULL CHECK (probabilidad_residual BETWEEN 1 AND 5),
    impacto_residual SMALLINT NOT NULL CHECK (impacto_residual BETWEEN 1 AND 5),
    riesgo_residual INT NOT NULL,
    nivel_riesgo_residual VARCHAR(20) NOT NULL,
    responsable_nombre VARCHAR(150),
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Delete old seed if it exists to avoid duplication when running multiple times
TRUNCATE TABLE public.riesgos_matriz RESTART IDENTITY;

INSERT INTO public.riesgos_matriz (
    activo_informacion, amenaza_vulnerabilidad, consecuencia_riesgo,
    probabilidad_inherente, impacto_inherente, riesgo_inherente, nivel_riesgo_inherente,
    tratamiento_riesgo, controles_implementar, control_tipo, control_nivel, control_frecuencia,
    probabilidad_residual, impacto_residual, riesgo_residual, nivel_riesgo_residual,
    responsable_nombre
) VALUES
(
    'Sistema Core de Pólizas y Siniestros',
    'Colusión de funcionarios de nivel medio de Finanzas y Tecnología para modificar información del sistema core',
    'Fraude interno, pagos irregulares de indemnizaciones a proveedores inexistentes, pérdidas económicas por aproximadamente USD 1,8 millones, afectación de la integridad de la información',
    4, 5, 20, 'Extremo',
    'Reducir',
    'Reforzar la segregación de funciones, doble validación obligatoria de pagos e indemnizaciones, y revisiones independientes periódicas de operaciones de alto riesgo',
    'P, D', 'A', 'PT',
    2, 4, 8, 'Moderado',
    'Juan Pérez (Gestión de Riesgos)'
),
(
    'Directorio Activo',
    'Usuarios genéricos con privilegios administrativos permanentemente activos en el AD',
    'Accesos no atribuibles, ocultamiento de actividades fraudulentas, pérdida de trazabilidad e imputabilidad',
    4, 4, 16, 'Alto',
    'Reducir',
    'Eliminar usuarios genéricos del AD, asignar cuentas nominales e individuales y revisar privilegios administrativos',
    'P, D', 'A', 'PT',
    1, 3, 3, 'Bajo',
    'Ana María Gómez (Seguridad IT)'
),
(
    'Sistema Core de Pólizas y Siniestros',
    'Ausencia de monitoreo continuo sobre cambios críticos en el sistema core',
    'Modificaciones no detectadas oportunamente, fraude interno no identificado a tiempo',
    3, 5, 15, 'Alto',
    'Reducir',
    'Implementar monitoreo continuo y alertas automáticas sobre cambios críticos en el sistema core',
    'D', 'A', 'D',
    2, 3, 6, 'Moderado',
    'Carlos Dávila (Sistemas)'
),
(
    'Registros de Auditoría (Logs)',
    'Inconsistencias en los registros de auditoría y eliminación de eventos',
    'Pérdida de evidencia, imposibilidad de reconstruir incidentes, encubrimiento de fraude',
    3, 4, 12, 'Alto',
    'Reducir',
    'Centralizar y proteger los logs con almacenamiento inmutable y revisión periódica de integridad de las pistas de auditoría',
    'P, D', 'A', 'S',
    1, 3, 3, 'Bajo',
    'Sofía Rodríguez (Auditoría)'
),
(
    'Proceso de Autorización de Pagos',
    'Aprobación de pagos sin doble validación',
    'Pagos irregulares no detectados, salidas de dinero fraudulentas',
    3, 5, 15, 'Alto',
    'Reducir',
    'Configurar control de doble validación obligatorio para la aprobación de pagos e indemnizaciones',
    'P', 'A', 'PT',
    1, 3, 3, 'Bajo',
    'Ramiro Valdez (Finanzas)'
),
(
    'Gestión de Accesos',
    'Revisiones periódicas de accesos no realizadas por más de seis meses',
    'Accesos privilegiados indebidos vigentes, acumulación de privilegios, facilitación de fraude interno',
    3, 4, 12, 'Alto',
    'Reducir',
    'Establecer y ejecutar revisiones periódicas (recertificación) de accesos y privilegios con periodicidad definida',
    'P, D', 'S', 'S',
    2, 2, 4, 'Bajo',
    'Gabriel Rocha (Seguridad IT)'
);
`;

console.log("Creando tabla riesgos_matriz y cargando semillas...");
pool.query(sql)
  .then(() => {
      console.log("¡Éxito! Tabla creada y semillas cargadas correctamente.");
      process.exit(0);
  })
  .catch((err) => {
      console.error("Error al inicializar la base de datos:", err);
      process.exit(1);
  });
