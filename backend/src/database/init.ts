import { Pool } from 'pg';

// PostgreSQL connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export async function initializeDatabase(): Promise<void> {
  const client = await pool.connect();
  
  try {
    // Create optics table
    await client.query(`
      CREATE TABLE IF NOT EXISTS optics (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        optic_id INTEGER NOT NULL,
        role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (optic_id) REFERENCES optics (id)
      )
    `);

    // Create products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        optic_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        brand TEXT NOT NULL,
        model TEXT NOT NULL,
        color TEXT NOT NULL,
        size TEXT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        stock_quantity INTEGER DEFAULT 0,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (optic_id) REFERENCES optics (id)
      )
    `);

    // Create clients table
    await client.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        optic_id INTEGER NOT NULL,
        dni TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (optic_id) REFERENCES optics (id),
        UNIQUE(optic_id, dni)
      )
    `);

    // Create sales table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        optic_id INTEGER NOT NULL,
        client_id INTEGER,
        product_id INTEGER,
        quantity INTEGER NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        sale_date DATE NOT NULL,
        notes TEXT,
        unregistered_client_name TEXT,
        unregistered_product_name TEXT,
        od_esf TEXT,
        od_cil TEXT,
        od_eje TEXT,
        od_add TEXT,
        oi_esf TEXT,
        oi_cil TEXT,
        oi_eje TEXT,
        oi_add TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (optic_id) REFERENCES optics (id),
        FOREIGN KEY (client_id) REFERENCES clients (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
      )
    `);

    // Create indexes for better performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_products_optic_id ON products(optic_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_clients_optic_id ON clients(optic_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_sales_optic_id ON sales(optic_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_optic_id ON users(optic_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_clients_dni ON clients(dni)');

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating database tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

export function closeDatabase(): void {
  pool.end();
} 