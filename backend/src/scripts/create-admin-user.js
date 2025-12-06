import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: join(__dirname, '../.env') });

/**
 * Script to create/update admin user
 * Email: admin@admin.com
 * Password: admin123
 */
async function createAdminUser() {
  try {
    const host = process.env.MYSQL_HOST || 'localhost';
    const port = Number(process.env.MYSQL_PORT || 3306);
    const user = process.env.MYSQL_USER || 'root';
    const password = process.env.MYSQL_PASSWORD || '';
    const database = process.env.MYSQL_DB || 'fxwallet';

    console.log('🔌 Connecting to database...');
    console.log(`   Host: ${host}:${port}`);
    console.log(`   Database: ${database}`);

    const pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
    });

    const email = 'admin@admin.com';
    const plainPassword = 'admin123';
    
    // Check if admin user already exists
    const [existing] = await pool.query(
      `SELECT id, email, role FROM users WHERE email = ?`,
      [email]
    );

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(plainPassword, salt);

    if (existing.length > 0) {
      const userRecord = existing[0];
      console.log('\n✅ Admin user found! Updating...');
      
      // Update user to admin role and correct password
      await pool.query(
        `UPDATE users SET password_hash = ?, role = 'admin', is_active = 1, is_verified = 1 WHERE id = ?`,
        [passwordHash, userRecord.id]
      );
      
      console.log('✅ Admin user updated successfully!');
      console.log(`   ID: ${userRecord.id}`);
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${plainPassword}`);
      console.log(`   Role: admin`);
    } else {
      // Create new admin user
      console.log('\n📝 Creating admin user...');

      const [result] = await pool.query(
        `INSERT INTO users (email, password_hash, full_name, base_currency, timezone, role, is_active, is_verified)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [email, passwordHash, 'Admin User', 'USD', 'UTC', 'admin', 1, 1]
      );

      console.log('✅ Admin user created successfully!');
      console.log(`   ID: ${result.insertId}`);
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${plainPassword}`);
      console.log(`   Role: admin`);
    }
    
    console.log('\n🎉 You can now login with:');
    console.log(`   📧 Email: ${email}`);
    console.log(`   🔑 Password: ${plainPassword}`);
    
    await pool.end();
    
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error('\n💡 Make sure:');
    console.error('   1. MySQL is running');
    console.error('   2. Database "fxwallet" exists');
    console.error('   3. Environment variables are set in backend/.env');
    process.exit(1);
  }
}

createAdminUser();

