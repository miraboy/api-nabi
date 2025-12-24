const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");
const dbConfig = require("../config/database");
const logger = require("./logger");

const env = process.env.NODE_ENV || "development";
const config = dbConfig[env];

// Create database connection
const db = new sqlite3.Database(config.filename, (err) => {
  if (err) {
    logger.error("Error connecting to database:", err);
    throw err;
  }
  logger.info(`Connected to SQLite database: ${config.filename}`);
});

// Enable foreign keys
db.run("PRAGMA foreign_keys = ON");

/**
 * Run migrations
 */
const runMigrations = () => {
  return new Promise((resolve, reject) => {
    const migrationPath = path.join(__dirname, "../config/migrations.sql");
    const sql = fs.readFileSync(migrationPath, "utf8");

    db.exec(sql, (err) => {
      if (err) {
        logger.error("Migration error:", err);
        return reject(err);
      }
      logger.info("Migrations executed successfully");
      resolve();
    });
  });
};

// Run migrations on startup
runMigrations().catch((err) => {
  logger.error("Failed to run migrations:", err);
});

module.exports = db;
