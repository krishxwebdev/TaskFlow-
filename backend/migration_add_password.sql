-- Run this ONLY if you already created the database before (from the old schema.sql).
-- It adds the new password_hash column without deleting your existing data.
-- Usage:  mysql -u root -p taskflow < migration_add_password.sql

USE taskflow;

ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT '' AFTER employee_id;
