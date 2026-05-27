import fs from 'fs';
import path from 'path';
import pool from '../config/db.js';
import { logger } from './logger.service.js';

/**
 * Genera un backup lógico de la base de datos en formato SQL.
 * Extrae la lista de tablas públicas y construye comandos INSERT para cada registro.
 * Guarda el archivo resultante en la carpeta "backups" del backend.
 */
export const realizarBackupLogico = async () => {
  const backupsDir = path.resolve('backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const fechaStr = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
  const backupPath = path.join(backupsDir, `backup_${fechaStr}.sql`);

  let client;
  try {
    client = await pool.connect();
    
    // Obtener todas las tablas públicas
    const tablasRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT IN ('sincronizaciones', 'sincronizacion')
      ORDER BY table_name;
    `);

    const tablas = tablasRes.rows.map(r => r.table_name);
    let sqlContent = `-- --------------------------------------------------\n`;
    sqlContent += `-- BACKUP LÓGICO GENERADO AUTOMÁTICAMENTE\n`;
    sqlContent += `-- Fecha: ${new Date().toLocaleString('es-BO')}\n`;
    sqlContent += `-- --------------------------------------------------\n\n`;
    sqlContent += `SET statement_timeout = 0;\n`;
    sqlContent += `SET client_encoding = 'UTF8';\n\n`;

    for (const tabla of tablas) {
      sqlContent += `-- --------------------------------------------------\n`;
      sqlContent += `-- Datos para la tabla: public.${tabla}\n`;
      sqlContent += `-- --------------------------------------------------\n`;

      // Obtener columnas
      const colsRes = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [tabla]);

      const columnasInfo = colsRes.rows;
      const columnasNames = columnasInfo.map(c => c.column_name);

      // Obtener registros
      const datosRes = await client.query(`SELECT * FROM public.${tabla}`);
      
      if (datosRes.rows.length > 0) {
        sqlContent += `TRUNCATE TABLE public.${tabla} CASCADE;\n\n`;
        
        for (const fila of datosRes.rows) {
          const valoresFormateados = columnasInfo.map(c => {
            const val = fila[c.column_name];
            if (val === null || val === undefined) return 'NULL';
            
            if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
            if (typeof val === 'number') return String(val);
            if (typeof val === 'object') {
              if (val instanceof Date) {
                return `'${val.toISOString()}'`;
              }
              return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
            }
            
            // Strings, fechas y otros
            return `'${String(val).replace(/'/g, "''")}'`;
          });

          sqlContent += `INSERT INTO public.${tabla} (${columnasNames.join(', ')}) VALUES (${valoresFormateados.join(', ')});\n`;
        }
        sqlContent += `\n`;
      } else {
        sqlContent += `-- (Sin registros)\n\n`;
      }
    }

    fs.writeFileSync(backupPath, sqlContent, 'utf8');
    logger.info(`Backup lógico completado con éxito en: ${backupPath}`);
    return { exito: true, ruta: backupPath };
  } catch (error) {
    logger.error('Error al realizar backup lógico de la base de datos:', error.message);
    throw error;
  } finally {
    if (client) client.release();
  }
};
