const db = require('../src/utils/db');
const fs = require('fs');
const path = require('path');

// Set test environment variables
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '1h';

beforeAll(async () => {
  // Run migrations
  const migrationsPath = path.join(__dirname, '../src/config/migrations.sql');
  const migrations = fs.readFileSync(migrationsPath, 'utf8');
  
  const statements = migrations
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    await new Promise((resolve, reject) => {
      db.run(statement, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
});

afterAll(async () => {
  await new Promise((resolve) => {
    db.close((err) => {
      if (err) console.error(err);
      resolve();
    });
  });
});
