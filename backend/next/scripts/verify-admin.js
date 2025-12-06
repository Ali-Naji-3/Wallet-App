import mysql from 'mysql2/promise';

/**
 * Script to verify admin user exists and check password hash
 */
async function verifyAdmin() {
  try {
    const host = process.env.MYSQL_HOST || 'localhost';
    const port = Number(process.env.MYSQL_PORT || 3306);
    const user = process.env.MYSQL_USER || 'root';
    const password = process.env.MYSQL_PASSWORD || '';
    const database = process.env.MYSQL_DB || 'fxwallet';

    console.log('Connecting to database...');
    const pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
    });

    const [rows] = await pool.query(
      `SELECT id, email, password_hash, role, is_active, is_verified 
       FROM users WHERE email = ? LIMIT 1`,
      ['admin@admin.com']
    );

    if (rows.length === 0) {
      console.log('\n❌ Admin user NOT FOUND in database!');
      console.log('\n💡 Run the SQL script to create the admin user:');
      console.log('   See: CREATE_ADMIN_SQL.sql or QUICK_ADMIN_SETUP.sql');
    } else {
      const admin = rows[0];
      console.log('\n✅ Admin user found:');
      console.log(`   ID: ${admin.id}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Role: ${admin.role || 'user'}`);
      console.log(`   Is Active: ${admin.is_active ? 'Yes' : 'No'}`);
      console.log(`   Is Verified: ${admin.is_verified ? 'Yes' : 'No'}`);
      console.log(`   Password Hash: ${admin.password_hash ? 'Set' : 'NOT SET'}`);
      console.log(`   Hash Length: ${admin.password_hash?.length || 0}`);
      
      if (admin.role !== 'admin') {
        console.log('\n⚠️  User exists but role is not "admin"');
        console.log('   Run: UPDATE users SET role = "admin" WHERE email = "admin@admin.com";');
      }
      
      if (!admin.is_active) {
        console.log('\n⚠️  User exists but account is not active');
        console.log('   Run: UPDATE users SET is_active = 1 WHERE email = "admin@admin.com";');
      }
      
      if (!admin.password_hash) {
        console.log('\n⚠️  User exists but password hash is not set');
        console.log('   You need to set the password hash');
      }
    }

    await pool.end();
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error('\n💡 Make sure:');
    console.error('   1. MySQL is running');
    console.error('   2. Environment variables are set');
    console.error('   3. Database exists');
  }
}

verifyAdmin();


