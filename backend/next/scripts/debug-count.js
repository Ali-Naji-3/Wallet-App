
import mysql from 'mysql2/promise';

async function checkCount() {
    try {
        const host = process.env.MYSQL_HOST || 'localhost';
        const port = Number(process.env.MYSQL_PORT || 3306);
        const user = process.env.MYSQL_USER || 'root';
        const password = process.env.MYSQL_PASSWORD || '';
        const database = process.env.MYSQL_DB || 'fxwallet'; // maybe 'wallet_db'?

        console.log(`Connecting to ${database} as ${user}...`);
        const pool = mysql.createPool({ host, port, user, password, database });

        const [rows] = await pool.query('SELECT COUNT(*) as count FROM transactions');
        console.log('Transaction Count:', rows[0].count);

        const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
        console.log('User Count:', users[0].count);

        await pool.end();
    } catch (err) {
        console.error(err);
    }
}

checkCount();
