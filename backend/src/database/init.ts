import { Pool } from 'pg';

// Debug logging
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Fallback for debugging
const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:QczfCveNywkQQgsQhoDQsGSJpYGIesOA@postgres.railway.internal:5432/railway';
console.log('Using DATABASE_URL:', databaseUrl);

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export async function initializeDatabase(): Promise<void> {
  const client = await pool.connect();
  
  try {
    console.log('Connected to PostgreSQL successfully');
    
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        optic_id INTEGER NOT NULL REFERENCES optics(id),
        dni VARCHAR(50) NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        optic_id INTEGER NOT NULL REFERENCES optics(id),
        client_id INTEGER REFERENCES clients(id),
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        sale_date DATE NOT NULL,
        notes TEXT,
        unregistered_client_name VARCHAR(255),
        unregistered_product_name VARCHAR(255),
        od_esf VARCHAR(50),
        od_cil VARCHAR(50),
        od_eje VARCHAR(50),
        od_add VARCHAR(50),
        oi_esf VARCHAR(50),
        oi_cil VARCHAR(50),
        oi_eje VARCHAR(50),
        oi_add VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

export function closeDatabase(): void {
  pool.end();
} 