-- Migration: Create tables for Tontine API
-- Run this script to initialize the database
-- Note: PRAGMA foreign_keys = ON is set in db.js

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
  min_members INTEGER NOT NULL CHECK(min_members >= 2),
  frequency VARCHAR(50) NOT NULL CHECK(frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  pickup_policy VARCHAR(30) DEFAULT 'arrival' CHECK(pickup_policy IN ('arrival', 'random', 'custom')),
  owner_id INTEGER NOT NULL,
  status VARCHAR(30) DEFAULT 'open' CHECK(status IN ('open', 'closed')),
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

-- Table: tontine_cycles
CREATE TABLE IF NOT EXISTS tontine_cycles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tontine_id INTEGER NOT NULL,
  start_date DATE,
  end_date DATE,
  total_rounds INTEGER NOT NULL,
  current_round INTEGER DEFAULT 0,
  status VARCHAR(30) DEFAULT 'pending' CHECK(status IN ('pending', 'active', 'completed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tontine_id) REFERENCES tontines(id)
);

-- Table: tontine_payout_order
CREATE TABLE IF NOT EXISTS tontine_payout_order (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cycle_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  position INTEGER NOT NULL,
  has_collected BOOLEAN DEFAULT 0,
  collected_at TIMESTAMP,
  FOREIGN KEY (cycle_id) REFERENCES tontine_cycles(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(cycle_id, user_id),
  UNIQUE(cycle_id, position)
);

-- Table: tontine_rounds
CREATE TABLE IF NOT EXISTS tontine_rounds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cycle_id INTEGER NOT NULL,
  round_number INTEGER NOT NULL,
  collector_user_id INTEGER NOT NULL,
  status VARCHAR(30) DEFAULT 'pending' CHECK(status IN ('pending', 'open', 'closed')),
  started_at TIMESTAMP,
  closed_at TIMESTAMP,
  FOREIGN KEY (cycle_id) REFERENCES tontine_cycles(id),
  FOREIGN KEY (collector_user_id) REFERENCES users(id)
);

-- Table: payments
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  round_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(30) DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'failed')),
  paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (round_id) REFERENCES tontine_rounds(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(round_id, user_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_tontines_owner ON tontines(owner_id);
CREATE INDEX IF NOT EXISTS idx_tontine_members_tontine ON tontine_members(tontine_id);
CREATE INDEX IF NOT EXISTS idx_tontine_members_user ON tontine_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tontine_cycles_tontine ON tontine_cycles(tontine_id);
CREATE INDEX IF NOT EXISTS idx_tontine_payout_order_cycle ON tontine_payout_order(cycle_id);
CREATE INDEX IF NOT EXISTS idx_tontine_payout_order_user ON tontine_payout_order(user_id);
CREATE INDEX IF NOT EXISTS idx_tontine_rounds_cycle ON tontine_rounds(cycle_id);
CREATE INDEX IF NOT EXISTS idx_tontine_rounds_collector ON tontine_rounds(collector_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_round ON payments(round_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
