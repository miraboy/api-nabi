const db = require("../utils/db");

class TontinePayoutOrder {
  /**
   * Create payout order entry
   */
  static create(cycleId, userId, position) {
    return new Promise((resolve, reject) => {
      const sql =
        "INSERT INTO tontine_payout_order (cycle_id, user_id, position) VALUES (?, ?, ?)";
      db.run(sql, [cycleId, userId, position], function (err) {
        if (err) return reject(err);
        resolve({
          id: this.lastID,
          cycle_id: cycleId,
          user_id: userId,
          position,
          has_collected: false,
        });
      });
    });
  }

  /**
   * Bulk create payout orders
   */
  static bulkCreate(cycleId, userPositions) {
    return new Promise((resolve, reject) => {
      const placeholders = userPositions.map(() => "(?, ?, ?)").join(", ");
      const sql = `INSERT INTO tontine_payout_order (cycle_id, user_id, position) VALUES ${placeholders}`;
      const values = userPositions.flatMap((up) => [
        cycleId,
        up.userId,
        up.position,
      ]);

      db.run(sql, values, function (err) {
        if (err) return reject(err);
        resolve({ count: userPositions.length });
      });
    });
  }

  /**
   * Find payout order by cycle
   */
  static findByCycle(cycleId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT po.*, u.name, u.email
        FROM tontine_payout_order po
        JOIN users u ON po.user_id = u.id
        WHERE po.cycle_id = ?
        ORDER BY po.position ASC
      `;
      db.all(sql, [cycleId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  /**
   * Mark as collected
   */
  static markAsCollected(cycleId, userId) {
    return new Promise((resolve, reject) => {
      const sql =
        "UPDATE tontine_payout_order SET has_collected = 1, collected_at = CURRENT_TIMESTAMP WHERE cycle_id = ? AND user_id = ?";
      db.run(sql, [cycleId, userId], function (err) {
        if (err) return reject(err);
        resolve({ changes: this.changes });
      });
    });
  }
}

module.exports = TontinePayoutOrder;
