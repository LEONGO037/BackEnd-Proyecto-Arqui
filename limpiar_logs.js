import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "college_x_nexus",
    password: process.env.DB_PASSWORD || "123456",
    port: process.env.DB_PORT || 5432,
});

async function main() {
    try {
        console.log("Limpiando logs sin usuario ni email...");
        const res = await pool.query(`
            DELETE FROM log_seguridad 
            WHERE (usuario_id IS NULL AND (email IS NULL OR email = '' OR email = '-'))
        `);
        console.log(`Borrados ${res.rowCount} registros basura.`);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
main();
