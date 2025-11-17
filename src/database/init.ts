import { runQuery, getRow } from '../config/database';
import bcrypt from 'bcryptjs';
import { User } from '../types';

async function initializeDatabase() {
  try {
    // Tabla de ópticas
    await runQuery(`
      CREATE TABLE IF NOT EXISTS optics (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        email TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de usuarios (con relación a óptica)
    await runQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        optics_id INTEGER,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (optics_id) REFERENCES optics(id)
      )
    `);

    // Tabla de solicitudes de usuario
    await runQuery(`
      CREATE TABLE IF NOT EXISTS user_requests (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        optics_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP,
        reviewed_by INTEGER,
        FOREIGN KEY (reviewed_by) REFERENCES users(id)
      )
    `);

    // Tabla de clientes
    await runQuery(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        optics_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        document_id TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        birth_date TEXT,
        notes TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (optics_id) REFERENCES optics(id)
      )
    `);

    // Tabla de productos
    await runQuery(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        optics_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        price NUMERIC(10, 2) DEFAULT 0,
        quantity INTEGER DEFAULT 0,
        description TEXT,
        image_url TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (optics_id) REFERENCES optics(id)
      )
    `);

    // Tabla de ventas con ficha técnica de óptica
    await runQuery(`
      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        optics_id INTEGER NOT NULL,
        client_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- OD (Ojo Derecho) - 4 campos como especificado
        od_esf NUMERIC(10, 2),
        od_cil NUMERIC(10, 2),
        od_eje INTEGER,
        od_add NUMERIC(10, 2),
        
        -- OI (Ojo Izquierdo) - 4 campos como especificado
        oi_esf NUMERIC(10, 2),
        oi_cil NUMERIC(10, 2),
        oi_eje INTEGER,
        oi_add NUMERIC(10, 2),
        
        -- Notas
        notes TEXT,
        
        -- Total calculado
        total_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
        
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (optics_id) REFERENCES optics(id),
        FOREIGN KEY (client_id) REFERENCES clients(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Tabla intermedia: Ventas-Productos (relación muchos a muchos)
    // Permite múltiples productos por venta y precio modificado
    await runQuery(`
      CREATE TABLE IF NOT EXISTS sale_products (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price NUMERIC(10, 2) NOT NULL,
        total_price NUMERIC(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    // Tabla de logs de eliminación
    await runQuery(`
      CREATE TABLE IF NOT EXISTS deletion_logs (
        id SERIAL PRIMARY KEY,
        table_name TEXT NOT NULL,
        record_id INTEGER NOT NULL,
        deleted_by INTEGER,
        deleted_data TEXT,
        reason TEXT,
        deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (deleted_by) REFERENCES users(id)
      )
    `);

    // Tabla de configuración del dashboard
    await runQuery(`
      CREATE TABLE IF NOT EXISTS dashboard_config (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        optics_id INTEGER NOT NULL,
        sections_visible TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (optics_id) REFERENCES optics(id),
        UNIQUE(user_id, optics_id)
      )
    `);

    // Crear usuario admin por defecto (si no existe)
    const adminExists = await getRow<User>('SELECT id FROM users WHERE username = ?', ['admin']);

    if (!adminExists) {
      const defaultPassword = await bcrypt.hash('admin123', 10);
      
      await runQuery(`
        INSERT INTO users (username, email, password, role)
        VALUES (?, ?, ?, ?)
      `, ['admin', 'admin@opticapp.com', defaultPassword, 'admin']);

      console.log('Usuario admin creado:');
      console.log('Username: admin');
      console.log('Password: admin123');
      console.log('⚠️ IMPORTANTE: Cambia la contraseña del admin en producción');
    }

    console.log('Base de datos PostgreSQL inicializada correctamente');
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}` || require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Inicialización completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { initializeDatabase };
