// PostgreSQL connection pool using the 'pg' library.
// Render provides a DATABASE_URL environment variable automatically
// when you attach a PostgreSQL database to your service.
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }  // Required for Render's hosted PostgreSQL
    : false,
});

module.exports = pool;
