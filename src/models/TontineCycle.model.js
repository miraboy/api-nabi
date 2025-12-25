const db = require("../utils/db");

class TontineCycle {
  /**
   * Create a new cycle
   */
  static create(tontineId, startDate, endDate, totalRounds) {
    return new Promise((resolve, reject) => {
      const sql =
        "INSERT INTO tontine_cycles (tontine_id, start_date, end_date, total_rounds, status) VALUES (?, ?, ?, ?, 'active')";
      db.run(sql, [tontineId, startDate, endDate, totalRounds], function (err) {
        if (err) return reject(err);
        resolve({
          id: this.lastID,
          tontine_id: tontineId,
          start_date: startDate,
          end_date: endDate,
          total_rounds: totalRounds,
          current_round: 0,
          status: "active",
        });
      });
    });
  }

  /**
   * Find cycle by ID
   */
  static findById(id) {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM tontine_cycles WHERE id = ?";
      db.get(sql, [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  /**
   * Find all cycles for a tontine
   */
  static findByTontine(tontineId) {
    return new Promise((resolve, reject) => {
      const sql =
        "SELECT * FROM tontine_cycles WHERE tontine_id = ? ORDER BY created_at DESC";
      db.all(sql, [tontineId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  /**
   * Find active or pending cycle for a tontine
   */
  static findActiveCycle(tontineId) {
    return new Promise((resolve, reject) => {
      const sql =
        "SELECT * FROM tontine_cycles WHERE tontine_id = ? AND status IN ('pending', 'active')";
      db.get(sql, [tontineId], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  /**
   * Update cycle status
   */
  static updateStatus(id, status) {
    return new Promise((resolve, reject) => {
      const sql = "UPDATE tontine_cycles SET status = ? WHERE id = ?";
      db.run(sql, [status, id], function (err) {
        if (err) return reject(err);
        resolve({ changes: this.changes });
      });
    });
  }

  /**
   * Update current round
   */
  static updateCurrentRound(id, roundNumber) {
    return new Promise((resolve, reject) => {
      const sql = "UPDATE tontine_cycles SET current_round = ? WHERE id = ?";
      db.run(sql, [roundNumber, id], function (err) {
        if (err) return reject(err);
        resolve({ changes: this.changes });
      });
    });
  }
}

module.exports = TontineCycle;
