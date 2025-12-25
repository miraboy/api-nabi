const db = require("../utils/db");

class TontineMember {
  /**
   * Add member to tontine
   */
  static create(tontineId, userId) {
    return new Promise((resolve, reject) => {
      const sql =
        "INSERT INTO tontine_members (tontine_id, user_id) VALUES (?, ?)";
      db.run(sql, [tontineId, userId], function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, tontine_id: tontineId, user_id: userId });
      });
    });
  }

  /**
   * Get all members of a tontine
   */
  static findByTontine(tontineId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT tm.*, u.name, u.email 
        FROM tontine_members tm
        JOIN users u ON tm.user_id = u.id
        WHERE tm.tontine_id = ?
      `;
      db.all(sql, [tontineId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  /**
   * Get all tontines of a user
   */
  static findByUser(userId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT tm.*, t.name, t.amount, t.frequency, t.status 
        FROM tontine_members tm
        JOIN tontines t ON tm.tontine_id = t.id
        WHERE tm.user_id = ?
      `;
      db.all(sql, [userId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  /**
   * Check if user is member of tontine
   */
  static isMember(tontineId, userId) {
    return new Promise((resolve, reject) => {
      const sql =
        "SELECT id FROM tontine_members WHERE tontine_id = ? AND user_id = ?";
      db.get(sql, [tontineId, userId], (err, row) => {
        if (err) return reject(err);
        resolve(!!row);
      });
    });
  }

  /**
   * Count members in tontine
   */
  static countMembers(tontineId) {
    return new Promise((resolve, reject) => {
      const sql =
        "SELECT COUNT(*) as count FROM tontine_members WHERE tontine_id = ?";
      db.get(sql, [tontineId], (err, row) => {
        if (err) return reject(err);
        resolve(row.count);
      });
    });
  }

  /**
   * Remove member from tontine
   */
  static delete(tontineId, userId) {
    return new Promise((resolve, reject) => {
      const sql =
        "DELETE FROM tontine_members WHERE tontine_id = ? AND user_id = ?";
      db.run(sql, [tontineId, userId], function (err) {
        if (err) return reject(err);
        resolve({ changes: this.changes });
      });
    });
  }

  /**
   * Find member by tontine and user
   */
  static findByTontineAndUser(tontineId, userId) {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM tontine_members WHERE tontine_id = ? AND user_id = ?";
      db.get(sql, [tontineId, userId], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }
}

module.exports = TontineMember;
