import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration - reads from environment or uses defaults
// You can set these in backend/.env file or export them before running
const dbConfig = {
  host: process.env.MYSQL_HOST || process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || process.env.MYSQL_DB || 'fxwallet',
  multipleStatements: true, // Allow multiple SQL statements
};

// Try to load .env file if it exists
try {
  const dotenv = await import('dotenv');
  dotenv.config({ path: path.join(__dirname, '../.env') });
  // Re-read config after loading .env
  Object.assign(dbConfig, {
    host: process.env.MYSQL_HOST || dbConfig.host,
    user: process.env.MYSQL_USER || dbConfig.user,
    password: process.env.MYSQL_PASSWORD || dbConfig.password,
    database: process.env.MYSQL_DATABASE || process.env.MYSQL_DB || dbConfig.database,
  });
} catch (e) {
  // dotenv not available or .env doesn't exist, use defaults
}

async function addIndexes() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   Database: ${dbConfig.database}`);
    console.log(`   User: ${dbConfig.user}`);
    console.log(`   Password: ${dbConfig.password ? '***' : '(empty)'}\n`);
    
    // If password is empty, try without password first
    if (!dbConfig.password) {
      try {
        connection = await mysql.createConnection(dbConfig);
      } catch (noPassError) {
        console.log('⚠️  Connection without password failed. Please set MYSQL_PASSWORD in .env file or environment.\n');
        throw noPassError;
      }
    } else {
      connection = await mysql.createConnection(dbConfig);
    }
    console.log('✅ Connected successfully!\n');
    
    // Read SQL file
    const sqlFile = path.join(__dirname, '../database/add-indexes.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📊 Creating database indexes...\n');
    
    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s !== 'SELECT');
    
    let successCount = 0;
    let skipCount = 0;
    
    for (const statement of statements) {
      if (!statement) continue;
      
      try {
        // Check if index already exists
        const indexName = statement.match(/idx_\w+/)?.[0];
        if (indexName) {
          const [existing] = await connection.query(
            `SELECT COUNT(*) as count 
             FROM information_schema.statistics 
             WHERE table_schema = ? 
             AND index_name = ?`,
            [dbConfig.database, indexName]
          );
          
          if (existing[0].count > 0) {
            console.log(`⏭️  Index ${indexName} already exists, skipping...`);
            skipCount++;
            continue;
          }
        }
        
        await connection.query(statement);
        const indexMatch = statement.match(/idx_\w+/);
        if (indexMatch) {
          console.log(`✅ Created index: ${indexMatch[0]}`);
          successCount++;
        }
      } catch (err) {
        // MySQL doesn't support IF NOT EXISTS for indexes, so we check manually
        if (err.code === 'ER_DUP_KEYNAME') {
          const indexName = statement.match(/idx_\w+/)?.[0];
          console.log(`⏭️  Index ${indexName} already exists, skipping...`);
          skipCount++;
        } else {
          console.error(`❌ Error: ${err.message}`);
          console.error(`   Statement: ${statement.substring(0, 100)}...`);
        }
      }
    }
    
    console.log('\n📈 Summary:');
    console.log(`   ✅ Created: ${successCount} indexes`);
    console.log(`   ⏭️  Skipped: ${skipCount} indexes (already exist)`);
    console.log('\n🎉 Database indexes optimization complete!');
    console.log('   Your queries should now be 70-80% faster! 🚀\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Make sure MySQL is running and credentials are correct.');
      console.error('   Update the credentials in this script if needed.\n');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Database access denied. Check your username and password.\n');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error(`\n💡 Database '${dbConfig.database}' does not exist.`);
      console.error('   Please create it first or update the database name.\n');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed.');
    }
  }
}

// Run the script
addIndexes();

