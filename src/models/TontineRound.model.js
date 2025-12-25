const db = require("../utils/db");

class TontineRound {
  /**
   * Create a new round
   */
  static create(cycleId, roundNumber, collectorUserId) {
    return new Promise((resolve, reject) => {
      const sql =
        "INSERT INTO tontine_rounds (cycle_id, round_number, collector_user_id) VALUES (?, ?, ?)";
      db.run(sql, [cycleId, roundNumber, collectorUserId], function (err) {
        if (err) return reject(err);
        resolve({
          id: this.lastID,
          cycle_id: cycleId,
          round_number: roundNumber,
          collector_user_id: collectorUserId,
          status: "pending",
        });
      });
    });
  }

  /**
   * Find round by ID
   */
  static findById(id) {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM tontine_rounds WHERE id = ?";
      db.get(sql, [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  /**
   * Find all rounds for a cycle
   */
  static findByCycle(cycleId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT r.*, u.name as collector_name
        FROM tontine_rounds r
        JOIN users u ON r.collector_user_id = u.id
        WHERE r.cycle_id = ?
        ORDER BY r.round_number ASC
      `;
      db.all(sql, [cycleId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  /**
   * Update round status
   */
  static updateStatus(id, status) {
    return new Promise((resolve, reject) => {
      const sql = "UPDATE tontine_rounds SET status = ? WHERE id = ?";
      db.run(sql, [status, id], function (err) {
        if (err) return reject(err);
        resolve({ changes: this.changes });
      });
    });
  }

  /**
   * Start round
   */
  static start(id) {
    return new Promise((resolve, reject) => {
      const sql =
        "UPDATE tontine_rounds SET status = 'open', started_at = CURRENT_TIMESTAMP WHERE id = ?";
      db.run(sql, [id], function (err) {
        if (err) return reject(err);
        resolve({ changes: this.changes });
      });
    });
  }

  /**
   * Close round
   */
  static close(id) {
    return new Promise((resolve, reject) => {
      const sql =
        "UPDATE tontine_rounds SET status = 'closed', closed_at = CURRENT_TIMESTAMP WHERE id = ?";
      db.run(sql, [id], function (err) {
        if (err) return reject(err);
        resolve({ changes: this.changes });
      });
    });
  }
}

module.exports = TontineRound;
