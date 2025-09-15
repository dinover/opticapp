import { Pool } from 'pg';
import { connectionString } from '../config/database';

// Debug logging
console.log('DATABASE_URL from env:', process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Using connection string:', connectionString);

// Use PostgreSQL for both development and production
const pool = new Pool({
  connectionString: connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export { pool };

export async function initializeDatabase(): Promise<void> {
  if (!pool) {
    throw new Error('Database pool not initialized');
  }
  
  let client;
  let retries = 3;
  
  while (retries > 0) {
    try {
      console.log(`Attempting to connect to database (${retries} retries left)...`);
      client = await pool.connect();
      console.log('Connected to PostgreSQL successfully');
      break;
    } catch (error) {
      retries--;
      console.error(`Database connection attempt failed (${retries} retries left):`, error);
      
      if (retries === 0) {
        throw new Error(`Failed to connect to database after 3 attempts: ${error}`);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  try {
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS optics (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        phone VARCHAR(50),
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        optic_id INTEGER NOT NULL REFERENCES optics(id),
        role VARCHAR(50) DEFAULT 'user',
        is_approved BOOLEAN DEFAULT false,
        reset_token VARCHAR(255),
        reset_token_expiry TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS registration_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        optic_id INTEGER NOT NULL REFERENCES optics(id),
        status VARCHAR(50) DEFAULT 'pending',
        admin_notes TEXT,
        reviewed_by INTEGER REFERENCES users(id),
        reviewed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        optic_id INTEGER NOT NULL REFERENCES optics(id),
        dni VARCHAR(50),
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP,
        UNIQUE(optic_id, dni)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        optic_id INTEGER NOT NULL REFERENCES optics(id),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        brand VARCHAR(255),
        model VARCHAR(255),
        color VARCHAR(100),
        size VARCHAR(100),
        price DECIMAL(10,2) DEFAULT 0,
        stock_quantity INTEGER DEFAULT 0,
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        optic_id INTEGER NOT NULL REFERENCES optics(id),
        client_id INTEGER REFERENCES clients(id),
        unregistered_client_name VARCHAR(255),
        total_amount DECIMAL(10,2) NOT NULL,
        sale_date DATE DEFAULT CURRENT_DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        unregistered_product_name VARCHAR(255),
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        od_esf DECIMAL(4,2),
        od_cil DECIMAL(4,2),
        od_eje INTEGER,
        od_add DECIMAL(4,2),
        oi_esf DECIMAL(4,2),
        oi_cil DECIMAL(4,2),
        oi_eje INTEGER,
        oi_add DECIMAL(4,2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      )
    `);

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}

export function closeDatabase(): void {
  if (pool) {
    pool.end();
  }
} 