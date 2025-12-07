import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

/**
 * Script to create test users for login testing
 */
async function createTestUsers() {
  try {
    const host = process.env.MYSQL_HOST || 'localhost';
    const port = Number(process.env.MYSQL_PORT || 3306);
    const user = process.env.MYSQL_USER || 'root';
    const password = process.env.MYSQL_PASSWORD || '';
    const database = process.env.MYSQL_DB || 'fxwallet';

    console.log('🔌 Connecting to database...');
    console.log(`   Host: ${host}:${port}`);
    console.log(`   Database: ${database}\n`);

    const pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
    });

    const testUsers = [
      {
        email: 'admin@admin.com',
        password: 'admin123',
        fullName: 'Admin User',
        role: 'admin',
      },
      {
        email: 'user@test.com',
        password: 'user123',
        fullName: 'Test User',
        role: 'user',
      },
    ];

    for (const testUser of testUsers) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(testUser.password, salt);
      
      // Check if user exists
      const [existing] = await pool.query(
        `SELECT id, email, role FROM users WHERE email = ?`,
        [testUser.email]
      );

      if (existing.length > 0) {
        // Update existing user
        await pool.query(
          `UPDATE users SET password_hash = ?, role = ?, is_active = 1, is_verified = 1 WHERE id = ?`,
          [passwordHash, testUser.role, existing[0].id]
        );
        console.log(`✅ Updated: ${testUser.email} (${testUser.role})`);
      } else {
        // Create new user
        const [result] = await pool.query(
          `INSERT INTO users (email, password_hash, full_name, base_currency, timezone, role, is_active, is_verified)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [testUser.email, passwordHash, testUser.fullName, 'USD', 'UTC', testUser.role, 1, 1]
        );
        console.log(`✅ Created: ${testUser.email} (${testUser.role}) - ID: ${result.insertId}`);
      }
    }
    
    console.log('\n🎉 Test users ready!');
    console.log('\n📝 Login Credentials:');
    console.log('   Admin:');
    console.log('     Email: admin@admin.com');
    console.log('     Password: admin123');
    console.log('   User:');
    console.log('     Email: user@test.com');
    console.log('     Password: user123');
    
    await pool.end();
    
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
}

createTestUsers();

