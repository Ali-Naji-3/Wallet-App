
import mysql from 'mysql2/promise';

async function listUsers() {
    try {
        const host = process.env.MYSQL_HOST || 'localhost';
        const port = Number(process.env.MYSQL_PORT || 3306);
        const user = process.env.MYSQL_USER || 'root';
        const password = process.env.MYSQL_PASSWORD || '';
        const database = process.env.MYSQL_DB || 'fxwallet';

        const pool = mysql.createPool({ host, port, user, password, database });

        const [rows] = await pool.query('SELECT id, email, full_name, role FROM users LIMIT 20');
        console.table(rows);

        await pool.end();
    } catch (err) {
        console.error(err);
    }
}

listUsers();
