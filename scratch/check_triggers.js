import pool from '../src/config/db.js';

async function checkTriggers() {
  try {
    const res = await pool.query(`
      SELECT 
        trigger_name, 
        event_manipulation, 
        event_object_table, 
        action_statement, 
        action_timing
      FROM information_schema.triggers;
    `);
    console.log('Database Triggers:', res.rows);

    const resFuncs = await pool.query(`
      SELECT 
        routine_name, 
        routine_type
      FROM information_schema.routines
      WHERE routine_schema = 'public';
    `);
    console.log('Database Functions:', resFuncs.rows);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkTriggers();
