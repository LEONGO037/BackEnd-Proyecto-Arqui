import { realizarBackupLogico } from '../src/services/backup.service.js';

async function run() {
  console.log('Iniciando backup lógico de la base de datos Supabase...');
  try {
    const res = await realizarBackupLogico();
    console.log('Backup completado con éxito! Detalle:', res);
  } catch (err) {
    console.error('Error al realizar backup:', err);
  }
}

run();
