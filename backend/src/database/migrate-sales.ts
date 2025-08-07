import { executeQuery } from './query';

async function migrateSalesStructure() {
  try {
    console.log('🔄 Starting sales structure migration...');
    
    // Crear tabla de items de venta
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        product_id INTEGER,
        unregistered_product_name TEXT,
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
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      )
    `);
    
    // Agregar columnas de graduación a la tabla sales (para compatibilidad)
    await executeQuery(`
      ALTER TABLE sales ADD COLUMN od_esf DECIMAL(4,2)
    `).catch(() => console.log('Column od_esf already exists'));
    
    await executeQuery(`
      ALTER TABLE sales ADD COLUMN od_cil DECIMAL(4,2)
    `).catch(() => console.log('Column od_cil already exists'));
    
    await executeQuery(`
      ALTER TABLE sales ADD COLUMN od_eje INTEGER
    `).catch(() => console.log('Column od_eje already exists'));
    
    await executeQuery(`
      ALTER TABLE sales ADD COLUMN od_add DECIMAL(4,2)
    `).catch(() => console.log('Column od_add already exists'));
    
    await executeQuery(`
      ALTER TABLE sales ADD COLUMN oi_esf DECIMAL(4,2)
    `).catch(() => console.log('Column oi_esf already exists'));
    
    await executeQuery(`
      ALTER TABLE sales ADD COLUMN oi_cil DECIMAL(4,2)
    `).catch(() => console.log('Column oi_cil already exists'));
    
    await executeQuery(`
      ALTER TABLE sales ADD COLUMN oi_eje INTEGER
    `).catch(() => console.log('Column oi_eje already exists'));
    
    await executeQuery(`
      ALTER TABLE sales ADD COLUMN oi_add DECIMAL(4,2)
    `).catch(() => console.log('Column oi_add already exists'));
    
    // Migrar ventas existentes a la nueva estructura
    const existingSales = await executeQuery('SELECT * FROM sales');
    
    for (const sale of existingSales.rows) {
      // Crear item de venta para cada venta existente
      await executeQuery(`
        INSERT INTO sale_items (
          sale_id, product_id, unregistered_product_name, quantity, 
          unit_price, total_price, od_esf, od_cil, od_eje, od_add,
          oi_esf, oi_cil, oi_eje, oi_add, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        sale.id,
        sale.product_id,
        sale.unregistered_product_name,
        sale.quantity || 1,
        sale.total_price || 0,
        sale.total_price || 0,
        sale.od_esf,
        sale.od_cil,
        sale.od_eje,
        sale.od_add,
        sale.oi_esf,
        sale.oi_cil,
        sale.oi_eje,
        sale.oi_add,
        sale.notes
      ]);
    }
    
    console.log('✅ Sales structure migration completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
  migrateSalesStructure();
}

export { migrateSalesStructure };
