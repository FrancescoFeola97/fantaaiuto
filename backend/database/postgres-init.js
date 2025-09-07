import pkg from 'pg';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set DNS to prefer IPv4 globally
dns.setDefaultResultOrder('ipv4first');

// PostgreSQL connection configuration using Supabase Session Pooler (IPv4-optimized)
const connectionConfig = {
  connectionString: 'postgresql://postgres.aeclnikdyepiqjymmicw:Deployfantaiuto97!!@aws-1-eu-central-2.pooler.supabase.com:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 25000,
};

let pool;

export async function initializeDatabase() {
  try {
    console.log('Using Supabase PostgreSQL Session Pooler (IPv4-optimized)...');
    console.log('🔧 DNS order set to:', dns.getDefaultResultOrder());
    console.log('🔧 Using Session Pooler connection string');
    console.log('🔧 Connection config:', {
      pooler: 'aws-1-eu-central-2.pooler.supabase.com',
      ssl: !!connectionConfig.ssl,
      max: connectionConfig.max,
      timeout: connectionConfig.connectionTimeoutMillis
    });

    console.log('🔄 Initializing PostgreSQL database...');
    
    // Create connection pool
    pool = new Pool(connectionConfig);
    
    // Test connection with timeout
    console.log('🔗 Attempting database connection...');
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    
    // Load and execute schema
    const schemaPath = path.join(__dirname, 'schema-postgres.sql');
    const schemaSQL = await fs.readFile(schemaPath, 'utf8');
    
    await client.query(schemaSQL);
    console.log('✅ Database schema initialized');
    
    // Load and execute demo data
    try {
      const seedPath = path.join(__dirname, 'seed-demo.sql');
      const seedSQL = await fs.readFile(seedPath, 'utf8');
      
      await client.query(seedSQL);
      console.log('✅ Demo data initialized');
    } catch (seedError) {
      console.log('⚠️ Demo data seeding skipped (file may not exist or already exists)');
    }
    
    client.release();
    
    return pool;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.error('Error details:', {
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      address: error.address,
      port: error.port
    });
    throw error;
  }
}

export function getDatabase() {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return {
    // Wrapper methods to match SQLite API with parameter conversion
    async get(sql, params = []) {
      const client = await pool.connect();
      try {
        // Convert SQLite ? parameters to PostgreSQL $1, $2, etc.
        const pgSql = this._convertParams(sql);
        const result = await client.query(pgSql, params);
        return result.rows[0] || null;
      } finally {
        client.release();
      }
    },
    
    async all(sql, params = []) {
      const client = await pool.connect();
      try {
        // Convert SQLite ? parameters to PostgreSQL $1, $2, etc.
        const pgSql = this._convertParams(sql);
        const result = await client.query(pgSql, params);
        return result.rows;
      } finally {
        client.release();
      }
    },
    
    async run(sql, params = []) {
      const client = await pool.connect();
      try {
        // Convert SQLite ? parameters to PostgreSQL $1, $2, etc.
        let pgSql = this._convertParams(sql);
        
        // For INSERT statements, add RETURNING id if not present
        if (pgSql.toUpperCase().includes('INSERT INTO') && !pgSql.toUpperCase().includes('RETURNING')) {
          pgSql = pgSql + ' RETURNING id';
        }
        
        const result = await client.query(pgSql, params);
        return {
          lastID: result.rows[0]?.id,
          changes: result.rowCount
        };
      } finally {
        client.release();
      }
    },
    
    // Convert SQLite ? parameters to PostgreSQL $1, $2, etc.
    _convertParams(sql) {
      let paramIndex = 1;
      return sql.replace(/\?/g, () => `$${paramIndex++}`);
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