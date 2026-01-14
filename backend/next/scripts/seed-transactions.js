
import mysql from 'mysql2/promise';

async function seedTransactions() {
    try {
        const host = process.env.MYSQL_HOST || 'localhost';
        const port = Number(process.env.MYSQL_PORT || 3306);
        const user = process.env.MYSQL_USER || 'root';
        const password = process.env.MYSQL_PASSWORD || '';
        const database = process.env.MYSQL_DB || 'fxwallet';

        console.log('Connecting to database...');
        const pool = mysql.createPool({
            host, port, user, password, database,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        });

        // 1. Get Users
        const [users] = await pool.query('SELECT id, email FROM users');
        if (users.length === 0) {
            // Fallback or exit
            console.log('Error: No users found. Inserting generic user first? No, exiting.');
            process.exit(1);
        }
        console.log(`Found ${users.length} users. Generating restricted transactions...`);

        const types = ['transfer', 'exchange'];
        const currencies = ['USD', 'EUR', 'GBP'];

        const values = [];
        const placeholders = [];

        for (let i = 0; i < 50; i++) {
            const type = types[Math.floor(Math.random() * types.length)];

            const sender = users[Math.floor(Math.random() * users.length)];
            // Dummy wallet IDs
            const sourceWalletId = Math.floor(Math.random() * 1000);
            const targetWalletId = Math.floor(Math.random() * 1000);

            const amount = (Math.random() * 1000 + 10).toFixed(2);
            const sourceCurrency = currencies[Math.floor(Math.random() * currencies.length)];
            let targetCurrency = sourceCurrency;

            let fxRate = '1.0000';
            let targetAmount = amount;

            if (type === 'exchange') {
                targetCurrency = currencies.filter(c => c !== sourceCurrency)[0] || 'EUR';
                fxRate = (Math.random() * (1.5 - 0.5) + 0.5).toFixed(4);
                targetAmount = (amount * fxRate).toFixed(2);
            }

            const fee = (amount * 0.01).toFixed(2);

            // Random date in last 30 days
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 30));
            const dateStr = date.toISOString().slice(0, 19).replace('T', ' ');

            // Fields: user_id, type, source_wallet_id, target_wallet_id, source_currency, target_currency, source_amount, target_amount, fx_rate, fee_amount, note, created_at
            placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            values.push(
                sender.id,
                type,
                sourceWalletId,
                targetWalletId,
                sourceCurrency,
                targetCurrency,
                amount,
                targetAmount,
                fxRate,
                fee,
                `Auto-generated ${type}`,
                dateStr
            );
        }

        const sql = `
        INSERT INTO transactions 
        (user_id, type, source_wallet_id, target_wallet_id, source_currency, target_currency, source_amount, target_amount, fx_rate, fee_amount, note, created_at)
        VALUES ${placeholders.join(', ')}
    `;

        await pool.query(sql, values);

        console.log('✅ Successfully inserted 50 mock transactions.');
        await pool.end();

    } catch (err) {
        console.error('Error seeding:', err);
        process.exit(1);
    }
}

seedTransactions();
