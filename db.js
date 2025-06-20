const mysql = require('mysql2');
require('dotenv').config();

// Create connection options
let connectionConfig;

// First try to use the MySQL URL if available (Railway provides this)
if (process.env.MYSQL_URL || process.env.DATABASE_URL) {
  const connectionString = process.env.MYSQL_URL || process.env.DATABASE_URL;
  console.log('Using connection string for database');
  connectionConfig = connectionString;
} else {
  // Fall back to individual parameters
  connectionConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    // Connection pool settings
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
  console.log(`Connecting to database at ${connectionConfig.host}:${connectionConfig.port}`);
}

// Create connection pool instead of a single connection
const pool = mysql.createPool(connectionConfig);

// Get a promise-based interface for the pool
const db = pool.promise();

// Test the pool connection to ensure it's working
pool.getConnection((err, connection) => {
  if (err) {
    console.error('DB connection pool error:', err.message);
    console.error('DB connection details:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      // Don't log the password
      hasPassword: process.env.DB_PASSWORD ? 'Yes' : 'No',
      urlProvided: Boolean(process.env.MYSQL_URL || process.env.DATABASE_URL)
    });
    console.log('Running in limited functionality mode without database connection');
  } else {
    console.log('✅ MySQL connection pool established successfully');
    connection.release(); // Release the connection back to the pool
  }
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection was closed. Attempting to reconnect...');
    // The pool will automatically try to reconnect
  } else if (err.code === 'ER_CON_COUNT_ERROR') {
    console.error('Database has too many connections.');
  } else if (err.code === 'ECONNREFUSED') {
    console.error('Database connection was refused.');
  }
});

module.exports = db;
