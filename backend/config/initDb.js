// This runs once when the server starts.
// It creates the database tables if they don't exist yet —
// so you never need to manually run schema.sql on the cloud.
const pool = require('./config/db');

async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        employee_id VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT DEFAULT NULL,
        priority VARCHAR(10) NOT NULL DEFAULT 'Medium',
        due_date DATE,
        status VARCHAR(20) NOT NULL DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database tables ready');
  } catch (err) {
    console.error('❌ Database init failed:', err.message);
    process.exit(1); // Stop the server if DB can't be reached
  }
}

module.exports = initDb;
