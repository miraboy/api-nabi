const db = require("../utils/db");

class Tontine {
  /**
   * Create a new tontine
   */
  static create(name, amount, maxMembers, frequency, ownerId) {
    return new Promise((resolve, reject) => {
      const sql =
        "INSERT INTO tontines (name, amount, max_members, frequency, owner_id) VALUES (?, ?, ?, ?, ?)";
      db.run(
        sql,
        [name, amount, maxMembers, frequency, ownerId],
        function (err) {
          if (err) return reject(err);
          resolve({
            id: this.lastID,
            name,
            amount,
            max_members: maxMembers,
            frequency,
            owner_id: ownerId,
          });
        }
      );
    });
  }

  /**
   * Find tontine by ID
   */
  static findById(id) {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM tontines WHERE id = ?";
      db.get(sql, [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  /**
   * Get all tontines
   */
  static findAll(filters = {}) {
    return new Promise((resolve, reject) => {
      let sql = "SELECT * FROM tontines";
      const params = [];

      if (filters.status) {
        sql += " WHERE status = ?";
        params.push(filters.status);
      }

      db.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  /**
   * Get tontines by owner
   */
  static findByOwner(ownerId) {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM tontines WHERE owner_id = ?";
      db.all(sql, [ownerId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  /**
   * Update tontine
   */
  static update(id, data) {
    return new Promise((resolve, reject) => {
      const sql =
        "UPDATE tontines SET name = ?, amount = ?, max_members = ?, frequency = ?, status = ? WHERE id = ?";
      db.run(
        sql,
        [
          data.name,
          data.amount,
          data.max_members,
          data.frequency,
          data.status,
          id,
        ],
        function (err) {
          if (err) return reject(err);
          resolve({ changes: this.changes });
        }
      );
    });
  }

  /**
   * Update tontine status
   */
  static updateStatus(id, status) {
    return new Promise((resolve, reject) => {
      const sql = "UPDATE tontines SET status = ? WHERE id = ?";
      db.run(sql, [status, id], function (err) {
        if (err) return reject(err);
        resolve({ changes: this.changes });
      });
    });
  }

  /**
   * Delete tontine
   */
  static delete(id) {
    return new Promise((resolve, reject) => {
      const sql = "DELETE FROM tontines WHERE id = ?";
      db.run(sql, [id], function (err) {
        if (err) return reject(err);
        resolve({ changes: this.changes });
      });
    });
  }
}

module.exports = Tontine;
