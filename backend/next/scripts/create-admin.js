import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

/**
 * Script to create admin user
 * 
 * Usage:
 *   MYSQL_HOST=localhost MYSQL_USER=root MYSQL_PASSWORD=yourpass MYSQL_DB=fxwallet node scripts/create-admin.js
 * 
 * Or set these in your .env.local file in backend/next/
 */
async function createAdminUser() {
  try {
    // Get database connection from environment variables
    const host = process.env.MYSQL_HOST || 'localhost';
    const port = Number(process.env.MYSQL_PORT || 3306);
    const user = process.env.MYSQL_USER || 'root';
    const password = process.env.MYSQL_PASSWORD || '';
    const database = process.env.MYSQL_DB || 'fxwallet';

    console.log('Connecting to database...');
    console.log(`  Host: ${host}`);
    console.log(`  Database: ${database}`);
    console.log(`  User: ${user}`);

    const pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    const email = 'admin@admin.com';
    const plainPassword = 'admin';
    
    // Check if admin user already exists
    const [existing] = await pool.query(
      `SELECT id, email, role FROM users WHERE email = ? LIMIT 1`,
      [email]
    );

    if (existing.length > 0) {
      const userRecord = existing[0];
      console.log('\n✅ Admin user already exists!');
      console.log(`   ID: ${userRecord.id}`);
      console.log(`   Email: ${userRecord.email}`);
      console.log(`   Role: ${userRecord.role || 'user'}`);
      
      // Update to admin role if not already
      if (userRecord.role !== 'admin') {
        await pool.query(
          `UPDATE users SET role = 'admin', is_active = 1 WHERE id = ?`,
          [userRecord.id]
        );
        console.log('✅ Updated user role to admin');
      }
      
      // Update password to ensure it's correct
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(plainPassword, salt);
      await pool.query(
        `UPDATE users SET password_hash = ? WHERE id = ?`,
        [passwordHash, userRecord.id]
      );
      console.log('✅ Updated password to "admin"');
      
      await pool.end();
      return;
    }

    // Create new admin user
    console.log('\nCreating admin user...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(plainPassword, salt);

    const [result] = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, base_currency, timezone, role, is_active, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [email, passwordHash, 'Admin User', 'USD', 'UTC', 'admin', 1, 1]
    );

    console.log('\n✅ Admin user created successfully!');
    console.log(`   ID: ${result.insertId}`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${plainPassword}`);
    console.log(`   Role: admin`);
    console.log('\n📝 You can now login with:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${plainPassword}`);
    
    await pool.end();
    
  } catch (err) {
    console.error('\n❌ Error creating admin user:', err.message);
    console.error('\n💡 Make sure:');
    console.error('   1. MySQL is running');
    console.error('   2. Environment variables are set (MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB)');
    console.error('   3. Database exists');
    console.error('\n   Or use SQL directly (see CREATE_ADMIN_USER.md)');
    process.exit(1);
  }
}

createAdminUser();
