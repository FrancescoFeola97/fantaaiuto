import pkg from 'pg';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PostgreSQL connection configuration
const connectionConfig = {
  host: 'db.aeclnikdyepiqjymmicw.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Deployfantaiuto97!!',
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  family: 4, // Force IPv4
};

let pool;

export async function initializeDatabase() {
  try {
    console.log('Using Supabase PostgreSQL connection...');

    console.log('🔄 Initializing PostgreSQL database...');
    
    // Create connection pool
    pool = new Pool(connectionConfig);
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    
    // Load and execute schema
    const schemaPath = path.join(__dirname, 'schema-postgres.sql');
    const schemaSQL = await fs.readFile(schemaPath, 'utf8');
    
    await client.query(schemaSQL);
    console.log('✅ Database schema initialized');
    
    client.release();
    
    return pool;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

export function getDatabase() {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return {
    // Wrapper methods to match SQLite API
    async get(sql, params = []) {
      const client = await pool.connect();
      try {
        const result = await client.query(sql, params);
        return result.rows[0] || null;
      } finally {
        client.release();
      }
    },
    
    async all(sql, params = []) {
      const client = await pool.connect();
      try {
        const result = await client.query(sql, params);
        return result.rows;
      } finally {
        client.release();
      }
    },
    
    async run(sql, params = []) {
      const client = await pool.connect();
      try {
        const result = await client.query(sql, params);
        return {
          lastID: result.rows[0]?.id,
          changes: result.rowCount
        };
      } finally {
        client.release();
      }
    }
  };
}

export async function closeDatabase() {
  if (pool) {
    await pool.end();
    console.log('✅ Database connection pool closed');
  }
}

// Handle graceful shutdown
process.on('SIGINT', closeDatabase);
process.on('SIGTERM', closeDatabase);