// This file's only job: create ONE reusable connection pool to MySQL
// and export it, so every route file can just require() it.
require('dotenv').config();
const mysql = require('mysql2/promise'); // 'promise' version lets us use async/await

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10, // max simultaneous DB connections
});

module.exports = pool;
