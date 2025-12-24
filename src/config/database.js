// Database configuration
// À adapter selon votre base de données (MongoDB, PostgreSQL, etc.)

module.exports = {
  development: {
    // Exemple pour MongoDB
    // url: process.env.DB_URL || 'mongodb://localhost:27017/api-nabi'
    // Exemple pour PostgreSQL
    // host: process.env.DB_HOST || 'localhost',
    // port: process.env.DB_PORT || 5432,
    // database: process.env.DB_NAME || 'api_nabi',
    // user: process.env.DB_USER || 'postgres',
    // password: process.env.DB_PASSWORD || ''
  },

  production: {
    // Configuration production
  },

  test: {
    // Configuration test
  },
};
