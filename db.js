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
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  };
  console.log(`Connecting to database at ${connectionConfig.host}:${connectionConfig.port}`);
}

// Create the connection
const db = mysql.createConnection(connectionConfig);

// Connect with timeout handled properly
db.connect((err) => {
  if (err) {
    console.error('DB connection error:', err.message);
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
    console.log('✅ MySQL connected successfully');
  }
});

module.exports = db;
