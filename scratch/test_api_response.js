import { obtenerLogsAplicacion, obtenerLogsSeguridad } from '../src/models/reportes/reportes.model.js';

async function run() {
  try {
    const appLogs = await obtenerLogsAplicacion({ limite: 1 });
    console.log('App log model return keys:', appLogs[0] ? Object.keys(appLogs[0]) : 'no logs');
    console.log('App log model return values:', appLogs[0]);

    const secLogs = await obtenerLogsSeguridad({ limite: 1 });
    console.log('Sec log model return keys:', secLogs[0] ? Object.keys(secLogs[0]) : 'no logs');
    console.log('Sec log model return values:', secLogs[0]);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
