import pool from "../src/config/db.js";

const sql = `
INSERT INTO public.riesgos_matriz (activo_informacion, amenazas) VALUES
(
    'Base de Datos de Inscripciones y Calificaciones',
    '[
        {
            "id": "t_ins_01",
            "amenaza_vulnerabilidad": "Inyección SQL o explotación de fallos de autorización en el endpoint de actualización de inscripciones",
            "consecuencia_riesgo": "Alteración de registros académicos, inscripciones fraudulentas de estudiantes sin pago, y pérdida de integridad y confiabilidad de los datos académicos.",
            "probabilidad_inherente": 3,
            "impacto_inherente": 5,
            "riesgo_inherente": 15,
            "nivel_riesgo_inherente": "Alto",
            "tratamiento_riesgo": "Reducir",
            "controles_implementar": "Implementar ORM con consultas parametrizadas, middleware de validación estricta de tokens JWT, y auditoría obligatoria de todos los cambios en tablas de inscripciones (log de aplicación).",
            "control_tipo": "P, D",
            "control_nivel": "A",
            "control_frecuencia": "PT",
            "probabilidad_residual": 1,
            "impacto_residual": 5,
            "riesgo_residual": 5,
            "nivel_riesgo_residual": "Moderado",
            "plan_accion": [
                "Auditar código de endpoints de inscripciones usando herramientas de análisis estático (SAST).",
                "Configurar reglas de Web Application Firewall (WAF) para bloquear payloads maliciosos.",
                "Implementar verificación criptográfica de integridad de registros de inscripciones."
            ],
            "fecha_limite": "2026-06-15",
            "responsable_id": null,
            "responsable_nombre": "Alessandro (ADMIN_SEGURIDAD)"
        }
    ]'::jsonb
),
(
    'Credenciales de API de Pagos (Paypal / Pasarela)',
    '[
        {
            "id": "t_ins_02",
            "amenaza_vulnerabilidad": "Fuga de API Keys de producción o manipulación del webhook de confirmación de pagos de Paypal",
            "consecuencia_riesgo": "Pérdida económica por inscripciones validadas con transacciones falsas, exfiltración de credenciales financieras del sistema, y daño reputacional a la institución.",
            "probabilidad_inherente": 2,
            "impacto_inherente": 5,
            "riesgo_inherente": 10,
            "nivel_riesgo_inherente": "Alto",
            "tratamiento_riesgo": "Reducir",
            "controles_implementar": "Almacenamiento seguro de secretos usando variables de entorno cifradas (Supabase vault/dotenv cifrado), validación criptográfica de firmas de webhooks de Paypal, y rate limiting estricto.",
            "control_tipo": "P, D",
            "control_nivel": "A",
            "control_frecuencia": "PT",
            "probabilidad_residual": 1,
            "impacto_residual": 5,
            "riesgo_residual": 5,
            "nivel_riesgo_residual": "Moderado",
            "plan_accion": [
                "Rotar las llaves de API de Paypal de producción cada 90 días de forma automatizada.",
                "Implementar la verificación de la firma del webhook con la clave secreta proporcionada por Paypal.",
                "Configurar alertas críticas ante cualquier intento fallido de validación de firma de webhook."
            ],
            "fecha_limite": "2026-07-01",
            "responsable_id": null,
            "responsable_nombre": "Alessandro (ADMIN_SEGURIDAD)"
        }
    ]'::jsonb
);
`;

console.log("Insertando los 2 nuevos riesgos identificados...");
pool.query(sql)
  .then(() => {
      console.log("¡Éxito! Riesgos insertados.");
      process.exit(0);
  })
  .catch((err) => {
      console.error("Error al insertar riesgos:", err);
      process.exit(1);
  });
