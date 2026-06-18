import db from './src/config/db.js'; db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'log_aplicacion'").then(res => console.log(res.rows));
