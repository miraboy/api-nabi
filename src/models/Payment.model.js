const db = require("../utils/db");

class Payment {
  /**
   * Create a new payment
   */
  static create(tontineId, userId, amount, status = "completed") {
    return new Promise((resolve, reject) => {
      const sql =
        "INSERT INTO payments (tontine_id, user_id, amount, status) VALUES (?, ?, ?, ?)";
      db.run(sql, [tontineId, userId, amount, status], function (err) {
        if (err) return reject(err);
        resolve({
          id: this.lastID,
          tontine_id: tontineId,
          user_id: userId,
          amount,
          status,
        });
      });
    });
  }

  /**
   * Find payment by ID
   */
  static findById(id) {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM payments WHERE id = ?";
      db.get(sql, [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  /**
   * Get all payments for a tontine
   */
  static findByTontine(tontineId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT p.*, u.name as user_name, u.email as user_email
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE p.tontine_id = ?
        ORDER BY p.paid_at DESC
      `;
      db.all(sql, [tontineId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  /**
   * Get all payments by a user
   */
  static findByUser(userId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT p.*, t.name as tontine_name
        FROM payments p
        JOIN tontines t ON p.tontine_id = t.id
        WHERE p.user_id = ?
        ORDER BY p.paid_at DESC
      `;
      db.all(sql, [userId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  /**
   * Get total amount paid by user in tontine
   */
  static getTotalByUserInTontine(tontineId, userId) {
    return new Promise((resolve, reject) => {
      const sql =
        "SELECT SUM(amount) as total FROM payments WHERE tontine_id = ? AND user_id = ?";
      db.get(sql, [tontineId, userId], (err, row) => {
        if (err) return reject(err);
        resolve(row.total || 0);
      });
    });
  }

  /**
   * Update payment status
   */
  static updateStatus(id, status) {
    return new Promise((resolve, reject) => {
      const sql = "UPDATE payments SET status = ? WHERE id = ?";
      db.run(sql, [status, id], function (err) {
        if (err) return reject(err);
        resolve({ changes: this.changes });
      });
    });
  }

  /**
   * Delete payment
   */
  static delete(id) {
    return new Promise((resolve, reject) => {
      const sql = "DELETE FROM payments WHERE id = ?";
      db.run(sql, [id], function (err) {
        if (err) return reject(err);
        resolve({ changes: this.changes });
      });
    });
  }
}

module.exports = Payment;
