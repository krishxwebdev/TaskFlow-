// This runs once when the server starts.
// It creates the database tables if they don't exist yet —
// so you never need to manually run schema.sql on the cloud.
const pool = require('./db');

async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        employee_id VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(255),
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Keep existing installations forward-compatible without deleting data.
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255)`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user'`);
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'));
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
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

    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (LOWER(email)) WHERE email IS NOT NULL`);
    await pool.query(`CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks (user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks (status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON tasks (due_date)`);

    console.log('✅ Database tables ready');
  } catch (err) {
    console.error('❌ Database init failed:', err.message);
    process.exit(1); // Stop the server if DB can't be reached
  }
}

module.exports = initDb;
