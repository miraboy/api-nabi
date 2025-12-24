-- Migration: Create tables for Tontine API
-- Run this script to initialize the database

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: tontines
CREATE TABLE IF NOT EXISTS tontines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(150) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  max_members INTEGER NOT NULL,
  frequency VARCHAR(50) NOT NULL,
  owner_id INTEGER NOT NULL,
  status VARCHAR(30) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Table: tontine_members
CREATE TABLE IF NOT EXISTS tontine_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tontine_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tontine_id) REFERENCES tontines(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(tontine_id, user_id)
);

-- Table: payments
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tontine_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(30) DEFAULT 'completed',
  paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tontine_id) REFERENCES tontines(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_tontines_owner ON tontines(owner_id);
CREATE INDEX IF NOT EXISTS idx_tontine_members_tontine ON tontine_members(tontine_id);
CREATE INDEX IF NOT EXISTS idx_tontine_members_user ON tontine_members(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_tontine ON payments(tontine_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
