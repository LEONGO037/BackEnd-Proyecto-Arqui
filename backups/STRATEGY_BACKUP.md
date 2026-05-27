# Estrategia de Backups Profesionales - Supabase

Este documento detalla la estrategia de backups y resiliencia de datos implementada para el proyecto.

## 1. Backups Físicos Automáticos (Supabase Managed)
La infraestructura principal de base de datos se encuentra alojada en **Supabase**.
- **Frecuencia:** Supabase realiza respaldos físicos (copias a nivel de almacenamiento) de forma automática **cada 24 horas**.
- **Retención:** La retención por defecto varía de acuerdo al plan (7 días en el nivel gratuito y hasta 30 días o más en planes Pro).
- **Proceso de Restauración:** En caso de desastre catastrófico o corrupción física, la restauración se solicita o ejecuta directamente a través del panel de control de Supabase.

---

## 2. Backups Lógicos Programados (Logical SQL Exporter)
Para evitar la dependencia exclusiva de Supabase y asegurar una completa portabilidad e independencia de la nube, se ha implementado un servicio de **backup lógico personalizado** en Node.js.

### ¿Cómo funciona?
El archivo [backup.service.js](file:///d:/KEVIN/UNIVERSIDAD%20TAREAS/S%C3%89PTIMO%20SEMESTRE/Arquitectura%20de%20Software/Primer%20Producto/BackEnd-Proyecto-Arqui/src/services/backup.service.js):
1. Se conecta a la base de datos PostgreSQL utilizando la configuración activa de pool (`db.js`).
2. Consulta el catálogo del sistema (`information_schema.tables` y `information_schema.columns`) para obtener todas las tablas públicas definidas y sus respectivos tipos de datos.
3. Lee de forma dinámica todos los registros de cada tabla.
4. Construye sentencias `TRUNCATE TABLE ... CASCADE` para cada tabla (para garantizar limpiezas seguras sin problemas de integridad referencial al restaurar).
5. Compone sentencias `INSERT INTO` formateando correctamente tipos especiales de datos (booleans, numbers, dates, JSONB).
6. Genera un único script SQL de volcado `.sql` estructurado y codificado en `UTF-8`.
7. Escribe el script en la carpeta local `/backups/` con el nombre `backup_YYYY_MM_DD.sql`.

### Ejecución Manual
Para realizar un respaldo inmediato, ejecute el siguiente comando desde la raíz del backend:
```bash
node scratch/run_backup.js
```
El archivo resultante se almacenará en la carpeta `backups/`.

### Automatización (Cron Job)
Para programar este backup en un entorno productivo (por ejemplo, diariamente a las 02:00 AM), se recomienda registrar la ejecución del runner en el crontab del servidor Linux:
```bash
0 2 * * * cd /ruta/al/proyecto/BackEnd-Proyecto-Arqui && node scratch/run_backup.js >> logs/backup_cron.log 2>&1
```

---

## 3. Estrategia de Recuperación ante Desastres
Para restaurar los datos lógicos en una base de datos limpia de desarrollo, pruebas o contingencia:
1. Asegúrese de que la base de datos vacía tenga el esquema de tablas ya creado.
2. Ejecute el archivo de volcado SQL contra la base de datos objetivo:
   ```bash
   psql -h <host> -U <usuario> -d <base_datos> -f backups/backup_YYYY_MM_DD.sql
   ```
   *Nota: Dado que el backup incluye sentencias TRUNCATE CASCADE, toda la información previa en las tablas será reemplazada por los datos del respaldo de forma consistente.*
