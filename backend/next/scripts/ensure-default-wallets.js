
import mysql from 'mysql2/promise';

const REQUIRED_CURRENCIES = ['USD', 'EUR', 'LBP'];

async function ensureWallets() {
    try {
        const host = process.env.MYSQL_HOST || 'localhost';
        const port = Number(process.env.MYSQL_PORT || 3306);
        const user = process.env.MYSQL_USER || 'root';
        const password = process.env.MYSQL_PASSWORD || '';
        const database = process.env.MYSQL_DB || 'fxwallet';

        const pool = mysql.createPool({ host, port, user, password, database });

        console.log(`Connecting to ${database}...`);

        // 1. Get all users
        const [users] = await pool.query('SELECT id, email FROM users');
        console.log(`Found ${users.length} users.`);

        for (const u of users) {
            // 2. Get existing wallets
            const [wallets] = await pool.query('SELECT currency_code FROM wallets WHERE user_id = ?', [u.id]);
            const existingCurrencies = new Set(wallets.map(w => w.currency_code));

            let createdCount = 0;

            for (const code of REQUIRED_CURRENCIES) {
                if (!existingCurrencies.has(code)) {
                    // Create wallet
                    const address = `FXW-${code}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
                    await pool.query(
                        `INSERT INTO wallets (user_id, currency_code, balance, status, address, created_at)
                     VALUES (?, ?, 0.00, 'active', ?, NOW())`,
                        [u.id, code, address]
                    );
                    createdCount++;
                }
            }

            if (createdCount > 0) {
                console.log(`User ${u.email} (ID ${u.id}): Created ${createdCount} missing wallets.`);
            }
        }

        console.log('Done ensuring wallets.');
        await pool.end();

    } catch (err) {
        console.error(err);
    }
}

ensureWallets();
