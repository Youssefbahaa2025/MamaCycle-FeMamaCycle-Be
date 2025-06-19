// This script ensures the environment is loaded correctly before starting the server
require('dotenv').config(); // Load .env file

// Check if required environment variables are set
if (!process.env.JWT_SECRET) {
  console.error('❌ ERROR: JWT_SECRET environment variable is not set');
  console.error('Please make sure your .env file contains JWT_SECRET');
  process.exit(1);
}

// Log environment variables for debugging (without showing sensitive values)
console.log('Environment variables loaded:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set (using development)');
console.log('DB_HOST:', process.env.DB_HOST || 'not set');
console.log('DB_USER:', process.env.DB_USER || 'not set');
console.log('DB_NAME:', process.env.DB_NAME || 'not set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '******** (set)' : 'not set');
console.log('JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN || 'not set (using default: 7d)');

// Start the server by requiring the main file
require('./index.js'); 