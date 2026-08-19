-- Run this if you ALREADY created the database before (with mysql -u root -p < schema.sql).
-- It adds the new password_hash column and clears out old test users
-- (since they were created without passwords and can't log in anymore).
-- Usage: mysql -u root -p < migrate_add_password.sql

USE taskflow;

-- If you have real task data tied to old users you want to keep, skip the
-- DELETE line below and instead ask me how to set a default password for
-- existing users. For a fresh student project, it's usually fine to just reset.
DELETE FROM users;

ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT '' AFTER employee_id;
