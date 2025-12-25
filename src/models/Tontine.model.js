const db = require("../utils/db");

class Tontine {
  /**
   * Create a new tontine
   */
  static create(
    name,
    amount,
    minMembers,
    frequency,
    ownerId,
    pickupPolicy = "arrival"
  ) {
    return new Promise((resolve, reject) => {
      const sql =
        "INSERT INTO tontines (name, amount, min_members, frequency, pickup_policy, owner_id) VALUES (?, ?, ?, ?, ?, ?)";
      db.run(
        sql,
        [name, amount, minMembers, frequency, pickupPolicy, ownerId],
        function (err) {
          if (err) return reject(err);
          resolve({
            id: this.lastID,
            name,
            amount,
            min_members: minMembers,
            frequency,
            pickup_policy: pickupPolicy,
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
   * Get all tontines with pagination
   */
  static findAll(filters = {}, pagination = null) {
    return new Promise((resolve, reject) => {
      let sql = "SELECT * FROM tontines";
      const params = [];

      if (filters.status) {
        sql += " WHERE status = ?";
        params.push(filters.status);
      }

      sql += " ORDER BY created_at DESC";

      if (pagination) {
        sql += " LIMIT ? OFFSET ?";
        params.push(pagination.limit, pagination.offset);
      }

      db.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  /**
   * Count all tontines
   */
  static count(filters = {}) {
    return new Promise((resolve, reject) => {
      let sql = "SELECT COUNT(*) as total FROM tontines";
      const params = [];

      if (filters.status) {
        sql += " WHERE status = ?";
        params.push(filters.status);
      }

      db.get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row.total);
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
        "UPDATE tontines SET name = ?, amount = ?, min_members = ?, frequency = ?, pickup_policy = ? WHERE id = ?";
      db.run(
        sql,
        [
          data.name,
          data.amount,
          data.min_members,
          data.frequency,
          data.pickup_policy,
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
   * Delete tontine with cascade (members and payments)
   */
  static delete(id) {
    return new Promise((resolve, reject) => {
      // Delete in order: payments -> members -> tontine
      db.serialize(() => {
        db.run("DELETE FROM payments WHERE tontine_id = ?", [id], (err) => {
          if (err) return reject(err);
        });
        db.run(
          "DELETE FROM tontine_members WHERE tontine_id = ?",
          [id],
          (err) => {
            if (err) return reject(err);
          }
        );
        db.run("DELETE FROM tontines WHERE id = ?", [id], function (err) {
          if (err) return reject(err);
          resolve({ changes: this.changes });
        });
      });
    });
  }
}

module.exports = Tontine;
