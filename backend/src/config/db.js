import mysql from 'mysql2/promise';

let pool;

// Function to connect to MySQL
export const connectDB = async () => {
  try {
    const {
      MYSQL_HOST,
      MYSQL_PORT,
      MYSQL_USER,
      MYSQL_PASSWORD,
      MYSQL_DB
    } = process.env;

    if (!MYSQL_HOST || !MYSQL_USER || !MYSQL_DB) {
      throw new Error(
        "MySQL env vars missing. Set MYSQL_HOST, MYSQL_USER, MYSQL_DB, and optionally MYSQL_PASSWORD, MYSQL_PORT in backend/.env"
      );
    }

    pool = mysql.createPool({
      host: MYSQL_HOST,
      port: Number(MYSQL_PORT || 3306),
      user: MYSQL_USER,
      password: MYSQL_PASSWORD || '',
      database: MYSQL_DB,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Test a simple connection
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();

    console.log('✅ MySQL connected successfully');
  } catch (error) {
    console.error('❌ Error connecting to MySQL:', error);
    process.exit(1); // Exit the process with failure
  }
};

export const getPool = () => {
  if (!pool) {
    throw new Error('MySQL pool is not initialized. Call connectDB() first.');
  }
  return pool;
};
