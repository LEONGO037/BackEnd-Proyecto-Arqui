import pool from "../src/config/db.js";

const sql = `
DROP TABLE IF EXISTS public.riesgos_matriz CASCADE;

CREATE TABLE public.riesgos_matriz (
    id SERIAL PRIMARY KEY,
    activo_informacion VARCHAR(255) NOT NULL,
    amenazas JSONB NOT NULL DEFAULT '[]'::jsonb,
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed data matching the Excel sheet but structured as granular threats
INSERT INTO public.riesgos_matriz (activo_informacion, amenazas) VALUES
(
    'Sistema Core de Pólizas y Siniestros',
    '[
        {
            "id": "t1",
            "amenaza_vulnerabilidad": "Colusión de funcionarios de nivel medio de Finanzas y Tecnología para modificar información del sistema core",
            "consecuencia_riesgo": "Fraude interno, pagos irregulares de indemnizaciones a proveedores inexistentes, pérdidas económicas por aproximadamente USD 1,8 millones, afectación de la integridad de la información",
            "probabilidad_inherente": 4,
            "impacto_inherente": 5,
            "riesgo_inherente": 20,
            "nivel_riesgo_inherente": "Extremo",
            "tratamiento_riesgo": "Reducir",
            "controles_implementar": "Reforzar la segregación de funciones, doble validación obligatoria de pagos e indemnizaciones, y revisiones independientes periódicas de operaciones de alto riesgo",
            "control_tipo": "P, D",
            "control_nivel": "A",
            "control_frecuencia": "PT",
            "probabilidad_residual": 2,
            "impacto_residual": 4,
            "riesgo_residual": 8,
            "nivel_riesgo_residual": "Moderado",
            "plan_accion": [
                "Establecer comité de doble firma para transferencias bancarias de alto valor.",
                "Implementar alertas automatizadas de transacciones superiores a límites de tolerancia."
            ],
            "fecha_limite": "2026-06-30",
            "responsable_id": null,
            "responsable_nombre": "Alessandro (ADMIN_SEGURIDAD)"
        },
        {
            "id": "t2",
            "amenaza_vulnerabilidad": "Ausencia de monitoreo continuo sobre cambios críticos en el sistema core",
            "consecuencia_riesgo": "Modificaciones no detectadas oportunamente, fraude interno no identificado a tiempo",
            "probabilidad_inherente": 3,
            "impacto_inherente": 5,
            "riesgo_inherente": 15,
            "nivel_riesgo_inherente": "Alto",
            "tratamiento_riesgo": "Reducir",
            "controles_implementar": "Implementar monitoreo continuo y alertas automáticas sobre cambios críticos en el sistema core",
            "control_tipo": "D",
            "control_nivel": "A",
            "control_frecuencia": "D",
            "probabilidad_residual": 2,
            "impacto_residual": 3,
            "riesgo_residual": 6,
            "nivel_riesgo_residual": "Moderado",
            "plan_accion": [
                "Configurar triggers de base de datos en tablas críticas del core.",
                "Habilitar notificaciones en tiempo real vía Slack/Email al equipo de respuesta a incidentes."
            ],
            "fecha_limite": "2026-07-15",
            "responsable_id": null,
            "responsable_nombre": "Alessandro (ADMIN_SEGURIDAD)"
        }
    ]'::jsonb
),
(
    'Directorio Activo',
    '[
        {
            "id": "t3",
            "amenaza_vulnerabilidad": "Usuarios genéricos con privilegios administrativos permanentemente activos en el AD",
            "consecuencia_riesgo": "Accesos no atribuibles, ocultamiento de actividades fraudulentas, pérdida de trazabilidad e imputabilidad",
            "probabilidad_inherente": 4,
            "impacto_inherente": 4,
            "riesgo_inherente": 16,
            "nivel_riesgo_inherente": "Alto",
            "tratamiento_riesgo": "Reducir",
            "controles_implementar": "Eliminar usuarios genéricos del AD, asignar cuentas nominales e individuales y revisar privilegios administrativos",
            "control_tipo": "P, D",
            "control_nivel": "A",
            "control_frecuencia": "PT",
            "probabilidad_residual": 1,
            "impacto_residual": 3,
            "riesgo_residual": 3,
            "nivel_riesgo_residual": "Bajo",
            "plan_accion": [
                "Auditar todas las cuentas de administrador vigentes en el AD.",
                "Deshabilitar cuentas genéricas y crear cuentas nominales para administradores.",
                "Configurar MFA obligatorio para accesos con privilegios elevados."
            ],
            "fecha_limite": "2026-06-15",
            "responsable_id": null,
            "responsable_nombre": "Alessandro (ADMIN_SEGURIDAD)"
        }
    ]'::jsonb
),
(
    'Registros de Auditoría (Logs)',
    '[
        {
            "id": "t4",
            "amenaza_vulnerabilidad": "Inconsistencias en los registros de auditoría y eliminación de eventos",
            "consecuencia_riesgo": "Pérdida de evidencia, imposibilidad de reconstruir incidentes, encubrimiento de fraude",
            "probabilidad_inherente": 3,
            "impacto_inherente": 4,
            "riesgo_inherente": 12,
            "nivel_riesgo_inherente": "Alto",
            "tratamiento_riesgo": "Reducir",
            "controles_implementar": "Centralizar y proteger los logs con almacenamiento inmutable y revisión periódica de integridad de las pistas de auditoría",
            "control_tipo": "P, D",
            "control_nivel": "A",
            "control_frecuencia": "S",
            "probabilidad_residual": 1,
            "impacto_residual": 3,
            "riesgo_residual": 3,
            "nivel_riesgo_residual": "Bajo",
            "plan_accion": [
                "Configurar syslog centralizado hacia un servidor seguro y aislado.",
                "Implementar firmas criptográficas (checksums) en los archivos de log.",
                "Activar alertas tempranas ante desconexiones del logger."
            ],
            "fecha_limite": "2026-08-01",
            "responsable_id": null,
            "responsable_nombre": "Alessandro (ADMIN_SEGURIDAD)"
        }
    ]'::jsonb
),
(
    'Proceso de Autorización de Pagos',
    '[
        {
            "id": "t5",
            "amenaza_vulnerabilidad": "Aprobación de pagos sin doble validación",
            "consecuencia_riesgo": "Pagos irregulares no detectados, salidas de dinero fraudulentas",
            "probabilidad_inherente": 3,
            "impacto_inherente": 5,
            "riesgo_inherente": 15,
            "nivel_riesgo_inherente": "Alto",
            "tratamiento_riesgo": "Reducir",
            "controles_implementar": "Configurar control de doble validación obligatorio para la aprobación de pagos e indemnizaciones",
            "control_tipo": "P",
            "control_nivel": "A",
            "control_frecuencia": "PT",
            "probabilidad_residual": 1,
            "impacto_residual": 3,
            "riesgo_residual": 3,
            "nivel_riesgo_residual": "Bajo",
            "plan_accion": [
                "Modificar la lógica de aprobación en el backend del módulo de pagos.",
                "Implementar firma digital/MFA obligatorio para los autorizadores.",
                "Establecer auditorías retrospectivas mensuales sobre el 100% de los pagos."
            ],
            "fecha_limite": "2026-06-20",
            "responsable_id": null,
            "responsable_nombre": "Alessandro (ADMIN_SEGURIDAD)"
        }
    ]'::jsonb
),
(
    'Gestión de Accesos',
    '[
        {
            "id": "t6",
            "amenaza_vulnerabilidad": "Revisiones periódicas de accesos no realizadas por más de seis meses",
            "consecuencia_riesgo": "Accesos privilegiados indebidos vigentes, acumulación de privilegios, facilitación de fraude interno",
            "probabilidad_inherente": 3,
            "impacto_inherente": 4,
            "riesgo_inherente": 12,
            "nivel_riesgo_inherente": "Alto",
            "tratamiento_riesgo": "Reducir",
            "controles_implementar": "Establecer y ejecutar revisiones periódicas (recertificación) de accesos y privilegios con periodicidad definida",
            "control_tipo": "P, D",
            "control_nivel": "S",
            "control_frecuencia": "S",
            "probabilidad_residual": 2,
            "impacto_residual": 2,
            "riesgo_residual": 4,
            "nivel_riesgo_residual": "Bajo",
            "plan_accion": [
                "Calendarizar revisiones de accesos obligatorias al final de cada mes.",
                "Automatizar reportes de cuentas inactivas con permisos remanentes.",
                "Establecer política de revocación automática a las 48 horas de inactividad."
            ],
            "fecha_limite": "2026-07-31",
            "responsable_id": null,
            "responsable_nombre": "Alessandro (ADMIN_SEGURIDAD)"
        }
    ]'::jsonb
);
`;

console.log("Recreando tabla riesgos_matriz con soporte granular JSONB y cargando semillas...");
pool.query(sql)
  .then(() => {
      console.log("¡Éxito! Tabla granular recreada y semillas cargadas correctamente.");
      process.exit(0);
  })
  .catch((err) => {
      console.error("Error al inicializar la base de datos granular:", err);
      process.exit(1);
  });
