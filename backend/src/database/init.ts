import { Pool } from 'pg';
import sqlite3 from 'sqlite3';
import { connectionString } from '../config/database';

// Debug logging
console.log('DATABASE_URL from env:', process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Using connection string:', connectionString);

const isDevelopment = process.env.NODE_ENV !== 'production';

let pool: Pool | null = null;
let sqliteDb: sqlite3.Database | null = null;

if (isDevelopment) {
  // Use SQLite for development
  sqliteDb = new sqlite3.Database('./database.sqlite');
  console.log('Using SQLite database for development');
} else {
  // Use PostgreSQL for production
  pool = new Pool({
    connectionString: connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
}

export { pool, sqliteDb };

export async function initializeDatabase(): Promise<void> {
  if (isDevelopment && sqliteDb) {
    // Initialize SQLite database
    console.log('Initializing SQLite database...');
    
    return new Promise((resolve, reject) => {
      sqliteDb!.serialize(() => {
        // Create tables
        sqliteDb!.run(`
          CREATE TABLE IF NOT EXISTS optics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            address TEXT,
            phone TEXT,
            email TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        sqliteDb!.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            optic_id INTEGER NOT NULL,
            role TEXT DEFAULT 'user',
            is_approved BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (optic_id) REFERENCES optics (id)
          )
        `);

        sqliteDb!.run(`
          CREATE TABLE IF NOT EXISTS registration_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            optic_id INTEGER NOT NULL,
            status TEXT DEFAULT 'pending',
            admin_notes TEXT,
            reviewed_by INTEGER,
            reviewed_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (optic_id) REFERENCES optics (id),
            FOREIGN KEY (reviewed_by) REFERENCES users (id)
          )
        `);

        sqliteDb!.run(`
          CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            optic_id INTEGER NOT NULL,
            dni TEXT NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (optic_id) REFERENCES optics (id),
            UNIQUE(optic_id, dni)
          )
        `);

        sqliteDb!.run(`
          CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            optic_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            brand TEXT,
            model TEXT,
            color TEXT,
            size TEXT,
            price REAL DEFAULT 0,
            stock_quantity INTEGER DEFAULT 0,
            image_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (optic_id) REFERENCES optics (id)
          )
        `);

        sqliteDb!.run(`
          CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            optic_id INTEGER NOT NULL,
            client_id INTEGER,
            product_id INTEGER,
            quantity INTEGER NOT NULL,
            total_price REAL NOT NULL,
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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (optic_id) REFERENCES optics (id),
            FOREIGN KEY (client_id) REFERENCES clients (id),
            FOREIGN KEY (product_id) REFERENCES products (id)
          )
        `);

        console.log('SQLite database tables created successfully');
        resolve();
      });
    });
  } else if (pool) {
    // Initialize PostgreSQL database
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
          is_approved BOOLEAN DEFAULT false,
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
}

export function closeDatabase(): void {
  if (pool) {
    pool.end();
  }
  if (sqliteDb) {
    sqliteDb.close();
  }
} 