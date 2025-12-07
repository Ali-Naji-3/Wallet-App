#!/usr/bin/env node
/**
 * Script to unsuspend admin account
 * Usage: node scripts/unsuspend-admin.js [email]
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function unsuspendAdmin(email = 'admin@admin.com') {
  try {
    const pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DB || 'fxwallet',
    });

    // Find admin user
    const [users] = await pool.query(
      'SELECT id, email, is_active, suspension_reason, role FROM users WHERE email = ? OR (role = ? AND email LIKE ?) LIMIT 5',
      [email, 'admin', '%admin%']
    );

    if (users.length === 0) {
      console.log(`❌ No user found with email: ${email}`);
      await pool.end();
      return;
    }

    console.log('Found users:');
    users.forEach(u => {
      console.log(`  ID: ${u.id}, Email: ${u.email}, Role: ${u.role}, Active: ${u.is_active}, Reason: ${u.suspension_reason || 'None'}`);
    });

    // Unsuspend admin account(s)
    const adminUser = users.find(u => u.email === email) || users.find(u => u.role === 'admin');
    
    if (adminUser) {
      // Check if suspension_reason column exists
      let updateQuery = 'UPDATE users SET is_active = 1';
      try {
        const [cols] = await pool.query('SHOW COLUMNS FROM users LIKE "suspension_reason"');
        if (cols.length > 0) {
          updateQuery += ', suspension_reason = NULL';
        }
      } catch (e) {
        // Column doesn't exist, continue
      }
      updateQuery += ' WHERE id = ?';
      
      await pool.query(updateQuery, [adminUser.id]);
      
      // Verify update
      const [updated] = await pool.query(
        'SELECT id, email, is_active, suspension_reason FROM users WHERE id = ?',
        [adminUser.id]
      );
      
      console.log(`\n✅ Admin account (ID: ${adminUser.id}, Email: ${adminUser.email}) has been UNSUSPENDED!`);
      console.log(`   Status: ${updated[0].is_active ? 'ACTIVE' : 'INACTIVE'}`);
      console.log(`   Suspension Reason: ${updated[0].suspension_reason || 'None'}`);
      console.log('\n🎉 You can now login with admin credentials.');
    } else {
      console.log(`\n⚠️  No admin account found with email: ${email}`);
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Get email from command line argument or use default
const email = process.argv[2] || 'admin@admin.com';
unsuspendAdmin(email);

