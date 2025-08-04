import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../database.sqlite');

export const db = new sqlite3.Database(dbPath);

export async function initializeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create optics table
      db.run(`
        CREATE TABLE IF NOT EXISTS optics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          address TEXT NOT NULL,
          phone TEXT NOT NULL,
          email TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          optic_id INTEGER NOT NULL,
          role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (optic_id) REFERENCES optics (id)
        )
      `);

      // Create products table
      db.run(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          optic_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          brand TEXT NOT NULL,
          model TEXT NOT NULL,
          color TEXT NOT NULL,
          size TEXT NOT NULL,
          price REAL NOT NULL,
          stock_quantity INTEGER DEFAULT 0,
          image_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (optic_id) REFERENCES optics (id)
        )
      `);

      // Create clients table
      db.run(`
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

      // Create sales table
      db.run(`
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

      // Create indexes for better performance
      db.run('CREATE INDEX IF NOT EXISTS idx_products_optic_id ON products(optic_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_clients_optic_id ON clients(optic_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_sales_optic_id ON sales(optic_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_users_optic_id ON users(optic_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_clients_dni ON clients(dni)');

      db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
}

export function closeDatabase(): void {
  db.close();
} 