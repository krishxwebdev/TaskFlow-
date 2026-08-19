-- TaskFlow Database Schema
-- Run this once in MySQL to set up the database:  mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS taskflow;
USE taskflow;

-- Stores each user. A user registers with username + employee_id + password,
-- and logs in with employee_id + password. password_hash NEVER stores the
-- real password - only a one-way hash of it (see auth.js).
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_employee (employee_id)
);

-- Stores every task. Each task belongs to exactly one user (user_id),
-- which is how we make sure a user only ever sees their own tasks.
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    priority ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Medium',
    due_date DATE,
    status ENUM('Pending', 'In Progress', 'Completed') NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
