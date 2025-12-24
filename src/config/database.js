const path = require('path');

// SQLite configuration
module.exports = {
  development: {
    filename: path.resolve(process.env.DB_PATH || './database.sqlite'),
    driver: 'sqlite3'
  },

  production: {
    filename: path.resolve(process.env.DB_PATH || './database.sqlite'),
    driver: 'sqlite3'
  },

  test: {
    filename: ':memory:',
    driver: 'sqlite3'
  },
};

