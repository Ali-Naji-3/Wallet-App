
import mysql from 'mysql2/promise';

const TARGET_EMAIL = process.argv[2] || 'admin@admin.com';

async function promoteUser() {
    try {
        const host = process.env.MYSQL_HOST || 'localhost';
        const port = Number(process.env.MYSQL_PORT || 3306);
        const user = process.env.MYSQL_USER || 'root';
        const password = process.env.MYSQL_PASSWORD || '';
        const database = process.env.MYSQL_DB || 'fxwallet';

        const pool = mysql.createPool({ host, port, user, password, database });

        console.log(`Promoting user ${TARGET_EMAIL} to admin...`);

        const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [TARGET_EMAIL]);

        if (rows.length === 0) {
            console.error(`User ${TARGET_EMAIL} NOT FOUND.`);
            console.log('Available users:');
            const [users] = await pool.query('SELECT email, role FROM users LIMIT 10');
            console.table(users);
            process.exit(1);
        }

        const userId = rows[0].id;
        await pool.query("UPDATE users SET role = 'admin' WHERE id = ?", [userId]);
        console.log(`✅ User ${TARGET_EMAIL} (ID: ${userId}) promoted to ADMIN.`);

        await pool.end();

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

promoteUser();
