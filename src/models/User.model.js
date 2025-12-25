const db = require('../utils/db');

class User {
  /**
   * Create a new user
   */
  static create(name, email, passwordHash) {
    return new Promise((resolve, reject) => {
      const sql = 'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)';
      db.run(sql, [name, email, passwordHash], function(err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, name, email });
      });
    });
  }

  /**
   * Find user by ID
   */
  static findById(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id, name, email, created_at FROM users WHERE id = ?';
      db.get(sql, [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  /**
   * Find user by email
   */
  static findByEmail(email) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE email = ?';
      db.get(sql, [email], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  /**
   * Get all users
   */
  static findAll() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id, name, email, created_at FROM users';
      db.all(sql, [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  /**
   * Update user
   */
  static update(id, data) {
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE users SET name = ?, email = ? WHERE id = ?';
      db.run(sql, [data.name, data.email, id], function(err) {
        if (err) return reject(err);
        resolve({ changes: this.changes });
      });
    });
  }

  /**
   * Delete user
   */
  static delete(id) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM users WHERE id = ?';
      db.run(sql, [id], function(err) {
        if (err) return reject(err);
        resolve({ changes: this.changes });
      });
    });
  }
}

module.exports = User;
