import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

/**
 * Script to remove foreign key constraints for better performance
 * Keeps only notifications table with REFERENCES
 */
async function removeForeignKeys() {
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

    // Get all foreign keys
    const [foreignKeys] = await pool.query(`
      SELECT 
        TABLE_NAME,
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ?
        AND REFERENCED_TABLE_NAME IS NOT NULL
        AND TABLE_NAME != 'notifications'
      ORDER BY TABLE_NAME, CONSTRAINT_NAME
    `, [database]);

    if (foreignKeys.length === 0) {
      console.log('✅ No foreign keys found (except notifications)');
      await pool.end();
      return;
    }

    console.log(`📋 Found ${foreignKeys.length} foreign key(s) to remove:\n`);

    let removed = 0;
    let skipped = 0;

    for (const fk of foreignKeys) {
      try {
        // MySQL doesn't support IF EXISTS, so we check first
        const [check] = await pool.query(`
          SELECT COUNT(*) as count
          FROM information_schema.KEY_COLUMN_USAGE
          WHERE TABLE_SCHEMA = ?
            AND TABLE_NAME = ?
            AND CONSTRAINT_NAME = ?
        `, [database, fk.TABLE_NAME, fk.CONSTRAINT_NAME]);

        if (check[0].count === 0) {
          console.log(`⏭️  ${fk.TABLE_NAME}.${fk.CONSTRAINT_NAME} - already removed`);
          skipped++;
          continue;
        }

        await pool.query(`
          ALTER TABLE \`${fk.TABLE_NAME}\` 
          DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\`
        `);

        console.log(`✅ Removed: ${fk.TABLE_NAME}.${fk.CONSTRAINT_NAME} → ${fk.REFERENCED_TABLE_NAME}`);
        removed++;
      } catch (err) {
        if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
          console.log(`⏭️  ${fk.TABLE_NAME}.${fk.CONSTRAINT_NAME} - doesn't exist`);
          skipped++;
        } else {
          console.error(`❌ Error removing ${fk.TABLE_NAME}.${fk.CONSTRAINT_NAME}:`, err.message);
        }
      }
    }

    // Verify notifications still has its foreign key
    const [notifFK] = await pool.query(`
      SELECT CONSTRAINT_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'notifications'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [database]);

    console.log('\n📈 Summary:');
    console.log(`   ✅ Removed: ${removed} foreign key(s)`);
    console.log(`   ⏭️  Skipped: ${skipped} foreign key(s)`);
    console.log(`   🔒 Notifications: ${notifFK.length > 0 ? 'Kept with REFERENCES' : '⚠️  No foreign key found'}`);
    console.log('\n🎉 Performance optimization complete!');
    console.log('   Database operations should now be faster! 🚀\n');
    
    await pool.end();
    
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
}

removeForeignKeys();




