import sqlite3 from 'sqlite3';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'fantaaiuto.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Promisify database operations
function runQuery(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function getAllRows(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function getOneRow(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

class Database {
  constructor() {
    this.db = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      // Ensure database directory exists
      const dbDir = path.dirname(DATABASE_PATH);
      fs.mkdir(dbDir, { recursive: true }).then(() => {
        
        this.db = new sqlite3.Database(DATABASE_PATH, (err) => {
          if (err) {
            console.error('❌ Error connecting to database:', err);
            reject(err);
          } else {
            console.log('🔗 Connected to SQLite database');
            // Enable foreign keys
            this.db.run('PRAGMA foreign_keys = ON');
            resolve();
          }
        });
      }).catch(reject);
    });
  }

  async initSchema() {
    try {
      const schema = await fs.readFile(SCHEMA_PATH, 'utf8');
      const statements = schema
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      for (const statement of statements) {
        await runQuery(this.db, statement);
      }
      
      console.log('✅ Database schema initialized');
    } catch (error) {
      console.error('❌ Error initializing schema:', error);
      throw error;
    }
  }

  async seedDefaultData() {
    try {
      // Check if we need to seed default data
      const userCount = await getOneRow(this.db, 'SELECT COUNT(*) as count FROM users');
      
      if (userCount.count === 0) {
        console.log('🌱 Seeding default data...');
        
        // Create default admin user (for testing)
        await runQuery(this.db, `
          INSERT INTO users (username, email, password_hash, display_name, is_active)
          VALUES (?, ?, ?, ?, ?)
        `, [
          'admin',
          'admin@fantaaiuto.local',
          '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: "password"
          'Administrator',
          true
        ]);

        // Get the admin user ID
        const adminUser = await getOneRow(this.db, 'SELECT id FROM users WHERE username = ?', ['admin']);
        
        // Create default settings for admin user
        await runQuery(this.db, `
          INSERT INTO user_settings (user_id, total_budget, max_players, roles_config)
          VALUES (?, ?, ?, ?)
        `, [
          adminUser.id,
          500,
          30,
          JSON.stringify({
            Por: 3, Ds: 2, Dd: 2, Dc: 2, B: 2, E: 2, M: 2, C: 2, W: 2, T: 2, A: 2, Pc: 2
          })
        ]);

        console.log('✅ Default data seeded');
        console.log('🔐 Default admin user: admin / password');
      }
    } catch (error) {
      console.error('❌ Error seeding default data:', error);
      throw error;
    }
  }

  // Database operation methods
  async run(sql, params = []) {
    return runQuery(this.db, sql, params);
  }

  async get(sql, params = []) {
    return getOneRow(this.db, sql, params);
  }

  async all(sql, params = []) {
    return getAllRows(this.db, sql, params);
  }

  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

// Singleton database instance
const database = new Database();

export async function initDatabase() {
  await database.connect();
  await database.initSchema();
  await database.seedDefaultData();
  return database;
}

export function getDatabase() {
  return database;
}

export { Database };