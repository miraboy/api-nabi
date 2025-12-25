const db = require("../utils/db");

class Payment {
  /**
   * Create a new payment
   * @param {number} roundId - ID of the round (cycle's turn)
   * @param {number} userId - ID of the user making payment
   * @param {number} amount - Payment amount
   * @param {string} status - Payment status (pending, completed, failed)
   */
  static create(roundId, userId, amount, status = "pending") {
    return new Promise((resolve, reject) => {
      const sql =
        "INSERT INTO payments (round_id, user_id, amount, status) VALUES (?, ?, ?, ?)";
      db.run(sql, [roundId, userId, amount, status], function (err) {
        if (err) return reject(err);
        resolve({
          id: this.lastID,
          round_id: roundId,
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
   * Get all payments for a tontine (through rounds and cycles)
   * @param {number} tontineId - ID of the tontine
   */
  static findByTontine(tontineId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT p.*, u.name as user_name, u.email as user_email,
               r.round_number, c.id as cycle_id
        FROM payments p
        JOIN users u ON p.user_id = u.id
        JOIN tontine_rounds r ON p.round_id = r.id
        JOIN tontine_cycles c ON r.cycle_id = c.id
        WHERE c.tontine_id = ?
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
        SELECT p.*, t.name as tontine_name, r.round_number
        FROM payments p
        JOIN tontine_rounds r ON p.round_id = r.id
        JOIN tontine_cycles c ON r.cycle_id = c.id
        JOIN tontines t ON c.tontine_id = t.id
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
   * Get total amount paid by user in tontine (across all cycles and rounds)
   */
  static getTotalByUserInTontine(tontineId, userId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT SUM(p.amount) as total 
        FROM payments p
        JOIN tontine_rounds r ON p.round_id = r.id
        JOIN tontine_cycles c ON r.cycle_id = c.id
        WHERE c.tontine_id = ? AND p.user_id = ?
      `;
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

  /**
   * Find all payments for a round
   */
  static findByRound(roundId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT p.*, u.name as user_name
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE p.round_id = ?
      `;
      db.all(sql, [roundId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  }

  /**
   * Find payment by user and round
   */
  static findByUserAndRound(userId, roundId) {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM payments WHERE user_id = ? AND round_id = ?";
      db.get(sql, [userId, roundId], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  /**
   * Count payments for a round
   */
  static countByRound(roundId) {
    return new Promise((resolve, reject) => {
      const sql = "SELECT COUNT(*) as count FROM payments WHERE round_id = ?";
      db.get(sql, [roundId], (err, row) => {
        if (err) return reject(err);
        resolve(row.count || 0);
      });
    });
  }
}

module.exports = Payment;
