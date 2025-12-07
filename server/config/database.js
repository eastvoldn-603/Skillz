const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Database file path
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../skillz.db');

// Create database directory if it doesn't exist
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create database connection
const db = new Database(DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
const initDatabase = () => {
  try {
    // Users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Resumes table
    db.exec(`
      CREATE TABLE IF NOT EXISTS resumes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Jobs table
    db.exec(`
      CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        description TEXT,
        location TEXT,
        salary TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Job applications table
    db.exec(`
      CREATE TABLE IF NOT EXISTS job_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        job_id INTEGER NOT NULL,
        resume_id INTEGER,
        status TEXT DEFAULT 'pending',
        notes TEXT,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
        FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE SET NULL
      )
    `);

    // Job offers table
    db.exec(`
      CREATE TABLE IF NOT EXISTS job_offers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        application_id INTEGER NOT NULL,
        offer_details TEXT,
        salary TEXT,
        start_date DATE,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (application_id) REFERENCES job_applications(id) ON DELETE CASCADE
      )
    `);

    // Password reset tokens table
    db.exec(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create trigger to update updated_at timestamp
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
      AFTER UPDATE ON users
      BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `);

    db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_resumes_timestamp 
      AFTER UPDATE ON resumes
      BEGIN
        UPDATE resumes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `);

    db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_job_applications_timestamp 
      AFTER UPDATE ON job_applications
      BEGIN
        UPDATE job_applications SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `);

    db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_job_offers_timestamp 
      AFTER UPDATE ON job_offers
      BEGIN
        UPDATE job_offers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `);

    console.log('SQLite database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Connect and initialize
const connect = (callback) => {
  try {
    initDatabase();
    console.log('SQLite database connected successfully');
    if (callback) callback(null);
  } catch (error) {
    console.error('Database connection failed:', error);
    if (callback) callback(error);
  }
};

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  console.log('SQLite database connection closed');
  process.exit(0);
});

module.exports = {
  db,
  connect
};
